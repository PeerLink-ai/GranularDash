import type React from "react"
import { Sidebar } from "./sidebar"
import { TopNav } from "./top-nav"
import MobileNav from "./mobile-nav"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-[1000] rounded bg-primary px-3 py-2 text-primary-foreground"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <TopNav />
        <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
