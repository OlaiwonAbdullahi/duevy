# DUEVY — Product Requirements Document

## MVP — Rep onboarding, spaces, and dues collection on Bachs

| Field | Value |
|---|---|
| Product | Duevy — "Pay your dues. Simply." |
| Entity | Duevy Labs Ltd |
| Document | MVP PRD v1.1 (revised) |
| Author | Abdullahi Olaiwon (v1.0); revisions below reflect confirmed product decisions since |
| Date | 3 September 2026 (v1.0) · revised 11 September 2026 |
| Status | Revised — see note below |
| Payment rail | **Bachs** (bachs.io) — Bachs Connect, replaces the Anchor plan in v1.0 |
| Pilot | LAUTECH, single department cohort |

> **Revision note (11 September 2026)**
> This PRD's v1.0 draft specified Anchor as the payment rail, a 2% + ₦100 flat fee model, no payout quorum, and listed polls, saved cards, and an AI assistant as explicitly out of MVP scope. Since then, the team has confirmed all of the following as current product direction, not deferred:
> - **Payment rail is Bachs, not Anchor.** Bachs Connect's connected-accounts model replaces the per-space Anchor deposit account described in v1.0 §6.
> - **Fee is 3% flat**, not 2% + a separate ₦100 withdrawal fee. Duevy's cut is whatever it doesn't transfer out to the department — there is no separate withdrawal charge in the confirmed model.
> - **Payouts require quorum approval** (`ceil(team_size × 0.8)` of the department's team, enforced in Duevy's own tables before any Bachs call) — this reverses v1.0's explicit "no approval quorum, one rep" rule, and makes co-rep/team membership a real requirement, not deferred.
> - **Paid polls & voting, saved-card payments, and the "Ask Duey" assistant are in scope** — all three were listed as non-goals in v1.0 §1.2; all three are now built and live.
> Sections below have been updated to match. Where a v1.0 Anchor-specific detail (KYC tier limits, stamp-duty fee splits, dynamic virtual account behavior) had no confirmed Bachs equivalent at revision time, it has been removed rather than guessed, and flagged as an open question in §13.

## Contents

