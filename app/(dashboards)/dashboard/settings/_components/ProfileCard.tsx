"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BRAND_INPUT } from "../../wallet/_components/utils";
import { UserAvatar } from "../../_components/UserAvatar";
import { SettingsCard } from "./SettingsCard";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="block text-xs font-medium text-ink-soft">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(BRAND_INPUT, "mt-1.5")}
      />
    </div>
  );
}

/** Personal details. Matric number and department are set by the school, so
 *  they're shown read-only; the student edits their own contact fields. */
export function ProfileCard() {
  const [name, setName] = useState("Amara Okafor");
  const [email, setEmail] = useState("amara.okafor@student.edu.ng");
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [dirty, setDirty] = useState(false);

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    toast.success("Profile updated");
  };

  return (
    <SettingsCard
      icon={UserIcon}
      title="Profile"
      description="Your personal details and how reps reach you."
      action={
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer"
        >
          Save
        </button>
      }
    >
      {/* Avatar + identity. */}
      <div className="flex items-center gap-4 border-b border-cloud pb-5">
        <UserAvatar name={name} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">
            Computer Science · 300 level · CSC/2021/045
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Full name" value={name} onChange={edit(setName)} />
        </div>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={edit(setEmail)}
        />
        <Field label="Phone" value={phone} onChange={edit(setPhone)} />

        {/* School-managed, read-only. */}
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Matric number
          </Label>
          <div className="mt-1.5 flex h-11 items-center rounded-2xl border border-cloud bg-paper px-4 text-sm text-ink-soft">
            CSC/2021/045
          </div>
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Department
          </Label>
          <div className="mt-1.5 flex h-11 items-center rounded-2xl border border-cloud bg-paper px-4 text-sm text-ink-soft">
            Computer Science
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        Matric number and department are set by your school. Contact your rep to
        correct them.
      </p>
    </SettingsCard>
  );
}
