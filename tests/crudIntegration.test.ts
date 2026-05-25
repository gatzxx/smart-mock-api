import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

type CreatedUser = {
  id: string;
  fullName: string;
  email: string;
};

type CreatedProduct = {
  id: string;
  title: string;
  price: number;
  inStock: boolean;
};

async function runUserCrudIntegration(
  app: ReturnType<typeof createMockServer>["app"],
): Promise<void> {
  const createResponse = await app.request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Integration User",
      email: "integration-user@example.com",
      role: "Engineer",
    }),
  });

  expect(createResponse.status).toBe(201);

  const createdUser = (await createResponse.json()) as CreatedUser;

  const listResponse = await app.request("/api/users");
  const users = (await listResponse.json()) as Array<{ id: string }>;

  expect(listResponse.status).toBe(200);
  expect(users.some((user) => user.id === createdUser.id)).toBe(true);

  const detailBeforePatch = await app.request(`/api/users/${createdUser.id}`);
  const detailUser = (await detailBeforePatch.json()) as {
    fullName: string;
    avatar: string;
    bio: string;
  };

  expect(detailBeforePatch.status).toBe(200);
  expect(detailUser.fullName).toBe("Integration User");
  expect(detailUser.avatar).toMatch(/^https?:\/\//);
  expect(detailUser.bio.length).toBeGreaterThan(0);

  const patchResponse = await app.request(`/api/users/${createdUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: "Integration User Updated" }),
  });

  expect(patchResponse.status).toBe(200);

  const patchedUser = (await patchResponse.json()) as { fullName: string };
  expect(patchedUser.fullName).toBe("Integration User Updated");

  const detailAfterPatch = await app.request(`/api/users/${createdUser.id}`);
  const updatedDetailUser = (await detailAfterPatch.json()) as {
    fullName: string;
  };

  expect(detailAfterPatch.status).toBe(200);
  expect(updatedDetailUser.fullName).toBe("Integration User Updated");

  const deleteResponse = await app.request(`/api/users/${createdUser.id}`, {
    method: "DELETE",
  });

  expect(deleteResponse.status).toBe(200);

  const detailAfterDelete = await app.request(`/api/users/${createdUser.id}`);
  expect(detailAfterDelete.status).toBe(404);
}

async function runProductCrudIntegration(
  app: ReturnType<typeof createMockServer>["app"],
): Promise<void> {
  const createResponse = await app.request("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Integration Product",
      price: 99.5,
      inStock: true,
    }),
  });

  expect(createResponse.status).toBe(201);

  const createdProduct = (await createResponse.json()) as CreatedProduct;

  const listResponse = await app.request("/api/products");
  const products = (await listResponse.json()) as Array<{ id: string }>;

  expect(listResponse.status).toBe(200);
  expect(products.some((product) => product.id === createdProduct.id)).toBe(true);

  const detailBeforePatch = await app.request(`/api/products/${createdProduct.id}`);
  const detailProduct = (await detailBeforePatch.json()) as {
    title: string;
    description: string;
  };

  expect(detailBeforePatch.status).toBe(200);
  expect(detailProduct.title).toBe("Integration Product");
  expect(detailProduct.description.length).toBeGreaterThan(0);

  const patchResponse = await app.request(`/api/products/${createdProduct.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Integration Product Updated", inStock: false }),
  });

  expect(patchResponse.status).toBe(200);

  const patchedProduct = (await patchResponse.json()) as {
    title: string;
    inStock: boolean;
  };

  expect(patchedProduct.title).toBe("Integration Product Updated");
  expect(patchedProduct.inStock).toBe(false);

  const detailAfterPatch = await app.request(`/api/products/${createdProduct.id}`);
  const updatedDetailProduct = (await detailAfterPatch.json()) as {
    title: string;
    inStock: boolean;
  };

  expect(detailAfterPatch.status).toBe(200);
  expect(updatedDetailProduct.title).toBe("Integration Product Updated");
  expect(updatedDetailProduct.inStock).toBe(false);

  const deleteResponse = await app.request(`/api/products/${createdProduct.id}`, {
    method: "DELETE",
  });

  expect(deleteResponse.status).toBe(200);

  const detailAfterDelete = await app.request(`/api/products/${createdProduct.id}`);
  expect(detailAfterDelete.status).toBe(404);
}

describe("CRUD integration", () => {
  it("runs full users lifecycle with detail enrichment", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    await runUserCrudIntegration(app);
  });

  it("runs full products lifecycle with detail enrichment", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    await runProductCrudIntegration(app);
  });

  it("keeps users and products CRUD isolated in one server instance", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    await runUserCrudIntegration(app);
    await runProductCrudIntegration(app);

    const usersResponse = await app.request("/api/users");
    const productsResponse = await app.request("/api/products");

    expect(usersResponse.status).toBe(200);
    expect(productsResponse.status).toBe(200);
  });
});
