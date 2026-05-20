import { readFile } from "node:fs/promises";
import path from "node:path";

import { mockSchemaSchema, type MockSchema } from "./types.js";

export async function loadSchema(schemaPath: string): Promise<MockSchema> {
  const absolutePath = path.resolve(schemaPath);
  const rawContent = await readFile(absolutePath, "utf-8");
  const parsedJson: unknown = JSON.parse(rawContent);
  return mockSchemaSchema.parse(parsedJson);
}
