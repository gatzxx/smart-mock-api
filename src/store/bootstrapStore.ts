import { generateResponse } from "../generator/dataGenerator.js";
import type { MockResponse, StoreConfig } from "../schema/types.js";
import type { EntityStore } from "./entityStore.js";

export function bootstrapEntityFromCollection(
  store: EntityStore,
  storeConfig: StoreConfig,
  collectionResponse: Extract<MockResponse, { kind: "collection" }>,
  seedKey: string,
): void {
  if (store.has(storeConfig.entity)) {
    return;
  }

  const generatedItems = generateResponse(collectionResponse, seedKey);

  if (!Array.isArray(generatedItems)) {
    return;
  }

  store.seed(
    storeConfig.entity,
    storeConfig.idField,
    generatedItems as Record<string, unknown>[],
  );
}
