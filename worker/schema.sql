DROP TABLE IF EXISTS mood_entries;
CREATE TABLE IF NOT EXISTS mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,
    class_id TEXT,
    mood_score INTEGER,
    emotion_label TEXT,
    mood_color TEXT,
    content TEXT,
    location TEXT,
    risk_level TEXT,
    category TEXT,
    created_at INTEGER
);

DROP TABLE IF EXISTS safety_reports;
CREATE TABLE IF NOT EXISTS safety_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT,
    type TEXT,
    description TEXT,
    status TEXT,
    created_at INTEGER
);

DROP TABLE IF EXISTS user_statuses;
CREATE TABLE IF NOT EXISTS user_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    class_id TEXT,
    status_key TEXT NOT NULL,
    custom_text TEXT,
    color_hex TEXT NOT NULL,
    created_at INTEGER,
    expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_statuses_user_id ON user_statuses(user_id);
