import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CreditCardIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { CardBrand } from "./CardBrand";
import { EmptyState } from "../../_components/EmptyState";
import type { Card } from "@/lib/api/types";

/** The saved-card list + add/remove/default actions. Content only — the
 *  caller supplies the surrounding card chrome (icon, title, description). */
export function PaymentMethods({
  cards,
  onAdd,
  onRemove,
  onMakeDefault,
}: {
  cards: Card[];
  onAdd: () => void;
  onRemove: (card: Card) => void;
  onMakeDefault: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        {cards.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cloud">
            <EmptyState
              icon={CreditCardIcon}
              title="No cards yet"
              description="Add a debit card to pay dues and votes in one tap."
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
                type="button"
                onClick={() => onMakeDefault(card.id)}
                aria-label={`Make ${card.brand} ending ${card.last4} the default card`}
                className="hidden rounded-full px-1 text-xs font-semibold text-brand hover:underline sm:block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Make default
              </button>
            )}
            <Button
              onClick={() => onRemove(card)}
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-ink-soft hover:bg-canvas hover:text-ink"
              aria-label={`Remove ${card.brand} ending ${card.last4}`}
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
    </>
  );
}
