import fs from 'fs';
import path from 'path';

export async function POST(request) {
  const body = await request.json();
  const { agentId, agentName, agentApiUrl, agentApiKey, agentType, details } = body;
  
  // Load existing agents configuration
  const agentsFile = path.join(process.cwd(), 'agents-config.json');
  let agents = [];
  if (fs.existsSync(agentsFile)) {
    try {
      agents = JSON.parse(fs.readFileSync(agentsFile, 'utf-8'));
    } catch {
      agents = [];
    }
  }

  // Check if agent already exists
  const existingAgent = agents.find(a => a.agentId === agentId);
  if (existingAgent) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Agent with this ID already exists' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Test connection to agent API
  let connectionStatus = 'Failed';
  let agentResponse = null;
  let agentError = null;
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (agentApiKey) {
      headers['Authorization'] = `Bearer ${agentApiKey}`;
    }

    const res = await fetch(agentApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        agentId, 
        agentName, 
        action: 'connect',
        details 
      })
    });
    
    if (res.ok) {
      agentResponse = await res.json();
      connectionStatus = 'Connected';
    } else {
      agentError = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err) {
    agentError = err.message || String(err);
  }

  // Create new agent entry
  const newAgent = {
    agentId,
    agentName,
    agentApiUrl,
    agentApiKey: agentApiKey ? '***' : null, // Don't store actual key in config
    agentType: agentType || 'custom',
    status: connectionStatus === 'Connected' ? 'active' : 'inactive',
    createdAt: new Date().toISOString(),
    lastConnected: connectionStatus === 'Connected' ? new Date().toISOString() : null,
    connectionStatus
  };

  // Add to agents list
  agents.push(newAgent);
  fs.writeFileSync(agentsFile, JSON.stringify(agents, null, 2));

  // Log the connection attempt
  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  const logEntry = {
    id: `AL${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    action: 'Register Agent',
    resource: agentName,
    status: connectionStatus,
    details: details || 'Agent registration attempt',
    agentApiUrl,
    agentType,
    agentResponse,
    agentError
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
    success: connectionStatus === 'Connected', 
    status: connectionStatus, 
    agent: newAgent,
    logEntry 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
