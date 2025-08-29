-- Fix the lineage_mapping table to properly reference connected_agents
-- First, drop the existing foreign key constraint if it exists
ALTER TABLE lineage_mapping DROP CONSTRAINT IF EXISTS fk_lineage_mapping_agent;

-- Change agent_id column to UUID to match connected_agents.id
ALTER TABLE lineage_mapping ALTER COLUMN agent_id TYPE UUID USING agent_id::uuid;

-- Add the correct foreign key constraint
ALTER TABLE lineage_mapping 
ADD CONSTRAINT fk_lineage_mapping_agent 
FOREIGN KEY (agent_id) REFERENCES connected_agents(id) ON DELETE CASCADE;

-- Clear existing sample data that might have invalid references
DELETE FROM lineage_mapping WHERE id LIKE 'lineage-sample-%';

-- Insert new sample data with proper UUID references
INSERT INTO lineage_mapping (
    id, agent_id, prompt, response, token_usage, response_time, evaluation_scores,
    tool_calls, db_queries, decisions
) 
SELECT 
    'lineage-sample-' || generate_random_uuid(),
    ca.id,
    'What is artificial intelligence and how does it work?',
    'Artificial intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It encompasses various techniques including machine learning, natural language processing, and computer vision.',
    '{"prompt": 25, "completion": 45, "total": 70}'::jsonb,
    1850,
    '{"relevance": 96, "accuracy": 94, "safety": 100, "coherence": 95, "overall": 96}'::jsonb,
    '[{"name": "web_search", "parameters": {"query": "artificial intelligence definition"}, "result": "Found comprehensive AI definition"}]'::jsonb,
    '[{"table": "knowledge_base", "operation": "SELECT", "query": "SELECT * FROM knowledge_base WHERE topic = ''AI''"}]'::jsonb,
    '[{"type": "information_synthesis", "reasoning": "Combined multiple sources to provide comprehensive answer", "confidence": 0.94}]'::jsonb
FROM connected_agents ca 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert another sample with different agent if available
INSERT INTO lineage_mapping (
    id, agent_id, prompt, response, token_usage, response_time, evaluation_scores,
    tool_calls, db_queries
) 
SELECT 
    'lineage-sample-' || generate_random_uuid(),
    ca.id,
    'Explain machine learning and its applications',
    'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. Applications include recommendation systems, image recognition, natural language processing, and predictive analytics.',
    '{"prompt": 20, "completion": 38, "total": 58}'::jsonb,
    1650,
    '{"relevance": 98, "accuracy": 96, "safety": 100, "coherence": 97, "overall": 98}'::jsonb,
    '[{"name": "database_query", "parameters": {"table": "ml_examples"}, "result": "Retrieved ML application examples"}]'::jsonb,
    '[{"table": "ml_examples", "operation": "SELECT", "query": "SELECT application, description FROM ml_examples LIMIT 10"}]'::jsonb
FROM connected_agents ca 
OFFSET 1 LIMIT 1
ON CONFLICT (id) DO NOTHING;
