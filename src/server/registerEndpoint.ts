import type { Hono } from "hono";

import type { MockEndpoint } from "../schema/types.js";
import type { EntityStore } from "../store/entityStore.js";
import { registerGetHandler } from "./handlers/registerGetHandler.js";
import {
  registerDeleteHandler,
  registerPatchHandler,
  registerPostHandler,
} from "./handlers/registerMutationHandlers.js";
import type { RegisteredRoute } from "./types.js";

type RegisterEndpointOptions = {
  app: Hono;
  basePath: string;
  endpoint: MockEndpoint;
  routes: RegisteredRoute[];
  store: EntityStore;
  collectionByEntity: Map<
    string,
    Extract<MockEndpoint["response"], { kind: "collection" }>
  >;
};

export function indexCollectionEndpoints(
  endpoints: MockEndpoint[],
): Map<string, Extract<MockEndpoint["response"], { kind: "collection" }>> {
  const collectionByEntity = new Map<
    string,
    Extract<MockEndpoint["response"], { kind: "collection" }>
  >();

  for (const endpoint of endpoints) {
    if (
      endpoint.method === "GET" &&
      endpoint.response.kind === "collection" &&
      endpoint.store
    ) {
      collectionByEntity.set(endpoint.store.entity, endpoint.response);
    }
  }

  return collectionByEntity;
}

export function registerEndpoint(options: RegisterEndpointOptions): void {
  const { app, basePath, endpoint, routes, store, collectionByEntity } = options;
  const fullPath = joinPaths(basePath, endpoint.path);
  const method = endpoint.method ?? "GET";

  switch (method) {
    case "GET":
      registerGetHandler(app, fullPath, endpoint, store, collectionByEntity, routes);
      return;
    case "POST":
      registerPostHandler(app, fullPath, endpoint, store, routes);
      return;
    case "PATCH":
      registerPatchHandler(app, fullPath, endpoint, store, routes);
      return;
    case "DELETE":
      registerDeleteHandler(app, fullPath, endpoint, store, routes);
      return;
    default:
      throw new Error(`Unsupported HTTP method "${String(method)}".`);
  }
}

function joinPaths(basePath: string, endpointPath: string): string {
  if (basePath === "/") {
    return endpointPath;
  }

  return `${basePath}${endpointPath}`;
}
