import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-ink-soft">{description}</p>
        ) : null}
      </div>
      {right ? <div className="sm:ml-auto">{right}</div> : null}
    </div>
  );
}
