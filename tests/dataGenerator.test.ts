import { describe, expect, it } from "vitest";

import { generateResponse } from "../src/generator/dataGenerator.js";
import { runWithSeedKey } from "../src/generator/seedContext.js";
import type { MockResponse } from "../src/schema/types.js";

describe("generateResponse", () => {
  it("generates object with all configured fields", () => {
    const response: MockResponse = {
      kind: "object",
      fields: {
        id: "uuid",
        email: "internet.email",
        status: "literal.ok",
      },
    };

    const result = generateResponse(response) as Record<string, unknown>;

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("status", "ok");
    expect(typeof result.email).toBe("string");
  });

  it("generates collection with requested count", () => {
    const response: MockResponse = {
      kind: "collection",
      count: 3,
      item: {
        fullName: "person.fullName",
      },
    };

    const result = generateResponse(response) as Array<Record<string, unknown>>;

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty("fullName");
  });

  it("generates stable collection for the same seed key", () => {
    const response: MockResponse = {
      kind: "collection",
      count: 3,
      item: {
        fullName: "person.fullName",
        email: "internet.email",
      },
    };

    const firstResult = generateResponse(response, "/api/users") as Array<
      Record<string, unknown>
    >;
    const secondResult = generateResponse(response, "/api/users") as Array<
      Record<string, unknown>
    >;

    expect(firstResult).toEqual(secondResult);
  });

  it("keeps deterministic output for concurrent seed keys", async () => {
    const response: MockResponse = {
      kind: "object",
      fields: {
        fullName: "person.fullName",
        email: "internet.email",
      },
    };

    const seedKeys = ["/api/users/a", "/api/users/b", "/api/users/a"];

    const results = await Promise.all(
      seedKeys.map((seedKey) =>
        Promise.resolve().then(
          () =>
            runWithSeedKey(seedKey, () => generateResponse(response)) as Record<
              string,
              unknown
            >,
        ),
      ),
    );

    expect(results[0]).toEqual(results[2]);
    expect(results[0]).not.toEqual(results[1]);
  });
});
