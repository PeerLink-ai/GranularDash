import fs from 'fs';
import path from 'path';

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Agent ID is required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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

  const agentIndex = agents.findIndex(a => a.agentId === agentId);
  if (agentIndex === -1) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Agent not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const deletedAgent = agents[agentIndex];
  agents.splice(agentIndex, 1);
  fs.writeFileSync(agentsFile, JSON.stringify(agents, null, 2));

  // Log the deletion
  const logFile = path.join(process.cwd(), 'agent-action-log.json');
  const logEntry = {
    id: `AL${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    action: 'Delete Agent',
    resource: deletedAgent.agentName,
    status: 'Success',
    details: 'Agent removed from system',
    agentApiUrl: deletedAgent.agentApiUrl
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
    success: true, 
    message: 'Agent deleted successfully',
    deletedAgent,
    logEntry 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
