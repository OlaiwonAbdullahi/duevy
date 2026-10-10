"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BalanceCard } from "./_components/BalanceCard";
import { ActivityList } from "./_components/ActivityList";
import { PaymentMethods } from "./_components/PaymentMethods";
import { TopUpModal } from "./_components/TopUpModal";
import { AddCardModal } from "./_components/AddCardModal";
import type { Activity, Card, TopUpSource } from "./_components/types";
import { naira } from "./_components/utils";

export default function WalletPage() {
  const [balance, setBalance] = useState(8500);
  const [cards, setCards] = useState<Card[]>([
    { id: "c1", brand: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
    { id: "c2", brand: "Mastercard", last4: "5309", expiry: "11/26", isDefault: false },
    { id: "c3", brand: "Verve", last4: "8821", expiry: "03/28", isDefault: false },
  ]);
  const [activity, setActivity] = useState<Activity[]>([
    { id: "a1", label: "Wallet top up", detail: "Visa •••• 4242 · 2 days ago", amount: 5000 },
    { id: "a2", label: "Departmental levy", detail: "CS Dept · 4 days ago", amount: -3500 },
    { id: "a3", label: "Wallet top up", detail: "Monnify · 1 week ago", amount: 7000 },
  ]);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);

  const handleTopUp = (amount: number, via: TopUpSource) => {
    // NOTE: the "online" path would, in production, create a transaction and
    // redirect to Monnify's hosted checkout — the wallet is credited from the
    // Monnify webhook. Here we credit optimistically so the demo stays live.
    setBalance((b) => b + amount);
    setActivity((list) => [
      {
        id: crypto.randomUUID(),
        label: "Wallet top up",
        detail:
          via.source === "card"
            ? `${via.card.brand} •••• ${via.card.last4} · Just now`
            : "Monnify · Just now",
        amount,
      },
      ...list,
    ]);
    setTopUpOpen(false);
    toast.success(`${naira(amount)} added to your wallet`, {
      description:
        via.source === "card"
          ? `Paid with ${via.card.brand} •••• ${via.card.last4}`
          : "Paid via Monnify",
    });
  };

  const handleAddCard = (card: Card) => {
    setCards((list) => [
      ...list.map((c) => (card.isDefault ? { ...c, isDefault: false } : c)),
      card,
    ]);
    setAddCardOpen(false);
    toast.success("Card added", {
      description: `${card.brand} •••• ${card.last4}`,
    });
  };

  const removeCard = (id: string) => {
    setCards((list) => list.filter((c) => c.id !== id));
    toast.success("Card removed");
  };

  const makeDefault = (id: string) => {
    setCards((list) => list.map((c) => ({ ...c, isDefault: c.id === id })));
    toast.success("Default card updated");
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
          onRemove={removeCard}
          onMakeDefault={makeDefault}
        />
      </div>

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
