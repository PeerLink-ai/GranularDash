-- Create content management tables for training system
-- This script creates tables for managing training content, learning paths, and content workflows

-- Content library table for storing all training materials
CREATE TABLE IF NOT EXISTS training_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL, -- 'module', 'scenario', 'quiz', 'document', 'video'
    content_data JSONB NOT NULL, -- Stores the actual content structure
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    tags TEXT[], -- Array of tags for categorization
    category_id INTEGER REFERENCES training_categories(id),
    author_id INTEGER NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
    version INTEGER DEFAULT 1,
    parent_content_id INTEGER REFERENCES training_content(id), -- For versioning
    approval_required BOOLEAN DEFAULT true,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning paths table for structured training sequences
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    path_type VARCHAR(50) DEFAULT 'sequential', -- 'sequential', 'adaptive', 'flexible'
    target_audience TEXT[],
    prerequisites TEXT[],
    learning_objectives TEXT[],
    estimated_duration INTEGER DEFAULT 0, -- total duration in minutes
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning path content mapping
CREATE TABLE IF NOT EXISTS learning_path_content (
    id SERIAL PRIMARY KEY,
    learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    unlock_conditions JSONB, -- Conditions to unlock this content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(learning_path_id, sequence_order)
);

-- Content reviews and feedback
CREATE TABLE IF NOT EXISTS content_reviews (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL,
    review_type VARCHAR(20) DEFAULT 'approval', -- 'approval', 'feedback', 'quality_check'
    status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected', 'needs_revision'
    comments TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content usage analytics
CREATE TABLE IF NOT EXISTS content_analytics (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- 'view', 'start', 'complete', 'pause', 'resume', 'skip'
    event_data JSONB,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content effectiveness metrics
CREATE TABLE IF NOT EXISTS content_effectiveness (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'completion_rate', 'average_score', 'time_spent', 'user_rating'
    metric_value DECIMAL(10,2),
    calculation_date DATE DEFAULT CURRENT_DATE,
    sample_size INTEGER DEFAULT 0,
    UNIQUE(content_id, metric_type, calculation_date)
);

-- Content templates for quick creation
CREATE TABLE IF NOT EXISTS content_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL,
    is_system_template BOOLEAN DEFAULT false,
    organization_id VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User learning path enrollments
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
    id SERIAL PRIMARY KEY,
    learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    enrollment_type VARCHAR(20) DEFAULT 'voluntary', -- 'voluntary', 'mandatory', 'assigned'
    enrolled_by INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'dropped'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_content_id INTEGER REFERENCES training_content(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(learning_path_id, user_id)
);

-- Content prerequisites and dependencies
CREATE TABLE IF NOT EXISTS content_dependencies (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    prerequisite_content_id INTEGER NOT NULL REFERENCES training_content(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'required', -- 'required', 'recommended', 'related'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, prerequisite_content_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_content_status ON training_content(status);
CREATE INDEX IF NOT EXISTS idx_training_content_category ON training_content(category_id);
CREATE INDEX IF NOT EXISTS idx_training_content_type ON training_content(content_type);
CREATE INDEX IF NOT EXISTS idx_training_content_org ON training_content(organization_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_content_path ON learning_path_content(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_content_order ON learning_path_content(learning_path_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_learning_paths_org ON learning_paths(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content ON content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_user ON content_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_event ON content_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_user ON learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_path ON learning_path_enrollments(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_content_effectiveness_content ON content_effectiveness(content_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_org ON content_templates(organization_id);

-- Insert some default content templates
INSERT INTO content_templates (name, description, content_type, template_data, is_system_template, organization_id, created_by) VALUES
('Basic Quiz Template', 'Standard multiple choice quiz template', 'quiz', 
 '{"questions": [{"type": "multiple_choice", "question": "", "options": ["", "", "", ""], "correct_answer": 0, "explanation": ""}], "passing_score": 70, "time_limit": 30}', 
 true, 'system', 1),
('Scenario Template', 'Interactive scenario with decision points', 'scenario',
 '{"title": "", "description": "", "initial_situation": "", "decision_points": [{"situation": "", "options": [{"text": "", "consequence": "", "score": 0}]}], "learning_objectives": []}',
 true, 'system', 1),
('Training Module Template', 'Standard training module with sections', 'module',
 '{"title": "", "description": "", "sections": [{"title": "", "content": "", "type": "text"}], "learning_objectives": [], "assessment": null}',
 true, 'system', 1);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_training_content_updated_at BEFORE UPDATE ON training_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
