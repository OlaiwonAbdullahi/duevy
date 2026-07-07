"use client";

import { useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddInvoiceIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkSquare01Icon,
  Invoice01Icon,
  MoneySend01Icon,
  Notification03Icon,
  UserAdd01Icon,
  UserMultipleIcon,
  SquareLock01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import { UserAvatar } from "../UserAvatar";
import {
  INITIAL_REP_DUES,
  REP_SPACE,
  naira,
} from "../../create-dues/_components/data";
import { INITIAL_STUDENTS, REP_JOIN_CODE } from "../../circle/_components/data";
import { StatCard, QuickAction, PanelHeader } from "./OverviewUI";

export function RepOverview({ name = "Amara" }: { name?: string }) {
  const stats = useMemo(() => {
    const active = INITIAL_REP_DUES.filter((d) => d.status === "active");
    const collected = active.reduce((s, d) => s + d.paidCount * d.amount, 0);
    const expected = active.reduce((s, d) => s + d.memberCount * d.amount, 0);
    const paid = active.reduce((s, d) => s + d.paidCount, 0);
    const possible = active.reduce((s, d) => s + d.memberCount, 0);
    const unpaid = possible - paid;
    return {
      active,
      collected,
      outstanding: expected - collected,
      rate: possible ? Math.round((paid / possible) * 100) : 0,
      unpaid,
    };
  }, []);

  const members = INITIAL_STUDENTS;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep dashboard
        </span>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {REP_SPACE.name}
        </h1>
        <p className="text-[13px] text-ink-soft">
          Hi {name} — here&apos;s how collections are going for {REP_SPACE.short}.
        </p>
      </div>

      {/* Department KPIs. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet01Icon}
          label="Collected"
          value={naira(stats.collected)}
          hint="Across active dues"
          tone="brand"
        />
        <StatCard
          icon={Invoice01Icon}
          label="Outstanding"
          value={naira(stats.outstanding)}
          hint={`${stats.unpaid} payments pending`}
        />
        <StatCard
          icon={UserMultipleIcon}
          label="Collection rate"
          value={`${stats.rate}%`}
          hint={`${REP_SPACE.memberCount} members`}
        />
        <StatCard
          icon={SquareLock01Icon}
          label="Join code"
          value={REP_JOIN_CODE}
          hint="Share to add students"
        />
      </div>

      {/* Rep quick actions. */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/dashboard/create-dues"
          icon={AddInvoiceIcon}
          label="Create a due"
          hint="Raise a new charge"
        />
        <QuickAction
          href="/dashboard/collections"
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
        <QuickAction
          href="/dashboard/polls"
          icon={CheckmarkSquare01Icon}
          label="Create a poll"
          hint="Set up award votes"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Active dues + collection progress. */}
        <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
          <PanelHeader
            title="Active dues"
            href="/dashboard/collections"
            cta="Collections"
          />

          {stats.active.length === 0 ? (
            <EmptyState
              icon={Invoice01Icon}
              title="No active dues"
              description="Raise a due for your department to start collecting."
            />
          ) : (
            <ul className="mt-3 flex flex-col gap-4">
              {stats.active.map((due) => {
                const pct = Math.round((due.paidCount / due.memberCount) * 100);
                return (
                  <li key={due.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium text-ink">
                        {due.title}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-ink-soft tabular-nums">
                        {naira(due.paidCount * due.amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-ink-soft tabular-nums">
                        {due.paidCount}/{due.memberCount}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Button variant="brand" size="pill-lg" asChild className="mt-5 w-full">
            <Link href="/dashboard/create-dues">
              Manage dues
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </Button>
        </section>

        <div className="flex flex-col gap-6">
          {/* Needs attention. */}
          <section className="flex flex-col gap-3 rounded-3xl border border-cloud bg-cloud/50 p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold text-ink">
                {stats.unpaid} payments still outstanding
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Send a reminder to students who haven&apos;t paid yet.
              </p>
            </div>
            <Button variant="brand" size="pill-lg" asChild>
              <Link href="/dashboard/collections">
                Send reminders
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
              </Link>
            </Button>
          </section>

          {/* Newest members — students who just joined with the code. */}
          <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <PanelHeader
              title="New members"
              href="/dashboard/circle"
              cta="Circle"
            />

            {members.length === 0 ? (
              <EmptyState
                size="sm"
                icon={UserAdd01Icon}
                title="No members yet"
                description="Share your join code and students will show up here."
              />
            ) : (
              <ul className="mt-3 flex flex-col">
                {members.slice(0, 3).map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 border-t border-cloud py-3 first:border-t-0"
                  >
                    <UserAvatar name={member.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {member.matricNo} · {member.level}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-ink-soft">
                      {member.joinedAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Personal footer — a rep is also a student. */}
      <section className="mt-6 flex flex-col gap-3 rounded-3xl border border-cloud bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold text-ink">Your student account</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Your own dues, wallet and payments live here too.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="brand-outline" size="pill" asChild>
            <Link href="/dashboard/dues">My dues</Link>
          </Button>
          <Button variant="brand-outline" size="pill" asChild>
            <Link href="/dashboard/wallet">My wallet</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
