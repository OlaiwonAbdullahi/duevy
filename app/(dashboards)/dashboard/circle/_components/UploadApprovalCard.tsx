import { ChangeEvent, RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  FileSpreadsheetIcon,
} from "@hugeicons/core-free-icons";

export function UploadApprovalCard({
  fileInputRef,
  uploadName,
  uploadMatched,
  matchedCount,
  onUpload,
  onUploadClick,
  onApproveMatched,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadName: string | null;
  uploadMatched: boolean;
  matchedCount: number;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onApproveMatched: () => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
          <HugeiconsIcon icon={FileSpreadsheetIcon} size={21} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Auto-approve with Excel
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            Upload the class list. Duevy checks pending requests against matric
            numbers and marks the students found on the sheet.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={onUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={onUploadClick}
        className="mt-5 flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-brand/40 bg-cloud/45 px-5 py-8 text-center transition-colors duration-300 hover:bg-cloud cursor-pointer"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-brand">
          <HugeiconsIcon icon={CloudUploadIcon} size={22} />
        </span>
        <span className="mt-3 text-sm font-semibold text-ink">
          {uploadName ?? "Choose .xlsx or .csv file"}
        </span>
        <span className="mt-1 text-xs text-ink-soft">
          Columns expected: name, matric number, level
        </span>
      </button>

      <div className="mt-5 rounded-2xl border border-cloud bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {uploadMatched ? "2 matches found" : "No sheet uploaded"}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {uploadMatched
                ? "Review the highlighted requests before approving."
                : "Matched students can be approved together."}
            </p>
          </div>
          <button
            type="button"
            onClick={onApproveMatched}
            disabled={matchedCount === 0}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:bg-ink-soft/30 cursor-pointer"
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
            Approve
          </button>
        </div>
      </div>
    </section>
  );
}
