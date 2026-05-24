import type { RegisteredRoute } from "./types.js";

const BORDER = "─".repeat(52);

export function printStartupBanner(options: {
  port: number;
  schemaPath: string;
  responseDelayMs: number;
  routes: RegisteredRoute[];
}): void {
  const { port, schemaPath, responseDelayMs, routes } = options;

  console.log("");
  console.log("  Smart Mock API");
  console.log(`  ${BORDER}`);
  console.log(`  Schema:  ${schemaPath}`);
  console.log(`  Delay:   ${responseDelayMs} ms`);
  console.log(`  URL:     http://localhost:${port}`);
  console.log(`  Meta:    http://localhost:${port}/__meta`);
  console.log(`  ${BORDER}`);
  console.log("  Registered endpoints:");
  console.log("");

  for (const route of routes) {
    console.log(`    ✓  ${route.method.padEnd(6)} ${route.path}`);
  }

  console.log("");
  console.log(`  Total: ${routes.length} endpoint(s)`);
  console.log("");
}
