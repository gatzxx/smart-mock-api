export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RegisteredRoute = {
  method: HttpMethod;
  path: string;
};
