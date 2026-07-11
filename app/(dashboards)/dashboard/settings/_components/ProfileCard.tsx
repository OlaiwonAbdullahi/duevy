"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { updateProfile } from "@/lib/api/me";
import { ApiError } from "@/lib/api/errors";
import { BRAND_INPUT } from "../../_components/form-styles";
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
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed the form from the signed-in user (GET /auth/me).
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setDirty(false);
  }, [user]);

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Only the editable contact fields; matric/level/role are server-controlled.
      await updateProfile({ name, email, phone: phone || undefined });
      await refreshUser();
      setDirty(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save your profile.",
      );
    } finally {
      setSaving(false);
    }
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
          disabled={!dirty || saving}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      {/* Avatar + identity. */}
      <div className="flex items-center gap-4 border-b border-cloud pb-5">
        <UserAvatar name={name || "?"} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">
            {[user?.level ? `${user.level} level` : null, user?.matricNo]
              .filter(Boolean)
              .join(" · ") || "Your account"}
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
            {user?.matricNo ?? "—"}
          </div>
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Level
          </Label>
          <div className="mt-1.5 flex h-11 items-center rounded-2xl border border-cloud bg-paper px-4 text-sm text-ink-soft">
            {user?.level ?? "—"}
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
