"use client";

import { createAuthClient } from "better-auth/react";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ??
  "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
        document.cookie = `bearer_token=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
    },
    auth: {
      type: "Bearer",
      token: () => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("bearer_token") ?? "";
      },
    },
  },
});

export function clearAuthToken() {
  localStorage.removeItem("bearer_token");
  document.cookie = "bearer_token=; path=/; max-age=0";
}
