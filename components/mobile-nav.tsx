"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Building2, Shield, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/agent-management", label: "Agents", icon: Building2 },
  { href: "/policies-rules", label: "Policies", icon: Shield },
  { href: "/billing", label: "Billing", icon: CreditCard },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                active ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className={cn("font-medium", active && "text-primary")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
