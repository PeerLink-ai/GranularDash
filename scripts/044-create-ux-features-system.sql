-- Advanced User Experience Features System
-- AI Assistant, Dashboard Builder, Mobile Experience, and Theming

-- AI Assistant Tables
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'deleted'
    context_data JSONB, -- User preferences, dashboard context, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES ai_conversations(id),
    message_type VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    intent VARCHAR(100), -- 'query_data', 'create_chart', 'explain_metric', 'troubleshoot'
    entities JSONB, -- Extracted entities like dates, metrics, filters
    response_data JSONB, -- Charts, tables, or other structured responses
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_query_cache (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL,
    query_text TEXT NOT NULL,
    response_data JSONB NOT NULL,
    cache_hits INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard Builder Tables
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB NOT NULL, -- Grid layout, widget positions, sizes
    theme_config JSONB, -- Colors, fonts, styling preferences
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    tags JSONB, -- Array of tags for categorization
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER REFERENCES custom_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(100) NOT NULL, -- 'chart', 'metric', 'table', 'text', 'image'
    widget_config JSONB NOT NULL, -- Chart type, data source, filters, styling
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    title VARCHAR(255),
    data_source VARCHAR(255), -- Table or API endpoint
    query_config JSONB, -- SQL query or API parameters
    refresh_interval INTEGER DEFAULT 300, -- Seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS widget_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'analytics', 'monitoring', 'business', 'custom'
    description TEXT,
    widget_type VARCHAR(100) NOT NULL,
    default_config JSONB NOT NULL,
    preview_image VARCHAR(500),
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_shares (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER REFERENCES custom_dashboards(id) ON DELETE CASCADE,
    shared_by INTEGER NOT NULL,
    shared_with INTEGER, -- NULL for public shares
    permission_level VARCHAR(50) DEFAULT 'view', -- 'view', 'edit', 'admin'
    share_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences and Personalization
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    theme VARCHAR(50) DEFAULT 'system', -- 'light', 'dark', 'system'
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(100) DEFAULT 'UTC',
    date_format VARCHAR(50) DEFAULT 'MM/dd/yyyy',
    number_format VARCHAR(50) DEFAULT 'en-US',
    dashboard_layout VARCHAR(50) DEFAULT 'grid', -- 'grid', 'list', 'compact'
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    accessibility_settings JSONB DEFAULT '{"high_contrast": false, "large_text": false, "reduced_motion": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_type VARCHAR(100) NOT NULL, -- 'dashboard', 'report', 'chart', 'query'
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS user_recent_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- 'viewed_dashboard', 'created_chart', 'ran_query'
    item_type VARCHAR(100),
    item_id INTEGER,
    activity_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mobile Experience Tables
CREATE TABLE IF NOT EXISTS mobile_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_type VARCHAR(50), -- 'ios', 'android', 'tablet'
    device_info JSONB, -- OS version, app version, screen size
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    pages_visited JSONB,
    actions_performed JSONB
);

CREATE TABLE IF NOT EXISTS push_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100), -- 'alert', 'reminder', 'update', 'marketing'
    data JSONB, -- Deep link data, action buttons
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'clicked'
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theme and Customization Tables
CREATE TABLE IF NOT EXISTS theme_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme_type VARCHAR(50) NOT NULL, -- 'light', 'dark', 'custom'
    color_palette JSONB NOT NULL, -- Primary, secondary, accent colors
    typography_config JSONB, -- Font families, sizes, weights
    component_styles JSONB, -- Button styles, card styles, etc.
    is_system_theme BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_themes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    theme_name VARCHAR(255) NOT NULL,
    theme_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and Usage Tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    feature_name VARCHAR(255) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    feedback_type VARCHAR(100) NOT NULL, -- 'bug_report', 'feature_request', 'general'
    title VARCHAR(255),
    description TEXT NOT NULL,
    rating INTEGER, -- 1-5 scale
    page_url VARCHAR(500),
    browser_info JSONB,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO widget_templates (name, category, description, widget_type, default_config, is_featured) VALUES
('Revenue Chart', 'business', 'Line chart showing revenue over time', 'chart', 
 '{"chartType": "line", "dataSource": "revenue_metrics", "xAxis": "date", "yAxis": "amount", "color": "#3b82f6"}', true),
('KPI Metric Card', 'analytics', 'Display key performance indicator with trend', 'metric',
 '{"metricType": "kpi", "showTrend": true, "trendPeriod": "30d", "format": "number"}', true),
('System Status Table', 'monitoring', 'Table showing system health status', 'table',
 '{"dataSource": "system_status", "columns": ["name", "status", "uptime"], "refreshInterval": 60}', true),
('Alert Summary', 'monitoring', 'Summary of active alerts and incidents', 'metric',
 '{"dataSource": "alerts", "aggregation": "count", "filters": {"status": "active"}}', true);

INSERT INTO theme_templates (name, description, theme_type, color_palette, is_system_theme, is_public) VALUES
('Default Light', 'Clean light theme with blue accents', 'light', 
 '{"primary": "#3b82f6", "secondary": "#64748b", "accent": "#06b6d4", "background": "#ffffff", "surface": "#f8fafc"}', true, true),
('Default Dark', 'Modern dark theme with blue accents', 'dark',
 '{"primary": "#60a5fa", "secondary": "#94a3b8", "accent": "#22d3ee", "background": "#0f172a", "surface": "#1e293b"}', true, true),
('Corporate Blue', 'Professional blue theme for business use', 'light',
 '{"primary": "#1e40af", "secondary": "#475569", "accent": "#0ea5e9", "background": "#ffffff", "surface": "#f1f5f9"}', false, true),
('High Contrast', 'Accessibility-focused high contrast theme', 'light',
 '{"primary": "#000000", "secondary": "#4a5568", "accent": "#2d3748", "background": "#ffffff", "surface": "#f7fafc"}', false, true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);
