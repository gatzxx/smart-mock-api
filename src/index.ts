import { serve } from "@hono/node-server";

import { loadConfig } from "./config.js";
import { loadSchema } from "./schema/loader.js";
import { createMockServer } from "./server/createServer.js";
import { printStartupBanner } from "./server/printRoutes.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const schema = await loadSchema(config.schemaPath);
  const { app, routes } = createMockServer(
    schema,
    config.responseDelayMs,
    config.corsOrigin,
  );

  printStartupBanner({
    port: config.port,
    schemaPath: config.schemaPath,
    responseDelayMs: config.responseDelayMs,
    routes,
  });

  serve({
    fetch: app.fetch,
    port: config.port,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[smart-mock-api] Failed to start: ${message}`);
  process.exit(1);
});
