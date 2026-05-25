import type { Hono } from "hono";

import { resolveRouteSeedKey } from "../../generator/seed.js";
import type { MockEndpoint } from "../../schema/types.js";
import type { EntityStore } from "../../store/entityStore.js";
import {
  buildCreatePayload,
  buildDetailPayloadFromStore,
  buildPatchPayload,
} from "../buildDetailPayload.js";
import { API_ERROR_MESSAGE, respondWithApiError } from "../errors.js";
import { parseJsonBody } from "../parseJsonBody.js";
import { resolvePathParamValue } from "../pathParams.js";
import type { RegisteredRoute } from "../types.js";

export function registerPostHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.post(fullPath, async (context) => {
    const storeConfig = endpoint.store;

    if (!storeConfig || endpoint.response.kind !== "object") {
      return respondWithApiError(context, API_ERROR_MESSAGE.INVALID_POST_CONFIG, 500);
    }

    const body = await parseJsonBody(context);

    if (!body) {
      return respondWithApiError(context, API_ERROR_MESSAGE.BODY_MUST_BE_OBJECT, 400);
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

export function registerPatchHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.patch(fullPath, async (context) => {
    const storeConfig = endpoint.store;
    const seedKey = resolveRouteSeedKey(fullPath, context.req.param());

    if (!storeConfig || endpoint.response.kind !== "object") {
      return respondWithApiError(context, API_ERROR_MESSAGE.INVALID_PATCH_CONFIG, 500);
    }

    const entityId = resolvePathParamValue(
      endpoint.path,
      context.req.param(),
      storeConfig.idField,
    );

    if (!entityId) {
      return respondWithApiError(context, API_ERROR_MESSAGE.RESOURCE_ID_REQUIRED, 400);
    }

    const body = await parseJsonBody(context);

    if (!body) {
      return respondWithApiError(context, API_ERROR_MESSAGE.BODY_MUST_BE_OBJECT, 400);
    }

    const patchPayload = buildPatchPayload(body, storeConfig.idField);
    const updatedItem = store.update(
      storeConfig.entity,
      entityId,
      patchPayload,
      storeConfig.idField,
    );

    if (!updatedItem) {
      return respondWithApiError(context, API_ERROR_MESSAGE.RESOURCE_NOT_FOUND, 404);
    }

    return context.json(
      buildDetailPayloadFromStore(updatedItem, endpoint.response.fields, seedKey),
    );
  });

  routes.push({ method: "PATCH", path: fullPath });
}

export function registerDeleteHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  routes: RegisteredRoute[],
): void {
  app.delete(fullPath, async (context) => {
    const storeConfig = endpoint.store;

    if (!storeConfig) {
      return respondWithApiError(context, API_ERROR_MESSAGE.INVALID_DELETE_CONFIG, 500);
    }

    const entityId = resolvePathParamValue(
      endpoint.path,
      context.req.param(),
      storeConfig.idField,
    );

    if (!entityId) {
      return respondWithApiError(context, API_ERROR_MESSAGE.RESOURCE_ID_REQUIRED, 400);
    }

    const isDeleted = store.delete(storeConfig.entity, entityId);

    if (!isDeleted) {
      return respondWithApiError(context, API_ERROR_MESSAGE.RESOURCE_NOT_FOUND, 404);
    }

    return context.json({
      [storeConfig.idField]: entityId,
      deleted: true,
    });
  });

  routes.push({ method: "DELETE", path: fullPath });
}
