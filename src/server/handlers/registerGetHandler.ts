import type { Hono } from "hono";

import { generateResponse } from "../../generator/dataGenerator.js";
import { resolveRouteSeedKey } from "../../generator/seed.js";
import type { MockEndpoint } from "../../schema/types.js";
import { bootstrapEntityFromCollection } from "../../store/bootstrapStore.js";
import type { EntityStore } from "../../store/entityStore.js";
import { buildDetailPayloadFromStore } from "../buildDetailPayload.js";
import { API_ERROR_MESSAGE, respondWithApiError } from "../errors.js";
import { resolvePathParamValue } from "../pathParams.js";
import type { RegisteredRoute } from "../types.js";

type CollectionByEntity = Map<
  string,
  Extract<MockEndpoint["response"], { kind: "collection" }>
>;

export function registerGetHandler(
  app: Hono,
  fullPath: string,
  endpoint: MockEndpoint,
  store: EntityStore,
  collectionByEntity: CollectionByEntity,
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
          return context.json(
            buildDetailPayloadFromStore(storedItem, endpoint.response.fields, seedKey),
          );
        }

        if (store.isInitialized(endpoint.store.entity)) {
          return respondWithApiError(
            context,
            API_ERROR_MESSAGE.RESOURCE_NOT_FOUND,
            404,
          );
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
