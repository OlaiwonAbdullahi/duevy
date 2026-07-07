import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CreditCardIcon,
  BankIcon,
  Alert01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  InvoiceIcon,
} from "@hugeicons/core-free-icons";
import { CardBrand } from "../../wallet/_components/CardBrand";
import type { Card } from "../../wallet/_components/types";
import { Modal } from "../../wallet/_components/Modal";
import type { Due, PayMethod, Space } from "./types";
import { naira, CATEGORY_LABEL, SPACE_KIND_LABEL } from "./data";
import type { HugeIcon } from "../../_components/nav-config";

export function PayDueModal({
  dues,
  space,
  balance,
  cards,
  pending,
  onClose,
  onConfirm,
}: {
  dues: Due[];
  space: Space;
  balance: number;
  cards: Card[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (method: PayMethod, card?: Card) => void;
}) {
  const total = dues.reduce((sum, d) => sum + d.amount, 0);
  const multi = dues.length > 1;
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];

  const [method, setMethod] = useState<PayMethod>(
    balance >= total ? "wallet" : cards.length ? "card" : "online",
  );
  const [cardId, setCardId] = useState(defaultCard?.id ?? "");
  const selectedCard = cards.find((c) => c.id === cardId) ?? defaultCard;

  const walletShort = balance < total;
  // Wallet is the only method blocked by balance; card/online always proceed.
  const valid =
    !pending &&
    ((method === "wallet" && !walletShort) ||
      (method === "card" && !!selectedCard) ||
      method === "online");

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
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <MethodTile
          active={method === "wallet"}
          icon={Wallet01Icon}
          label="Wallet"
          hint={naira(balance)}
          onClick={() => setMethod("wallet")}
        />
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
          label="Online"
          hint="Transfer, USSD"
          onClick={() => setMethod("online")}
        />
      </div>

      {/* Method detail. */}
      {method === "wallet" && (
        <div className="mt-3">
          {walletShort ? (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
              <HugeiconsIcon
                icon={Alert01Icon}
                size={15}
                className="mt-px shrink-0"
              />
              <p>
                You&apos;re {naira(total - balance)} short. Top up first, or pay
                with a card instead.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-cloud p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
                <HugeiconsIcon icon={Wallet01Icon} size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Duevy wallet</p>
                <p className="text-xs text-ink-soft">Balance {naira(balance)}</p>
              </div>
              <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-medium text-brand">
                After · {naira(balance - total)}
              </span>
            </div>
          )}
        </div>
      )}

      {method === "card" && (
        <div className="mt-3 flex flex-col gap-2">
          {cards.length === 0 && (
            <p className="rounded-2xl border border-dashed border-cloud p-4 text-center text-xs text-ink-soft">
              No saved cards. Use “Online” instead.
            </p>
          )}
          {cards.map((c) => {
            const on = c.id === cardId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCardId(c.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer ${
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
            You&apos;ll be securely redirected to{" "}
            <span className="font-semibold text-ink">Monnify</span> to finish
            paying by card, bank transfer or USSD.
          </p>
        </div>
      )}

      {/* CTA. */}
      {method === "wallet" && walletShort ? (
        <Link
          href="/dashboard/wallet"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
        >
          Top up wallet
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      ) : (
        <button
          type="button"
          disabled={!valid}
          onClick={() => onConfirm(method, method === "card" ? selectedCard : undefined)}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
        >
          {pending
            ? "Processing…"
            : method === "online"
              ? "Continue to Monnify"
              : `Pay ${naira(total)}`}
          {method === "online" && !pending && (
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
          )}
        </button>
      )}
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
      className={`flex flex-col gap-1 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer ${
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
