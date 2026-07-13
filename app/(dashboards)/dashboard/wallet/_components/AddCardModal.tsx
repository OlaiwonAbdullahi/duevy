"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  CheckmarkCircle02Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT, BRAND_INPUT } from "../../_components/form-styles";
import type { Card } from "./types";
import { CARD_LOGOS, brandFromNumber } from "./utils";

export function AddCardModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (card: Card) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const digits = number.replace(/\D/g, "");
  const brand = brandFromNumber(digits);
  const formattedNumber = useMemo(
    () => digits.replace(/(.{4})/g, "$1 ").trim(),
    [digits]
  );

  const valid =
    digits.length >= 15 &&
    name.trim().length > 1 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onAdd({
        id: crypto.randomUUID(),
        brand,
        last4: digits.slice(-4),
        expiry,
        isDefault: makeDefault,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onExpiryChange = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    setExpiry(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  return (
    <Modal title="Add card" icon={CreditCardIcon} onClose={onClose}>
      <Label className="block text-xs font-medium text-ink-soft">
        Card number
      </Label>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
        <Input
          inputMode="numeric"
          value={formattedNumber}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className={BARE_INPUT}
        />
        {digits.length >= 2 && CARD_LOGOS[brand] && (
          <span className="relative h-5 w-8 shrink-0">
            <Image
              src={CARD_LOGOS[brand]}
              alt={brand}
              fill
              unoptimized
              className="object-contain"
            />
          </span>
        )}
      </div>

      <Label className="mt-4 block text-xs font-medium text-ink-soft">
        Name on card
      </Label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Amara Okafor"
        className={cn(BRAND_INPUT, "mt-1.5")}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Expiry
          </Label>
          <Input
            inputMode="numeric"
            value={expiry}
            onChange={(e) => onExpiryChange(e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            CVV
          </Label>
          <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
            <Input
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              className={BARE_INPUT}
            />
            <HugeiconsIcon icon={SecurityLockIcon} size={16} className="text-ink-soft" />
          </div>
        </div>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={makeDefault}
        onClick={() => setMakeDefault((v) => !v)}
        className="mt-4 flex w-full items-center gap-2 rounded-lg text-left text-[13px] text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={18}
          className={makeDefault ? "text-brand" : "text-ink-soft/40"}
        />
        Set as default payment method
      </button>

      <Button
        variant="brand"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {submitting ? "Adding card…" : "Add card"}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-soft">
        <HugeiconsIcon icon={SecurityLockIcon} size={13} />
        Encrypted and stored securely
      </p>
    </Modal>
  );
}
