"use client"

import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { TopNav } from "./top-nav"
import MobileNav from "./mobile-nav"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-[1000] rounded bg-primary px-3 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        {/* Desktop-only sidebar. AppSidebar returns null on mobile. */}
        <AppSidebar />

        {/* Main content area */}
        <SidebarInset className="pb-24 md:pb-0">
          {/* Sticky header */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
              {/* Desktop-only collapse trigger */}
              <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle sidebar" />
              <div className="flex-1 min-w-0">
                <TopNav />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main id="main-content" className="container mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
            {children}
          </main>

          {/* Bottom app navbar (mobile only) */}
          <MobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
