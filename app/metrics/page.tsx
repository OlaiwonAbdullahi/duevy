import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getPublicMetrics, METRICS_REVALIDATE, type MetricsMonth } from "@/lib/api/metrics";
import Footer from "../components/Footer";
import { ArrowRightIcon } from "../components/icons";

export const revalidate = METRICS_REVALIDATE;

export const metadata: Metadata = pageMetadata({
  title: "Traction & Metrics",
  description:
    "Duevy in numbers: students, course reps, campuses and money moved through transparent campus dues — updated hourly.",
  path: "/metrics",
});

const count = new Intl.NumberFormat("en-NG");
const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });

/** Kobo → "₦1.2M" for headline tiles. */
function naira(kobo: number) {
  return `₦${compact.format(kobo / 100)}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-NG", {
    month: "short",
    timeZone: "UTC",
  });
}

export default async function MetricsPage() {
  const metrics = await getPublicMetrics();

  const tiles = [
    { label: "Processed through Duevy", value: metrics && naira(metrics.volume) },
    { label: "Payments made", value: metrics && count.format(metrics.payments) },
    { label: "Students on Duevy", value: metrics && count.format(metrics.students) },
    { label: "Verified course reps", value: metrics && count.format(metrics.reps) },
    { label: "Departments & groups", value: metrics && count.format(metrics.spaces) },
    { label: "Campuses", value: metrics && count.format(metrics.campuses) },
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <header className="px-6 md:px-12 py-6 border-b border-[#e6f2ec]">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link href="/" className="text-[#1b2520] text-xl tracking-tight cursor-pointer">
            Duevy.
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 text-[#0b6e4f] text-[14px] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
          >
            Create account
            <ArrowRightIcon
              size={15}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </header>

      <section className="px-6 md:px-12 pt-16 md:pt-20 pb-10">
        <div className="max-w-[1100px] mx-auto">
          <span className="inline-flex items-center gap-2 bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            <span className="size-1.5 rounded-full bg-[#0b6e4f]" aria-hidden />
            {metrics ? `Updated ${formatUpdated(metrics.updatedAt)}` : "Live figures coming soon"}
          </span>
          <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-5xl leading-tight mb-5 max-w-2xl">
            Duevy in numbers.
          </h1>
          <p className="text-[#7a847f] text-lg leading-relaxed max-w-2xl">
            We build in the open. These are live, platform-wide totals pulled straight from our
            ledger — no estimates, and nothing that identifies a student or department.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-white rounded-3xl border border-[#e6f2ec] p-6 md:p-8">
              <p className="text-[#0b6e4f] font-semibold tracking-tight text-4xl md:text-5xl mb-3 tabular-nums">
                {tile.value ?? "—"}
              </p>
              <p className="text-[#7a847f] text-base">{tile.label}</p>
            </div>
          ))}
        </div>
      </section>

      {metrics && metrics.monthly.length > 0 && (
        <section className="px-6 md:px-12 pb-20">
          <div className="max-w-[1100px] mx-auto bg-white rounded-3xl border border-[#e6f2ec] p-6 md:p-8">
            <h2 className="text-[#1b2520] font-semibold text-xl mb-1">Monthly volume</h2>
            <p className="text-[#7a847f] text-sm mb-8">Money students paid through Duevy each month.</p>
            <MonthlyChart months={metrics.monthly} />
          </div>
        </section>
      )}

      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-[1100px] mx-auto bg-[#e6f2ec] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-[#1b2520] font-semibold tracking-tight text-2xl md:text-3xl mb-2">
              Want your department on this page?
            </h2>
            <p className="text-[#7a847f] text-base">
              Investors, partners or press — reach us at{" "}
              <a
                href="mailto:support@duevy.app"
                className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300"
              >
                support@duevy.app
              </a>
              .
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-[#0b6e4f] hover:bg-[#08583f] text-white text-[15px] font-semibold rounded-full px-6 py-3 transition-colors duration-300 shrink-0"
          >
            Start collecting
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function MonthlyChart({ months }: { months: MetricsMonth[] }) {
  const max = Math.max(...months.map((m) => m.volume), 1);

  return (
    <div className="flex items-end gap-1.5 sm:gap-3 h-56" role="list" aria-label="Monthly volume">
      {months.map((m) => (
        <div
          key={m.month}
          role="listitem"
          className="group flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0"
          title={`${monthLabel(m.month)}: ${naira(m.volume)} · ${count.format(m.payments)} payments`}
        >
          <span className="text-[11px] text-[#1b2520] font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            {naira(m.volume)}
          </span>
          <div className="flex-1 w-full flex items-end justify-center">
            <div
              className="w-full max-w-12 rounded-t-lg bg-[#0b6e4f] group-hover:bg-[#08583f] transition-colors"
              style={{ height: `${Math.max((m.volume / max) * 100, 2)}%` }}
            />
          </div>
          <span className="text-[11px] sm:text-xs text-[#7a847f]">{monthLabel(m.month)}</span>
        </div>
      ))}
    </div>
  );
}
