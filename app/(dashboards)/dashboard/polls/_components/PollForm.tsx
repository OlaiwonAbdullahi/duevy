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
  LockIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_INPUT } from "../../_components/form-styles";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { ToggleRow } from "../../settings/_components/Toggle";
import { DatePicker } from "../../create-dues/_components/DatePicker";
import { CategoriesEditor } from "./CategoriesEditor";
import { PhotoPicker } from "./PhotoPicker";
import { CoverPicker } from "./CoverPicker";
import { naira, newCategory } from "./data";
import type { EditorCategory, Poll, PollCategory } from "./types";
import {
  uploadPollImage,
  updatePollCategoryImage,
  updatePollNominee,
  type PollDraft,
  type PollPatch,
} from "@/lib/api/polls";

export function PollForm({
  initial,
  spaceId,
  spaceName,
  submitting,
  onCancel,
  onCreate,
  onUpdate,
  onImageChange,
}: {
  initial: Poll | null;
  spaceId: string;
  spaceName: string;
  submitting: boolean;
  onCancel: () => void;
  onCreate: (draft: PollDraft, publish: boolean) => void;
  onUpdate: (patch: PollPatch) => void;
  /** Bubbles up a category/nominee photo change so the poll list/analytics stay in sync. */
  onImageChange: (categories: PollCategory[]) => void;
}) {
  const editing = !!initial;
  // Once active, structure (membersOnly/paid/amountPerVote) is locked and the
  // deadline can only be extended. Categories/nominees can never be added or
  // removed after creation — but their photos aren't locked at all (cosmetic,
  // editable at any poll status via a targeted PATCH).
  const locked = initial?.status === "active";

  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initial?.coverImageUrl ?? undefined,
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [membersOnly, setMembersOnly] = useState(initial?.membersOnly ?? true);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [amountDigits, setAmountDigits] = useState(
    initial?.amountPerVote ? String(initial.amountPerVote) : "",
  );
  const [categories, setCategories] = useState<EditorCategory[]>([newCategory()]);
  // Editing an existing poll shows its real categories, kept in sync as photos change.
  const [existingCategories, setExistingCategories] = useState<PollCategory[]>(
    initial?.categories ?? [],
  );

  const patchExistingCategory = (categoryId: string, patch: Partial<PollCategory>) => {
    const next = existingCategories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c));
    setExistingCategories(next);
    onImageChange(next);
  };

  const patchExistingNominee = (
    categoryId: string,
    nomineeId: string,
    patch: Partial<PollCategory["nominees"][number]>,
  ) => {
    const next = existingCategories.map((c) =>
      c.id === categoryId
        ? { ...c, nominees: c.nominees.map((n) => (n.id === nomineeId ? { ...n, ...patch } : n)) }
        : c,
    );
    setExistingCategories(next);
    onImageChange(next);
  };

  // Bio/code are proposed fields — save on blur via the same nominee PATCH the
  // photo picker uses, once the backend accepts them there too.
  const saveNomineeField = async (
    categoryId: string,
    nomineeId: string,
    patch: { bio?: string; code?: string },
  ) => {
    try {
      const updated = await updatePollNominee(spaceId, initial!.id, nomineeId, patch);
      patchExistingNominee(categoryId, nomineeId, {
        bio: updated.bio,
        code: updated.code,
      });
    } catch {
      toast.error("Couldn't save that yet — needs backend support.");
    }
  };

  const amountPerVote = Number(amountDigits || 0);
  const onlyDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 7);
  const formatDigits = (d: string) => (d ? Number(d).toLocaleString("en-NG") : "");

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
      editing
        ? existingCategories.reduce((sum, c) => sum + c.nominees.length, 0)
        : categories.reduce(
            (sum, c) => sum + c.nominees.filter((n) => n.name.trim() !== "").length,
            0,
          ),
    [editing, existingCategories, categories],
  );

  const validAmount = !paid || amountPerVote > 0;
  const valid = editing
    ? title.trim().length > 1
    : title.trim().length > 1 && readyCategories.length >= 1 && validAmount;

  const submit = (publish?: boolean) => {
    if (!valid) {
      toast.error(
        paid && amountPerVote <= 0
          ? "Set a price per vote, or turn off paid voting"
          : "Add a title and at least one award with two nominees",
      );
      return;
    }

    if (editing) {
      const patch: PollPatch = {};
      if (title.trim() !== initial!.title) patch.title = title.trim();
      if (description.trim() !== (initial!.description ?? "")) {
        patch.description = description.trim();
      }
      if (deadline !== initial!.deadline) patch.deadline = deadline;
      if (coverImageUrl !== (initial!.coverImageUrl ?? undefined)) {
        patch.coverImageUrl = coverImageUrl ?? null;
      }
      if (!locked) {
        if (membersOnly !== initial!.membersOnly) patch.membersOnly = membersOnly;
        if (paid !== initial!.paid) patch.paid = paid;
        if (paid && amountPerVote !== initial!.amountPerVote) {
          patch.amountPerVote = amountPerVote;
        }
      }
      if (Object.keys(patch).length === 0) {
        toast.info("No changes to save");
        return;
      }
      onUpdate(patch);
      return;
    }

    // Persist only the fleshed-out categories/nominees; strip client-side ids.
    const cleaned = readyCategories.map((c) => ({
      title: c.title.trim(),
      imageUrl: c.imageUrl,
      nominees: c.nominees
        .filter((n) => n.name.trim() !== "")
        .map((n) => ({
          name: n.name.trim(),
          imageUrl: n.imageUrl,
          bio: n.bio?.trim() || undefined,
          code: n.code?.trim() || undefined,
        })),
    }));
    onCreate(
      {
        title: title.trim(),
        description: description.trim(),
        deadline,
        membersOnly,
        paid,
        amountPerVote: paid ? amountPerVote : 0,
        coverImageUrl,
        categories: cleaned,
      },
      publish ?? true,
    );
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
          <p className="text-[13px] text-ink-soft">For {spaceName}</p>
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
                  Cover photo
                </Label>
                <div className="mt-1.5">
                  <CoverPicker
                    imageUrl={coverImageUrl}
                    onUpload={async (file) => {
                      const { imageUrl } = await uploadPollImage(spaceId, file);
                      setCoverImageUrl(imageUrl);
                    }}
                    onRemove={() => setCoverImageUrl(undefined)}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Shown as the banner on the public voting page.
                </p>
              </div>

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
                  Voting deadline {locked && "(extend only)"}
                </Label>
                <div className="mt-1.5">
                  <DatePicker
                    value={deadline}
                    onChange={setDeadline}
                    min={locked ? initial!.deadline : undefined}
                  />
                </div>
              </div>

              <div className="border-t border-cloud pt-1">
                <ToggleRow
                  title="Members only"
                  description={
                    locked
                      ? "Locked once the poll is live."
                      : "Only verified department students can vote "
                  }
                  checked={membersOnly}
                  onChange={setMembersOnly}
                  disabled={locked}
                />
                <ToggleRow
                  title="Paid voting"
                  description={
                    locked
                      ? "Locked once the poll is live."
                      : "Each vote must be paid for before it counts."
                  }
                  checked={paid}
                  onChange={setPaid}
                  disabled={locked}
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
                      disabled={locked}
                      value={formatDigits(amountDigits)}
                      onChange={(e) =>
                        setAmountDigits(onlyDigits(e.target.value))
                      }
                      placeholder="100"
                      className="h-11 border-0 bg-transparent px-1 text-sm text-ink shadow-none focus-visible:ring-0 placeholder:text-ink-soft disabled:opacity-60"
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
            description={
              editing
                ? "Names are locked after creation, but photos aren't — add or change one any time."
                : "Add each award category and the nominees students vote between."
            }
          >
            {editing ? (
              <div className="flex flex-col gap-3">
                {existingCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-cloud bg-paper p-4"
                  >
                    <div className="flex items-center gap-3">
                      <PhotoPicker
                        size={40}
                        label={category.title || "award"}
                        imageUrl={category.imageUrl}
                        onUpload={async (file) => {
                          const { imageUrl } = await uploadPollImage(spaceId, file);
                          const updated = await updatePollCategoryImage(
                            spaceId,
                            initial!.id,
                            category.id,
                            imageUrl,
                          );
                          patchExistingCategory(category.id, { imageUrl: updated.imageUrl });
                        }}
                        onRemove={async () => {
                          await updatePollCategoryImage(spaceId, initial!.id, category.id, null);
                          patchExistingCategory(category.id, { imageUrl: null });
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={LockIcon} size={12} className="shrink-0 text-ink-soft" />
                          <p className="truncate text-sm font-semibold text-ink">{category.title}</p>
                        </div>
                      </div>
                    </div>
                    <ul className="mt-3 flex flex-col gap-2 pl-13">
                      {category.nominees.map((nominee) => (
                        <li key={nominee.id} className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2.5">
                            <PhotoPicker
                              size={28}
                              label={nominee.name || "nominee"}
                              imageUrl={nominee.imageUrl}
                              onUpload={async (file) => {
                                const { imageUrl } = await uploadPollImage(spaceId, file);
                                const updated = await updatePollNominee(
                                  spaceId,
                                  initial!.id,
                                  nominee.id,
                                  { imageUrl },
                                );
                                patchExistingNominee(category.id, nominee.id, {
                                  imageUrl: updated.imageUrl,
                                });
                              }}
                              onRemove={async () => {
                                await updatePollNominee(spaceId, initial!.id, nominee.id, {
                                  imageUrl: null,
                                });
                                patchExistingNominee(category.id, nominee.id, { imageUrl: null });
                              }}
                            />
                            <p className="truncate text-xs text-ink-soft">{nominee.name}</p>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-1.5 pl-[38px]">
                            <input
                              defaultValue={nominee.bio ?? ""}
                              placeholder="Short bio (optional)"
                              onBlur={(e) =>
                                saveNomineeField(category.id, nominee.id, { bio: e.target.value })
                              }
                              className="h-7 min-w-0 rounded-lg border border-cloud bg-canvas px-2 text-[11px] text-ink outline-none focus:border-brand placeholder:text-ink-soft/70"
                            />
                            <input
                              defaultValue={nominee.code ?? ""}
                              placeholder="Vote code"
                              onBlur={(e) =>
                                saveNomineeField(category.id, nominee.id, { code: e.target.value })
                              }
                              className="h-7 w-20 rounded-lg border border-cloud bg-canvas px-2 text-[11px] text-ink outline-none focus:border-brand placeholder:text-ink-soft/70"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <CategoriesEditor spaceId={spaceId} categories={categories} onChange={setCategories} />
            )}
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
                value={String(editing ? initial!.categories.length : readyCategories.length)}
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
              onClick={() => submit(editing ? undefined : true)}
              disabled={!valid || submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {submitting ? "Saving…" : editing ? "Save changes" : "Publish poll"}
            </button>
            {!editing && (
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={!valid || submitting}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink transition-colors duration-300 hover:bg-cloud disabled:opacity-50 cursor-pointer"
              >
                Save as draft
              </button>
            )}
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
              {editing
                ? "Categories and nominees can't be changed once a poll exists."
                : "Publishing generates a shareable voting link you can send to students."}
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
