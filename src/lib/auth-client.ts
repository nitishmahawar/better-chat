import { env } from "@/env";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? window.location.origin : env.SERVER_URL,
});
