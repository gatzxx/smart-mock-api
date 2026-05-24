import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

describe("products CRUD", () => {
  it("supports create, update, delete and list flow", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const createResponse = await app.request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Wave B Product",
        price: 42.5,
        inStock: true,
      }),
    });

    expect(createResponse.status).toBe(201);

    const createdProduct = (await createResponse.json()) as {
      id: string;
      title: string;
      price: number;
      inStock: boolean;
    };

    expect(createdProduct.title).toBe("Wave B Product");
    expect(createdProduct.price).toBe(42.5);
    expect(createdProduct.inStock).toBe(true);
    expect(createdProduct.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const listResponse = await app.request("/api/products");
    const products = (await listResponse.json()) as Array<{ id: string }>;

    expect(listResponse.status).toBe(200);
    expect(products.some((product) => product.id === createdProduct.id)).toBe(true);

    const patchResponse = await app.request(`/api/products/${createdProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Wave B Updated", inStock: false }),
    });

    expect(patchResponse.status).toBe(200);

    const updatedProduct = (await patchResponse.json()) as {
      title: string;
      inStock: boolean;
    };

    expect(updatedProduct.title).toBe("Wave B Updated");
    expect(updatedProduct.inStock).toBe(false);

    const deleteResponse = await app.request(`/api/products/${createdProduct.id}`, {
      method: "DELETE",
    });

    expect(deleteResponse.status).toBe(200);

    const deletedPayload = (await deleteResponse.json()) as {
      id: string;
      deleted: boolean;
    };

    expect(deletedPayload.deleted).toBe(true);
    expect(deletedPayload.id).toBe(createdProduct.id);

    const detailResponse = await app.request(`/api/products/${createdProduct.id}`);
    expect(detailResponse.status).toBe(404);
  });

  it("returns 404 for patch and delete on missing product", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");
    const missingProductId = "00000000-0000-0000-0000-000000000000";

    const patchResponse = await app.request(`/api/products/${missingProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Missing" }),
    });

    const deleteResponse = await app.request(`/api/products/${missingProductId}`, {
      method: "DELETE",
    });

    expect(patchResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it("registers products mutation routes", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { routes } = createMockServer(schema, 0, "*");

    expect(routes).toContainEqual({ method: "POST", path: "/api/products" });
    expect(routes).toContainEqual({
      method: "PATCH",
      path: "/api/products/:id",
    });
    expect(routes).toContainEqual({
      method: "DELETE",
      path: "/api/products/:id",
    });
  });

  it("keeps users and products stores isolated", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const createUserResponse = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Isolation User",
        email: "iso@example.com",
        role: "QA",
      }),
    });

    const createProductResponse = await app.request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Isolation Product",
        price: 10,
        inStock: true,
      }),
    });

    const createdUser = (await createUserResponse.json()) as { id: string };
    const createdProduct = (await createProductResponse.json()) as {
      id: string;
    };

    await app.request(`/api/products/${createdProduct.id}`, {
      method: "DELETE",
    });

    const usersResponse = await app.request("/api/users");
    const users = (await usersResponse.json()) as Array<{ id: string }>;

    expect(users.some((user) => user.id === createdUser.id)).toBe(true);
  });
});
