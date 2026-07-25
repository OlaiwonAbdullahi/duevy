"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
  Alert01Icon,
  AiChat01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { getRepOverview } from "@/lib/api/rep";
import type { RepOverview as RepOverviewData } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "../EmptyState";
import { UserAvatar } from "../UserAvatar";
import { nairaFromKobo } from "../format";
import { timeAgo } from "../notifications-data";
import { useRepSpace } from "../use-rep-space";
import { StatCard, QuickAction, PanelHeader } from "./OverviewUI";

export function RepOverview() {
  const { user } = useAuth();
  const repSpace = useRepSpace();
  const name = user?.name?.split(" ")[0] ?? "there";

  const [data, setData] = useState<RepOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!repSpace) {
      // No department resolved (e.g. student previewing) — don't hang on the skeleton.
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const overview = await getRepOverview(repSpace.id);
        if (!cancelled) setData(overview);
      } catch {
        if (!cancelled) {
          setError(true);
          toast.error("Couldn't load your department dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repSpace]);

  const spaceName = data?.space.name ?? repSpace?.name ?? "Your department";
  const spaceShort = data?.space.short ?? "";
  const activeDues = data?.activeDues ?? [];
  const members = data?.newMembers ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-1">
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

      {error && !loading ? (
        <EmptyState
          icon={Alert01Icon}
          title="Couldn't load your dashboard"
          description="Something went wrong reaching the server. Refresh the page to try again."
        />
      ) : loading ? (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl border border-cloud bg-canvas"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Department KPIs. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              value={`${Math.round((data?.stats.collectionRate ?? 0) * 100)}%`}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <QuickAction
              href="/dashboard/polls"
              icon={CheckmarkSquare01Icon}
              label="Create a poll"
              hint="Set up award votes"
            />
            <QuickAction
              href="/dashboard/assistant"
              icon={AiChat01Icon}
              label="Chat with Duey"
              hint="Ask about your dues"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Active dues + collection progress. */}
            <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
              <PanelHeader
                title="Active dues"
                href="/dashboard/create-dues"
                cta="Collections"
              />

              {activeDues.length === 0 ? (
                <EmptyState
                  icon={Invoice01Icon}
                  title="No active dues"
                  description="Raise a due for your department to start collecting."
                />
              ) : (
                <ul className="mt-3 flex flex-col gap-4">
                  {activeDues.map((due) => {
                    const pct = due.memberCount
                      ? Math.round((due.paidCount / due.memberCount) * 100)
                      : 0;
                    return (
                      <li key={due.id}>
                        <Link
                          href={`/dashboard/create-dues?due=${due.id}`}
                          className="group block rounded-2xl transition-colors duration-300 hover:bg-paper/60"
                          title={`View who paid ${due.title}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm font-medium text-ink">
                              {due.title}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className="text-xs font-semibold text-ink-soft tabular-nums">
                                {nairaFromKobo(due.paidCount * due.amount)}
                              </span>
                              <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                size={14}
                                className="text-ink-soft opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </div>
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
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Button
                variant="brand"
                size="pill-lg"
                asChild
                className="mt-5 w-full"
              >
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
                    {data?.stats.unpaidCount ?? 0} payments still outstanding
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Send a reminder to students who haven&apos;t paid yet.
                  </p>
                </div>
                <Button variant="brand" size="pill-lg" asChild>
                  <Link href="/dashboard/create-dues">
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
                            {member.matricNo}
                            {member.level ? ` · ${member.level}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-ink-soft">
                          {timeAgo(member.joinedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      {/* Personal footer — a rep is also a student. */}
      <section className="mt-6 flex flex-col gap-3 rounded-3xl border border-cloud bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold text-ink">Your student account</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Your own dues and payments live here too.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="brand-outline" size="pill" asChild>
            <Link href="/dashboard/dues">My dues</Link>
          </Button>
          <Button variant="brand-outline" size="pill" asChild>
            <Link href="/dashboard/settings#payment-methods">Payment methods</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
