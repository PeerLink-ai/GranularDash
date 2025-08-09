"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type PathMap = Record<string, Record<string, any>>

export default function ApiDocsPage() {
  const [paths, setPaths] = React.useState<PathMap>({})
  React.useEffect(() => {
    fetch("/api/openapi")
      .then((r) => r.json())
      .then((spec) => setPaths(spec.paths || {}))
      .catch(() => setPaths({}))
  }, [])

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">API Documentation</h1>
      <p className="text-muted-foreground">Auto-generated overview of key API routes.</p>
      <div className="grid gap-4">
        {Object.entries(paths).map(([route, methods]) => (
          <Card key={route}>
            <CardHeader>
              <CardTitle className="text-base">{route}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(methods).map(([method, meta]) => (
                <div key={method} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {method}
                    </Badge>
                    <span className="font-medium">{meta.summary || "Endpoint"}</span>
                  </div>
                  {meta.description && <p className="text-sm text-muted-foreground">{meta.description}</p>}
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
