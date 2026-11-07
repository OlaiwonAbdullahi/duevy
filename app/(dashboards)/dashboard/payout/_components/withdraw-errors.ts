import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "../../_components/format";

/** How the withdraw modal reacts to a failed request. */
export type WithdrawErrorInfo = {
  title: string;
  description: string;
  /** Close the modal (the page's banners explain the state) rather than let the rep retry here. */
  close: boolean;
  /** Send the rep back to the amount/recipient step to change something. */
  backToDetails?: boolean;
};

/** First number in `details[0].issue`, e.g. "remaining today is 250000 kobo" → 250000. */
function issueNumber(err: ApiError, pattern: RegExp): number | null {
  const issue = err.details?.[0]?.issue ?? "";
  const match = issue.match(pattern);
  return match ? Number(match[1]) : null;
}

const STATIC: Record<string, WithdrawErrorInfo> = {
  KYC_NOT_VERIFIED: {
    title: "Verification needed",
    description: "Finish verification on the Verification page before withdrawing.",
    close: true,
  },
  SPACE_ACCOUNT_NOT_READY: {
    title: "The department account isn't ready yet",
    description: "9jaPay is still opening it. Withdrawals open as soon as it's ready, usually within minutes.",
    close: true,
  },
  WITHDRAWAL_PIN_LOCKED: {
    title: "Withdrawals are locked",
    description: "Too many wrong security codes. Try again in 30 minutes, or reset the code.",
    close: true,
  },
  WITHDRAWAL_PIN_HOLD: {
    title: "Withdrawals are paused",
    description: "Withdrawal security changed in the last 24 hours. Withdrawals reopen 24 hours after the change.",
    close: true,
  },
  WITHDRAWAL_PIN_NOT_SET: {
    title: "No security code yet",
    description: "The lead rep needs to set a withdrawal security code first.",
    close: true,
  },
  PAYOUTS_FROZEN: {
    title: "Withdrawals are frozen",
    description: "Duevy has paused withdrawals for this department. Contact support to find out why.",
    close: true,
  },
  WITHDRAWAL_IN_PROGRESS: {
    title: "Another withdrawal is in progress",
    description: "Wait for it to settle, then try again. Its status is in the history below.",
    close: true,
  },
  IDEMPOTENCY_IN_PROGRESS: {
    title: "Still processing your request",
    description: "Your first attempt is still going through. Check the history in a moment before trying again.",
    close: true,
  },
  SIGNATORIES_INCOMPLETE: {
    title: "Signatories missing",
    description: "Approvals need 3 signatories. The lead rep must nominate two co-reps on Manage.",
    close: true,
  },
  FORBIDDEN: {
    title: "Not allowed",
    description: "You don't have permission to withdraw from this department.",
    close: true,
  },
  INSUFFICIENT_BALANCE: {
    title: "Not enough in the balance",
    description: "That's more than is available. Lower the amount.",
    close: false,
    backToDetails: true,
  },
  BELOW_MIN_PAYOUT: {
    title: "Below the minimum",
    description: "That's below the minimum withdrawal.",
    close: false,
    backToDetails: true,
  },
  DUE_REQUIRED: {
    title: "Choose a due",
    description: "Pick one of the dues assigned to you to withdraw from.",
    close: false,
    backToDetails: true,
  },
  DUE_NOT_ASSIGNED: {
    title: "That due isn't yours",
    description: "You can only withdraw from dues assigned to you.",
    close: false,
    backToDetails: true,
  },
  BENEFICIARY_NOT_FOUND: {
    title: "Beneficiary removed",
    description: "That beneficiary no longer exists. Pick another account.",
    close: false,
    backToDetails: true,
  },
  ACCOUNT_UNVERIFIABLE: {
    title: "Couldn't verify the account",
    description: "The bank couldn't confirm that account. Check the bank and number.",
    close: false,
    backToDetails: true,
  },
  TOO_MANY_BENEFICIARIES: {
    title: "Too many beneficiaries",
    description: "Untick “Save as a beneficiary” to send without saving, or remove one you no longer use.",
    close: false,
    backToDetails: true,
  },
};

/** API error → what the rep sees in the withdraw modal. Never claims a withdrawal happened. */
export function describeWithdrawError(err: unknown): WithdrawErrorInfo {
  if (!(err instanceof ApiError)) {
    return {
      title: "Couldn't reach Duevy",
      description:
        "Check your connection and try again. Retrying this same withdrawal is safe; it won't be sent twice.",
      close: false,
    };
  }
  switch (err.code) {
    case "INVALID_WITHDRAWAL_PIN": {
      const left = issueNumber(err, /(\d+)\s*attempt/);
      return {
        title: "Wrong security code",
        description:
          left != null
            ? `${left} attempt${left === 1 ? "" : "s"} left before withdrawals lock for 30 minutes.`
            : "Check the code and try again.",
        close: false,
      };
    }
    case "DAILY_LIMIT_EXCEEDED": {
      const left = issueNumber(err, /(\d+)\s*kobo/);
      return {
        title: "Over today's limit",
        description:
          left != null
            ? left > 0
              ? `Only ${nairaFromKobo(left)} can be withdrawn today. Lower the amount, or withdraw the rest tomorrow.`
              : "Nothing more can be withdrawn today. The limit resets at midnight, Lagos time."
            : err.message,
        close: false,
        backToDetails: true,
      };
    }
    case "ABOVE_MAX_PAYOUT":
      return {
        title: "Too much for one withdrawal",
        description: err.message || "Split it into several withdrawals.",
        close: false,
        backToDetails: true,
      };
    default:
      if (err.status >= 500) {
        return {
          title: "Something went wrong on our side",
          description: "Nothing was confirmed. Check the history below before trying again.",
          close: false,
        };
      }
      return (
        STATIC[err.code] ?? {
          title: "Couldn't request the withdrawal",
          description: err.message || "Something went wrong. Please try again.",
          close: false,
        }
      );
  }
}
