import { apiClient } from "@/lib/api/client";
import { dueReceiptPath } from "@/lib/api/dues";
import type { Due, Space } from "./types";

/**
 * A settled payment, issued per due so every line a student pays gets its own
 * standalone, downloadable proof — even when several were cleared in one go.
 * The PDF itself is generated server-side (`GET /dues/{dueId}/receipt`); this
 * is just the display/download metadata for the receipt list UI.
 */
export type Receipt = {
  dueId: string;
  reference: string;
  dueTitle: string;
  category: Due["category"];
  amount: number;
  spaceName: string;
  spaceKind: Space["kind"];
  methodDetail: string;
  payerName: string;
  payerDetail: string;
  paidAt: string; // ISO
};

/**
 * Mint one receipt entry per paid due, sharing the payment's timestamp.
 * `refs` is the real backend reference per due, in the same order as `dues`
 * (from each due's own `payDue()` response).
 */
export function buildReceipts(
  dues: Due[],
  space: Space,
  payer: { name: string; detail: string },
  refs: string[],
): Receipt[] {
  const paidAt = new Date().toISOString();

  return dues.map((due, i) => ({
    dueId: due.id,
    reference: refs[i] ?? "",
    dueTitle: due.title,
    category: due.category,
    amount: due.amount,
    spaceName: space.name,
    spaceKind: space.kind,
    methodDetail: "Bachs",
    payerName: payer.name,
    payerDetail: payer.detail,
    paidAt,
  }));
}

/** Trigger a browser download of a single receipt as a .pdf file. */
export async function downloadReceipt(r: Receipt) {
  const blob = await apiClient.getBlob(dueReceiptPath(r.dueId));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Duevy-receipt-${r.reference || r.dueId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download every receipt. Browsers throttle rapid successive downloads, so we
 * stagger them; the small delay is invisible in practice.
 */
export async function downloadAllReceipts(receipts: Receipt[]) {
  for (let i = 0; i < receipts.length; i++) {
    await downloadReceipt(receipts[i]);
    if (i < receipts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}
