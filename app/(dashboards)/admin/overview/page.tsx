"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserIcon,
  Settings01Icon,
  Notification01Icon,
  TrendingUpDownIcon,
  DatabaseIcon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import { formatMoneyNGN, formatPercent01 } from "../_components/format";
import { mockDepartments, mockReps } from "../_components/MockData";
import AttentionModal from "../_components/AttentionModal";

type ToastTone = "ok" | "warn" | "bad";

function toneForCollectionRate(rate: number): ToastTone {
  if (rate >= 0.85) return "ok";
  if (rate >= 0.7) return "warn";
  return "bad";
}

function statusLabelForCollectionRate(rate: number) {
  if (rate >= 0.85) return "Strong";
  if (rate >= 0.7) return "Watch";
  return "At risk";
}

function toneClasses(tone: ToastTone) {
  switch (tone) {
    case "ok":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-800";
    case "warn":
      return "border-amber-500/20 bg-amber-500/10 text-amber-800";
    case "bad":
      return "border-rose-500/20 bg-rose-500/10 text-rose-800";
    default:
      return "border-cloud bg-paper/40 text-ink-soft";
  }
}

function iconLabel(kind: string) {
  switch (kind) {
    case "failed_payout":
    case "pending_payout":
      return "Payout";
    case "flagged_account":
    case "frozen_account":
      return "Accounts";
    case "unresolved_dispute":
      return "Disputes";
    case "low_rep_rate":
      return "Reps";
    case "referral_fraud":
      return "Referrals";
    default:
      return "Alert";
  }
}

