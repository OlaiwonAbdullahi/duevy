"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../wallet/_components/utils";
import { REP_SPACE } from "../../create-dues/_components/data";
import { SettingsCard } from "../../settings/_components/SettingsCard";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="block text-xs font-medium text-ink-soft">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(BRAND_INPUT, "mt-1.5")}
      />
    </div>
  );
}

/** The department's public identity — what students see when they join and pay. */
export function DepartmentProfileCard() {
  const [name, setName] = useState(REP_SPACE.name);
  const [acronym, setAcronym] = useState(REP_SPACE.short);
  const [faculty, setFaculty] = useState("Faculty of Science");
  const [about, setAbout] = useState(
    "Official space for Computer Science students to pay departmental dues, buy handouts, and keep up with association levies.",
  );
  const [dirty, setDirty] = useState(false);

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    toast.success("Department details saved", { description: name });
  };

  return (
    <SettingsCard
      icon={Building03Icon}
      title="Department profile"
      description="The name and details students see across Duevy."
      action={
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Save
        </button>
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
            {faculty} · {REP_SPACE.memberCount} members
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Department name" value={name} onChange={edit(setName)} />
        </div>
        <Field label="Acronym" value={acronym} onChange={edit(setAcronym)} />
        <Field label="Faculty" value={faculty} onChange={edit(setFaculty)} />
        <div className="sm:col-span-2">
          <Label className="block text-xs font-medium text-ink-soft">About</Label>
          <textarea
            value={about}
            onChange={(e) => edit(setAbout)(e.target.value)}
            rows={3}
            placeholder="Tell students what this space is for."
            className="mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand focus:ring-[3px] focus:ring-brand/15"
          />
        </div>
      </div>
    </SettingsCard>
  );
}
