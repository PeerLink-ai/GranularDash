"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden group", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      // Container
      "flex touch-none select-none bg-transparent m-1 rounded-full",
      "transition-[opacity,width,height] duration-200 ease-out",
      "opacity-0 group-hover:opacity-100 data-[state=visible]:opacity-100",
      // Size per orientation with a subtle grow on hover
      orientation === "vertical" && "h-[calc(100%-0.5rem)] w-2 group-hover:w-2.5 border-l border-l-transparent",
      orientation === "horizontal" &&
        "w-[calc(100%-0.5rem)] h-2 group-hover:h-2.5 flex-col border-t border-t-transparent",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-full",
        // Glassy neutral gradient with light ring and subtle shadow
        "bg-gradient-to-br from-neutral-300/70 to-neutral-400/70",
        "dark:from-neutral-700/60 dark:to-neutral-600/60",
        "backdrop-blur-[2px] ring-1 ring-black/5 dark:ring-white/10",
        "shadow-[0_1px_6px_rgb(0_0_0/0.20)]",
        // Hover/focus states
        "transition-colors",
        "hover:from-neutral-300/90 hover:to-neutral-500/90",
        "dark:hover:from-neutral-600/80 dark:hover:to-neutral-500/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/40",
        // Min size to keep thumb easy to grab
        orientation === "vertical" ? "min-h-8" : "min-w-8",
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
