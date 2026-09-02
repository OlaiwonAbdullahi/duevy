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
      "Duevy is operated by Duevy Labs Ltd (\"Duevy,\" \"we,\" \"us\"). By creating an account or using Duevy in any way, you agree to these Terms. If you're signing up to run a class or departmental space, you confirm you're authorised to collect dues on behalf of that group.",
    ],
  },
  {
    heading: "Eligibility and your account",
    body: [
      "You need accurate account details to use Duevy, including your matric number, which we use to verify you belong to your school. You're responsible for keeping your login details safe and for any activity under your account — tell us right away if you suspect unauthorised access.",
      "Rep accounts go through an admin review before they can collect for a space. We may decline or revoke a rep application at our discretion, including where the details provided can't be verified.",
    ],
  },
  {
    heading: "How dues collection works",
    body: [
      "A rep sets up a space for their class or department and shares a join link or code. Students join, top up their Duevy wallet, and pay dues, levies, and fees from it. Every payment and payout tied to a space is recorded and visible to that space's members — that visibility is core to how Duevy works and can't be turned off.",
    ],
  },
  {
    heading: "Payments and your wallet",
    body: [
      "Wallet top-ups and due payments are processed through our payment partner, Monnify. Funds you add, and dues collected on your behalf, are held in accounts partitioned from Duevy's own operating funds — student and departmental money is never mixed with Duevy's revenue.",
    ],
  },
  {
    heading: "Fees",
    body: [
      "Every due payment carries a 3% processing charge — 1.5% to our payment provider and 1.5% to Duevy. This is added on top of the due amount and paid by the person making the payment; the exact charge is shown before you confirm. The space collecting the due receives the full face amount, before any payout charges.",
    ],
  },
  {
    heading: "Payouts",
    body: [
      "Funds collected for a space can only be released to that space's verified payout account. Every payout request and approval is logged and traceable back to the person who requested it, so there's always a clear trail for handover between reps.",
    ],
  },
  {
    heading: "Referral program",
    body: [
      "Duevy's referral program is available to reps only. Each rep gets a personal referral link, and we pay a fixed reward (currently ₦500) when someone they refer becomes an approved rep and receives their first due payment. We may withhold or reverse rewards obtained through fraud, fake accounts, or other abuse of the program.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Don't use Duevy for fraud, money laundering, misrepresenting who you're collecting for, or any unlawful purpose. We may suspend or close accounts that break these terms or put other users or their funds at risk.",
    ],
  },
  {
    heading: "Disputes and refunds",
    body: [
      "If you think a payment was made in error, wasn't reflected correctly, or funds weren't remitted as expected, raise it through Duevy so we can review it. Refunds are assessed case by case and, where a due payment is reversed, may involve the space that received the funds.",
    ],
  },
  {
    heading: "Suspending or closing accounts",
    body: [
      "You can stop using Duevy at any time. We may suspend or close an account that violates these terms, is linked to fraudulent activity, or where we're required to act by law. Some records are kept after closure where we're legally required to retain them.",
    ],
  },
  {
    heading: "Limitation of liability",
    body: [
      "Duevy is provided on an \"as is\" basis. To the extent permitted by law, we're not liable for indirect or consequential losses arising from your use of the platform, including losses caused by a payment provider outage or a third party's misuse of a space they administer.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms as the product evolves. If we make material changes, we'll let you know. Continuing to use Duevy after an update means you accept the revised terms.",
    ],
  },
  {
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria, and any disputes arising from them are subject to the jurisdiction of Nigerian courts.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 2026"
      intro="These terms explain the rules for using Duevy. Please read them carefully — they form an agreement between you and Duevy Labs Ltd."
      sections={sections}
    />
  );
}
