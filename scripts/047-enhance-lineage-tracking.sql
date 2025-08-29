-- Enhance lineage_mapping table with additional tracking capabilities
ALTER TABLE lineage_mapping 
ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(50) DEFAULT 'playground_test',
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_interaction_id VARCHAR(255);

-- Create indexes for enhanced querying
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_interaction_type ON lineage_mapping(interaction_type);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_user_id ON lineage_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_session_id ON lineage_mapping(session_id);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_parent_id ON lineage_mapping(parent_interaction_id);

-- Create table for real-time agent activity tracking
CREATE TABLE IF NOT EXISTS agent_activity_stream (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'api_call', 'tool_use', 'decision', 'error'
    activity_data JSONB NOT NULL,
    lineage_id VARCHAR(255), -- Reference to lineage_mapping
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed' -- 'started', 'completed', 'failed'
);

-- Create indexes for activity stream
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON agent_activity_stream(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_timestamp ON agent_activity_stream(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_activity_lineage_id ON agent_activity_stream(lineage_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_type ON agent_activity_stream(activity_type);

-- Add foreign key constraints
ALTER TABLE agent_activity_stream 
ADD CONSTRAINT fk_agent_activity_lineage 
FOREIGN KEY (lineage_id) REFERENCES lineage_mapping(id) ON DELETE CASCADE;

-- Insert sample activity data
INSERT INTO agent_activity_stream (agent_id, activity_type, activity_data, duration_ms) VALUES
((SELECT agent_id FROM connected_agents LIMIT 1), 'api_call', '{"endpoint": "openai", "model": "gpt-3.5-turbo", "tokens": 150}', 1200),
((SELECT agent_id FROM connected_agents LIMIT 1), 'decision', '{"type": "response_generation", "confidence": 0.92, "reasoning": "High confidence based on clear prompt"}', 50),
((SELECT agent_id FROM connected_agents LIMIT 1), 'tool_use', '{"tool": "web_search", "query": "AI safety guidelines", "results_count": 5}', 800)
ON CONFLICT DO NOTHING;
