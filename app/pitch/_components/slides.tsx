"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import { m } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Agreement01Icon,
  AlertCircleIcon,
  ApiIcon,
  AuditIcon,
  BankIcon,
  Building03Icon,
  ChartUpIcon,
  CheckListIcon,
  FileExportIcon,
  Globe02Icon,
  Idea01Icon,
  Invoice01Icon,
  Link01Icon,
  Mail01Icon,
  Megaphone01Icon,
  Mortarboard01Icon,
  MoneyBag01Icon,
  Note01Icon,
  Notification03Icon,
  PercentIcon,
  PinCodeIcon,
  PlayCircleIcon,
  Plug01Icon,
  School01Icon,
  Search01Icon,
  SecurityCheckIcon,
  SecurityLockIcon,
  SmartPhone01Icon,
  Store01Icon,
  Ticket01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  UniversityIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import type { PublicMetrics } from "@/lib/api/metrics";

export type Slide = {
  /** Short name, used for the progress dots and screen readers. */
  title: string;
  /** "brand" renders the slide on the green doodle background. */
  tone?: "light" | "brand";
  render: () => React.ReactNode;
};

type Icon = typeof BankIcon;

/* ── Economics ────────────────────────────────────────────────────────────
   Mirrors the business model doc and the live pricing: dues are 2% (2% part
   capped at ₦2,000) + ₦20, paid by the student on top; processing on a bank
   transfer costs 1.5% capped at ₦2,000. */

function duesFee(amount: number) {
  return Math.min(amount * 0.02, 2000) + 20;
}

function processingCost(amount: number) {
  return Math.min(amount * 0.015, 2000);
}

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1] as const;

function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }}
    >
      {children}
    </m.div>
  );
}

function Item({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
      }}
    >
      {children}
    </m.div>
  );
}

function Eyebrow({ children, onBrand }: { children: React.ReactNode; onBrand?: boolean }) {
  return (
    <span
      className={`inline-flex items-center text-[13px] font-medium rounded-full px-3 py-1 mb-6 ${
        onBrand ? "bg-white/15 text-white backdrop-blur-sm" : "bg-[#e6f2ec] text-[#0b6e4f]"
      }`}
    >
      {children}
    </span>
  );
}

function Heading({ children, onBrand }: { children: React.ReactNode; onBrand?: boolean }) {
  return (
    <h2
      className={`font-semibold tracking-tight text-3xl md:text-5xl leading-[1.08] ${
        onBrand ? "text-white" : "text-[#1b2520]"
      }`}
    >
      {children}
    </h2>
  );
}

function Lede({ children, onBrand }: { children: React.ReactNode; onBrand?: boolean }) {
  return (
    <p
      className={`text-base md:text-lg leading-relaxed mt-5 max-w-2xl ${
        onBrand ? "text-white/80" : "text-[#7a847f]"
      }`}
    >
      {children}
    </p>
  );
}

function IconBadge({ icon, onBrand }: { icon: Icon; onBrand?: boolean }) {
  return (
    <span
      className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${
        onBrand ? "bg-white/15 text-white" : "bg-[#e6f2ec] text-[#0b6e4f]"
      }`}
    >
      <HugeiconsIcon icon={icon} size={20} />
    </span>
  );
}

function Card({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  return (
    <div className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#e6f2ec]">
      <IconBadge icon={icon} />
      <h3 className="font-semibold text-lg tracking-tight mt-5 mb-2 text-[#1b2520]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-[#7a847f]">{body}</p>
    </div>
  );
}

function Row({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  return (
    <div className="h-full flex gap-4 rounded-3xl bg-white border border-[#e6f2ec] p-5">
      <IconBadge icon={icon} />
      <div>
        <h3 className="font-semibold tracking-tight text-[#1b2520] mb-1">{title}</h3>
        <p className="text-[14px] leading-relaxed text-[#7a847f]">{body}</p>
      </div>
    </div>
  );
}

/** Where a feature or revenue stream actually stands — keep these honest. */
type Status = "live" | "built" | "planned" | "future";

const STATUS: Record<Status, { label: string; light: string; brand: string }> = {
  live: { label: "Live", light: "bg-[#0b6e4f] text-white", brand: "bg-white text-[#0b6e4f]" },
  built: { label: "Built · after pilot", light: "bg-[#e6f2ec] text-[#0b6e4f]", brand: "bg-white/20 text-white" },
  planned: { label: "Planned", light: "bg-[#f4f2ec] text-[#7a847f]", brand: "bg-white/10 text-white/80" },
  future: { label: "Future", light: "bg-[#f4f2ec] text-[#7a847f]", brand: "bg-white/10 text-white/80" },
};

function StatusChip({ status, onBrand }: { status: Status; onBrand?: boolean }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
        onBrand ? s.brand : s.light
      }`}
    >
      {s.label}
    </span>
  );
}

