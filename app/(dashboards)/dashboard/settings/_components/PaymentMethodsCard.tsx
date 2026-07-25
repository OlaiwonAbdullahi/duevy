"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "./SettingsCard";
import { PaymentMethods } from "../../wallet/_components/PaymentMethods";
import { AddCardModal } from "../../wallet/_components/AddCardModal";
import { ADDCARD_REF_KEY } from "../../wallet/_components/utils";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { Skeleton } from "../../_components/Skeleton";
import { listCards, saveCard, setDefaultCard, deleteCard } from "@/lib/api/wallet";
import { ApiError } from "@/lib/api/errors";
import type { Card } from "@/lib/api/types";

export function PaymentMethodsCard() {
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

  if (loading) {
    return (
      <SettingsCard
        icon={CreditCardIcon}
        title="Payment methods"
        description="Save a card once, then pay your dues and votes in a tap."
      >
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-17 rounded-2xl" />
          ))}
        </div>
      </SettingsCard>
    );
  }

  return (
    <>
      <SettingsCard
        icon={CreditCardIcon}
        title="Payment methods"
        description="Save a card once, then pay your dues and votes in a tap."
      >
        <PaymentMethods
          cards={cards}
          onAdd={() => setAddCardOpen(true)}
          onRemove={setCardToRemove}
          onMakeDefault={makeDefault}
        />
      </SettingsCard>

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
    </>
  );
}
