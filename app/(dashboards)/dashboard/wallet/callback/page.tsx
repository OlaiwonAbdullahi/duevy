import type { Metadata } from "next";
import { PaymentCallbackStatus } from "../_components/PaymentCallbackStatus";

export const metadata: Metadata = {
  title: "Payment status",
};

export default async function WalletCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  return <PaymentCallbackStatus reference={reference ?? trxref ?? null} />;
}
