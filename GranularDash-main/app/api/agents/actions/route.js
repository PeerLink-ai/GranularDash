import fs from 'fs';
import path from 'path';

export async function GET() {
  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  let logs = [];
  if (fs.existsSync(logFile)) {
    const fileData = fs.readFileSync(logFile, 'utf-8');
    try {
      logs = JSON.parse(fileData);
    } catch {
      logs = [];
    }
  }
  return new Response(JSON.stringify({ logs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 