1. [Summary — goals, and what is deliberately out of scope](#1-summary)
2. [Roles and permissions](#2-roles-and-permissions)
3. [Rep onboarding — registration, admin approval, identity verification](#3-rep-onboarding)
4. [The space — space code, dues, members](#4-the-space)
5. [Student flow — signup, joining, multi-due checkout](#5-student-flow)
6. [Bachs integration — connected accounts, collections, webhooks, payouts](#6-bachs-integration)
7. [Money flow and unit economics](#7-money-flow-and-unit-economics)
8. [Data model](#8-data-model)
9. [Edge cases and failure handling](#9-edge-cases-and-failure-handling)
10. [Non-functional requirements](#10-non-functional-requirements)
11. [Success metrics for the pilot](#11-success-metrics-for-the-pilot)
12. [Build order](#12-build-order)
13. [Open questions](#13-open-questions)

---

## 1. Summary

Duevy lets a course rep collect departmental dues from students online, and lets students pay several dues at once without a bank-transfer-and-screenshot loop. This document covers the MVP: the build that takes real money from a real student at LAUTECH and lands it — with team sign-off — in a department's bank account.

The MVP has three actors and one money path, plus a quorum step before money leaves the platform. A rep registers and is approved by the platform admin. The rep's department completes onboarding with Bachs, which creates a connected account for the space. Students join the space with a code, select the dues they owe, and pay in one transaction (card or bank transfer). The rep requests a withdrawal; once enough of the department's team approves it, funds release to the department's bank account.

> **The one-line test for MVP scope**
> If a feature is not required for a student to pay a due and a department to receive that money, it is not in the MVP.

### 1.1 Goals

- Ship a live, real-money collection flow for one department at LAUTECH.
- Prove the Bachs Connect integration end to end: connected account creation, onboarding, capability activation, collection, split transfer, quorum-gated withdrawal, webhooks.
- Prove the fee model works at real ticket sizes (see §7).
- Keep the rep's manual work to: create dues, share a code, request withdrawal.

### 1.2 Non-goals

These are deliberately deferred. They are not "phase 2 maybe" — they are out of this build entirely, and no schema or UI should be added for them now.

| Deferred | Why it is out |
|---|---|
| Student wallet / balance | Holding student float multiplies compliance load. Money moves student → Duevy → department, never sitting in a student-facing balance. |
| Referral programme | Growth feature, no place in a single-department pilot. |
| WhatsApp channel | Email notifications only in MVP. |
| Installments / split payments / lending | Changes the ledger model. Later phase. |
| Multi-school onboarding, public API | Schema stays multi-school-ready; no UI or flow for it. |
| Refunds (self-service) | Handled manually by the platform admin in MVP (see §9.4); recovered from Bachs via clawback transfer where the department hasn't already withdrawn. |

**No longer deferred, as of the 11 September revision** (previously listed here in v1.0, now confirmed in scope): polls and paid voting, saved-card payments, co-rep team and quorum-approved payouts, and the "Ask Duey" assistant. See the revision note above.

---

## 2. Roles and permissions

Three roles. No sub-roles, no per-permission toggles.

| Role | Who | Can do |
|---|---|---|
| Platform admin | You (Duevy Labs) | Approve or reject rep registrations; view all spaces, dues, payments and payouts; suspend a space; trigger a manual refund; view the Bachs reconciliation view. |
| Rep | Course rep / class governor | Create one space; create and close dues; view members; view collections; request a withdrawal (subject to quorum approval); remove a member. |
| Student | Any student with a space code | Join a space; see the dues that apply to them; select several and pay; view and download receipts; leave a space. |

> **Access model**
> Both reps and students land on `/dashboard`. What the dashboard renders is decided by the account's role, not by a separate URL tree.
> The platform admin console lives at `/admin` and is a separate surface.
> A single email address is one account with one role. Role switching is not in the MVP.

---

## 3. Rep onboarding

This is the flow with the most states in the MVP, and the one that gates everything else. A space cannot receive or release a naira until its department has an active Bachs connected account with both the `transfers` and `payouts` capabilities enabled.

### 3.1 Registration

1. Rep opens `/register` and picks "I'm a course rep".
2. Fills: full name, email, phone number, school (LAUTECH, fixed in MVP), faculty, department, level/set, and the name they want for the space.
3. Verifies their email with a 6-digit code. Unverified emails never reach the approval queue.
4. Account is created with status `pending_approval`. Rep sees a holding screen: "We're reviewing your request — we'll email you within 24 hours."
5. Platform admin receives an email and sees the request in `/admin/reps`.

> **Why admin approval exists at all**
> Anyone can claim to be the course rep for Computer Science 400 level. Approval is the only defence against a stranger collecting a department's money.
> In MVP the check is manual and offline: the admin confirms the person is the real rep (WhatsApp, a department group, a lecturer). The console just records the decision and a note.

### 3.2 Admin approval

The admin sees the submitted details plus a free-text note field, and picks one of two actions.

| Action | Result |
|---|---|
| Approve | Rep status → `approved`. Email sent: "You're in — finish setup to start collecting." Rep can now sign in to the dashboard. |
| Reject | Rep status → `rejected`, with a reason. Email sent. The account cannot sign in; the rep may re-register after 7 days. |

Every decision writes to an audit log: admin id, rep id, action, reason, timestamp.

### 3.3 First dashboard — the payout-setup banner

An approved rep lands on the dashboard immediately. The dashboard is not blank and not locked: the rep can look around, create the space profile, invite the team, and draft dues. What they cannot do is take money.

> **Banner copy (persistent, top of every rep page)**
> "Set up your payout account to start collecting. Your space can't receive payments until this is done." **[Set up now]**

**What is unlocked before onboarding is complete**

- **Available:** create the space, set its name, description and cover; create dues as drafts; copy the space code; invite students and co-reps; browse the dashboard.
- **Blocked:** publishing a due, any student payment, any withdrawal request. Every blocked action shows the same modal pointing at payout setup.

Students who join a pre-onboarding space see the space and its draft dues marked "Not open yet". This is intentional: the rep can seed the space and get students in while onboarding is pending.

### 3.4 Bachs Connect onboarding

The space's department is a **Bachs connected account**, created with the `transfers` and `payouts` capabilities requested. Both capabilities start `restricted` and must become `active` before the space can collect or withdraw.

Duevy uses the **hosted onboarding link** (Bachs's recommended path for MVP): rather than building the Task-collection UI ourselves, the rep is sent to a Bachs-hosted flow and redirected back on completion. This avoids the maintenance burden of rendering every compliance field Bachs might add later.

| Step | What happens |
|---|---|
| Connected account created | On admin approval, or when the rep starts payout setup. |
| Hosted link issued | `POST .../account-links` with a `refresh_url` and `return_url` on Duevy. Minted on explicit "Set up payouts" click, never on page load — a link minted on render would silently invalidate one already emailed. |
| Rep completes the hosted flow | Business/individual details, bank destination, identity verification (Bachs offers both a hosted verification session and NIN-based verification for Nigerian accounts — **which one Duevy defaults to is an open question**, see §13). |
| Capability activation | Reviewed by Bachs on no fixed schedule. Duevy never polls — it listens for `capability.updated`. |

Verification is asynchronous. The rep completes the hosted flow, sees a "Setting up…" state, and Duevy waits for the webhook.

| Webhook event | Duevy does |
|---|---|
| `capability.updated` (`transfers` → `active`) | Space can now accept student payments. |
| `capability.updated` (`payouts` → `active`) | Space can now have withdrawals requested against it (still subject to quorum). |
| `capability.updated` (either → `restricted`, after having been active) | Treated as a fresh state change — collection or withdrawal is blocked again until it returns to `active`. This can happen more than once; Duevy re-checks capability status immediately before any money movement rather than trusting a cached flag. |
| `account.updated` | Drives the payout-setup status screen (`setup_status`, outstanding requirements). |

A department only needs `transfers` and `payouts` — nothing that accepts payments directly, since Duevy collects centrally (see §6).

### 3.5 Rep / space state machine

| State | Entered when | Can collect? | Can withdraw? |
|---|---|---|---|
| `pending_approval` | Registration submitted, email verified | No | No |
| `rejected` | Admin rejects | No — cannot sign in | No |
| `approved` | Admin approves | No — payout-setup banner shown | No |
| `onboarding_pending` | Hosted link issued, not yet completed or under review | No | No |
| `onboarding_incomplete` | Bachs reports outstanding requirements | No | No |
| `transfers_active` | `transfers` capability active, `payouts` not yet | Yes | No |
| `fully_active` | Both `transfers` and `payouts` active | Yes | Yes (subject to quorum) |
| `suspended` | Admin suspends the space or the rep | No — payments refused, balance frozen | No |

---

## 4. The space

A space is one department cohort — "Computer Science, 2024/2025, 400 Level". The space maps 1:1 to a Bachs connected account. A space has a team (the rep plus any invited co-reps), a balance, dues, and members — the team's size is what the payout quorum is computed against (§6.5).

### 4.1 Space code

- Six characters, uppercase alphanumeric, generated on space creation.
- Excludes visually ambiguous characters (`0`, `O`, `1`, `I`, `L`) — reps read these out loud in lecture halls.
- Unique across the platform; collision check on generation with retry.
- Rep can regenerate the code once per 24 hours. Regenerating does not remove existing members.
- Shareable as a code and as a join link, `/join/ABC234`, which pre-fills the code.

### 4.2 Dues

A due is one line item a student can owe. The rep creates them; there is no template library in the MVP.

| Field | Rules |
|---|---|
| Title | Required. E.g. "Departmental Due 2025/26". |
| Type | One of: `departmental_due`, `handout`, `exam_levy`, `lab_manual`, `association_due`, `departmental_wear`, `trip_fee`, `clearance`, `other`. |
| Amount | Required, fixed. ₦100 minimum. No variable or "pay what you can" amounts in MVP. (v1.0's ₦50,000 maximum was an Anchor Tier 1 ceiling — no confirmed Bachs-equivalent cap exists yet; see §13.) |
| Description | Optional, shown to students. |
| Deadline | Optional date. Past the deadline the due shows as overdue but is still payable — MVP does not auto-close. |
| Status | `draft` → `open` → `closed`. Only open dues are payable. Closing a due does not affect payments already made. |
| Mandatory flag | Optional. Mandatory dues are pre-selected in the student's checkout; the student can still deselect. |

Dues apply to the whole space. Per-student or per-group assignment is not in the MVP.

### 4.3 Members

- A student joins by code and is a member immediately — no rep approval step in the MVP.
- The rep sees the member list with name, matric number, email, total paid and outstanding.
- The rep can remove a member. Removal does not delete their payment history or receipts.
- A student can belong to more than one space (department + association), and the dashboard groups dues by space.
- Separately from students, a rep can invite **co-reps** to the space's team. Team size is what the payout quorum is computed against — see §6.5.

---

## 5. Student flow

### 5.1 Signup and joining

1. Student opens `/register`, picks "I'm a student", and enters full name, matric number, email, phone, and a password.
2. Verifies email with a 6-digit code.
3. Lands on an empty dashboard with one action: "Enter your space code".
4. Enters the code from the rep. Duevy shows a confirmation card — space name, department, rep name — before joining, so a mistyped code cannot silently drop them in the wrong space.
5. Joins. The dashboard now lists that space's open dues.

The matric number is collected for the rep's reconciliation, not for verification. There is no matric-number check against a school register, and no student KYC of any kind in the MVP — students are payers, not account holders.

### 5.2 Selecting and paying

1. The student sees every open due in the space as a checkbox row: title, amount, deadline, and a paid badge where relevant.
2. Mandatory dues are pre-ticked. The student ticks any others.
3. A sticky summary bar shows: selected dues subtotal, the 3% service charge, and the total to pay.
4. "Pay ₦X" opens checkout — a Bachs checkout session on **Duevy's own account** (not a per-space account; the split to the department happens after settlement, see §6.3). The student pays by saved/new card or bank transfer.
5. On payment, the screen reflects status live — no screenshot, no "I have paid" button.
6. Once the charge settles, Duevy transfers the face amount of each due to the space's connected account, every selected due is marked paid for that student, a PDF receipt is generated, and a confirmation email goes out.

> **Design rules for the checkout**
> One transaction covers many dues. The student never pays four times for four dues.
>
> The amount shown is the exact amount to pay, service charge included. Anything else breaks reconciliation.
>
> Nothing is marked paid on the client. Only the Bachs webhook (`collection.succeeded` / settlement) can mark a payment successful, and the split transfer to the department only fires on settlement, never on the client-side success callback.

### 5.3 After payment

- **Receipt:** PDF with reference, space, rep, itemised dues, service charge, total, timestamp. Downloadable from the dashboard indefinitely.
- Paid dues move to a "Paid" section and cannot be selected again.
- Email confirmation to the student; the rep gets a daily digest, not a per-payment email.

---

## 6. Bachs integration

Bachs Connect is the only money rail in the MVP. Duevy collects every student payment into its own Bachs balance, then **splits** the face amount of each due out to the paying department's connected account via a transfer. See the `bachs-connect` skill for the full API reference this section summarizes.

### 6.1 Object mapping

| Duevy concept | Bachs object |
|---|---|
| Duevy Labs Ltd | Platform organization (`org_duevy...`), with `connect` capability active |
| A department space | Connected account (`org_...`), `entity_type: individual`, capabilities `transfers` + `payouts` |
| Course rep | Account representative on the connected account |
| Student payment | Charge, collected on Duevy's own account (checkout session) |
| Split to department | Transfer, `destination` = the space's connected account, `amount` = due face value |
| Duevy revenue | Whatever isn't transferred out — the 3% add-on |
| Withdrawal | Withdrawal, requested against the space's connected account, gated by both Bachs's `payouts` capability and Duevy's own quorum check |
| Refund recovery | Clawback — a transfer from the space's connected account back to `self`, only possible if the department hasn't already withdrawn the amount |

### 6.2 Provisioning sequence

1. Admin approves rep, or rep starts payout setup → `POST /v1/organizations/connected-accounts` with `capabilities: { transfers: { requested: true }, payouts: { requested: true } }`. Persist the returned `org_...` id on the space immediately.
2. `POST .../account-links` (`type: onboarding`) → redirect the rep to the hosted flow.
3. Rep completes the hosted flow (business/individual details, bank destination, identity verification).
4. Await `capability.updated` for both `transfers` and `payouts`.
5. Space status becomes `fully_active` (§3.5). The space is now live.

Steps 4–5 are never triggered by the client. They run in a webhook handler, so a rep who closes the tab still ends up provisioned once Bachs finishes review.

### 6.3 Collections and the split

- Checkout happens once, on Duevy's own account — a normal Bachs checkout session, not a per-space or per-connected-account charge. This is deliberate: departments are individuals, not registered businesses, so putting them through the payment-accepting onboarding path would mean much longer Tasks and higher abandonment. Duevy collecting centrally keeps a department's onboarding to just `transfers` + `payouts`.
- The student pays `face amount × 1.03`.
- Once the charge **settles** (not merely succeeds — a transfer sent before settlement fails with `INSUFFICIENT_BALANCE`), Duevy transfers the face amount to the department's connected account: `destination: <space's org id>`, `amount: <face amount>`, `transfer_group: <charge id>`.
- The `transfer_group` is reused on any later clawback for that charge, so a refund recovery sits with the original split.
- The settlement webhook (and the resulting `transfer.created`) is the single source of truth for a successful, split payment — never the checkout's client-side callback.

### 6.4 Webhooks

Duevy subscribes to, at minimum, with `event_source: connect` for the connected-account events and `event_source: all` (or a second endpoint) for Duevy's own:

- `account.updated`, `capability.updated` — onboarding and capability status
- `transfer.created` — a split (or clawback) landed
- `payout.paid` / `payout.failed` — a withdrawal resolved
- Duevy's own checkout/collection settlement event

**Handler rules — non-negotiable**

| Rule | Implementation |
|---|---|
| Verify signature | Reject any payload failing Bachs's signature check. Never trust an unsigned webhook. |
| Idempotency | Persist every event by its Bachs event id in a `webhook_events` table before processing. A repeated id is acknowledged and dropped. |
| Acknowledge fast | Return 200 immediately, process in a queued job. |
| Never mark from the client | The frontend never writes a payment or payout's status. Only a webhook handler does. |
| Connect events carry the account, not the platform | On a `event_source: connect` event, `organization_id` in the payload is the connected account (the department), not Duevy. Read it from the payload — don't assume it's you. |
| Reconcile daily | A nightly job compares Duevy's records against `GET /v1/transfers` and flags mismatches to `/admin`. |

### 6.5 Payouts and the quorum

1. Rep opens Withdraw, sees the available balance, enters an amount. Requires `payouts` **active** on the space's connected account (re-checked immediately before the call, never from a cached flag).
2. **Quorum**: Duevy requires `ceil(team_size × 0.8)` approvals from the space's team (rep + co-reps) before the withdrawal is sent to Bachs. This is enforced entirely in Duevy's own `payout_requests` / `payout_approvals` tables — Bachs has no concept of it and never sees an unapproved request.
3. Once quorum is met, Duevy calls `POST /v1/payouts/withdrawals` against the space's connected account, with a deterministic `Idempotency-Key` derived from the Duevy payout-request id.
4. Payout row is created as `processing` and resolved by `payout.paid` / `payout.failed`. A failed payout returns the amount to the available balance and notifies the team.
5. Once a withdrawal completes, that money is gone from Duevy's reach — a later refund on an order already withdrawn cannot be clawed back and must be handled as a manual shortfall (see §9.4).

- Minimum withdrawal and any maximum: not yet confirmed for the Bachs model (v1.0's figures were Anchor Tier 1 specific) — see §13.
- Withdrawals are blocked while a space is suspended, regardless of quorum or capability status.

### 6.6 Environments

- Build against the Bachs sandbox (`sandbox-api.bachs.io`, `sk_sandbox_` keys); every flow in this document must pass in sandbox before go-live.
- Going live is a base-URL + `sk_live_` key swap and nothing else — no other code path should differ between sandbox and production.
- API keys are scoped and stored as server-side secrets. No Bachs key is ever exposed to the browser.
- Duevy's own organization needs `connect` active (requested from the Bachs dashboard, not the API) before any connected account can be created. This conversion is irreversible and should happen on Duevy Labs Ltd's registered business entity.

---

## 7. Money flow and unit economics

### 7.1 The rule

The student pays a flat percentage on top of what they owe; the department receives the due's full face value. Duevy's revenue is simply the gap between what's collected and what's transferred out — there is no separate fee schedule to configure on the Bachs side.

> **Fee model (confirmed 11 September 2026)**
> Student pays: due total × 1.03 (3% on top).
> Department receives: the full face amount of every due. "Your ₦5,000 due stays ₦5,000" holds exactly.
> Duevy's cut: the 3% that isn't transferred out.
> No separate withdrawal fee is part of the confirmed model — v1.0's ₦100 flat withdrawal charge and CBN-stamp-duty pass-through were tied to the Anchor plan and have not been reconfirmed under Bachs (see §13).

### 7.2 Collection economics

| Due total | 3% charge | Student pays | Duevy net (before any Bachs processing cost) |
|---|---|---|---|
| ₦2,000 | ₦60 | ₦2,060 | ₦60 |
| ₦5,000 | ₦150 | ₦5,150 | ₦150 |
| ₦20,000 | ₦600 | ₦20,600 | ₦600 |
| ₦50,000 | ₦1,500 | ₦51,500 | ₦1,500 |

Whether Bachs deducts its own processing cost from the transferred amount or invoices it separately is not yet confirmed — see §13. Until that's answered, the "Duevy net" column above is the 3% gross, not a guaranteed net margin.

### 7.3 What one space is worth

A realistic pilot space: 300 students, one ₦5,000 departmental due.

| Line | Working | Amount |
|---|---|---|
| Collection margin (gross, pre-Bachs-cost) | 300 × ₦150 | ₦45,000 |

This supersedes v1.0's worked example, which included Anchor-specific per-KYC and per-withdrawal costs that don't have a confirmed Bachs equivalent yet.

---

## 8. Data model

PostgreSQL. Multi-school-ready columns stay in the schema even though only LAUTECH is onboarded, but no multi-school UI is built. Money is stored as `NUMERIC(18,2)` decimal, matched to Bachs's decimal-string amounts — never a float, never minor units, to match how Bachs itself represents money.

| Table | Key columns |
|---|---|
| `users` | `id`, `role` (admin\|rep\|student), `full_name`, `email`, `email_verified_at`, `phone`, `password_hash`, `status`, `created_at` |
| `students` | `user_id`, `matric_number`, `school_id`, `level` |
| `reps` | `user_id`, `school_id`, `faculty`, `department`, `rejection_reason` |
| `schools` | `id`, `name`, `slug`, `state` |
| `spaces` (departments) | `id`, `rep_user_id`, `school_id`, `name`, `description`, `code` (unique), `status`, `bachs_account_id`, `bachs_setup_status`, `bachs_transfers_active`, `bachs_payouts_active`, `bachs_payout_destination_id`, `created_at` |
| `space_members` | `space_id`, `student_user_id`, `joined_at`, `removed_at` |
| `space_team` | `space_id`, `user_id`, `role` (rep\|co_rep), `invited_at` — the quorum pool |
| `dues` | `id`, `space_id`, `title`, `type`, `amount`, `description`, `deadline`, `is_mandatory`, `status` (draft\|open\|closed), `created_at` |
| `payments` | `id`, `reference`, `space_id`, `student_user_id`, `subtotal`, `service_charge`, `total`, `status` (pending\|successful\|failed), `bachs_charge_id`, `settled_at`, `paid_at` |
| `payment_lines` | `payment_id`, `due_id`, `amount`, `split_transfer_id` (`tr_...`) — the many-dues-one-payment join, and each line's split transfer |
| `payout_requests` | `id`, `space_id`, `amount`, `status` (pending_quorum\|approved\|processing\|paid\|failed), `bachs_withdrawal_id`, `requested_by`, `requested_at`, `resolved_at` |
| `payout_approvals` | `payout_request_id`, `user_id`, `approved_at` — one row per team member who approved |
| `webhook_events` | `bachs_event_id` (unique), `type`, `payload`, `received_at`, `processed_at`, `status` — the idempotency table |
| `audit_log` | `actor_user_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at` |

> **Money storage**
> Every amount is a decimal string / `NUMERIC(18,2)`, paired with an ISO 4217 currency. No floats, no minor units, anywhere in the payment path.
> Identity documents submitted during Bachs onboarding are never persisted in Duevy's database — store only the Bachs account id and the capability status it reports.

---

## 9. Edge cases and failure handling

### 9.1 Payment

| Case | Behaviour |
|---|---|
| Charge succeeds but hasn't settled yet | Split transfer is not attempted (`INSUFFICIENT_BALANCE` would result). Duevy waits for settlement before splitting. |
| Student disputes or a charge is refunded, department hasn't withdrawn | Duevy claws back the department's share (transfer to `self` from the space's connected account) and refunds the student from Duevy's own balance. |
| Student disputes or a charge is refunded, department **has already withdrawn** | Clawback fails (`INSUFFICIENT_BALANCE`, nothing recorded). Escalates to `/admin` as a manual shortfall — Duevy does not front the money automatically. |
| Due closed while a checkout is open | The payment completes and is honoured. Closing never invalidates an in-flight payment. |
| Two students, same matric number | Allowed to pay; both flagged in the rep's member list as a possible duplicate. |

### 9.2 Onboarding / capability

- A capability can move from `active` back to `restricted` (e.g. a compliance re-review). Duevy treats this as a live state change every time and re-checks before any money movement — never trusts a cached flag.
- A rep stuck in `onboarding_incomplete` keeps their space, code and drafted dues. Nothing is destroyed.
- After any webhook outage, Duevy reconciles by reading `GET /v1/connected-accounts/{id}/capabilities` directly rather than replaying assumed state.

### 9.3 Suspension

- The admin can suspend a space. Payments are refused at checkout, withdrawal requests are blocked (regardless of quorum or capability status), the balance stays where it is.
- Students in a suspended space see a neutral notice, not an accusation.

### 9.4 Refunds

- No self-service refunds in MVP. The admin issues one; Duevy recovers the department's share via clawback where possible (§9.1), and refunds the student from its own balance.
- If the department has already withdrawn and the clawback fails, the admin escalates rather than fronting the money.

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Stack | Next.js (App Router) frontend, Node/Express or Next route handlers for the API, PostgreSQL, hosted on Vercel with a managed Postgres. |
| Security | Bachs keys server-side only; signed webhooks; rate limiting on join, login and checkout; passwords hashed with argon2/bcrypt. |
| Data protection | NDPR: a privacy policy at signup, stated retention, and an export/delete path on request. Identity documents never persisted by Duevy. |
| Auditability | Every admin action, capability transition, payment status change, and payout writes to `audit_log`. |
| Availability | Checkout and webhook handling are the critical paths. A failed webhook is retried; a dropped one is caught by nightly reconciliation. |
| Mobile | Students pay on phones. The checkout is designed mobile-first. |
| Emails | Transactional only: email verification, approval decision, payout-setup result, payment receipt, payout result, rep daily digest. |
| Observability | Error tracking plus an `/admin` health view: pending webhooks, unmatched transfers, stuck payouts. |

---

## 11. Success metrics for the pilot

| Metric | Target | Why it matters |
|---|---|---|
| Reps approved → fully active (both capabilities) | ≥ 80% | Measures whether Bachs onboarding is survivable. |
| Time from approval to first published due | < 24 hours | Measures onboarding friction. |
| Students joined per active space | ≥ 60% of cohort | Measures whether the code distribution works. |
| Checkout started → paid | ≥ 70% | Measures the payment flow. |
| Payments needing manual reconciliation | < 2% | Measures whether the money plumbing is sound. |
| Withdrawal requests that reach quorum | ≥ 1 per active space | Proves the payout loop, including the team's approval behaviour, actually closes. |

---

## 12. Build order

v1.0's four-milestone plan (M1–M4) targeted the Anchor integration and predates the Bachs pivot, the quorum requirement, and the confirmed in-scope status of polls, card payments, and the Duey assistant. The actual `dev` branch has already shipped substantially beyond that original plan — payouts, polls, referrals, disputes, and the assistant all exist in some form today. This section is not re-derived here; treat the current `dev` branch state as the working source of truth for what's built; a fresh build-order pass, if wanted, should be planned as its own piece of work rather than guessed at inside this revision.

---

## 13. Open questions

Superseded Anchor-specific questions from v1.0 (tier naming, Anchor account ownership, Anchor virtual-account behaviour, Anchor's fee-deduction mechanics) are removed — they don't apply to Bachs. Open items as of this revision:

| # | Question |
|---|---|
| 1 | Identity verification method: Bachs offers both a hosted verification session and NIN-based verification for NG accounts. Which does Duevy default reps to, and is the choice offered to the rep? |
| 2 | Per-due / per-checkout amount ceiling: v1.0 capped a single due and checkout at ₦50,000, tied to Anchor's Tier 1 balance limits. Does an equivalent cap apply under Bachs, or is there no ceiling to design around? |
| 3 | Minimum/maximum withdrawal amount under the Bachs model — not yet specified. |
| 4 | Does Bachs deduct its own processing cost from a transfer, or invoice it separately? This determines whether the 3% collected is Duevy's clean net margin or has a further cost to net out (§7.2). |
| 5 | Exact quorum policy: is `ceil(team_size × 0.8)` fixed, or configurable per space? What happens to a pending payout request if a team member who already approved is later removed from the space? |
| 6 | Hold-window policy: how long does Duevy hold a department's share before it's eligible for withdrawal, relative to the dispute window? (Longer hold = safer clawback recovery, slower payouts.) |
| 7 | SCUML registration — flagged as applicable given third-party fund handling. Confirm whether this is still required now that Bachs, not Anchor, is the rail. |
| 8 | A refreshed build-order / milestone plan reflecting what's actually shipped on `dev` today (per §12) — worth doing as separate, focused work. |

*Sources: this session's confirmation of the Bachs pivot, fee model, and quorum requirement; the `bachs-connect` skill (Bachs Connect API reference) for §6's technical detail. v1.0 was sourced from the Anchor BaaS Standard pricing sheet and 3-Tiered KYC Requirements, and docs.getanchor.co.*
