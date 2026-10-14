import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import VoteCallbackStatus from "./VoteCallbackStatus";

export const metadata: Metadata = { title: "Vote payment status", robots: PRIVATE_ROBOTS };

export default async function VoteCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { reference, trxref } = await searchParams;
  return <VoteCallbackStatus reference={reference ?? trxref ?? null} />;
}
