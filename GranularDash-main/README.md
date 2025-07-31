# Enterprise AI Compliance Dashboard

## Overview

This repository is a Next.js 13 (App Router) frontend for an AI compliance and governance platform. It provides enterprise‑grade UI for monitoring, reporting, and managing AI models and related processes across their lifecycle.

## Project Structure

\`\`\``
/app                 # Top‑level route segments (pages)
  ├─ agent-management    # Governance workflows & approval queues
  ├─ analytics           # Drift detection & performance insights
  ├─ audit-logs          # Immutable, tamper‑proof audit log explorer
  ├─ compliance-reports  # Regulatory report templates & exports
  ├─ data-model-lineage  # Interactive data & model lineage graph
  ├─ financial-goals     # Budgeting & SLA performance dashboards
  ├─ help                # In‑app documentation and support links
  ├─ incident-response   # Incident dashboard and runbook orchestration
  ├─ policies-rules      # Define compliance policies, rules, and thresholds
  ├─ risk-management     # Fairness, bias metrics & risk assessments
  ├─ settings            # Global configuration, API tokens, schedules
  ├─ training-simulation # Data quality checks & retrain gates simulator
  ├─ transactions        # PII scan results and transaction monitoring
  └─ users-roles         # User, role, and permission management

/components/ui     # Reusable UI primitives (cards, buttons, modals, etc.)
/contexts          # React contexts (e.g. settings, theme)
/lib               # Utility functions and shared helpers
/public            # Static assets (placeholder logos, images)
/styles            # Global CSS and utility styles

## Pages & Key Features

- **Data & Model Lineage (`/app/data-model-lineage`)**
  - Interactive DAG showing data sources, transformations, and model versions.
  - Clickable nodes with metadata pane and upstream/downstream view.

- **Drift & Performance Analytics (`/app/analytics`)**
  - Charts for input distribution vs. baseline and model accuracy over time.
  - Threshold highlighting and alert history table with ticket links.

- **Audit Logs Explorer (`/app/audit-logs`)**
  - Searchable, filterable log table with cryptographic integrity badges.
  - Export signed audit bundles (CSV/JSON) for SOC‑2 and ISO audits.

- **Compliance Reports (`/app/compliance-reports`)**
  - Pre‑built templates (GDPR, CCPA, HIPAA, BCBS 239).
  - Drag‑and‑drop custom report builder with PDF export.

- **Governance Workflows (`/app/agent-management` & `/app/policies-rules`)**
  - Kanban view of policy approval queues and rule configurations.
  - Role‑based gating, comment threads, and notification banners.

- **Risk & Fairness Assessment (`/app/risk-management`)**
  - Heatmaps and trend charts for fairness metrics (demographic parity, etc.).
  - Detailed sub‑group performance views and remediation suggestions.

- **Incident Response (`/app/incident-response`)**
  - Active incident list with severity flags and timeline logs.
  - Embedded runbooks and endpoint lockdown controls.

- **Transactions & PII Scanning (`/app/transactions`)**
  - Table of scanned batches, PII counts by type, last scan date.
  - On‑demand scans with scheduler settings and PDF reports.

- **Training Simulation (`/app/training-simulation`)**
  - Simulated data‑quality checks (nulls, schema breaks, imbalance).
  - Retrain gate toggles with override comments for demo/testing.

- **Financial Goals & SLAs (`/app/financial-goals`)**
  - SLA scorecards for uptime, latency, accuracy vs. targets.
  - Breach history log and client notification controls.

- **Users & Roles (`/app/users-roles`)**
  - User list with assigned roles and granular permission toggles.
  - Invite links, role templates, and activity audit.

- **Settings (`/app/settings`)**
  - Global theme, alert channels, scan schedules, and API token management.

- **Help (`/app/help`)**
  - In‑app documentation, external links, and support contact info.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
\`\`\``

2. Run the development server:

   \`\`\`bash
   npm run dev
   \`\`\`
3. Open `http://localhost:3000` in your browser.

## Customization & Theming

* All UI elements use the `/components/ui` primitives.
* Override global CSS in `/styles/globals.css` or extend via `/app/globals.css`.

## Contributing

1. Fork the repo and create a feature branch.
2. Add or update UI components under `/components/ui`.
3. Update or add pages in `/app` following the file‑based routing.
4. Submit a pull request with design mockups or Figma links.

## License

MIT

---

> Built with Next.js 13, TypeScript, and Tailwind CSS.
