"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GiftIcon, Shield01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "../../dashboard/_components/StatCard";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import { BRAND_INPUT } from "../../dashboard/_components/form-styles";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { Tabs } from "../_components/Tabs";
import { Switch } from "../_components/Switch";
import { naira, formatPercent01 } from "../_components/format";

type RiskTier = "low" | "medium" | "high";
type FlagStatus = "pending" | "paid" | "voided" | "clawed_back";

interface ReferralSummary {
  userId: string;
  userName: string;
  email: string;
  invited: number;
  joined: number;
  earned: number;
  riskTier: RiskTier;
}

interface FraudFlag {
  id: string;
  referrer: string;
  referred: string;
  label: string;
  description: string;
  amount: number;
  status: FlagStatus;
  date: string;
}

const summaries: ReferralSummary[] = [
  {
    userId: "user_901",
    userName: "Tunde Alao",
    email: "tunde.a@duevy.com",
    invited: 45,
    joined: 32,
    earned: 16000,
    riskTier: "high",
  },
  {
    userId: "user_442",
    userName: "Blessing Okafor",
    email: "blessing@duevy.com",
    invited: 12,
    joined: 8,
    earned: 4000,
    riskTier: "low",
  },
  {
    userId: "user_118",
    userName: "Musa Haruna",
    email: "musa.h@duevy.com",
    invited: 28,
    joined: 19,
    earned: 9500,
    riskTier: "medium",
  },
];

const initialFlags: FraudFlag[] = [
  {
    id: "FLG-801",
    referrer: "Tunde Alao",
    referred: "Tunde Alao (Alt 2)",
    label: "Self-referral ring",
    description: "Linked bank card matches the referrer's own account.",
    amount: 500,
    status: "pending",
    date: "2026-07-04 10:12",
  },
  {
    id: "FLG-802",
    referrer: "Emeka Obi",
    referred: "Chidi Benson",
    label: "Shared device",
    description: "Identical device fingerprints across rapid signups.",
    amount: 500,
    status: "pending",
    date: "2026-07-04 08:34",
  },
  {
    id: "FLG-803",
    referrer: "Zainab Sani",
    referred: "Haruna Bello",
    label: "Abnormal invite velocity",
    description: "Over 15 invites from a single IP within 10 minutes.",
    amount: 500,
    status: "paid",
    date: "2026-07-03 16:45",
  },
];

const RISK_TONES: Record<RiskTier, StatusTone> = {
  low: "ok",
  medium: "warn",
  high: "bad",
};

