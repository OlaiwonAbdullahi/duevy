/**
 * Demo mode: `/demo` signs the tab into a fixed rep account backed by sample
 * data, so the product can be shown without logging in. While it's on, the
 * API client answers every request from `lib/demo/handler` and nothing
 * reaches the backend. Scoped to the tab (sessionStorage) so a real session in
 * another tab is untouched; the auth screens and "Exit demo" turn it off.
 */

const KEY = "duevy:demo";

export const DEMO_PATH = "/demo";
export const DEMO_USER_ID = "demo-user-tolu";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

/** Demo dues' public pay links (`/pay/demo-due-2`) work from any tab, signed in or not. */
const DEMO_PAY_PREFIX = "/pay/demo-";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const { pathname } = window.location;
  // Answer from sample data without switching the tab into demo mode.
  if (pathname.startsWith(DEMO_PAY_PREFIX)) return true;
  try {
    if (pathname === DEMO_PATH) sessionStorage.setItem(KEY, "1");
    else if (AUTH_PATHS.some((p) => pathname.startsWith(p))) sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return pathname === DEMO_PATH;
  }
}

export function exitDemo() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing was persisted, so there's nothing to clear.
  }
}
