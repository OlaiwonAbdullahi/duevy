import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { JoinRequest } from "./types";
import { Initials } from "./Initials";
import { EmptyState } from "../../_components/EmptyState";

export function PendingRequestsCard({
  requests,
  onApprove,
  onDecline,
}: {
  requests: JoinRequest[];
  onApprove: (request: JoinRequest) => void;
  onDecline: (request: JoinRequest) => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        Pending requests
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        Students who asked to join this department space.
      </p>

      <ul className="mt-4 flex flex-col">
        {requests.length === 0 ? (
          <li>
            <EmptyState
              icon={CheckmarkCircle02Icon}
              title="You're all caught up"
              description="New requests to join your department space will appear here for review."
            />
          </li>
        ) : (
          requests.map((request) => (
            <li
              key={request.id}
              className="border-t border-cloud py-4 first:border-t-0"
            >
              <div className="flex items-start gap-3">
                <Initials name={request.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {request.name}
                    </p>
                    {request.matchedByUpload && (
                      <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                        Matched
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {request.matricNo} - {request.level}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {request.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 pl-13">
                <button
                  type="button"
                  onClick={() => onApprove(request)}
                  aria-label={`Approve ${request.name}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onDecline(request)}
                  aria-label={`Decline ${request.name}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-cloud px-4 text-xs font-semibold text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  Decline
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
