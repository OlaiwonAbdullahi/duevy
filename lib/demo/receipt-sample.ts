import type { jsPDF as JsPdf } from "jspdf";
import { RECEIPT_DEFAULTS, type ReceiptDesign } from "@/lib/api/receipt-design";

/**
 * Demo mode's stand-in for the backend's sample receipt PDF: the same layout
 * as lib/receipt.ts in the API (header, ticket card, stamp, details, note,
 * signatures), drawn with jsPDF from the demo store's design so the download
 * reflects what the rep set. jsPDF's built-in fonts have no ₦, so amounts
 * read "NGN".
 */

const W = 420;
const MIN_H = 595;
const CARD_X = 18;
const CARD_W = W - CARD_X * 2;
const PAD = CARD_X + 18;
const CONTENT_W = W - PAD * 2;
const INK = "#1b2520";
const MUTED = "#7a847f";
const FAINT = "#a3aca7";
const LINE = "#e8ece9";
const PAPER = "#f7f6f2";

function darken(hex: string, by: number) {
  const n = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0].map((s) => Math.round(((n >> s) & 255) * (1 - by)).toString(16).padStart(2, "0")).join("")}`;
}

/** The payment a demo receipt shows. Defaults to the sample the receipt design page uses. */
export type DemoPayment = {
  number: string;
  reference: string;
  payer: string;
  item: string;
  face: number;
  fee: number;
  answers: [string, string][];
};

const SAMPLE: DemoPayment = {
  number: "R-SAMPLE",
  reference: "DVY-SAMPLE-0001",
  payer: "Tolu Adeyemi",
  item: "Departmental due",
  face: 500_000,
  fee: 12_000,
  answers: [["Phone number", "08031420517"]],
};

const ngn = (kobo: number) => `NGN ${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type TextOpts = { size: number; bold?: boolean; color: string; align?: "left" | "center" | "right" };

function tools(doc: JsPdf) {
  return {
    text(s: string, x: number, y: number, o: TextOpts) {
      doc.setFont("helvetica", o.bold ? "bold" : "normal").setFontSize(o.size).setTextColor(o.color);
      doc.text(s, x, y, { align: o.align ?? "left", baseline: "top" });
    },
    /** Fit an image inside w×h at (x, y), centred or left-aligned. Missing or unreadable images are skipped. */
    image(src: string, x: number, y: number, w: number, h: number, align: "left" | "center" = "center") {
      try {
        const p = doc.getImageProperties(src);
        const scale = Math.min(w / p.width, h / p.height, 1);
        const iw = p.width * scale;
        const ih = p.height * scale;
        doc.addImage(src, x + (align === "center" ? (w - iw) / 2 : 0), y + (h - ih) / 2, iw, ih);
      } catch {
        // Skip it.
      }
    },
  };
}

/** Everything on the ticket card; returns where the card ends. */
function drawCard(doc: JsPdf, design: ReceiptDesign, spaceName: string, pay: DemoPayment, top: number): number {
  const { text, image } = tools(doc);
  const accent = design.accent ?? RECEIPT_DEFAULTS.accent;
  const signatures = design.signatures.filter((s) => s.image || s.name || s.role);
  let y = top + 20;

  text("PAID TO", PAD, y, { size: 7, bold: true, color: FAINT });
  text("PAID BY", PAD + CONTENT_W / 2 + 8, y, { size: 7, bold: true, color: FAINT });
  text(spaceName, PAD, y + 12, { size: 10, bold: true, color: INK });
  text(pay.payer, PAD + CONTENT_W / 2 + 8, y + 12, { size: 10, bold: true, color: INK });
  y += 42;

  doc.setFillColor(PAPER).roundedRect(PAD, y, CONTENT_W, 24, 8, 8, "F");
  text("DUE PAID", PAD + 12, y + 8.5, { size: 7, bold: true, color: MUTED });
  text("AMOUNT", PAD + CONTENT_W - 12, y + 8.5, { size: 7, bold: true, color: MUTED, align: "right" });
  y += 32;
  text(pay.item, PAD + 12, y, { size: 9.5, color: INK });
  text(ngn(pay.face), PAD + CONTENT_W - 12, y, { size: 9.5, bold: true, color: INK, align: "right" });
  y += 22;

  doc.setDrawColor(LINE).setLineWidth(0.8).line(PAD, y, PAD + CONTENT_W, y);
  y += 12;
  const totalsTop = y;
  const tx = PAD + CONTENT_W * 0.4;
  const tw = CONTENT_W - (tx - PAD);
  text("Due amount", tx, y, { size: 9.5, color: MUTED });
  text(ngn(pay.face), tx + tw - 12, y, { size: 9.5, bold: true, color: INK, align: "right" });
  y += 17;
  text("Service charge", tx, y, { size: 9.5, color: MUTED });
  text(ngn(pay.fee), tx + tw - 12, y, { size: 9.5, bold: true, color: INK, align: "right" });
  y += 20;
  doc.setFillColor(accent).roundedRect(tx - 12, y, tw + 12, 32, 10, 10, "F");
  text("Total paid", tx, y + 11, { size: 10, bold: true, color: "#cfe6dc" });
  text(ngn(pay.face + pay.fee), tx + tw - 12, y + 10, { size: 12, bold: true, color: "#ffffff", align: "right" });
  y += 32;

  if (design.showStamp) drawStamp(doc, design, PAD + CONTENT_W * 0.18, (totalsTop + y) / 2, design.stampColor ?? accent);
  y += 22;

  doc.setDrawColor("#d9ddd9").setLineWidth(1).setLineDashPattern([3, 3.5], 0).line(CARD_X + 16, y, CARD_X + CARD_W - 16, y);
  doc.setLineDashPattern([], 0);
  y += 20;

  const rows = (title: string, items: [string, string][]) => {
    text(title, PAD, y, { size: 7, bold: true, color: FAINT });
    y += 14;
    for (const [k, v] of items) {
      text(k, PAD, y, { size: 9, color: MUTED });
      text(v, PAD + CONTENT_W, y, { size: 9, bold: true, color: INK, align: "right" });
      y += 16;
    }
  };
  rows("DETAILS", [
    ["Receipt no.", pay.number],
    ["Reference", pay.reference],
    ["Method", "Bank transfer"],
  ]);
  if (design.showAnswers && pay.answers.length) {
    y += 8;
    rows("YOUR DETAILS", pay.answers);
  }

  if (design.note) {
    y += 8;
    text("NOTE", PAD, y, { size: 7, bold: true, color: FAINT });
    y += 14;
    doc.setFont("helvetica", "normal").setFontSize(9);
    const lines = doc.splitTextToSize(design.note, CONTENT_W - 24) as string[];
    const h = lines.length * 11;
    doc.setFillColor(PAPER).roundedRect(PAD, y, CONTENT_W, h + 18, 8, 8, "F");
    lines.forEach((l, i) => text(l, PAD + 12, y + 9 + i * 11, { size: 9, color: INK }));
    y += h + 22;
  }

  // Signatures side by side, right-aligned, lines level.
  if (signatures.length) {
    const gap = 14;
    const bw = Math.min(150, (CONTENT_W - gap * (signatures.length - 1)) / signatures.length);
    const lineY = y + 14 + 46;
    signatures.forEach((s, i) => {
      const x = PAD + CONTENT_W - (signatures.length - i) * bw - (signatures.length - 1 - i) * gap;
      if (s.image) image(s.image, x, lineY - 46, bw, 44);
      doc.setDrawColor(FAINT).setLineWidth(0.8).line(x, lineY, x + bw, lineY);
      if (s.name) text(s.name, x + bw / 2, lineY + 5, { size: 9, bold: true, color: INK, align: "center" });
      if (s.role) text(s.role, x + bw / 2, lineY + 17, { size: 8, color: MUTED, align: "center" });
    });
    y = lineY + 30;
  }
  return y + 12;
}

function drawStamp(doc: JsPdf, design: ReceiptDesign, cx: number, cy: number, color: string) {
  const { text, image } = tools(doc);
  if (design.stampImage) {
    image(design.stampImage, cx - 38, cy - 33, 76, 66);
    return;
  }
  const word = (design.stampText || RECEIPT_DEFAULTS.stampText).toUpperCase();
  const long = word.length > 5;
  doc.setDrawColor(color);
  if (design.stampStyle === "rect") {
    doc.setLineWidth(1.8).roundedRect(cx - 40, cy - 18, 80, 36, 4, 4, "S");
    doc.setLineWidth(0.6).roundedRect(cx - 36.5, cy - 14.5, 73, 29, 2.5, 2.5, "S");
    text(word, cx, cy - (long ? 8 : 10), { size: long ? 9.5 : 13, bold: true, color, align: "center" });
    text("DUEVY", cx, cy + 5, { size: 5.5, bold: true, color, align: "center" });
  } else if (design.stampStyle === "ribbon") {
    // A banner with notched ends.
    doc.setFillColor(color);
    doc.lines([[92, 0], [-8, 12], [8, 12], [-92, 0], [8, -12]], cx - 46, cy - 12, [1, 1], "F", true);
    text(word, cx, cy - (long ? 4.5 : 6), { size: long ? 8.5 : 11, bold: true, color: "#ffffff", align: "center" });
  } else {
    doc.setLineWidth(1.6).circle(cx, cy, 30, "S");
    doc.setLineWidth(0.6).circle(cx, cy, 25.5, "S");
    text(word, cx, cy - (long ? 6 : 9), { size: long ? 8.5 : 13, bold: true, color, align: "center" });
    text("DUEVY", cx, cy + 6, { size: 5.5, bold: true, color, align: "center" });
  }
}

export async function renderDemoReceipt(design: ReceiptDesign, spaceName: string, pay: DemoPayment = SAMPLE): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const shift = design.logo ? 26 : 0;
  const top = 150 + shift;

  // Lay the card out on a scratch page first, so the page fits it exactly.
  const cardBottom = drawCard(new jsPDF({ unit: "pt", format: [W, 3000] }), design, spaceName, pay, top);
  const H = Math.max(MIN_H, Math.ceil(cardBottom + 78));
  const doc = new jsPDF({ unit: "pt", format: [W, H] });
  const { text, image } = tools(doc);
  const accent = design.accent ?? RECEIPT_DEFAULTS.accent;

  doc.setFillColor("#f4f2ec").rect(0, 0, W, H, "F");
  doc.setFillColor(design.accent ? darken(accent, 0.2) : "#08583f").rect(0, 0, W, 190 + shift, "F");
  if (design.logo) image(design.logo, CARD_X + 6, 16, 200, 44, "left");
  else text("Duevy", CARD_X + 6, 22, { size: 18, bold: true, color: "#ffffff" });
  text((design.title || RECEIPT_DEFAULTS.title).toUpperCase(), W - CARD_X - 6, 24, { size: 7, bold: true, color: "#cfe6dc", align: "right" });
  text(pay.number, W - CARD_X - 6, 35, { size: 9.5, bold: true, color: "#ffffff", align: "right" });
  text("Total paid", W / 2, 62 + shift, { size: 9, color: "#cfe6dc", align: "center" });
  text(ngn(pay.face + pay.fee), W / 2, 74 + shift, { size: 28, bold: true, color: "#ffffff", align: "center" });
  text(`Paid · ${new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}`, W / 2, 117 + shift, {
    size: 8,
    color: "#cfe6dc",
    align: "center",
  });

  doc.setFillColor("#ffffff").roundedRect(CARD_X, top, CARD_W, cardBottom - top, 16, 16, "F");
  drawCard(doc, design, spaceName, pay, top);

  const footerY = cardBottom + 20;
  text(design.thankYou || RECEIPT_DEFAULTS.thankYou, W / 2, footerY + 3, { size: 9, bold: true, color: INK, align: "center" });
  text(`${design.logo ? "Powered by Duevy · " : ""}duevy.app · support@duevy.app`, W / 2, footerY + 26, {
    size: 7,
    color: FAINT,
    align: "center",
  });

  return doc.output("blob");
}
