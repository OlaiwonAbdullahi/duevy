"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, spaceQuery } from "@/lib/api/queries";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../_components/form-styles";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { updateSpaceProfile } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="block text-xs font-medium text-ink-soft">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(BRAND_INPUT, "mt-1.5")}
      />
    </div>
  );
}

/** The department's public identity — what students see when they join and pay. */
export function DepartmentProfileCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const queryClient = useQueryClient();
  // Only the lead can edit the profile — the backend 403s a co-rep, so hide
  // the edit affordance up front rather than let them hit that error.
  const readOnly = repSpace?.membership === "co";

  const [name, setName] = useState(repSpace?.name ?? "");
  const [acronym, setAcronym] = useState("");
  const [faculty, setFaculty] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [about, setAbout] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    queryClient
      .fetchQuery(spaceQuery(spaceId))
      .then((space) => {
        if (cancelled) return;
        setName(space.name);
        setAcronym(space.short);
        setFaculty(space.faculty ?? "");
        setAbout(space.about ?? "");
        setMemberCount(space.memberCount);
        setDirty(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [spaceId, queryClient]);

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const save = async () => {
    if (!spaceId) return;
    setSaving(true);
    try {
      await updateSpaceProfile(spaceId, {
        name,
        short: acronym,
        about,
        faculty: faculty.trim() || null,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.space(spaceId) });
      setDirty(false);
      toast.success("Department details saved", { description: name });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const initials = acronym.slice(0, 3).toUpperCase();

  return (
    <>
    {/* Phones: a profile cover — doodle banner with the crest overlapping it. */}
    <section className="overflow-hidden rounded-3xl border border-cloud bg-canvas sm:hidden">
      <div className="doodle-card h-24" />
      <div className="px-4 pb-4">
        <div className="-mt-9 flex items-end justify-between gap-3">
          <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-3xl bg-brand text-xl font-semibold text-white shadow-[0_10px_24px_-12px_var(--p-primary)] ring-4 ring-canvas">
            {initials || "—"}
          </span>
          <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
            <HugeiconsIcon icon={UserMultipleIcon} size={13} />
            {memberCount.toLocaleString("en-NG")} members
          </span>
        </div>
        <p className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink">{name}</p>
        {faculty && <p className="mt-0.5 text-xs text-ink-soft">{faculty}</p>}
        {about && <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-ink-soft">{about}</p>}
      </div>
    </section>

    <SettingsCard
      icon={Building03Icon}
      title="Department profile"
      description={
        readOnly
          ? "Only your lead rep can edit these details."
          : "The name and details students see across Duevy."
      }
      action={
        !readOnly && (
          <Button variant="brand" size="pill" onClick={save} disabled={!dirty || saving} className="max-sm:hidden">
            Save
          </Button>
        )
      }
    >
      {/* Identity strip (phones get the cover above instead) */}
      <div className="hidden items-center gap-4 border-b border-cloud pb-5 sm:flex">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">
            {faculty} · {memberCount} members
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:mt-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Department name" value={name} onChange={edit(setName)} disabled={readOnly} />
        </div>
        <Field label="Acronym" value={acronym} onChange={edit(setAcronym)} disabled={readOnly} />
        <Field label="Faculty" value={faculty} onChange={edit(setFaculty)} disabled={readOnly} />
        <div className="sm:col-span-2">
          <Label className="block text-xs font-medium text-ink-soft">About</Label>
          <textarea
            value={about}
            onChange={(e) => edit(setAbout)(e.target.value)}
            rows={3}
            disabled={readOnly}
            placeholder="Tell students what this space is for."
            className="mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-[3px] focus:ring-brand/15 disabled:opacity-60"
          />
        </div>
      </div>
    </SettingsCard>

    {/* Phones: Save rides above the tab bar once something's changed. */}
    <AnimatePresence>
      {!readOnly && dirty && (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 sm:hidden"
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-cloud bg-canvas/95 p-1.5 pl-5 shadow-[0_18px_40px_-20px_rgba(11,110,79,0.5)] backdrop-blur">
            <p className="text-xs font-medium text-ink-soft">Unsaved changes</p>
            <Button variant="brand" size="pill-lg" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
    </>
  );
}
