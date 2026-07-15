"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Share08Icon,
  Copy01Icon,
  Tick02Icon,
  SquareLock02Icon,
  Megaphone01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getPoll,
  castVote,
  type VoteSelection,
  type CastVotePayload,
} from "@/lib/api/polls";
import { getWallet, listCards } from "@/lib/api/wallet";
import { getPaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "@/app/(dashboards)/dashboard/_components/format";
import { EmptyState } from "@/app/(dashboards)/dashboard/_components/EmptyState";
import { Skeleton } from "@/app/(dashboards)/dashboard/_components/Skeleton";
import { UserAvatar } from "@/app/(dashboards)/dashboard/_components/UserAvatar";
import type { Card, Poll } from "@/lib/api/types";
import { CategoryVoter } from "./_components/CategoryVoter";
import { PayVoteModal, type VoteMethod } from "./_components/PayVoteModal";
import { useCountdown } from "./_components/useCountdown";

const voteRefKey = (slug: string) => `duevy-vote-ref-${slug}`;

type Selection = { nomineeId: string; quantity: number };

export default function VotePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user, status } = useAuth();
  const authenticated = status === "authenticated";

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [membersOnlyBlocked, setMembersOnlyBlocked] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [walletKobo, setWalletKobo] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const p = await getPoll(slug);
      setPoll(p);
      setNotFound(false);
      setMembersOnlyBlocked(false);
      setActiveCategoryId((prev) => prev ?? p.categories[0]?.id ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "MEMBERS_ONLY") {
        setMembersOnlyBlocked(true);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // On return from Monnify hosted checkout for an "online" vote payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("transactionReference");
    const ref = urlRef || sessionStorage.getItem(voteRefKey(slug));
    if (!ref) return;

    let cancelled = false;
    let attempts = 0;

    const finish = () => {
      sessionStorage.removeItem(voteRefKey(slug));
      const url = new URL(window.location.href);
      for (const k of ["reference", "paymentReference", "transactionReference", "status"]) {
        url.searchParams.delete(k);
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const verifying = toast.loading("Confirming your vote…");

    const checkStatus = async () => {
      try {
        const res = await getPaymentStatus(ref);
        if (cancelled) return;
        if (res.status === "completed") {
          toast.dismiss(verifying);
          setLastReceiptId(ref);
          setSuccessOpen(true);
          setSelections({});
          await load();
          finish();
          return;
        }
        if (res.status === "failed") {
          toast.error("Payment failed", {
            id: verifying,
            description: "You were not charged — your vote wasn't counted.",
          });
          finish();
          return;
        }
        if (attempts++ < 8) {
          setTimeout(checkStatus, 2500);
        } else {
          toast.info("Still processing", {
            id: verifying,
            description: "We'll update this once it clears.",
          });
          finish();
        }
      } catch {
        if (!cancelled) {
          toast.dismiss(verifying);
          finish();
        }
      }
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const select = (categoryId: string, nomineeId: string) => {
    setSelections((prev) => {
      const current = prev[categoryId];
      if (current?.nomineeId === nomineeId) {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      }
      return { ...prev, [categoryId]: { nomineeId, quantity: current?.quantity ?? 1 } };
    });
  };

  const setQuantity = (categoryId: string, quantity: number) => {
    setSelections((prev) =>
      prev[categoryId] ? { ...prev, [categoryId]: { ...prev[categoryId], quantity } } : prev,
    );
  };

  const selectionCount = Object.keys(selections).length;
  const totalKobo = poll?.paid
    ? Object.values(selections).reduce((sum, s) => sum + poll.amountPerVote * s.quantity, 0)
    : 0;

  function buildVoteSelections(): VoteSelection[] {
    return Object.entries(selections).map(([categoryId, s]) => ({
      categoryId,
      nomineeId: s.nomineeId,
      quantity: s.quantity,
    }));
  }

  async function submitVote(payload: CastVotePayload) {
    setSubmitting(true);
    try {
      const res = await castVote(slug, payload);
      if (res.checkoutUrl) {
        if (res.reference) sessionStorage.setItem(voteRefKey(slug), res.reference);
        window.location.href = res.checkoutUrl;
        return;
      }
      setLastReceiptId(res.receiptId ?? null);
      setSuccessOpen(true);
      setSelections({});
      setPayOpen(false);
      await load();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      const message =
        code === "ALREADY_VOTED"
          ? "You've already voted in that award."
          : code === "POLL_CLOSED"
            ? "Voting has closed for this poll."
            : code === "INSUFFICIENT_FUNDS"
              ? "Insufficient wallet balance."
              : code === "CARD_DECLINED"
                ? "That card was declined."
                : err instanceof ApiError
                  ? err.message
                  : "Couldn't cast your vote. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const castNow = async () => {
    if (selectionCount === 0) return;
    if (!authenticated) {
      router.push(`/login?next=${encodeURIComponent(`/vote/${slug}`)}`);
      return;
    }
    if (!poll?.paid) {
      await submitVote({ selections: buildVoteSelections() });
      return;
    }
    // Paid — fetch wallet/cards on demand, then open the method picker.
    setPayLoading(true);
    try {
      const [wallet, savedCards] = await Promise.all([getWallet(), listCards()]);
      setWalletKobo(wallet.balance);
      setCards(savedCards);
      setPayOpen(true);
    } catch {
      toast.error("Couldn't load your payment options.");
    } finally {
      setPayLoading(false);
    }
  };

  const confirmPay = async (method: VoteMethod, card?: Card) => {
    const voteSelections = buildVoteSelections();
    if (method === "card" && card) {
      await submitVote({ selections: voteSelections, method: "card", cardId: card.id });
    } else if (method === "wallet") {
      await submitVote({ selections: voteSelections, method: "wallet" });
    } else {
      await submitVote({ selections: voteSelections, method: "online" });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share && poll) {
      try {
        await navigator.share({
          title: poll.title,
          text: `Vote in "${poll.title}" on Duevy`,
          url: window.location.href,
        });
        return;
      } catch {
        // cancelled — fall through to copy
      }
    }
    await copyLink();
  };

  const closed = poll?.status === "closed";
  const activeCategory = poll?.categories.find((c) => c.id === activeCategoryId) ?? null;

  return (
    <main className="min-h-screen bg-canvas pb-28">
      <header className="relative z-10 bg-brand px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white cursor-pointer">
            Duevy.
          </Link>
          {authenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full bg-black/20 py-1 pl-1 pr-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/30 cursor-pointer"
            >
              <UserAvatar name={user?.name ?? ""} src={user?.avatarUrl} size={26} />
              Dashboard
            </Link>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/vote/${slug}`)}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-8">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
          </div>
        </div>
      ) : notFound ? (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
          <EmptyState
            icon={Megaphone01Icon}
            title="Poll not found"
            description="This voting link doesn't exist, or the poll hasn't been published yet."
          />
        </div>
      ) : membersOnlyBlocked ? (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
          <EmptyState
            icon={SquareLock02Icon}
            title="Members only"
            description={
              authenticated
                ? "This poll is limited to verified members of its department."
                : "This poll is limited to verified department members. Sign in to check if you qualify."
            }
            action={
              !authenticated && (
                <Link
                  href={`/login?next=${encodeURIComponent(`/vote/${slug}`)}`}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
                >
                  Sign in
                </Link>
              )
            }
          />
        </div>
      ) : poll ? (
        <>
          <PollHero poll={poll} onShare={share} onCopy={copyLink} copied={copied} />

          <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-8">
            {poll.categories.length > 1 && (
              <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {poll.categories.map((category) => {
                  const active = category.id === activeCategoryId;
                  const done =
                    !!selections[category.id] ||
                    (authenticated && typeof category.remaining === "number" && category.remaining <= 0);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-300 cursor-pointer ${
                        active
                          ? "bg-brand text-white"
                          : "bg-paper text-ink-soft hover:bg-cloud hover:text-ink"
                      }`}
                    >
                      {category.title}
                      {done && (
                        <span
                          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                            active ? "bg-white" : "bg-brand"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {activeCategory && (
                <motion.div
                  key={activeCategory.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-5"
                >
                  <CategoryVoter
                    category={activeCategory}
                    closed={closed}
                    locked={
                      authenticated &&
                      typeof activeCategory.remaining === "number" &&
                      activeCategory.remaining <= 0
                    }
                    selectedNomineeId={selections[activeCategory.id]?.nomineeId}
                    quantity={selections[activeCategory.id]?.quantity ?? 1}
                    allowQuantity={poll.paid && !poll.membersOnly}
                    amountPerVote={poll.amountPerVote}
                    onSelect={(nomineeId) => select(activeCategory.id, nomineeId)}
                    onQuantityChange={(q) => setQuantity(activeCategory.id, q)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : null}

      {poll && poll.status === "active" && selectionCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-3xl border border-cloud bg-canvas/95 px-5 py-3.5 shadow-lg shadow-black/5 backdrop-blur-md">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {selectionCount} award{selectionCount === 1 ? "" : "s"} selected
              </p>
              {poll.paid && (
                <p className="text-xs text-ink-soft">{nairaFromKobo(totalKobo)} total</p>
              )}
            </div>
            <button
              type="button"
              onClick={castNow}
              disabled={payLoading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
            >
              {payLoading
                ? "Loading…"
                : !authenticated
                  ? "Sign in to vote"
                  : poll.paid
                    ? "Continue"
                    : "Cast vote"}
            </button>
          </div>
        </div>
      )}

      {payOpen && (
        <PayVoteModal
          totalKobo={totalKobo}
          balanceKobo={walletKobo}
          cards={cards}
          pending={submitting}
          onClose={() => (submitting ? null : setPayOpen(false))}
          onConfirm={confirmPay}
        />
      )}

      <AnimatePresence>
        {successOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4"
            onClick={() => setSuccessOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-cloud bg-canvas p-6 text-center shadow-xl"
            >
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} />
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                Vote counted!
              </h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                Thanks for voting{poll ? ` in "${poll.title}"` : ""}.
              </p>
              {lastReceiptId && (
                <p className="mt-3 rounded-2xl bg-paper px-3 py-2 text-xs text-ink-soft">
                  Receipt {lastReceiptId}
                </p>
              )}
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PollHero({
  poll,
  onShare,
  onCopy,
  copied,
}: {
  poll: Poll;
  onShare: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const countdown = useCountdown(poll.deadline);
  const statusMeta = {
    draft: { label: "Draft", className: "bg-white/15 text-white" },
    active: { label: "Live", className: "bg-white/90 text-brand" },
    closed: { label: "Closed", className: "bg-amber-400 text-amber-950" },
  }[poll.status];

  return (
    <div className="relative min-h-72 overflow-hidden">
      {/* Background: real cover photo if the rep set one, else a brand gradient. */}
      <div className="absolute inset-0 bg-brand">
        {poll.coverImageUrl && (
          <Image src={poll.coverImageUrl} alt="" fill unoptimized className="object-cover" priority />
        )}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            maskImage: "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
            WebkitMaskImage: "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col justify-end px-4 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
          {poll.paid && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {nairaFromKobo(poll.amountPerVote)}/vote
            </span>
          )}
          {poll.membersOnly && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              Members only
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/80">
            {poll.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {poll.status === "active" && !countdown.expired && (
            <div className="flex items-center gap-1.5">
              <CountdownChip value={countdown.days} label="d" />
              <CountdownChip value={countdown.hours} label="h" />
              <CountdownChip value={countdown.minutes} label="m" />
              <CountdownChip value={countdown.seconds} label="s" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/25 cursor-pointer"
            >
              <HugeiconsIcon icon={Share08Icon} size={14} />
              Share
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/25 cursor-pointer"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
      <span className="text-base font-bold tabular-nums leading-none text-white">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-white/70">
        {label}
      </span>
    </div>
  );
}
