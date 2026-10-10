import { NextResponse, type NextRequest } from "next/server";

/**
 * Role-based routing. The real session lives in an HTTP-only cookie on the API
 * origin (scoped to `/v1/auth/refresh`), so middleware can't read it — instead
 * it reads the non-sensitive `duevy_role` hint the client sets after auth (see
 * `lib/auth/auth-context`). This only steers each role to its own area; the
 * backend enforces real auth on every request. Unauthenticated gating (no
 * session → `/login`) stays client-side in the shells, so a missing/expired
 * hint cookie never wrongly bounces a user who can still re-auth.
 */

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  rep: "/dashboard",
  student: "/dashboard",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("duevy_role")?.value;

  if (!role) return NextResponse.next();

  const home = ROLE_HOME[role] ?? "/dashboard";
  const onAuthPage = pathname === "/login" || pathname === "/signup";
  const onAdmin = pathname.startsWith("/admin");
  const onDashboard = pathname.startsWith("/dashboard");

  // Signed-in users don't belong on the auth screens.
  if (onAuthPage) return NextResponse.redirect(new URL(home, req.url));
  // Admins live under /admin; everyone else under /dashboard.
  if (onAdmin && role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
  if (onDashboard && role === "admin") return NextResponse.redirect(new URL("/admin", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