function StatCard({
  label,
  hint,
  icon,
  value,
}: {
  label: string;
  hint?: string;
  icon: typeof Home01Icon;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
      </div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [activeTab, setActiveTab] = useState<"all" | "attention">("attention");

  const derived = useMemo(() => {
    const totalUsers = 1280;
    const totalActiveReps = mockReps.filter((r) => r.status === "active").length;
    const totalSpaces = mockDepartments.length; // Alias for administrative units

    const totalDuesCollectedAllTime = mockDepartments.reduce(
      (sum, d) => sum + d.collectedAmount,
      0,
    );
    const totalDuesCollectedThisMonth = 342000; // Added new state metric requirement
    const floatHeld = mockReps.reduce((sum, r) => sum + r.heldAmount, 0);
    const totalPayoutsThisMonth = 845000;

    // Overdue dues KPIs metrics parameters
    const overdueDuesCount = 42; 
    const overdueDuesAmount = 186000;

    // Referral liability metrics configurations
    const referralRewardsPaid = 55000;
    const referralRewardsPending = 15000;

    const expectedTermDue = mockDepartments.reduce(
      (sum, d) => sum + d.duesTarget,
      0,
    );
    const collectionRateTerm = expectedTermDue
      ? totalDuesCollectedAllTime / expectedTermDue
      : 0;

    const failedPayouts = 2;
    const pendingPayoutRequests = 3;
    const flaggedAccounts = 1;
    const frozenAccounts = 1;
    const unresolvedDisputes = 2;
    const referralFraudFlags = 3; // Added missing parameter configuration

    const lowRateReps = mockReps.filter((r) => r.collectionRate < 0.5);

    const attentionItems = [
      {
        id: "failed_payout",
        kind: "failed_payout",
        tone: "bad" as const,
        title: `${failedPayouts} payout(s) failed`,
        detail: "Re-attempt and verify payout records.",
        quickAction: { label: "Review payouts", href: "/admin/transactions" },
      },
      {
        id: "pending_payout",
        kind: "pending_payout",
        tone: "warn" as const,
        title: `${pendingPayoutRequests} payout request(s) pending`,
        detail: "Confirm collection closure and release queued payouts.",
        quickAction: { label: "Go to pending", href: "/admin/transactions" },
      },
      {
        id: "flagged_account",
        kind: "flagged_account",
        tone: "warn" as const,
        title: `${flaggedAccounts} account(s) flagged`,
        detail: "Verify rep activity and transactions.",
        quickAction: { label: "Open fraud view", href: "/admin/fraud" },
      },
      {
        id: "frozen_account",
        kind: "frozen_account",
        tone: "bad" as const,
        title: `${frozenAccounts} account(s) frozen`,
        detail: "Review holds and reinstate if verified.",
        quickAction: { label: "Open fraud view", href: "/admin/fraud" },
      },
      {
        id: "unresolved_dispute",
        kind: "unresolved_dispute",
        tone: "warn" as const,
        title: `${unresolvedDisputes} dispute(s) unresolved`,
        detail: "Decide outcomes to prevent repeated holds.",
        quickAction: { label: "Open disputes", href: "/admin/disputes" },
      },
      {
        id: "low_rep_rate",
        kind: "low_rep_rate",
        tone: lowRateReps.length ? ("bad" as const) : ("ok" as const),
        title: lowRateReps.length
          ? `${lowRateReps.length} rep(s) with unusually low collection rate`
          : "No low-rate reps",
        detail: lowRateReps.length
          ? "Inspect member dues and collection cadence."
          : "All reps are within expected ranges.",
        quickAction: { label: "Open reps", href: "/admin/reps" },
      },
      {
        id: "referral_fraud",
        kind: "referral_fraud",
        tone: "warn" as const,
        title: `${referralFraudFlags} referral-fraud flags identified`,
        detail: "Inspect rapid single-IP account creation chains.",
        quickAction: { label: "Review referrals", href: "/admin/fraud" },
      },
    ];

    const alertsCount = attentionItems.filter((a) => a.tone !== "ok").length;

    const collectionRateMonth = Math.max(
      0.55,
      Math.min(0.98, collectionRateTerm - 0.08),
    );

    const trend = [
      { label: "90d", volume: 520, signups: 88 },
      { label: "60d", volume: 610, signups: 102 },
      { label: "30d", volume: 720, signups: 121 },
      { label: "Now", volume: 790, signups: 138 },
    ];

    return {
      totalUsers,
      totalActiveReps,
      totalSpaces,
      totalDuesCollectedAllTime,
      totalDuesCollectedThisMonth,
      floatHeld,
      totalPayoutsThisMonth,
      overdueDuesCount,
      overdueDuesAmount,
      referralRewardsPaid,
      referralRewardsPending,
      collectionRateTerm,
      collectionRateMonth,
      attentionItems,
      alertsCount,
      trend,
    };
  }, []);

  const showAttention = activeTab === "attention";
  const items = showAttention
    ? derived.attentionItems.filter((a) => a.tone !== "ok")
    : derived.attentionItems;

  const [attentionModalOpen, setAttentionModalOpen] = useState(false);
  const [attentionModalItemId, setAttentionModalItemId] = useState<string | null>(null);

  const attentionModalItem = useMemo(() => {
    if (!attentionModalItemId) return null;
    return derived.attentionItems.find((a) => a.id === attentionModalItemId) ?? null;
  }, [attentionModalItemId, derived.attentionItems]);

  function openAttentionModal(itemId?: string) {
    setAttentionModalItemId(itemId ?? null);
    setAttentionModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
      <PageHeader
        title="Overview"
        description="Platform health snapshot — fast signals for admin actions."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("attention");
                openAttentionModal();
              }}
              className={
                "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none " +
                (activeTab === "attention"
                  ? "border-cloud bg-paper/70 text-ink"
                  : "border-cloud/70 bg-paper/30 text-ink-soft hover:bg-paper/50")
              }
            >
              <HugeiconsIcon icon={Home01Icon} size={22} strokeWidth={2} />
              Attention
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setAttentionModalOpen(false);
              }}
              className={
                "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none " +
                (activeTab === "all"
                  ? "border-cloud bg-paper/70 text-ink"
                  : "border-cloud/70 bg-paper/30 text-ink-soft hover:bg-paper/50")
              }
            >
              <HugeiconsIcon icon={Settings01Icon} size={22} strokeWidth={2} />
              All
            </button>
          </div>
        }
      />

      {/* Hero Metrics KPI Grid Layer */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Total users"
          hint="Registered accounts"
          icon={DatabaseIcon}
          value={derived.totalUsers}
        />
        <StatCard
          label="Total active reps"
          hint="Verified + operational"
          icon={UserIcon}
          value={derived.totalActiveReps}
        />
        <StatCard
          label="Total spaces"
          hint="Active groups & collectives"
          icon={Settings01Icon}
          value={derived.totalSpaces}
        />
        <StatCard
          label="Total dues collected (All-Time)"
          hint="Across all portal spaces"
          icon={Home01Icon}
          value={`${formatMoneyNGN(derived.totalDuesCollectedAllTime)} NGN`}
        />
        <StatCard
          label="Total dues collected (This Month)"
          hint="Current monthly run-rate"
          icon={Home01Icon}
          value={`${formatMoneyNGN(derived.totalDuesCollectedThisMonth)} NGN`}
        />
        <StatCard
          label="Total float held"
          hint="Unpaid / with reps & pools"
          icon={Settings01Icon}
          value={`${formatMoneyNGN(derived.floatHeld)} NGN`}
        />
        <StatCard
          label="Total payouts this month"
          hint="Released to space wallets"
          icon={Home01Icon}
          value={`${formatMoneyNGN(derived.totalPayoutsThisMonth)} NGN`}
        />
        <StatCard
          label="Overdue dues platform-wide"
          hint={`${derived.overdueDuesCount} accounts currently default`}
          icon={Notification01Icon}
          value={`${formatMoneyNGN(derived.overdueDuesAmount)} NGN`}
        />
        <StatCard
          label="Referral liability line"
          hint={`${formatMoneyNGN(derived.referralRewardsPending)} NGN pending status`}
          icon={Settings01Icon}
          value={`${formatMoneyNGN(derived.referralRewardsPaid)} NGN`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* 1. Trends Analytics Module */}
        <TableCard
          title={
            <div className="flex items-center gap-2">
              <span>Trends</span>
              <span className="p-1.5 rounded-lg bg-brand/10 text-brand inline-flex items-center justify-center">
                <HugeiconsIcon icon={TrendingUpDownIcon} size={16} strokeWidth={2.5} />
              </span>
            </div>
          }
          subtitle="Transaction volume & new signups"
        >
          <div className="mt-4 max-h-[340px] overflow-y-auto pr-1 space-y-4">
            {derived.trend.map((p, idx) => {
              const maxVolume = Math.max(...derived.trend.map((x) => x.volume));
              const maxSignups = Math.max(...derived.trend.map((x) => x.signups));
              const vPct = maxVolume ? p.volume / maxVolume : 0;
              const sPct = maxSignups ? p.signups / maxSignups : 0;

              return (
                <div
                  key={p.label}
                  className="rounded-2xl border border-cloud bg-paper/30 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="text-sm font-semibold text-ink">
                      {p.label}
                    </div>
                    <div className="text-[12px] text-ink-soft">
                      Volume {p.volume} · Signups {p.signups}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] font-semibold text-ink-soft">
                        Volume
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-cloud">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${Math.round(vPct * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-ink-soft">
                        Signups
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-cloud">
                        <div
                          className="h-2 rounded-full bg-emerald-500/70"
                          style={{ width: `${Math.round(sPct * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {idx === 0 ? null : (
                    <div className="mt-2 text-[12px] text-ink-soft">
                      {"↗"} signal improving vs prior bucket
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TableCard>

        {/* 2. Collection Rate Module */}
        <TableCard
          title="Collection rate"
          subtitle="Expected dues vs collected"
        >
          <div className="mt-3 max-h-[340px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cloud bg-paper/30 p-3">
                <div className="text-[12px] font-semibold text-ink-soft">
                  This semester
                </div>
                <div className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
                  {formatPercent01(derived.collectionRateTerm)}
                </div>
                <div className="mt-2">
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold " +
                      toneClasses(toneForCollectionRate(derived.collectionRateTerm))
                    }
                  >
                    {statusLabelForCollectionRate(derived.collectionRateTerm)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-cloud bg-paper/30 p-3">
                <div className="text-[12px] font-semibold text-ink-soft">
                  This month
                </div>
                <div className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
                  {formatPercent01(derived.collectionRateMonth)}
                </div>
                <div className="mt-2">
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold " +
                      toneClasses(toneForCollectionRate(derived.collectionRateMonth))
                    }
                  >
                    {statusLabelForCollectionRate(derived.collectionRateMonth)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-cloud bg-paper/30 p-3">
              <div className="text-[12px] font-semibold text-ink-soft">
                Admin hint
              </div>
              <div className="mt-2 text-[13px] text-ink-soft">
                If collection rate drops, address low-rate reps and pending
                payouts first.
              </div>
            </div>
          </div>
        </TableCard>

        {/* 3. Alerts & Attention Feed Module */}
        <TableCard
          title="Alerts & attention"
          subtitle={`Priority items · ${derived.alertsCount} requiring action`}
        >
          <div className="rounded-2xl border border-cloud bg-paper/30">
            <div className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-500/10 text-rose-500">
                  <HugeiconsIcon icon={Notification01Icon} size={18} strokeWidth={2} />
                </div>
                <div className="text-sm font-semibold text-ink">Attention feed</div>
              </div>
              <div className="text-[12px] text-ink-soft">Scroll</div>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-3 pt-0 pr-1">
              <div className="space-y-3">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-cloud bg-paper/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold " +
                              toneClasses(a.tone as ToastTone)
                            }
                          >
                            {iconLabel(a.kind)}
                          </span>
                          <div className="min-w-0 truncate text-sm font-semibold text-ink">
                            {a.title}
                          </div>
                        </div>
                        <div className="mt-1 text-[12px] text-ink-soft">
                          {a.detail}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openAttentionModal(a.id)}
                        className="rounded-2xl bg-ink/10 px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/15"
                      >
                        View details
                      </button>

                      <a
                        href={a.quickAction.href}
                        className="rounded-2xl bg-ink/10 px-4 py-2 text-sm font-semibold text-ink-soft"
                      >
                        {a.quickAction.label}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {!items.length ? (
                <div className="rounded-2xl border border-cloud bg-paper/30 p-3 text-[13px] text-ink-soft">
                  No attention items right now.
                </div>
              ) : null}
            </div>
          </div>
        </TableCard>
      </div>

      {/* 4. Action Shortcuts / Quick Links Section */}
      <div className="mt-4">
        <TableCard
          title="Quick links"
          subtitle="Jump directly into operational tabs that require triage"
        >
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/transactions"
              className="rounded-2xl border border-cloud bg-paper/30 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper/60 transition-colors"
            >
              {mockReps.length} payout-related items
            </a>
            <a
              href="/admin/disputes"
              className="rounded-2xl border border-cloud bg-paper/30 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper/60 transition-colors"
            >
              2 dispute(s) pending review
            </a>
            <a
              href="/admin/fraud"
              className="rounded-2xl border border-cloud bg-paper/30 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper/60 transition-colors"
            >
              5 fraud & account checks
            </a>
            <a
              href="/admin/reps"
              className="rounded-2xl border border-cloud bg-paper/30 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper/60 transition-colors"
            >
              {mockReps.filter((r) => r.collectionRate < 0.5).length} low-rate reps
            </a>
          </div>

          <div className="mt-3 text-[12px] text-ink-soft">
            Alerts feed loops include direct shortcuts to clear critical validation targets.
          </div>
        </TableCard>
      </div>

      <AttentionModal
        open={attentionModalOpen}
        onClose={() => {
          setAttentionModalOpen(false);
          setAttentionModalItemId(null);
        }}
        title={attentionModalItem?.title ?? "Attention items"}
        subtitle={
          attentionModalItem?.detail ??
          "Review and take action on flagged items."
        }
        badgeTone={attentionModalItem?.tone ?? ("warn" as const)}
        badgeText={attentionModalItem ? "Attention" : "Overview"}
        actions={
          attentionModalItem ? (
            <a
              href={attentionModalItem.quickAction.href}
              className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/80"
            >
              {attentionModalItem.quickAction.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("attention")}
              className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/80"
            >
              Show attention list
            </button>
          )
        }
      >
        {attentionModalItem ? (
          <div className="space-y-2 text-[13px] text-ink-soft">
            <div>
              <span className="font-semibold text-ink">What:</span>{" "}
              {attentionModalItem.detail}
            </div>
            <div>
              <span className="font-semibold text-ink">Recommended:</span>{" "}
              {attentionModalItem.quickAction.label}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-[13px] text-ink-soft">
            <div>
              You have {derived.alertsCount} item(s) requiring action. Select a
              card or click an item's quick action to proceed.
            </div>
            <div className="rounded-2xl border border-cloud bg-paper/40 p-3">
              Tip: use <span className="font-semibold">View details</span> on a
              specific alert card for more context.
            </div>
          </div>
        )}
      </AttentionModal>
    </div>
  );
}