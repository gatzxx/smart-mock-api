import { describe, expect, it } from "vitest";

import { generateResponse } from "../src/generator/dataGenerator.js";
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
});
