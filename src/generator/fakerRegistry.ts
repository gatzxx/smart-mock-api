import { faker } from "@faker-js/faker";

export type FakerFieldType = string;

type FakerGenerator = () => unknown;

const SHORTHAND_GENERATORS: Record<string, FakerGenerator> = {
  uuid: () => faker.string.uuid(),
};

const LITERAL_GENERATORS: Record<string, FakerGenerator> = {
  "literal.ok": () => "ok",
  "date.iso": () => new Date().toISOString(),
  "runtime.uptime": () => Math.floor(process.uptime()),
};

function resolveFakerPath(fieldType: FakerFieldType): FakerGenerator {
  if (fieldType in SHORTHAND_GENERATORS) {
    return SHORTHAND_GENERATORS[fieldType] as FakerGenerator;
  }

  if (fieldType in LITERAL_GENERATORS) {
    return LITERAL_GENERATORS[fieldType] as FakerGenerator;
  }

  const segments = fieldType.split(".");
  if (segments.length < 2) {
    throw new Error(
      `Unknown field type "${fieldType}". Use "namespace.method" (e.g. "person.fullName").`,
    );
  }

  let current: unknown = faker;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Unknown field type "${fieldType}".`);
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current !== "function") {
    throw new Error(`Unknown field type "${fieldType}".`);
  }

  return current.bind(faker) as FakerGenerator;
}

const generatorCache = new Map<FakerFieldType, FakerGenerator>();

export function getGenerator(fieldType: FakerFieldType): FakerGenerator {
  const cached = generatorCache.get(fieldType);
  if (cached) {
    return cached;
  }

  const generator = resolveFakerPath(fieldType);
  generatorCache.set(fieldType, generator);
  return generator;
}
