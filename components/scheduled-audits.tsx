import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Shield, ArrowRight } from "lucide-react"

const audits = [
  {
    id: 1,
    title: "Q3 Compliance Audit",
    subtitle: "Review of financial AI agents",
    icon: FileText,
    status: "Scheduled",
    date: "Sep 2024",
  },
  {
    id: 2,
    title: "Security Vulnerability Scan",
    subtitle: "Automated agent security assessment",
    icon: Shield,
    status: "In Progress",
    date: "Aug 2024",
  },
  {
    id: 3,
    title: "Behavioral Policy Review",
    subtitle: "Annual review of ethical AI policies",
    icon: Calendar,
    status: "Pending",
    date: "Oct 2024",
  },
]

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
}

export function ScheduledAudits() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scheduled Audits & Reviews</h2>
        <Button variant="outline" size="sm">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {audits.map((audit) => (
          <Card key={audit.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{audit.title}</CardTitle>
              <audit.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{audit.subtitle}</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full ${statusColors[audit.status]}`}>{audit.status}</span>
                  <span className="text-muted-foreground">
                    <Calendar className="inline mr-1 h-3 w-3" />
                    {audit.date}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
