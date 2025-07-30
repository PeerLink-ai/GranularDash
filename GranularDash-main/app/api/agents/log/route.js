import fs from 'fs';
import path from 'path';

export async function POST(request) {
  const body = await request.json();
  const { agentId, action, resource, status, details } = body;
  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  const logEntry = {
    id: `AL${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    action,
    resource,
    status,
    details,
  };

  let logs = [];
  if (fs.existsSync(logFile)) {
    const fileData = fs.readFileSync(logFile, 'utf-8');
    try {
      logs = JSON.parse(fileData);
    } catch {
      logs = [];
    }
  }
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

  return new Response(JSON.stringify({ success: true, logEntry }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 