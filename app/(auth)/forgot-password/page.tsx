import type { Metadata } from "next";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset the password for your Duevy account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
