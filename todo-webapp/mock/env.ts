// The keys the platform actually emits for this component's `user-auth`
// dependency — the set src/env.ts declares, and only those. No <DEP>_URL for
// todo-api: a sibling's address is never a browser key, only same-origin /api.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_SCOPES:
    "openid profile email group ou todos:read todos:submit todos:edit todos:delete",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
