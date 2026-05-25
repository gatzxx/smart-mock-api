import type { Context } from "hono";

export async function parseJsonBody(
  context: Context,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await context.req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
