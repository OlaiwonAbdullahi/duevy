import { apiClient } from "./client";
import type { CheckoutStatus } from "./dues";

/**
 * Sandbox tooling. `POST /dev/simulate-deposit` only exists on a sandbox API
 * (it 404s everywhere else), so the UI that calls it is hidden unless the
 * build opts in with `NEXT_PUBLIC_PAYMENTS_SANDBOX=true`. It never runs in a
 * production build: Next inlines the flag at build time.
 */
export const PAYMENTS_SANDBOX = process.env.NEXT_PUBLIC_PAYMENTS_SANDBOX === "true";

export type SimulatedDeposit = {
  accountNumber: string;
  amount: number;
  checkout: { reference: string; status: CheckoutStatus } | null;
};

/**
 * Pretend `amount` kobo was transferred into `accountNumber`. A checkout's
 * one-time account takes only its exact total (`422 AMOUNT_MISMATCH`). The
 * status still comes from the API afterwards; this never marks anything paid
 * in the browser.
 */
export function simulateDeposit(accountNumber: string, amount: number) {
  return apiClient.post<SimulatedDeposit>("/dev/simulate-deposit", { accountNumber, amount }, { auth: false });
}
