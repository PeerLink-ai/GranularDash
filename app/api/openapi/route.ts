import { NextResponse } from "next/server"

export async function GET() {
  const spec = {
    openapi: "3.0.0",
    info: { title: "Granular Governance API", version: "1.0.0" },
    paths: {
      "/api/agents": {
        get: { summary: "List agents", responses: { 200: { description: "OK" } } },
        post: {
          summary: "Connect agent",
          requestBody: { required: true },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/policies": {
        get: { summary: "List policies", responses: { 200: { description: "OK" } } },
        post: { summary: "Create policy", responses: { 200: { description: "OK" } } },
      },
      "/api/policies/{id}/assignments": {
        get: { summary: "Get policy-agent assignments", responses: { 200: { description: "OK" } } },
        put: { summary: "Replace assignments", responses: { 200: { description: "OK" } } },
      },
      "/api/reports/generate": {
        post: { summary: "Generate report", responses: { 200: { description: "OK" } } },
      },
      "/api/reports/list": {
        get: { summary: "List reports", responses: { 200: { description: "OK" } } },
      },
      "/api/ledger/verify": {
        post: { summary: "Verify ledger chain", responses: { 200: { description: "OK" } } },
      },
      "/api/projects/{id}/apply-policies": {
        post: { summary: "Apply policies to a project", responses: { 200: { description: "OK" } } },
      },
      "/api/integrations/tickets/jira": {
        post: { summary: "Create Jira ticket", responses: { 200: { description: "OK" } } },
      },
      "/api/integrations/tickets/servicenow": {
        post: { summary: "Create ServiceNow incident", responses: { 200: { description: "OK" } } },
      },
    },
  }
  return NextResponse.json(spec)
}
