"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Activity, Pause, Play, Download, Maximize2, TrendingUp, AlertTriangle } from "lucide-react"

interface DataPoint {
  timestamp: number
  value: number
  label: string
}

interface RealTimeChartProps {
  title: string
  subtitle?: string
  dataKey: string
  color?: string
  type?: "line" | "area" | "bar"
  maxDataPoints?: number
  updateInterval?: number
  threshold?: { value: number; label: string; color: string }
  unit?: string
  className?: string
}

export function RealTimeChart({
  title,
  subtitle,
  dataKey,
  color = "#3B82F6",
  type = "line",
  maxDataPoints = 50,
  updateInterval = 2000,
  threshold,
  unit = "",
  className,
}: RealTimeChartProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentValue, setCurrentValue] = useState(0)
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable")
  const intervalRef = useRef<NodeJS.Timeout>()

  const generateDataPoint = (): DataPoint => {
    const now = Date.now()
    const baseValue = 50 + Math.sin(now / 10000) * 20 // Sine wave base
    const noise = (Math.random() - 0.5) * 10 // Random noise
    const spike = Math.random() < 0.05 ? (Math.random() - 0.5) * 30 : 0 // Occasional spikes
    const value = Math.max(0, Math.min(100, baseValue + noise + spike))

    return {
      timestamp: now,
      value: Math.round(value * 100) / 100,
      label: new Date(now).toLocaleTimeString(),
    }
  }

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const newPoint = generateDataPoint()

        setData((prevData) => {
          const newData = [...prevData, newPoint].slice(-maxDataPoints)

          // Calculate trend
          if (newData.length >= 2) {
            const lastTwo = newData.slice(-2)
            const diff = lastTwo[1].value - lastTwo[0].value
            if (Math.abs(diff) < 1) setTrend("stable")
            else if (diff > 0) setTrend("up")
            else setTrend("down")
          }

          return newData
        })

        setCurrentValue(newPoint.value)
      }, updateInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, updateInterval, maxDataPoints])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const exportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," + "Timestamp,Value\n" + data.map((d) => `${d.label},${d.value}`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-emerald-600 dark:text-emerald-400"
      case "down":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-slate-600 dark:text-slate-400"
    }
  }

  const isAboveThreshold = threshold && currentValue > threshold.value

  const chartConfig = {
    [dataKey]: {
      label: title,
      color: color,
    },
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {threshold && (
              <ReferenceLine
                y={threshold.value}
                stroke={threshold.color}
                strokeDasharray="5 5"
                label={{ value: threshold.label, position: "topRight" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </AreaChart>
        )
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {threshold && <ReferenceLine y={threshold.value} stroke={threshold.color} strokeDasharray="5 5" />}
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} animationDuration={300} />
          </BarChart>
        )
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {threshold && (
              <ReferenceLine
                y={threshold.value}
                stroke={threshold.color}
                strokeDasharray="5 5"
                label={{ value: threshold.label, position: "topRight" }}
              />
            )}
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} animationDuration={300} />
          </LineChart>
        )
    }
  }

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAboveThreshold && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Alert
              </Badge>
            )}
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">
              {currentValue.toFixed(1)}
              {unit}
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium capitalize">{trend}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePlayPause} className="h-8 w-8 p-0 bg-transparent">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="h-8 w-8 p-0 bg-transparent"
              disabled={data.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </ChartContainer>

        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Min</p>
              <p className="text-lg font-semibold">
                {Math.min(...data.map((d) => d.value)).toFixed(1)}
                {unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg</p>
              <p className="text-lg font-semibold">
                {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
                {unit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max</p>
              <p className="text-lg font-semibold">
                {Math.max(...data.map((d) => d.value)).toFixed(1)}
                {unit}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
