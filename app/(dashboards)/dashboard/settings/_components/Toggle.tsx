import { cn } from "@/lib/utils";

/** A brand-green switch. Controlled — the parent owns the boolean. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name, used when the switch has no visible text beside it. */
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer",
        checked ? "bg-brand" : "bg-paper",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm transition-transform duration-300",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

/** A labelled row wrapping a Toggle — the workhorse of the preferences lists. */
export function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-cloud py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
