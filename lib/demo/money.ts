/**
 * Money math for demo mode. Mirrors the pricing the product actually publishes
 * (pricing page, FAQ, terms): a flat 3% processing charge added on top of the
 * face amount and paid by the payer — 1.5% to the payment provider, 1.5% to
 * Duevy. The space always nets the full face amount.
 *
 * All amounts are integer kobo (₦1 = 100 kobo), same as the API.
 */
export const SERVICE_CHARGE_PERCENT = 3;

/** Flat fee deducted from a withdrawal (₦100), plus ₦50 stamp duty above ₦10,000. */
export const PAYOUT_FEE_KOBO = 10_000;
export const STAMP_DUTY_KOBO = 5_000;
export const STAMP_DUTY_THRESHOLD_KOBO = 1_000_000;
/** No withdrawal below ₦1,000. */
export const MIN_PAYOUT_KOBO = 100_000;

export type Charge = {
  face: number;
  /** The payment provider's half of the 3%. */
  processingFee: number;
  /** Duevy's half of the 3%. */
  duevyFee: number;
  /** The whole 3%. */
  totalFee: number;
  /** What the payer is charged: face + totalFee. */
  totalCharged: number;
  /** What the space receives: always the untouched face amount. */
  netToSpace: number;
};

export function computeCharge(faceKobo: number): Charge {
  const totalFee = Math.round(faceKobo * (SERVICE_CHARGE_PERCENT / 100));
  // 1.5% / 1.5% split; the provider's half absorbs any rounding remainder.
  const duevyFee = Math.round(totalFee / 2);
  return {
    face: faceKobo,
    processingFee: totalFee - duevyFee,
    duevyFee,
    totalFee,
    totalCharged: faceKobo + totalFee,
    netToSpace: faceKobo,
  };
}

export function stampDutyFor(amountKobo: number): number {
  return amountKobo > STAMP_DUTY_THRESHOLD_KOBO ? STAMP_DUTY_KOBO : 0;
}

export function computePayoutFees(amountKobo: number) {
  const stampDuty = stampDutyFor(amountKobo);
  return {
    duevyFeeKobo: PAYOUT_FEE_KOBO,
    stampDutyKobo: stampDuty,
    netSentKobo: amountKobo - PAYOUT_FEE_KOBO - stampDuty,
  };
}

/** DVY-1234-5678 */
export function reference(prefix = "DVY"): string {
  const a = Math.floor(1000 + Math.random() * 9000);
  const b = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${a}-${b}`;
}

export function payoutReference(): string {
  const seq = Math.floor(100 + Math.random() * 9900)
    .toString()
    .padStart(4, "0");
  return `PAY-${new Date().getFullYear()}-${seq}`;
}
