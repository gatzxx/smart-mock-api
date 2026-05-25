import { describe, expect, it } from "vitest";

import { mapFakerTypeToOpenApi } from "../src/openapi/fakerTypeMap.js";

describe("mapFakerTypeToOpenApi", () => {
  it("maps uuid to string uuid format", () => {
    expect(mapFakerTypeToOpenApi("uuid")).toEqual({
      type: "string",
      format: "uuid",
    });
  });

  it("maps commerce.price to number", () => {
    expect(mapFakerTypeToOpenApi("commerce.price")).toEqual({
      type: "number",
    });
  });

  it("falls back to string for unknown faker paths", () => {
    expect(mapFakerTypeToOpenApi("person.fullName")).toEqual({
      type: "string",
    });
  });
});
