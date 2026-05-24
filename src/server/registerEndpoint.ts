import type { Context, Hono } from "hono";

import { generateFields, generateResponse } from "../generator/dataGenerator.js";
import { resolveRouteSeedKey } from "../generator/seed.js";
import type { FieldMap, MockEndpoint } from "../schema/types.js";
import { bootstrapEntityFromCollection } from "../store/bootstrapStore.js";
import type { EntityStore } from "../store/entityStore.js";
import { resolvePathParamValue } from "./pathParams.js";
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

async function parseJsonBody(
  context: Context,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await context.req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildObjectPayload(fields: FieldMap): Record<string, unknown> {
  return generateFields(fields);
}

function buildCreatePayload(
  responseFields: FieldMap,
  body: Record<string, unknown>,
  idField: string,
): Record<string, unknown> {
  const generatedPayload = buildObjectPayload(responseFields);

  return {
    ...generatedPayload,
    ...body,
    [idField]: generatedPayload[idField],
  };
}

function buildPatchPayload(
  body: Record<string, unknown>,
  idField: string,
): Record<string, unknown> {
  const patchPayload = { ...body };
  delete patchPayload[idField];
  return patchPayload;
}

function registerGetHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  collectionByEntity: Map<
    string,
    Extract<MockEndpoint["response"], { kind: "collection" }>
  >,
  routes: RegisteredRoute[],
): void {
  app.get(fullPath, (context) => {
    const seedKey = resolveRouteSeedKey(fullPath, context.req.param());

    if (endpoint.store && endpoint.response.kind === "collection") {
      bootstrapEntityFromCollection(store, endpoint.store, endpoint.response, seedKey);
      return context.json(store.list(endpoint.store.entity));
    }

    if (endpoint.store && endpoint.response.kind === "object") {
      const entityId = resolvePathParamValue(
        endpoint.path,
        context.req.param(),
        endpoint.store.idField,
      );

      if (entityId) {
        const storedItem = store.get(endpoint.store.entity, entityId);

        if (storedItem) {
          return context.json(storedItem);
        }

        if (store.isInitialized(endpoint.store.entity)) {
          return context.json({ error: "Resource not found." }, 404);
        }
      }
    }

    if (endpoint.store?.entity) {
      const collectionResponse = collectionByEntity.get(endpoint.store.entity);

      if (collectionResponse) {
        bootstrapEntityFromCollection(
          store,
          endpoint.store,
          collectionResponse,
          `/api/${endpoint.store.entity}`,
        );
      }
    }

    const payload = generateResponse(endpoint.response, seedKey);
    return context.json(payload);
  });

  routes.push({ method: "GET", path: fullPath });
}

function registerPostHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.post(fullPath, async (context) => {
    const storeConfig = endpoint.store;

    if (!storeConfig || endpoint.response.kind !== "object") {
      return context.json({ error: "Invalid POST endpoint configuration." }, 500);
    }

    const body = await parseJsonBody(context);

    if (!body) {
      return context.json({ error: "Request body must be a JSON object." }, 400);
    }

    const payload = buildCreatePayload(
      endpoint.response.fields,
      body,
      storeConfig.idField,
    );
    const createdItem = store.create(storeConfig.entity, storeConfig.idField, payload);

    return context.json(createdItem, 201);
  });

  routes.push({ method: "POST", path: fullPath });
}

function registerPatchHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.patch(fullPath, async (context) => {
    const storeConfig = endpoint.store;

    if (!storeConfig || endpoint.response.kind !== "object") {
      return context.json({ error: "Invalid PATCH endpoint configuration." }, 500);
    }

    const entityId = resolvePathParamValue(
      endpoint.path,
      context.req.param(),
      storeConfig.idField,
    );

    if (!entityId) {
      return context.json({ error: "Resource id is required." }, 400);
    }

    const body = await parseJsonBody(context);

    if (!body) {
      return context.json({ error: "Request body must be a JSON object." }, 400);
    }

    const patchPayload = buildPatchPayload(body, storeConfig.idField);
    const updatedItem = store.update(
      storeConfig.entity,
      entityId,
      patchPayload,
      storeConfig.idField,
    );

    if (!updatedItem) {
      return context.json({ error: "Resource not found." }, 404);
    }

    return context.json(updatedItem);
  });

  routes.push({ method: "PATCH", path: fullPath });
}

function registerDeleteHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.delete(fullPath, async (context) => {
    const storeConfig = endpoint.store;

    if (!storeConfig) {
      return context.json({ error: "Invalid DELETE endpoint configuration." }, 500);
    }

    const entityId = resolvePathParamValue(
      endpoint.path,
      context.req.param(),
      storeConfig.idField,
    );

    if (!entityId) {
      return context.json({ error: "Resource id is required." }, 400);
    }

    const isDeleted = store.delete(storeConfig.entity, entityId);

    if (!isDeleted) {
      return context.json({ error: "Resource not found." }, 404);
    }

    return context.json({
      [storeConfig.idField]: entityId,
      deleted: true,
    });
  });

  routes.push({ method: "DELETE", path: fullPath });
}

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
