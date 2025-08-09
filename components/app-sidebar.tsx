"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BarChart2,
  Building2,
  FolderKanban,
  GitFork,
  Video,
  Shield,
  FileText,
  Receipt,
  MessageSquare,
  Users2,
  Key,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user } = useAuth()

  if (!user) return null

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href))

  // Consolidated navigation
  const navigationGroups = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/", icon: Home },
        { title: "Projects", href: "/projects", icon: FolderKanban },
        { title: "Analytics", href: "/analytics", icon: BarChart2 },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Agent Management", href: "/agent-management", icon: Building2 },
        { title: "Training & Simulation", href: "/training-simulation", icon: Video },
        { title: "Data & Model Lineage", href: "/data-model-lineage", icon: GitFork },
      ],
    },
    {
      label: "Governance",
      items: [
        { title: "Policies & Rules", href: "/policies-rules", icon: Shield },
        { title: "Audit Logs", href: "/audit-logs", icon: FileText },
        { title: "Compliance Reports", href: "/compliance-reports", icon: Receipt },
        { title: "Risk & Incidents", href: "/incident-response", icon: MessageSquare },
      ],
    },
    {
      label: "Access",
      items: [
        { title: "Users & Roles", href: "/users-roles", icon: Users2 },
        { title: "Access Control", href: "/access-control", icon: Key },
      ],
    },
  ]

  const bottomNavigation = [
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Help", href: "/help", icon: HelpCircle },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          {state === "expanded" ? (
            <Link href="/" className="flex items-center font-semibold text-lg" aria-label="Granular Home">
              <span>Granular</span>
            </Link>
          ) : (
            <Link href="/" className="sr-only" aria-label="Granular Home">
              Granular
            </Link>
          )}
          {/* Use the shared SidebarTrigger for consistent mobile/desktop toggling */}
          <SidebarTrigger aria-label="Toggle sidebar" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <Collapsible key={group.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  <span>{group.label}</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent className="px-0">
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.title}
                          className="px-4 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
                        >
                          <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomNavigation.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.title}
                className="px-4 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
              >
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
