import { describe, expect, it } from "vitest";

import { getGenerator } from "../src/generator/fakerRegistry.js";

describe("getGenerator", () => {
  it("returns value for known faker path", () => {
    const generate = getGenerator("internet.email");
    const value = generate();

    expect(typeof value).toBe("string");
    expect(String(value)).toContain("@");
  });

  it("returns uuid for shorthand alias", () => {
    const generate = getGenerator("uuid");
    const value = generate();

    expect(typeof value).toBe("string");
    expect(String(value)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns process uptime for runtime.uptime", () => {
    const generate = getGenerator("runtime.uptime");
    const value = generate();

    expect(typeof value).toBe("number");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(Math.ceil(process.uptime()) + 1);
  });

  it("throws for unknown field type", () => {
    expect(() => getGenerator("unknown.field")).toThrow(/Unknown field type/);
  });
});
