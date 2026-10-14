import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ResetPasswordForm from "../components/ResetPasswordForm";

export const metadata: Metadata = pageMetadata({
  title: "Set new password",
  description: "Set a new password for your Duevy account.",
  path: "/reset-password",
  noindex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? null} />;
}
