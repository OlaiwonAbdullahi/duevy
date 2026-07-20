"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  BankIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { CardBrand } from "@/app/(dashboards)/dashboard/wallet/_components/CardBrand";
import { Modal } from "@/app/(dashboards)/dashboard/_components/Modal";
import { EmptyState } from "@/app/(dashboards)/dashboard/_components/EmptyState";
import { nairaFromKobo } from "@/app/(dashboards)/dashboard/_components/format";
import type { HugeIcon } from "@/app/(dashboards)/dashboard/_components/nav-config";
import type { Card } from "@/lib/api/types";

export type VoteMethod = "card" | "online";

export function PayVoteModal({
  totalKobo,
  cards,
  pending,
  onClose,
  onConfirm,
}: {
  totalKobo: number;
  cards: Card[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (method: VoteMethod, card?: Card) => void;
}) {
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];
  const [method, setMethod] = useState<VoteMethod>(cards.length ? "card" : "online");
  const [cardId, setCardId] = useState(defaultCard?.id ?? "");
  const selectedCard = cards.find((c) => c.id === cardId) ?? defaultCard;

  const valid = !pending && ((method === "card" && !!selectedCard) || method === "online");

  return (
    <Modal title="Confirm your vote" icon={CreditCardIcon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-ink-soft">Total</span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {nairaFromKobo(totalKobo)}
          </span>
        </div>
      </div>

      <p className="mt-5 text-xs font-medium text-ink-soft">Pay with</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <MethodTile
          active={method === "card"}
          icon={CreditCardIcon}
          label="Card"
          hint="Saved card"
          onClick={() => setMethod("card")}
        />
        <MethodTile
          active={method === "online"}
          icon={BankIcon}
          label="Bank transfer"
          hint="Pay by transfer"
          onClick={() => setMethod("online")}
        />
      </div>

      {method === "card" && (
        <div className="mt-3 flex flex-col gap-2">
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cloud">
              <EmptyState
                size="sm"
                icon={CreditCardIcon}
                title="No saved cards"
                description="Pay by “Bank transfer” instead — you can save a card afterwards."
              />
            </div>
          )}
          {cards.map((c) => {
            const on = c.id === cardId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCardId(c.id)}
                aria-pressed={on}
                aria-label={`Pay with ${c.brand} ending ${c.last4}`}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  on ? "border-brand bg-cloud" : "border-cloud bg-paper"
                }`}
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
      )}

      {method === "online" && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-cloud bg-paper p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-brand">
            <HugeiconsIcon icon={BankIcon} size={18} />
          </span>
          <p className="text-xs leading-relaxed text-ink-soft">
            You&apos;ll get a dedicated account to transfer to, right here in the app — no redirect.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!valid}
        onClick={() => onConfirm(method, method === "card" ? selectedCard : undefined)}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {pending
          ? "Processing…"
          : method === "online"
            ? "Get transfer details"
            : `Pay ${nairaFromKobo(totalKobo)}`}
        {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
      </button>
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
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col gap-1 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        active ? "border-brand bg-cloud" : "border-cloud bg-paper hover:bg-cloud"
      }`}
    >
      <HugeiconsIcon icon={icon} size={20} className={active ? "text-brand" : "text-ink"} />
      <span className="mt-1 text-[13px] font-semibold text-ink">{label}</span>
      <span className="truncate text-[11px] text-ink-soft">{hint}</span>
    </button>
  );
}
