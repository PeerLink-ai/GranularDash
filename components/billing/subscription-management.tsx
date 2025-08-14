"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Pause, Play, X, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionManagementProps {
  subscription: any
  onSubscriptionUpdate: () => void
}

export function SubscriptionManagement({ subscription, onSubscriptionUpdate }: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelFeedback, setCancelFeedback] = useState("")
  const { toast } = useToast()

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          reason: cancelReason,
          feedback: cancelFeedback,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      toast({
        title: "Subscription Canceled",
        description:
          "Your subscription has been canceled. You'll continue to have access until the end of your billing period.",
      })

      setShowCancelDialog(false)
      onSubscriptionUpdate()
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePauseSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to pause subscription")
      }

      toast({
        title: "Subscription Paused",
        description: "Your subscription has been paused. You can resume it anytime.",
      })

      onSubscriptionUpdate()
    } catch (error) {
      console.error("Error pausing subscription:", error)
      toast({
        title: "Error",
        description: "Failed to pause subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscription/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to resume subscription")
      }

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed and billing will continue.",
      })

      onSubscriptionUpdate()
    } catch (error) {
      console.error("Error resuming subscription:", error)
      toast({
        title: "Error",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryPayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payments/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to retry payment")
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        })
      } else {
        toast({
          title: "Payment Failed",
          description: "Payment failed. Please update your payment method.",
          variant: "destructive",
        })
      }

      onSubscriptionUpdate()
    } catch (error) {
      console.error("Error retrying payment:", error)
      toast({
        title: "Error",
        description: "Failed to retry payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Management
          {getStatusBadge(subscription.status)}
        </CardTitle>
        <CardDescription>Manage your subscription settings and billing preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold">{subscription.plan_name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">{formatAmount(subscription.plan_amount)}/month</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Period</p>
            <p className="text-sm">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
            <p className="text-sm">{formatDate(subscription.current_period_end)}</p>
          </div>
        </div>

        {/* Trial Information */}
        {subscription.status === "trialing" && subscription.trial_end && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Free Trial Active</p>
                <p className="text-sm text-blue-700">
                  Your trial ends on {formatDate(subscription.trial_end)}. You won't be charged until then.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {subscription.status === "past_due" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Payment Required</p>
                <p className="text-sm text-red-700">
                  Your payment failed. Please update your payment method or retry the payment.
                </p>
              </div>
              <Button size="sm" onClick={handleRetryPayment} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry Payment"}
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {subscription.status === "active" && (
            <>
              <Button variant="outline" onClick={handlePauseSubscription} disabled={isLoading}>
                <Pause className="h-4 w-4 mr-2" />
                Pause Subscription
              </Button>
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      We're sorry to see you go! Your subscription will remain active until the end of your current
                      billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Why are you canceling? (Optional)</Label>
                      <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="too-expensive" id="too-expensive" />
                          <Label htmlFor="too-expensive">Too expensive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not-using" id="not-using" />
                          <Label htmlFor="not-using">Not using enough</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="missing-features" id="missing-features" />
                          <Label htmlFor="missing-features">Missing features</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="switching" id="switching" />
                          <Label htmlFor="switching">Switching to competitor</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedback">Additional feedback (Optional)</Label>
                      <Textarea
                        id="feedback"
                        placeholder="Help us improve by sharing your feedback..."
                        value={cancelFeedback}
                        onChange={(e) => setCancelFeedback(e.target.value)}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {subscription.status === "paused" && (
            <Button onClick={handleResumeSubscription} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Resume Subscription
            </Button>
          )}

          <Button variant="outline" onClick={() => window.open("/api/stripe/create-portal", "_blank")}>
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        </div>

        {/* Subscription Features */}
        {subscription.plan_features && (
          <div className="space-y-3">
            <h4 className="font-medium">Your Plan Includes:</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {subscription.plan_features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
