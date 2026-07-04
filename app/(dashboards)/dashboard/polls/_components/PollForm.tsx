"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Award01Icon,
  InformationCircleIcon,
  Megaphone01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_INPUT } from "../../wallet/_components/utils";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { ToggleRow } from "../../settings/_components/Toggle";
import { DatePicker } from "../../create-dues/_components/DatePicker";
import { REP_SPACE } from "../../create-dues/_components/data";
import { CategoriesEditor } from "./CategoriesEditor";
import { naira, newCategory } from "./data";
import type { Poll, PollCategory, PollDraft } from "./types";

export function PollForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Poll | null;
  onCancel: () => void;
  onSave: (draft: PollDraft) => void;
}) {
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [membersOnly, setMembersOnly] = useState(initial?.membersOnly ?? true);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [amountDigits, setAmountDigits] = useState(
    initial?.amountPerVote ? String(initial.amountPerVote) : "",
  );
  const [categories, setCategories] = useState<PollCategory[]>(
    initial?.categories ?? [newCategory()],
  );

  const amountPerVote = Number(amountDigits || 0);
  const onlyDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 7);
  const formatDigits = (d: string) =>
    d ? Number(d).toLocaleString("en-NG") : "";

  // A category counts as ready when it has a title and at least two named
  // nominees — those are the ones students actually get to vote between.
  const readyCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.title.trim() !== "" &&
          c.nominees.filter((n) => n.name.trim() !== "").length >= 2,
      ),
    [categories],
  );
  const nomineeCount = useMemo(
    () =>
      categories.reduce(
        (sum, c) => sum + c.nominees.filter((n) => n.name.trim() !== "").length,
        0,
      ),
    [categories],
  );

  const validAmount = !paid || amountPerVote > 0;
  const valid =
    title.trim().length > 1 && readyCategories.length >= 1 && validAmount;

  const submit = () => {
    if (!valid) {
      toast.error(
        paid && amountPerVote <= 0
          ? "Set a price per vote, or turn off paid voting"
          : "Add a title and at least one award with two nominees",
      );
      return;
    }
    // Persist only the fleshed-out categories/nominees.
    const cleaned = readyCategories.map((c) => ({
      ...c,
      nominees: c.nominees.filter((n) => n.name.trim() !== ""),
    }));
    onSave({
      title: title.trim(),
      description: description.trim(),
      deadline,
      membersOnly,
      paid,
      amountPerVote: paid ? amountPerVote : 0,
      categories: cleaned,
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        All polls
      </button>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon
            icon={editing ? PencilEdit01Icon : Megaphone01Icon}
            size={20}
          />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {editing ? "Edit poll" : "Create a vote poll"}
          </h1>
          <p className="text-[13px] text-ink-soft">For {REP_SPACE.name}</p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <SettingsCard
            icon={PencilEdit01Icon}
            title="Poll details"
            description="What's this vote for, and when does it close?"
          >
            <div className="flex flex-col gap-4">
              <div>
                <Label className="block text-xs font-medium text-ink-soft">
                  Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CSSA Dinner & Awards 2026"
                  className={`${BRAND_INPUT} mt-1.5`}
                />
              </div>

              <div>
                <Label className="block text-xs font-medium text-ink-soft">
                  Description
                </Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Tell students what they're voting for."
                  className="mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-ink-soft"
                />
              </div>

              <div>
                <Label className="block text-xs font-medium text-ink-soft">
                  Voting deadline
                </Label>
                <div className="mt-1.5">
                  <DatePicker value={deadline} onChange={setDeadline} />
                </div>
              </div>

              <div className="border-t border-cloud pt-1">
                <ToggleRow
                  title="Members only"
                  description="Only verified department students can vote "
                  checked={membersOnly}
                  onChange={setMembersOnly}
                />
                <ToggleRow
                  title="Paid voting"
                  description="Each vote must be paid for before it counts."
                  checked={paid}
                  onChange={setPaid}
                />
              </div>

              {paid && (
                <div>
                  <Label className="block text-xs font-medium text-ink-soft">
                    Price per vote
                  </Label>
                  <div className="mt-1.5 flex items-center gap-1 rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
                    <span className="text-sm font-semibold text-ink-soft">
                      ₦
                    </span>
                    <Input
                      inputMode="numeric"
                      value={formatDigits(amountDigits)}
                      onChange={(e) =>
                        setAmountDigits(onlyDigits(e.target.value))
                      }
                      placeholder="100"
                      className="h-11 border-0 bg-transparent px-1 text-sm text-ink shadow-none focus-visible:ring-0 placeholder:text-ink-soft"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Students pay this each time they vote.
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Award01Icon}
            title="Awards & nominees"
            description="Add each award category and the nominees students vote between."
          >
            <CategoriesEditor
              categories={categories}
              onChange={setCategories}
            />
          </SettingsCard>
        </div>

        {/* Summary + actions. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Summary
            </h2>
            <dl className="mt-4 flex flex-col gap-3">
              <SummaryRow
                label="Awards"
                value={String(readyCategories.length)}
              />
              <SummaryRow label="Nominees" value={String(nomineeCount)} />
              <SummaryRow
                label="Who can vote"
                value={membersOnly ? "Members only" : "Anyone with link"}
              />
              <SummaryRow
                label="Price per vote"
                value={
                  paid && amountPerVote > 0 ? naira(amountPerVote) : "Free"
                }
              />
            </dl>
          </section>

          <div className="rounded-3xl border border-cloud bg-canvas p-4">
            <button
              type="button"
              onClick={submit}
              disabled={!valid}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {editing ? "Save changes" : "Publish poll"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer"
            >
              Cancel
            </button>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-soft">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={13}
                className="mt-px shrink-0"
              />
              Publishing generates a shareable voting link you can send to
              students.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[13px] text-ink-soft">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
