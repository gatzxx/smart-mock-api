import type { MiddlewareHandler } from "hono";

export function createDelayMiddleware(delayMs: number): MiddlewareHandler {
  return async (_context, next) => {
    if (delayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    await next();
  };
}
