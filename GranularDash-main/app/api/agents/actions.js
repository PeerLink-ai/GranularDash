import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
  return res.status(200).json({ logs });
} 