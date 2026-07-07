"use client";

import { useState, type ReactNode } from "react";
import { RoleProvider, useRole } from "./role-context";
import { getDashboardGroups } from "./nav-config";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function ShellInner({ children }: { children: ReactNode }) {
  const { role, isRep } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        groups={getDashboardGroups(isRep)}
        subtitle={role === "rep" ? "Rep dashboard" : "Student dashboard"}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider initialRole="student">
      <ShellInner>{children}</ShellInner>
    </RoleProvider>
  );
}
