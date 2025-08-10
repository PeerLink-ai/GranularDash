"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  icon: LucideIcon
  popular: boolean
}

interface PlanCardProps {
  plan: Plan
  currentPlan: string
  onSelect: (planId: string) => void
}

export function PlanCard({ plan, currentPlan, onSelect }: PlanCardProps) {
  const isCurrentPlan = plan.id === currentPlan
  const Icon = plan.icon

  return (
    <Card
      className={cn(
        "relative transition-all duration-200",
        plan.popular && "border-primary shadow-lg scale-105",
        isCurrentPlan && "border-green-500",
      )}
    >
      {plan.popular && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>}

      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            ${plan.price}
            <span className="text-sm font-normal text-muted-foreground">/month</span>
          </div>
        </div>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isCurrentPlan ? "secondary" : plan.popular ? "default" : "outline"}
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : "Select Plan"}
        </Button>
      </CardContent>
    </Card>
  )
}
