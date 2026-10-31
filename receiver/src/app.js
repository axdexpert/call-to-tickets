import { createServer } from "node:http";

import { fireRoutine } from "./routine.js";
import { signatureMatches, sources } from "./sources.js";

const MAX_BODY_BYTES = 1_000_000;
const RECENT_CALLS_KEPT = 500;

class BodyTooLarge extends Error {}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new BodyTooLarge();
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createApp({ env = process.env, fire = fireRoutine, log = console } = {}) {
  // Tools redeliver webhooks; skipping a repeat here saves a routine run (30 per hour per routine).
  // The routine's own duplicate check still covers restarts and multiple instances.
  const recentCalls = new Set();

  return createServer(async (request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };

    if (request.method === "GET" && request.url === "/healthz") return send(200, { ok: true });

    const route = request.method === "POST" && request.url.match(/^\/webhook\/([a-z0-9-]+)$/);
    const source = route && Object.hasOwn(sources, route[1]) ? sources[route[1]] : null;
    if (!source) return send(404, { error: "not found" });

    let raw;
    try {
      raw = await readBody(request);
    } catch (error) {
      if (error instanceof BodyTooLarge) return send(413, { error: "body too large" });
      throw error;
    }

    if (!signatureMatches(raw, env[source.secretEnv], request.headers[source.signatureHeader])) {
      return send(401, { error: "invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return send(400, { error: "invalid JSON" });
    }

    const call = source.toCall(payload);
    if (!call) return send(200, { ignored: true });

    const key = call.id ? `${call.source}:${call.id}` : null;
    if (key && recentCalls.has(key)) return send(200, { duplicate: true });

    try {
      const fired = await fire(call, {
        routineId: env.ROUTINE_ID,
        token: env.ROUTINE_TOKEN,
        apiVersion: env.ROUTINE_API_VERSION || undefined,
      });
      if (key) {
        recentCalls.add(key);
        if (recentCalls.size > RECENT_CALLS_KEPT) recentCalls.delete(recentCalls.values().next().value);
      }
      log.info(`Started routine for ${key ?? call.source}: ${fired.claude_code_session_url}`);
      return send(202, { session: fired.claude_code_session_url });
    } catch (error) {
      // A non-2xx makes the tool retry; whatever is still missed, the daily sweep picks up.
      log.error(`Could not start routine for ${key ?? call.source}: ${error.message}`);
      return send(502, { error: "could not start routine" });
    }
  });
}
