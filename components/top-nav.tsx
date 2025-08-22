"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, User, CreditCard, FolderKanban, Home, BarChart2, UserCog, Settings, LogOut } from "lucide-react"
import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandPalette } from "@/components/command-palette"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"

type SearchResult = {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  meta?: string
}

const NAV_LINKS: SearchResult[] = [
  { id: "home", label: "Dashboard", href: "/", icon: Home, meta: "Overview" },
  { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban, meta: "Overview" },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart2, meta: "Overview" },
  { id: "agent-mgmt", label: "Agent Management", href: "/agent-management", meta: "Operations" },
  { id: "training", label: "Training & Simulation", href: "/training-simulation", meta: "Operations" },
  { id: "lineage", label: "Data & Model Lineage", href: "/data-model-lineage", meta: "Operations" },
  { id: "policies", label: "Policies & Rules", href: "/policies-rules", meta: "Governance" },
  { id: "audit", label: "Audit Logs", href: "/audit-logs", meta: "Governance" },
  { id: "compliance", label: "Compliance Reports", href: "/compliance-reports", meta: "Governance" },
  { id: "incidents", label: "Risk & Incidents", href: "/incident-response", meta: "Governance" },
  { id: "users-roles", label: "Users & Roles", href: "/users-roles", meta: "Access" },
  { id: "access", label: "Access Control", href: "/access-control", meta: "Access" },
  { id: "billing", label: "Billing", href: "/billing", icon: CreditCard, meta: "Account" },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, meta: "Account" },
  { id: "help", label: "Help & Support", href: "/help", meta: "Support" },
  { id: "api-docs", label: "API Documentation", href: "/api-docs", meta: "Developer" },
  { id: "connect-agent", label: "Connect Agent", href: "/connect-agent", meta: "Quick Action" },
]

