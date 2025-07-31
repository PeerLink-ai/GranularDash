"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LineChart,
  Package,
  Settings,
  ShieldCheck,
  FileText,
  AlertTriangle,
  GitFork,
  Scale,
  BookOpen,
  Activity,
  UserCog,
  Target,
  ReceiptText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      group: "General",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: Home,
        },
        {
          name: "Analytics",
          href: "/analytics",
          icon: LineChart,
        },
        {
          name: "Transactions",
          href: "/transactions",
          icon: ReceiptText,
        },
        {
          name: "Financial Goals",
          href: "/financial-goals",
          icon: Target,
        },
      ],
    },
    {
      group: "Governance & Compliance",
      items: [
        {
          name: "Policies & Rules",
          href: "/policies-rules",
          icon: ShieldCheck,
        },
        {
          name: "Compliance Reports",
          href: "/compliance-reports",
          icon: FileText,
        },
        {
          name: "Audit Logs",
          href: "/audit-logs",
          icon: Activity,
        },
        {
          name: "Risk Management",
          href: "/risk-management",
          icon: AlertTriangle,
        },
        {
          name: "Incident Response",
          href: "/incident-response",
          icon: GitFork,
        },
      ],
    },
    {
      group: "AI Governance",
      items: [
        {
          name: "Agent Management",
          href: "/agent-management",
          icon: UserCog,
        },
        {
          name: "Access Control",
          href: "/access-control",
          icon: Scale,
        },
        {
          name: "Data Model Lineage",
          href: "/data-model-lineage",
          icon: BookOpen,
        },
        {
          name: "Training & Simulation",
          href: "/training-simulation",
          icon: Package,
        },
      ],
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="#"
          className="group flex h-14 shrink-0 items-center justify-center gap-2 text-lg font-semibold md:h-auto md:text-base"
        >
          {/* Corrected image source to use local file path */}
          <img src="/placeholder-logo.png" alt="Logo" className="h-6 w-6 transition-all group-hover:scale-110" />
          <span className="sr-only">Granular Dashboard</span>
          <span className="group-data-[state=collapsed]:hidden">Granular</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {item.name === "Analytics" && (
                          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            12
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/help"}>
                  <Link href="/help">
                    <BookOpen className="h-5 w-5" />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
