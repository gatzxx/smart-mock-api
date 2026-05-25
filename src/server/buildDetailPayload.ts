import { generateFields } from "../generator/dataGenerator.js";
import { runWithSeedKey } from "../generator/seedContext.js";
import type { FieldMap } from "../schema/types.js";

export function buildDetailPayloadFromStore(
  storedItem: Record<string, unknown>,
  fields: FieldMap,
  seedKey: string,
): Record<string, unknown> {
  return runWithSeedKey(seedKey, () => ({
    ...generateFields(fields),
    ...storedItem,
  }));
}

export function buildCreatePayload(
  responseFields: FieldMap,
  body: Record<string, unknown>,
  idField: string,
): Record<string, unknown> {
  const generatedPayload = generateFields(responseFields);

  return {
    ...generatedPayload,
    ...body,
    [idField]: generatedPayload[idField],
  };
}

export function buildPatchPayload(
  body: Record<string, unknown>,
  idField: string,
): Record<string, unknown> {
  const patchPayload = { ...body };
  delete patchPayload[idField];
  return patchPayload;
}
