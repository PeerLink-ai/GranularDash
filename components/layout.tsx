"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "./app-sidebar"
import { TopNav } from "./top-nav"
import { BreadcrumbNavigation } from "./breadcrumb-navigation"
import MobileNav from "./mobile-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      const currentPath = window.location.pathname
      // Don't redirect if already on auth pages
      if (!currentPath.startsWith("/auth/")) {
        router.push("/auth/signin")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-[1000] rounded bg-primary px-3 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main content area */}
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          {/* Top navigation */}
          <TopNav />

          <BreadcrumbNavigation />

          {/* Main content with proper mobile padding */}
          <main id="main-content" className="flex-1 overflow-auto p-4 pb-20 md:pb-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>

        {/* Mobile bottom navigation - only visible on mobile */}
        <MobileNav />
      </div>
    </SidebarProvider>
  )
}
