"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ModernLoaderProps {
  variant?: "morphing" | "particles" | "wave" | "pulse"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showProgress?: boolean
  progress?: number
  message?: string
}

export function ModernLoader({
  variant = "morphing",
  size = "md",
  className,
  showProgress = false,
  progress = 0,
  message,
}: ModernLoaderProps) {
  const [currentProgress, setCurrentProgress] = useState(0)

  useEffect(() => {
    if (showProgress && progress > currentProgress) {
      const timer = setTimeout(() => {
        setCurrentProgress((prev) => Math.min(prev + 1, progress))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [progress, currentProgress, showProgress])

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  const renderMorphingLoader = () => (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent animate-morphing-loader animate-pulse-glow" />
      <div className="absolute inset-2 bg-background rounded-full" />
    </div>
  )

  const renderParticlesLoader = () => (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full animate-floating-particles"
          style={{
            animationDelay: `${i * 0.2}s`,
            left: `${20 + i * 10}%`,
          }}
        />
      ))}
      <div className="w-4 h-4 bg-accent rounded-full animate-pulse" />
    </div>
  )

  const renderWaveLoader = () => (
    <div className={cn("relative overflow-hidden bg-muted rounded-full", sizeClasses[size], className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-progress-wave" />
      <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      </div>
    </div>
  )

  const renderPulseLoader = () => (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
      <div className="absolute inset-0 bg-primary rounded-full animate-pulse" />
      <div className="absolute inset-2 bg-accent rounded-full animate-bounce" />
    </div>
  )

  const renderLoader = () => {
    switch (variant) {
      case "particles":
        return renderParticlesLoader()
      case "wave":
        return renderWaveLoader()
      case "pulse":
        return renderPulseLoader()
      default:
        return renderMorphingLoader()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {renderLoader()}

      {showProgress && (
        <div className="w-48 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{currentProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out relative"
              style={{ width: `${currentProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-wave" />
            </div>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground animate-bounce-in">{message}</p>}
    </div>
  )
}
