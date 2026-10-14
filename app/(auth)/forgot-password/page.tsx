import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

export const metadata: Metadata = pageMetadata({
  title: "Reset password",
  description: "Reset the password for your Duevy account.",
  path: "/forgot-password",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
