import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/todo-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

// Same-origin: nginx in this pod reverse-proxies /api to the todo-api sibling
// (through the API gateway when it fronts one). No browser-visible API host —
// see react-webapp's Same-origin API proxy.
export const todoApi = createClient<paths>({ baseUrl: "/api" });

// The one authorization surface a per-service client is allowed: attach the
// bearer, and apply the 401 rule from src/authz/client.ts. Nothing here
// decides what a 401 means on its own.
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

todoApi.use(authMiddleware);
