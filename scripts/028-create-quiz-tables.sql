-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    total_time INTEGER NOT NULL, -- in seconds
    responses JSONB NOT NULL,
    certificate_eligible BOOLEAN DEFAULT FALSE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    quiz_attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id),
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    certificate_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create competency tracking table
CREATE TABLE IF NOT EXISTS user_competencies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    category VARCHAR(255) NOT NULL,
    skill_area VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced, expert
    last_assessed TIMESTAMP DEFAULT NOW(),
    assessment_score INTEGER,
    certification_status VARCHAR(50), -- none, pending, certified, expired
    next_assessment_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_organization ON quiz_attempts(organization_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competencies_user_id ON user_competencies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competencies_category ON user_competencies(category);
