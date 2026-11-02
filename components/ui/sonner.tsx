"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, InformationCircleIcon, Alert02Icon, MultiplicationSignCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "light"}
      position="top-right"
      className="toaster group"
      icons={{
        success: (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-[18px] text-brand" />
        ),
        info: (
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-[18px] text-ink" />
        ),
        warning: (
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-[18px] text-[#e8a33d]" />
        ),
        error: (
          <HugeiconsIcon icon={MultiplicationSignCircleIcon} strokeWidth={2} className="size-[18px] text-rose-600" />
        ),
        loading: (
          <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-[18px] animate-spin text-brand" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--p-canvas)",
          "--normal-text": "var(--p-ink)",
          "--normal-border": "var(--p-cloud)",
          "--border-radius": "1rem",
          "--width": "360px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast font-sans! gap-3! px-4! py-3.5! shadow-[0_12px_32px_-12px_rgba(27,37,32,0.18)]!",
          title: "text-[13.5px]! font-semibold! text-ink!",
          description: "text-[12.5px]! leading-5! text-ink-soft!",
          actionButton:
            "rounded-full! bg-brand! px-3! text-[12px]! font-semibold! text-white!",
          cancelButton:
            "rounded-full! bg-paper! px-3! text-[12px]! font-semibold! text-ink!",
          closeButton: "border-cloud! bg-canvas! text-ink-soft!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
