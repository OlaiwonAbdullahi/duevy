import Link from "next/link";
import {
  AlertCircleIcon,
  Building03Icon,
  ReceiptDollarIcon,
  UserGroup03Icon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StatCard } from "../../dashboard/_components/StatCard";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { naira, formatPercent01 } from "../_components/format";
import { mockDepartments, mockReps } from "../_components/MockData";

type AttentionItem = {
  id: string;
  tone: StatusTone;
  badge: string;
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
};

export default function AdminOverviewPage() {
  const totalUsers = 1280;
  const activeReps = mockReps.filter((r) => r.status === "active").length;
  const duesCollected = mockDepartments.reduce((s, d) => s + d.collectedAmount, 0);
  const duesTarget = mockDepartments.reduce((s, d) => s + d.duesTarget, 0);
  const floatHeld = mockReps.reduce((s, r) => s + r.heldAmount, 0);
  const overdueAmount = 186000;
  const overdueCount = 42;
  const lowRateReps = mockReps.filter((r) => r.collectionRate < 0.5);

  const attentionItems: AttentionItem[] = [
    {
      id: "flagged_accounts",
      tone: "warn",
      badge: "Accounts",
      title: "2 accounts flagged or frozen",
      detail: "Verify recent activity and reinstate if clean.",
      href: "/admin/users",
      linkLabel: "Open users",
    },
    {
      id: "open_disputes",
      tone: "warn",
      badge: "Disputes",
      title: "2 disputes unresolved",
      detail: "Decide outcomes to prevent repeated holds.",
      href: "/admin/disputes",
      linkLabel: "Open disputes",
    },
    {
      id: "referral_fraud",
      tone: "warn",
      badge: "Referrals",
      title: "3 referral fraud flags",
      detail: "Inspect self-referral rings and shared devices.",
      href: "/admin/referrals",
      linkLabel: "Review referrals",
    },
    ...(lowRateReps.length
      ? [
          {
            id: "low_rate_reps",
            tone: "bad" as const,
            badge: "Reps",
            title: `${lowRateReps.length} rep${lowRateReps.length > 1 ? "s" : ""} with a very low collection rate`,
            detail: "Inspect member dues and collection cadence.",
            href: "/admin/reps",
            linkLabel: "Open reps",
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Overview"
        description="Platform health at a glance — the numbers and issues that need an admin."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={UserMultipleIcon}
          label="Total users"
          value={totalUsers.toLocaleString()}
          hint="Registered accounts"
        />
        <StatCard
          icon={UserGroup03Icon}
          label="Active reps"
          value={String(activeReps)}
          hint="Verified and collecting"
        />
        <StatCard
          icon={Building03Icon}
          label="Spaces"
          value={String(mockDepartments.length)}
          hint="Departments, faculties and clubs"
        />
        <StatCard
          icon={ReceiptDollarIcon}
          label="Dues collected"
          value={naira(duesCollected)}
          hint={`${formatPercent01(duesCollected / duesTarget)} of the ${naira(duesTarget)} target`}
          tone="brand"
        />
        <StatCard
          icon={Wallet01Icon}
          label="Float held"
          value={naira(floatHeld)}
          hint="With reps, not yet paid out"
        />
        <StatCard
          icon={AlertCircleIcon}
          label="Overdue dues"
          value={naira(overdueAmount)}
          hint={`${overdueCount} accounts overdue`}
        />
      </div>

      <div className="mt-6">
        <TableCard
          title="Needs attention"
          subtitle={`${attentionItems.length} items waiting on an admin decision`}
        >
          <ul className="space-y-3">
            {attentionItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-cloud bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.tone}>{item.badge}</StatusBadge>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{item.detail}</p>
                </div>
                <Button variant="brand-outline" size="pill" asChild>
                  <Link href={item.href}>{item.linkLabel}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </TableCard>
      </div>
    </div>
  );
}
