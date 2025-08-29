"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LineChart,
  Bot,
  Shield,
  MoreHorizontal,
  FolderKanban,
  Landmark,
  FileText,
  Layers,
  Users,
  Key,
  Settings,
  GitBranch,
  Bug,
  BookOpen,
  Activity,
  Network,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const MAIN: Item[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/agent-management", label: "Agents", icon: Bot },
  { href: "/policies-rules", label: "Policies", icon: Shield },
]

const MORE_GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Projects",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/data-model-lineage", label: "Lineage", icon: Layers },
      { href: "/agent-lineage", label: "Agent Lineage", icon: Network },
      { href: "/audit-logs", label: "Audit Logs", icon: FileText },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/training-simulation", label: "Training", icon: BookOpen },
      { href: "/incident-response", label: "Incidents", icon: Bug },
      { href: "/compliance-reports", label: "Compliance", icon: Landmark },
      { href: "/governance", label: "Governance", icon: GitBranch },
    ],
  },
  {
    title: "Access",
    items: [
      { href: "/users-roles", label: "Users & Roles", icon: Users },
      { href: "/access-control", label: "Access Control", icon: Key },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/billing", label: "Billing", icon: Activity },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const isActive = (href: string) => (pathname === href ? "text-foreground" : "text-muted-foreground")

  const [open, setOpen] = React.useState(false)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5">
        {MAIN.slice(0, 4).map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center gap-1 py-2"
              aria-label={item.label}
            >
              <Icon className={`h-5 w-5 ${isActive(item.href)}`} />
              <span className={`text-[11px] ${isActive(item.href)}`}>{item.label}</span>
            </Link>
          )
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="group flex flex-col items-center justify-center gap-1 py-2" aria-label="More">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid gap-6">
              {MORE_GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">{g.title}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.items.map((it) => {
                      const Icon = it.icon
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{it.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
