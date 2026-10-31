import { createApp } from "./app.js";
import { sources } from "./sources.js";

const missing = ["ROUTINE_ID", "ROUTINE_TOKEN"].filter((name) => !process.env[name]);
const configuredSources = Object.keys(sources).filter((name) => process.env[sources[name].secretEnv]);
if (missing.length || !configuredSources.length) {
  console.error(
    `Missing settings: ${[...missing, ...(configuredSources.length ? [] : ["a webhook secret, e.g. FIREFLIES_WEBHOOK_SECRET"])].join(", ")}`,
  );
  process.exit(1);
}

const port = Number(process.env.PORT) || 8080;
createApp().listen(port, () => {
  console.info(`Listening on :${port} for ${configuredSources.map((name) => `/webhook/${name}`).join(", ")}`);
});
