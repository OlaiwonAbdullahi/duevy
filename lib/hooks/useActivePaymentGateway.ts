import { useEffect, useState } from "react";
import { getActivePaymentGateway } from "@/lib/api/wallet";

/**
 * Display name ("Paystack"/"Monnify") of the platform's currently active payment
 * gateway. Returns `fallback` until the fetch resolves (or if it fails).
 */
export function useActivePaymentGateway(fallback = "Paystack") {
  const [gateway, setGateway] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    getActivePaymentGateway()
      .then(({ active }) => {
        if (!cancelled) setGateway(active);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return gateway;
}
