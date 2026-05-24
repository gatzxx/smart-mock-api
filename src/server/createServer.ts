import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createDelayMiddleware } from "../middleware/delay.js";
import type { MockSchema } from "../schema/types.js";
import { EntityStore } from "../store/entityStore.js";
import { indexCollectionEndpoints, registerEndpoint } from "./registerEndpoint.js";
import type { RegisteredRoute } from "./types.js";

export type { HttpMethod, RegisteredRoute } from "./types.js";

export function createMockServer(
  schema: MockSchema,
  responseDelayMs: number,
  corsOrigin: string,
): { app: Hono; routes: RegisteredRoute[]; store: EntityStore } {
  const app = new Hono();
  const routes: RegisteredRoute[] = [];
  const store = new EntityStore();
  const collectionByEntity = indexCollectionEndpoints(schema.endpoints);

  app.use(
    "*",
    cors({
      origin: (requestOrigin) => {
        const allowedOrigins = corsOrigin
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        if (allowedOrigins.includes("*")) {
          return requestOrigin;
        }

        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
          return requestOrigin;
        }

        return allowedOrigins[0];
      },
    }),
  );
  app.use("*", logger());
  app.use("*", createDelayMiddleware(responseDelayMs));

  app.get("/__meta", (context) => {
    return context.json({
      basePath: schema.basePath,
      endpoints: routes.map((route) => route.path),
      routes: routes.map((route) => ({
        method: route.method,
        path: route.path,
      })),
      responseDelayMs,
    });
  });

  for (const endpoint of schema.endpoints) {
    registerEndpoint({
      app,
      basePath: schema.basePath,
      endpoint,
      routes,
      store,
      collectionByEntity,
    });
  }

  app.notFound((context) => {
    return context.json(
      {
        error: "Not Found",
        hint: "Check GET /__meta for available mock endpoints.",
      },
      404,
    );
  });

  return { app, routes, store };
}
