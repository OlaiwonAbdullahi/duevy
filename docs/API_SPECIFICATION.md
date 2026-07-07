# Duevy — Backend API Specification

**Version:** 1.0.0-draft · **Status:** Proposed · **Last updated:** 2026-07-07

This document specifies the REST API required to power the Duevy frontend. It was derived
from a full audit of the client codebase (`app/(auth)`, `app/(dashboards)/dashboard`,
`app/(dashboards)/admin`) — every endpoint here maps to a screen, action, or data shape the
UI already renders from mock data. Type names referenced below (e.g. `Due`, `Poll`,
`Transaction`) correspond to the TypeScript definitions in each feature's `_components/types.ts`.

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication & Sessions](#2-authentication--sessions)
3. [User Profile & Settings](#3-user-profile--settings)
4. [Spaces (Departments, Associations, Faculties, Clubs)](#4-spaces)
5. [Circle & Membership Management (Rep)](#5-circle--membership-management-rep)
6. [Dues (Student)](#6-dues-student)
7. [Dues Management & Collections (Rep)](#7-dues-management--collections-rep)
8. [Wallet & Payment Methods](#8-wallet--payment-methods)
9. [Transactions](#9-transactions)
10. [Payouts (Rep)](#10-payouts-rep)
11. [Polls & Voting](#11-polls--voting)
12. [Referrals](#12-referrals)
13. [Notifications](#13-notifications)
14. [Admin Console](#14-admin-console)
15. [Payment Provider Webhooks](#15-payment-provider-webhooks)
16. [Appendix A — Enumerations](#appendix-a--enumerations)
17. [Appendix B — Error Codes](#appendix-b--error-codes)

---

## 1. Conventions

### 1.1 Base URL

```
https://api.duevy.app/v1
```

All paths in this document are relative to the versioned base URL. Breaking changes require a
new version prefix (`/v2`); additive changes (new optional fields, new endpoints) do not.

### 1.2 Authentication

All endpoints require a Bearer token unless explicitly marked **Public**.

```
Authorization: Bearer <access_token>
```

Access tokens are short-lived JWTs (15 min recommended); refresh tokens are long-lived,
rotated on use, and delivered as `httpOnly` `Secure` cookies. The JWT payload carries
`sub` (user id), `role`, and `spaceIds` claims so the gateway can perform coarse
authorization before the request reaches a service.

### 1.3 Roles & authorization

| Role      | Description                                                                                                                                                              | Scope                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `student` | Regular member of one or more spaces. Pays dues, votes, refers friends.                                                                                                  | Own resources only                                                 |
| `rep`     | Department representative. Superset of `student` — additionally raises dues, manages the circle, requests payouts, runs polls.                                           | Own resources + spaces where they hold a rep role (`lead` or `co`) |
| `admin`   | Platform staff. Sub-roles: `super_admin`, `compliance_officer`, `support_lead`, each with a permission matrix over `userManagement`, `payouts`, `disputes`, `overrides`. | Platform-wide, gated by permission matrix                          |

Endpoints are tagged with the minimum role required. A rep-only endpoint must also verify the
caller is a rep **of the space in question**, not merely any rep.

### 1.4 Envelope

Every response is wrapped in a consistent envelope:

```jsonc
// Success
{
  "success": true,
  "data": { /* resource or array */ },
  "meta": { /* pagination, when applicable */ }
}

// Failure
{
  "success": false,
  "error": {
    "code": "DUE_ALREADY_PAID",       // machine-readable, stable (Appendix B)
    "message": "This due has already been settled.", // safe to display
    "details": [ { "field": "amount", "issue": "must be a positive integer" } ]
  }
}
```

### 1.5 Money

All monetary amounts are **integers in kobo** (₦1 = 100 kobo), field-suffixed only where
ambiguous. The client formats for display (`naira()` helper). Signed amounts on ledger rows:
positive = credit into the wallet, negative = debit out — this matches the frontend
`Transaction.amount` convention.

> ⚠️ The current frontend mock data holds whole-naira integers. When wiring the client,
> convert at the boundary (`amountKobo / 100`) rather than changing display logic.

### 1.6 Dates & times

- Timestamps: ISO 8601 with offset — `2026-07-07T08:15:00+01:00`.
- Calendar dates (due deadlines, poll deadlines): `YYYY-MM-DD`.
- The server never returns pre-formatted display strings (`"Today, 8:15 AM"`); relative
  formatting is a client concern.

### 1.7 Pagination, filtering, sorting

List endpoints accept:

| Param     | Type    | Default           | Notes                                |
| --------- | ------- | ----------------- | ------------------------------------ |
| `page`    | integer | `1`               | 1-indexed                            |
| `perPage` | integer | `20`              | Max `100`                            |
| `sort`    | string  | endpoint-specific | e.g. `-createdAt` (`-` = descending) |
| `q`       | string  | —                 | Free-text search where supported     |

Paginated responses include:

```json
"meta": { "page": 1, "perPage": 20, "total": 143, "totalPages": 8 }
```

### 1.8 Idempotency

All money-moving `POST` endpoints (top-ups, due payments, payouts, paid votes) accept an
`Idempotency-Key` header (UUID v4). Replays with the same key return the original result with
`409`-free semantics. Keys are retained for 24 hours.

### 1.9 Identifiers

Opaque, prefixed ULIDs: `usr_…`, `spc_…`, `due_…`, `txn_…`, `pol_…`, `pyt_…`, `ntf_…`,
`dsp_…`, `rpt_…`. Clients must treat ids as opaque strings.

---

## 2. Authentication & Sessions

Backs `app/(auth)/signup`, `app/(auth)/login`, `app/(auth)/forgot-password`, and the
Google button on both auth screens.

### 2.1 `POST /auth/register` — **Public**

Create an account with email + password.

**Request body**

| Field           | Type    | Required | Constraints / Notes                                        |
| --------------- | ------- | -------- | ---------------------------------------------------------- |
| `name`          | string  | ✅       | Full name, 2–100 chars                                     |
| `email`         | string  | ✅       | Valid email, unique, lowercased server-side                |
| `password`      | string  | ✅       | Min 8 chars (mirrors the signup form's `minLength={8}`)    |
| `acceptedTerms` | boolean | ✅       | Must be `true`; server records timestamp + terms version   |
| `referralCode`  | string  | ❌       | From `/join?ref=<code>` deep link; attributes the referral |

**Response `201`** — `{ user: User, accessToken: string }` + refresh cookie.
Sends a verification email (see 2.6).

### 2.2 `POST /auth/login` — **Public**

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Response `200`** — `{ user: User, accessToken: string }` + refresh cookie.
**Errors:** `INVALID_CREDENTIALS` (401), `ACCOUNT_SUSPENDED` (403), `ACCOUNT_DEACTIVATED` (403).

### 2.3 `POST /auth/google` — **Public**

| Field          | Type   | Required | Notes                           |
| -------------- | ------ | -------- | ------------------------------- |
| `idToken`      | string | ✅       | Google ID token from OAuth flow |
| `referralCode` | string | ❌       | Same semantics as register      |

Creates the account on first sign-in. **Response `200`** — same shape as login.

### 2.4 `POST /auth/refresh` — **Public** (cookie-authenticated)

Rotates the refresh cookie, returns a new `accessToken`.

### 2.5 `POST /auth/logout`

Revokes the current refresh token. **Response `204`.**

### 2.6 `POST /auth/verify-email` — **Public**

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `token` | string | ✅       |

### 2.7 `POST /auth/forgot-password` — **Public**

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `email` | string | ✅       |

Always returns `200` (no account enumeration). Sends a time-boxed reset link.

### 2.8 `POST /auth/reset-password` — **Public**

| Field      | Type   | Required | Constraints      |
| ---------- | ------ | -------- | ---------------- |
| `token`    | string | ✅       | From reset email |
| `password` | string | ✅       | Min 8 chars      |

Invalidates all refresh tokens on success.

### 2.9 `GET /auth/me`

Returns the authenticated user with role and space memberships. This seeds `RoleProvider`
(`role-context.tsx`) — the dashboard renders student vs rep views from this.

**`User` resource**

| Field           | Type                       | Description                            |
| --------------- | -------------------------- | -------------------------------------- |
| `id`            | string                     | `usr_…`                                |
| `name`          | string                     | Full name                              |
| `email`         | string                     |                                        |
| `emailVerified` | boolean                    |                                        |
| `phone`         | string \| null             | E.164, e.g. `+2348012345678`           |
| `avatarUrl`     | string \| null             | Initials avatar is the client fallback |
| `role`          | enum                       | `student` · `rep` · `admin`            |
| `matricNo`      | string \| null             |                                        |
| `level`         | string \| null             | e.g. `"300"`                           |
| `walletBalance` | integer                    | Kobo                                   |
| `referralCode`  | string                     | e.g. `"AMARA500"`                      |
| `spaces`        | `SpaceMembershipSummary[]` | See §4                                 |
| `createdAt`     | string                     | ISO 8601                               |

---

## 3. User Profile & Settings

Backs `dashboard/settings` (`ProfileCard`, `SecurityCard`, `NotificationsCard`, `DangerZone`).

### 3.1 `PATCH /me`

Partial update of editable profile fields. `matricNo`, `level`, and department are
school/rep-controlled and rejected here (`FIELD_READ_ONLY`).

| Field       | Type   | Required | Notes                                       |
| ----------- | ------ | -------- | ------------------------------------------- |
| `name`      | string | ❌       | 2–100 chars                                 |
| `email`     | string | ❌       | Triggers re-verification of the new address |
| `phone`     | string | ❌       | E.164                                       |
| `avatarUrl` | string | ❌       | From §3.2 upload                            |

### 3.2 `POST /me/avatar`

`multipart/form-data`, field `file` (JPEG/PNG/WebP, ≤ 2 MB). **Response** — `{ avatarUrl }`.

### 3.3 `PUT /me/password`

| Field             | Type   | Required   |
| ----------------- | ------ | ---------- |
| `currentPassword` | string | ✅         |
| `newPassword`     | string | ✅ (min 8) |

Revokes all other sessions on success.

### 3.4 `GET /me/notification-preferences` · `PUT /me/notification-preferences`

| Field                   | Type    | Description                |
| ----------------------- | ------- | -------------------------- |
| `email.dueReminders`    | boolean | Upcoming/overdue dues      |
| `email.paymentReceipts` | boolean | Receipt after each payment |
| `push.dueReminders`     | boolean |                            |
| `push.payments`         | boolean | Money in/out of wallet     |
| `push.circleActivity`   | boolean | Joins, approvals (rep)     |

`PUT` accepts the full object; returns the updated preferences.

### 3.5 `GET /me/overview`

Aggregate for the **student** dashboard home (`StudentOverview`). One round-trip instead of
four:

```jsonc
{
  "walletBalance": 850000, // kobo
  "outstanding": { "amount": 1250000, "count": 3 }, // open dues (unpaid + overdue)
  "paidThisSession": 2150000, // settled dues in the current academic session
  "openDues": [
    /* Due[], overdue first then by dueDate, max 4 */
  ],
  "recentTransactions": [
    /* Transaction[], max 4, -createdAt */
  ],
}
```

### 3.6 `GET /me/sessions` · `DELETE /me/sessions/{sessionId}`

Active device sessions (device, IP, last seen) with per-session revocation.

### 3.7 `DELETE /me`

Danger-zone account deletion.

| Field      | Type   | Required | Notes                          |
| ---------- | ------ | -------- | ------------------------------ |
| `password` | string | ✅       | Re-authentication guard        |
| `reason`   | string | ❌       | Free text, for churn analytics |

**Errors:** `WALLET_NOT_EMPTY` (409) — balance must be withdrawn/zeroed first;
`ACTIVE_REP_OBLIGATIONS` (409) — rep must transfer or close active dues first.

---

## 4. Spaces

A **space** is any collecting body — department, association, faculty, or club
(`SpaceKind`). A user relates to a space as `member` (their enrolled department) or `guest`
(paying a body they don't belong to). Backs `dashboard/dues` (space switcher + join flow) and
`dashboard/manage`.

**`Space` resource**

| Field         | Type           | Description                                                       |
| ------------- | -------------- | ----------------------------------------------------------------- |
| `id`          | string         | `spc_…`                                                           |
| `name`        | string         | `"Computer Science Students' Association"`                        |
| `short`       | string         | Monogram, e.g. `"CSSA"` — drives the emblem                       |
| `kind`        | enum           | `department` · `association` · `faculty` · `club`                 |
| `hue`         | enum           | Emblem palette: `emerald` · `indigo` · `amber` · `rose` · `slate` |
| `about`       | string         | Short blurb shown on the join preview                             |
| `faculty`     | string \| null | Parent faculty, where applicable                                  |
| `school`      | string         | Institution name                                                  |
| `memberCount` | integer        |                                                                   |
| `membership`  | enum           | Viewer-relative: `member` · `guest` (omitted on admin reads)      |
| `theme`       | string \| null | Space theme slug (drives `data-space-theme`)                      |
| `createdAt`   | string         | ISO 8601                                                          |

### 4.1 `GET /spaces`

Spaces the caller belongs to (member + guest). Returns `Space[]`.

### 4.2 `GET /spaces/{spaceId}`

Single space. Members, guests, and admins only.

### 4.3 `POST /spaces/lookup`

Resolve a join code to a preview — powers the "Join a department" search. Deliberately a
`POST` so codes never appear in URLs/logs.

| Field  | Type   | Required | Notes                       |
| ------ | ------ | -------- | --------------------------- |
| `code` | string | ✅       | Join code, case-insensitive |

**Response `200`** — `JoinableDepartment`: the `Space` plus `code`, `about`, `faculty`, and
`dues: Due[]` (starter dues that will attach to the student on joining).
**Errors:** `JOIN_CODE_INVALID` (404). Rate-limited (10/min/user) to prevent enumeration.

### 4.4 `POST /spaces/{spaceId}/join`

| Field  | Type   | Required | Notes                        |
| ------ | ------ | -------- | ---------------------------- |
| `code` | string | ✅       | Re-validated server-side     |
| `as`   | enum   | ❌       | `member` (default) · `guest` |

**Response `201`** — membership summary. May enter a pending state if the space requires rep
approval (surfaced to the rep as a join request, §5.4).
**Errors:** `ALREADY_MEMBER` (409), `JOIN_CODE_INVALID` (422).

### 4.5 `DELETE /spaces/{spaceId}/membership`

Leave a space (student danger zone). **Errors:** `UNPAID_OBLIGATIONS` (409) if the space
forbids leaving with outstanding dues.

### 4.6 `PATCH /spaces/{spaceId}` — **Rep (lead)**

Update the department profile (`DepartmentProfileCard`).

| Field   | Type   | Required       |
| ------- | ------ | -------------- |
| `name`  | string | ❌             |
| `short` | string | ❌ (2–6 chars) |
| `about` | string | ❌             |
| `hue`   | enum   | ❌             |
| `theme` | string | ❌             |

---

## 5. Circle & Membership Management (Rep)

Backs `dashboard/circle` (students table, join-code stat) and `dashboard/manage`
(reps & roles, audit trail).

### 5.1 `GET /spaces/{spaceId}/members` — **Rep**

Paginated + searchable (`q` matches name, matric no, email).

**`Student` row**

| Field      | Type   | Description                                 |
| ---------- | ------ | ------------------------------------------- |
| `id`       | string | `usr_…`                                     |
| `name`     | string |                                             |
| `matricNo` | string | e.g. `"CSC/2021/045"`                       |
| `level`    | string | e.g. `"300"`                                |
| `email`    | string |                                             |
| `joinedAt` | string | ISO 8601 — when they redeemed the join code |

### 5.2 `DELETE /spaces/{spaceId}/members/{userId}` — **Rep (lead)**

Remove a member. **Response `204`.**

### 5.3 `POST /spaces/{spaceId}/join-code/regenerate` — **Rep**

Rotates the join code; the old code stops working immediately.
**Response** — `{ code: string }`.

### 5.5 `GET /spaces/{spaceId}/reps` — **Rep**

**`Rep` row** — `{ id, name, email, role: "lead" | "co" }`.

### 5.6 `POST /spaces/{spaceId}/reps/invite` — **Rep (lead)**

| Field   | Type   | Required | Notes                                  |
| ------- | ------ | -------- | -------------------------------------- |
| `email` | string | ✅       | Invite sent by email                   |
| `role`  | enum   | ❌       | Only `co` may be granted; default `co` |

### 5.7 `DELETE /spaces/{spaceId}/reps/{userId}` — **Rep (lead)**

Remove a co-rep. A lead cannot remove themselves while sole lead (`LAST_LEAD_REP`, 409).

### 5.8 `GET /spaces/{spaceId}/audit-log` — **Rep**

Paginated, newest first. Backs `AuditTrailCard`.

| Field         | Type   | Description                                                                                                                                                                                                |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string |                                                                                                                                                                                                            |
| `action`      | enum   | `payout_requested` · `due_published` · `due_closed` · `poll_created` · `members_approved` · `profile_updated` · `rep_invited` · `rep_removed` · `code_regenerated` · `lead_transferred` · `space_archived` |
| `description` | string | Human-readable, e.g. `"Requested a ₦250,000 payout"`                                                                                                                                                       |
| `actor`       | object | `{ id, name }`                                                                                                                                                                                             |
| `createdAt`   | string | ISO 8601                                                                                                                                                                                                   |

### 5.9 `GET /spaces/{spaceId}/overview` — **Rep**

Aggregate for the **rep** dashboard home (`RepOverview`) — collection KPIs, active dues with
progress, and newest members in one round-trip:

```jsonc
{
  "space": {
    /* Space */
  },
  "joinCode": "CSSA-2026",
  "stats": {
    "collected": 74550000, // kobo across active dues
    "outstanding": 75250000, // expected − collected
    "unpaidCount": 215, // payments still pending
    "collectionRate": 0.4976, // 0..1
  },
  "activeDues": [
    /* RepDue[] — drives the progress bars */
  ],
  "newMembers": [
    /* Student[], -joinedAt, max 3 */
  ],
}
```

A rep is also a student — the client pairs this with `GET /me/overview` (§3.5) for the
"Your student account" footer.

### 5.10 `POST /spaces/{spaceId}/transfer-lead` — **Rep (lead)**

Danger zone: hand department ownership to another rep; the caller becomes a `co` rep.

| Field      | Type   | Required | Notes                              |
| ---------- | ------ | -------- | ---------------------------------- |
| `userId`   | string | ✅       | Must already be a rep of the space |
| `password` | string | ✅       | Re-authentication guard            |

**Errors:** `NOT_A_REP` (422), `ALREADY_LEAD` (409). Notifies both parties and writes an
audit entry.

### 5.11 `POST /spaces/{spaceId}/archive` — **Rep (lead)**

Danger zone: archive the department. New dues, join requests, and votes stop immediately;
existing records remain readable.

| Field      | Type   | Required | Notes                   |
| ---------- | ------ | -------- | ----------------------- |
| `password` | string | ✅       | Re-authentication guard |

**Errors:** `PENDING_PAYOUT` (409) — processing payouts must settle first;
`HELD_BALANCE` (409) — collected funds must be paid out before archiving.
(Admins can also archive via §14.4.)

---

## 6. Dues (Student)

Backs `dashboard/dues` — the student's dues across all their spaces, the pay modal, and
receipts.

**`Due` resource**

| Field       | Type           | Description                                         |
| ----------- | -------------- | --------------------------------------------------- |
| `id`        | string         | `due_…`                                             |
| `spaceId`   | string         | Owning space                                        |
| `title`     | string         | `"First Semester Departmental Levy"`                |
| `note`      | string         | Rep-supplied context                                |
| `amount`    | integer        | Kobo                                                |
| `dueDate`   | string         | `YYYY-MM-DD` deadline                               |
| `category`  | enum           | `levy` · `dinner` · `handout` · `welfare` · `sport` |
| `status`    | enum           | Viewer-relative: `unpaid` · `paid` · `overdue`      |
| `paidAt`    | string \| null | ISO 8601, when the viewer paid                      |
| `reference` | string \| null | Payment reference, when paid                        |

### 6.1 `GET /dues`

All dues for the caller across their spaces.

**Query params:** `spaceId`, `status` (`unpaid|paid|overdue`), `category`, plus pagination.

### 6.2 `GET /dues/{dueId}`

Single due with the viewer's payment state.

### 6.3 `POST /dues/{dueId}/pay`

Settle a due. Requires `Idempotency-Key`.

| Field    | Type   | Required                      | Notes                                      |
| -------- | ------ | ----------------------------- | ------------------------------------------ |
| `method` | enum   | ✅                            | `wallet` · `card` · `online` (`PayMethod`) |
| `cardId` | string | Required when `method = card` | A saved card (§8)                          |

**Responses**

- `method = wallet` / `card` → `200` `{ transaction: Transaction, receiptUrl: string }`
- `method = online` → `200` `{ checkoutUrl: string, reference: string }` — client redirects
  to Monnify hosted checkout; the due is marked paid by webhook (§15) and the client
  confirms via §6.4.

**Errors:** `INSUFFICIENT_FUNDS` (402), `DUE_ALREADY_PAID` (409), `NOT_A_MEMBER` (403,
unless the due `allowGuests`).

### 6.4 `GET /payments/{reference}/status`

Poll a pending online payment: `{ status: "pending" | "completed" | "failed", transaction? }`.

### 6.5 `GET /dues/{dueId}/receipt`

PDF receipt for a settled due (`Content-Type: application/pdf`). Mirrors the client's
`receipt.ts` generator so numbers always match the ledger.

---

## 7. Dues Management & Collections (Rep)

Backs `dashboard/create-dues` (raise/edit dues) and `dashboard/collections`
(per-due payment tracking).

**`RepDue` resource** — `Due` fields plus:

| Field         | Type    | Description                                    |
| ------------- | ------- | ---------------------------------------------- |
| `allowGuests` | boolean | Whether non-members can pay                    |
| `status`      | enum    | `draft` · `active` · `closed` (`RepDueStatus`) |
| `paidCount`   | integer | Members who have settled                       |
| `memberCount` | integer | Denominator for the progress bar               |

### 7.1 `GET /spaces/{spaceId}/dues` — **Rep**

All dues the space has raised. Filters: `status`, `category`.

### 7.2 `POST /spaces/{spaceId}/dues` — **Rep**

Create a due (`DueDraft`).

| Field         | Type    | Required | Constraints                                            |
| ------------- | ------- | -------- | ------------------------------------------------------ |
| `title`       | string  | ✅       | 3–120 chars                                            |
| `note`        | string  | ❌       | ≤ 500 chars                                            |
| `amount`      | integer | ✅       | Kobo, > 0                                              |
| `dueDate`     | string  | ✅       | `YYYY-MM-DD`, today or later                           |
| `category`    | enum    | ✅       | `levy` · `dinner` · `handout` · `welfare` · `sport`    |
| `allowGuests` | boolean | ❌       | Default `false`                                        |
| `publish`     | boolean | ❌       | `true` → `active` immediately; default saves a `draft` |

### 7.3 `PATCH /spaces/{spaceId}/dues/{dueId}` — **Rep**

Edit a draft or active due (same fields as 7.2). `amount` is immutable once any payment
exists (`DUE_HAS_PAYMENTS`, 409).

### 7.4 `POST /spaces/{spaceId}/dues/{dueId}/publish` · `…/close` — **Rep**

Lifecycle transitions `draft → active → closed`. Closing stops new payments; it does not
refund. **Response** — updated `RepDue`.

### 7.5 `DELETE /spaces/{spaceId}/dues/{dueId}` — **Rep**

Drafts only (`ONLY_DRAFTS_DELETABLE`, 409).

### 7.6 `GET /spaces/{spaceId}/dues/{dueId}/collections` — **Rep**

Per-student payment roster. Backs the collections table + stat tiles.

**Query params:** `status` (`all|paid|unpaid`), `q` (name/matric/email), pagination.

**Response `data`**

```jsonc
{
  "totals": {
    // CollectionTotals
    "paid": 213, // students settled
    "unpaid": 215, // students outstanding
    "collected": 74550000, // kobo received
    "expected": 149800000, // kobo if everyone pays
    "rate": 0.4976, // collected / expected, 0..1
  },
  "students": [
    /* CollectionStudent[] */
  ],
}
```

**`CollectionStudent` row**

| Field       | Type           | Description           |
| ----------- | -------------- | --------------------- |
| `id`        | string         |                       |
| `name`      | string         |                       |
| `matricNo`  | string         |                       |
| `level`     | string         |                       |
| `email`     | string         |                       |
| `status`    | enum           | `paid` · `unpaid`     |
| `paidAt`    | string \| null | ISO 8601              |
| `reference` | string \| null | Transaction reference |

### 7.7 `POST /spaces/{spaceId}/dues/{dueId}/remind` — **Rep**

Nudge unpaid members. `{ userIds?: string[] }` — omit to remind all unpaid. Rate-limited to
one blast per due per 24 h (`REMINDER_COOLDOWN`, 429).

### 7.8 `GET /spaces/{spaceId}/dues/{dueId}/collections/export` — **Rep**

CSV export of the roster. `?status=` filter as in 7.6.

---

## 8. Wallet & Payment Methods

Backs `dashboard/wallet` — balance, top-up (card / Monnify), saved cards, recent activity.

### 8.1 `GET /wallet`

```jsonc
{
  "balance": 850000, // kobo
  "pendingBalance": 0, // top-ups awaiting webhook confirmation
}
```

### 8.2 `POST /wallet/top-up`

Requires `Idempotency-Key`.

| Field    | Type    | Required             | Notes                                        |
| -------- | ------- | -------------------- | -------------------------------------------- |
| `amount` | integer | ✅                   | Kobo; min ₦100, max ₦500,000 per transaction |
| `method` | enum    | ✅                   | `card` · `online` (`TopUpMethod`)            |
| `cardId` | string  | When `method = card` | Saved card to charge                         |

**Responses** — `card`: `200` `{ transaction }` (synchronous charge); `online`: `200`
`{ checkoutUrl, reference }` → Monnify hosted checkout, credited by webhook (§15).

### 8.3 `GET /wallet/cards`

**`Card` resource**

| Field       | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| `id`        | string  |                                 |
| `brand`     | string  | `Visa` · `Mastercard` · `Verve` |
| `last4`     | string  |                                 |
| `expiry`    | string  | `MM/YY`                         |
| `isDefault` | boolean | Exactly one default per user    |

### 8.4 `POST /wallet/cards`

Card capture is **tokenization-only** — raw PANs never touch the API. The client completes a
₦50 verification charge through the provider's inline SDK and posts the resulting token.

| Field           | Type    | Required | Notes                                                |
| --------------- | ------- | -------- | ---------------------------------------------------- |
| `providerToken` | string  | ✅       | Tokenized card reference from the PSP                |
| `isDefault`     | boolean | ❌       | Default `false`; `true` demotes the previous default |

**Response `201`** — `Card` (brand/last4/expiry derived from the token server-side).

### 8.5 `PATCH /wallet/cards/{cardId}`

`{ "isDefault": true }` — promote to default.

### 8.6 `DELETE /wallet/cards/{cardId}`

**Response `204`.** Deleting the default promotes the next card; deleting the last card is
allowed.

### 8.7 `GET /wallet/activity`

Recent wallet movements (the compact `ActivityList`). Thin projection of §9 filtered to
wallet-touching rows: `{ id, label, detail, amount, createdAt }[]`, signed amounts.

---

## 9. Transactions

Backs `dashboard/transactions` — the full ledger with direction tabs and receipts.

**`Transaction` resource**

| Field       | Type    | Description                                                        |
| ----------- | ------- | ------------------------------------------------------------------ |
| `id`        | string  | `txn_…`                                                            |
| `type`      | enum    | `due` · `topup` · `referral` · `withdrawal` · `refund` (`TxnType`) |
| `title`     | string  | `"First Semester Departmental Levy"`                               |
| `detail`    | string  | Counterparty/space, e.g. `"Computer Science Dept."`                |
| `amount`    | integer | Kobo, signed (positive = in, negative = out)                       |
| `method`    | string  | `"Wallet"` · `"Visa •••• 4242"` · `"Monnify"`                      |
| `status`    | enum    | `completed` · `pending` · `failed` (`TxnStatus`)                   |
| `reference` | string  | `"DVY-8842-0193"` — globally unique, shown on receipts             |
| `createdAt` | string  | ISO 8601 (client renders as `date`)                                |

### 9.1 `GET /transactions`

**Query params:** `direction` (`all|in|out` — the segmented tabs), `type`, `status`,
`from` / `to` (ISO dates), `q` (title/reference), pagination. Default sort `-createdAt`.

### 9.2 `GET /transactions/{transactionId}`

Single transaction.

### 9.3 `GET /transactions/{transactionId}/receipt`

PDF receipt (`application/pdf`), consistent with §6.5.

---

## 10. Payouts (Rep)

Backs `dashboard/payout` — available balance, destination bank account, withdrawal modal,
payout history.

### 10.1 `GET /spaces/{spaceId}/payout/summary` — **Rep**

```jsonc
{
  "available": 80000000, // kobo cleared for withdrawal
  "pending": 12500000, // collected but inside the clearing window
  "lifetime": 425000000, // total ever paid out
}
```

### 10.2 `GET /spaces/{spaceId}/payout/account` — **Rep** · `PUT` to replace

**`BankAccount` resource**

| Field           | Type   | Required (PUT) | Notes                                                                                  |
| --------------- | ------ | -------------- | -------------------------------------------------------------------------------------- |
| `bankCode`      | string | ✅             | CBN bank code (client shows `bankName`)                                                |
| `bankName`      | string | —              | Server-resolved from `bankCode`                                                        |
| `accountNumber` | string | ✅             | 10 digits (NUBAN); returned **masked** (`•••• 4021`) except on the PUT echo            |
| `accountName`   | string | —              | Server-resolved via name-enquiry; PUT fails on mismatch (`ACCOUNT_NAME_MISMATCH`, 422) |

Changing the account triggers a security email to all reps of the space and imposes a 24 h
payout hold (`ACCOUNT_COOLDOWN`).

### 10.3 `POST /spaces/{spaceId}/payout/request` — **Rep**

Requires `Idempotency-Key`.

| Field    | Type    | Required | Notes                                   |
| -------- | ------- | -------- | --------------------------------------- |
| `amount` | integer | ✅       | Kobo, ≤ `available`                     |
| `note`   | string  | ❌       | Internal memo, shows in the audit trail |

**Response `201`** — `Payout` (below), initially `processing`.
**Errors:** `INSUFFICIENT_PAYOUT_BALANCE` (402), `NO_PAYOUT_ACCOUNT` (409),
`ACCOUNT_COOLDOWN` (409), `PAYOUTS_FROZEN` (423 — admin freeze, §14.3).

### 10.4 `GET /spaces/{spaceId}/payouts` — **Rep**

Payout history, `-requestedAt`.

**`Payout` resource**

| Field           | Type           | Description                                            |
| --------------- | -------------- | ------------------------------------------------------ |
| `id`            | string         | `pyt_…`                                                |
| `amount`        | integer        | Kobo                                                   |
| `reference`     | string         | e.g. `"PAY-2026-0642"`                                 |
| `status`        | enum           | `processing` · `completed` · `failed` (`PayoutStatus`) |
| `account`       | string         | Masked destination, `"GTBank •••• 4021"`               |
| `requestedAt`   | string         | ISO 8601                                               |
| `settledAt`     | string \| null | ISO 8601                                               |
| `failureReason` | string \| null | Present when `failed`                                  |

---

## 11. Polls & Voting

Backs `dashboard/polls` (rep builder + student voting) and the public share link
(`/vote/{slug}`). Award-night style polls: a poll contains **categories** (e.g. "Best
Dressed"), each with **nominees**.

**`Poll` resource**

| Field           | Type             | Description                                           |
| --------------- | ---------------- | ----------------------------------------------------- |
| `id`            | string           | `pol_…`                                               |
| `spaceId`       | string           | Owning space                                          |
| `title`         | string           | `"CSSA Dinner & Awards 2026"`                         |
| `description`   | string           |                                                       |
| `deadline`      | string           | `YYYY-MM-DD` voting close                             |
| `status`        | enum             | `draft` · `active` · `closed` (`PollStatus`)          |
| `membersOnly`   | boolean          | `true` → verified members only, one vote per category |
| `paid`          | boolean          | `true` → each vote must be paid for                   |
| `amountPerVote` | integer          | Kobo; meaningful only when `paid`                     |
| `slug`          | string           | Shareable link segment, unique                        |
| `categories`    | `PollCategory[]` | See below                                             |
| `totalVotes`    | integer          | Denormalized rollup                                   |
| `revenue`       | integer          | Kobo collected (paid polls)                           |

**`PollCategory`** — `{ id, title, nominees: Nominee[] }`
**`Nominee`** — `{ id, name, votes: integer }` (`votes` included per visibility rules: always
for reps; for voters only after close, unless the poll opts into live tallies).

### 11.1 `GET /spaces/{spaceId}/polls` — **Rep**

All polls with rollups. Filter: `status`.

### 11.2 `POST /spaces/{spaceId}/polls` — **Rep**

Create from `PollDraft`.

| Field           | Type    | Required    | Constraints                                                            |
| --------------- | ------- | ----------- | ---------------------------------------------------------------------- |
| `title`         | string  | ✅          | 3–120 chars                                                            |
| `description`   | string  | ❌          | ≤ 500 chars                                                            |
| `deadline`      | string  | ✅          | Future `YYYY-MM-DD`                                                    |
| `membersOnly`   | boolean | ✅          |                                                                        |
| `paid`          | boolean | ✅          |                                                                        |
| `amountPerVote` | integer | When `paid` | Kobo, > 0                                                              |
| `categories`    | array   | ✅          | ≥ 1; each `{ title, nominees: [{ name }] }`, ≥ 2 nominees per category |
| `publish`       | boolean | ❌          | `true` → `active`; default `draft`                                     |

Server generates `slug` from the title (deduplicated).

### 11.3 `PATCH /spaces/{spaceId}/polls/{pollId}` — **Rep**

Edit a draft freely. Once active, structural fields (`categories`, `paid`, `amountPerVote`,
`membersOnly`) are locked (`POLL_STRUCTURE_LOCKED`, 409); `deadline` may only extend.

### 11.4 `POST /spaces/{spaceId}/polls/{pollId}/publish` · `…/close` — **Rep**

Lifecycle transitions. Close is idempotent and also fires automatically at `deadline`.

### 11.5 `GET /polls/{slug}` — **Public**

Voter-facing view via the share link. Includes the caller's remaining votes per category when
authenticated. `membersOnly` polls return `403 MEMBERS_ONLY` to non-members.

### 11.6 `POST /polls/{slug}/votes`

Cast votes. Requires auth; requires `Idempotency-Key` when `paid`.

| Field        | Type   | Required             | Notes                                                                                       |
| ------------ | ------ | -------------------- | ------------------------------------------------------------------------------------------- |
| `selections` | array  | ✅                   | `[{ categoryId, nomineeId, quantity }]`; `quantity` ≥ 1, forced to 1 on `membersOnly` polls |
| `method`     | enum   | When `paid`          | `wallet` · `card` · `online`                                                                |
| `cardId`     | string | When `method = card` |                                                                                             |

**Responses** — free/wallet/card: `201` `{ receiptId, totalCharged }`; `online`: `200`
`{ checkoutUrl, reference }` (votes count on webhook confirmation).
**Errors:** `POLL_CLOSED` (409), `ALREADY_VOTED` (409, members-only),
`INSUFFICIENT_FUNDS` (402).

### 11.7 `GET /spaces/{spaceId}/polls/{pollId}/results` — **Rep**

Full tallies plus revenue: `{ poll, totalVotes, revenue, categories: [{ id, title, nominees: [{ id, name, votes }] }] }`.

---

## 12. Referrals

Backs `dashboard/referrals` — invite link, stat row, referral list. Reward is a fixed bounty
(currently ₦500) credited when the referred friend pays their first due.

### 12.1 `GET /referrals`

```jsonc
{
  "code": "AMARA500",
  "link": "https://duevy.app/join?ref=AMARA500",
  "rewardPerReferral": 50000, // kobo
  "summary": { "invited": 5, "joined": 4, "earned": 100000 },
  "referrals": [
    /* Referral[] */
  ],
}
```

**`Referral` row**

| Field    | Type    | Description                                                                              |
| -------- | ------- | ---------------------------------------------------------------------------------------- |
| `id`     | string  |                                                                                          |
| `name`   | string  | Referred friend's name                                                                   |
| `status` | enum    | `pending` (invite sent) · `joined` (signed up) · `paid` (first due paid — reward earned) |
| `reward` | integer | Kobo earned from this friend (0 until `paid`)                                            |
| `date`   | string  | ISO date invited/joined                                                                  |

Referral earnings land in the wallet as `type: "referral"` transactions (§9).

### 12.2 `POST /referrals/invites` _(optional, phase 2)_

`{ emails: string[] }` — send invite emails carrying the caller's code. The share-link flow
(§12.1) requires no endpoint.

---

## 13. Notifications

Backs the bell dropdown (`notifications-data.ts`).

**`Notification` resource**

| Field       | Type           | Description                                                                                                                                           |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | string         | `ntf_…`                                                                                                                                               |
| `kind`      | enum           | `due_reminder` · `payment_received` · `join_request` · `payout_completed` · `poll_milestone` · `referral_earned` · `system` — client maps kind → icon |
| `tone`      | enum           | `brand` · `amber` · `rose`                                                                                                                            |
| `title`     | string         | `"Payment received"`                                                                                                                                  |
| `detail`    | string         | `"Amina Bello paid ₦7,500 for the departmental levy."`                                                                                                |
| `href`      | string \| null | In-app deep link, e.g. `/dashboard/collections`                                                                                                       |
| `read`      | boolean        |                                                                                                                                                       |
| `createdAt` | string         | ISO 8601 (client renders `"2h ago"`)                                                                                                                  |

### 13.1 `GET /notifications`

Paginated, `-createdAt`. `meta` additionally carries `unreadCount`.

### 13.2 `POST /notifications/{notificationId}/read` · `POST /notifications/read-all`

Mark one / all as read. **Response `204`.**

> **Transport note:** ship with polling (`GET /notifications?since=<cursor>` every 60 s);
> upgrade to SSE at `GET /notifications/stream` when realtime is justified.

---

## 14. Admin Console

Backs `app/(dashboards)/admin/*`. All routes require `role = admin` plus the relevant
permission (`userManagement`, `payouts`, `disputes`, `overrides`). Every mutating admin call
is written to the admin audit log (§14.9) automatically.

### 14.1 `GET /admin/overview`

Single aggregate for the overview page:

```jsonc
{
  "totalUsers": 1280,
  "activeReps": 1,
  "duesCollected": 149265000, // kobo, platform-wide
  "duesTarget": 183000000,
  "floatHeld": 28520000, // rep-held balances not yet paid out
  "overdue": { "amount": 18600000, "count": 42 },
  "attention": [
    // actionable flags for the attention list
    {
      "id": "…",
      "tone": "warning",
      "badge": "Low collection",
      "title": "…",
      "detail": "…",
      "href": "/admin/reps",
      "linkLabel": "Review reps",
    },
  ],
}
```

### 14.2 Users — `/admin/users`

**`AppUser` resource**

| Field            | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `id`             | string   |                                                    |
| `role`           | enum     | `student` · `rep` · `admin`                        |
| `name` · `email` | string   |                                                    |
| `department`     | string   | Primary space name                                 |
| `walletBalance`  | integer  | Kobo                                               |
| `isSuspended`    | boolean  | Temporary block; reversible                        |
| `isDeactivated`  | boolean  | Account closed                                     |
| `kycStatus`      | enum     | `unverified` · `pending` · `verified` · `rejected` |
| `kycDocs`        | string[] | Document URLs (signed, short-lived)                |
| `spaces`         | string[] | Space names                                        |

| Method & path                           | Purpose                                                     | Body                                                    |
| --------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| `GET /admin/users`                      | List/search. Filters: `role`, `kycStatus`, `suspended`, `q` | —                                                       |
| `GET /admin/users/{userId}`             | Detail                                                      | —                                                       |
| `POST /admin/users/{userId}/suspend`    | Suspend                                                     | `{ reason: string }` (required)                         |
| `POST /admin/users/{userId}/unsuspend`  | Lift suspension                                             | —                                                       |
| `POST /admin/users/{userId}/deactivate` | Close account                                               | `{ reason: string }`                                    |
| `POST /admin/users/{userId}/kyc/review` | Approve/reject KYC                                          | `{ decision: "verified" \| "rejected", note?: string }` |

### 14.3 Reps — `/admin/reps`

**`AdminRep` resource** (extends the mock `Rep`)

| Field               | Type     | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `id` · `name`       | string   |                                               |
| `departmentIds`     | string[] | Spaces they run                               |
| `status`            | enum     | `active` · `pending` · `suspended`            |
| `verification`      | enum     | `unverified` · `pending` · `verified`         |
| `heldAmount`        | integer  | Kobo currently held (collected, not paid out) |
| `uncollectedAmount` | integer  | Kobo outstanding across their dues            |
| `collectionRate`    | number   | 0..1                                          |

| Method & path                                                    | Purpose                                      | Body                            |
| ---------------------------------------------------------------- | -------------------------------------------- | ------------------------------- |
| `GET /admin/reps`                                                | List. Filters: `status`, `verification`, `q` | —                               |
| `POST /admin/reps/{repId}/verify`                                | Approve rep verification                     | `{ note?: string }`             |
| `POST /admin/reps/{repId}/suspend` · `…/reinstate`               | Toggle status                                | `{ reason: string }` on suspend |
| `POST /admin/reps/{repId}/freeze-payouts` · `…/unfreeze-payouts` | Payout freeze (`PAYOUTS_FROZEN` on §10.3)    | `{ reason: string }`            |

### 14.4 Spaces — `/admin/spaces`

| Method & path                             | Purpose                                                                                                           | Body                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `GET /admin/spaces`                       | List. Filters: `type`, `school`, `q`. Rows carry `memberCount`, `duesTarget`, `collectedAmount`, `assignedRepIds` | —                                         |
| `POST /admin/spaces`                      | Create a space                                                                                                    | `{ name, short, kind, school, faculty? }` |
| `PATCH /admin/spaces/{spaceId}`           | Edit                                                                                                              | Any creatable field                       |
| `POST /admin/spaces/{spaceId}/assign-rep` | Attach a rep                                                                                                      | `{ userId, role: "lead" \| "co" }`        |
| `POST /admin/spaces/{spaceId}/archive`    | Soft-delete                                                                                                       | `{ reason: string }`                      |

### 14.5 Transactions — `/admin/transactions`

Platform-wide ledger. Row = user-facing `Transaction` (§9) plus `userName`, `userEmail`,
`spaceName`; admin `type` vocabulary: `deposit` · `dues_payment` · `payout` · `refund`;
`status` adds `refunded`.

| Method & path                             | Purpose                                                                                  | Body                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /admin/transactions`                 | Filters: `type`, `status`, `spaceId`, `userId`, `from`, `to`, `q` (reference/name/email) | —                                                                      |
| `POST /admin/transactions/{txnId}/refund` | Issue refund (permission: `overrides`)                                                   | `{ amount?: integer, reason: string }` — omit `amount` for full refund |

### 14.6 Disputes — `/admin/disputes`

**`Dispute` resource**

| Field                               | Type       | Description                                                    |
| ----------------------------------- | ---------- | -------------------------------------------------------------- |
| `id`                                | string     | `dsp_…`                                                        |
| `type`                              | enum       | `payment_not_reflecting` · `non_remittance` · `refund_request` |
| `openedBy` · `email` · `department` | string     | Complainant context                                            |
| `status`                            | enum       | `open` · `under_review` · `resolved`                           |
| `slaDays`                           | integer    | SLA window                                                     |
| `ageDays`                           | integer    | Derived; breach when `> slaDays`                               |
| `studentEvidence` · `repEvidence`   | `Evidence` | `{ title, description, reference?, amount? }`                  |

| Method & path                       | Purpose                                  | Body                                                                         |
| ----------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /admin/disputes`               | Filters: `status`, `type`, `q`           | —                                                                            |
| `POST /admin/disputes/{id}/claim`   | Move to `under_review`, assign to caller | —                                                                            |
| `POST /admin/disputes/{id}/resolve` | Close out                                | `{ resolution: "upheld" \| "rejected", note: string, refundTxnId?: string }` |

Students/reps file disputes from the app: `POST /disputes` with
`{ type, transactionReference?, description }` (member-facing, any role).

### 14.7 Polls oversight — `/admin/polls`

`GET /admin/polls` — all polls across spaces (rows = `Poll` + `space` name).
`POST /admin/polls/{pollId}/close` — force-close (`overrides`), body `{ reason: string }`.

### 14.8 Referral integrity — `/admin/referrals`

`GET /admin/referrals/summaries` — per-referrer rollups:
`{ userId, userName, email, invited, joined, earned, riskTier: "low"|"medium"|"high" }`.

`GET /admin/referrals/flags` — fraud queue:

| Field                   | Type    | Description                                       |
| ----------------------- | ------- | ------------------------------------------------- |
| `id`                    | string  |                                                   |
| `referrer` · `referred` | string  | Names                                             |
| `label`                 | string  | Rule that fired, e.g. `"Same device fingerprint"` |
| `description`           | string  |                                                   |
| `amount`                | integer | Kobo at stake                                     |
| `status`                | enum    | `pending` · `paid` · `voided` · `clawed_back`     |
| `date`                  | string  | ISO date                                          |

`POST /admin/referrals/flags/{flagId}/resolve` — body
`{ action: "approve" | "void" | "claw_back", note?: string }`.

### 14.9 Reports & audit — `/admin/reports`, `/admin/audit-logs`

`POST /admin/reports` — generate async:

| Field         | Type   | Required | Notes                                                                        |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| `scope`       | enum   | ✅       | `financial_summary` · `space_collection` · `rep_performance` · `full_ledger` |
| `format`      | enum   | ✅       | `csv` · `pdf`                                                                |
| `from` / `to` | string | ✅       | ISO date range                                                               |
| `spaceId`     | string | ❌       | Narrow `space_collection`                                                    |

**Response `202`** — `ReportLog`: `{ id, name, scope, format, status: "generating" | "ready" | "expired", generatedAt, fileSize, downloadUrl? }`.
`GET /admin/reports` — history. `GET /admin/reports/{id}/download` — signed file (7-day expiry).

`GET /admin/audit-logs` — every admin action:
`{ id, actor, role, action, target, ip, device, severity: "info"|"warning"|"critical", createdAt }`.
Filters: `severity`, `actorId`, `from`, `to`.

`GET /admin/roles` · `PUT /admin/roles/{role}` — the role/permission matrix
(`{ role, userCount, permissions: { userManagement, payouts, disputes, overrides } }`).
`PUT` requires `super_admin`.

---

## 15. Payment Provider Webhooks

### 15.1 `POST /webhooks/monnify` — **Public** (signature-verified)

Single ingestion point for hosted-checkout completions (wallet top-ups §8.2, online due
payments §6.3, paid votes §11.6).

**Requirements**

- Verify `monnify-signature` (HMAC-SHA512 of the raw body with the client secret) before any
  processing; reject with `401` otherwise.
- Idempotent on `transactionReference` — Monnify retries; replays must be no-ops.
- Return `200` fast; do fulfilment (credit wallet, mark due paid, count votes, fire
  notifications) on a queue.
- Reconciliation job: poll Monnify's transaction-status API for references still `pending`
  after 15 minutes, in case a webhook was missed.

---

## Appendix A — Enumerations

| Enum                 | Values                                                                       | Source of truth                     |
| -------------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `Role`               | `student` · `rep` · `admin`                                                  | `role-context.tsx` (+ admin)        |
| `SpaceKind`          | `department` · `association` · `faculty` · `club`                            | `dues/_components/types.ts`         |
| `SpaceMembership`    | `member` · `guest`                                                           | 〃                                  |
| `EmblemHue`          | `emerald` · `indigo` · `amber` · `rose` · `slate`                            | 〃                                  |
| `DueCategory`        | `levy` · `dinner` · `handout` · `welfare` · `sport`                          | 〃                                  |
| `DueStatus` (viewer) | `unpaid` · `paid` · `overdue`                                                | 〃                                  |
| `RepDueStatus`       | `draft` · `active` · `closed`                                                | `create-dues/_components/types.ts`  |
| `PayMethod`          | `wallet` · `card` · `online`                                                 | `dues/_components/types.ts`         |
| `TxnType`            | `due` · `topup` · `referral` · `withdrawal` · `refund`                       | `transactions/_components/types.ts` |
| `TxnStatus`          | `completed` · `pending` · `failed`                                           | 〃                                  |
| `PayoutStatus`       | `processing` · `completed` · `failed`                                        | `payout/_components/types.ts`       |
| `PollStatus`         | `draft` · `active` · `closed`                                                | `polls/_components/types.ts`        |
| `ReferralStatus`     | `pending` · `joined` · `paid`                                                | `referrals/_components/data.ts`     |
| `NotificationTone`   | `brand` · `amber` · `rose`                                                   | `notifications-data.ts`             |
| `KycStatus`          | `unverified` · `pending` · `verified` · `rejected`                           | `admin/users/page.tsx`              |
| `DisputeStatus`      | `open` · `under_review` · `resolved`                                         | `admin/disputes/page.tsx`           |
| `DisputeType`        | `payment_not_reflecting` · `non_remittance` · `refund_request`               | 〃                                  |
| `RiskTier`           | `low` · `medium` · `high`                                                    | `admin/referrals/page.tsx`          |
| `FlagStatus`         | `pending` · `paid` · `voided` · `clawed_back`                                | 〃                                  |
| `ReportScope`        | `financial_summary` · `space_collection` · `rep_performance` · `full_ledger` | `admin/reports/page.tsx`            |
| `AdminRole`          | `super_admin` · `compliance_officer` · `support_lead`                        | `admin/settings/page.tsx`           |

## Appendix B — Error Codes

| HTTP | Code                                                                                                                                                                                                                                                      | Where                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 400  | `VALIDATION_ERROR`                                                                                                                                                                                                                                        | Any — details in `error.details[]` |
| 401  | `UNAUTHENTICATED` / `TOKEN_EXPIRED` / `INVALID_CREDENTIALS`                                                                                                                                                                                               | Auth                               |
| 402  | `INSUFFICIENT_FUNDS` / `INSUFFICIENT_PAYOUT_BALANCE`                                                                                                                                                                                                      | Payments, payouts                  |
| 403  | `FORBIDDEN` / `MEMBERS_ONLY` / `NOT_A_MEMBER` / `ACCOUNT_SUSPENDED` / `ACCOUNT_DEACTIVATED`                                                                                                                                                               | Cross-cutting                      |
| 404  | `NOT_FOUND` / `JOIN_CODE_INVALID`                                                                                                                                                                                                                         | Cross-cutting                      |
| 409  | `DUE_ALREADY_PAID` / `ALREADY_MEMBER` / `ALREADY_VOTED` / `POLL_CLOSED` / `POLL_STRUCTURE_LOCKED` / `DUE_HAS_PAYMENTS` / `ONLY_DRAFTS_DELETABLE` / `LAST_LEAD_REP` / `WALLET_NOT_EMPTY` / `UNPAID_OBLIGATIONS` / `NO_PAYOUT_ACCOUNT` / `ACCOUNT_COOLDOWN` | State conflicts                    |
| 422  | `ACCOUNT_NAME_MISMATCH` / `FIELD_READ_ONLY`                                                                                                                                                                                                               | Semantic validation                |
| 423  | `PAYOUTS_FROZEN`                                                                                                                                                                                                                                          | Admin freeze                       |
| 429  | `RATE_LIMITED` / `REMINDER_COOLDOWN`                                                                                                                                                                                                                      | Throttling                         |
| 500  | `INTERNAL_ERROR`                                                                                                                                                                                                                                          | Never leaks internals              |

---

_Questions or proposed changes: open a PR against this document. The frontend types in
`app/(dashboards)/**/_components/types.ts` are the client-side contract mirror — keep both in
sync._
