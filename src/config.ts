import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv();

const DEFAULT_PORT = 3000;
const DEFAULT_SCHEMA_PATH = "./schema.json";
const DEFAULT_DELAY_MS = 0;
const DEFAULT_CORS_ORIGIN = "http://localhost:5173";
const MAX_DELAY_MS = 30_000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric env value: "${value}"`);
  }

  return parsed;
}

export type AppConfig = {
  port: number;
  schemaPath: string;
  responseDelayMs: number;
  corsOrigin: string;
};

export function loadConfig(): AppConfig {
  const port = parsePositiveInt(process.env.PORT, DEFAULT_PORT);
  const responseDelayMs = Math.min(
    parsePositiveInt(process.env.RESPONSE_DELAY_MS, DEFAULT_DELAY_MS),
    MAX_DELAY_MS,
  );

  const schemaPath = path.resolve(process.env.SCHEMA_PATH ?? DEFAULT_SCHEMA_PATH);

  return {
    port,
    schemaPath,
    responseDelayMs,
    corsOrigin: process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN,
  };
}
