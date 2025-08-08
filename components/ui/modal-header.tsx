"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  gradientFrom?: string
  gradientTo?: string
  className?: string
}

export function ModalHeader({
  title,
  description,
  icon: Icon,
  gradientFrom = "from-zinc-900",
  gradientTo = "to-zinc-700",
  className,
}: ModalHeaderProps) {
  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <div
        className={cn(
          "relative h-20 w-full bg-gradient-to-r",
          gradientFrom,
          gradientTo,
          "dark:from-zinc-900 dark:to-zinc-800"
        )}
      >
        <div className="absolute inset-0 [mask-image:radial-gradient(80%_80%_at_100%_0%,black,transparent)]" />
      </div>
      <div className="-mt-10 px-2 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-background shadow-sm grid place-items-center">
            {Icon ? <Icon className="h-5 w-5 text-foreground" /> : <span className="text-lg">•</span>}
          </div>
          <div className="py-2">
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
