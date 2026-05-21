import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadSchema } from "../src/schema/loader.js";

describe("loadSchema", () => {
  it("parses valid schema file", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "smart-mock-"));
    const schemaFile = path.join(tempDir, "schema.json");

    await writeFile(
      schemaFile,
      JSON.stringify({
        basePath: "/api",
        endpoints: [
          {
            path: "/items",
            response: {
              kind: "object",
              fields: { id: "uuid" },
            },
          },
        ],
      }),
      "utf-8",
    );

    const schema = await loadSchema(schemaFile);

    expect(schema.basePath).toBe("/api");
    expect(schema.endpoints).toHaveLength(1);
    expect(schema.endpoints[0]?.path).toBe("/items");
  });

  it("rejects schema without endpoints", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "smart-mock-"));
    const schemaFile = path.join(tempDir, "invalid.json");

    await writeFile(
      schemaFile,
      JSON.stringify({ basePath: "/api", endpoints: [] }),
      "utf-8",
    );

    await expect(loadSchema(schemaFile)).rejects.toThrow();
  });
});
