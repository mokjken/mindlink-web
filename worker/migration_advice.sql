DROP TABLE IF EXISTS ai_advice;
CREATE TABLE IF NOT EXISTS ai_advice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_role TEXT,      -- 'Teacher' or 'Admin'
    scope_id TEXT,         -- class_id (for Teacher) or 'All' (for Admin)
    content TEXT,
    checked_indices TEXT,  
    date_str TEXT,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_advice_lookup ON ai_advice(target_role, scope_id, date_str);
