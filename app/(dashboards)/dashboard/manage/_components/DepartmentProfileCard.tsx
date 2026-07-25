"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../_components/form-styles";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { getSpace } from "@/lib/api/spaces";
import { updateSpaceProfile } from "@/lib/api/rep";

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
    getSpace(spaceId)
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
  }, [spaceId]);

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const save = async () => {
    if (!spaceId) return;
    setSaving(true);
    try {
      // `faculty` isn't part of the profile patch (§4.6) — name/short/about only.
      await updateSpaceProfile(spaceId, { name, short: acronym, about });
      setDirty(false);
      toast.success("Department details saved", { description: name });
    } catch {
      toast.error("Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
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
          <Button variant="brand" size="pill" onClick={save} disabled={!dirty || saving}>
            Save
          </Button>
        )
      }
    >
      {/* Identity strip */}
      <div className="flex items-center gap-4 border-b border-cloud pb-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand text-lg font-semibold text-white">
          {acronym.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">
            {faculty} · {memberCount} members
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
  );
}
