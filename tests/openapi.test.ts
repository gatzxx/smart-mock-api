import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildOpenApiSpec,
  computeSchemaVersion,
  OPENAPI_PATH,
} from "../src/openapi/buildOpenApiSpec.js";
import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

describe("OpenAPI export", () => {
  it("builds OpenAPI 3.1 document from schema", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const spec = buildOpenApiSpec(schema);

    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths["/api/users"]?.get).toBeDefined();
    expect(spec.paths["/api/users"]?.post).toBeDefined();
    expect(spec.paths["/api/users/{id}"]?.patch).toBeDefined();
    expect(spec.paths["/api/users/{id}"]?.delete).toBeDefined();
    expect(spec.paths["/api/products"]?.post).toBeDefined();
    expect(spec.paths["/api/health"]?.get).toBeDefined();
    expect(spec.components.schemas.UsersListItem).toBeDefined();
    expect(spec.components.schemas.UserCreateRequest).toBeDefined();
  });

  it("exposes GET /openapi.json from server", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const response = await app.request(OPENAPI_PATH);
    const payload = (await response.json()) as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(payload.openapi).toBe("3.1.0");
    expect(payload.paths["/api/users"]).toBeDefined();
  });

  it("adds openapiPath and schemaVersion to meta response", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const response = await app.request("/__meta");
    const payload = (await response.json()) as {
      openapiPath: string;
      schemaVersion: number;
    };

    expect(response.status).toBe(200);
    expect(payload.openapiPath).toBe(OPENAPI_PATH);
    expect(payload.schemaVersion).toBe(computeSchemaVersion(schema));
  });
});
