import fs from 'fs';
import path from 'path';

export async function POST(request) {
  const body = await request.json();
  const { agentId, action, command, details } = body;

  // Load agents configuration
  const agentsFile = path.join(process.cwd(), 'agents-config.json');
  let agents = [];
  if (fs.existsSync(agentsFile)) {
    try {
      agents = JSON.parse(fs.readFileSync(agentsFile, 'utf-8'));
    } catch {
      agents = [];
    }
  }

  const agent = agents.find(a => a.agentId === agentId);
  if (!agent) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Agent not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let result = { success: false, message: 'Unknown action' };

  if (action === 'activate') {
    // Activate agent
    agent.status = 'active';
    agent.lastActivated = new Date().toISOString();
    result = { success: true, message: 'Agent activated' };
  } else if (action === 'deactivate') {
    // Deactivate agent
    agent.status = 'inactive';
    agent.lastDeactivated = new Date().toISOString();
    result = { success: true, message: 'Agent deactivated' };
  } else if (action === 'command') {
    // Send command to agent
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (agent.agentApiKey && agent.agentApiKey !== '***') {
        headers['Authorization'] = `Bearer ${agent.agentApiKey}`;
      }

      const res = await fetch(agent.agentApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          agentId, 
          action: 'command',
          command,
          details 
        })
      });

      if (res.ok) {
        const response = await res.json();
        result = { success: true, message: 'Command sent successfully', response };
        agent.lastConnected = new Date().toISOString();
      } else {
        result = { success: false, message: `Command failed: ${res.status}` };
      }
    } catch (err) {
      result = { success: false, message: `Command error: ${err.message}` };
    }
  }

  // Save updated agents configuration
  fs.writeFileSync(agentsFile, JSON.stringify(agents, null, 2));

  // Log the action
  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  const logEntry = {
    id: `AL${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    action: action === 'command' ? `Command: ${command}` : action,
    resource: agent.agentName,
    status: result.success ? 'Success' : 'Failed',
    details: details || result.message,
    agentApiUrl: agent.agentApiUrl,
    result: result
  };

  let logs = [];
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    } catch {
      logs = [];
    }
  }
  logs.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

  return new Response(JSON.stringify({ 
    success: result.success, 
    message: result.message,
    agent: agent,
    logEntry 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
