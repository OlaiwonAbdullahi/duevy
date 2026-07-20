"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  Building03Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  MoneySend01Icon,
  ReceiptDollarIcon,
  UserGroup03Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StatCard } from "../../dashboard/_components/StatCard";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { nairaFromKobo, formatPercent01 } from "../_components/format";
import {
  getAdminOverview,
  listAdminSpaces,
  getPaymentGatewaySettings,
  type AdminOverview,
  type PaymentGateway,
} from "@/lib/api/admin";

const GATEWAY_LABELS: Record<PaymentGateway, string> = {
  paystack: "Paystack",
  monnify: "Monnify",
};

/** API attention tone → admin badge tone. */
function toneOf(tone: string): StatusTone {
  if (tone === "danger") return "bad";
  if (tone === "warning") return "warn";
  if (tone === "brand") return "ok";
  return "neutral";
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [spaceCount, setSpaceCount] = useState<number | null>(null);
  const [activeGateway, setActiveGateway] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const [overview, spaces, gateway] = await Promise.all([
          getAdminOverview(),
          listAdminSpaces({ perPage: 1 }), // meta.total is the space count
          getPaymentGatewaySettings(),
        ]);
        if (cancelled) return;
        setData(overview);
        setSpaceCount(spaces.meta?.total ?? spaces.data.length);
        setActiveGateway(gateway.active);
      } catch {
        if (!cancelled) {
          setError(true);
          toast.error("Couldn't load the admin overview.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const attention = data?.attention ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Overview"
        description="Platform health at a glance — the numbers and issues that need an admin."
      />

      {error && !loading ? (
        <TableCard title="Couldn't load" subtitle="Something went wrong reaching the server.">
          <p className="p-4 text-sm text-ink-soft">Refresh the page to try again.</p>
        </TableCard>
      ) : loading ? (
        <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl border border-cloud bg-canvas" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={UserMultipleIcon}
              label="Total users"
              value={(data?.totalUsers ?? 0).toLocaleString()}
              hint="Registered accounts"
            />
            <StatCard
              icon={UserGroup03Icon}
              label="Active reps"
              value={String(data?.activeReps ?? 0)}
              hint="Verified and collecting"
            />
            <StatCard
              icon={Building03Icon}
              label="Spaces"
              value={String(spaceCount ?? 0)}
              hint="Departments, faculties and clubs"
            />
            <StatCard
              icon={ReceiptDollarIcon}
              label="Dues collected"
              value={nairaFromKobo(data?.duesCollected ?? 0)}
              hint={`${formatPercent01(
                data && data.duesTarget ? data.duesCollected / data.duesTarget : 0,
              )} of the ${nairaFromKobo(data?.duesTarget ?? 0)} target`}
              tone="brand"
            />
            <StatCard
              icon={MoneySend01Icon}
              label="Pending payout"
              value={nairaFromKobo(data?.floatHeld ?? 0)}
              hint="Collected, not yet withdrawn by reps"
            />
            <StatCard
              icon={AlertCircleIcon}
              label="Overdue dues"
              value={nairaFromKobo(data?.overdue.amount ?? 0)}
              hint={`${data?.overdue.count ?? 0} accounts overdue`}
            />
            <StatCard
              icon={CreditCardIcon}
              label="Payment gateway"
              value={activeGateway ? GATEWAY_LABELS[activeGateway] : "—"}
              hint="Manage in Settings"
            />
          </div>

          <div className="mt-6">
            <TableCard
              title="Needs attention"
              subtitle={`${attention.length} item${
                attention.length === 1 ? "" : "s"
              } waiting on an admin decision`}
            >
              {attention.length === 0 ? (
                <EmptyState
                  icon={CheckmarkCircle02Icon}
                  title="All caught up"
                  description="Nothing needs your attention right now."
                />
              ) : (
                <ul className="space-y-3">
                  {attention.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-cloud bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone={toneOf(item.tone)}>{item.badge}</StatusBadge>
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
              )}
            </TableCard>
          </div>
        </>
      )}
    </div>
  );
}
