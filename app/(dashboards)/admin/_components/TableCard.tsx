import type { ReactNode } from "react";

export default function TableCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cloud bg-paper/40">
      <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle ? (
            <p className="text-[12px] text-ink-soft">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-cloud/70 p-4">{children}</div>
    </section>
  );
}
