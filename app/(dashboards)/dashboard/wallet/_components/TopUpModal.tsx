"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneyAdd01Icon,
  CreditCardIcon,
  BankIcon,
  CheckmarkCircle02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { CardBrand } from "./CardBrand";
import type { Card, TopUpMethod, TopUpSource } from "./types";
import { TOP_UP_PRESETS, naira } from "./utils";
import type { HugeIcon } from "../../_components/nav-config";
import { EmptyState } from "../../_components/EmptyState";

export function TopUpModal({
  cards,
  defaultCard,
  onClose,
  onConfirm,
}: {
  cards: Card[];
  defaultCard: Card | undefined;
  onClose: () => void;
  onConfirm: (amount: number, via: TopUpSource) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<TopUpMethod>(
    cards.length ? "card" : "online",
  );
  const [cardId, setCardId] = useState(defaultCard?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const selectedCard = cards.find((c) => c.id === cardId) ?? defaultCard;
  const value = typeof amount === "number" ? amount : 0;
  const amountOk = value >= 100;
  const valid = amountOk && (method === "online" || !!selectedCard);

  const confirm = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      if (method === "card" && selectedCard) {
        await onConfirm(value, { source: "card", card: selectedCard });
      } else {
        await onConfirm(value, { source: "online" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ctaLabel = submitting
    ? method === "online"
      ? "Redirecting…"
      : "Topping up…"
    : method === "online"
      ? "Continue to Paystack"
      : amountOk
        ? `Top up ${naira(value)}`
        : "Enter an amount";

  return (
    <Modal title="Top up wallet" icon={MoneyAdd01Icon} onClose={onClose}>
      {/* Amount presets */}
      <div className="grid grid-cols-4 gap-2">
        {TOP_UP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={amount === preset}
            onClick={() => setAmount(preset)}
            className={cn(
              "rounded-2xl border py-2.5 text-sm font-semibold transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              amount === preset
                ? "border-brand bg-cloud text-brand"
                : "border-cloud bg-paper text-ink hover:bg-cloud",
            )}
          >
            ₦{preset.toLocaleString()}
          </button>
        ))}
      </div>

      <Label className="mt-4 block text-xs font-medium text-ink-soft">
        Or enter an amount
      </Label>
      <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
        <span className="text-sm text-ink-soft">₦</span>
        <Input
          type="number"
          inputMode="numeric"
          min={100}
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="0"
          className={BARE_INPUT}
        />
      </div>

      {/* Method */}
      <p className="mt-5 text-xs font-medium text-ink-soft">Pay with</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <MethodTile
          active={method === "card"}
          icon={CreditCardIcon}
          label="Debit card"
          hint="Saved card"
          onClick={() => setMethod("card")}
        />
        <MethodTile
          active={method === "online"}
          icon={BankIcon}
          label="Pay online"
          hint="Card, transfer, USSD"
          onClick={() => setMethod("online")}
        />
      </div>

      {/* Method detail */}
      {method === "card" ? (
        <div className="mt-3 flex flex-col gap-2">
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cloud">
              <EmptyState
                size="sm"
                icon={CreditCardIcon}
                title="No saved cards"
                description="Add a card in your wallet, or use “Pay online” instead."
              />
            </div>
          )}
          {cards.map((c) => {
            const on = c.id === cardId;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                aria-label={`Top up with ${c.brand} ending ${c.last4}`}
                onClick={() => setCardId(c.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  on ? "border-brand bg-cloud" : "border-cloud bg-paper",
                )}
              >
                <CardBrand brand={c.brand} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {c.brand} •••• {c.last4}
                  </p>
                  <p className="text-xs text-ink-soft">Expires {c.expiry}</p>
                </div>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={18}
                  className={on ? "text-brand" : "text-ink-soft/30"}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-cloud bg-paper p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-brand">
            <HugeiconsIcon icon={BankIcon} size={18} />
          </span>
          <p className="text-xs leading-relaxed text-ink-soft">
            You&apos;ll be securely redirected to{" "}
            <span className="font-semibold text-ink">Paystack</span> to finish
            paying by card, bank transfer or USSD.
          </p>
        </div>
      )}

      <Button
        variant="brand"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={confirm}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {ctaLabel}
        {!submitting && method === "online" && valid && (
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
        )}
      </Button>
    </Modal>
  );
}

function MethodTile({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: HugeIcon;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        active
          ? "border-brand bg-cloud"
          : "border-cloud bg-paper hover:bg-cloud",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={20}
        className={active ? "text-brand" : "text-ink"}
      />
      <span className="mt-1 text-[13px] font-semibold text-ink">{label}</span>
      <span className="text-[11px] text-ink-soft">{hint}</span>
    </button>
  );
}
