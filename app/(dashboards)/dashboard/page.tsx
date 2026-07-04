"use client";

import { useRole } from "./_components/role-context";
import { StudentOverview } from "./_components/overview/StudentOverview";
import { RepOverview } from "./_components/overview/RepOverview";

export default function DashboardPage() {
  const { isRep } = useRole();
  return isRep ? <RepOverview /> : <StudentOverview />;
}
