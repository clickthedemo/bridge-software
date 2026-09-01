import type { AuthSession, CurrentUserResponse, LoginResponse } from "./types";

const configuredBase = process.env.NEXT_PUBLIC_BRIDGE_API_BASE?.replace(/\/$/, "") ?? "";
const apiBase = configuredBase.endsWith("/api/v1") ? configuredBase : `${configuredBase}/api/v1`;

export class AuthApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new AuthApiError(response.status, payload?.message ?? "The request could not be completed.");
  return payload as T;
}

export const authApi = {
  login: (email: string, password: string) => request<LoginResponse>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  }),
  me: (accessToken: string) => request<CurrentUserResponse>("/auth/me", {}, accessToken),
  forgotPassword: (email: string) => request<{ message: string }>("/auth/forgot-password", {
    method: "POST", body: JSON.stringify({ email }),
  }),
  resendVerification: (email: string) => request<{ message: string }>("/auth/resend-verification", {
    method: "POST", body: JSON.stringify({ email }),
  }),
  resetPassword: (newPassword: string, session: AuthSession) => request<{ message: string }>(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify({ newPassword, refreshToken: session.refreshToken }) },
    session.accessToken,
  ),
};

