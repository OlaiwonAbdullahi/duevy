"use client";

import dynamic from "next/dynamic";
import { useRole } from "./_components/role-context";
import { OverviewSkeleton } from "./_components/Skeleton";

const loadStudentOverview = () =>
  import("./_components/overview/StudentOverview").then((mod) => mod.StudentOverview);
const loadRepOverview = () =>
  import("./_components/overview/RepOverview").then((mod) => mod.RepOverview);

// Start downloading the overview now, while the session is still being
// restored, instead of after it. The role hint cookie (set after sign-in)
// picks which one; the bundler reuses this request when `dynamic` renders.
if (typeof document !== "undefined") {
  const role = document.cookie.match(/(?:^|; )duevy_role=([^;]*)/)?.[1];
  if (role === "rep") void loadRepOverview();
  else if (role === "student") void loadStudentOverview();
}

// Only one overview ever renders, so don't ship both.
const StudentOverview = dynamic(loadStudentOverview, { loading: () => <OverviewSkeleton /> });
const RepOverview = dynamic(loadRepOverview, { loading: () => <OverviewSkeleton stats={4} /> });

export default function DashboardPage() {
  const { isRep } = useRole();
  return isRep ? <RepOverview /> : <StudentOverview />;
}
