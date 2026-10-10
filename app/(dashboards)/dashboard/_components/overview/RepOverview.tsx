"use client";

import { useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddInvoiceIcon,
  CheckmarkSquare01Icon,
  Invoice01Icon,
  MoneySend01Icon,
  Notification03Icon,
  UserMultipleIcon,
  SquareLock01Icon,
  Wallet01Icon,
  Alert01Icon,
  AiChat01Icon,
  Building03Icon,
  UserGroup03Icon,
  MortarboardIcon,
  ArrowRight01Icon,
  ReceiptDollarIcon,
  MoneyAdd01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useRepOverview, useSpaceLedger } from "@/lib/api/queries";
import type { LedgerEntryType, RepOverview as RepOverviewData } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "../EmptyState";
import { nairaFromKobo } from "../format";
import { timeAgo } from "../notifications-data";
import { useRepSpace } from "../use-rep-space";
import {
  StatCard,
  QuickAction,
  PanelHeader,
  BalanceCard,
  BalanceCardButton,
  ActionRow,
  MiniStat,
} from "./OverviewUI";
import { KycBanner } from "./KycBanner";
import { OverviewBodySkeleton, Skeleton } from "../Skeleton";
import type { HugeIcon } from "../nav-config";
import { FEATURES } from "@/lib/features";

const LEDGER_META: Record<LedgerEntryType, { icon: HugeIcon; label: string }> = {
  due_payment: { icon: Invoice01Icon, label: "Due payment" },
  manual_credit: { icon: MoneyAdd01Icon, label: "Credit" },
  payout: { icon: MoneySend01Icon, label: "Withdrawal" },
  payout_fee: { icon: ReceiptDollarIcon, label: "Withdrawal fee" },
  payout_reversal: { icon: ArrowReloadHorizontalIcon, label: "Withdrawal reversed" },
  refund: { icon: ArrowReloadHorizontalIcon, label: "Refund" },
};
const LEDGER_FALLBACK = { icon: ReceiptDollarIcon as HugeIcon, label: "Transaction" };

