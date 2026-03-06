-- Cloudflare D1 Migration for MindStatus

-- Create Table: user_statuses
CREATE TABLE IF NOT EXISTS user_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    status_key TEXT NOT NULL,   -- e.g., 'busy', 'focus', 'happy'
    custom_text TEXT,           -- Optional user message
    color_hex TEXT NOT NULL,    -- UI Theme Color
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_statuses_user_id ON user_statuses(user_id);
