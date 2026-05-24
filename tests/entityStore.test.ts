import { describe, expect, it } from "vitest";

import { EntityStore } from "../src/store/entityStore.js";

describe("EntityStore", () => {
  it("creates and lists items", () => {
    const store = new EntityStore();
    const createdUser = store.create("users", "id", {
      id: "user-1",
      fullName: "Ada Lovelace",
    });

    expect(createdUser.id).toBe("user-1");
    expect(store.list("users")).toEqual([
      {
        id: "user-1",
        fullName: "Ada Lovelace",
      },
    ]);
  });

  it("updates and deletes items", () => {
    const store = new EntityStore();
    store.create("users", "id", { id: "user-1", fullName: "Ada Lovelace" });

    const updatedUser = store.update(
      "users",
      "user-1",
      { fullName: "Grace Hopper" },
      "id",
    );

    expect(updatedUser?.fullName).toBe("Grace Hopper");
    expect(store.delete("users", "user-1")).toBe(true);
    expect(store.get("users", "user-1")).toBeUndefined();
  });

  it("seeds collection only once per entity", () => {
    const store = new EntityStore();

    store.seed("users", "id", [
      { id: "user-1", fullName: "Ada Lovelace" },
      { id: "user-2", fullName: "Grace Hopper" },
    ]);

    expect(store.has("users")).toBe(true);
    expect(store.list("users")).toHaveLength(2);
  });
});
