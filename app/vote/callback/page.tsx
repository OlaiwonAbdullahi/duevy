import type { Metadata } from "next";
import VoteCallbackStatus from "./VoteCallbackStatus";

export const metadata: Metadata = {
  title: "Vote payment status",
};

export default async function VoteCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  return <VoteCallbackStatus reference={reference ?? trxref ?? null} />;
}
