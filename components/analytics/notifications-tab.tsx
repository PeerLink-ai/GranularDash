"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Shield, Activity, Settings, Users } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  securityAlerts: boolean
  policyViolations: boolean
  agentAnomalies: boolean
  complianceUpdates: boolean
  accessChanges: boolean
  systemHealth: boolean
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: "low" | "medium" | "high" | "critical"
  read: boolean
  createdAt: string
}

export function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings>({
    securityAlerts: true,
    policyViolations: true,
    agentAnomalies: false,
    complianceUpdates: false,
    accessChanges: false,
    systemHealth: true,
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchNotifications()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/notifications/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications/recent")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Notification settings saved")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      console.error("Save settings error:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "security_alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "policy_violation":
        return <Shield className="h-4 w-4 text-orange-500" />
      case "agent_anomaly":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "compliance_update":
        return <Settings className="h-4 w-4 text-blue-500" />
      case "access_change":
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure which security notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-alerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">Critical security threats and breaches</p>
              </div>
              <Switch
                id="security-alerts"
                checked={settings.securityAlerts}
                onCheckedChange={(checked) => updateSetting("securityAlerts", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="policy-violations">Policy Violations</Label>
                <p className="text-sm text-muted-foreground">AI agent compliance violations</p>
              </div>
              <Switch
                id="policy-violations"
                checked={settings.policyViolations}
                onCheckedChange={(checked) => updateSetting("policyViolations", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="agent-anomalies">Agent Anomalies</Label>
                <p className="text-sm text-muted-foreground">Unusual AI behavior detection</p>
              </div>
              <Switch
                id="agent-anomalies"
                checked={settings.agentAnomalies}
                onCheckedChange={(checked) => updateSetting("agentAnomalies", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compliance-updates">Compliance Updates</Label>
                <p className="text-sm text-muted-foreground">Regulatory and compliance notifications</p>
              </div>
              <Switch
                id="compliance-updates"
                checked={settings.complianceUpdates}
                onCheckedChange={(checked) => updateSetting("complianceUpdates", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="access-changes">Access Changes</Label>
                <p className="text-sm text-muted-foreground">Permission and access modifications</p>
              </div>
              <Switch
                id="access-changes"
                checked={settings.accessChanges}
                onCheckedChange={(checked) => updateSetting("accessChanges", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-health">System Health</Label>
                <p className="text-sm text-muted-foreground">Security system status and updates</p>
              </div>
              <Switch
                id="system-health"
                checked={settings.systemHealth}
                onCheckedChange={(checked) => updateSetting("systemHealth", checked)}
              />
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Latest security notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="h-12 w-12 mx-auto mb-4" />
              <p>No notifications yet</p>
              <p className="text-sm">Security notifications will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-center space-x-4">
                  {getNotificationIcon(notification.type)}
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message} • {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={getSeverityVariant(notification.severity) as any}>{notification.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
