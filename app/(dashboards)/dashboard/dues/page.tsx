"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Building03Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../_components/EmptyState";
import type {
  Due,
  JoinableDepartment,
  PayMethod,
  Space,
} from "./_components/types";
import type { Card } from "../wallet/_components/types";
import { naira } from "./_components/data";
import { adaptSpace, adaptDue } from "./_components/adapt";
import { SpaceCard } from "./_components/SpaceCard";
import { SpaceDetail } from "./_components/SpaceDetail";
import { JoinDepartmentCard } from "./_components/JoinDepartmentCard";
import { PayDueModal } from "./_components/PayDueModal";
import { ReceiptModal } from "./_components/ReceiptModal";
import { buildReceipts, type Receipt } from "./_components/receipt";
import { listSpaces, joinSpace } from "@/lib/api/spaces";
import { listDues, payDue } from "@/lib/api/dues";
import { getWallet, listCards } from "@/lib/api/wallet";
import { fromKobo } from "../_components/format";
import { useRole } from "../_components/role-context";

export default function DuesPage() {
  const { isPendingRep } = useRole();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payDues, setPayDues] = useState<Due[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [balance, setBalance] = useState(0);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apiSpaces, apiDues, wallet, savedCards] = await Promise.all([
          listSpaces(),
          listDues({ perPage: 100 }),
          getWallet(),
          listCards(),
        ]);
        if (cancelled) return;
        setSpaces(apiSpaces.map(adaptSpace));
        setDues(apiDues.data.map(adaptDue));
        setBalance(fromKobo(wallet.balance));
        setCards(savedCards);
      } catch {
        if (!cancelled) toast.error("Couldn't load your dues.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = spaces.find((s) => s.id === selectedId) ?? null;
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

  const members = spaces.filter((s) => s.membership === "member");
  const guests = spaces.filter((s) => s.membership === "guest");

  const openSpace = (space: Space) => setSelectedId(space.id);

  // Joining by code is instant — the department drops straight into "Your
  // spaces" with its starter dues, no approval to wait on.
  const joinDepartment = async (dept: JoinableDepartment) => {
    if (spaces.some((s) => s.id === dept.id)) return;
    try {
      await joinSpace(dept.id, { code: dept.code });
      const space: Space = {
        id: dept.id,
        name: dept.name,
        short: dept.short,
        kind: dept.kind,
        membership: dept.membership,
        hue: dept.hue,
        memberCount: dept.memberCount,
      };
      setSpaces((list) => [space, ...list]);
      setDues((list) => [...dept.dues, ...list]);
      toast.success(`Joined ${dept.short}`, {
        description: "It's now under Your spaces.",
      });
    } catch {
      toast.error(`Couldn't join ${dept.short}. Please try again.`);
    }
  };

  const confirmPay = async (method: PayMethod, card?: Card) => {
    if (payDues.length === 0 || !selected) return;
    if (isPendingRep) {
      toast.info("Paused during review", {
        description: "Payments unlock once your rep application is approved.",
      });
      return;
    }
    const targetDues = payDues;
    const targetIds = targetDues.map((d) => d.id);
    const total = targetDues.reduce((sum, d) => sum + d.amount, 0);
    const space = selected;
    setPendingIds(targetIds);

    try {
      // Settle each selected due. Online payments would return a checkoutUrl to
      // redirect to; wallet/card settle synchronously.
      const results = await Promise.all(
        targetDues.map((d) =>
          payDue(
            d.id,
            method === "card" && card
              ? { method: "card", cardId: card.id }
              : method === "online"
                ? { method: "online" }
                : { method: "wallet" },
          ),
        ),
      );

      const redirect = results.find((r) => r.checkoutUrl)?.checkoutUrl;
      if (method === "online" && redirect) {
        window.location.href = redirect;
        return;
      }

      setDues((list) =>
        list.map((d) => (targetIds.includes(d.id) ? { ...d, status: "paid" } : d)),
      );
      if (method === "wallet") setBalance((b) => b - total);
      setPendingIds([]);
      setPayDues([]);
      // One receipt per due settled — surfaced together for download.
      setReceipts(buildReceipts(targetDues, space, method, card));
      toast.success(`${naira(total)} paid`, {
        description:
          targetDues.length === 1
            ? targetDues[0].title
            : `${targetDues.length} dues settled`,
      });
    } catch {
      setPendingIds([]);
      toast.error("Payment failed. Please try again.");
    }
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
              pendingIds={pendingIds}
              onBack={() => setSelectedId(null)}
              onPay={setPayDues}
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

            {/* Join a new department by code. */}
            <div id="join" className="mt-6 scroll-mt-24">
              <JoinDepartmentCard
                joinedIds={spaces.map((s) => s.id)}
                onJoin={joinDepartment}
              />
            </div>

            {/* Spaces you're a member of. */}
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Your spaces
              </h2>
              {members.length === 0 ? (
                <EmptyState
                  className="mt-3"
                  icon={Building03Icon}
                  title="No spaces yet"
                  description="Join a department using its code above to see it here."
                />
              ) : (
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
              )}
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

      {payDues.length > 0 && selected && (
        <PayDueModal
          dues={payDues}
          space={selected}
          balance={balance}
          cards={cards}
          pending={pendingIds.length > 0}
          onClose={() => (pendingIds.length ? null : setPayDues([]))}
          onConfirm={confirmPay}
        />
      )}

      {receipts.length > 0 && (
        <ReceiptModal receipts={receipts} onClose={() => setReceipts([])} />
      )}
    </div>
  );
}
