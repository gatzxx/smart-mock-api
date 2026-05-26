import { describe, expect, it } from "vitest";

import { bootstrapEntityFromCollection } from "../src/store/bootstrapStore.js";
import { EntityStore } from "../src/store/entityStore.js";

describe("bootstrapEntityFromCollection", () => {
  it("seeds store with all collection items using unique ids", () => {
    const store = new EntityStore();

    bootstrapEntityFromCollection(
      store,
      { entity: "users", idField: "id" },
      {
        kind: "collection",
        count: 3,
        item: {
          id: "uuid",
          fullName: "person.fullName",
          email: "internet.email",
          role: "person.jobTitle",
          createdAt: "date.recent",
        },
      },
      "/api/users",
    );

    expect(store.list("users")).toHaveLength(3);
  });

  it("seeds five products for the products collection", () => {
    const store = new EntityStore();

    bootstrapEntityFromCollection(
      store,
      { entity: "products", idField: "id" },
      {
        kind: "collection",
        count: 5,
        item: {
          id: "uuid",
          title: "commerce.productName",
          price: "commerce.price",
          inStock: "datatype.boolean",
          updatedAt: "date.recent",
        },
      },
      "/api/products",
    );

    expect(store.list("products")).toHaveLength(5);
  });
});
