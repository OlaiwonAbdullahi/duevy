import type { ReactNode } from "react";
import DashboardShell from "./_components/DashboardShell";

/**
 * Applies the saved space theme before first paint on hard loads, so the
 * dashboard doesn't flash Duevy green before hydration. Must mirror
 * SPACE_THEME_STORAGE_KEY and the ids in space-theme.tsx; an unknown value
 * matches no CSS block and falls back to emerald.
 */
const SPACE_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("duevy-space-theme");if(t&&t!=="emerald")document.documentElement.setAttribute("data-space-theme",t);}catch(e){}})();`;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SPACE_THEME_SCRIPT }} />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
