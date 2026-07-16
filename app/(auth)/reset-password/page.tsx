import type { Metadata } from "next";
import ResetPasswordForm from "../components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Set a new password for your Duevy account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? null} />;
}
