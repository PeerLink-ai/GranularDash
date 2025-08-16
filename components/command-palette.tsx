"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  BarChart2,
  Building2,
  FolderKanban,
  Video,
  Shield,
  FileText,
  Key,
  CreditCard,
  Search,
  Plus,
  Play,
  Pause,
  Download,
  Trash2,
  Edit,
  RefreshCw,
  Zap,
  Clock,
  Star,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const [favoriteCommands, setFavoriteCommands] = useState<string[]>([])

  // Load recent and favorite commands from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("command-palette-recent")
    const favorites = localStorage.getItem("command-palette-favorites")

    if (recent) setRecentCommands(JSON.parse(recent))
    if (favorites) setFavoriteCommands(JSON.parse(favorites))
  }, [])

  const addToRecent = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 10)
      localStorage.setItem("command-palette-recent", JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((commandId: string) => {
    setFavoriteCommands((prev) => {
      const updated = prev.includes(commandId) ? prev.filter((id) => id !== commandId) : [...prev, commandId]
      localStorage.setItem("command-palette-favorites", JSON.stringify(updated))
      return updated
    })
  }, [])

  const commands = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      description: "View main dashboard overview",
      icon: Home,
      action: () => router.push("/"),
      category: "Navigation",
      keywords: ["home", "overview", "main"],
      shortcut: "⌘+1",
    },
    {
      id: "nav-analytics",
      label: "Go to Analytics",
      description: "View advanced analytics and insights",
      icon: BarChart2,
      action: () => router.push("/analytics"),
      category: "Navigation",
      keywords: ["charts", "data", "insights"],
      shortcut: "⌘+2",
    },
    {
      id: "nav-agents",
      label: "Go to Agent Management",
      description: "Manage and monitor AI agents",
      icon: Building2,
      action: () => router.push("/agent-management"),
      category: "Navigation",
      keywords: ["ai", "bots", "manage"],
      shortcut: "⌘+3",
    },
    {
      id: "nav-training",
      label: "Go to Training & Simulation",
      description: "Access training modules and simulations",
      icon: Video,
      action: () => router.push("/training-simulation"),
      category: "Navigation",
      keywords: ["learn", "practice", "simulate"],
      shortcut: "⌘+4",
    },

    // Quick Actions
    {
      id: "action-connect-agent",
      label: "Connect New Agent",
      description: "Add a new AI agent to your workspace",
      icon: Plus,
      action: () => {
        router.push("/agent-management")
        // Trigger connect modal
        setTimeout(() => {
          const event = new CustomEvent("open-connect-modal")
          window.dispatchEvent(event)
        }, 100)
      },
      category: "Quick Actions",
      keywords: ["add", "new", "create"],
      badge: "Popular",
    },
    {
      id: "action-create-project",
      label: "Create New Project",
      description: "Start a new project workspace",
      icon: FolderKanban,
      action: () => router.push("/projects?action=create"),
      category: "Quick Actions",
      keywords: ["new", "workspace", "start"],
    },
    {
      id: "action-export-data",
      label: "Export Analytics Data",
      description: "Download analytics data as CSV or PDF",
      icon: Download,
      action: async () => {
        try {
          const response = await fetch("/api/analytics/export")
          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast({ title: "Success", description: "Analytics data exported successfully" })
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to export data", variant: "destructive" })
        }
      },
      category: "Quick Actions",
      keywords: ["download", "csv", "pdf", "backup"],
    },
    {
      id: "action-refresh-data",
      label: "Refresh All Data",
      description: "Reload data across all dashboards",
      icon: RefreshCw,
      action: () => {
        window.location.reload()
      },
      category: "Quick Actions",
      keywords: ["reload", "update", "sync"],
      shortcut: "⌘+R",
    },

    // Agent Management
    {
      id: "agent-start-all",
      label: "Start All Agents",
      description: "Activate all inactive agents",
      icon: Play,
      action: async () => {
        try {
          await fetch("/api/agents/bulk-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start", filter: "inactive" }),
          })
          toast({ title: "Success", description: "All agents started successfully" })
        } catch (error) {
          toast({ title: "Error", description: "Failed to start agents", variant: "destructive" })
        }
      },
      category: "Agent Management",
      keywords: ["activate", "run", "enable"],
    },
    {
      id: "agent-pause-all",
      label: "Pause All Agents",
      description: "Temporarily stop all active agents",
      icon: Pause,
      action: async () => {
        try {
          await fetch("/api/agents/bulk-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause", filter: "active" }),
          })
          toast({ title: "Success", description: "All agents paused successfully" })
        } catch (error) {
          toast({ title: "Error", description: "Failed to pause agents", variant: "destructive" })
        }
      },
      category: "Agent Management",
      keywords: ["stop", "halt", "disable"],
    },

    // System Actions
    {
      id: "system-clear-cache",
      label: "Clear System Cache",
      description: "Clear application cache and temporary data",
      icon: Trash2,
      action: () => {
        localStorage.clear()
        sessionStorage.clear()
        toast({ title: "Success", description: "System cache cleared" })
      },
      category: "System",
      keywords: ["clean", "reset", "memory"],
    },
    {
      id: "system-toggle-theme",
      label: "Toggle Dark Mode",
      description: "Switch between light and dark themes",
      icon: Zap,
      action: () => {
        const theme = document.documentElement.classList.contains("dark") ? "light" : "dark"
        document.documentElement.classList.toggle("dark")
        localStorage.setItem("theme", theme)
        toast({ title: "Success", description: `Switched to ${theme} mode` })
      },
      category: "System",
      keywords: ["theme", "appearance", "ui"],
      shortcut: "⌘+Shift+L",
    },

    // Settings & Account
    {
      id: "settings-profile",
      label: "Edit Profile",
      description: "Update your profile information",
      icon: Edit,
      action: () => router.push("/settings?tab=profile"),
      category: "Settings",
      keywords: ["account", "user", "personal"],
    },
    {
      id: "settings-billing",
      label: "View Billing",
      description: "Manage subscription and billing",
      icon: CreditCard,
      action: () => router.push("/billing"),
      category: "Settings",
      keywords: ["payment", "subscription", "invoice"],
    },
    {
      id: "settings-security",
      label: "Security Settings",
      description: "Manage security and access controls",
      icon: Shield,
      action: () => router.push("/settings?tab=security"),
      category: "Settings",
      keywords: ["password", "2fa", "access"],
    },

    // Help & Support
    {
      id: "help-docs",
      label: "View Documentation",
      description: "Access help documentation and guides",
      icon: FileText,
      action: () => router.push("/help"),
      category: "Help",
      keywords: ["guide", "manual", "support"],
      shortcut: "⌘+?",
    },
    {
      id: "help-shortcuts",
      label: "Keyboard Shortcuts",
      description: "View all available keyboard shortcuts",
      icon: Key,
      action: () => {
        // Show shortcuts modal
        const event = new CustomEvent("show-shortcuts")
        window.dispatchEvent(event)
      },
      category: "Help",
      keywords: ["hotkeys", "commands", "keys"],
      shortcut: "⌘+/",
    },
  ]

  const filteredCommands = commands.filter((command) => {
    if (!query) return true

    const searchText = query.toLowerCase()
    return (
      command.label.toLowerCase().includes(searchText) ||
      command.description?.toLowerCase().includes(searchText) ||
      command.keywords?.some((keyword) => keyword.includes(searchText)) ||
      command.category.toLowerCase().includes(searchText)
    )
  })

  const groupedCommands = filteredCommands.reduce(
    (groups, command) => {
      const category = command.category
      if (!groups[category]) groups[category] = []
      groups[category].push(command)
      return groups
    },
    {} as Record<string, any[]>,
  )

  const recentItems = commands.filter((cmd) => recentCommands.includes(cmd.id))
  const favoriteItems = commands.filter((cmd) => favoriteCommands.includes(cmd.id))

  const executeCommand = async (command: any) => {
    try {
      await command.action()
      addToRecent(command.id)
      onOpenChange(false)
      setQuery("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <Command className="rounded-lg border-0 shadow-lg">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Type a command or search..."
              value={query}
              onValueChange={setQuery}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No commands found.</CommandEmpty>

            {!query && favoriteItems.length > 0 && (
              <CommandGroup heading="Favorites">
                {favoriteItems.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => executeCommand(command)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {command.icon && <command.icon className="h-4 w-4 opacity-70" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{command.label}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {command.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {command.badge}
                          </Badge>
                        )}
                      </div>
                      {command.description && (
                        <p className="text-xs text-muted-foreground truncate">{command.description}</p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {command.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!query && recentItems.length > 0 && (
              <CommandGroup heading="Recent">
                {recentItems.slice(0, 5).map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => executeCommand(command)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {command.icon && <command.icon className="h-4 w-4 opacity-70" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{command.label}</span>
                        <Clock className="h-3 w-3 opacity-50" />
                        {command.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {command.badge}
                          </Badge>
                        )}
                      </div>
                      {command.description && (
                        <p className="text-xs text-muted-foreground truncate">{command.description}</p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        {command.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {Object.entries(groupedCommands).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => executeCommand(command)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {command.icon && <command.icon className="h-4 w-4 opacity-70" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{command.label}</span>
                        {favoriteCommands.includes(command.id) && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                        {command.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {command.badge}
                          </Badge>
                        )}
                      </div>
                      {command.description && (
                        <p className="text-xs text-muted-foreground truncate">{command.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(command.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-yellow-500 transition-opacity"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      {command.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {command.shortcut}
                        </kbd>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
