import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  const { agentId, action, resource, status, details } = req.body;
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

  return res.status(200).json({ success: true, logEntry });
}
