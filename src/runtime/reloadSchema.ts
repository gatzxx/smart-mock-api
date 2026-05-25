import { watch } from "node:fs";

import type { SchemaRuntime } from "./schemaRuntime.js";

const DEFAULT_DEBOUNCE_MS = 300;

export function startSchemaWatcher(
  schemaPath: string,
  runtime: SchemaRuntime,
  debounceMs = DEFAULT_DEBOUNCE_MS,
): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isReloading = false;

  const performReload = async (): Promise<void> => {
    if (isReloading) {
      scheduleReload();
      return;
    }

    isReloading = true;

    try {
      const previousVersion = runtime.getState().schemaVersion;
      const nextState = await runtime.reload();

      console.log("");
      console.log("  [smart-mock-api] Schema reloaded");
      console.log(`  schemaVersion: ${previousVersion} -> ${nextState.schemaVersion}`);
      console.log(`  routes: ${nextState.routes.length} endpoint(s), store reset`);
      console.log(`  loadedAt: ${nextState.loadedAt}`);
      console.log("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[smart-mock-api] Schema reload failed: ${message}`);
    } finally {
      isReloading = false;
    }
  };

  const scheduleReload = (): void => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void performReload();
    }, debounceMs);
  };

  const watcher = watch(schemaPath, { persistent: true }, scheduleReload);

  watcher.on("error", (error) => {
    console.error(`[smart-mock-api] Schema watcher error: ${error.message}`);
  });

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    watcher.close();
  };
}
