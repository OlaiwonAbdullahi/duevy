"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GiftIcon, Shield01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StatCard } from "../../dashboard/_components/StatCard";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { Tabs } from "../_components/Tabs";
import { nairaFromKobo } from "../_components/format";
import { ApiError } from "@/lib/api/errors";
import {
  listReferralSummaries,
  listReferralFlags,
  resolveReferralFlag,
  type ReferralSummary,
  type ReferralFlag,
  type ReferralFlagStatus,
} from "@/lib/api/admin";

type RiskTier = ReferralSummary["riskTier"];

const RISK_TONES: Record<RiskTier, StatusTone> = {
  low: "ok",
  medium: "warn",
  high: "bad",
};

const RESOLVE_STATUS: Record<"approve" | "void" | "claw_back", ReferralFlagStatus> = {
  approve: "paid",
  void: "voided",
  claw_back: "clawed_back",
};

const RESOLVE_LABEL: Record<"approve" | "void" | "claw_back", string> = {
  approve: "approved",
  void: "voided",
  claw_back: "clawed back",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "flags">("directory");

  const [summaries, setSummaries] = useState<ReferralSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const [flags, setFlags] = useState<ReferralFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [busyFlagId, setBusyFlagId] = useState<string | null>(null);

  useEffect(() => {
    listReferralSummaries({ perPage: 100 })
      .then(({ data }) => setSummaries(data))
      .catch(() => toast.error("Couldn't load referrers."))
      .finally(() => setSummariesLoading(false));
  }, []);

  useEffect(() => {
    listReferralFlags({ perPage: 100 })
      .then(({ data }) => setFlags(data))
      .catch(() => toast.error("Couldn't load fraud flags."))
      .finally(() => setFlagsLoading(false));
  }, []);

  const invited = summaries.reduce((s, u) => s + u.invited, 0);
  const joined = summaries.reduce((s, u) => s + u.joined, 0);
  const rewardsPaid = summaries.reduce((s, u) => s + u.earned, 0);
  const pendingFlags = flags.filter((f) => f.status === "pending");
  const pendingLiability = pendingFlags.reduce((s, f) => s + f.amount, 0);

  const filteredSummaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summaries.filter(
      (u) =>
        (q === "" ||
          u.userName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)) &&
        (riskFilter === "all" || u.riskTier === riskFilter),
    );
  }, [summaries, search, riskFilter]);

  async function settleFlag(flag: ReferralFlag, action: "approve" | "void" | "claw_back") {
    setBusyFlagId(flag.id);
    try {
      await resolveReferralFlag(flag.id, { action });
      const nextStatus = RESOLVE_STATUS[action];
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, status: nextStatus } : f)));
      toast.success(`${flag.id} ${RESOLVE_LABEL[action]}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't settle this flag.");
    } finally {
      setBusyFlagId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Referrals"
        description="Growth funnel, reward payouts and the fraud flags on them."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={GiftIcon} label="Rewards paid" value={nairaFromKobo(rewardsPaid)} tone="brand" />
        <StatCard
          icon={Shield01Icon}
          label="Pending liability"
          value={nairaFromKobo(pendingLiability)}
          hint={`${pendingFlags.length} flagged rewards on hold`}
        />
        <StatCard
          icon={UserMultipleIcon}
          label="Join rate"
          value={invited ? `${Math.round((joined / invited) * 100)}%` : "—"}
          hint={`${joined.toLocaleString()} of ${invited.toLocaleString()} invites joined`}
        />
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: "directory", label: "Referrers" },
          { value: "flags", label: `Fraud flags (${pendingFlags.length})` },
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

          {summariesLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
              ))}
            </div>
          ) : filteredSummaries.length === 0 ? (
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
                  <td className="p-4 font-semibold text-brand">{nairaFromKobo(u.earned)}</td>
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
          {flagsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-paper" />
              ))}
            </div>
          ) : flags.length === 0 ? (
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
                          {formatDate(flag.date)} · {flag.id}
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
                      <p className="text-sm font-semibold text-ink">{nairaFromKobo(flag.amount)}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-soft">
                        {flag.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  {flag.status === "pending" && (
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="brand"
                        size="pill"
                        disabled={busyFlagId === flag.id}
                        onClick={() => settleFlag(flag, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="brand-outline"
                        size="pill"
                        disabled={busyFlagId === flag.id}
                        onClick={() => settleFlag(flag, "void")}
                      >
                        Void reward
                      </Button>
                      <Button
                        variant="danger"
                        size="pill"
                        disabled={busyFlagId === flag.id}
                        onClick={() => settleFlag(flag, "claw_back")}
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
  );
}
