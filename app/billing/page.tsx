"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanCard } from "@/components/billing/plan-card"
import { UsageSummary } from "@/components/billing/usage-summary"
import { PaymentMethods } from "@/components/billing/payment-methods"
import { InvoicesTable } from "@/components/billing/invoices-table"
import { Crown, Shield, Zap } from "lucide-react"

export default function BillingPage() {
  const [currentPlan] = useState("pro")

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      description: "Perfect for small teams getting started with AI governance",
      features: ["Up to 5 AI agents", "Basic compliance monitoring", "Standard support", "Monthly reports"],
      icon: Zap,
      popular: false,
    },
    {
      id: "pro",
      name: "Professional",
      price: 99,
      description: "Advanced governance for growing organizations",
      features: [
        "Up to 50 AI agents",
        "Advanced compliance suite",
        "Priority support",
        "Real-time monitoring",
        "Custom policies",
        "API access",
      ],
      icon: Shield,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 299,
      description: "Complete AI governance for large enterprises",
      features: [
        "Unlimited AI agents",
        "Enterprise compliance",
        "24/7 dedicated support",
        "Advanced analytics",
        "Custom integrations",
        "SLA guarantees",
        "On-premise deployment",
      ],
      icon: Crown,
      popular: false,
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Current Plan
                    <Badge variant="secondary">Active</Badge>
                  </CardTitle>
                  <CardDescription>Your current subscription and billing cycle</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">Professional</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">$99</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                  <p className="text-2xl font-bold">Jan 15, 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <UsageSummary />

          {/* Payment Methods */}
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scale your AI governance capabilities with plans designed for teams of all sizes. All plans include our
              core compliance features and security guarantees.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={(planId) => console.log("Selected plan:", planId)}
              />
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Need a custom solution?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our sales team for enterprise pricing and custom features
                </p>
                <Button variant="outline" size="sm">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageSummary detailed />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoicesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
