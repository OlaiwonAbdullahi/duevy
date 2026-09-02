import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Duevy collects, uses, and protects your information.",
};

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: [
      "Duevy is operated by Duevy Labs Ltd, which acts as the data controller for personal information processed through the platform. This policy explains what we collect, why, and the choices you have.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account details you give us when you sign up, such as your name, email, phone number, school, and matric number, which we use to verify you belong to your school.",
      "For reps, verification and payout details needed to set up and release funds to a department's payout account.",
      "Transaction data — top-ups, due payments, payouts, and the receipts they generate.",
      "Basic usage and device data, such as IP address and log data, when you use the app.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We use your information to run your account, verify who you are, process dues and payouts, generate receipts, detect fraud or abuse — including of the referral program — keep the platform secure, and support you when you reach out.",
    ],
  },
  {
    heading: "Payment processing partners",
    body: [
      "Wallet top-ups and due payments are processed by our payment partner, Monnify. Payouts to a space's verified account are processed by our payments infrastructure partner, Bachs. We share only the information these partners need to process your payment or payout — we don't store your full card details ourselves.",
    ],
  },
  {
    heading: "Transparency within your space",
    body: [
      "Duevy is built on transparency: members of a department or class space can see relevant payment and payout activity for their shared funds — who has paid and what the money was spent on. We don't share your personal details beyond what's needed for that shared record.",
    ],
  },
  {
    heading: "Sharing your information",
    body: [
      "We don't sell your personal information. We share it only with the payment and infrastructure partners described above, other service providers who help us run Duevy, or where the law requires it.",
    ],
  },
  {
    heading: "Data retention",
    body: [
      "We keep your account and transaction records for as long as your account is active, and afterward for as long as needed for legal, accounting, or fraud-prevention purposes.",
    ],
  },
  {
    heading: "Keeping your data secure",
    body: [
      "We use reasonable technical and organisational measures to protect your information, including keeping collected funds in accounts partitioned from Duevy's own operating funds. No system is perfectly secure, so we also rely on you to protect your login details.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Under the Nigeria Data Protection Act, you can ask us to give you access to your personal information, correct information that's inaccurate, or delete your data where we're not required to keep it.",
      "You can also object to certain uses of your information. To exercise any of these rights, contact us using the email below.",
    ],
  },
  {
    heading: "Cookies and similar technology",
    body: [
      "We use cookies and similar technology to keep you signed in and understand how Duevy is used, so we can improve it.",
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      "Duevy is built for university students and staff and isn't directed at children. We don't knowingly collect personal information from anyone under 16.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy as the product evolves. If we make material changes, we'll let you know. Continuing to use Duevy after an update means you accept the revised policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      intro="This policy explains what information Duevy collects, how we use it, and the choices you have. We keep it plain and short on purpose."
      sections={sections}
    />
  );
}
