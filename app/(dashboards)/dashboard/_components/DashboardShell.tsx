"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RoleProvider, useRole } from "./role-context";
import { SpaceThemeProvider } from "./space-theme";
import { getDashboardGroups, isRepOnlyPath } from "./nav-config";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { RepOnlyNotice } from "./RepOnlyNotice";
import { CommandPalette } from "./CommandPalette";

function ShellInner({ children }: { children: ReactNode }) {
  const { role, isRep } = useRole();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Students who reach a rep-only route by URL get a graceful notice, not the tool.
  const blocked = !isRep && isRepOnlyPath(pathname);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        groups={getDashboardGroups(isRep)}
        subtitle={role === "rep" ? "Rep dashboard" : "Student dashboard"}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar onMenu={() => setOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {blocked ? <RepOnlyNotice /> : children}
        </main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} isRep={isRep} />
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider initialRole="student">
      <SpaceThemeProvider>
        <ShellInner>{children}</ShellInner>
      </SpaceThemeProvider>
    </RoleProvider>
  );
}
