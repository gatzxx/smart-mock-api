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

const endpointSchema = z.object({
  path: z
    .string()
    .min(1)
    .refine((value) => value.startsWith("/"), "path must start with /"),
  response: responseSchema,
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
