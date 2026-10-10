import { UserMultipleIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { StatCard } from "../../_components/StatCard";
import { JoinCodeStat, JoinCodeInline } from "./JoinCodeStat";
import { InlineStat } from "../../_components/overview/OverviewUI";

export function CircleStats({
  studentCount,
  recentCount,
  code,
  spaceName,
  onRegenerate,
}: {
  studentCount: number;
  recentCount: number;
  code: string;
  spaceName: string;
  onRegenerate: () => Promise<void>;
}) {
  return (
    <>
    {/* Phones: inline member count with the join code beside it. */}
    <div className="mt-4 sm:hidden">
      <InlineStat
        label="Members"
        value={studentCount.toLocaleString("en-NG")}
        caption={
          recentCount > 0
            ? `+${recentCount} joined this week`
            : "No new joins this week"
        }
        aside={<JoinCodeInline code={code} spaceName={spaceName} onRegenerate={onRegenerate} />}
      />
    </div>

    <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
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
      <JoinCodeStat code={code} spaceName={spaceName} onRegenerate={onRegenerate} />
    </div>
    </>
  );
}
