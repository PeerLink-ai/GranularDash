"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, AlertTriangle, ShieldCheck, FileText, Users, MessageSquare } from "lucide-react"

const notificationTypes = [
  { id: "agent-activity", label: "Agent Activity Alerts", icon: Bell },
  { id: "policy-violations", label: "Policy Violation Alerts", icon: AlertTriangle },
  { id: "security-incidents", label: "Security Incident Alerts", icon: ShieldCheck },
  { id: "audit-reminders", label: "Audit & Compliance Reminders", icon: FileText },
  { id: "user-access", label: "User Access Changes", icon: Users },
  { id: "system-health", label: "System Health Warnings", icon: MessageSquare },
]

export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    "agent-activity": true,
    "policy-violations": true,
    "security-incidents": false,
    "audit-reminders": true,
    "user-access": false,
    "system-health": true,
  })

  const toggleNotification = (id) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <type.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{type.label}</span>
              </div>
              <Switch checked={notifications[type.id]} onCheckedChange={() => toggleNotification(type.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Critical: Policy violation by AI-Finance-001</p>
              <p className="text-xs text-muted-foreground">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Security scan completed for all active agents</p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">New agent AI-Marketing-009 deployed successfully</p>
              <p className="text-xs text-muted-foreground">3 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <FileText className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Reminder: Q3 Compliance Audit due next week</p>
              <p className="text-xs text-muted-foreground">1 day ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button variant="outline" className="text-sm bg-transparent">
          View All Notifications
        </Button>
      </div>
    </div>
  )
}
