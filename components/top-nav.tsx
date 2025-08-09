"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Settings, LogOut, UserCog } from "lucide-react"
import Link from "next/link"

const ROLES = ["admin", "developer", "analyst", "viewer"] as const
type Role = (typeof ROLES)[number]

export function TopNav() {
  const { user, signOut } = useAuth()
  const [previewRole, setPreviewRole] = useState<Role | null>(null)

  useEffect(() => {
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

  const effectiveRole = useMemo<Role | null>(() => {
    if (!user) return null
    return (previewRole || (user.role as Role)) ?? null
  }, [user, previewRole])

  if (!user) return null

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-semibold truncate">AI Governance Dashboard</h2>
          {effectiveRole && (
            <Badge className={getRoleColor(effectiveRole)} variant="secondary">
              {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <UserCog className="h-4 w-4" />
                Preview role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Preview as</DropdownMenuLabel>
              {ROLES.map((r) => (
                <DropdownMenuItem key={r} onClick={() => applyPreviewRole(r)}>
                  {r === effectiveRole ? "✓ " : ""} {r}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => applyPreviewRole(null)}>Clear preview</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Account menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
  )
}
