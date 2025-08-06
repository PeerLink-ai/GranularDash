"use client"

import * as React from "react"
import { BarChart3, Shield, Users, Settings, FileText, AlertTriangle, Activity, BookOpen, HelpCircle, Bot, Lock, TrendingUp, Database, Zap, Brain } from 'lucide-react'

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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: BarChart3,
    },
    {
      title: "Agent Management",
      url: "/agent-management",
      icon: Bot,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: TrendingUp,
    },
    {
      title: "Access Control",
      url: "/access-control",
      icon: Lock,
    },
    {
      title: "Policies & Rules",
      url: "/policies-rules",
      icon: Shield,
    },
    {
      title: "Users & Roles",
      url: "/users-roles",
      icon: Users,
    },
    {
      title: "Audit Logs",
      url: "/audit-logs",
      icon: FileText,
    },
    {
      title: "Compliance Reports",
      url: "/compliance-reports",
      icon: FileText,
    },
    {
      title: "Risk Management",
      url: "/risk-management",
      icon: AlertTriangle,
    },
    {
      title: "Incident Response",
      url: "/incident-response",
      icon: Activity,
    },
    {
      title: "Data Model Lineage",
      url: "/data-model-lineage",
      icon: Database,
    },
    {
      title: "Training & Simulation",
      url: "/training-simulation",
      icon: Brain,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Shield className="h-6 w-6" />
          <span className="font-semibold">AI Governance</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          AI Agent Security & Governance Platform
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
