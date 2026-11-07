import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import LegalPage, { type LegalSection } from "../components/LegalPage";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that govern using Duevy to pay and collect campus dues, including fees and withdrawals.",
  path: "/terms",
});

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
      "Duevy is a tool for collecting dues, levies, and payments transparently. Collected funds belong to the space and can only be withdrawn by its verified reps, to bank accounts the space has added and that have been name-checked with the bank. You're responsible for the accuracy of what you collect and how funds are used.",
    ],
  },
  {
    heading: "Fees",
    body: [
      "Duevy charges a 1.5% processing fee on every dues payment, paid by the payer on top of the due, so the department receives the full amount. Withdrawals cost our payment partner's transfer charge, passed on at cost: ₦10 for amounts under ₦5,000, ₦15 under ₦100,000, and ₦20 for ₦100,000 or more. There are no setup fees or monthly subscriptions. The exact fee is shown before each payment is confirmed.",
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
