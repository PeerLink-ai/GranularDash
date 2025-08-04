"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

interface ProductData {
  name: string
  revenue: string
  growth: string
}

export function TopProducts() {
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/analytics/top-products")
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Failed to fetch top products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center animate-pulse">
            <div className="h-4 w-4 bg-muted rounded mr-2" />
            <div className="ml-4 space-y-1 flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium mb-2">No Product Data</p>
        <p className="text-sm text-muted-foreground">Connect your product analytics to see top performers</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {products.map((product) => (
        <div key={product.name} className="flex items-center">
          <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.revenue}</p>
          </div>
          <div className="ml-auto font-medium text-green-500">{product.growth}</div>
        </div>
      ))}
    </div>
  )
}
