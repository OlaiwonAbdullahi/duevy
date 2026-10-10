"use client";

import dynamic from "next/dynamic";
import { useRole } from "./_components/role-context";
import { OverviewSkeleton } from "./_components/Skeleton";

// Only one overview ever renders, so don't ship both.
const StudentOverview = dynamic(
  () => import("./_components/overview/StudentOverview").then((mod) => mod.StudentOverview),
  { loading: () => <OverviewSkeleton /> },
);
const RepOverview = dynamic(
  () => import("./_components/overview/RepOverview").then((mod) => mod.RepOverview),
  { loading: () => <OverviewSkeleton stats={4} /> },
);

export default function DashboardPage() {
  const { isRep } = useRole();
  return isRep ? <RepOverview /> : <StudentOverview />;
}
