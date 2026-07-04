import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  InformationCircleIcon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";

export function CollectionsHeader({
  onDownload,
  onSendReminders,
}: {
  onDownload: () => void;
  onSendReminders: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Collections
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          See who has paid each due and export the list for records.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <HugeiconsIcon icon={Download01Icon} size={16} />
          Download list
        </button>
        <div className="">
          <button
            type="button"
            onClick={onSendReminders}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas px-5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon
              icon={Notification03Icon}
              size={16}
              className="text-brand"
            />
            Send reminders
          </button>

          <ReminderInfo />
        </div>
      </div>
    </header>
  );
}

/**
 * Info affordance next to "Send reminders" — reveals a plain-language
 * explanation on hover or keyboard focus. CSS-only so it needs no dependency.
 */
function ReminderInfo() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="About sending reminders"
        aria-describedby="send-reminders-tip"
        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cloud hover:text-brand cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={InformationCircleIcon} size={18} />
      </button>

      <span
        role="tooltip"
        id="send-reminders-tip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-cloud bg-canvas p-3 text-left text-xs leading-5 text-ink-soft opacity-0 shadow-lg shadow-ink/5 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="mb-1 block text-[13px] font-semibold text-ink">
          Send reminders
        </span>
        Nudges every student who hasn&apos;t paid this due yet with an email and
        in-app notification. Students who&apos;ve already paid are skipped.
      </span>
    </span>
  );
}