/** A screenshot in a phone frame. */
function Phone({ src, alt, className = "", priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div
      className={`relative aspect-[614/1360] rounded-[30px] bg-[#0e1411] p-1.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/10 ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white">
        <Image src={src} alt={alt} fill sizes="290px" className="object-cover object-top" priority={priority} />
      </div>
    </div>
  );
}

/* ── Live traction ────────────────────────────────────────────────────────── */

/** Filled by the pitch page from `/public/metrics`; null when the API is unreachable. */
export const PitchMetricsContext = createContext<PublicMetrics | null>(null);

const count = new Intl.NumberFormat("en-NG");

function firstActiveMonth(metrics: PublicMetrics) {
  const first = metrics.monthly.find((m) => m.payments > 0);
  if (!first) return null;
  const [y, mo] = first.month.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-NG", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Traction() {
  const metrics = useContext(PitchMetricsContext);
  const since = metrics && firstActiveMonth(metrics);
  // The first tile leads on the brand card; the rest stack beside it.
  const tiles = metrics
    ? [
        { icon: UserCheck01Icon, label: "Verified reps", caption: "ID-checked and approved to collect", value: count.format(metrics.reps) },
        { icon: Building03Icon, label: "Departments", caption: "Collecting on Duevy today", value: count.format(metrics.spaces) },
        { icon: UniversityIcon, label: metrics.campuses === 1 ? "Campus" : "Campuses", caption: metrics.campuses === 1 ? "Pilot campus, live end to end" : "Live end to end", value: count.format(metrics.campuses) },
      ]
    : [];
  const [lead, ...rest] = tiles;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3">
        {lead ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="doodle-card sm:row-span-2 rounded-3xl p-6 md:p-7 flex flex-col justify-between gap-10 min-h-[220px]">
              <div className="flex items-center justify-between">
                <IconBadge icon={lead.icon} onBrand />
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Live
                </span>
              </div>
              <div>
                <p className="text-white font-semibold tracking-tight text-6xl md:text-7xl tabular-nums leading-none">
                  {lead.value}
                </p>
                <p className="text-white font-semibold text-lg mt-3">{lead.label}</p>
                <p className="text-white/70 text-[14px] mt-0.5">{lead.caption}</p>
              </div>
            </div>
            {rest.map((t) => (
              <div key={t.label} className="flex items-center gap-5 rounded-3xl bg-white border border-[#e6f2ec] p-5 md:p-6">
                <p className="text-[#0b6e4f] font-semibold tracking-tight text-5xl md:text-6xl tabular-nums leading-none min-w-14 text-center shrink-0">
                  {t.value}
                </p>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-[#1b2520]">
                    <HugeiconsIcon icon={t.icon} size={18} className="text-[#0b6e4f] shrink-0" />
                    {t.label}
                  </p>
                  <p className="text-[13px] leading-snug text-[#7a847f] mt-1">{t.caption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-[#e6f2ec] p-6 text-[15px] text-[#7a847f]">
            Live figures are at duevy.app/metrics.
          </div>
        )}
        {metrics && (
          <p className="text-[13px] text-[#7a847f] mt-3">
            Live from duevy.app/metrics · updated{" "}
            {new Date(metrics.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
      <div className="lg:col-span-2 space-y-3">
        {[
          { title: "Live at duevy.app", body: "Real students paying real dues, end to end — checkout, receipts and payouts." },
          {
            title: since ? `First payments in ${since}` : "Pilot under way",
            body: "Starting with one campus to get the rep and student experience right before scaling.",
          },
          { title: "Rep-led distribution", body: "Each verified rep brings their whole class: one link in the WhatsApp group." },
          { title: "Shipping fast", body: "2-of-3 payout approval, co-rep assignment, partner codes and PDF reports all shipped in October." },
        ].map((m) => (
          <div key={m.title} className="flex gap-3 rounded-2xl bg-[#e6f2ec] p-4">
            <span className="mt-1.5 h-2 w-2 rounded-full bg-[#0b6e4f] shrink-0" />
            <div>
              <p className="text-[15px] font-semibold text-[#1b2520]">{m.title}</p>
              <p className="text-[14px] leading-relaxed text-[#1b2520]/70 mt-0.5">{m.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Interactive revenue model ───────────────────────────────────────────── */

function RevenueModel() {
  const [students, setStudents] = useState(1000000);
  const [due, setDue] = useState(3000);
  const [payments, setPayments] = useState(5);

  const perPayment = duesFee(due) - processingCost(due);
  const volume = students * payments * due;
  const net = students * payments * perPayment;

  const sliders = [
    {
      label: "Students paying through Duevy",
      value: students,
      set: setStudents,
      min: 1000,
      max: 2000000,
      step: 1000,
      display: students >= 1000000 ? `${+(students / 1000000).toFixed(2)}M` : students.toLocaleString("en-NG"),
    },
    {
      label: "Average payment",
      value: due,
      set: setDue,
      min: 500,
      max: 50000,
      step: 500,
      display: naira(due),
    },
    {
      label: "Payments per student, per year",
      value: payments,
      set: setPayments,
      min: 1,
      max: 12,
      step: 1,
      display: String(payments),
    },
  ];

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 rounded-3xl bg-white border border-[#e6f2ec] p-6 md:p-8 space-y-7">
        {sliders.map((s) => (
          <label key={s.label} className="block">
            <span className="flex items-baseline justify-between gap-4 mb-3">
              <span className="text-[15px] text-[#7a847f]">{s.label}</span>
              <span className="text-[#1b2520] font-semibold tabular-nums">{s.display}</span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full accent-[#0b6e4f] cursor-pointer"
            />
          </label>
        ))}
        <p className="text-[13px] text-[#7a847f] leading-relaxed">
          {`Duevy keeps ${naira(perPayment)} on a ${naira(due)} payment after processing costs. Campus payments checkout only — withdrawal fees are on top.`}
        </p>
      </div>

      <div className="doodle-card lg:col-span-2 rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-8">
        <div>
          <p className="text-white/75 text-[15px]">Payment volume / year</p>
          <p className="text-white font-semibold tracking-tight text-3xl md:text-4xl mt-1 tabular-nums">
            {naira(volume)}
          </p>
        </div>
        <div>
          <p className="text-white/75 text-[15px]">Duevy net revenue / year</p>
          <p className="text-white font-semibold tracking-tight text-4xl md:text-5xl mt-1 tabular-nums">
            {naira(net)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Slides ──────────────────────────────────────────────────────────────── */

const unitRows = [2000, 5000, 10000, 20000, 50000, 100000];
const maxKeep = Math.max(...unitRows.map((a) => duesFee(a) - processingCost(a)));

export const slides: Slide[] = [
  {
    title: "Duevy",
    tone: "brand",
    render: () => (
      <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
        <Stagger>
          <Item>
            <Eyebrow onBrand>Pitch deck · 2026</Eyebrow>
          </Item>
          <Item>
            <h1 className="text-white font-semibold tracking-tight text-5xl md:text-7xl leading-[0.98] max-w-3xl">
              Payment infra for every department.
            </h1>
          </Item>
          <Item>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed mt-8 max-w-xl">
              Duevy gives verified campus reps a clean way to collect dues by bank transfer — and
              gives every student a receipt for every naira.
            </p>
          </Item>
          <Item>
            <p className="text-white font-medium text-base md:text-lg leading-relaxed mt-6 max-w-xl border-l-2 border-white/40 pl-4">
             We&apos;re not just simplifying campus payments. We&apos;re building the infrastructure
              that makes collections easier for organised communities.
            </p>
          </Item>
          <Item className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-white/65 text-[15px]">
            <span>duevy.app</span>
          </Item>
        </Stagger>
        <m.div
          className="hidden lg:block relative w-[260px] xl:w-[290px] aspect-[614/1360] rounded-[44px] bg-[#0e1411] p-2.5 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
          initial={{ opacity: 0, y: 40, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.9, delay: 0.25, ease }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[36px]">
            <Image
              src="/home-ui.png"
              alt="Duevy rep dashboard: total collected, collection rate, and recent transactions"
              fill
              sizes="290px"
              className="object-cover object-top"
              priority
            />
          </div>
        </m.div>
      </div>
    ),
  },
  {
    title: "The problem",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>The problem</Eyebrow>
        </Item>
        <Item>
          <Heading>Every semester, the same story.</Heading>
        </Item>
        <Item>
          <Lede>
            Campus money runs on cash, scattered transfers and a rep&apos;s notebook. When
            students ask where it went, there&apos;s no clean answer.
          </Lede>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            {
              icon: MoneyBag01Icon,
              title: "Cash & scattered transfers",
              body: "Dues land in a rep's personal account alongside their own money.",
            },
            {
              icon: Note01Icon,
              title: "No receipts, no records",
              body: "Who paid lives in a notebook or a WhatsApp scroll-back.",
            },
            {
              icon: AlertCircleIcon,
              title: "“Did my payment land?”",
              body: "Students have no proof of payment when a rep's list says otherwise.",
            },
            {
              icon: UserGroupIcon,
              title: "Trust breaks down",
              body: "Honest reps get accused. Handover to the next exec starts from zero.",
            },
          ].map((c) => (
            <Item key={c.title}>
              <Card {...c} />
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Why now",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Why now</Eyebrow>
        </Item>
        <Item>
          <Heading>Campuses went digital. Campus money didn&apos;t.</Heading>
        </Item>
        <div className="grid lg:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: Globe02Icon,
              title: "Universities are digitising",
              body: "Admissions, course registration, results and school fees are moving onto portals and e-payments. Students already pay each other by transfer every day.",
            },
            {
              icon: AlertCircleIcon,
              title: "The rest is still fragmented",
              body: "Dues, levies, handouts and association fees sit outside those systems — in personal accounts, notebooks and WhatsApp threads. Admins and students both lose track.",
            },
            {
              icon: Plug01Icon,
              title: "The rails now exist",
              body: "Instant bank transfers and identity APIs make it cheap to verify a rep, confirm a payment automatically and settle to any bank. Duevy brings it into one platform.",
            },
          ].map((c) => (
            <Item key={c.title}>
              <Card {...c} />
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "The solution",
    render: () => (
      <Stagger className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-2">
          <Item>
            <Eyebrow>The solution</Eyebrow>
          </Item>
          <Item>
            <Heading>Duevy puts dues on the record.</Heading>
          </Item>
          <Item>
            <Lede>
              Every payment is confirmed automatically and receipted, every rep is verified, and
              every withdrawal is logged.
            </Lede>
          </Item>
        </div>
        <div className="lg:col-span-3 space-y-4">
          {[
            {
              icon: BankIcon,
              title: "Bank-transfer checkout",
              body: "Students pay by transfer to a one-time account number. It confirms automatically — no screenshots, no “abeg check.”",
            },
            {
              icon: Invoice01Icon,
              title: "A receipt for every payment",
              body: "Each payment lands in the student's history with a downloadable PDF receipt.",
            },
            {
              icon: UserCheck01Icon,
              title: "Verified reps, controlled payouts",
              body: "Reps pass identity checks before collecting. Withdrawals need a security code — or sign-off from 2 of 3 reps — and every action hits the audit trail.",
            },
          ].map((c) => (
            <Item key={c.title}>
              <div className="flex gap-5 rounded-3xl bg-white border border-[#e6f2ec] p-6">
                <IconBadge icon={c.icon} />
                <div>
                  <h3 className="font-semibold text-lg tracking-tight text-[#1b2520] mb-1.5">
                    {c.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[#7a847f]">{c.body}</p>
                </div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "How it works",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>How it works</Eyebrow>
        </Item>
        <Item>
          <Heading>From set-up to settled.</Heading>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          {[
            { title: "Rep gets verified", body: "Applies for their department, passes ID checks, and Duevy approves the space." },
            { title: "Create dues", body: "Set the amount and deadline for each due — “200L CSC dues, ₦2,000.”" },
            { title: "Share the link", body: "Drop the join link or code in the class WhatsApp. Students join — or pay as a guest, no account needed." },
            { title: "Students pay", body: "Bank transfer, confirmed automatically, PDF receipt straight away." },
            { title: "Track & withdraw", body: "See who's paid, remind the rest, withdraw to a bank account once it's approved." },
          ].map((s, i) => (
            <Item key={s.title}>
              <div className="h-full rounded-3xl bg-white border border-[#e6f2ec] p-6">
                <span className="text-[#0b6e4f] font-semibold text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-px bg-[#e6f2ec] my-5" />
                <h3 className="font-semibold text-lg tracking-tight text-[#1b2520] mb-2">
                  {s.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[#7a847f]">{s.body}</p>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "In the product",
    render: () => (
      <Stagger className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-14 items-center">
        <div>
          <Item>
            <Eyebrow>It&apos;s real</Eyebrow>
          </Item>
          <Item>
            <Heading>A rep&apos;s whole term, in their pocket.</Heading>
          </Item>
          <Item>
            <Lede>
              What the rep sees: how much has come in, who still owes, and a protected way to pay
              it out — to themselves, a lecturer or a vendor.
            </Lede>
          </Item>
          <Item className="mt-8">
            <a
              href="/demo"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-[#0b6e4f] text-white font-medium px-5 py-3 hover:bg-[#08583f] transition-colors"
            >
              <HugeiconsIcon icon={PlayCircleIcon} size={18} />
              Try the live demo
            </a>
            <p className="text-[13px] text-[#7a847f] mt-3">duevy.app/demo · sample data, no sign-up</p>
          </Item>
        </div>
        <Item className="flex justify-center gap-3 sm:gap-5">
          <Phone src="/pitch/overview.png" alt="Rep overview: total collected, collection rate and recent payments" className="w-[30%] max-w-[210px] lg:w-[190px] xl:w-[210px]" />
          <Phone src="/pitch/collections.png" alt="Collections for one due: who has paid, with reminders and a guest pay link" className="w-[30%] max-w-[210px] lg:w-[190px] xl:w-[210px] translate-y-6" />
          <Phone src="/pitch/payout.png" alt="Payout: available balance, saved beneficiaries and withdrawal history" className="w-[30%] max-w-[210px] lg:w-[190px] xl:w-[210px]" />
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Product",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Live today</Eyebrow>
        </Item>
        <Item>
          <Heading>Everything a rep needs, shipped.</Heading>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {[
            { icon: CheckListIcon, title: "Dues & collections", body: "Create dues, see paid vs. unpaid per due, search and filter members." },
            { icon: Notification03Icon, title: "Reminders & notifications", body: "Nudge everyone who hasn't paid; in-app, email and push alerts." },
            { icon: BankIcon, title: "Bank-transfer checkout", body: "One-time account numbers, confirmed automatically." },
            { icon: Link01Icon, title: "Guest checkout", body: "Open a due to a public link — anyone pays with a name and email, receipt included." },
            { icon: Invoice01Icon, title: "Receipts & history", body: "PDF receipt for every payment and a full transaction ledger." },
            { icon: PinCodeIcon, title: "Protected payouts", body: "Security-code withdrawals, saved beneficiaries, fee quoted upfront." },
            { icon: SecurityLockIcon, title: "Signatory approval", body: "Optional 2-of-3 sign-off: the lead plus two co-reps approve each withdrawal." },
            { icon: UserMultiple02Icon, title: "Co-reps", body: "Add co-reps to share the load, and hand a due to a co-rep to run." },
            { icon: FileExportIcon, title: "Payout breakdown & export", body: "Collected, fees and net per due; CSV export of collections." },
            { icon: AuditIcon, title: "Audit trail", body: "Every action in a space is logged for handover." },
            { icon: UserGroupIcon, title: "Circle", body: "Member list, join codes you can regenerate, remove members." },
            { icon: SmartPhone01Icon, title: "Installable app", body: "Works in any browser; add to home screen with an offline fallback. Native Android and iOS apps are coming." },
          ].map((c) => (
            <Item key={c.title}>
              <Row {...c} />
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Who it's for",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Who it&apos;s for</Eyebrow>
        </Item>
        <Item>
          <Heading>Made for the people who run campus money.</Heading>
        </Item>
        <div className="grid lg:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: UserGroupIcon,
              who: "The class rep",
              pain: "Collects ₦2,000 from 120 classmates each semester, chasing payments on WhatsApp and a notebook.",
              gets: "A live paid / unpaid list, one-tap reminders, and a CSV export.",
            },
            {
              icon: UniversityIcon,
              who: "The student",
              pain: "Pays dues and levies all year with nothing to show for it when a list goes missing.",
              gets: "Instant confirmation and a PDF receipt for every payment, all in one history.",
            },
            {
              icon: Building03Icon,
              who: "The department",
              pain: "Collections change hands every session with no record of what came in or went out.",
              gets: "A payout breakdown per due and an audit trail the next exec inherits.",
            },
          ].map((p) => (
            <Item key={p.who}>
              <div className="h-full rounded-3xl bg-white border border-[#e6f2ec] p-6 md:p-7 flex flex-col">
                <div className="flex items-center gap-3">
                  <IconBadge icon={p.icon} />
                  <h3 className="font-semibold text-lg tracking-tight text-[#1b2520]">{p.who}</h3>
                </div>
                <p className="text-[15px] leading-relaxed text-[#7a847f] mt-5 flex-1">{p.pain}</p>
                <div className="mt-6 rounded-2xl bg-[#e6f2ec] p-4">
                  <p className="text-[12px] font-medium uppercase tracking-wider text-[#0b6e4f] mb-1">
                    With Duevy
                  </p>
                  <p className="text-[15px] leading-relaxed text-[#1b2520]">{p.gets}</p>
                </div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Market",
    render: () => (
      <Stagger>
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-14 items-end mb-10">
          <div className="lg:col-span-3">
            <Item>
              <Eyebrow>Market</Eyebrow>
            </Item>
            <Item>
              <Heading>2M+ students make campus payments every session.</Heading>
            </Item>
          </div>
          <Item className="lg:col-span-2">
            <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
              Every class, department, faculty, association and club collects money — today
              almost none of it is on a ledger. Drag to model it — an illustration of the
              transaction model, not a forecast.
            </p>
          </Item>
        </div>
        <Item>
          <RevenueModel />
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Traction",
    render: () => (
      <Stagger>
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-14 items-end mb-10">
          <div className="lg:col-span-3">
            <Item>
              <Eyebrow>Traction</Eyebrow>
            </Item>
            <Item>
              <Heading>Early, live and real.</Heading>
            </Item>
          </div>
          <Item className="lg:col-span-2">
            <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
              We&apos;re at the start: a pilot on our first campus. These are live numbers — small,
              but every one is a real student and a real payment.
            </p>
          </Item>
        </div>
        <Item>
          <Traction />
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Revenue model",
    tone: "brand",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow onBrand>Revenue model</Eyebrow>
        </Item>
        <Item>
          <Heading onBrand>We earn when money moves.</Heading>
        </Item>
        <Item>
          <Lede onBrand>
            Transaction fees are the business today — no setup fees, nothing to start, the fee
            shown before anyone confirms. The rest are expansion streams we&apos;ll earn into, not
            ones we depend on.
          </Lede>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            {
              n: "01",
              icon: PercentIcon,
              status: "live" as const,
              title: "Transaction revenue",
              body: "The core model. 2% + ₦20 per dues payment (capped at ₦2,020, paid by the student on top) and ₦100 / ₦200 per withdrawal.",
            },
            {
              n: "02",
              icon: Ticket01Icon,
              status: "planned" as const,
              title: "Voting & ticketing",
              body: "A service charge on paid campus elections and event tickets — run by the same reps, on the same checkout.",
            },
            {
              n: "03",
              icon: ApiIcon,
              status: "planned" as const,
              title: "API & infrastructure",
              body: "Education platforms pay to use Duevy's collection rails — checkout, reconciliation and payouts — inside their own products.",
            },
            {
              n: "04",
              icon: Megaphone01Icon,
              status: "future" as const,
              title: "Marketplace & advertising",
              body: "Relevant businesses reach verified campus communities through sponsored listings and promotions.",
            },
          ].map((s, i) => (
            <Item key={s.title}>
              <div
                className={`h-full rounded-3xl border p-6 backdrop-blur-md flex flex-col ${
                  i === 0 ? "bg-white/15 border-white/30" : "bg-[#08583f]/70 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <IconBadge icon={s.icon} onBrand />
                  <StatusChip status={s.status} onBrand />
                </div>
                <p className="text-white/50 font-semibold text-sm tabular-nums mt-8">{s.n}</p>
                <h3 className="text-white font-semibold text-lg mt-1 mb-1.5">{s.title}</h3>
                <p className="text-white/75 text-[15px] leading-relaxed">{s.body}</p>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Unit economics",
    render: () => (
      <Stagger className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-2">
          <Item>
            <Eyebrow>Unit economics</Eyebrow>
          </Item>
          <Item>
            <Heading>Positive margin on every payment.</Heading>
          </Item>
          <Item>
            <Lede>
              Processing costs 1.5% (capped at ₦2,000) per bank transfer and ₦50 per withdrawal.
              Duevy&apos;s fee sits above that at every size.
            </Lede>
          </Item>
          <Item className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#e6f2ec] p-4">
              <p className="text-[#0b6e4f] font-semibold text-2xl tracking-tight">₦50–₦150</p>
              <p className="text-[13px] text-[#1b2520] mt-1">kept per withdrawal</p>
            </div>
            <div className="rounded-2xl bg-[#e6f2ec] p-4">
              <p className="text-[#0b6e4f] font-semibold text-2xl tracking-tight">No cards</p>
              <p className="text-[13px] text-[#1b2520] mt-1">bank transfer only, lower cost</p>
            </div>
          </Item>
        </div>
        <Item className="lg:col-span-3">
          <div className="rounded-3xl bg-white border border-[#e6f2ec] p-5 md:p-7">
            <div className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[7rem_1fr_5rem_5rem] gap-x-4 text-[12px] font-medium uppercase tracking-wider text-[#7a847f] pb-3 border-b border-[#e6f2ec]">
              <span>Dues payment</span>
              <span className="hidden md:block" />
              <span className="text-right">Fee</span>
              <span className="text-right">Kept</span>
            </div>
            {unitRows.map((amount, i) => {
              const keep = duesFee(amount) - processingCost(amount);
              return (
                <div
                  key={amount}
                  className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[7rem_1fr_5rem_5rem] gap-x-4 items-center py-3 border-b border-[#e6f2ec] last:border-0"
                >
                  <span className="text-[#1b2520] font-medium tabular-nums">{naira(amount)}</span>
                  <span className="hidden md:block h-2 rounded-full bg-[#f4f2ec] overflow-hidden">
                    <m.span
                      className="block h-full rounded-full bg-[#0b6e4f]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(keep / maxKeep) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease }}
                    />
                  </span>
                  <span className="text-right text-[#7a847f] tabular-nums w-16 md:w-auto">
                    {naira(duesFee(amount))}
                  </span>
                  <span className="text-right text-[#0b6e4f] font-semibold tabular-nums w-14 md:w-auto">
                    {naira(keep)}
                  </span>
                </div>
              );
            })}
          </div>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Roadmap",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Roadmap</Eyebrow>
        </Item>
        <Item>
          <Heading>From collections to infrastructure.</Heading>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            {
              stage: "Today",
              title: "Digital collections",
              status: "live" as const,
              items: [
                "Dues, levies and guest pay links",
                "Bank-transfer checkout that confirms and reconciles itself",
                "Paid / unpaid tracking, reminders, receipts",
                "Protected payouts, audit trail, PDF & CSV reports",
              ],
            },
            {
              stage: "Built",
              title: "Ready after the pilot",
              status: "built" as const,
              items: [
                "Polls and paid voting for elections and awards",
                "AI assistant for students and reps",
                "Rep referral programme",
              ],
            },
            {
              stage: "Next",
              title: "Smarter collection management",
              status: "planned" as const,
              items: [
                "Scheduled, automatic payment reminders",
                "Advanced collection analytics",
                "Bulk collections across many classes",
                "Settlement reports for institutions",
                "Native mobile apps for Android and iOS",
              ],
            },
            {
              stage: "Vision",
              title: "Campus payment infrastructure",
              status: "future" as const,
              items: [
                "Duevy API for third-party platforms",
                "School management system integrations",
                "Campus marketplace and sponsored listings",
                "Beyond universities: schools and associations",
              ],
            },
          ].map((col, i) => (
            <Item key={col.stage}>
              <div
                className={`h-full rounded-3xl border p-6 ${
                  i === 0 ? "bg-[#e6f2ec] border-[#0b6e4f]/20" : "bg-white border-[#e6f2ec]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#0b6e4f] font-semibold text-sm">{col.stage}</span>
                  <StatusChip status={col.status} />
                </div>
                <div className="h-px bg-[#0b6e4f]/10 my-5" />
                <h3 className="font-semibold text-lg tracking-tight text-[#1b2520] mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14px] leading-snug text-[#1b2520]/80">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${i === 0 ? "bg-[#0b6e4f]" : "bg-[#7a847f]/50"}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Item>
          ))}
        </div>
        <Item>
          <p className="text-[14px] text-[#7a847f] mt-6 max-w-3xl">
            The API matters most: Duevy doesn&apos;t have to own every screen where a payment starts.
            Other education platforms can run on its collection rails.
          </p>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Vision",
    tone: "brand",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow onBrand>The bigger picture</Eyebrow>
        </Item>
        <Item>
          <h2 className="text-white font-semibold tracking-tight text-4xl md:text-6xl leading-[1.02] max-w-4xl">
            One platform. Multiple communities. Simplified collections.
          </h2>
        </Item>
        <Item>
          <Lede onBrand>
            Starting with university campuses, Duevy aims to power how schools, associations and
            student communities collect, manage and reconcile payments.
          </Lede>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            { icon: UniversityIcon, title: "Universities", body: "Dues, levies, handouts and academic payments.", now: true },
            { icon: School01Icon, title: "Schools", body: "School fees and other institutional collections." },
            { icon: UserGroupIcon, title: "Associations", body: "Membership dues and group contributions." },
            { icon: Store01Icon, title: "Campus businesses", body: "Relevant products, services and promotions." },
          ].map((c) => (
            <Item key={c.title}>
              <div className="h-full rounded-3xl bg-[#08583f]/70 border border-white/10 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <IconBadge icon={c.icon} onBrand />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                    {c.now ? "Where we start" : "Where we go"}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg mt-6 mb-1.5">{c.title}</h3>
                <p className="text-white/75 text-[15px] leading-relaxed">{c.body}</p>
              </div>
            </Item>
          ))}
        </div>
        <Item>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl bg-[#08583f]/70 border border-white/10 p-6 backdrop-blur-md">
            <IconBadge icon={SmartPhone01Icon} onBrand />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">Duevy on Android and iOS</h3>
              <p className="text-white/75 text-[15px] leading-relaxed">
                Native mobile apps are coming, so members can pay dues and reps can manage collections
                from their phones.
              </p>
            </div>
            <StatusChip status="planned" onBrand />
          </div>
        </Item>
      </Stagger>
    ),
  },
  {
    title: "Why we win",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Why we win</Eyebrow>
        </Item>
        <Item>
          <Heading>Trust is the product.</Heading>
        </Item>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: SecurityCheckIcon,
              title: "Never in a rep's pocket",
              body: "Collections go through Duevy's checkout and payout flow — not a rep's personal account.",
            },
            {
              icon: UserCheck01Icon,
              title: "Verified before collecting",
              body: "NIN check plus a student-ID review in Duevy's admin console, which also handles disputes and refunds. Unverified spaces can't take payments.",
            },
            {
              icon: PinCodeIcon,
              title: "No single point of trust",
              body: "Withdrawals sit behind a security code — or need 2 of 3 reps to sign off. No one rep can move the money alone.",
            },
            {
              icon: WhatsappIcon,
              title: "WhatsApp-native distribution",
              body: "A link dropped in the class group is the whole onboarding — guests can pay without even signing up.",
            },
            {
              icon: Agreement01Icon,
              title: "Partner channels",
              body: "SUGs and associations like NACOS get a partner code that cuts withdrawal fees for every rep who signs up with it.",
            },
            {
              icon: Mortarboard01Icon,
              title: "Any school, any group",
              body: "Reps at any Nigerian university can apply — departments, faculties, associations and clubs.",
            },
          ].map((c) => (
            <Item key={c.title}>
              <Card {...c} />
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "Working together",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow>Working together</Eyebrow>
        </Item>
        <Item>
          <Heading>Where we could build together.</Heading>
        </Item>
        <Item>
          <Lede>
            You&apos;ve built for the education sector; we&apos;re building the collection layer
            underneath it. A few ideas worth exploring — not assumptions about what you need.
          </Lede>
        </Item>
        <div className="grid sm:grid-cols-2 gap-4 mt-12">
          {[
            {
              icon: Plug01Icon,
              title: "Technology integration",
              body: "Explore plugging Duevy's collection infrastructure into education platforms, so payments start where students and schools already are.",
            },
            {
              icon: Agreement01Icon,
              title: "Market access",
              body: "Reach institutions and student communities through relationships already built across the education ecosystem.",
            },
            {
              icon: Idea01Icon,
              title: "Strategic insight",
              body: "Learn from experience selling to and building for schools — what institutions buy, and how they decide.",
            },
            {
              icon: ChartUpIcon,
              title: "Joint opportunities",
              body: "Find places where Duevy's collections complement existing education products rather than compete with them.",
            },
          ].map((c) => (
            <Item key={c.title}>
              <Row {...c} />
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
  {
    title: "The ask",
    tone: "brand",
    render: () => (
      <Stagger className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <Item>
            <Eyebrow onBrand>From this conversation</Eyebrow>
          </Item>
          <Item>
            <h2 className="text-white font-semibold tracking-tight text-4xl md:text-6xl leading-[1.02]">
              Help us see what we can&apos;t yet.
            </h2>
          </Item>
          <Item>
            <p className="text-white/80 text-lg leading-relaxed mt-6 max-w-xl">
              We&apos;re early, and we know it. We&apos;d value the view of someone who has already
              built in this space.
            </p>
          </Item>
          <Item className="mt-10 flex flex-wrap gap-3">
            <a
              href="mailto:support@duevy.app"
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#0b6e4f] font-medium px-5 py-3 hover:bg-white/90 transition-colors"
            >
              <HugeiconsIcon icon={Mail01Icon} size={18} />
              support@duevy.app
            </a>
            <a
              href="/demo"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 text-white font-medium px-5 py-3 hover:bg-white/25 backdrop-blur-sm transition-colors"
            >
              <HugeiconsIcon icon={PlayCircleIcon} size={18} />
              duevy.app/demo
            </a>
          </Item>
          <Item className="mt-6 text-white/65 text-[15px]">@duevyapp on X & Instagram</Item>
        </div>
        <div className="space-y-3">
          {[
            { icon: Search01Icon, title: "Your honest assessment", body: "What's strong about Duevy, and what you'd question." },
            { icon: Idea01Icon, title: "How you see the opportunity", body: "Where campus and school payments are heading, from where you sit." },
            { icon: Agreement01Icon, title: "Whether there's a fit", body: "Any of the collaboration ideas worth a second conversation." },
            { icon: UserGroupIcon, title: "Introductions", body: "People in the education ecosystem we should be talking to." },
            { icon: MoneyBag01Icon, title: "Funding to scale", body: "How we get in front of angel investors and raise the funding to grow beyond our first campus." },
          ].map((c) => (
            <Item key={c.title}>
              <div className="flex gap-4 rounded-3xl bg-[#08583f]/70 border border-white/10 p-5 backdrop-blur-md">
                <IconBadge icon={c.icon} onBrand />
                <div>
                  <h3 className="text-white font-semibold">{c.title}</h3>
                  <p className="text-white/75 text-[14px] leading-relaxed mt-0.5">{c.body}</p>
                </div>
              </div>
            </Item>
          ))}
        </div>
      </Stagger>
    ),
  },
];
