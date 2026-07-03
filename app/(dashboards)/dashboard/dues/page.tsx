"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import type { Due, Space } from "./_components/types";
import { SPACES, DUES, naira } from "./_components/data";
import { SpaceCard } from "./_components/SpaceCard";
import { SpaceDetail } from "./_components/SpaceDetail";
import { PayDueModal } from "./_components/PayDueModal";

export default function DuesPage() {
  const [dues, setDues] = useState<Due[]>(DUES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payDue, setPayDue] = useState<Due | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [balance, setBalance] = useState(8500);

  const selected = SPACES.find((s) => s.id === selectedId) ?? null;
  const selectedDues = useMemo(
    () => dues.filter((d) => d.spaceId === selectedId),
    [dues, selectedId],
  );

  // Portfolio-wide position, shown on the spaces wall.
  const totals = useMemo(() => {
    const open = dues.filter((d) => d.status !== "paid");
    return {
      outstanding: open.reduce((sum, d) => sum + d.amount, 0),
      overdue: dues.filter((d) => d.status === "overdue").length,
    };
  }, [dues]);

  const members = SPACES.filter((s) => s.membership === "member");
  const guests = SPACES.filter((s) => s.membership === "guest");

  const openSpace = (space: Space) => setSelectedId(space.id);

  const confirmPay = () => {
    if (!payDue) return;
    const due = payDue;
    setPendingId(due.id);
    // Simulate the wallet debit + collection posting. In production this hits
    // the payments API and the row flips on the success response.
    setTimeout(() => {
      setDues((list) =>
        list.map((d) => (d.id === due.id ? { ...d, status: "paid" } : d)),
      );
      setBalance((b) => b - due.amount);
      setPendingId(null);
      setPayDue(null);
      toast.success(`${naira(due.amount)} paid`, {
        description: due.title,
      });
    }, 900);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <SpaceDetail
              space={selected}
              dues={selectedDues}
              pendingId={pendingId}
              onBack={() => setSelectedId(null)}
              onPay={(due) => setPayDue(due)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  My dues
                </h1>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Every space you belong to or pay at, in one place. Open one to
                  settle its dues.
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-cloud bg-canvas px-4 py-3">
                <div>
                  <p className="text-[11px] font-medium text-ink-soft">
                    Total outstanding
                  </p>
                  <p className="text-lg font-semibold tracking-tight text-ink">
                    {naira(totals.outstanding)}
                  </p>
                </div>
                {totals.overdue > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
                    <HugeiconsIcon icon={Alert01Icon} size={12} />
                    {totals.overdue} overdue
                  </span>
                )}
              </div>
            </header>

            {/* Spaces you're a member of. */}
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Your spaces
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    dues={dues}
                    onOpen={openSpace}
                  />
                ))}
              </div>
            </section>

            {/* Bodies you're paying at without being a full member. */}
            {guests.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Also paying at
                </h2>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Spaces outside your department where you have dues to settle.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {guests.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      dues={dues}
                      onOpen={openSpace}
                    />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {payDue && selected && (
        <PayDueModal
          due={payDue}
          space={selected}
          balance={balance}
          pending={pendingId === payDue.id}
          onClose={() => (pendingId ? null : setPayDue(null))}
          onConfirm={confirmPay}
        />
      )}
    </div>
  );
}
