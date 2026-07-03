import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "./StatCard";

export function CircleStats({
  studentCount,
  requestCount,
  matchedCount,
  uploadMatched,
}: {
  studentCount: number;
  requestCount: number;
  matchedCount: number;
  uploadMatched: boolean;
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={UserMultipleIcon}
        label="Approved students"
        value={String(studentCount)}
        hint="Currently in this department"
        tone="brand"
      />
      <StatCard
        icon={Clock01Icon}
        label="Join requests"
        value={String(requestCount)}
        hint="Waiting for rep review"
      />
      <StatCard
        icon={CheckmarkCircle02Icon}
        label="Upload matches"
        value={String(matchedCount)}
        hint={uploadMatched ? "Ready for bulk approval" : "Upload a sheet to check"}
      />
    </div>
  );
}
