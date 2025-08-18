-- Create lineage_mapping table for tracking agent interactions
CREATE TABLE IF NOT EXISTS lineage_mapping (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    token_usage JSONB,
    response_time INTEGER,
    evaluation_scores JSONB,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    db_queries JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_agent_id ON lineage_mapping(agent_id);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_created_at ON lineage_mapping(created_at);
CREATE INDEX IF NOT EXISTS idx_lineage_mapping_agent_created ON lineage_mapping(agent_id, created_at);

-- Added check to prevent duplicate constraint error
-- Add foreign key constraint if connected_agents table exists and constraint doesn't already exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connected_agents') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_lineage_mapping_agent' 
                      AND table_name = 'lineage_mapping') THEN
        ALTER TABLE lineage_mapping 
        ADD CONSTRAINT fk_lineage_mapping_agent 
        FOREIGN KEY (agent_id) REFERENCES connected_agents(agent_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Insert sample lineage data for testing
INSERT INTO lineage_mapping (
    id, agent_id, prompt, response, token_usage, response_time, evaluation_scores
) VALUES 
(
    'lineage-sample-1',
    (SELECT agent_id FROM connected_agents LIMIT 1),
    'What is artificial intelligence?',
    'Artificial intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans.',
    '{"prompt": 15, "completion": 25, "total": 40}',
    1250,
    '{"relevance": 95, "accuracy": 90, "safety": 100, "coherence": 92, "overall": 94}'
),
(
    'lineage-sample-2', 
    (SELECT agent_id FROM connected_agents LIMIT 1),
    'Explain machine learning basics',
    'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed for every task.',
    '{"prompt": 18, "completion": 30, "total": 48}',
    1450,
    '{"relevance": 98, "accuracy": 95, "safety": 100, "coherence": 96, "overall": 97}'
) ON CONFLICT (id) DO NOTHING;
