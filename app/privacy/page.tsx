import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Duevy collects, uses, and protects your information.",
};

const sections: LegalSection[] = [
  {
    heading: "What we collect",
    body: [
      "We collect the details you give us when you sign up — such as your name and email — and the information needed to process payments, like transaction amounts and receipts.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We use your information to run your account, process dues and payouts, generate receipts, keep the platform secure, and support you when you reach out.",
    ],
  },
  {
    heading: "Transparency to your group",
    body: [
      "Duevy is built on transparency. Members of a department can see relevant payment and payout activity for shared funds, so everyone can see where the money went.",
    ],
  },
  {
    heading: "Sharing your information",
    body: [
      "We don't sell your personal information. We share it only with the payment providers and service partners needed to run Duevy, or where the law requires it.",
    ],
  },
  {
    heading: "Keeping data secure",
    body: [
      "We use reasonable technical and organisational measures to protect your information. No system is perfectly secure, so we also rely on you to protect your login details.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can access or update your account details at any time. To request deletion of your data or ask a privacy question, contact us using the email below.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      intro="This policy explains what information Duevy collects, how we use it, and the choices you have. We keep it plain and short on purpose."
      sections={sections}
    />
  );
}