export default function AdminReferralsPage() {
  const [flags, setFlags] = useState<FraudFlag[]>(initialFlags);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"directory" | "flags">("directory");
  const [rewardEnabled, setRewardEnabled] = useState(true);
  const [rewardAmount, setRewardAmount] = useState(500);

  const invitesSent = 4820;
  const joinedCount = 2150;
  const rewardsPaid = summaries.reduce((s, u) => s + u.earned, 0);
  const pendingLiability = flags
    .filter((f) => f.status === "pending")
    .reduce((s, f) => s + f.amount, 0);
  const pendingFlags = flags.filter((f) => f.status === "pending").length;

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summaries.filter(
      (u) =>
        (q === "" ||
          u.userName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)) &&
        (riskFilter === "all" || u.riskTier === riskFilter),
    );
  }, [search, riskFilter]);

  const settleFlag = (id: string, action: "void" | "claw_back") => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: action === "void" ? ("voided" as const) : ("clawed_back" as const) }
          : f,
      ),
    );
    toast(`${id} ${action === "void" ? "voided" : "clawed back"}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Referrals"
        description="Growth funnel, reward payouts and the fraud flags on them."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={GiftIcon}
          label="Rewards paid"
          value={naira(rewardsPaid)}
          tone="brand"
        />
        <StatCard
          icon={Shield01Icon}
          label="Pending liability"
          value={naira(pendingLiability)}
          hint={`${pendingFlags} flagged rewards on hold`}
        />
        <StatCard
          icon={UserMultipleIcon}
          label="Join rate"
          value={formatPercent01(joinedCount / invitesSent)}
          hint={`${joinedCount.toLocaleString()} of ${invitesSent.toLocaleString()} invites joined`}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: "directory", label: "Referrers" },
              { value: "flags", label: `Fraud flags (${pendingFlags})` },
            ]}
          />

          {activeTab === "directory" && (
            <TableCard title="Referrers" subtitle="Invites, conversions and earnings per user">
              <div className="mb-4">
                <Toolbar>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or email…"
                  />
                  <FilterSelect
                    value={riskFilter}
                    onChange={setRiskFilter}
                    label="Filter by risk"
                    options={[
                      { value: "all", label: "All risk tiers" },
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                    ]}
                  />
                </Toolbar>
              </div>

              {filteredSummaries.length === 0 ? (
                <EmptyState
                  icon={GiftIcon}
                  title="No referrers match"
                  description="Try a different search or clear the filters."
                />
              ) : (
                <DataTable
                  headers={[
                    { label: "User" },
                    { label: "Invited" },
                    { label: "Joined" },
                    { label: "Earned" },
                    { label: "Risk" },
                  ]}
                >
                  {filteredSummaries.map((u) => (
                    <tr key={u.userId}>
                      <td className="p-4">
                        <p className="font-semibold text-ink">{u.userName}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">{u.email}</p>
                      </td>
                      <td className="p-4 font-medium">{u.invited}</td>
                      <td className="p-4 font-medium">{u.joined}</td>
                      <td className="p-4 font-semibold text-brand">{naira(u.earned)}</td>
                      <td className="p-4">
                        <StatusBadge tone={RISK_TONES[u.riskTier]}>{u.riskTier}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </TableCard>
          )}

          {activeTab === "flags" && (
            <TableCard
              title="Fraud flags"
              subtitle="Anomalies caught on referral rewards — void or claw back"
            >
              {flags.length === 0 ? (
                <EmptyState
                  icon={Shield01Icon}
                  title="No fraud flags"
                  description="Flagged referral rewards will show up here."
                />
              ) : (
                <ul className="space-y-3">
                  {flags.map((flag) => (
                    <li
                      key={flag.id}
                      className={`rounded-2xl border border-cloud bg-canvas p-4 ${
                        flag.status !== "pending" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={flag.status === "pending" ? "bad" : "neutral"}>
                              {flag.label}
                            </StatusBadge>
                            <span className="text-xs text-ink-soft">
                              {flag.date} · {flag.id}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-ink">
                            {flag.referrer}{" "}
                            <span className="font-normal text-ink-soft">referred</span>{" "}
                            {flag.referred}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-ink-soft">
                            {flag.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-ink">{naira(flag.amount)}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-ink-soft">
                            {flag.status.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      {flag.status === "pending" && (
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <Button
                            variant="brand-outline"
                            size="pill"
                            onClick={() => settleFlag(flag.id, "void")}
                          >
                            Void reward
                          </Button>
                          <Button
                            variant="danger"
                            size="pill"
                            onClick={() => settleFlag(flag.id, "claw_back")}
                          >
                            Claw back
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TableCard>
          )}
        </div>

        <TableCard title="Reward settings" subtitle="What a successful referral pays">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-cloud bg-canvas p-3.5">
              <div>
                <p className="text-[13px] font-semibold text-ink">Referral rewards</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Pause payouts platform-wide at any time.
                </p>
              </div>
              <Switch
                checked={rewardEnabled}
                onChange={setRewardEnabled}
                label="Toggle referral rewards"
              />
            </div>

            <div>
              <label
                htmlFor="reward-amount"
                className="mb-1.5 block text-xs font-semibold text-ink-soft"
              >
                Reward per join (₦)
              </label>
              <Input
                id="reward-amount"
                type="number"
                min={0}
                disabled={!rewardEnabled}
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value) || 0)}
                className={BRAND_INPUT}
              />
            </div>

            <Button
              variant="brand"
              size="pill"
              className="w-full"
              onClick={() =>
                toast(
                  rewardEnabled
                    ? `Referral reward set to ${naira(rewardAmount)} per join.`
                    : "Referral rewards paused.",
                )
              }
            >
              Save settings
            </Button>
          </div>
        </TableCard>
      </div>
    </div>
  );
}
