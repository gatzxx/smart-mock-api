import type { Hono } from "hono";

import type { AppConfig } from "../config.js";
import { computeSchemaVersion } from "../openapi/buildOpenApiSpec.js";
import { loadSchema } from "../schema/loader.js";
import type { MockSchema } from "../schema/types.js";
import { createMockServer } from "../server/createServer.js";
import type { RegisteredRoute } from "../server/types.js";

export type SchemaRuntimeState = {
  schema: MockSchema;
  app: Hono;
  routes: RegisteredRoute[];
  schemaVersion: number;
  reloadCount: number;
  loadedAt: string;
};

export type SchemaRuntime = {
  getState: () => SchemaRuntimeState;
  fetch: (request: Request, env?: unknown) => Response | Promise<Response>;
  reload: () => Promise<SchemaRuntimeState>;
};

type BuildRuntimeOptions = Pick<
  AppConfig,
  "schemaPath" | "responseDelayMs" | "corsOrigin"
>;

async function buildRuntimeState(
  options: BuildRuntimeOptions,
  reloadCount: number,
): Promise<SchemaRuntimeState> {
  const schema = await loadSchema(options.schemaPath);
  const { app, routes } = createMockServer(
    schema,
    options.responseDelayMs,
    options.corsOrigin,
  );

  return {
    schema,
    app,
    routes,
    schemaVersion: computeSchemaVersion(schema),
    reloadCount,
    loadedAt: new Date().toISOString(),
  };
}

export async function createSchemaRuntime(config: AppConfig): Promise<SchemaRuntime> {
  let state = await buildRuntimeState(config, 0);

  return {
    getState: () => state,
    fetch: (request, env) => state.app.fetch(request, env),
    reload: async () => {
      const nextReloadCount = state.reloadCount + 1;
      state = await buildRuntimeState(config, nextReloadCount);
      return state;
    },
  };
}
