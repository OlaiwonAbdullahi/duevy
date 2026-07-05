import { UserMultipleIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { StatCard } from "./StatCard";
import { JoinCodeStat } from "./JoinCodeStat";

export function CircleStats({
  studentCount,
  recentCount,
  code,
  onRegenerate,
}: {
  studentCount: number;
  recentCount: number;
  code: string;
  onRegenerate: () => void;
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={UserMultipleIcon}
        label="Members"
        value={String(studentCount)}
        hint="Currently in this department"
        tone="brand"
      />
      <StatCard
        icon={UserAdd01Icon}
        label="Recent joins"
        value={String(recentCount)}
        hint="Joined with the code"
      />
      <JoinCodeStat code={code} onRegenerate={onRegenerate} />
    </div>
  );
}
