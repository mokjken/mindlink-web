import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('mindlink.db');

export function initDb() {
    db.serialize(() => {
        console.log("Initializing Database...");

        // Mood Entries Table
        db.run(`CREATE TABLE IF NOT EXISTS mood_entries (
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
        )`);

        // Safety Reports Table
        db.run(`CREATE TABLE IF NOT EXISTS safety_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT,
            type TEXT,
            description TEXT,
            status TEXT,
            created_at INTEGER
        )`);

        // User Statuses Table (WeChat Style)
        // FORCE DROP to ensure schema is always correct during development
        db.run(`DROP TABLE IF EXISTS user_statuses`, (err) => {
            if (err) console.error("Error dropping user_statuses:", err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS user_statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            status_key TEXT NOT NULL,
            custom_text TEXT,
            color_hex TEXT NOT NULL,
            created_at INTEGER,
            expires_at INTEGER
        )`, (err) => {
            if (err) console.error("Error creating user_statuses:", err);
            else console.log("Table user_statuses created/verified.");
        });

        // Ensure index exists
        db.run(`CREATE INDEX IF NOT EXISTS idx_statuses_user_id ON user_statuses(user_id)`);
    });
}

export function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

export function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export default db;
