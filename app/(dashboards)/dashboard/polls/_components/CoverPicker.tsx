"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * A wide banner slot for the poll's hero cover photo — same upload contract as
 * `PhotoPicker`, just shaped for a hero image instead of a circular avatar.
 */
export function CoverPicker({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={imageUrl ? "Change cover photo" : "Add cover photo"}
        className={cn(
          "group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-cloud bg-paper text-ink-soft transition-colors duration-300 hover:border-brand/50 hover:text-brand disabled:cursor-wait cursor-pointer",
          imageUrl && "border-solid",
        )}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <HugeiconsIcon icon={Image02Icon} size={22} />
            <span className="text-xs font-medium">Add a cover photo</span>
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </span>
        )}
        {imageUrl && !uploading && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="text-xs font-semibold text-white">Change</span>
          </span>
        )}
      </button>
      {imageUrl && onRemove && !uploading && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove cover photo"
          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-canvas text-ink-soft shadow-sm ring-1 ring-cloud transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={13} />
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
