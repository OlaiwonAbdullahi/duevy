# Landing Page Changes — MVP Alignment

Tracks the copy/content changes made to bring the landing page in line with the [MVP PRD](./PRD.md) and the [product explainer](./PRODUCT_EXPLAINER.md).

**Status:** Applied — copy/content only. No layout, styling, or design-system changes were made.

---

## Summary of drivers

Three things the landing page claimed that were not in MVP scope:

1. **Wallet / top-up model** — MVP moves money student → space account directly, per checkout. No stored balance.
2. **Quorum-approved payouts** — MVP has one rep per space, no co-rep team, no approval step on withdrawal.
3. **3% flat fee, no withdrawal fee** — MVP is 2% on collection (student pays) + flat ₦100 on withdrawal (rep pays).

Plus two smaller issues: the wrong payment rail was named (Monnify/Nomba/Paystack instead of the actual banking partner), and the FAQ/Personas claimed student identity verification by matric number, which doesn't exist in MVP.

---

## Change log

| # | File | Section | Before | After | Status |
|---|---|---|---|---|---|
| 1 | `Hero.tsx` | Subheading | "a simple wallet-based way to collect dues, levies, and payments" | Dropped "wallet-based" — reframed around one transfer covering everything owed | Applied |
| 2 | `HowItWorks.tsx` | Step 01 | "invites the team, and assigns roles" | Dropped co-rep/role language; added BVN verification as the real gating step before a space can collect | Applied |
| 3 | `HowItWorks.tsx` | Step 03 | "Students fund their Duevy wallet, then pay dues... in a couple of taps" | Rewritten: student selects the dues owed, pays the total in one transfer, receipt lands instantly. Retitled "Students select & pay" | Applied |
| 4 | `HowItWorks.tsx` | Step 04 | "Payout needs approval" — quorum of students approves | Step removed entirely. The old step 05 ("Money moves, cleanly") is now step 04 — sequence is 4 steps, not 5 | Applied |
| 5 | `HowItWorks.tsx` | Step 05 (now 04) | "Once approved, funds release straight to the verified destination" (tied to quorum) | Reframed: rep withdraws straight to their own verified bank account whenever they like — no approval framing | Applied |
| 6 | `Features.tsx` | "Wallet top-up & spend" | "Fund once, pay for anything on your department's list" | Replaced with "One transfer, every due" — multi-select checkout, single payment | Applied |
| 7 | `Features.tsx` | "Approval-based payouts" | "Funds release only after a quorum... approve" | Replaced with "Verified withdrawals" — rep-only, BVN-identity-matched | Applied |
| 8 | `Features.tsx` | "Multi-school ready" | Presented as a live feature | Reframed as roadmap language — schema is multi-school-ready, no UI/flow in MVP | Applied |
| 9 | `Solution.tsx` | "Wallet-based collection" | "Students top up their Duevy wallet, then pay..." | Rewritten to "Direct collection" — students pay straight into the class's account per checkout, nothing stored | Applied |
| 10 | `Solution.tsx` | "Reps stay accountable" | "Payouts need approval from a quorum" | Rewritten around the real safeguard: admin-approved reps, BVN-verified identity, withdrawals locked to the rep's own matched account | Applied |
| 11 | `Problem.tsx` | Comparison row | "Reps get accused of eating the money" → "Payouts need quorum approval to release" | "Fixed" side changed to: "Every withdrawal ties back to the rep's verified identity" | Applied |
| 12 | `Personas.tsx` | Aisha (student) | "A wallet she tops up once" | Replaced with "One payment clears everything she owes" | Applied |
| 13 | `Personas.tsx` | Faculty exec | "Verified identities via matric number" | Reframed as "Matric numbers captured for clean reconciliation" — no student identity verification in MVP | Applied |
| 14 | `Pricing.tsx` | Headline | "3% on every transaction" | Changed to "2% ... on collection", heading now "Two numbers. Nothing hidden." | Applied |
| 15 | `Pricing.tsx` | "No hidden charges" card | "No... withdrawal fees" | Replaced with honest breakdown: 2% on collection (student pays) + flat ₦100 on withdrawal (rep pays) | Applied |
| 16 | `Pricing.tsx` | Worked example | "₦2,000 due → ₦60 fee" (3% math) | Recalculated at 2%: ₦2,000 due → ₦40 charge, department still receives the full ₦2,000 | Applied |
| 17 | `FAQ.tsx` | "How is my money kept safe?" | "Paystack's secure rails" | Changed to generic "a licensed banking partner" — matches the tone of the boss-provided explainer, avoids naming a rail publicly before that's confirmed | Applied (see decision below) |
| 18 | `FAQ.tsx` | "Can a rep run away with the money?" | "No. Payouts require quorum approval" | Rewritten around the real safeguard: admin-approved reps, BVN verification, payouts locked to the rep's own matched account | Applied |
| 19 | `FAQ.tsx` | "How do you know a payer is a real student?" | "Verified by matric number through an admin approval queue" | Rephrased rather than dropped — new question "How do you know who's paying?", honest answer: matric number is for reconciliation, not identity verification | Applied (see decision below) |
| 20 | `FAQ.tsx` | "What does it cost?" | "3% per transaction" | Updated to "2% on what students pay, plus a flat ₦100 when a rep withdraws" | Applied |
| 21 | `TrustBar.tsx` | Rail logos/copy | "Every payment moves on Monify" + Monnify/Nomba logos | Monnify/Nomba logos removed entirely; copy changed to "a licensed banking partner"; only the CBN/NDPR badge remains | Applied (see decision below) |

**No change made:** `CTA.tsx`, `Stats.tsx` (numbers already marked placeholder in code), FAQ's app-download and LAUTECH-launch questions, `Features.tsx`'s "Live payment tracking" and "Automatic receipts", `Solution.tsx`'s "Transparent by default", `Problem.tsx`'s other four comparison rows, `Personas.tsx`'s Tunde (rep) card.

---

## Adjacent — not landing page copy, left untouched

`CoRepsStep.tsx` in the actual signup flow still invites co-reps, contradicting "one rep per space" in MVP. This is a built feature, not copy, and was intentionally left alone — needs a separate decision (keep it dormant, hide it, or gate it behind a later phase).

---

## Decisions made to unblock this pass

Two items from the original open-questions list needed a default to proceed. Both are easy one-line reversals if the call should go the other way:

1. **Payment rail naming (#17, #21):** went generic ("a licensed banking partner") instead of naming the actual provider publicly, matching the tone of the boss-provided explainer, which also stays generic. Revisit once you're ready to name the rail on the public site.
2. **Student-verification FAQ (#19):** rephrased honestly instead of dropping it, since it's a question people will naturally ask. Now states plainly that matric number is for reconciliation, not identity verification.

`CoRepsStep.tsx` was left as-is — that's a product decision outside the scope of this pass.
