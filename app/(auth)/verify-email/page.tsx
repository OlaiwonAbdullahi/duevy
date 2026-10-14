import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import VerifyEmailStatus from "../components/VerifyEmailStatus";

export const metadata: Metadata = pageMetadata({
  title: "Verify email",
  description: "Verify the email address on your Duevy account.",
  path: "/verify-email",
  noindex: true,
});

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmailStatus token={token ?? null} />;
}
