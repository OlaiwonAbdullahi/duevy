import { apiClient } from "./client";

/**
 * A space's receipt design: how the receipts its payers get look. Any rep can
 * read it; only the lead rep can change it. Null text means "use the default
 * wording" (see `RECEIPT_DEFAULTS`).
 */
export type ReceiptHeaderStyle = "artwork" | "solid";

/** One signatory, printed side by side with the others (up to `MAX_SIGNATURES`). */
export type ReceiptSignature = {
  id: string;
  name: string | null;
  role: string | null;
  /** Data URL. Changed through `uploadSignatureImage` / `removeSignatureImage`. */
  image: string | null;
};

export const MAX_SIGNATURES = 3;

/** Drawn stamp shapes. An uploaded stamp image replaces whichever is chosen. */
export type StampStyle = "round" | "rect" | "ribbon";

export type ReceiptDesign = {
  /** `#rrggbb`; null = Duevy green. */
  accent: string | null;
  headerStyle: ReceiptHeaderStyle;
  title: string | null;
  showStamp: boolean;
  stampText: string | null;
  stampStyle: StampStyle;
  /** `#rrggbb`; null = the receipt colour. */
  stampColor: string | null;
  /** Data URL of the space's own stamp. Changed through `uploadReceiptStamp` / `removeReceiptStamp`. */
  stampImage: string | null;
  thankYou: string | null;
  note: string | null;
  /** Print a guest's answers to the due's questions. */
  showAnswers: boolean;
  /** Data URL. Changed through `uploadReceiptLogo` / `removeReceiptLogo`. */
  logo: string | null;
  /** In print order. */
  signatures: ReceiptSignature[];
  updatedAt: string | null;
};

/** What `saveReceiptDesign` takes: the settings, plus each signature's text in print order. */
export type ReceiptDesignSettings = Omit<ReceiptDesign, "logo" | "stampImage" | "signatures" | "updatedAt"> & {
  signatures: Omit<ReceiptSignature, "image">[];
};

export const RECEIPT_DEFAULTS = {
  accent: "#0b6e4f",
  title: "Payment receipt",
  stampText: "PAID",
  thankYou: "Thank you for your payment.",
};

const path = (spaceId: string) => `/spaces/${encodeURIComponent(spaceId)}/receipt-design`;

export function getReceiptDesign(spaceId: string) {
  return apiClient.get<ReceiptDesign>(path(spaceId));
}

export function saveReceiptDesign(spaceId: string, settings: ReceiptDesignSettings) {
  return apiClient.put<ReceiptDesign>(path(spaceId), settings);
}

function imageForm(file: Blob, name: string) {
  const form = new FormData();
  form.append("file", file, `${name}.${file.type === "image/jpeg" ? "jpg" : "png"}`);
  return form;
}

/** Images are PNG or JPEG up to 512 KB. Errors: `415 UNSUPPORTED_FILE_TYPE`, `413 FILE_TOO_LARGE`. */
export function uploadReceiptLogo(spaceId: string, file: Blob) {
  return apiClient.post<ReceiptDesign>(`${path(spaceId)}/logo`, imageForm(file, "logo"));
}

export function removeReceiptLogo(spaceId: string) {
  return apiClient.delete<ReceiptDesign>(`${path(spaceId)}/logo`);
}

/** The space's own stamp, printed instead of a drawn one. */
export function uploadReceiptStamp(spaceId: string, file: Blob) {
  return apiClient.post<ReceiptDesign>(`${path(spaceId)}/stamp`, imageForm(file, "stamp"));
}

export function removeReceiptStamp(spaceId: string) {
  return apiClient.delete<ReceiptDesign>(`${path(spaceId)}/stamp`);
}

/** Add a blank signatory at the end. Errors: `409 SIGNATURE_LIMIT`. */
export function addReceiptSignature(spaceId: string) {
  return apiClient.post<ReceiptDesign>(`${path(spaceId)}/signatures`);
}

export function removeReceiptSignature(spaceId: string, signatureId: string) {
  return apiClient.delete<ReceiptDesign>(`${path(spaceId)}/signatures/${encodeURIComponent(signatureId)}`);
}

export function uploadSignatureImage(spaceId: string, signatureId: string, file: Blob) {
  return apiClient.post<ReceiptDesign>(
    `${path(spaceId)}/signatures/${encodeURIComponent(signatureId)}/image`,
    imageForm(file, "signature"),
  );
}

export function removeSignatureImage(spaceId: string, signatureId: string) {
  return apiClient.delete<ReceiptDesign>(`${path(spaceId)}/signatures/${encodeURIComponent(signatureId)}/image`);
}

/** The saved design on a sample payment, as a PDF (fetch with `apiClient.getBlob`). */
export function receiptSamplePath(spaceId: string) {
  return `${path(spaceId)}/sample`;
}
