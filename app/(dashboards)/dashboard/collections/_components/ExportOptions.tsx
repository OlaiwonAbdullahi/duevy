import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { CollectionStudent } from "./types";

export function ExportOptions({
  students,
  onDownload,
}: {
  students: CollectionStudent[];
  onDownload: (rows: CollectionStudent[], scope: string) => void;
}) {
  return (
    <section className="mt-4 flex flex-col gap-3 rounded-3xl border border-cloud bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          Export records
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Download this due&apos;s payment list as CSV.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <ExportButton
          title="Full list"
          onClick={() => onDownload(students, "all")}
        />
        <ExportButton
          title="Paid only"
          onClick={() =>
            onDownload(
              students.filter((student) => student.status === "paid"),
              "paid",
            )
          }
        />
        <ExportButton
          title="Unpaid only"
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
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="brand-outline"
      size="pill"
      onClick={onClick}
      aria-label={`Download ${title} as CSV`}
    >
      <HugeiconsIcon icon={Download01Icon} size={15} className="text-brand" />
      {title}
    </Button>
  );
}
