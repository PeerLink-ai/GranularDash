"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BarChart2,
  Building2,
  Folder,
  Receipt,
  Users2,
  Shield,
  Settings,
  HelpCircle,
  Menu,
  ChevronDown,
  FileText,
  Key,
  MessageSquare,
  Video,
  GitFork,
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

  // Define navigation based on user permissions
  const getNavigationForUser = () => {
    const allNavigation = [
      {
        label: "Overview",
        items: [
          { title: "AI Governance Dashboard", href: "/", icon: Home, permission: "view_dashboard" },
          { title: "Behavioral Analytics", href: "/analytics", icon: BarChart2, permission: "view_analytics" },
        ],
      },
      {
        label: "AI Operations",
        items: [
          { title: "Agent Management", href: "/agent-management", icon: Building2, permission: "manage_agents" },
          { title: "Data & Model Lineage", href: "/data-model-lineage", icon: GitFork, permission: "view_analytics" },
          { title: "Training & Simulation", href: "/training-simulation", icon: Video, permission: "test_agents" },
        ],
      },
      {
        label: "Governance & Compliance",
        items: [
          { title: "Policies & Rules", href: "/policies-rules", icon: Folder, permission: "manage_policies" },
          { title: "Audit Logs", href: "/audit-logs", icon: FileText, permission: "view_audit_logs" },
          { title: "Compliance Reports", href: "/compliance-reports", icon: Receipt, permission: "view_reports" },
          { title: "Risk Management", href: "/risk-management", icon: Shield, permission: "view_reports" },
          {
            title: "Incident Response",
            href: "/incident-response",
            icon: MessageSquare,
            permission: "manage_policies",
          },
        ],
      },
      {
        label: "Access & Users",
        items: [
          { title: "Users & Roles", href: "/users-roles", icon: Users2, permission: "manage_users" },
          { title: "Access Control", href: "/access-control", icon: Key, permission: "manage_users" },
        ],
      },
    ]

    // Filter navigation based on user permissions
    return allNavigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => user.permissions.includes(item.permission)),
      }))
      .filter((group) => group.items.length > 0)
  }

  const navigationGroups = getNavigationForUser()

  const bottomNavigation = [
    { title: "Settings", href: "/settings", icon: Settings },
    { title: "Help", href: "/help", icon: HelpCircle },
  ]

  return (
    <Sidebar collapsible="icon" variant="sidebar">
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
                          className="px-4 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
                        >
                          <Link href={item.href}>
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
                className="px-4 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground"
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
