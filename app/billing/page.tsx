"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanCard } from "@/components/billing/plan-card"
import { UsageSummary } from "@/components/billing/usage-summary"
import { PaymentMethods } from "@/components/billing/payment-methods"
import { InvoicesTable } from "@/components/billing/invoices-table"
import { SubscriptionManagement } from "@/components/billing/subscription-management"
import { Crown, Shield, Zap, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: string
  name: string
  amount: number
  description: string
  features: string[]
  stripe_price_id: string
  trial_period_days: number
}

interface UserSubscription {
  subscription: any
  status: string
  trialEndsAt: string | null
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Load plans and user subscription
  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansResponse, subscriptionResponse] = await Promise.all([
          fetch("/api/subscription-plans"),
          fetch("/api/user-subscription"),
        ])

        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          // Add icons and popular flags to plans
          const plansWithIcons = plansData.map((plan: Plan, index: number) => ({
            ...plan,
            icon: index === 0 ? Zap : index === 1 ? Shield : Crown,
            popular: index === 1, // Make middle plan popular
          }))
          setPlans(plansWithIcons)
        }

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setUserSubscription(subscriptionData)
        }
      } catch (error) {
        console.error("Error loading billing data:", error)
        toast({
          title: "Error",
          description: "Failed to load billing information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handlePlanSelect = async (plan: Plan) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          trialPeriodDays: plan.trial_period_days,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error opening billing portal:", error)
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubscriptionUpdate = () => {
    // Reload subscription data
    const loadSubscription = async () => {
      try {
        const response = await fetch("/api/user-subscription")
        if (response.ok) {
          const data = await response.json()
          setUserSubscription(data)
        }
      } catch (error) {
        console.error("Error reloading subscription:", error)
      }
    }
    loadSubscription()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentPlan = userSubscription?.subscription?.plan_name || "No active plan"
  const currentAmount = userSubscription?.subscription?.plan_amount
    ? `$${userSubscription.subscription.plan_amount / 100}`
    : "$0"
  const nextBilling = userSubscription?.subscription?.current_period_end
    ? new Date(userSubscription.subscription.current_period_end).toLocaleDateString()
    : "N/A"

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
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
                    <Badge variant={userSubscription?.status === "active" ? "secondary" : "outline"}>
                      {userSubscription?.status === "active"
                        ? "Active"
                        : userSubscription?.status === "trialing"
                          ? "Trial"
                          : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Your current subscription and billing cycle</CardDescription>
                </div>
                {userSubscription?.subscription && (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{currentPlan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">{currentAmount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                  <p className="text-2xl font-bold">{nextBilling}</p>
                </div>
              </div>

              {userSubscription?.status === "trialing" && userSubscription.trialEndsAt && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Your free trial ends on {new Date(userSubscription.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <UsageSummary />

          {/* Payment Methods */}
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          {userSubscription?.subscription ? (
            <SubscriptionManagement
              subscription={userSubscription.subscription}
              onSubscriptionUpdate={handleSubscriptionUpdate}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">No Active Subscription</h3>
                  <p className="text-muted-foreground">
                    You don't have an active subscription. Choose a plan to get started.
                  </p>
                  <Button onClick={() => document.querySelector('[value="plans"]')?.click()}>View Plans</Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                currentPlan={userSubscription?.subscription?.stripe_price_id}
                onSelect={handlePlanSelect}
                isLoading={isProcessing}
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
