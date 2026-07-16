import type { Metadata } from "next";
import VerifyEmailStatus from "../components/VerifyEmailStatus";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify the email address on your Duevy account.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmailStatus token={token ?? null} />;
}
