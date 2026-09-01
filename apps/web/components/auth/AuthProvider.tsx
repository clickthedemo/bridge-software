"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/auth/api";
import { authStorage } from "@/lib/auth/storage";
import type { CurrentUser, OrganizationMembership } from "@/lib/auth/types";

type AuthContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: CurrentUser | null;
  memberships: OrganizationMembership[];
  isAdmin: boolean;
  login(email: string, password: string): Promise<{ isAdmin: boolean }>;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);

  useEffect(() => {
    const session = authStorage.get();
    if (!session) { queueMicrotask(() => setStatus("unauthenticated")); return; }
    authApi.me(session.accessToken).then((result) => {
      setUser(result.user); setMemberships(result.memberships); setStatus("authenticated");
    }).catch(() => { authStorage.clear(); setStatus("unauthenticated"); });
  }, []);

  async function login(email: string, password: string) {
    const result = await authApi.login(email, password);
    const session = { accessToken: result.accessToken, refreshToken: result.refreshToken,
      expiresAt: result.expiresAt, expiresIn: result.expiresIn, tokenType: result.tokenType };
    const identity = await authApi.me(result.accessToken);
    authStorage.set(session); setUser(identity.user); setMemberships(identity.memberships); setStatus("authenticated");
    return { isAdmin: identity.user.platformRoles.includes("admin") };
  }

  function logout() { authStorage.clear(); setUser(null); setMemberships([]); setStatus("unauthenticated"); }
  const value = useMemo(() => ({ status, user, memberships,
    isAdmin: user?.platformRoles.includes("admin") ?? false, login, logout }), [status, user, memberships]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
