"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone } from "lucide-react"
import { FAQSection } from "@/components/faq-section"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <FAQSection />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Need further assistance? Reach out to our support team.</p>
            <Button className="w-full" onClick={() => alert("Opening email client to support@example.com")}>
              <Mail className="mr-2 h-4 w-4" /> Email Support
            </Button>
            <Button
              className="w-full bg-transparent"
              variant="outline"
              onClick={() => alert("Calling support at +1 (800) 123-4567")}
            >
              <Phone className="mr-2 h-4 w-4" /> Call Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
