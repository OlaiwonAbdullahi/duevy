import type { Metadata } from "next";
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Duevy account to collect dues and track payments.",
};

export default function LoginPage() {
  return <LoginForm />;
}
