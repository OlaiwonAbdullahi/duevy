# Landing Page Changes — MVP Alignment

Tracks how the landing page (`app/components/*`) was checked against product scope, and what was actually changed.

**Status:** Current as of 11 September 2026, on the `dev` branch (the live/current codebase — see note below).

---

## Important context: two rounds, two different branches

**Round 1** (on `feature/admin-dashboard`, since abandoned for this purpose): the landing page was aligned to `docs/PRD.md` v1.0, which described an Anchor-based, 2%-fee, no-quorum, wallet-free product. Nine files were edited on that branch.

That work turned out to be **based on a stale document**. Mid-session, an attempted `git merge` of a revert commit from `main` surfaced that the real, current codebase had moved to the `dev` branch — 49 commits ahead, already using **Bachs** (not Anchor) as the payment rail, a confirmed **3% flat fee** (not 2%+₦100), and a real **quorum-approval payout system** (not "no quorum, one rep"). Polls, saved-card payments, and the "Ask Duey" assistant — all listed as non-goals in PRD v1.0 — turned out to be built and live on `dev` too.

**Round 2** (on `dev`, the branch this log now tracks): the Round 1 edits were *not* reapplied, since several of them would have overwritten already-correct copy with the outdated PRD's numbers. `docs/PRD.md` has been revised to v1.1 to match; see its revision note.

---

## What was actually wrong on `dev`, and fixed

Most of `dev`'s existing landing-page copy was already correct once the Bachs/3%/quorum facts were confirmed. Three files had a real inconsistency: someone had partially edited `Solution.tsx` and `FAQ.tsx` to drop quorum language while `Features.tsx`, `HowItWorks.tsx`, and `Problem.tsx` still had it — leaving the page contradicting itself on how a rep is kept honest.

| # | File | Section | Before | After | Status |
|---|---|---|---|---|---|
| 1 | `Solution.tsx` | "Reps stay accountable" | "Every department gets its own verified payout account, and every withdrawal is logged and traceable back to who requested it." (no quorum mention — inconsistent with Features/HowItWorks/Problem) | Added the quorum mention: "...and every withdrawal needs quorum approval before it's released — logged and traceable back to who requested it." | Applied |
| 2 | `FAQ.tsx` | "Can a rep run away with the money?" | Same gap — verified payout account, no quorum mention | Same fix — quorum approval added | Applied |
| 3 | `Personas.tsx` (Faculty exec) + `FAQ.tsx` ("How do you know a payer is a real student?") | Claimed matric-number **identity verification** through an admin queue | Rephrased honestly: matric number is captured for the rep's reconciliation, not identity verification — there is no student KYC in MVP | Applied |

**Confirmed correct, left untouched:** `Pricing.tsx` (3%, no separate withdrawal fee — matches the confirmed fee model), `TrustBar.tsx` + FAQ's "how is my money kept safe" (already names Bachs), `Features.tsx` / `HowItWorks.tsx` / `Problem.tsx`'s quorum language, `Features.tsx`'s "Pay by card or bank transfer" / saved-card copy, `Features.tsx`'s "Ask Duey" and "Paid polls & voting" entries, `Hero.tsx`, `CTA.tsx`, `Stats.tsx`.

`CoRepsStep.tsx` (the signup flow's co-rep invite step) — flagged as a possible mismatch during Round 1 under the old "no co-rep team" PRD reading. Resolved: it's required infrastructure for the real quorum system (`ceil(team_size × 0.8)` needs a team to compute against), not a bug.

---

## Known stale reference, not corrected

`docs/PRODUCT_EXPLAINER.md` (the plain-English one-pager from the founder) still states the old 2% + ₦100 fee model and doesn't mention Bachs or quorum. It wasn't edited as part of this pass — it's someone else's document, not landing-page copy — but whoever owns it should update it to match `docs/PRD.md` v1.1 before it's shared further.

---

## Repo state note

This work happened on `dev` after aborting a bad merge and fast-forwarding from `feature/admin-dashboard`. `feature/admin-dashboard`'s 21 unpushed commits (admin console, auth flow) and the Round 1 stash are both still intact and untouched, just not part of `dev`. Reconciling the two branches is a separate, larger decision — see the prior conversation for detail.
