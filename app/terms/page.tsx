import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Duevy.",
};

const sections: LegalSection[] = [
  {
    heading: "Accepting these terms",
    body: [
      "By creating a Duevy account or using the platform, you agree to these terms. If you're setting up a department or collecting on behalf of a group, you confirm you're authorised to do so.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "You're responsible for keeping your login details safe and for any activity under your account. Tell us right away if you suspect unauthorised access.",
    ],
  },
  {
    heading: "Collecting and paying dues",
    body: [
      "Duevy is a tool for collecting dues, levies, and payments transparently. Payouts from shared wallets require the approvals configured for that department. You're responsible for the accuracy of what you collect and how funds are used.",
    ],
  },
  {
    heading: "Fees",
    body: [
      "Duevy charges a flat 3% on every transaction. There are no setup fees, monthly subscriptions, or withdrawal fees. The exact fee is shown before each payment is confirmed.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Don't use Duevy for fraud, money laundering, or any unlawful purpose. We may suspend or close accounts that break these terms or put other users at risk.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms as the product evolves. If we make material changes, we'll let you know. Continuing to use Duevy after an update means you accept the revised terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="July 2026"
      intro="These terms explain the rules for using Duevy. Please read them carefully — they form an agreement between you and Duevy."
      sections={sections}
    />
  );
}
