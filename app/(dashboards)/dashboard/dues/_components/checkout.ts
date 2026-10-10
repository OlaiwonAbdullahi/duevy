import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";

/**
 * The dedicated bank-transfer page for a checkout. `params` (e.g. `dueId`,
 * `from`, `conversationId`) ride along so the page can link a receipt and send
 * the student back where they came from.
 */
export function payPageHref(
  reference: string,
  params: Record<string, string | null | undefined> = {},
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return `/dashboard/pay/${encodeURIComponent(reference)}${qs ? `?${qs}` : ""}`;
}

/**
 * Explain a failed `POST /dues/pay` (or `/dues/:dueId/pay`). `openPayment` is
 * offered on CHECKOUT_OVERLAP so the student can jump to the payment that's
 * already open for these dues.
 */
export function toastCheckoutError(
  err: unknown,
  openPayment?: (reference: string) => void,
) {
  if (!(err instanceof ApiError)) {
    toast.error("Couldn't start this payment. Please try again.");
    return;
  }
  switch (err.code) {
    case "SPACE_NOT_VERIFIED":
      toast.error("This space can't take payments yet", {
        description:
          "Its rep hasn't finished verification. Try again once they have — nothing was charged.",
      });
      return;
    case "DUE_ALREADY_PAID":
      toast.error("Already paid", {
        description: `${err.message}. Refresh to see your latest dues.`,
      });
      return;
    case "MIXED_SPACES":
      toast.error("Pay one space at a time", {
        description: "Dues from different spaces have to be paid separately.",
      });
      return;
    case "NOT_A_MEMBER":
      toast.error("Join this space first", {
        description: "Enter the space's join code before paying its dues.",
      });
      return;
    case "CHECKOUT_OVERLAP": {
      // The message names the open checkout, e.g. "(DVY-7KQ2-MN4X)".
      const open = err.message.match(/\(([A-Z0-9-]{6,})\)/)?.[1];
      toast.error("You already have an open payment for these dues", {
        description: "Finish that transfer, or wait for it to expire, before starting another.",
        ...(open && openPayment
          ? { action: { label: "Open payment", onClick: () => openPayment(open) } }
          : {}),
      });
      return;
    }
    case "CHECKOUT_OPENING":
      toast.info("Still setting up your payment", {
        description: "Give it a few seconds, then try again.",
      });
      return;
    default:
      toast.error(err.message || "Couldn't start this payment. Please try again.");
  }
}
