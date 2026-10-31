"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DEMO_USER_ID } from "@/lib/demo/mode";
import { OverviewSkeleton, ShellSkeleton } from "@/app/(dashboards)/dashboard/_components/Skeleton";

/**
 * Visiting /demo turns demo mode on for this tab (see `lib/demo/mode`), so the
 * AuthProvider signs in as the demo rep. Then hand off to the dashboard.
 */
export function DemoEntry() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // A real role hint would make middleware steer away from /dashboard
    // (admins to /admin). The real session rewrites it after the demo.
    document.cookie = "duevy_role=; path=/; max-age=0; samesite=lax";
    if (status === "loading") return;
    if (user?.id === DEMO_USER_ID) router.replace("/dashboard");
    // Arrived from inside the app with a real session already loaded: reload
    // so the AuthProvider starts over as the demo account.
    else window.location.replace("/dashboard");
  }, [status, user, router]);

  return (
    <ShellSkeleton>
      <OverviewSkeleton />
    </ShellSkeleton>
  );
}
