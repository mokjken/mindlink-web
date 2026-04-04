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

DROP TABLE IF EXISTS user_status_reactions;
CREATE TABLE IF NOT EXISTS user_status_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_id INTEGER NOT NULL,
    reactor_user_id TEXT NOT NULL,
    created_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_status_reactions_unique ON user_status_reactions(status_id, reactor_user_id);
CREATE INDEX IF NOT EXISTS idx_status_reactions_status_id ON user_status_reactions(status_id);

DROP TABLE IF EXISTS portal_classes;
CREATE TABLE IF NOT EXISTS portal_classes (
    class_id TEXT PRIMARY KEY,
    faculty TEXT NOT NULL,
    default_location TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_portal_classes_faculty ON portal_classes(faculty, is_active, sort_order);

DROP TABLE IF EXISTS user_feature_usage;
CREATE TABLE IF NOT EXISTS user_feature_usage (
    user_id TEXT NOT NULL,
    class_id TEXT,
    feature_key TEXT NOT NULL,
    upload_count INTEGER DEFAULT 0,
    last_uploaded_at INTEGER,
    PRIMARY KEY (user_id, class_id, feature_key)
);
CREATE INDEX IF NOT EXISTS idx_user_feature_usage_feature ON user_feature_usage(feature_key, upload_count DESC);

DROP TABLE IF EXISTS achievement_events;
CREATE TABLE IF NOT EXISTS achievement_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    class_id TEXT,
    event_key TEXT NOT NULL,
    feature_key TEXT,
    reference_id TEXT,
    event_value INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_events_user_time ON achievement_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievement_events_event ON achievement_events(event_key, created_at DESC);

DROP TABLE IF EXISTS daily_user_activity;
CREATE TABLE IF NOT EXISTS daily_user_activity (
    user_id TEXT NOT NULL,
    activity_date TEXT NOT NULL,
    class_id TEXT,
    mood_count INTEGER DEFAULT 0,
    status_count INTEGER DEFAULT 0,
    resonance_sent_count INTEGER DEFAULT 0,
    resonance_received_count INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    last_activity_at INTEGER,
    PRIMARY KEY (user_id, activity_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_user_activity_class_date ON daily_user_activity(class_id, activity_date DESC);

DROP TABLE IF EXISTS user_badges;
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    class_id TEXT,
    badge_key TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_tier TEXT NOT NULL,
    progress_value INTEGER DEFAULT 0,
    unlocked_at INTEGER NOT NULL,
    last_seen_at INTEGER,
    UNIQUE(user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_time ON user_badges(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at DESC);

DROP TABLE IF EXISTS user_portal_progress;
CREATE TABLE IF NOT EXISTS user_portal_progress (
    user_id TEXT NOT NULL,
    class_id TEXT,
    portal_key TEXT NOT NULL,
    start_seen_at INTEGER,
    guide_completed_at INTEGER,
    updated_at INTEGER,
    PRIMARY KEY (user_id, portal_key)
);
CREATE INDEX IF NOT EXISTS idx_user_portal_progress_class_portal ON user_portal_progress(class_id, portal_key);

DROP TABLE IF EXISTS ai_advice;
CREATE TABLE IF NOT EXISTS ai_advice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_role TEXT NOT NULL,
    scope_id TEXT NOT NULL,
    content TEXT NOT NULL,
    checked_indices TEXT DEFAULT '[]',
    date_str TEXT NOT NULL,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ai_advice_role_scope_date ON ai_advice(target_role, scope_id, date_str);
