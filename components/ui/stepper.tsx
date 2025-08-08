"use client"

import { cn } from "@/lib/utils"

interface StepperProps {
  steps: string[]
  current: number
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {steps.map((label, idx) => {
        const active = idx <= current
        const isLast = idx === steps.length - 1
        return (
          <div key={label} className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
              aria-current={idx === current ? "step" : undefined}
              aria-label={label}
              role="listitem"
            >
              {idx + 1}
            </div>
            <div className="text-sm truncate">
              <span className={cn("font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-px w-10 sm:w-16",
                  active ? "bg-primary/60" : "bg-muted"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
