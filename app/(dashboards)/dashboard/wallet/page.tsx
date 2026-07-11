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
import {
  getWallet,
  getWalletActivity,
  topUp,
  listCards,
  setDefaultCard,
  deleteCard,
  type WalletActivity,
} from "@/lib/api/wallet";
import { getPaymentStatus } from "@/lib/api/dues";

/** Survives the Monnify round-trip so we can verify the top-up on return. */
const TOPUP_REF_KEY = "duevy-topup-ref";

/** API wallet-activity row (kobo) → the activity list shape (whole naira). */
function toActivity(a: WalletActivity): Activity {
  return {
    id: a.id,
    label: a.label,
    detail: a.detail,
    amount: a.amount / 100,
  };
}

export default function WalletPage() {
  const { isPendingRep } = useRole();
  const [balance, setBalance] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

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
    refresh().catch(() => toast.error("Couldn't load your wallet."));
  }, []);

  // On return from Monnify hosted checkout, verify the top-up and credit the
  // wallet. The reference comes back on the URL, with a sessionStorage fallback
  // set before we redirected out.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("transactionReference") ||
      sessionStorage.getItem(TOPUP_REF_KEY);
    if (!ref) return;

    let cancelled = false;
    let attempts = 0;

    const finish = () => {
      sessionStorage.removeItem(TOPUP_REF_KEY);
      const url = new URL(window.location.href);
      for (const k of ["reference", "paymentReference", "transactionReference", "status"]) {
        url.searchParams.delete(k);
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const verifying = toast.loading("Confirming your top up…");

    const poll = async () => {
      try {
        const res = await getPaymentStatus(ref);
        if (cancelled) return;
        if (res.status === "completed") {
          toast.success("Top up confirmed", {
            id: verifying,
            description: "Your wallet has been credited.",
          });
          await refresh();
          finish();
          return;
        }
        if (res.status === "failed") {
          toast.error("Top up failed", {
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
          toast.info("Top up is still processing", {
            id: verifying,
            description: "We'll update your balance once it clears.",
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

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // and ultimately credited by the Monnify webhook.
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
            : "Paid via Monnify",
      });
      await refresh();
    } catch {
      toast.error("Top up failed. Please try again.");
    }
  };

  const handleAddCard = (card: Card) => {
    // NOTE: real card capture needs the PSP inline tokenization SDK to produce a
    // `providerToken` for `POST /wallet/cards`. That SDK isn't wired in this app
    // yet, so we add the card locally; swap for `saveCard({ providerToken })`
    // once tokenization lands.
    setCards((list) => [
      ...list.map((c) => (card.isDefault ? { ...c, isDefault: false } : c)),
      card,
    ]);
    setAddCardOpen(false);
    toast.success("Card added", {
      description: `${card.brand} •••• ${card.last4}`,
    });
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
        <AddCardModal onClose={() => setAddCardOpen(false)} onAdd={handleAddCard} />
      )}
    </div>
  );
}
