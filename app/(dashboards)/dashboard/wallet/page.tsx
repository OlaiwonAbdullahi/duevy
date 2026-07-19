"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BalanceCard } from "./_components/BalanceCard";
import { ActivityList } from "./_components/ActivityList";
import { PaymentMethods } from "./_components/PaymentMethods";
import { TopUpModal } from "./_components/TopUpModal";
import { AddCardModal } from "./_components/AddCardModal";
import type { Activity, Card, TopUpSource } from "./_components/types";
import { naira } from "./_components/utils";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { fromKobo } from "../_components/format";
import { useRole } from "../_components/role-context";
import { Skeleton } from "../_components/Skeleton";
import {
  getWallet,
  getWalletActivity,
  topUp,
  listCards,
  saveCard,
  setDefaultCard,
  deleteCard,
  type WalletActivity,
} from "@/lib/api/wallet";
import { getPaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { useActivePaymentGateway } from "@/lib/hooks/useActivePaymentGateway";

/** Survives the Paystack round-trip so we can verify the top-up on return. */
const TOPUP_REF_KEY = "duevy-topup-ref";
/** Same idea, but for a card being verified + tokenized via the add-card flow. */
const ADDCARD_REF_KEY = "duevy-addcard-ref";

/** API wallet-activity row (kobo) → the activity list shape (whole naira). */
function toActivity(a: WalletActivity): Activity {
  return {
    id: a.id,
    label: a.label,
    detail: a.detail,
    amount: a.amount / 100,
  };
}

function WalletSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="rounded-3xl border border-cloud bg-canvas p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 flex flex-col divide-y divide-cloud">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-cloud bg-canvas p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-17 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { isPendingRep } = useRole();
  const gatewayName = useActivePaymentGateway();
  const [balance, setBalance] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [cardToRemove, setCardToRemove] = useState<Card | null>(null);

  async function refresh() {
    const [wallet, savedCards, activityRows] = await Promise.all([
      getWallet(),
      listCards(),
      getWalletActivity(),
    ]);
    setBalance(fromKobo(wallet.balance));
    setCards(savedCards);
    setActivity(activityRows.map(toActivity));
  }

  useEffect(() => {
    refresh()
      .catch(() => toast.error("Couldn't load your wallet."))
      .finally(() => setLoading(false));
  }, []);

  // On return from Paystack hosted checkout (either a top-up or an add-card
  // verification charge), confirm the payment and reconcile local state. The
  // reference comes back on the URL, with a sessionStorage fallback set before
  // we redirected out.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("transactionReference");

    const topUpRef = urlRef || sessionStorage.getItem(TOPUP_REF_KEY);
    const addCardRef = sessionStorage.getItem(ADDCARD_REF_KEY);
    // A top-up ref always wins if both are somehow set — only one flow can be
    // in-flight at a time in practice.
    const kind: "topup" | "addcard" | null = topUpRef
      ? "topup"
      : addCardRef
        ? "addcard"
        : null;
    const ref = kind === "topup" ? topUpRef : addCardRef;
    if (!ref || !kind) return;

    let cancelled = false;
    let attempts = 0;

    const finish = () => {
      sessionStorage.removeItem(TOPUP_REF_KEY);
      sessionStorage.removeItem(ADDCARD_REF_KEY);
      const url = new URL(window.location.href);
      for (const k of ["reference", "paymentReference", "transactionReference", "status"]) {
        url.searchParams.delete(k);
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const verifying = toast.loading(
      kind === "topup" ? "Confirming your top up…" : "Verifying your card…",
    );

    const poll = async () => {
      try {
        const res = await getPaymentStatus(ref);
        if (cancelled) return;
        if (res.status === "completed") {
          toast.success(kind === "topup" ? "Top up confirmed" : "Card added", {
            id: verifying,
            description:
              kind === "topup"
                ? "Your wallet has been credited."
                : "Your card is saved and ready to use.",
          });
          await refresh();
          finish();
          return;
        }
        if (res.status === "failed") {
          toast.error(kind === "topup" ? "Top up failed" : "Couldn't add card", {
            id: verifying,
            description: "You were not charged.",
          });
          finish();
          return;
        }
        // Still pending — the webhook may not have landed yet; retry a few times.
        if (attempts++ < 8) {
          setTimeout(poll, 2500);
        } else {
          toast.info(
            kind === "topup" ? "Top up is still processing" : "Still verifying your card",
            {
              id: verifying,
              description: "We'll update this once it clears.",
            },
          );
          finish();
        }
      } catch {
        if (!cancelled) {
          toast.dismiss(verifying);
          finish();
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTopUp = async (amount: number, via: TopUpSource) => {
    if (isPendingRep) {
      toast.info("Paused during review", {
        description: "Top-ups unlock once your rep application is approved.",
      });
      return;
    }
    try {
      if (via.source === "online") {
        // Hosted checkout — redirect out; verified on return (see effect above),
        // and ultimately credited by the Paystack webhook.
        const res = await topUp({ amount: amount * 100, method: "online" });
        if (res.reference) sessionStorage.setItem(TOPUP_REF_KEY, res.reference);
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
          return;
        }
      } else {
        await topUp({ amount: amount * 100, method: "card", cardId: via.card.id });
      }
      setTopUpOpen(false);
      toast.success(`${naira(amount)} added to your wallet`, {
        description:
          via.source === "card"
            ? `Paid with ${via.card.brand} •••• ${via.card.last4}`
            : `Paid via ${gatewayName}`,
      });
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Top up failed. Please try again.");
    }
  };

  const handleAddCard = async (isDefault: boolean) => {
    try {
      // No raw card fields ever touch this API — Paystack collects and tokenizes
      // the card on its hosted checkout; we only pass the "make default" intent.
      const res = await saveCard({ isDefault });
      if (res.reference) sessionStorage.setItem(ADDCARD_REF_KEY, res.reference);
      setAddCardOpen(false);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't start adding a card. Please try again.",
      );
    }
  };

  const removeCard = async (card: Card) => {
    const prev = cards;
    setCards((list) => list.filter((c) => c.id !== card.id));
    setCardToRemove(null);
    try {
      await deleteCard(card.id);
      toast.success("Card removed", { description: `${card.brand} •••• ${card.last4}` });
    } catch {
      setCards(prev);
      toast.error("Couldn't remove the card.");
    }
  };

  const makeDefault = async (id: string) => {
    const prev = cards;
    setCards((list) => list.map((c) => ({ ...c, isDefault: c.id === id })));
    try {
      await setDefaultCard(id);
      toast.success("Default card updated");
    } catch {
      setCards(prev);
      toast.error("Couldn't update the default card.");
    }
  };

  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Wallet
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Top up once, then pay your dues in a tap.
        </p>
      </header>

      {loading ? (
        <WalletSkeleton />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-6">
            <BalanceCard balance={balance} onTopUp={() => setTopUpOpen(true)} />
            <ActivityList activity={activity} />
          </div>

          <PaymentMethods
            cards={cards}
            onAdd={() => setAddCardOpen(true)}
            onRemove={setCardToRemove}
            onMakeDefault={makeDefault}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!cardToRemove}
        title="Remove this card?"
        description={
          cardToRemove
            ? `${cardToRemove.brand} •••• ${cardToRemove.last4} will be removed from your wallet. You can add it again later.`
            : ""
        }
        confirmLabel="Remove card"
        onConfirm={() => cardToRemove && removeCard(cardToRemove)}
        onClose={() => setCardToRemove(null)}
      />

      {topUpOpen && (
        <TopUpModal
          cards={cards}
          defaultCard={defaultCard}
          onClose={() => setTopUpOpen(false)}
          onConfirm={handleTopUp}
        />
      )}
      {addCardOpen && (
        <AddCardModal
          hasCards={cards.length > 0}
          onClose={() => setAddCardOpen(false)}
          onContinue={handleAddCard}
        />
      )}
    </div>
  );
}
