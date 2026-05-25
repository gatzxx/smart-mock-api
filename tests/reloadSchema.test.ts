import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadSchema } from "../src/schema/loader.js";
import { createSchemaRuntime } from "../src/runtime/schemaRuntime.js";

describe("schema hot-reload", () => {
  it("reloads routes when schema file changes", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "smart-mock-reload-"));
    const schemaPath = path.join(tempDir, "schema.json");
    const baseSchema = await loadSchema(path.join(process.cwd(), "schema.json"));

    const healthEndpoint = baseSchema.endpoints.find(
      (endpoint) => endpoint.path === "/health",
    );

    if (!healthEndpoint) {
      throw new Error("Expected /health endpoint in schema.json");
    }

    const usersListEndpoint = baseSchema.endpoints.find(
      (endpoint) => endpoint.path === "/users" && endpoint.method === "GET",
    );

    if (!usersListEndpoint) {
      throw new Error("Expected GET /users endpoint in schema.json");
    }

    const minimalSchema = {
      basePath: baseSchema.basePath,
      endpoints: [healthEndpoint],
    };

    await writeFile(schemaPath, JSON.stringify(minimalSchema, null, 2), "utf-8");

    const runtime = await createSchemaRuntime({
      port: 3000,
      schemaPath,
      responseDelayMs: 0,
      corsOrigin: "*",
      schemaHotReload: false,
    });

    const initialVersion = runtime.getState().schemaVersion;
    const initialRoutePaths = runtime.getState().routes.map((route) => route.path);

    expect(initialRoutePaths).toContain("/api/health");
    expect(initialRoutePaths).not.toContain("/api/users");

    const expandedSchema = {
      ...minimalSchema,
      endpoints: [...minimalSchema.endpoints, usersListEndpoint],
    };

    await writeFile(schemaPath, JSON.stringify(expandedSchema, null, 2), "utf-8");

    const nextState = await runtime.reload();
    const nextRoutePaths = nextState.routes.map((route) => route.path);

    expect(nextState.schemaVersion).not.toBe(initialVersion);
    expect(nextState.reloadCount).toBe(1);
    expect(nextRoutePaths).toContain("/api/users");

    const usersResponse = await runtime.fetch(
      new Request("http://localhost/api/users"),
    );
    expect(usersResponse.status).toBe(200);
  });

  it("resets in-memory store on reload", async () => {
    const runtime = await createSchemaRuntime({
      port: 3000,
      schemaPath: path.join(process.cwd(), "schema.json"),
      responseDelayMs: 0,
      corsOrigin: "*",
      schemaHotReload: false,
    });

    const createResponse = await runtime.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Reload Reset User",
          email: "reload-reset@example.com",
          role: "Engineer",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);

    const listBeforeResponse = await runtime.fetch(
      new Request("http://localhost/api/users"),
    );
    const usersBefore = (await listBeforeResponse.json()) as Array<{ email: string }>;

    expect(usersBefore.some((user) => user.email === "reload-reset@example.com")).toBe(
      true,
    );

    await runtime.reload();

    const listAfterResponse = await runtime.fetch(
      new Request("http://localhost/api/users"),
    );
    const usersAfter = (await listAfterResponse.json()) as Array<{ email: string }>;

    expect(usersAfter.some((user) => user.email === "reload-reset@example.com")).toBe(
      false,
    );
  });

  it("removes routes when schema shrinks on reload", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "smart-mock-reload-shrink-"));
    const schemaPath = path.join(tempDir, "schema.json");
    const baseSchema = await loadSchema(path.join(process.cwd(), "schema.json"));

    const healthEndpoint = baseSchema.endpoints.find(
      (endpoint) => endpoint.path === "/health",
    );

    if (!healthEndpoint) {
      throw new Error("Expected /health endpoint in schema.json");
    }

    await writeFile(schemaPath, JSON.stringify(baseSchema, null, 2), "utf-8");

    const runtime = await createSchemaRuntime({
      port: 3000,
      schemaPath,
      responseDelayMs: 0,
      corsOrigin: "*",
      schemaHotReload: false,
    });

    const initialRoutePaths = runtime.getState().routes.map((route) => route.path);

    expect(initialRoutePaths).toContain("/api/users");
    expect(initialRoutePaths).toContain("/api/products");

    const minimalSchema = {
      basePath: baseSchema.basePath,
      endpoints: [healthEndpoint],
    };

    await writeFile(schemaPath, JSON.stringify(minimalSchema, null, 2), "utf-8");

    const nextState = await runtime.reload();
    const nextRoutePaths = nextState.routes.map((route) => route.path);

    expect(nextRoutePaths).toContain("/api/health");
    expect(nextRoutePaths).not.toContain("/api/users");
    expect(nextRoutePaths).not.toContain("/api/products");

    const usersResponse = await runtime.fetch(
      new Request("http://localhost/api/users"),
    );
    const productsResponse = await runtime.fetch(
      new Request("http://localhost/api/products"),
    );

    expect(usersResponse.status).toBe(404);
    expect(productsResponse.status).toBe(404);
  });
});
