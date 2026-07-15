"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * A small square photo slot for a poll category/nominee row. Picking a file
 * hands it straight to `onUpload` (which does the actual network call — either
 * an immediate `uploadPollImage` for a new poll, or upload-then-PATCH for an
 * existing one) and shows a spinner until it resolves.
 */
export function PhotoPicker({
  imageUrl,
  label,
  size = 40,
  onUpload,
  onRemove,
}: {
  imageUrl?: string | null;
  label: string;
  size?: number;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const onSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is too large.", { description: "Max size is 2 MB." });
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      toast.error("Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        aria-label={imageUrl ? `Change ${label} photo` : `Add ${label} photo`}
        className={cn(
          "group relative grid place-items-center overflow-hidden rounded-full border border-dashed border-cloud bg-paper text-ink-soft transition-colors duration-300 hover:border-brand/50 hover:text-brand disabled:cursor-wait cursor-pointer",
          imageUrl && "border-solid border-cloud",
        )}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <HugeiconsIcon icon={Camera01Icon} size={Math.round(size * 0.4)} />
        )}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </span>
        )}
        {imageUrl && !uploading && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <HugeiconsIcon icon={Camera01Icon} size={Math.round(size * 0.35)} className="text-white" />
          </span>
        )}
      </button>
      {imageUrl && onRemove && !uploading && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} photo`}
          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-canvas text-ink-soft shadow-sm ring-1 ring-cloud transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={11} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onSelected}
      />
    </div>
  );
}
