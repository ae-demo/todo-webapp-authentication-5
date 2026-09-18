import { useEffect, useRef, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

/**
 * The OIDC redirect target. Thunder's SSO hosts the actual sign-in form; this
 * page only completes the Authorization Code + PKCE exchange and lands the
 * user back at the app root — there is no screen to draw for it
 * (thunder-authentication, wireframes: no Login screen for an auth-dependent
 * component).
 */
export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void handleCallback()
      .then(() => navigate("/", { replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      });
  }, [navigate]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6">Signing you in…</Typography>
        {error ? <Typography color="error.main">{error}</Typography> : null}
      </Stack>
    </Box>
  );
}
