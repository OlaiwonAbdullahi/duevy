import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ColumnAlign = "left" | "center" | "right";

/**
 * Shared table chrome: horizontal scroll wrapper, header row, divided body.
 * Pages own the row markup — pass `<tr>`s as children.
 */
export function DataTable({
  headers,
  children,
}: {
  headers: { label: string; align?: ColumnAlign }[];
  children: ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-cloud bg-canvas">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-cloud bg-paper/40">
          <tr>
            {headers.map((h, i) => (
              <th
                key={`${h.label}-${i}`}
                className={cn(
                  "whitespace-nowrap p-4 text-xs font-semibold text-ink-soft",
                  h.align === "right" && "text-right",
                  h.align === "center" && "text-center",
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cloud/70 text-[13px] text-ink">
          {children}
        </tbody>
      </table>
    </div>
  );
}
