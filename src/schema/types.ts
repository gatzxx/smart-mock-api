import { z } from "zod";

const fieldMapSchema = z.record(z.string(), z.string());

const objectResponseSchema = z.object({
  kind: z.literal("object"),
  fields: fieldMapSchema,
});

const collectionResponseSchema = z.object({
  kind: z.literal("collection"),
  count: z.number().int().positive().max(100),
  item: fieldMapSchema,
});

const responseSchema = z.discriminatedUnion("kind", [
  objectResponseSchema,
  collectionResponseSchema,
]);

const storeConfigSchema = z.object({
  entity: z.string().min(1),
  idField: z.string().min(1).default("id"),
});

const httpMethodSchema = z.enum(["GET", "POST", "PATCH", "DELETE"]);

const endpointSchema = z
  .object({
    path: z
      .string()
      .min(1)
      .refine((value) => value.startsWith("/"), "path must start with /"),
    method: httpMethodSchema.default("GET"),
    response: responseSchema,
    request: fieldMapSchema.optional(),
    store: storeConfigSchema.optional(),
  })
  .superRefine((endpoint, context) => {
    if (
      (endpoint.method === "POST" ||
        endpoint.method === "PATCH" ||
        endpoint.method === "DELETE") &&
      !endpoint.store
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Endpoint ${endpoint.method} ${endpoint.path} requires store configuration.`,
      });
    }

    if (endpoint.method === "POST" && endpoint.response.kind !== "object") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `POST ${endpoint.path} must use object response.`,
      });
    }
  });

export const mockSchemaSchema = z.object({
  basePath: z
    .string()
    .default("/")
    .transform((value) => {
      const normalized =
        value.endsWith("/") && value.length > 1 ? value.slice(0, -1) : value;
      return normalized === "" ? "/" : normalized;
    }),
  endpoints: z.array(endpointSchema).min(1),
});

export type MockSchema = z.infer<typeof mockSchemaSchema>;
export type MockEndpoint = z.infer<typeof endpointSchema>;
export type MockResponse = z.infer<typeof responseSchema>;
export type FieldMap = z.infer<typeof fieldMapSchema>;
export type StoreConfig = z.infer<typeof storeConfigSchema>;
export type HttpMethod = z.infer<typeof httpMethodSchema>;
