"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/lib/api/auth";
import type { AuthSession, RegisterPayload } from "@/lib/api/auth";
import { refreshAccessToken, setAccessToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type RegisterResult = { user: User; pending: boolean };

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A non-sensitive role hint for the Next middleware (which can't read the real
 * session — the refresh cookie lives on the API origin, scoped to
 * `/v1/auth/refresh`). Middleware uses it only to route each role to its area;
 * the backend still enforces real auth on every request, so a stale/forged
 * value just yields an empty shell + 401s.
 */
function writeRoleCookie(role: string | null) {
  if (typeof document === "undefined") return;
  document.cookie = role
    ? `duevy_role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : "duevy_role=; path=/; max-age=0; samesite=lax";
}

/** Marketing pages that never need the session. */
const PUBLIC_PATHS = new Set(["/", "/privacy", "/terms", "/offline"]);

/**
 * A visitor with no role hint on a marketing page has almost certainly never
 * signed in here, so skip the `/auth/refresh` round trip (which can mean a
 * backend cold start). App routes always try, so a lost hint never locks
 * anyone out.
 */
function shouldSkipBootstrap() {
  if (typeof window === "undefined") return false;
  if (!PUBLIC_PATHS.has(window.location.pathname)) return false;
  return !document.cookie.split("; ").some((c) => c.startsWith("duevy_role=") && c.length > 11);
}

/**
 * Single source of truth for "who is signed in" across the whole app. The access
 * token itself lives only in the `lib/api/client` module (never in React state or
 * storage); on mount we try to trade the httpOnly refresh cookie for a fresh one
 * via `/auth/refresh` so a hard reload doesn't bounce a signed-in user to /login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (shouldSkipBootstrap()) {
        setStatus("unauthenticated");
        return;
      }
      try {
        await refreshAccessToken();
        const me = await authApi.getMe();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the middleware's role hint in sync with the real session.
  useEffect(() => {
    if (user) writeRoleCookie(user.role);
    else if (status === "unauthenticated") writeRoleCookie(null);
  }, [user, status]);

  const login = useCallback(async (email: string, password: string) => {
    let session: AuthSession;
    try {
      session = await authApi.login({ email, password });
    } catch (err) {
      // A pending rep gets a 403 REP_APPROVAL_PENDING that still carries a usable
      // { user, accessToken } in `data`. Log them in anyway so they can track the
      // review from the dashboard (their role stays `student` with a pending banner).
      if (err instanceof ApiError && err.code === "REP_APPROVAL_PENDING") {
        const data = err.data as AuthSession | undefined;
        if (data?.accessToken && data.user) {
          setAccessToken(data.accessToken);
          const me = await authApi.getMe();
          setUser(me);
          setStatus("authenticated");
          return me;
        }
      }
      throw err;
    }
    // The login payload is the raw account row (no `spaces`, no rep flags), so
    // load the real session shape from /auth/me.
    setAccessToken(session.accessToken);
    const me = await authApi.getMe();
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResult> => {
    try {
      const session = await authApi.register(payload);
      // The signup flow sends the user to /login afterwards (the API does set a
      // refresh cookie, so a reload would also sign them in).
      return {
        user: session.user,
        pending: session.user.repApplicationStatus === "pending",
      };
    } catch (err) {
      // A rep awaiting approval comes back as a REP_APPROVAL_PENDING *error* envelope
      // that still carries the created user in `data` — that's a successful signup.
      if (err instanceof ApiError && err.code === "REP_APPROVAL_PENDING") {
        const user = (err.data as AuthSession | undefined)?.user;
        if (user) return { user, pending: true };
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      // Never show the next account on this device the last one's cached data.
      // Loaded lazily so pages without the query cache don't ship it.
      void import("@/lib/api/query-client").then((m) => m.clearQueryCache());
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an <AuthProvider>");
  return ctx;
}
