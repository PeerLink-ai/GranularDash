-- Fix training simulations table - add missing completed_at field and enhance schema
ALTER TABLE training_simulations 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pass_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'intermediate';

-- Add training sessions table for tracking individual user sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    id SERIAL PRIMARY KEY,
    simulation_id INTEGER REFERENCES training_simulations(id) ON DELETE CASCADE,
    user_id INTEGER,
    organization_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    score INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress',
    time_spent_minutes INTEGER,
    answers JSONB,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add training categories table
CREATE TABLE IF NOT EXISTS training_categories (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add training progress tracking
CREATE TABLE IF NOT EXISTS training_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    module_id INTEGER REFERENCES training_modules(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP DEFAULT NOW(),
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing completed simulations to have completed_at timestamps
UPDATE training_simulations 
SET completed_at = last_run 
WHERE status = 'completed' AND completed_at IS NULL AND last_run IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_simulation ON training_sessions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_org ON training_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_categories_org ON training_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_module ON training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_org ON training_progress(organization_id);
