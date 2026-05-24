import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadSchema } from "../src/schema/loader.js";
import { createMockServer } from "../src/server/createServer.js";

describe("createMockServer", () => {
  it("registers product detail route from schema", async () => {
    const schema = await loadSchema(path.join(process.cwd(), "schema.json"));
    const { routes } = createMockServer(schema, 0, "*");
    const routePaths = routes.map((route) => route.path);

    expect(routePaths).toContain("/api/products/:id");
  });
});
