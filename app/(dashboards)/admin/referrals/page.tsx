"use client";

import React, { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Shield01Icon,
  Download01Icon,
  CancelCircleIcon,
  AlertCircleIcon,
  DatabaseIcon,
  MoreHorizontalIcon,
  ArrowDown01Icon,
  UserIcon,
  ValidationIcon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { formatMoneyNGN, formatPercent01 } from "../_components/format";

type FraudRiskTier = "low" | "medium" | "high";
type ReferralPayoutStatus = "paid" | "pending" | "voided" | "clawed_back";

interface PlatformFunnel {
  invitesSent: number;
  joined: number;
  earnedCount: number;
}

interface UserReferralSummary {
  userId: string;
  userName: string;
  email: string;
  totalInvited: number;
  totalJoined: number;
  totalEarned: number;
  riskTier: FraudRiskTier;
  flaggedCount: number;
}

interface ReferralFraudFlag {
  id: string;
  referrerName: string;
  referredName: string;
  flagType: "self_referral_ring" | "shared_device_or_card" | "abnormal_count";
  description: string;
  payoutAmount: number;
  status: ReferralPayoutStatus;
  dateFlagged: string;
}

const initialFunnel: PlatformFunnel = {
  invitesSent: 4820,
  joined: 2150,
  earnedCount: 1420,
};

const initialUserSummaries: UserReferralSummary[] = [
  { userId: "user_901", userName: "Tunde Alao", email: "tunde.a@duevy.com", totalInvited: 45, totalJoined: 32, totalEarned: 16000, riskTier: "high" },
  { userId: "user_442", userName: "Blessing Okafor", email: "blessing@duevy.com", totalInvited: 12, totalJoined: 8, totalEarned: 4000, riskTier: "low" },
  { userId: "user_118", userName: "Musa Haruna", email: "musa.h@duevy.com", totalInvited: 28, totalJoined: 19, totalEarned: 9500, riskTier: "medium" },
];

const initialFraudFlags: ReferralFraudFlag[] = [
  { id: "FLG-801", referrerName: "Tunde Alao", referredName: "Tunde Alao (Alt 2)", flagType: "self_referral_ring", description: "Linked bank card suffix matches existing primary account profile exactly.", payoutAmount: 500, status: "pending", dateFlagged: "2026-07-04 10:12" },
  { id: "FLG-802", referrerName: "Emeka Obi", referredName: "Chidi Benson", flagType: "shared_device_or_card", description: "Identical browser cookies & device hardware footprints detected across rapid onboarding chains.", payoutAmount: 500, status: "pending", dateFlagged: "2026-07-04 08:34" },
  { id: "FLG-803", referrerName: "Zainab Sani", referredName: "Haruna Bello", flagType: "abnormal_count", description: "User triggered over 15 invites from a single IP pool within a 10-minute window.", payoutAmount: 500, status: "paid", dateFlagged: "2026-07-03 16:45" },
];

export default function AdminReferralsPage() {
  const [funnelData] = useState<PlatformFunnel>(initialFunnel);
  const [userSummaries, setUserSummaries] = useState<UserReferralSummary[]>(initialUserSummaries);
  const [fraudFlags, setFraudFlags] = useState<ReferralFraudFlag[]>(initialFraudFlags);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  
  const [activeTab, setActiveTab] = useState<"directory" | "security">("directory");
  const [rewardAmount, setRewardAmount] = useState<number>(500);
  const [isRewardEnabled, setIsRewardEnabled] = useState<boolean>(true);

  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedModalUser, setSelectedModalUser] = useState<UserReferralSummary | null>(null);

  const joinedRate = useMemo(() => funnelData.invitesSent ? funnelData.joined / funnelData.invitesSent : 0, [funnelData]);
  const earnedRate = useMemo(() => funnelData.joined ? funnelData.earnedCount / funnelData.joined : 0, [funnelData]);

  const totalPayoutLiabilityPaid = useMemo(() => userSummaries.reduce((sum, u) => sum + u.totalEarned, 0), [userSummaries]);
  const totalPayoutLiabilityPending = useMemo(() => fraudFlags.filter(f => f.status === "pending").reduce((sum, f) => sum + f.payoutAmount, 0), [fraudFlags]);

  const filteredUserSummaries = useMemo(() => {
    return userSummaries.filter((u) => {
      const matchesSearch = u.userName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === "all" || u.riskTier === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [userSummaries, search, riskFilter]);

  const handleUpdateRewardConfig = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Platform Configuration Updated: Reward incentive set to ${isRewardEnabled ? `${rewardAmount} ₦` : "DISABLED"} platform-wide.`);
  };

  const handleClawbackOrVoid = (flagId: string, action: "void" | "claw_back") => {
    if (confirm(`Are you sure you want to execute a permanent ${action === "void" ? "void status" : "clawback override"} on this reward?`)) {
      setFraudFlags(prev => prev.map(f => {
        if (f.id === flagId) {
          const updatedStatus: ReferralPayoutStatus = action === "void" ? "voided" : "clawed_back";
          return { ...f, status: updatedStatus };
        }
        return f;
      }));

      const targetFlag = fraudFlags.find(f => f.id === flagId);
      if (targetFlag && action === "claw_back") {
        setUserSummaries(prev => prev.map(u => 
          u.userName === targetFlag.referrerName 
            ? { ...u, totalEarned: Math.max(0, u.totalEarned - targetFlag.payoutAmount) } 
            : u
        ));
      }
      alert(`Ledger Adjusted: Successfully logged the referral reward as ${action.toUpperCase()}.`);
    }
  };

  const getRiskTone = (tier: FraudRiskTier) => {
    if (tier === "low") return "ok";
    if (tier === "medium") return "warn";
    return "bad";
  };

  const getFlagLabel = (type: string) => {
    const maps: Record<string, string> = {
      self_referral_ring: "Self-Referral Ring",
      shared_device_or_card: "Shared Device/Card Multi",
      abnormal_count: "Abnormal Invite Velocity",
    };
    return maps[type] || "Velocity Spurt";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Referrals & Incentives"
        description="Monitor platform growth tracking funnels, manage third-party promotional campaign loops, audit device rings, and override growth reward payouts."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Gross Disbursed Rewards</p>
          <p className="mt-2 text-2xl font-bold text-ink">{formatMoneyNGN(totalPayoutLiabilityPaid)} NGN</p>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Pending / Held Payout Liability</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatMoneyNGN(totalPayoutLiabilityPending)} NGN</p>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Onboarding Funnel Joined Rate</p>
          <p className="mt-2 text-2xl font-bold text-brand">{formatPercent01(joinedRate)}</p>
          <span className="text-[10px] text-ink-soft mt-1 block">{funnelData.joined} from {funnelData.invitesSent} applications</span>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Conversion Earned Yield Rate</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatPercent01(earnedRate)}</p>
          <span className="text-[10px] text-ink-soft mt-1 block">{funnelData.earnedCount} converted active paid spaces</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-start">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex border-b border-cloud text-sm">
            <button onClick={() => setActiveTab("directory")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "directory" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
              User History Directory
            </button>
            <button onClick={() => setActiveTab("security")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "security" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
              Security & Fraud Flags ({fraudFlags.filter(f => f.status === "pending").length})
            </button>
          </div>

          {activeTab === "directory" && (
            <TableCard title="User Growth Records" subtitle="Search historical milestones, verified conversions, and generated bonus items per account file.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between my-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
                    <HugeiconsIcon icon={Search01Icon} size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by profile name or email string..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                  />
                </div>
                <div className="relative inline-block">
                  <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs">
                    <option value="all">All Growth Risk Tiers</option>
                    <option value="low">Low Risk Profiles</option>
                    <option value="medium">Medium Flagged Profiles</option>
                    <option value="high">High Risk Exceptions</option>
                  </select>
                  <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
                  </span>
                </div>
              </div>

              <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
                    <tr>
                      <th className="p-4 align-middle">User Profile Identity</th>
                      <th className="p-4 align-middle">Invites Dispatched</th>
                      <th className="p-4 align-middle">Onboarded Joined Nodes</th>
                      <th className="p-4 align-middle">Earned Yield Balance</th>
                      <th className="p-4 align-middle">Risk Score standing</th>
                      <th className="p-4 align-middle text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
                    {filteredUserSummaries.map((u) => (
                      <tr key={u.userId} onClick={() => setSelectedModalUser(u)} className="hover:bg-paper/20 cursor-pointer transition-colors">
                        <td className="p-4 align-middle">
                          <div className="font-bold text-ink">{u.userName}</div>
                          <div className="text-[11px] text-ink-soft mt-0.5">{u.email} • <span className="font-mono">{u.userId}</span></div>
                        </td>
                        <td className="p-4 align-middle font-semibold text-ink">{u.totalInvited} Sent</td>
                        <td className="p-4 align-middle font-semibold text-ink">{u.totalJoined} Converted</td>
                        <td className="p-4 align-middle font-bold text-emerald-600">+{formatMoneyNGN(u.totalEarned)} ₦</td>
                        <td className="p-4 align-middle">
                          <StatusBadge tone={getRiskTone(u.riskTier)}>{u.riskTier}</StatusBadge>
                        </td>
                        <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveDropdownRowId(activeDropdownRowId === u.userId ? null : u.userId)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                          </button>
                          {activeDropdownRowId === u.userId && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                              <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedModalUser(u); setActiveDropdownRowId(null); }}
                                  className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper text-ink cursor-pointer block"
                                >
                                  View Verification Risk File
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}

          {activeTab === "security" && (
            <TableCard title="Risk Audit Pipeline" subtitle="Automated scripts capture anomaly devices, duplicate payouts, and self-referral arrays.">
              <div className="space-y-3 mt-3 max-h-[580px] overflow-y-auto pr-1">
                {fraudFlags.map((flag) => (
                  <div key={flag.id} className={`border rounded-2xl p-4 space-y-3 bg-canvas ${flag.status === "pending" ? "border-rose-200 bg-rose-50/[0.01]" : "border-cloud/60 opacity-70 bg-paper/20"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                          {getFlagLabel(flag.flagType)}
                        </span>
                        <h4 className="text-sm font-bold text-ink mt-1">
                          {flag.referrerName} <span className="font-medium text-ink-soft">referred</span> {flag.referredName}
                        </h4>
                        <p className="text-[11px] text-ink-soft">{flag.dateFlagged} • Code: <span className="font-mono">{flag.id}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-ink block">{formatMoneyNGN(flag.payoutAmount)} ₦</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${flag.status === "pending" ? "text-amber-600" : "text-ink-soft"}`}>
                          Status: {flag.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-ink-soft border border-cloud bg-paper/30 p-2.5 rounded-xl">{flag.description}</p>
                    {flag.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => handleClawbackOrVoid(flag.id, "void")} className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer">
                          Void Pending Payout
                        </button>
                        <button type="button" onClick={() => handleClawbackOrVoid(flag.id, "claw_back")} className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 ml-auto cursor-pointer">
                          Execute Balance Clawback
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TableCard>
          )}
        </div>

        <div className="space-y-6">
          <TableCard title="Incentive Adjustments" subtitle="Configure system parameters for platform growth campaigns platform-wide.">
            <form onSubmit={handleUpdateRewardConfig} className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-cloud rounded-xl bg-paper/20">
                <div>
                  <span className="text-xs font-bold text-ink block">Referral Campaign Status</span>
                  <span className="text-[11px] text-ink-soft">Instantly toggle growth bonuses.</span>
                </div>
                <input
                  type="checkbox"
                  checked={isRewardEnabled}
                  onChange={(e) => setIsRewardEnabled(e.target.checked)}
                  className="rounded text-brand focus:ring-brand h-4 w-4 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-soft block mb-1">₦-for-₦ Payout Amount (NGN)</label>
                <div className="relative">
                  <input
                    type="number"
                    disabled={!isRewardEnabled}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                    placeholder="500"
                    className="w-full text-xs rounded-lg border border-cloud p-2.5 outline-none focus:border-brand bg-paper/30 text-ink disabled:opacity-50"
                  />
                  <span className="absolute right-3 inset-y-0 flex items-center text-[11px] font-semibold text-ink-soft">Per Join Conversion</span>
                </div>
              </div>

              <div className="rounded-xl border border-cloud bg-paper/40 p-3 text-[11px] text-ink-soft flex items-start gap-1.5">
                <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-brand shrink-0 mt-0.5" />
                Updating this figure shifts the target value parameters for onboarding validations instantly across all institutional portals.
              </div>

              <button type="submit" className="w-full py-2.5 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand/90 transition-colors inline-flex items-center justify-center gap-1 shadow-sm shadow-brand/10">
                <HugeiconsIcon icon={DatabaseIcon} size={14} /> Commit Reward Settings
              </button>
            </form>
          </TableCard>

          <div className="border border-cloud bg-canvas p-4 rounded-3xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
              <HugeiconsIcon icon={Shield01Icon} size={14} className="text-brand" />
              Growth Fraud Policy
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              When a referral ring is confirmed, use the <b>Execute Balance Clawback</b> action to automatically adjust balances or void entries from permanent audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* --- shadcn Overlay Profile Dialog Modal --- */}
      {selectedModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedModalUser(null)} />
          <div className="relative w-full max-w-2xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-cloud">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cloud flex items-center justify-center text-brand shrink-0">
                  <HugeiconsIcon icon={UserIcon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">{selectedModalUser.userName}</h3>
                  <p className="text-xs text-ink-soft">{selectedModalUser.email} • Growth Profile Tracker</p>
                </div>
              </div>
              <button onClick={() => setSelectedModalUser(null)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft font-semibold cursor-pointer">✕</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="p-4 border border-cloud rounded-xl bg-paper/10 space-y-1">
                <span className="text-ink-soft font-semibold uppercase tracking-wider text-[10px] block">Security Standing</span>
                <div className="text-sm font-bold text-ink">Risk Classification: <span className="capitalize">{selectedModalUser.riskTier}</span></div>
                <p className="text-[11px] text-ink-soft mt-1">Platform monitoring flagged <b>{selectedModalUser.flaggedCount} anomaly events</b> inside self-referral rings or device multi-logs.</p>
              </div>

              <div className="p-4 border border-cloud rounded-xl bg-paper/10 space-y-2">
                <span className="text-ink-soft font-semibold uppercase tracking-wider text-[10px] block font-mono">Platform Incentive Override</span>
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Campaign Incentive Status:</span>
                  <StatusBadge tone={isRewardEnabled ? "ok" : "neutral"}>{isRewardEnabled ? "Enabled" : "Disabled"}</StatusBadge>
                </div>
                <div className="text-ink-soft">System conversion rate value: <b>{rewardAmount} ₦</b></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Triggered System Flag Items</span>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {fraudFlags.filter(f => f.referrerName === selectedModalUser.userName).map((flag) => (
                  <div key={flag.id} className="p-3 border border-cloud rounded-xl bg-canvas text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-100 rounded text-[10px]">{getFlagLabel(flag.flagType)}</span>
                      <span className="text-ink">{formatMoneyNGN(flag.payoutAmount)} ₦</span>
                    </div>
                    <p className="text-[11px] text-ink-soft leading-relaxed font-medium">{flag.description}</p>
                    {flag.status === "pending" && (
                      <div className="flex gap-1.5 pt-1">
                        <button type="button" onClick={() => handleClawbackOrVoid(flag.id, "void")} className="px-2.5 py-1 text-[11px] font-semibold border border-cloud rounded-lg bg-canvas text-ink-soft hover:bg-paper cursor-pointer">Void</button>
                        <button type="button" onClick={() => handleClawbackOrVoid(flag.id, "claw_back")} className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 ml-auto cursor-pointer">Clawback</button>
                      </div>
                    )}
                  </div>
                ))}
                {fraudFlags.filter(f => f.referrerName === selectedModalUser.userName).length === 0 && (
                  <p className="text-xs italic text-ink-soft p-2">No active pending anomaly vectors detected within this user structure.</p>
                )}
              </div>
            </div>

            {/* FIXED THE ERROR HERE: Properly formatted and isolated all class quotes
            <div className="flex justify-end pt-2 border-t border-cloud">
              <button 
                type="button" 
                onClick={() => setSelectedModalUser(null)} 
                className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer transition-colors"
              >
                Close Overview
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}