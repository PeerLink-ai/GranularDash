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
  Menu,
  ChevronDown,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, toggleSidebar, state } = useSidebar()
  const { user } = useAuth()

  if (!user) return null

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
    { title: "Billing", href: "/billing", icon: CreditCard },
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Help", href: "/help", icon: HelpCircle },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar" data-onboarding="sidebar">
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          {state === "expanded" && (
            <Link href="/" className="flex items-center font-semibold text-lg">
              Granular
            </Link>
          )}
          {!isMobile && (
            <Button variant="ghost" size="sm" className="h-8 w-8" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          )}
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
                          isActive={pathname === item.href}
                          tooltip={item.title}
                          className={`
                            relative px-4 py-2 mx-2 rounded-md transition-all duration-200 ease-in-out
                            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                            data-[active=true]:bg-primary/10 data-[active=true]:text-primary 
                            data-[active=true]:font-semibold data-[active=true]:shadow-sm
                            before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 
                            before:bg-primary before:rounded-r-full before:opacity-0 before:transition-opacity
                            data-[active=true]:before:opacity-100
                          `}
                        >
                          <Link
                            href={item.href}
                            data-onboarding={
                              item.href === "/analytics"
                                ? "analytics-link"
                                : item.href === "/compliance-reports"
                                  ? "compliance-link"
                                  : item.href === "/users-roles"
                                    ? "users-link"
                                    : undefined
                            }
                          >
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
                isActive={pathname === item.href}
                tooltip={item.title}
                className={`
                  relative px-4 py-2 mx-2 rounded-md transition-all duration-200 ease-in-out
                  hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  data-[active=true]:bg-primary/10 data-[active=true]:text-primary 
                  data-[active=true]:font-semibold data-[active=true]:shadow-sm
                  before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 
                  before:bg-primary before:rounded-r-full before:opacity-0 before:transition-opacity
                  data-[active=true]:before:opacity-100
                `}
              >
                <Link href={item.href}>
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
