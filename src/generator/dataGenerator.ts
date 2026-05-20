import type { FieldMap, MockResponse } from "../schema/types.js";
import { getGenerator } from "./fakerRegistry.js";

export function generateFields(fields: FieldMap): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    result[fieldName] = getGenerator(fieldType)();
  }

  return result;
}

export function generateResponse(response: MockResponse): unknown {
  if (response.kind === "object") {
    return generateFields(response.fields);
  }

  return Array.from({ length: response.count }, () => generateFields(response.item));
}
