import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { generateResponse } from "../generator/dataGenerator.js";
import { createDelayMiddleware } from "../middleware/delay.js";
import type { MockEndpoint, MockSchema } from "../schema/types.js";

export type RegisteredRoute = {
  method: "GET";
  path: string;
};

function joinPaths(basePath: string, endpointPath: string): string {
  if (basePath === "/") {
    return endpointPath;
  }

  return `${basePath}${endpointPath}`;
}

export function createMockServer(
  schema: MockSchema,
  responseDelayMs: number,
  corsOrigin: string,
): { app: Hono; routes: RegisteredRoute[] } {
  const app = new Hono();
  const routes: RegisteredRoute[] = [];

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
      responseDelayMs,
    });
  });

  for (const endpoint of schema.endpoints) {
    registerEndpoint(app, schema.basePath, endpoint, routes);
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

  return { app, routes };
}

function registerEndpoint(
  app: Hono,
  basePath: string,
  endpoint: MockEndpoint,
  routes: RegisteredRoute[],
): void {
  const fullPath = joinPaths(basePath, endpoint.path);

  app.get(fullPath, (context) => {
    const payload = generateResponse(endpoint.response);
    return context.json(payload);
  });

  routes.push({ method: "GET", path: fullPath });
}
