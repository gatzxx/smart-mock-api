import type { FieldMap, MockEndpoint, MockSchema } from "../schema/types.js";
import { mapFakerTypeToOpenApi, type OpenApiJsonSchema } from "./fakerTypeMap.js";
import { extractOpenApiPathParams, toOpenApiPath } from "./pathTemplate.js";

export const OPENAPI_PATH = "/openapi.json";

type OpenApiReference = {
  $ref: string;
};

type OpenApiMediaType = {
  schema: OpenApiJsonSchema | OpenApiReference;
};

type OpenApiResponse = {
  description: string;
  content?: Record<string, OpenApiMediaType>;
};

type OpenApiOperation = {
  operationId: string;
  summary: string;
  parameters?: Array<{
    name: string;
    in: "path";
    required: true;
    schema: OpenApiJsonSchema;
  }>;
  requestBody?: {
    required: boolean;
    content: Record<string, OpenApiMediaType>;
  };
  responses: Record<string, OpenApiResponse>;
};

type OpenApiPathItem = Partial<
  Record<Lowercase<MockEndpoint["method"]>, OpenApiOperation>
>;

export type OpenApiDocument = {
  openapi: "3.1.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: Record<string, OpenApiPathItem>;
  components: {
    schemas: Record<string, OpenApiJsonSchema>;
  };
};

function fieldMapToObjectSchema(
  fields: FieldMap,
  options: { requiredFields: boolean },
): OpenApiJsonSchema {
  const properties = Object.fromEntries(
    Object.entries(fields).map(([fieldName, fieldType]) => [
      fieldName,
      mapFakerTypeToOpenApi(fieldType),
    ]),
  );

  const schema: OpenApiJsonSchema = {
    type: "object",
    properties,
  };

  if (options.requiredFields) {
    schema.required = Object.keys(fields);
  }

  return schema;
}

function registerComponentSchema(
  components: Record<string, OpenApiJsonSchema>,
  schemaName: string,
  schema: OpenApiJsonSchema,
): OpenApiReference {
  components[schemaName] = schema;
  return { $ref: `#/components/schemas/${schemaName}` };
}

function getResourceSegment(path: string): string {
  const segment = path
    .split("/")
    .filter(Boolean)
    .find((value) => !value.startsWith(":"));

  return segment ?? "resource";
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getPluralResourceName(path: string): string {
  return toPascalCase(getResourceSegment(path));
}

function getSingularResourceName(path: string): string {
  const pluralName = getPluralResourceName(path);

  if (pluralName.endsWith("ies")) {
    return `${pluralName.slice(0, -3)}y`;
  }

  if (pluralName.endsWith("s")) {
    return pluralName.slice(0, -1);
  }

  return pluralName;
}

function buildOperationId(method: MockEndpoint["method"], path: string): string {
  const singularName = getSingularResourceName(path);
  const pluralName = getPluralResourceName(path);

  if (method === "GET") {
    return path.includes(":") ? `get${singularName}` : `list${pluralName}`;
  }

  if (method === "POST") {
    return `create${singularName}`;
  }

  if (method === "PATCH") {
    return `update${singularName}`;
  }

  return `delete${singularName}`;
}

function buildSummary(method: MockEndpoint["method"], path: string): string {
  const resourceSegment = getResourceSegment(path);

  switch (method) {
    case "GET":
      return path.includes(":")
        ? `Get ${resourceSegment} by id`
        : `List ${resourceSegment}`;
    case "POST":
      return `Create ${resourceSegment}`;
    case "PATCH":
      return `Update ${resourceSegment}`;
    case "DELETE":
      return `Delete ${resourceSegment}`;
    default:
      return `${method} ${resourceSegment}`;
  }
}

function buildPathParameters(path: string): OpenApiOperation["parameters"] {
  return extractOpenApiPathParams(path).map((paramName) => ({
    name: paramName,
    in: "path" as const,
    required: true as const,
    schema: { type: "string" },
  }));
}

function buildResponseSchemaRef(
  endpoint: MockEndpoint,
  components: Record<string, OpenApiJsonSchema>,
): OpenApiReference {
  const pluralName = getPluralResourceName(endpoint.path);
  const singularName = getSingularResourceName(endpoint.path);

  if (endpoint.response.kind === "collection") {
    const itemSchemaName = `${pluralName}ListItem`;
    registerComponentSchema(
      components,
      itemSchemaName,
      fieldMapToObjectSchema(endpoint.response.item, { requiredFields: true }),
    );

    registerComponentSchema(components, `${pluralName}ListResponse`, {
      type: "array",
      items: { $ref: `#/components/schemas/${itemSchemaName}` },
    });

    return { $ref: `#/components/schemas/${pluralName}ListResponse` };
  }

  const objectSchemaName =
    endpoint.method === "DELETE"
      ? `${singularName}DeleteResponse`
      : `${singularName}Response`;

  return registerComponentSchema(
    components,
    objectSchemaName,
    fieldMapToObjectSchema(endpoint.response.fields, { requiredFields: true }),
  );
}

function buildSuccessStatus(method: MockEndpoint["method"]): string {
  if (method === "POST") {
    return "201";
  }

  return "200";
}

function buildOperation(
  endpoint: MockEndpoint,
  components: Record<string, OpenApiJsonSchema>,
): OpenApiOperation {
  const responseSchemaRef = buildResponseSchemaRef(endpoint, components);
  const pathParameters = buildPathParameters(endpoint.path);
  const operation: OpenApiOperation = {
    operationId: buildOperationId(endpoint.method, endpoint.path),
    summary: buildSummary(endpoint.method, endpoint.path),
    responses: {
      [buildSuccessStatus(endpoint.method)]: {
        description: "Successful response",
        content: {
          "application/json": {
            schema: responseSchemaRef,
          },
        },
      },
    },
  };

  if (pathParameters && pathParameters.length > 0) {
    operation.parameters = pathParameters;
  }

  if (endpoint.request && (endpoint.method === "POST" || endpoint.method === "PATCH")) {
    const requestSchemaName =
      endpoint.method === "POST"
        ? `${getSingularResourceName(endpoint.path)}CreateRequest`
        : `${getSingularResourceName(endpoint.path)}UpdateRequest`;

    operation.requestBody = {
      required: endpoint.method === "POST",
      content: {
        "application/json": {
          schema: registerComponentSchema(
            components,
            requestSchemaName,
            fieldMapToObjectSchema(endpoint.request, {
              requiredFields: endpoint.method === "POST",
            }),
          ),
        },
      },
    };
  }

  return operation;
}

export function computeSchemaVersion(schema: MockSchema): number {
  const serializedSchema = JSON.stringify(schema);
  let hash = 0;

  for (let index = 0; index < serializedSchema.length; index += 1) {
    hash = (hash << 5) - hash + serializedSchema.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function buildOpenApiSpec(schema: MockSchema): OpenApiDocument {
  const paths: Record<string, OpenApiPathItem> = {};
  const components: Record<string, OpenApiJsonSchema> = {};

  for (const endpoint of schema.endpoints) {
    const openApiPath = toOpenApiPath(schema.basePath, endpoint.path);
    const method = endpoint.method.toLowerCase() as Lowercase<MockEndpoint["method"]>;
    const pathItem = paths[openApiPath] ?? {};
    pathItem[method] = buildOperation(endpoint, components);
    paths[openApiPath] = pathItem;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Smart Mock API",
      version: "1.0.0",
      description: "OpenAPI specification generated from schema.json",
    },
    paths,
    components: {
      schemas: components,
    },
  };
}
