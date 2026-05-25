import path from "node:path";

import { describe, expect, it } from "vitest";

import { API_ERROR_MESSAGE } from "../src/server/errors.js";
import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

type ApiErrorBody = {
  error: string;
};

async function expectApiError(
  response: Response,
  expectedStatus: number,
  expectedMessage: string,
): Promise<void> {
  const payload = (await response.json()) as ApiErrorBody;

  expect(response.status).toBe(expectedStatus);
  expect(payload).toEqual({ error: expectedMessage });
  expect(Object.keys(payload)).toEqual(["error"]);
}

describe("API error responses", () => {
  it("returns 400 when POST body is not a JSON object", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    const response = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["not-an-object"]),
    });

    await expectApiError(response, 400, API_ERROR_MESSAGE.BODY_MUST_BE_OBJECT);
  });

  it("returns 400 when PATCH body is not a JSON object", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");

    await app.request("/api/users");

    const response = await app.request(
      "/api/users/00000000-0000-0000-0000-000000000001",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(null),
      },
    );

    await expectApiError(response, 400, API_ERROR_MESSAGE.BODY_MUST_BE_OBJECT);
  });

  it("returns 404 for missing resources on PATCH and DELETE", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");
    const missingId = "00000000-0000-0000-0000-000000000000";

    const patchResponse = await app.request(`/api/users/${missingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Missing" }),
    });

    const deleteResponse = await app.request(`/api/users/${missingId}`, {
      method: "DELETE",
    });

    await expectApiError(patchResponse, 404, API_ERROR_MESSAGE.RESOURCE_NOT_FOUND);
    await expectApiError(deleteResponse, 404, API_ERROR_MESSAGE.RESOURCE_NOT_FOUND);
  });

  it("returns 404 for GET detail when entity is missing from initialized store", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { app } = createMockServer(schema, 0, "*");
    const missingId = "00000000-0000-0000-0000-000000000000";

    await app.request("/api/products");

    const response = await app.request(`/api/products/${missingId}`);

    await expectApiError(response, 404, API_ERROR_MESSAGE.RESOURCE_NOT_FOUND);
  });

  it("returns 500 for misconfigured POST endpoint", async () => {
    const schema = {
      basePath: "/api",
      endpoints: [
        {
          path: "/broken",
          method: "POST" as const,
          response: {
            kind: "object" as const,
            fields: {
              id: "uuid",
            },
          },
        },
      ],
    };
    const { app } = createMockServer(schema, 0, "*");

    const response = await app.request("/api/broken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "test" }),
    });

    await expectApiError(response, 500, API_ERROR_MESSAGE.INVALID_POST_CONFIG);
  });
});
