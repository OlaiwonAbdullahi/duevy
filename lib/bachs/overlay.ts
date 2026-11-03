import { loadBachs, type Bachs, type BachsCheckoutEvent } from "@bachs/js";

export type { BachsCheckoutEvent };

/**
 * Bachs overlay checkout (docs.bachs.io/guides/checkout/overlay-checkout).
 *
 * The SDK is loaded and initialised once per page lifetime with a single
 * global event handler, which forwards to whichever checkout is open now.
 * Overlay events are UI cues only: the browser's `checkout.completed` is never
 * treated as payment — the pay page waits for the API, which confirms it from
 * the signed Bachs webhook or by asking Bachs directly.
 *
 * `checkoutUrl` always comes from our API (the checkout session it created);
 * the SDK refuses one that isn't on the checkout origin. That origin defaults
 * to Bachs's live one; set NEXT_PUBLIC_BACHS_CHECKOUT_ORIGIN if the sandbox
 * serves checkouts from elsewhere.
 */

const CHECKOUT_ORIGIN = process.env.NEXT_PUBLIC_BACHS_CHECKOUT_ORIGIN || undefined;

let ready: Promise<Bachs> | null = null;
let current: ((event: BachsCheckoutEvent) => void) | null = null;

/** Load and initialise the SDK. Safe to call often; only the first call does anything. */
export function preloadBachs(): Promise<Bachs> {
  ready ??= loadBachs(CHECKOUT_ORIGIN ? { baseUrl: CHECKOUT_ORIGIN } : undefined)
    .then((bachs) =>
      bachs.Initialize({
        ...(CHECKOUT_ORIGIN ? { baseUrl: CHECKOUT_ORIGIN } : {}),
        onEvent: (event) => current?.(event),
      }),
    )
    .catch((err) => {
      // Let the next attempt try the script again (flaky network, blocker).
      ready = null;
      throw err;
    });
  return ready;
}

/**
 * Open the overlay for a checkout session. Events for it go to `onEvent` until
 * another checkout opens. Rejects if the SDK can't load or the URL is refused.
 */
export async function openBachsCheckout(checkoutUrl: string, onEvent: (event: BachsCheckoutEvent) => void) {
  const bachs = await preloadBachs();
  current = onEvent;
  return bachs.Checkout.open({ checkoutUrl, options: { autoCloseOnComplete: true } });
}

/** Close the overlay if it's open (e.g. the page is going away). */
export function closeBachsCheckout() {
  current = null;
  if (typeof window !== "undefined" && window.Bachs?.Checkout.isOpen()) window.Bachs.Checkout.close();
}
