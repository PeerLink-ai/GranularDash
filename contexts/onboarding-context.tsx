"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export type OnboardingStep = {
  id: string
  title: string
  description: string
  target: string // CSS selector
  placement?: "top" | "bottom" | "left" | "right" | "center"
  action?: "click" | "hover" | "focus" | "scroll" | "none"
  page?: string // Optional page to navigate to
  delay?: number // Delay before showing this step
  spotlight?: boolean // Whether to use spotlight effect
  interactive?: boolean // Whether user must interact to continue
  isWelcome?: boolean // Special welcome step
  isCompletion?: boolean // Special completion step
  requiresCompletion?: boolean // Must complete interaction to proceed
  completionText?: string // Text to show when interaction is completed
  hintText?: string // Additional hint for complex interactions
}

type OnboardingContextType = {
  isActive: boolean
  currentStep: number
  steps: OnboardingStep[]
  isCompleted: boolean
  startOnboarding: () => void
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setCurrentStep: (step: number) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Granular",
    description:
      "Let's take a quick tour of your AI governance platform. This will only take 2 minutes and help you get the most out of your experience.",
    target: "[data-onboarding='welcome-card']",
    placement: "center",
    action: "none",
    spotlight: false,
    isWelcome: true,
  },
  {
    id: "dashboard-overview",
    title: "Your Dashboard Overview",
    description:
      "Here you can see key metrics like connected agents, system efficiency, and performance scores at a glance.",
    target: "[data-onboarding='stats-cards']",
    placement: "bottom",
    action: "none",
    spotlight: true,
  },
  {
    id: "real-time-monitor",
    title: "Real-Time System Monitor",
    description:
      "Monitor your system's health with live CPU, memory, and network metrics. This updates every 30 seconds.",
    target: "[data-onboarding='real-time-monitor']",
    placement: "top",
    action: "hover",
    interactive: true,
    requiresCompletion: true,
    completionText: "Great! You can see the metrics update in real-time.",
    hintText: "Hover over the monitor to see detailed metrics",
    spotlight: true,
  },
  {
    id: "analytics-tabs",
    title: "Advanced Analytics",
    description: "Dive deeper into your data with comprehensive analytics. Try clicking on different tabs to explore.",
    target: "[data-onboarding='analytics-tabs']",
    placement: "top",
    action: "click",
    interactive: true,
    requiresCompletion: true,
    completionText: "Perfect! You've explored the analytics tabs.",
    hintText: "Click on any tab to see different analytics views",
    spotlight: true,
  },
  {
    id: "sidebar-navigation",
    title: "Navigation Sidebar",
    description: "Your main navigation is organized into 4 key areas: Overview, Operations, Governance, and Access.",
    target: "[data-onboarding='sidebar']",
    placement: "right",
    action: "none",
    spotlight: true,
  },
  {
    id: "search-feature",
    title: "Powerful Search",
    description:
      "Search across pages, projects, and agents instantly. Try typing something or use ⌘K for the command palette.",
    target: "[data-onboarding='search-input']",
    placement: "bottom",
    action: "focus",
    interactive: true,
    requiresCompletion: true,
    completionText: "Excellent! The search is now active and ready to use.",
    hintText: "Click in the search box or press ⌘K to activate search",
    spotlight: true,
  },
  {
    id: "analytics-page",
    title: "Analytics Deep Dive",
    description: "Let's explore the analytics page where you can generate reports and view detailed insights.",
    target: "[data-onboarding='analytics-link']",
    placement: "right",
    action: "click",
    page: "/analytics",
    interactive: true,
    requiresCompletion: true,
    completionText: "Great! You're now on the analytics page.",
    spotlight: true,
  },
  {
    id: "analytics-interface",
    title: "Advanced Analytics Interface",
    description:
      "This is your analytics command center. You can create custom reports, set up alerts, and analyze trends.",
    target: "[data-onboarding='analytics-interface']",
    placement: "center",
    action: "scroll",
    page: "/analytics",
    delay: 1000,
    interactive: true,
    requiresCompletion: true,
    completionText: "Perfect! You've explored the analytics interface.",
    hintText: "Scroll down to see more analytics features",
    spotlight: true,
  },
  {
    id: "compliance-reports",
    title: "Compliance & Governance",
    description: "Navigate to compliance reports to see how we help you maintain regulatory compliance.",
    target: "[data-onboarding='compliance-link']",
    placement: "right",
    action: "click",
    page: "/compliance-reports",
    interactive: true,
    requiresCompletion: true,
    completionText: "Excellent! You're now viewing compliance reports.",
    spotlight: true,
  },
  {
    id: "user-management",
    title: "User & Role Management",
    description: "Manage your team's access and permissions from the Users & Roles section.",
    target: "[data-onboarding='users-link']",
    placement: "right",
    action: "click",
    page: "/users-roles",
    interactive: true,
    requiresCompletion: true,
    completionText: "Great! You can now manage users and roles from here.",
    spotlight: true,
  },
  {
    id: "quick-actions",
    title: "Quick Actions Panel",
    description:
      "Access frequently used actions like connecting agents and creating projects right from your dashboard.",
    target: "[data-onboarding='quick-actions']",
    placement: "left",
    action: "hover",
    page: "/",
    interactive: true,
    requiresCompletion: true,
    completionText: "Perfect! You can see all available quick actions.",
    hintText: "Hover over the quick actions panel to see options",
    spotlight: true,
  },
  {
    id: "profile-menu",
    title: "Your Profile & Settings",
    description: "Access your account settings, billing, and preferences from your profile menu.",
    target: "[data-onboarding='profile-menu']",
    placement: "bottom",
    action: "click",
    interactive: true,
    requiresCompletion: true,
    completionText: "Excellent! Your profile menu is now open.",
    hintText: "Click on your profile avatar to open the menu",
    spotlight: true,
  },
  {
    id: "completion",
    title: "You're All Set!",
    description:
      "Congratulations! You've completed the tour. You're now ready to start managing your AI governance with confidence. Explore the platform and don't hesitate to reach out if you need help.",
    target: "[data-onboarding='welcome-card']",
    placement: "center",
    action: "none",
    spotlight: false,
    isCompletion: true,
  },
]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`onboarding-completed-${user.id}`)
      setIsCompleted(!!completed)
    }
  }, [user])

  // Auto-start onboarding for new users
  useEffect(() => {
    if (user && !isCompleted) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${user.id}`)
      if (!hasSeenOnboarding) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          setIsActive(true)
          localStorage.setItem(`onboarding-seen-${user.id}`, "true")
        }, 1500)
      }
    }
  }, [user, isCompleted])

  const startOnboarding = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    setIsActive(false)
    completeOnboarding()
  }

  const completeOnboarding = () => {
    setIsActive(false)
    setIsCompleted(true)
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, "true")
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps: ONBOARDING_STEPS,
        isCompleted,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        setCurrentStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
