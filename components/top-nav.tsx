"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User, Settings, LayoutDashboard } from "lucide-react"

export function TopNav() {
  const { user, signOut, switchUserType } = useAuth()

  if (!user) return null // Don't render top nav if not authenticated

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="relative ml-auto flex-1 md:grow-0">{/* Search functionality can go here if needed */}</div>
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Switch User Role (Demo)</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => switchUserType("admin")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchUserType("developer")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Developer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchUserType("analyst")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Analyst
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchUserType("viewer")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Viewer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
