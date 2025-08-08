import { sql } from "./db"

// Creates the projects table if missing and adds needed columns if they don't exist.
// Won't destroy existing data; safe to call on every request.
export async function ensureProjectsSchema() {
  // Base table
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id           text PRIMARY KEY,
      name         text NOT NULL,
      description  text,
      type         text,
      repo_url     text,
      metadata     jsonb DEFAULT '{}'::jsonb,
      pinned       boolean DEFAULT false,
      created_at   timestamptz DEFAULT now(),
      updated_at   timestamptz DEFAULT now()
    );
  `

  // Defensive column adds in case an older table exists
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS type text;`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url text;`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`

  // Helpful index for sorting
  await sql`
    CREATE INDEX IF NOT EXISTS idx_projects_pinned_updated
    ON projects (pinned DESC, updated_at DESC);
  `
}
