import { faker } from "@faker-js/faker";

import type { FieldMap, MockResponse } from "../schema/types.js";
import { getGenerator } from "./fakerRegistry.js";
import { hashSeedKey } from "./seed.js";

export function generateFields(fields: FieldMap): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    result[fieldName] = getGenerator(fieldType)();
  }

  return result;
}

export function generateResponse(response: MockResponse, seedKey?: string): unknown {
  if (seedKey) {
    faker.seed(hashSeedKey(seedKey));
  }

  if (response.kind === "object") {
    return generateFields(response.fields);
  }

  return Array.from({ length: response.count }, () => generateFields(response.item));
}
