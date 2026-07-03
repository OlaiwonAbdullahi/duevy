import type { Card } from "../../wallet/_components/types";
import type { Due, PayMethod, Space } from "./types";
import { PAYER, CATEGORY_LABEL, SPACE_KIND_LABEL } from "./data";

/**
 * A settled payment, issued per due so every line a student pays gets its own
 * standalone, downloadable proof — even when several were cleared in one go.
 */
export type Receipt = {
  reference: string; // DUEVY-XXXXXX — unique per due
  dueTitle: string;
  category: Due["category"];
  amount: number;
  spaceName: string;
  spaceKind: Space["kind"];
  method: PayMethod;
  methodDetail: string; // "Visa •••• 4242", "Duevy wallet", "Bank transfer"
  payerName: string;
  payerDetail: string;
  paidAt: string; // ISO
};

const METHOD_LABEL: Record<PayMethod, string> = {
  wallet: "Duevy wallet",
  card: "Card",
  online: "Bank transfer / USSD",
};

/** Short, human-legible reference. Collision odds are irrelevant for a demo. */
function makeReference() {
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DUEVY-${stamp}${rand}`;
}

/** Mint one receipt per paid due, sharing the payment's method and timestamp. */
export function buildReceipts(
  dues: Due[],
  space: Space,
  method: PayMethod,
  card?: Card,
): Receipt[] {
  const paidAt = new Date().toISOString();
  const methodDetail =
    method === "card" && card
      ? `${card.brand} •••• ${card.last4}`
      : METHOD_LABEL[method];

  return dues.map((due) => ({
    reference: makeReference(),
    dueTitle: due.title,
    category: due.category,
    amount: due.amount,
    spaceName: space.name,
    spaceKind: space.kind,
    method,
    methodDetail,
    payerName: PAYER.name,
    payerDetail: PAYER.detail,
    paidAt,
  }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Safe, descriptive file stem, e.g. "Duevy-receipt-DUEVY-4F2AB9K". */
function fileStem(r: Receipt) {
  return `Duevy-receipt-${r.reference}`;
}

/**
 * jsPDF's built-in Helvetica is Latin-1 only, so the ₦ glyph (U+20A6) can't be
 * embedded without a custom font. We render the currency as "NGN" in the PDF.
 */
const nairaPdf = (n: number) =>
  `NGN ${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/** Swap glyphs Helvetica's Latin-1 set can't draw for safe equivalents. */
const pdfSafe = (s: string) => s.replace(/•/g, "*").replace(/₦/g, "NGN ");

/** Guild palette, as jsPDF RGB tuples. */
const C = {
  green: [11, 110, 79],
  greenDeep: [8, 88, 63],
  ink: [27, 37, 32],
  inkSoft: [122, 132, 127],
  canvas: [251, 250, 247],
  cloud: [230, 242, 236],
  hairline: [223, 233, 227],
  gold: [232, 163, 61],
  white: [255, 255, 255],
} as const;

/**
 * Build the receipt as a jsPDF document — a ticket-style sheet with a branded
 * green header, a perforated seam and a flat, hairline-bordered detail card,
 * echoing the Guild design system (Manrope-style sans, forest green, gold check).
 */
async function renderPdf(r: Receipt) {
  // Load jsPDF only in the browser, on demand — keeps it out of the initial bundle.
  const { jsPDF, GState } = await import("jspdf");

  const W = 468;
  const H = 680;
  const M = 28; // page margin
  const cardX = M;
  const cardW = W - M * 2;
  const innerX = cardX + 28;
  const innerR = cardX + cardW - 28;

  const doc = new jsPDF({ unit: "pt", format: [W, H] });
  const fill = (c: readonly number[]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: readonly number[]) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);
  const fade = (o: number) => doc.setGState(new GState({ opacity: o }));

  // Warm page background.
  fill(C.canvas);
  doc.rect(0, 0, W, H, "F");

  /* ---- Header card ---- */
  const headY = M;
  const headH = 178;
  fill(C.green);
  doc.roundedRect(cardX, headY, cardW, headH, 22, 22, "F");

  // Brand emblem + wordmark.
  fill(C.white);
  doc.roundedRect(innerX, headY + 26, 28, 28, 9, 9, "F");
  text(C.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("D", innerX + 14, headY + 45, { align: "center" });

  text(C.white);
  doc.setFontSize(17);
  doc.text("Duevy", innerX + 40, headY + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  fade(0.75);
  doc.text("Payment receipt", innerX + 40, headY + 55);
  fade(1);

  // Paid badge, top-right.
  const badgeText = "PAID";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const bw = doc.getTextWidth(badgeText);
  const dotX = innerR - bw - 18;
  fill(C.gold);
  doc.circle(dotX, headY + 36, 7, "F");
  stroke(C.white);
  doc.setLineWidth(1.4);
  doc.line(dotX - 3, headY + 36, dotX - 0.8, headY + 39);
  doc.line(dotX - 0.8, headY + 39, dotX + 3.4, headY + 33);
  text(C.white);
  doc.text(badgeText, innerR, headY + 40, { align: "right" });

  // Amount block.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  fade(0.75);
  doc.setCharSpace(1.2);
  doc.text("AMOUNT PAID", innerX, headY + 116);
  doc.setCharSpace(0);
  fade(1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(nairaPdf(r.amount), innerX, headY + 150);

  /* ---- Perforated seam ---- */
  const seamY = headY + headH + 8;
  fill(C.canvas);
  doc.circle(cardX, seamY, 11, "F");
  doc.circle(cardX + cardW, seamY, 11, "F");
  stroke(C.hairline);
  doc.setLineWidth(1);
  doc.setLineDashPattern([1.5, 3], 0);
  doc.line(cardX + 16, seamY, cardX + cardW - 16, seamY);
  doc.setLineDashPattern([], 0);

  /* ---- Detail card ---- */
  const bodyY = seamY + 8;
  const bodyH = H - M - bodyY;
  stroke(C.hairline);
  doc.setLineWidth(1);
  doc.roundedRect(cardX, bodyY, cardW, bodyH, 22, 22, "S");

  // Section label.
  text(C.inkSoft);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setCharSpace(1.2);
  doc.text("PAYMENT DETAILS", innerX, bodyY + 36);
  doc.setCharSpace(0);

  const rows: [string, string][] = [
    ["Reference", r.reference],
    ["Paid by", `${r.payerName}  ·  ${r.payerDetail}`],
    ["Space", `${r.spaceName}  ·  ${SPACE_KIND_LABEL[r.spaceKind]}`],
    ["Due", `${r.dueTitle}  ·  ${CATEGORY_LABEL[r.category]}`],
    ["Method", r.methodDetail],
    ["Date", formatDate(r.paidAt)],
  ];

  const valueWidth = innerR - (innerX + 92);
  let y = bodyY + 66;

  rows.forEach(([k, v], i) => {
    if (i > 0) {
      stroke(C.hairline);
      doc.setLineWidth(0.75);
      doc.line(innerX, y - 20, innerR, y - 20);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    text(C.inkSoft);
    doc.text(k, innerX, y);

    doc.setFont("helvetica", "bold");
    text(C.ink);
    const lines = doc.splitTextToSize(pdfSafe(v), valueWidth) as string[];
    doc.text(lines, innerR, y, { align: "right" });
    y += 30 + (lines.length - 1) * 14;
  });

  // Status strip — a soft cloud band with a gold check.
  const stripY = bodyY + bodyH - 96;
  fill(C.cloud);
  doc.roundedRect(innerX, stripY, innerR - innerX, 44, 14, 14, "F");
  const cx = innerX + 26;
  const cy = stripY + 22;
  fill(C.gold);
  doc.circle(cx, cy, 9, "F");
  stroke(C.white);
  doc.setLineWidth(1.6);
  doc.line(cx - 4, cy, cx - 1, cy + 3.4);
  doc.line(cx - 1, cy + 3.4, cx + 4.4, cy - 3.4);
  text(C.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment successful", cx + 20, cy - 1);
  text(C.inkSoft);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Settled in full via Duevy", cx + 20, cy + 11);

  // Footer fine print.
  text(C.inkSoft);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    "This receipt confirms a completed payment through Duevy.",
    W / 2,
    bodyY + bodyH - 34,
    { align: "center" },
  );
  doc.text(
    `Keep it for your records  ·  Ref ${r.reference}`,
    W / 2,
    bodyY + bodyH - 22,
    { align: "center" },
  );

  return doc;
}

/** Trigger a browser download of a single receipt as a .pdf file. */
export async function downloadReceipt(r: Receipt) {
  const doc = await renderPdf(r);
  doc.save(`${fileStem(r)}.pdf`);
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
