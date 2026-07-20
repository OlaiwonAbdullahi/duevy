import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  BankIcon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  InvoiceIcon,
  Discount01Icon,
} from "@hugeicons/core-free-icons";
import { CardBrand } from "../../wallet/_components/CardBrand";
import type { Card } from "@/lib/api/types";
import { Modal } from "../../_components/Modal";
import type { Due, PayMethod, Space } from "./types";
import { naira, CATEGORY_LABEL, SPACE_KIND_LABEL } from "./data";
import type { HugeIcon } from "../../_components/nav-config";
import { EmptyState } from "../../_components/EmptyState";
import { useActivePaymentGateway } from "@/lib/hooks/useActivePaymentGateway";

export function PayDueModal({
  dues,
  space,
  cards,
  pending,
  onClose,
  onConfirm,
}: {
  dues: Due[];
  space: Space;
  cards: Card[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (method: PayMethod, card?: Card, discountCode?: string) => void;
}) {
  const gatewayName = useActivePaymentGateway();
  const total = dues.reduce((sum, d) => sum + d.amount, 0);
  const multi = dues.length > 1;
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];

  const [method, setMethod] = useState<PayMethod>(cards.length ? "card" : "online");
  const [cardId, setCardId] = useState(defaultCard?.id ?? "");
  const [discountCode, setDiscountCode] = useState("");
  const selectedCard = cards.find((c) => c.id === cardId) ?? defaultCard;

  const valid = !pending && ((method === "card" && !!selectedCard) || method === "online");

  const title = multi ? `Pay ${dues.length} dues` : "Confirm payment";

  return (
    <Modal title={title} icon={InvoiceIcon} onClose={onClose}>
      {/* What's being paid. */}
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          {space.name} · {SPACE_KIND_LABEL[space.kind]}
        </p>

        {multi ? (
          <ul className="mt-2 flex flex-col gap-2">
            {dues.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {d.title}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {CATEGORY_LABEL[d.category]}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  {naira(d.amount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {dues[0].title}
              </p>
              <p className="text-xs text-ink-soft">
                {CATEGORY_LABEL[dues[0].category]}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold tracking-tight text-ink">
              {naira(dues[0].amount)}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-cloud pt-3">
          <span className="text-xs font-medium text-ink-soft">Total</span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {naira(total)}
          </span>
        </div>
      </div>

      {/* Method picker. */}
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

      {/* Method detail. */}
      {method === "card" && (
        <div className="mt-3 flex flex-col gap-2">
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-cloud">
              <EmptyState
                size="sm"
                icon={CreditCardIcon}
                title="No saved cards"
                description="Add a card in your payment methods, or pay by “Bank transfer” instead."
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
            You&apos;ll get a dedicated <span className="font-semibold text-ink">{gatewayName}</span>{" "}
            account to transfer to, right here in the app — no redirect.
          </p>
        </div>
      )}

      {/* Discount code — optional, redeems a referral reward against this payment. */}
      <div className="mt-4">
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <HugeiconsIcon icon={Discount01Icon} size={14} />
          Discount code (optional)
        </label>
        <input
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          placeholder="e.g. REF-8XQP2K4M"
          disabled={pending}
          className="mt-1.5 h-11 w-full rounded-xl border border-cloud bg-canvas px-3.5 text-sm text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        disabled={!valid}
        onClick={() =>
          onConfirm(method, method === "card" ? selectedCard : undefined, discountCode.trim() || undefined)
        }
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {pending
          ? "Processing…"
          : method === "online"
            ? "Get transfer details"
            : `Pay ${naira(total)}`}
        {method === "online" && !pending && (
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
        )}
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
      <HugeiconsIcon
        icon={icon}
        size={20}
        className={active ? "text-brand" : "text-ink"}
      />
      <span className="mt-1 text-[13px] font-semibold text-ink">{label}</span>
      <span className="truncate text-[11px] text-ink-soft">{hint}</span>
    </button>
  );
}
