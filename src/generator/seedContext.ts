import { AsyncLocalStorage } from "node:async_hooks";

import { faker } from "@faker-js/faker";

import { hashSeedKey } from "./seed.js";

const activeSeedStorage = new AsyncLocalStorage<number>();

export function applyActiveSeed(): void {
  const activeSeed = activeSeedStorage.getStore();

  if (activeSeed !== undefined) {
    faker.seed(activeSeed);
  }
}

export function runWithSeedKey<T>(seedKey: string | undefined, fn: () => T): T {
  if (!seedKey) {
    return fn();
  }

  const seed = hashSeedKey(seedKey);

  return activeSeedStorage.run(seed, () => {
    faker.seed(seed);
    return fn();
  });
}
