"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Bot, Shield, BarChart3, Users, CheckCircle, ArrowRight, Sparkles, Target, Zap } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to Granular",
    description: "Your AI Governance Dashboard",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Welcome to the Future of AI Governance</h3>
          <p className="text-muted-foreground">
            Granular provides transparent, auditable, and trustworthy AI governance for your organization. Let's get you
            set up in just a few steps.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Your Role & Permissions",
    description: "Understanding your access level",
    content: (user) => (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your Access Level</h3>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user?.permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm capitalize">{permission.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  {
    id: 3,
    title: "Key Features",
    description: "What you can do with Granular",
    content: (user) => {
      const features = [
        {
          icon: Bot,
          title: "Agent Management",
          description: "Connect and monitor AI agents",
          available: user?.permissions.includes("manage_agents"),
        },
        {
          icon: BarChart3,
          title: "Analytics & Reports",
          description: "View performance metrics and insights",
          available: user?.permissions.includes("view_analytics"),
        },
        {
          icon: Users,
          title: "User Management",
          description: "Manage team members and roles",
          available: user?.permissions.includes("manage_users"),
        },
        {
          icon: Shield,
          title: "Policy Management",
          description: "Create and enforce governance policies",
          available: user?.permissions.includes("manage_policies"),
        },
      ]

      return (
        <div className="space-y-4">
          <div className="text-center">
            <Target className="mx-auto h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Powerful Features at Your Fingertips</h3>
            <p className="text-muted-foreground">Based on your role, here's what you can access:</p>
          </div>

          <div className="grid gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className={!feature.available ? "opacity-50" : ""}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-2 rounded-lg ${feature.available ? "bg-primary/10" : "bg-muted"}`}>
                    <feature.icon
                      className={`h-6 w-6 ${feature.available ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  {feature.available ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
  },
  {
    id: 4,
    title: "Ready to Start",
    description: "You're all set!",
    content: (user) => (
      <div className="space-y-4">
        <div className="text-center">
          <Zap className="mx-auto h-16 w-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
          <p className="text-muted-foreground mb-6">
            Welcome to Granular, {user?.name.split(" ")[0]}! Your AI governance journey starts now.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.permissions.includes("manage_agents") && (
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-primary/10 mt-1">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Connect Your First Agent</p>
                  <p className="text-xs text-muted-foreground">
                    Go to Agent Management to connect OpenAI, Anthropic, or other AI providers
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <BarChart3 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Explore the Dashboard</p>
                <p className="text-xs text-muted-foreground">Check out the analytics and system health overview</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <Shield className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Review Settings</p>
                <p className="text-xs text-muted-foreground">Customize your preferences and notification settings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
]

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const { user, completeOnboarding } = useAuth()
  const { toast } = useToast()

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      await completeOnboarding()
      toast({
        title: "Welcome aboard!",
        description: "Your onboarding is complete. Enjoy using Granular!",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      })
    }
  }

  const currentStepData = onboardingSteps.find((step) => step.id === currentStep)

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{currentStepData?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{currentStepData?.description}</p>
            </div>
            <Badge variant="outline">
              {currentStep} of {onboardingSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-6">
          {typeof currentStepData?.content === "function" ? currentStepData.content(user) : currentStepData?.content}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < onboardingSteps.length ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Get Started
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 justify-center mt-4">
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              className={`h-2 w-8 rounded-full transition-colors ${step.id <= currentStep ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
