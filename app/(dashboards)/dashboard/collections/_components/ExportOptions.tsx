import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import type { CollectionStudent } from "./types";

export function ExportOptions({
  students,
  onDownload,
}: {
  students: CollectionStudent[];
  onDownload: (rows: CollectionStudent[], scope: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        Export options
      </h2>
      <div className="mt-4 grid gap-3">
        <ExportButton
          title="Full list"
          hint="Paid and unpaid students"
          onClick={() => onDownload(students, "all")}
        />
        <ExportButton
          title="Paid only"
          hint="Students with references"
          onClick={() =>
            onDownload(
              students.filter((student) => student.status === "paid"),
              "paid",
            )
          }
        />
        <ExportButton
          title="Unpaid only"
          hint="Use for follow-up"
          onClick={() =>
            onDownload(
              students.filter((student) => student.status === "unpaid"),
              "unpaid",
            )
          }
        />
      </div>
    </section>
  );
}

function ExportButton({
  title,
  hint,
  onClick,
}: {
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-cloud bg-paper px-4 py-3 text-left transition-colors duration-300 hover:bg-cloud cursor-pointer"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-ink-soft">{hint}</span>
      </span>
      <HugeiconsIcon icon={Download01Icon} size={17} className="text-brand" />
    </button>
  );
}
