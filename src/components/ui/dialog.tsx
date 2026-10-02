"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/40 duration-150 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className)}
      {...props}
    />
  )
}

/** Panel modal: tengah layar di desktop, menempel di bawah (lembar) di HP; isi panjang bergulir di dalam. */
function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-popover text-popover-foreground shadow-[0_24px_80px_rgb(0_0_0/0.22)] ring-1 ring-foreground/10 outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-6 data-closed:animate-out data-closed:fade-out-0 sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-h-[88dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-open:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:size-11">
          <XIcon aria-hidden className="size-5" />
          <span className="sr-only">Tutup</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("shrink-0 border-b px-6 pt-6 pb-5 pr-16", className)} {...props} />
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("font-heading text-2xl leading-tight font-medium tracking-[-0.02em]", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("mt-1.5 text-[15px] text-muted-foreground", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription }
