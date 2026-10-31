import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, before, beforeEach, describe, it } from "node:test";

import { createApp } from "../src/app.js";
import { fireRoutine, fireText } from "../src/routine.js";

const env = {
  ROUTINE_ID: "trig_123",
  ROUTINE_TOKEN: "sk-ant-oat01-test",
  FIREFLIES_WEBHOOK_SECRET: "ff-secret",
  GENERIC_WEBHOOK_SECRET: "generic-secret",
};
const quietLog = { info() {}, error() {} };
const sign = (body, secret) => createHmac("sha256", secret).update(body).digest("hex");

let server;
let baseUrl;
let fired;
let fireFails;

before(async () => {
  const fire = async (call, options) => {
    if (fireFails) throw new Error("boom");
    fired.push({ call, options });
    return { claude_code_session_url: `https://claude.ai/code/session_${fired.length}` };
  };
  server = createApp({ env, fire, log: quietLog });
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => {
  fired = [];
  fireFails = false;
});

function post(path, payload, headers = {}) {
  return fetch(`${baseUrl}${path}`, { method: "POST", body: payload, headers });
}

function postFireflies(payload, secret = env.FIREFLIES_WEBHOOK_SECRET) {
  const body = JSON.stringify(payload);
  return post("/webhook/fireflies", body, { "x-hub-signature": sign(body, secret) });
}

describe("Fireflies webhook", () => {
  it("starts the routine with the meeting id and link when a transcript is ready", async () => {
    const response = await postFireflies({ meetingId: "m1", eventType: "Transcription completed" });

    assert.equal(response.status, 202);
    assert.equal((await response.json()).session, "https://claude.ai/code/session_1");
    assert.deepEqual(fired[0].call, { source: "fireflies", id: "m1", url: "https://app.fireflies.ai/view/m1" });
    assert.equal(fired[0].options.routineId, "trig_123");
  });

  it("refuses a request signed with the wrong secret", async () => {
    const response = await postFireflies({ meetingId: "m2", eventType: "Transcription completed" }, "wrong");

    assert.equal(response.status, 401);
    assert.equal(fired.length, 0);
  });

  it("refuses an unsigned request", async () => {
    const response = await post("/webhook/fireflies", JSON.stringify({ meetingId: "m3" }));

    assert.equal(response.status, 401);
  });

  it("ignores events other than a finished transcript", async () => {
    const response = await postFireflies({ meetingId: "m4", eventType: "Meeting started" });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ignored: true });
    assert.equal(fired.length, 0);
  });

  it("starts the routine only once when the same meeting is delivered twice", async () => {
    await postFireflies({ meetingId: "m5", eventType: "Transcription completed" });
    const repeat = await postFireflies({ meetingId: "m5", eventType: "Transcription completed" });

    assert.deepEqual(await repeat.json(), { duplicate: true });
    assert.equal(fired.length, 1);
  });

  it("answers 502 so the tool retries when the routine cannot be started", async () => {
    fireFails = true;
    const response = await postFireflies({ meetingId: "m6", eventType: "Transcription completed" });

    assert.equal(response.status, 502);
  });

  it("starts the routine on a retry after a failed attempt", async () => {
    fireFails = true;
    await postFireflies({ meetingId: "m7", eventType: "Transcription completed" });
    fireFails = false;
    const retry = await postFireflies({ meetingId: "m7", eventType: "Transcription completed" });

    assert.equal(retry.status, 202);
  });
});

describe("generic webhook", () => {
  it("passes a pasted transcript through to the routine", async () => {
    const body = JSON.stringify({ source: "granola", title: "Acme check-in", transcript: "Ana: we export by hand" });
    const response = await post("/webhook/generic", body, { "x-signature": `sha256=${sign(body, env.GENERIC_WEBHOOK_SECRET)}` });

    assert.equal(response.status, 202);
    assert.equal(fired[0].call.transcript, "Ana: we export by hand");
  });
});

describe("routing", () => {
  it("answers health checks", async () => {
    const response = await fetch(`${baseUrl}/healthz`);

    assert.equal(response.status, 200);
  });

  it("answers 404 for an unknown call tool", async () => {
    const response = await post("/webhook/unknown", "{}");

    assert.equal(response.status, 404);
  });

  it("answers 404 for a route named after an object property", async () => {
    const response = await post("/webhook/constructor", "{}");

    assert.equal(response.status, 404);
  });
});

describe("routine call", () => {
  it("sends the call as text with the routine token", async () => {
    let request;
    const fetchImpl = async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ claude_code_session_url: "u" }), { status: 200 });
    };

    await fireRoutine({ source: "fireflies", id: "m1" }, { routineId: "trig_1", token: "tok", fetchImpl });

    assert.equal(request.url, "https://api.anthropic.com/v1/claude_code/routines/trig_1/fire");
    assert.equal(request.init.headers.authorization, "Bearer tok");
    assert.deepEqual(JSON.parse(request.init.body), { text: "source=fireflies id=m1" });
  });

  it("reports the status when the routine refuses the call", async () => {
    const fetchImpl = async () => new Response("rate limited", { status: 429 });

    await assert.rejects(
      fireRoutine({ source: "fireflies", id: "m1" }, { routineId: "t", token: "x", fetchImpl }),
      /429 rate limited/,
    );
  });

  it("caps the text at the routine's 65,536-character limit", () => {
    assert.equal(fireText({ source: "x", transcript: "a".repeat(70_000) }).length, 65_536);
  });
});
