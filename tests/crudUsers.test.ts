import path from "node:path";

import { describe, expect, it } from "vitest";

import { API_ERROR_MESSAGE } from "../src/server/errors.js";
import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

describe("users CRUD", () => {
  it("supports create, update, delete and list flow", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const createResponse = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Wave A User",
        email: "wave-a@example.com",
        role: "Engineer",
      }),
    });

    expect(createResponse.status).toBe(201);

    const createdUser = (await createResponse.json()) as {
      id: string;
      fullName: string;
      email: string;
    };

    expect(createdUser.fullName).toBe("Wave A User");
    expect(createdUser.email).toBe("wave-a@example.com");
    expect(createdUser.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const listResponse = await app.request("/api/users");
    const users = (await listResponse.json()) as Array<{ id: string }>;

    expect(listResponse.status).toBe(200);
    expect(users.some((user) => user.id === createdUser.id)).toBe(true);

    const patchResponse = await app.request(`/api/users/${createdUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Wave A Updated" }),
    });

    expect(patchResponse.status).toBe(200);

    const updatedUser = (await patchResponse.json()) as { fullName: string };
    expect(updatedUser.fullName).toBe("Wave A Updated");

    const deleteResponse = await app.request(`/api/users/${createdUser.id}`, {
      method: "DELETE",
    });

    expect(deleteResponse.status).toBe(200);

    const deletedPayload = (await deleteResponse.json()) as {
      id: string;
      deleted: boolean;
    };

    expect(deletedPayload.deleted).toBe(true);
    expect(deletedPayload.id).toBe(createdUser.id);

    const detailResponse = await app.request(`/api/users/${createdUser.id}`);
    expect(detailResponse.status).toBe(404);
  });

  it("returns 404 for patch and delete on missing user", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");
    const missingUserId = "00000000-0000-0000-0000-000000000000";

    const patchResponse = await app.request(`/api/users/${missingUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Missing" }),
    });

    const deleteResponse = await app.request(`/api/users/${missingUserId}`, {
      method: "DELETE",
    });

    expect(patchResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);

    expect((await patchResponse.json()) as { error: string }).toEqual({
      error: API_ERROR_MESSAGE.RESOURCE_NOT_FOUND,
    });
    expect((await deleteResponse.json()) as { error: string }).toEqual({
      error: API_ERROR_MESSAGE.RESOURCE_NOT_FOUND,
    });
  });

  it("registers users mutation routes", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { routes } = createMockServer(schema, 0, "*");

    expect(routes).toContainEqual({ method: "POST", path: "/api/users" });
    expect(routes).toContainEqual({
      method: "PATCH",
      path: "/api/users/:id",
    });
    expect(routes).toContainEqual({
      method: "DELETE",
      path: "/api/users/:id",
    });
  });

  it("enriches stored user detail with avatar and bio fields", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const createResponse = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Detail Enrichment User",
        email: "detail-enrichment@example.com",
        role: "Engineer",
      }),
    });

    expect(createResponse.status).toBe(201);

    const createdUser = (await createResponse.json()) as {
      id: string;
      fullName: string;
    };

    const detailResponse = await app.request(`/api/users/${createdUser.id}`);
    const detailUser = (await detailResponse.json()) as {
      id: string;
      fullName: string;
      avatar: string;
      bio: string;
      phone: string;
    };

    expect(detailResponse.status).toBe(200);
    expect(detailUser.fullName).toBe("Detail Enrichment User");
    expect(detailUser.avatar).toMatch(/^https?:\/\//);
    expect(detailUser.bio.length).toBeGreaterThan(0);
    expect(detailUser.phone.length).toBeGreaterThan(0);
  });

  it("enriches PATCH response with detail profile fields", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const createResponse = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Patch Enrichment User",
        email: "patch-enrichment@example.com",
        role: "Engineer",
      }),
    });

    const createdUser = (await createResponse.json()) as { id: string };

    const patchResponse = await app.request(`/api/users/${createdUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Patch Enrichment Updated" }),
    });

    const patchedUser = (await patchResponse.json()) as {
      fullName: string;
      avatar: string;
      bio: string;
      phone: string;
    };

    expect(patchResponse.status).toBe(200);
    expect(patchedUser.fullName).toBe("Patch Enrichment Updated");
    expect(patchedUser.avatar).toMatch(/^https?:\/\//);
    expect(patchedUser.bio.length).toBeGreaterThan(0);
    expect(patchedUser.phone.length).toBeGreaterThan(0);
  });
});
