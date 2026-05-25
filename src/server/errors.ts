import type { Context } from "hono";

export type ApiErrorBody = {
  error: string;
};

export const API_ERROR_MESSAGE = {
  BODY_MUST_BE_OBJECT: "Request body must be a JSON object.",
  INVALID_DELETE_CONFIG: "Invalid DELETE endpoint configuration.",
  INVALID_PATCH_CONFIG: "Invalid PATCH endpoint configuration.",
  INVALID_POST_CONFIG: "Invalid POST endpoint configuration.",
  RESOURCE_ID_REQUIRED: "Resource id is required.",
  RESOURCE_NOT_FOUND: "Resource not found.",
} as const;

type ApiErrorStatus = 400 | 404 | 500;

export function respondWithApiError(
  context: Context,
  message: string,
  status: ApiErrorStatus,
) {
  const body: ApiErrorBody = { error: message };
  return context.json(body, status);
}
