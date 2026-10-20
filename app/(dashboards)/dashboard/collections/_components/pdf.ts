import type { CollectionStudent, PaymentStatus, StatusFilter } from "./types";

// Brand tokens from globals.css (the PDF can't read CSS variables).
const BRAND = "#0b6e4f";
const BRAND_DEEP = "#08583f";
const INK = "#1b2520";
const INK_SOFT = "#7a847f";
const CLOUD = "#e6f2ec";
const CANVAS = "#fbfaf7";

const LOGO_SRC = "/logos/duevy-logo-white.png";
const LOGO_RATIO = 1488 / 428;
const DOODLE_SRC = "/doodle-card.jpg";
const DOODLE_RATIO = 1200 / 640;

export type CollectionExportScope = Exclude<StatusFilter, "all"> | "all";

const SCOPE_LABEL: Record<CollectionExportScope, string> = {
  all: "All students",
  paid: "Paid",
  unpaid: "Yet to pay",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  unpaid: "Yet to pay",
};

/** Helvetica has no ₦ glyph, so amounts are written as NGN. */
const ngn = (n: number) => `NGN ${Math.round(n).toLocaleString("en-NG")}`;

const formatDate = (iso: string | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

async function loadImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Branded Duevy PDF of a due's roster, filtered to `scope`. */
export async function downloadCollectionPdf({
  filename,
  dueTitle,
  spaceName,
  amount,
  dueDate,
  scope,
  rows,
}: {
  filename: string;
  dueTitle: string;
  spaceName?: string;
  /** Per-student amount in naira. */
  amount: number;
  dueDate: string;
  scope: CollectionExportScope;
  rows: CollectionStudent[];
}) {
  const [{ jsPDF }, { default: autoTable }, logo, doodle] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadImage(LOGO_SRC),
    loadImage(DOODLE_SRC),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const generatedAt = new Date().toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // ---- Header band ---------------------------------------------------------
  const bandHeight = 96;
  doc.setFillColor(BRAND);
  doc.rect(0, 0, pageWidth, bandHeight, "F");
  if (doodle) {
    // Cover-fit the doodle across the band, cropped to its vertical centre.
    const doodleHeight = pageWidth / DOODLE_RATIO;
    doc.saveGraphicsState();
    doc.rect(0, 0, pageWidth, bandHeight, null);
    doc.clip();
    doc.discardPath();
    doc.addImage(doodle, "JPEG", 0, (bandHeight - doodleHeight) / 2, pageWidth, doodleHeight);
    doc.restoreGraphicsState();
  }

  if (logo) {
    const logoHeight = 30;
    doc.addImage(logo, "PNG", margin, 33, logoHeight * LOGO_RATIO, logoHeight);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor("#ffffff");
    doc.text("duevy", margin, 56);
  }

  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Collection report", pageWidth - margin, 44, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated ${generatedAt}`, pageWidth - margin, 60, { align: "right" });

  // ---- Title ---------------------------------------------------------------
  let y = bandHeight + 40;
  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(doc.splitTextToSize(dueTitle, pageWidth - margin * 2 - 110), margin, y);

  // Scope pill, top-right of the title.
  const pill = SCOPE_LABEL[scope];
  doc.setFontSize(9);
  const pillWidth = doc.getTextWidth(pill) + 20;
  doc.setFillColor(scope === "unpaid" ? "#fdf1de" : CLOUD);
  doc.roundedRect(pageWidth - margin - pillWidth, y - 14, pillWidth, 20, 10, 10, "F");
  doc.setTextColor(scope === "unpaid" ? "#a5660d" : BRAND_DEEP);
  doc.text(pill, pageWidth - margin - pillWidth / 2, y - 1, { align: "center" });

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(INK_SOFT);
  const subtitle = [spaceName, `${ngn(amount)} per student`, `Due ${formatDate(dueDate)}`]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(subtitle, margin, y);

  // ---- Summary cards -------------------------------------------------------
  y += 22;
  const paidCount = rows.filter((r) => r.status === "paid").length;
  const unpaidCount = rows.length - paidCount;
  const stats: [string, string][] =
    scope === "paid"
      ? [
          ["Students paid", String(paidCount)],
          ["Amount collected", ngn(paidCount * amount)],
        ]
      : scope === "unpaid"
        ? [
            ["Students yet to pay", String(unpaidCount)],
            ["Outstanding", ngn(unpaidCount * amount)],
          ]
        : [
            ["Students", String(rows.length)],
            ["Paid", String(paidCount)],
            ["Yet to pay", String(unpaidCount)],
            ["Collected", ngn(paidCount * amount)],
          ];
  const gap = 10;
  const cardWidth = (pageWidth - margin * 2 - gap * (stats.length - 1)) / stats.length;
  const cardHeight = 56;
  stats.forEach(([label, value], i) => {
    const x = margin + i * (cardWidth + gap);
    doc.setFillColor(CANVAS);
    doc.setDrawColor(CLOUD);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(INK_SOFT);
    doc.text(label.toUpperCase(), x + 12, y + 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(INK);
    doc.text(value, x + 12, y + 41);
  });
  y += cardHeight + 22;

  // ---- Roster table --------------------------------------------------------
  const showPayment = scope !== "unpaid";
  const head = [
    "#",
    "Name",
    "Matric no.",
    "Email",
    ...(scope === "all" ? ["Status"] : []),
    ...(showPayment ? ["Paid on", "Reference"] : []),
  ];
  const body = rows.map((s, i) => [
    String(i + 1),
    s.name,
    s.matricNo || "—",
    s.email,
    ...(scope === "all" ? [STATUS_LABEL[s.status]] : []),
    ...(showPayment
      ? [s.status === "paid" ? formatDate(s.paidOn) : "—", s.reference ?? "—"]
      : []),
  ]);
  const statusCol = scope === "all" ? 4 : -1;

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: margin, right: margin, top: 40, bottom: 50 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: INK,
      cellPadding: { top: 7, bottom: 7, left: 6, right: 6 },
      lineColor: CLOUD,
      lineWidth: { bottom: 0.6 },
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND,
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 8,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: CANVAS },
    columnStyles: {
      0: { cellWidth: 22, textColor: INK_SOFT },
      1: { fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === statusCol) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = data.cell.raw === "Paid" ? BRAND : "#a5660d";
      }
    },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      doc.setDrawColor(CLOUD);
      doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(INK_SOFT);
      doc.text("Generated with Duevy · duevy.app", margin, pageHeight - 20);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20, { align: "right" });
    },
  });

  doc.save(filename);
}
