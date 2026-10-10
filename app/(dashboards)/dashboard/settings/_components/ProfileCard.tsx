"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Camera01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { updateProfile, uploadAvatar } from "@/lib/api/me";
import { ApiError } from "@/lib/api/errors";
import { BRAND_INPUT } from "../../_components/form-styles";
import { UserAvatar } from "../../_components/UserAvatar";
import { SettingsCard } from "./SettingsCard";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const pickAvatar = () => fileInputRef.current?.click();

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("That image is too large.", { description: "Max size is 2 MB." });
      return;
    }

    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't upload that image.",
      );
    } finally {
      setUploadingAvatar(false);
    }
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

  const meta =
    [user?.level ? `${user.level} level` : null, user?.matricNo].filter(Boolean).join(" · ") ||
    "Your account";

  return (
    <>
    {/* Phones: a profile cover — doodle banner, avatar overlapping with a camera button. */}
    <section className="overflow-hidden rounded-3xl border border-cloud bg-canvas sm:hidden">
      <div className="doodle-card h-24" />
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={pickAvatar}
          disabled={uploadingAvatar}
          aria-label="Change avatar"
          className="relative -mt-10 block rounded-full ring-4 ring-canvas cursor-pointer disabled:cursor-wait"
        >
          <UserAvatar name={name || "?"} src={user?.avatarUrl} size={76} />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-brand text-white ring-2 ring-canvas">
            {uploadingAvatar ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={Camera01Icon} size={14} />
            )}
          </span>
        </button>
        <p className="mt-3 truncate text-lg font-semibold tracking-tight text-ink">{name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">{meta}</p>
        {user?.email && <p className="mt-0.5 truncate text-xs text-ink-soft">{user.email}</p>}
      </div>
    </section>

    <SettingsCard
      icon={UserIcon}
      title="Profile"
      description="Your personal details and how reps reach you."
      action={
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-50 cursor-pointer max-sm:hidden"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      {/* Avatar + identity (phones get the cover above instead). */}
      <div className="hidden items-center gap-4 border-b border-cloud pb-5 sm:flex">
        <button
          type="button"
          onClick={pickAvatar}
          disabled={uploadingAvatar}
          aria-label="Change avatar"
          className="group relative shrink-0 cursor-pointer rounded-full disabled:cursor-wait"
        >
          <UserAvatar name={name || "?"} src={user?.avatarUrl} size={56} />
          <span
            className={cn(
              "absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              uploadingAvatar && "opacity-100",
            )}
          >
            {uploadingAvatar ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={Camera01Icon} size={18} />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onAvatarSelected}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink-soft">{meta}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:mt-5">
        <div className="col-span-2">
          <Field label="Full name" value={name} onChange={edit(setName)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={edit(setEmail)}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Phone" value={phone} onChange={edit(setPhone)} />
        </div>

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

    {/* Phones: Save rides above the tab bar once something's changed. */}
    <AnimatePresence>
      {dirty && (
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
