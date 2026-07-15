"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Cancel01Icon,
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../_components/form-styles";
import { newCategory, newNominee } from "./data";
import type { EditorCategory, EditorNominee } from "./types";

/**
 * The poll form builder: a rep adds award categories, and inside each, the
 * nominees students choose between. Everything is controlled — the parent owns
 * the categories array and receives every edit through `onChange`.
 */
export function CategoriesEditor({
  categories,
  onChange,
}: {
  categories: EditorCategory[];
  onChange: (next: EditorCategory[]) => void;
}) {
  const patchCategory = (id: string, patch: Partial<EditorCategory>) =>
    onChange(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const removeCategory = (id: string) =>
    onChange(categories.filter((c) => c.id !== id));

  const addCategory = () => onChange([...categories, newCategory()]);

  const setNominees = (categoryId: string, nominees: EditorNominee[]) =>
    patchCategory(categoryId, { nominees });

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category, index) => (
        <div
          key={category.id}
          className="rounded-3xl border border-cloud bg-paper p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
              <HugeiconsIcon icon={Award01Icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <label className="block text-[11px] font-medium text-ink-soft">
                Award {index + 1}
              </label>
              <Input
                value={category.title}
                onChange={(e) =>
                  patchCategory(category.id, { title: e.target.value })
                }
                placeholder="e.g. Best Dressed"
                className={cn(BRAND_INPUT, "mt-1 bg-canvas")}
              />
            </div>
            <button
              type="button"
              onClick={() => removeCategory(category.id)}
              disabled={categories.length === 1}
              aria-label={`Remove award ${index + 1}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </button>
          </div>

          <NomineeList
            nominees={category.nominees}
            onChange={(nominees) => setNominees(category.id, nominees)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addCategory}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-cloud/40 text-sm font-semibold text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} />
        Add award category
      </button>
    </div>
  );
}

function NomineeList({
  nominees,
  onChange,
}: {
  nominees: EditorNominee[];
  onChange: (next: EditorNominee[]) => void;
}) {
  const setName = (id: string, name: string) =>
    onChange(nominees.map((n) => (n.id === id ? { ...n, name } : n)));

  const remove = (id: string) => onChange(nominees.filter((n) => n.id !== id));

  const add = () => onChange([...nominees, newNominee()]);

  return (
    <div className="mt-4 pl-0 sm:pl-12">
      <p className="mb-2 text-[11px] font-medium text-ink-soft">Nominees</p>
      <div className="flex flex-col gap-2">
        {nominees.map((nominee, index) => (
          <div key={nominee.id} className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cloud text-[11px] font-bold text-brand">
              {index + 1}
            </span>
            <Input
              value={nominee.name}
              onChange={(e) => setName(nominee.id, e.target.value)}
              placeholder={`Nominee ${index + 1} name`}
              className={cn(BRAND_INPUT, "h-10 flex-1")}
            />
            <button
              type="button"
              onClick={() => remove(nominee.id)}
              disabled={nominees.length <= 2}
              aria-label={`Remove nominee ${index + 1}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand-bright cursor-pointer"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={14} />
        Add nominee
      </button>
    </div>
  );
}
