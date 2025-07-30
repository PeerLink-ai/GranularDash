import fs from 'fs';
import path from 'path';

export async function GET() {
  const agentsFile = path.join(process.cwd(), 'agents-config.json');
  let agents = [];
  
  if (fs.existsSync(agentsFile)) {
    try {
      agents = JSON.parse(fs.readFileSync(agentsFile, 'utf-8'));
    } catch {
      agents = [];
    }
  }

  return new Response(JSON.stringify({ agents }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 