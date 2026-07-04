import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CreditCardIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { CardBrand } from "./CardBrand";
import { EmptyState } from "../../_components/EmptyState";
import type { Card } from "./types";

export function PaymentMethods({
  cards,
  onAdd,
  onRemove,
  onMakeDefault,
}: {
  cards: Card[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMakeDefault: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Payment methods
        </h2>
        <Button
          onClick={onAdd}
          size="icon"
          className="rounded-full bg-paper text-brand hover:bg-cloud"
          aria-label="Add card"
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {cards.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cloud">
            <EmptyState
              icon={CreditCardIcon}
              title="No cards yet"
              description="Add a debit card to top up your wallet and pay dues in one tap."
            />
          </div>
        )}

        {cards.map((card) => (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-2xl border border-cloud bg-paper p-4"
          >
            <CardBrand brand={card.brand} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                •••• {card.last4}
                {card.isDefault && (
                  <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
                    Default
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-soft">Expires {card.expiry}</p>
            </div>
            {!card.isDefault && (
              <button
                onClick={() => onMakeDefault(card.id)}
                className="hidden text-xs font-semibold text-brand hover:underline sm:block cursor-pointer"
              >
                Make default
              </button>
            )}
            <Button
              onClick={() => onRemove(card.id)}
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-ink-soft hover:bg-canvas hover:text-ink"
              aria-label="Remove card"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </Button>
          </div>
        ))}

        <Button
          onClick={onAdd}
          variant="ghost"
          className="h-auto justify-center gap-2 rounded-2xl border border-dashed border-ink-soft/40 py-4 text-[13px] font-semibold text-ink hover:bg-paper"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add new card
        </Button>
      </div>
    </section>
  );
}
