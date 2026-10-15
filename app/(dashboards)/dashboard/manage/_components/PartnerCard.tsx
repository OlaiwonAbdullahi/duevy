"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { DiscountTag01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Skeleton } from "../../_components/Skeleton";
import { PartnerLogo } from "../../_components/PartnerLogo";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { queryKeys, useSpacePartner } from "@/lib/api/queries";
import {
  PARTNER_ERRORS,
  applySpacePartnerCode,
  describePartnerPerk,
  normalizePartnerCode,
} from "@/lib/api/partners";
import { usePartnerLookup } from "@/lib/api/use-partner-lookup";
import { ApiError } from "@/lib/api/errors";
import type { PartnerRedemptionSource, SpacePartner } from "@/lib/api/types";
import { formatDate } from "../../referrals/_components/data";

const SOURCE_LABEL: Record<PartnerRedemptionSource, string> = {
  signup: "Applied at signup",
  settings: "Applied from Manage",
  admin: "Applied by Duevy",
};

/**
 * The space's partner perk (SUG, NACOS…): a discount on withdrawal fees.
 * Shows the active partner, or lets the lead rep apply a code. One partner
 * per space — once applied it can only be removed by Duevy.
 */
export function PartnerCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const isLead = repSpace?.membership !== "co";
  const { data: partner, isPending } = useSpacePartner(spaceId);

  return (
    <SettingsCard
      icon={DiscountTag01Icon}
      title="Partner perks"
      description="A partner code from your SUG, NACOS or another partner cuts your withdrawal fees."
    >
      {!spaceId || isPending ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : partner ? (
        <ActivePartner partner={partner} />
      ) : isLead ? (
        <ApplyPartnerForm spaceId={spaceId} />
      ) : (
        <p className="rounded-2xl border border-cloud bg-paper/50 px-4 py-3 text-[13px] text-ink-soft">
          No partner applied — ask your lead rep if your department has a partner code.
        </p>
      )}
    </SettingsCard>
  );
}

function ActivePartner({ partner: sp }: { partner: SpacePartner }) {
  const { partner } = sp;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-cloud bg-paper/50 p-4">
      <PartnerLogo logoUrl={partner.logoUrl} short={partner.short} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{partner.short}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              sp.active ? "bg-cloud text-brand" : "bg-paper text-ink-soft",
            )}
          >
            {sp.active ? `${sp.discountPercent}% off withdrawal fees` : "Ended"}
          </span>
        </div>
        <p className="truncate text-xs text-ink-soft">{partner.name}</p>
        <p className="mt-2 text-xs text-ink-soft">
          {sp.endsAt ? `${sp.active ? "Ends" : "Ended"} ${formatDate(sp.endsAt)}` : "No end date"}
          {" · "}
          {SOURCE_LABEL[sp.source] ?? "Applied"}
        </p>
      </div>
    </div>
  );
}

function ApplyPartnerForm({ spaceId }: { spaceId: string }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const lookup = usePartnerLookup(code);

  const apply = useMutation({
    mutationFn: () => applySpacePartnerCode(spaceId, code),
    onSuccess: (applied) => {
      queryClient.setQueryData(queryKeys.spacePartner(spaceId), applied);
      // Fee tiers on the payout summary are discounted now.
      void queryClient.invalidateQueries({ queryKey: queryKeys.payoutSummary(spaceId) });
      toast.success(`${applied.partner.short} partner applied`, {
        description: describePartnerPerk(applied.discountPercent, applied.partner.durationDays),
      });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? // The server's 409 copy says whether a partner is applied or was revoked.
            err.code === "PARTNER_ALREADY_APPLIED"
            ? err.message
            : (PARTNER_ERRORS[err.code] ?? err.message)
          : "Couldn't apply that code. Try again.";
      if (err instanceof ApiError && err.code === "PARTNER_ALREADY_APPLIED") {
        // Someone else got there first — show what's actually applied.
        void queryClient.invalidateQueries({ queryKey: queryKeys.spacePartner(spaceId) });
      }
      setServerError(message);
      toast.error(message);
    },
  });

  const error = serverError ?? (lookup.status === "error" ? lookup.error : null);
  const canApply = lookup.status === "found" && !apply.isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canApply) apply.mutate();
      }}
    >
      <label htmlFor="partner-code" className="block text-xs font-medium text-ink-soft">
        Partner code
      </label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="partner-code"
          value={code}
          onChange={(e) => {
            setCode(normalizePartnerCode(e.target.value));
            setServerError(null);
          }}
          placeholder="e.g. NACOS"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          aria-invalid={!!error}
          className={cn(BRAND_INPUT, "flex-1 font-mono uppercase tracking-wide")}
        />
        <Button type="submit" variant="brand" size="pill-lg" disabled={!canApply}>
          {apply.isPending ? "Applying…" : "Apply"}
        </Button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : lookup.status === "found" ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand">
          <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
          {lookup.preview.short} ·{" "}
          {describePartnerPerk(
            lookup.preview.withdrawalFeeDiscountPercent,
            lookup.preview.durationDays,
          )}
        </p>
      ) : lookup.status === "loading" ? (
        <p className="mt-1.5 text-xs text-ink-soft">Checking code…</p>
      ) : (
        <p className="mt-1.5 text-xs text-ink-soft">
          A department can have one partner. Once applied, it can&apos;t be swapped.
        </p>
      )}
    </form>
  );
}
