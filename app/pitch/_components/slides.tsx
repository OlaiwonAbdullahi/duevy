"use client";

import { useState } from "react";
import Image from "next/image";
import { m } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Agreement01Icon,
  AlertCircleIcon,
  AuditIcon,
  BankIcon,
  Building03Icon,
  CheckListIcon,
  FileExportIcon,
  Globe02Icon,
  Invoice01Icon,
  Link01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  MoneyBag01Icon,
  Note01Icon,
  Notification03Icon,
  PercentIcon,
  PinCodeIcon,
  SecurityCheckIcon,
  SecurityLockIcon,
  SmartPhone01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  UniversityIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";

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

/* ── Interactive revenue model ───────────────────────────────────────────── */

function RevenueModel() {
  const [students, setStudents] = useState(50000);
  const [due, setDue] = useState(5000);
  const [payments, setPayments] = useState(4);

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
      display: students.toLocaleString("en-NG"),
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
          {`Duevy keeps ${naira(perPayment)} on a ${naira(due)} payment after processing costs. Dues checkout only — withdrawal fees are on top.`}
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
              Collect dues. Track every kobo. No wahala.
            </h1>
          </Item>
          <Item>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed mt-8 max-w-xl">
              Duevy gives verified campus reps a clean way to collect dues by bank transfer — and
              gives every student a receipt for every naira.
            </p>
          </Item>
          <Item className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-white/65 text-[15px]">
            <span>duevy.app</span>
            <span>Live today</span>
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
            { icon: SmartPhone01Icon, title: "Installable app", body: "Works in any browser; add to home screen with an offline fallback." },
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
    title: "Business model",
    tone: "brand",
    render: () => (
      <Stagger>
        <Item>
          <Eyebrow onBrand>Business model</Eyebrow>
        </Item>
        <Item>
          <Heading onBrand>We earn when money moves.</Heading>
        </Item>
        <Item>
          <Lede onBrand>
            No setup fees. No subscriptions. A transparent fee per transaction, shown before
            anyone confirms — so revenue scales with payment volume.
          </Lede>
        </Item>
        <div className="grid lg:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: PercentIcon,
              price: "2% + ₦20",
              title: "Dues checkout",
              body: "Added on top for the student, capped at ₦2,020. The department receives the full due.",
            },
            {
              icon: BankIcon,
              price: "₦100 / ₦200",
              title: "Rep withdrawal",
              body: "Flat fee: ₦100 under ₦50,000, ₦200 at ₦50,000 and above.",
            },
            {
              icon: SecurityCheckIcon,
              price: "₦0",
              title: "To get started",
              body: "No cost to open a space, invite students or keep it running.",
            },
          ].map((s) => (
            <Item key={s.title}>
              <div className="h-full rounded-3xl bg-[#08583f]/70 border border-white/10 p-6 md:p-7 backdrop-blur-md">
                <IconBadge icon={s.icon} onBrand />
                <p className="text-white font-semibold tracking-tight text-4xl md:text-5xl mt-8">
                  {s.price}
                </p>
                <h3 className="text-white font-semibold text-lg mt-3 mb-1.5">{s.title}</h3>
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
    title: "Market",
    render: () => (
      <Stagger>
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-14 items-end mb-10">
          <div className="lg:col-span-3">
            <Item>
              <Eyebrow>Market</Eyebrow>
            </Item>
            <Item>
              <Heading>2M+ students pay dues every session.</Heading>
            </Item>
          </div>
          <Item className="lg:col-span-2">
            <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
              Every class, department, faculty, association and club collects money — today
              almost none of it is on a ledger. Drag to model the opportunity.
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
    title: "Let's talk",
    tone: "brand",
    render: () => (
      <Stagger className="text-center flex flex-col items-center">
        <Item>
          <Eyebrow onBrand>Let&apos;s talk</Eyebrow>
        </Item>
        <Item>
          <h2 className="text-white font-semibold tracking-tight text-4xl md:text-6xl lg:text-7xl leading-[1.02] max-w-4xl">
            Let&apos;s run campus money the clean way.
          </h2>
        </Item>
        <Item>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed mt-6 max-w-xl">
            Whether you&apos;re collecting dues or paying them, Duevy keeps everyone honest.
          </p>
        </Item>
        <Item className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:support@duevy.app"
            className="inline-flex items-center gap-2 rounded-full bg-white text-[#0b6e4f] font-medium px-5 py-3 hover:bg-white/90 transition-colors"
          >
            <HugeiconsIcon icon={Mail01Icon} size={18} />
            support@duevy.app
          </a>
          <a
            href="https://duevy.app"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 text-white font-medium px-5 py-3 hover:bg-white/25 backdrop-blur-sm transition-colors"
          >
            <HugeiconsIcon icon={Globe02Icon} size={18} />
            duevy.app
          </a>
        </Item>
        <Item className="mt-8 text-white/65 text-[15px]">@duevyapp on X & Instagram</Item>
      </Stagger>
    ),
  },
];
