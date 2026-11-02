"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { getPayoutSummary, resetWithdrawalPin, setWithdrawalPin } from "@/lib/api/payouts";
import { queryKeys } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/errors";
import { useRepSpace } from "../../_components/use-rep-space";
import { PIN_ERRORS, type PinMode } from "../../payout/_components/PinModal";
import { ActionRow } from "./SecurityCard";

const PinModal = dynamic(() => import("../../payout/_components/PinModal").then((mod) => mod.PinModal), { ssr: false });

/**
 * The lead rep's withdrawal security code. Only shown once the space can
 * withdraw with a code; the payout page still prompts when it's unset or locked.
 */
export function WithdrawalCodeRow() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.membership === "lead" ? repSpace.id : undefined;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<PinMode | null>(null);

  const { data: summary } = useQuery({
    queryKey: queryKeys.payoutSummary(spaceId ?? ""),
    queryFn: () => getPayoutSummary(spaceId!),
    enabled: !!spaceId,
  });

  if (!spaceId || !summary?.kyc.canWithdraw || (summary.withdrawalAuthMode ?? "pin") !== "pin") return null;

  const row = !summary.withdrawalPinSet
    ? { description: "Not set yet. You'll need it to withdraw.", cta: "Set", mode: "set" as const }
    : summary.withdrawalPinLockedUntil
      ? { description: "Locked after too many wrong codes. Reset it with your password.", cta: "Reset", mode: "reset" as const }
      : { description: "Set. You enter it every time you withdraw.", cta: "Change", mode: "change" as const };

  const save = async (payload: { pin: string; password: string; currentPin?: string }) => {
    if (!mode) return;
    try {
      const res =
        mode === "reset"
          ? await resetWithdrawalPin(spaceId, { pin: payload.pin, password: payload.password })
          : await setWithdrawalPin(spaceId, payload);
      setMode(null);
      if (res.change === "reset") {
        toast.success("Withdrawal code reset", {
          description: "For your safety, withdrawals reopen in 24 hours. Your co-reps have been notified.",
        });
      } else {
        toast.success(res.change === "set" ? "Withdrawal code saved" : "Withdrawal code changed", {
          description: "You'll enter it every time you withdraw.",
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.payoutSummary(spaceId) });
    } catch (err) {
      toast.error("Couldn't save the code", {
        description: (err instanceof ApiError && PIN_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <>
      <ActionRow
        title="Withdrawal security code"
        description={row.description}
        cta={row.cta}
        icon={SquareLock02Icon}
        onClick={() => setMode(row.mode)}
      />
      {mode && (
        <PinModal mode={mode} onClose={() => setMode(null)} onSubmit={save} onForgot={() => setMode("reset")} />
      )}
    </>
  );
}
