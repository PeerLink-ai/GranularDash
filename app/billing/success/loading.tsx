import { ModernLoader } from "@/components/ui/modern-loader"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <ModernLoader variant="pulse" size="lg" message="Processing your payment..." />
    </div>
  )
}
