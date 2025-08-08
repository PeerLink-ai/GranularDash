"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Shield, Receipt, MessageSquare } from 'lucide-react'

export default function GovernanceHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governance Hub</h1>
          <p className="text-muted-foreground">Audit logs, compliance, risk, and incidents—together.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">Governance Settings</Link>
        </Button>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Receipt className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Incidents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Centralized log visibility with filtering and export.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/audit-logs">Open full Audit Logs</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and download attestations for audits.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/compliance-reports">Open Compliance Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Review risks, mitigations, and acceptance history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/risk-management">Open Risk Management</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Response</CardTitle>
              <CardDescription>Track incidents and postmortems.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/incident-response">Open Incidents</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
