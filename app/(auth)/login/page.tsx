import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to Duevy to pay your dues, download receipts, or manage your department's collections.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginForm />;
}
