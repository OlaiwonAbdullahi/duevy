"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Phone bottom-sheet look for `sheetOnMobile`: pinned to the bottom edge,
 * full width, rounded top, sliding up instead of zooming in.
 */
const SHEET_ON_MOBILE =
  "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[28px] max-sm:border-x-0 max-sm:border-b-0 max-sm:pt-7 max-sm:duration-300 max-sm:data-open:slide-in-from-bottom max-sm:data-open:zoom-in-100 max-sm:data-closed:slide-out-to-bottom max-sm:data-closed:zoom-out-100"

/** How far (px) the sheet has to be dragged down before letting go closes it. */
const SHEET_DISMISS_DISTANCE = 110

function DialogContent({
  className,
  children,
  showCloseButton = true,
  sheetOnMobile = false,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  /** Below the `sm` breakpoint, render as a draggable bottom sheet. */
  sheetOnMobile?: boolean
}) {
  // Swipe-to-dismiss on the sheet's handle; closing goes through a hidden
  // Close so the Root's onOpenChange fires as usual.
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const startY = React.useRef<number | null>(null)
  const [dragY, setDragY] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)

  const endDrag = () => {
    if (startY.current === null) return
    startY.current = null
    setDragging(false)
    if (dragY > SHEET_DISMISS_DISTANCE) closeRef.current?.click()
    setDragY(0)
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        style={
          sheetOnMobile
            ? {
                ...style,
                ...(dragY ? { transform: `translateY(${dragY}px)` } : null),
                transition: dragging ? "none" : "transform 300ms cubic-bezier(0.22,1,0.36,1)",
              }
            : style
        }
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
          sheetOnMobile && SHEET_ON_MOBILE
        )}
        {...props}
      >
        {sheetOnMobile && (
          <>
            <div
              aria-hidden
              onPointerDown={(e) => {
                startY.current = e.clientY
                setDragging(true)
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerMove={(e) => {
                if (startY.current !== null) setDragY(Math.max(0, e.clientY - startY.current))
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="absolute inset-x-16 top-0 z-10 flex h-7 touch-none cursor-grab items-center justify-center active:cursor-grabbing sm:hidden"
            >
              <span className="h-1.5 w-10 rounded-full bg-ink-soft/30" />
            </div>
            <DialogPrimitive.Close ref={closeRef} tabIndex={-1} aria-hidden className="hidden" />
          </>
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              size="icon-sm"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
