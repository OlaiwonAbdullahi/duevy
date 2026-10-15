"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DiscountTag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../../dashboard/_components/EmptyState";
import { ConfirmDialog } from "../../../dashboard/_components/ConfirmDialog";
import { AdminModal, ModalField } from "../../_components/AdminModal";
import { DataTable } from "../../_components/DataTable";
import StatusBadge from "../../_components/StatusBadge";
import { ApiError } from "@/lib/api/errors";
import {
  listPartnerRedemptions,
  revokePartnerRedemption,
  type AdminPartner,
  type AdminPartnerRedemption,
} from "@/lib/api/admin";
import { SOURCE_LABEL, formatDate, formatDuration, redemptionStatus } from "./data";

/** A partner's terms plus every space that redeemed it, with revoke. */
export function PartnerDetailModal({
  partner,
  onClose,
  onEdit,
  onRevoked,
}: {
  partner: AdminPartner;
  onClose: () => void;
  onEdit: () => void;
  /** A redemption was revoked — the partner's use count dropped by one. */
  onRevoked: () => void;
}) {
  const [redemptions, setRedemptions] = useState<AdminPartnerRedemption[] | null>(null);
  const [revoking, setRevoking] = useState<AdminPartnerRedemption | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPartnerRedemptions(partner.id)
      .then((list) => {
        if (!cancelled) setRedemptions(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setRedemptions([]);
        toast.error(err instanceof ApiError ? err.message : "Couldn't load redemptions.");
      });
    return () => {
      cancelled = true;
    };
  }, [partner.id]);

  async function confirmRevoke() {
    if (!revoking) return;
    const target = revoking;
    setRevoking(null);
    setBusy(true);
    try {
      const updated = await revokePartnerRedemption(target.id);
      setRedemptions((list) => list?.map((r) => (r.id === updated.id ? updated : r)) ?? null);
      onRevoked();
      toast.success(`Discount revoked for ${target.space.name}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't revoke this discount.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminModal
        wide
        icon={DiscountTag01Icon}
        title={`${partner.short} · ${partner.name}`}
        description={`Code ${partner.code}`}
        onClose={onClose}
        footer={
          <Button variant="brand-outline" size="pill" onClick={onEdit}>
            Edit partner
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <ModalField label="Fee discount">{partner.withdrawalFeeDiscountPercent}%</ModalField>
          <ModalField label="Duration">{formatDuration(partner.durationDays)}</ModalField>
          <ModalField label="Uses">
            {partner.redemptionCount} / {partner.maxRedemptions ?? "∞"}
          </ModalField>
        </div>

        <p className="mb-2 mt-5 text-[11px] font-semibold text-ink-soft">Redemptions</p>
        {redemptions === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : redemptions.length === 0 ? (
          <EmptyState
            size="sm"
            className="rounded-2xl border border-dashed border-cloud"
            icon={DiscountTag01Icon}
            title="No redemptions yet"
            description="Spaces that apply this code show up here."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Space" },
              { label: "Rep" },
              { label: "Source" },
              { label: "Ends" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {redemptions.map((r) => {
              const status = redemptionStatus(r);
              return (
                <tr key={r.id}>
                  <td className="p-4">
                    <p className="font-semibold text-ink">{r.space.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {r.discountPercent}% off · {formatDate(r.createdAt)}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{r.redeemedBy.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{r.redeemedBy.email}</p>
                  </td>
                  <td className="p-4">{SOURCE_LABEL[r.source] ?? r.source}</td>
                  <td className="whitespace-nowrap p-4">
                    {r.endsAt ? formatDate(r.endsAt) : "No end date"}
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                  <td className="p-4 text-right">
                    {status.label === "Active" && (
                      <Button
                        variant="danger-outline"
                        size="pill"
                        disabled={busy}
                        onClick={() => setRevoking(r)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </AdminModal>

      <ConfirmDialog
        open={!!revoking}
        title="Revoke this discount?"
        description={
          revoking
            ? `${revoking.space.name} goes back to full withdrawal fees from its next withdrawal. This can't be undone.`
            : ""
        }
        confirmLabel="Revoke"
        onConfirm={() => void confirmRevoke()}
        onClose={() => setRevoking(null)}
      />
    </>
  );
}
