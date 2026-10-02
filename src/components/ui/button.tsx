import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Sistem tombol gaya Apple: bentuk pil, hierarki jelas, gerak singkat dan jujur.
//  - default   : aksi utama, satu per area (oranye tua, teks putih, kontras 5.2:1)
//  - secondary : aksi pendamping di atas ubin abu muda
//  - outline   : aksi lain dengan garis tipis
//  - ghost     : aksi ringan tanpa bidang, bidang muncul saat disorot
//  - destructive: aksi merusak, bidang merah muda (bukan merah penuh)
//  - link      : tindakan berupa teks
// Keadaan: sorot (gelap 10%), tekan (mengecil 3%, segera), fokus (cincin biru berjarak), nonaktif (pudar).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap select-none outline-none " +
    "transition-[background-color,color,box-shadow,border-color,transform] duration-200 ease-out " +
    "motion-safe:active:scale-[0.97] motion-safe:active:duration-100 " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40 " +
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] hover:bg-[color-mix(in_oklch,var(--primary),black_14%)]",
        secondary:
          "bg-tile text-foreground hover:bg-zinc-200/80 aria-expanded:bg-zinc-200/80",
        outline:
          "border-zinc-300 bg-background text-foreground hover:border-zinc-400 hover:bg-zinc-900/[0.04] aria-expanded:bg-zinc-900/[0.06]",
        ghost:
          "text-foreground hover:bg-zinc-900/[0.06] aria-expanded:bg-zinc-900/[0.06]",
        destructive:
          "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/60",
        link: "rounded-md px-0.5 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        xs: "h-8 gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 px-7 text-base",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
