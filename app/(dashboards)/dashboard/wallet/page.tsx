"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentMethods } from "./_components/PaymentMethods";
import { AddCardModal } from "./_components/AddCardModal";
import type { Card } from "@/lib/api/types";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { Skeleton } from "../_components/Skeleton";
import {
  listCards,
  saveCard,
  setDefaultCard,
  deleteCard,
} from "@/lib/api/wallet";
import { getPaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";

/** Survives the redirect round-trip so we can verify the add-card charge on return. */
const ADDCARD_REF_KEY = "duevy-addcard-ref";

function CardsSkeleton() {
  return (
    <div className="mt-6 max-w-md">
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

export default function PaymentMethodsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const [addCardOpen, setAddCardOpen] = useState(false);
  const [cardToRemove, setCardToRemove] = useState<Card | null>(null);

  async function refresh() {
    setCards(await listCards());
  }

  useEffect(() => {
    refresh()
      .catch(() => toast.error("Couldn't load your saved cards."))
      .finally(() => setLoading(false));
  }, []);

  // Card-save is the one payment flow that still redirects (tokenizing a card
  // needs a real card-entry step, which an in-app bank-transfer invoice can't
  // do) — verify the charge on return, same as before the payment migration.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("transactionReference");
    const ref = urlRef || sessionStorage.getItem(ADDCARD_REF_KEY);
    if (!ref) return;

    let cancelled = false;
    let attempts = 0;

    const finish = () => {
      sessionStorage.removeItem(ADDCARD_REF_KEY);
      const url = new URL(window.location.href);
      for (const k of ["reference", "paymentReference", "transactionReference", "status"]) {
        url.searchParams.delete(k);
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const verifying = toast.loading("Verifying your card…");

    const poll = async () => {
      try {
        const res = await getPaymentStatus(ref);
        if (cancelled) return;
        if (res.status === "completed") {
          toast.success("Card added", {
            id: verifying,
            description: "Your card is saved and ready to use.",
          });
          await refresh();
          finish();
          return;
        }
        if (res.status === "failed") {
          toast.error("Couldn't add card", {
            id: verifying,
            description: "You were not charged.",
          });
          finish();
          return;
        }
        if (attempts++ < 8) {
          setTimeout(poll, 2500);
        } else {
          toast.info("Still verifying your card", {
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

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddCard = async (isDefault: boolean) => {
    try {
      // No raw card fields ever touch this API — the gateway collects and
      // tokenizes the card on its hosted checkout; we only pass the "make
      // default" intent.
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

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Payment methods
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Save a card once, then pay your dues and votes in a tap.
        </p>
      </header>

      {loading ? (
        <CardsSkeleton />
      ) : (
        <div className="mt-6 max-w-md">
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
            ? `${cardToRemove.brand} •••• ${cardToRemove.last4} will be removed. You can add it again later.`
            : ""
        }
        confirmLabel="Remove card"
        onConfirm={() => cardToRemove && removeCard(cardToRemove)}
        onClose={() => setCardToRemove(null)}
      />

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