const ROLES = ["admin", "developer", "analyst", "viewer"] as const
type Role = (typeof ROLES)[number]

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function TopNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [previewRole, setPreviewRole] = React.useState<Role | null>(null)

  const [showCommandPalette, setShowCommandPalette] = React.useState(false)

  // Search state
  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebouncedValue(query, 200)
  const [open, setOpen] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Role preview logic
  React.useEffect(() => {
    const stored = localStorage.getItem("rolePreview") as Role | null
    if (stored && ROLES.includes(stored)) {
      setPreviewRole(stored)
      document.body.dataset.role = stored
    }
  }, [])

  function applyPreviewRole(role: Role | null) {
    setPreviewRole(role)
    if (role) {
      localStorage.setItem("rolePreview", role)
      document.body.dataset.role = role
      window.dispatchEvent(new CustomEvent("role-preview-change", { detail: { role } }))
    } else {
      localStorage.removeItem("rolePreview")
      delete document.body.dataset.role
      window.dispatchEvent(new CustomEvent("role-preview-change", { detail: { role: null } }))
    }
  }

  const effectiveRole = React.useMemo<Role | null>(() => {
    if (!user) return null
    return (previewRole || (user.role as Role)) ?? null
  }, [user, previewRole])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "developer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "analyst":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  // Enhanced search with projects and agents
  React.useEffect(() => {
    let cancelled = false
    async function run() {
      const q = debouncedQuery.trim().toLowerCase()
      if (!q) {
        const quickLinks = NAV_LINKS.slice(0, 6)
        if (!cancelled) {
          setResults(quickLinks)
          setActiveIndex(0)
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)

      const filteredNav = NAV_LINKS.filter(
        (item) => item.label.toLowerCase().includes(q) || item.meta?.toLowerCase().includes(q),
      )

      let projectResults: SearchResult[] = []
      let agentResults: SearchResult[] = []

      try {
        // Fetch projects
        const [projectsRes, agentsRes] = await Promise.allSettled([
          Promise.race([
            fetch("/api/projects", { method: "GET" }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000)),
          ]) as Promise<Response>,
          Promise.race([
            fetch("/api/agents", { method: "GET" }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000)),
          ]) as Promise<Response>,
        ])

        // Process projects
        if (projectsRes.status === "fulfilled" && projectsRes.value.ok) {
          const data = await projectsRes.value.json()
          const items: any[] = Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : []
          projectResults = items
            .filter((p) => typeof p?.name === "string" && p.name.toLowerCase().includes(q))
            .map((p) => ({
              id: `project-${p.id ?? p.name}`,
              label: p.name,
              href: `/projects?focus=${encodeURIComponent(p.id ?? p.name)}`,
              icon: FolderKanban,
              meta: "Project",
            }))
            .slice(0, 4)
        }

        // Process agents
        if (agentsRes.status === "fulfilled" && agentsRes.value.ok) {
          const data = await agentsRes.value.json()
          const items: any[] = Array.isArray(data?.agents) ? data.agents : Array.isArray(data) ? data : []
          agentResults = items
            .filter((a) => typeof a?.name === "string" && a.name.toLowerCase().includes(q))
            .map((a) => ({
              id: `agent-${a.id ?? a.name}`,
              label: a.name,
              href: `/agent-management?focus=${encodeURIComponent(a.id ?? a.name)}`,
              meta: "Agent",
            }))
            .slice(0, 4)
        }
      } catch {
        // Ignore network errors
      }

      const merged = [...filteredNav.slice(0, 6), ...projectResults, ...agentResults]
      if (!cancelled) {
        setResults(merged)
        setActiveIndex(0)
        setIsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function onSelectResult(item: SearchResult) {
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
    router.push(item.href)
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault()
    const first = results[activeIndex] || results[0]
    if (first) onSelectResult(first)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    if (value.trim()) {
      setOpen(true)
    }
  }

  function handleInputFocus() {
    if (query.trim() || results.length > 0) {
      setOpen(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) {
        setOpen(true)
      } else {
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (open) {
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (open && results.length > 0) {
        const item = results[activeIndex] || results[0]
        if (item) onSelectResult(item)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  // Handle popover open change
  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setActiveIndex(0)
    }
  }

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowCommandPalette(true)
      } else if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!user) return null

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Hamburger to toggle sidebar */}
          <SidebarTrigger className="h-9 w-9" aria-label="Toggle navigation" />

          {/* Brand and role badge */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="font-semibold text-lg truncate">
              Granular
            </Link>
            {effectiveRole && (
              <Badge className={getRoleColor(effectiveRole)} variant="secondary">
                {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
              </Badge>
            )}
          </div>

          {/* Enhanced Search */}
          <div className="relative flex-1 max-w-lg">
            <Popover open={open} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls="search-command"
                    aria-autocomplete="list"
                    placeholder="Search pages, projects, agents... (⌘/)"
                    className="w-full pl-10 pr-4 h-9"
                    data-onboarding="search-input"
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,40rem)] p-0" align="start" sideOffset={8}>
                <CommandPrimitive shouldFilter={false} id="search-command">
                  <CommandList className="max-h-80">
                    {results.length === 0 && !isLoading ? (
                      <CommandEmpty>No results found for "{query}"</CommandEmpty>
                    ) : (
                      <>
                        {results.length > 0 && (
                          <CommandGroup heading="Search Results">
                            {results.map((item, idx) => {
                              const Icon = item.icon
                              const isActive = idx === activeIndex
                              return (
                                <CommandItem
                                  key={item.id}
                                  value={item.href}
                                  onSelect={() => onSelectResult(item)}
                                  onMouseEnter={() => setActiveIndex(idx)}
                                  className={isActive ? "bg-accent text-accent-foreground" : ""}
                                >
                                  {Icon ? (
                                    <Icon className="mr-3 h-4 w-4 shrink-0 opacity-80" />
                                  ) : (
                                    <Search className="mr-3 h-4 w-4 opacity-50" />
                                  )}
                                  <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">{item.label}</span>
                                    {item.meta && <span className="text-xs text-muted-foreground">{item.meta}</span>}
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        )}
                        <CommandSeparator />
                        <CommandGroup heading="Quick Actions">
                          <CommandItem
                            onSelect={() =>
                              onSelectResult({
                                id: "connect",
                                label: "Connect New Agent",
                                href: "/connect-agent",
                                meta: "Quick Action",
                              })
                            }
                          >
                            <UserCog className="mr-3 h-4 w-4 opacity-80" />
                            <span>Connect New Agent</span>
                          </CommandItem>
                          <CommandItem
                            onSelect={() =>
                              onSelectResult({
                                id: "projects",
                                label: "Create New Project",
                                href: "/projects",
                                meta: "Quick Action",
                              })
                            }
                          >
                            <FolderKanban className="mr-3 h-4 w-4 opacity-80" />
                            <span>Create New Project</span>
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </CommandPrimitive>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Role Preview Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <UserCog className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview Role</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Preview as Role</DropdownMenuLabel>
                {ROLES.map((role) => (
                  <DropdownMenuItem key={role} onClick={() => applyPreviewRole(role)}>
                    {role === effectiveRole ? "✓ " : ""} {role.charAt(0).toUpperCase() + role.slice(1)}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyPreviewRole(null)}>Clear Preview</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <OnboardingTrigger />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                  aria-label="Account menu"
                  data-onboarding="profile-menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("") || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.organization}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} />
    </>
  )
}
