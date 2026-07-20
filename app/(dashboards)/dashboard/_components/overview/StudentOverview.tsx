"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  ReceiptDollarIcon,
  Invoice01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  UserAdd01Icon,
  Alert01Icon,
  AiChat01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { getStudentOverview } from "@/lib/api/me";
import type { StudentOverview as StudentOverviewData } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "../EmptyState";
import { nairaFromKobo } from "../format";
import {
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "../../dues/_components/data";
import { TXN_META, formatTime } from "../../transactions/_components/data";
import type { HugeIcon } from "../nav-config";
import { StatCard, QuickAction, PanelHeader } from "./OverviewUI";

const TXN_FALLBACK = { icon: ReceiptDollarIcon as HugeIcon, label: "Activity" };
function txnMeta(type: string) {
  return (TXN_META as Record<string, { icon: HugeIcon; label: string }>)[type] ?? TXN_FALLBACK;
}

export function StudentOverview() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "there";

  const [data, setData] = useState<StudentOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const overview = await getStudentOverview();
        if (!cancelled) setData(overview);
      } catch {
        if (!cancelled) {
          setError(true);
          toast.error("Couldn't load your dashboard. Pull to refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Overdue first, then soonest deadline — matches the old mock ordering.
  const openDues = useMemo(() => {
    const dues = data?.openDues ?? [];
    return [...dues].sort((a, b) => {
      const rank = (s: string) => (s === "overdue" ? 0 : 1);
      return rank(a.status) - rank(b.status) || +new Date(a.dueDate) - +new Date(b.dueDate);
    });
  }, [data]);

  const overdueCount = useMemo(
    () => (data?.openDues ?? []).filter((d) => d.status === "overdue").length,
    [data],
  );

  const recent = data?.recentTransactions ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-[13px] text-ink-soft">
            Your dues and payments at a glance.
          </p>
        </div>
        <Link
          href="/dashboard/assistant"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
        >
          <HugeiconsIcon icon={AiChat01Icon} size={16} />
          Chat with Duey
        </Link>
      </div>

      {error && !loading ? (
        <EmptyState
          icon={Alert01Icon}
          title="Couldn't load your dashboard"
          description="Something went wrong reaching the server. Refresh the page to try again."
        />
      ) : loading ? (
        <OverviewSkeleton />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Invoice01Icon}
              label="Outstanding dues"
              value={nairaFromKobo(data?.outstanding.amount ?? 0)}
              hint={`${data?.outstanding.count ?? 0} due${
                data?.outstanding.count === 1 ? "" : "s"
              } awaiting payment`}
            />
            <StatCard
              icon={ReceiptDollarIcon}
              label="Paid this session"
              value={nairaFromKobo(data?.paidThisSession ?? 0)}
              hint="Across your settled dues"
            />
            <StatCard
              icon={Alert01Icon}
              label="Overdue"
              value={String(overdueCount)}
              hint={overdueCount === 0 ? "You're all caught up" : "Needs attention"}
              tone="brand"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              href="/dashboard/dues"
              icon={Invoice01Icon}
              label="Pay dues"
              hint="Settle what you owe"
            />
            <QuickAction
              href="/dashboard/dues#join"
              icon={UserAdd01Icon}
              label="Join a department"
              hint="Enter a code to join"
            />
            <QuickAction
              href="/dashboard/wallet"
              icon={CreditCardIcon}
              label="Add a payment method"
              hint="Save a card to pay faster"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
              <PanelHeader title="Outstanding dues" href="/dashboard/dues" />

              {openDues.length === 0 ? (
                <EmptyState
                  icon={CheckmarkCircle02Icon}
                  title="You're all settled"
                  description="No outstanding dues right now. New dues from your spaces will show up here."
                />
              ) : (
                <ul className="mt-3 flex flex-col">
                  {openDues.slice(0, 4).map((due) => {
                    const rel = relativeDue(due.dueDate);
                    return (
                      <li
                        key={due.id}
                        className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
                          <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {due.title}
                          </p>
                          <p
                            className={`truncate text-xs ${
                              rel.past ? "text-rose-600" : "text-ink-soft"
                            }`}
                          >
                            {CATEGORY_LABEL[due.category]} · {rel.text}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink">
                          {nairaFromKobo(due.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Button variant="brand" size="pill-lg" asChild className="mt-4 w-full">
                <Link href="/dashboard/dues">
                  Pay dues
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </section>

            <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
              <PanelHeader title="Recent activity" href="/dashboard/transactions" />

              {recent.length === 0 ? (
                <EmptyState
                  icon={ReceiptDollarIcon}
                  title="No activity yet"
                  description="Your payments and top-ups will appear here."
                />
              ) : (
                <ul className="mt-3 flex flex-col">
                  {recent.map((txn) => {
                    const isIn = txn.amount > 0;
                    const meta = txnMeta(txn.type);
                    return (
                      <li
                        key={txn.id}
                        className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
                          }`}
                        >
                          <HugeiconsIcon icon={meta.icon} size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {txn.title ?? meta.label}
                          </p>
                          <p className="truncate text-xs text-ink-soft">
                            {formatTime(txn.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold ${
                            isIn ? "text-brand" : "text-ink"
                          }`}
                        >
                          {isIn ? "+" : "−"}
                          {nairaFromKobo(txn.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/** Matches the loaded layout so the page doesn't jump when data arrives. */
function OverviewSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl border border-cloud bg-canvas" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-3xl border border-cloud bg-canvas" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-72 rounded-3xl border border-cloud bg-canvas" />
        <div className="h-72 rounded-3xl border border-cloud bg-canvas" />
      </div>
    </div>
  );
}
