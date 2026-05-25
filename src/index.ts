import { serve } from "@hono/node-server";

import { loadConfig } from "./config.js";
import { startSchemaWatcher } from "./runtime/reloadSchema.js";
import { createSchemaRuntime } from "./runtime/schemaRuntime.js";
import { printStartupBanner } from "./server/printRoutes.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const runtime = await createSchemaRuntime(config);
  const initialState = runtime.getState();

  printStartupBanner({
    port: config.port,
    schemaPath: config.schemaPath,
    responseDelayMs: config.responseDelayMs,
    routes: initialState.routes,
  });

  if (config.schemaHotReload) {
    startSchemaWatcher(config.schemaPath, runtime);
    console.log("  Hot-reload: enabled (edit schema.json without restart)");
    console.log("");
  }

  serve({
    fetch: runtime.fetch,
    port: config.port,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[smart-mock-api] Failed to start: ${message}`);
  process.exit(1);
});