export function RepOverview() {
  const { user } = useAuth();
  const repSpace = useRepSpace();
  const name = user?.name?.split(" ")[0] ?? "there";

  const spaceId = repSpace?.id;
  // Cached: coming back to the dashboard shows the last overview instantly
  // while it refreshes in the background.
  const overview = useRepOverview(spaceId);
  const data: RepOverviewData | null = overview.data ?? null;
  // No department resolved (e.g. student previewing) — don't hang on the skeleton.
  const loading = !!spaceId && overview.isPending;
  const error = overview.isError;

  useEffect(() => {
    if (overview.isError) toast.error("Couldn't load your department dashboard.");
  }, [overview.isError]);

  const spaceName = data?.space.name ?? repSpace?.name ?? "Your department";
  const spaceShort = data?.space.short ?? "";
  const ledger = useSpaceLedger(spaceId);
  const recentLedger = (ledger.data ?? []).slice(0, 6);
  const collectionRate = Math.round((data?.stats.collectionRate ?? 0) * 100);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Phones go straight to the hero card; the top bar already greets. */}
      <div className="hidden flex-col gap-1 sm:flex">
        <span className="inline-flex w-fit items-center rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep dashboard
        </span>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {spaceName}
        </h1>
        <p className="text-[13px] text-ink-soft">
          Hi {name} — here&apos;s how collections are going
          {spaceShort ? ` for ${spaceShort}` : ""}.
        </p>
      </div>

      {/* Heads-up until the space can collect and withdraw (KYC lives on /dashboard/payout). */}
      {repSpace && (
        <KycBanner spaceId={repSpace.id} isLead={repSpace.membership !== "co"} />
      )}

      {error && !loading ? (
        <EmptyState
          icon={Alert01Icon}
          title="Couldn't load your dashboard"
          description="Something went wrong reaching the server. Refresh the page to try again."
        />
      ) : loading ? (
        <OverviewBodySkeleton stats={4} />
      ) : (
        <>
          {/* Phones: banking-app home — collected total on the hero card. */}
          <div className="mt-2 sm:hidden">
            <BalanceCard
              doodle
              label="Collected"
              value={nairaFromKobo(data?.stats.collected ?? 0)}
              hint={`${collectionRate}% collection rate · ${data?.space.memberCount ?? 0} members`}
            >
              <div className="flex gap-2.5">
                <BalanceCardButton href="/dashboard/payout" icon={MoneySend01Icon} label="Withdraw" />
                <BalanceCardButton
                  href="/dashboard/create-dues"
                  icon={AddInvoiceIcon}
                  label="New due"
                  variant="ghost"
                />
              </div>
            </BalanceCard>

            {/* The four rep tools from the sidebar (pilot-gated ones excluded). */}
            <ActionRow
              actions={[
                { href: "/dashboard/create-dues", icon: AddInvoiceIcon, label: "Create dues" },
                { href: "/dashboard/circle", icon: UserGroup03Icon, label: "Circle" },
                { href: "/dashboard/payout", icon: MoneySend01Icon, label: "Payout" },
                { href: "/dashboard/manage", icon: Building03Icon, label: "Manage dept." },
              ]}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat
                label="Outstanding"
                value={nairaFromKobo(data?.stats.outstanding ?? 0)}
              />
              <Link href="/dashboard/circle" className="block active:opacity-80">
                <MiniStat label="Join code" value={data?.joinCode ?? "—"} />
              </Link>
            </div>
          </div>

          {/* Department KPIs. */}
          <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet01Icon}
              label="Collected"
              value={nairaFromKobo(data?.stats.collected ?? 0)}
              hint="Across active dues"
              tone="brand"
            />
            <StatCard
              icon={Invoice01Icon}
              label="Outstanding"
              value={nairaFromKobo(data?.stats.outstanding ?? 0)}
              hint={`${data?.stats.unpaidCount ?? 0} payments pending`}
            />
            <StatCard
              icon={UserMultipleIcon}
              label="Collection rate"
              value={`${collectionRate}%`}
              hint={`${data?.space.memberCount ?? 0} members`}
            />
            <Link
              href="/dashboard/circle"
              className="block rounded-3xl transition-opacity duration-300 hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <StatCard
                icon={SquareLock01Icon}
                label="Join code"
                value={data?.joinCode ?? "—"}
                hint="Share to add students"
              />
            </Link>
          </div>

          {/* Rep quick actions. */}
          <div className="mt-4 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/dashboard/create-dues"
              icon={AddInvoiceIcon}
              label="Create a due"
              hint="Raise a new charge"
            />
            <QuickAction
              href="/dashboard/create-dues"
              icon={Notification03Icon}
              label="Send reminders"
              hint="Nudge unpaid students"
            />
            <QuickAction
              href="/dashboard/payout"
              icon={MoneySend01Icon}
              label="Request payout"
              hint="Withdraw funds"
            />
            {FEATURES.polls && (
              <QuickAction
                href="/dashboard/polls"
                icon={CheckmarkSquare01Icon}
                label="Create a poll"
                hint="Set up award votes"
              />
            )}
            {FEATURES.assistant && (
              <QuickAction
                href="/dashboard/assistant"
                icon={AiChat01Icon}
                label="Chat with Duey"
                hint="Ask about your dues"
              />
            )}
          </div>

          {/* Department ledger — collections, withdrawals, fees and refunds. */}
          <section className="mt-6 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <PanelHeader title="Recent transactions" href="/dashboard/payout" />

            {ledger.isPending && spaceId ? (
              <ul className="mt-3 flex flex-col" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="mt-2 h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </li>
                ))}
              </ul>
            ) : recentLedger.length === 0 ? (
              <EmptyState
                icon={ReceiptDollarIcon}
                title={ledger.isError ? "Couldn't load transactions" : "No transactions yet"}
                description={
                  ledger.isError
                    ? "Something went wrong reaching the server. Refresh to try again."
                    : "Payments into your department and withdrawals will show up here."
                }
              />
            ) : (
              <ul className="mt-3 flex flex-col">
                {recentLedger.map((entry) => {
                  const isIn = entry.direction === "credit";
                  const meta = LEDGER_META[entry.type] ?? LEDGER_FALLBACK;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0"
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                          isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
                        }`}
                      >
                        <HugeiconsIcon icon={meta.icon} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {entry.description || meta.label}
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {meta.label} · {timeAgo(entry.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          isIn ? "text-brand" : "text-ink"
                        }`}
                      >
                        {isIn ? "+" : "−"}
                        {nairaFromKobo(Math.abs(entry.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Personal CTA — a rep is also a student with their own dues. */}
      <section className="relative mt-6 overflow-hidden rounded-3xl border border-brand/15 bg-cloud/70 p-4 sm:p-6">
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white">
              <HugeiconsIcon icon={MortarboardIcon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Your student account</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Pay your own dues and keep your receipts — you&apos;re a student too.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="brand" size="pill-lg" asChild className="flex-1 sm:flex-none">
              <Link href="/dashboard/dues">
                My dues
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </Button>
            <Button variant="brand-outline" size="pill-lg" asChild className="flex-1 bg-canvas sm:flex-none">
              <Link href="/dashboard/transactions">Receipts</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
