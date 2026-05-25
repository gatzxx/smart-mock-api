type OpenApiSchemaRef = {
  $ref: string;
};

export type OpenApiJsonSchema = {
  type?: "string" | "number" | "integer" | "boolean" | "object" | "array";
  format?: string;
  enum?: string[];
  properties?: Record<string, OpenApiJsonSchema | OpenApiSchemaRef>;
  required?: string[];
  items?: OpenApiJsonSchema | OpenApiSchemaRef;
};

const EXACT_FAKER_TYPE_MAP: Record<string, OpenApiJsonSchema> = {
  uuid: { type: "string", format: "uuid" },
  "internet.email": { type: "string", format: "email" },
  "commerce.price": { type: "number" },
  "number.int": { type: "integer" },
  "date.iso": { type: "string", format: "date-time" },
  "date.recent": { type: "string", format: "date-time" },
  "datatype.boolean": { type: "boolean" },
  "literal.ok": { type: "string", enum: ["ok"] },
  "runtime.uptime": { type: "integer" },
};

const PREFIX_FAKER_TYPE_MAP: Array<{
  prefix: string;
  schema: OpenApiJsonSchema;
}> = [{ prefix: "date.", schema: { type: "string", format: "date-time" } }];

export function mapFakerTypeToOpenApi(fieldType: string): OpenApiJsonSchema {
  const exactMatch = EXACT_FAKER_TYPE_MAP[fieldType];

  if (exactMatch) {
    return { ...exactMatch };
  }

  for (const prefixRule of PREFIX_FAKER_TYPE_MAP) {
    if (fieldType.startsWith(prefixRule.prefix)) {
      return { ...prefixRule.schema };
    }
  }

  return { type: "string" };
}
