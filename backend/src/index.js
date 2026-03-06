import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initDb, run, all, get } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database
initDb();

// Constants & Helpers
const RISK_KEYWORDS = ['die', 'hurt', 'pain', 'bullying', 'suicide', 'kill', 'hopeless', 'blood', 'bomb'];
const CATEGORIES = ['Academic', 'Social', 'Family', 'Health', 'Future'];
const EMOTIONS = [
    { label: 'Happy', color: '#FFD700', score: 5, category: 'Positive' },
    { label: 'Satisfied', color: '#FFA07A', score: 4, category: 'Positive' },
    { label: 'Relaxed', color: '#98FF98', score: 4, category: 'Positive' },
    { label: 'Calm', color: '#E0FFFF', score: 3, category: 'Neutral' },
    { label: 'Angry', color: '#B22222', score: 1, category: 'Negative' },
    { label: 'Frustrated', color: '#CD5C5C', score: 2, category: 'Negative' },
    { label: 'Out of Control', color: '#FF4500', score: 1, category: 'Negative' },
    { label: 'Tense', color: '#D87093', score: 2, category: 'Negative' },
    { label: 'Confused', color: '#556B2F', score: 2, category: 'Negative' },
    { label: 'Stressed', color: '#191970', score: 1, category: 'Negative' },
    { label: 'Melancholy', color: '#607B8B', score: 2, category: 'Negative' },
    { label: 'Sad', color: '#708090', score: 2, category: 'Negative' },
    { label: 'Lonely', color: '#000000', score: 1, category: 'Negative' },
    { label: 'Rejected', color: '#8FBC8F', score: 1, category: 'Negative' },
];

const analyzeRisk = (content) => {
    const lowerContent = (content || '').toLowerCase();
    return RISK_KEYWORDS.some(word => lowerContent.includes(word)) ? 'High' : 'Normal';
};

// --- ROUTES ---

// Submit Mood
app.post('/api/mood', async (req, res) => {
    try {
        const { user_id, role, class_id, mood_score, emotion_label, mood_color, content, location } = req.body;

        // Auto-detect risk and category
        const risk_level = analyzeRisk(content);
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]; // Simple random for demo if not provided
        const created_at = Date.now();

        const sql = `INSERT INTO mood_entries (user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await run(sql, [user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at]);

        res.json({ success: true, risk_level });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Submit Safety Report
app.post('/api/safety', async (req, res) => {
    try {
        const { location, type, description } = req.body;
        const sql = `INSERT INTO safety_reports (location, type, description, status, created_at) VALUES (?, ?, ?, ?, ?)`;
        await run(sql, [location, type, description, 'Pending', Date.now()]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student Mood History (Last 7 Days)
app.get('/api/student/history', async (req, res) => {
    try {
        const { user_id } = req.query;
        // Fetch last 7 days of entries for this user
        // We want 1 entry per day max (or just the latest one per day)
        // Simplified: just get entries from last 7 days and frontend filters
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const entries = await all(
            `SELECT mood_color, created_at FROM mood_entries 
             WHERE user_id = ? AND created_at > ? 
             ORDER BY created_at ASC`,
            [user_id, sevenDaysAgo]
        );
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Mood Status (WeChat Style) - Updated Schema ---
// Get Status
app.get('/api/status', async (req, res) => {
    try {
        const { user_id } = req.query;
        const now = Date.now();
        // Fetch valid status
        const status = await get(
            `SELECT * FROM user_statuses WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`,
            [user_id, now]
        );
        res.json(status || null);
    } catch (err) {
        console.error("Error in GET /api/status:", err);
        res.status(500).json({ error: err.message });
    }
});

// Set Status
app.post('/api/status', async (req, res) => {
    try {
        const { user_id, status_key, custom_text, color_hex } = req.body;
        const now = Date.now();
        const expires_at = now + (24 * 60 * 60 * 1000); // 24 hours from now

        // Delete old status for this user (Enforce one active status)
        await run(`DELETE FROM user_statuses WHERE user_id = ?`, [user_id]);

        // Insert new status
        await run(
            `INSERT INTO user_statuses (user_id, status_key, custom_text, color_hex, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, status_key, custom_text || null, color_hex, now, expires_at]
        );

        res.json({ success: true, expires_at });
    } catch (err) {
        console.error("Error in POST /api/status:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Anonymous Status Feed
app.get('/api/status/feed', async (req, res) => {
    try {
        const now = Date.now();
        // Fetch all active statuses, descending by creation time
        // EXCLUDE user identifier to ensure anonymity (or hash it if needed, but for now just omit)
        const statuses = await all(
            `SELECT status_key, custom_text, color_hex, created_at FROM user_statuses 
             WHERE expires_at > ? 
             ORDER BY created_at DESC LIMIT 50`,
            [now]
        );
        res.json(statuses);
    } catch (err) {
        console.error("Error in GET /api/status/feed:", err);
        res.status(500).json({ error: err.message });
    }
});

// Search Logs (Universal)
app.get('/api/logs/search', async (req, res) => {
    try {
        const { q, risk_level, class_id, start_date, end_date } = req.query;
        let sql = `SELECT * FROM mood_entries WHERE 1=1`;
        const params = [];

        if (class_id) {
            sql += ` AND class_id = ?`;
            params.push(class_id);
        }
        if (risk_level && risk_level !== 'All') {
            sql += ` AND risk_level = ?`;
            params.push(risk_level);
        }
        if (q) {
            sql += ` AND (content LIKE ? OR location LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }
        if (start_date) {
            sql += ` AND created_at >= ?`;
            params.push(parseInt(start_date));
        }
        if (end_date) {
            sql += ` AND created_at <= ?`;
            params.push(parseInt(end_date));
        }

        sql += ` ORDER BY created_at DESC LIMIT 100`;

        const entries = await all(sql, params);
        res.json(entries);
    } catch (err) {
        console.error("Error in GET /api/logs/search:", err);
        res.status(500).json({ error: err.message });
    }
});

// Teacher Class Stats
app.get('/api/teacher/class-stats', async (req, res) => {
    try {
        const { class_id } = req.query;
        const entries = await all(`SELECT * FROM mood_entries WHERE class_id = ? ORDER BY created_at DESC LIMIT 50`, [class_id]);
        const highRisk = entries.filter(e => e.risk_level === 'High');

        // Distribution
        const distribution = EMOTIONS.map(e => ({
            name: e.label,
            value: entries.filter(entry => entry.emotion_label === e.label).length,
            color: e.color
        })).filter(d => d.value > 0);

        res.json({
            entries,
            highRisk,
            distribution
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teacher Radar Data
app.get('/api/teacher/radar', async (req, res) => {
    try {
        const { class_id } = req.query;
        const entries = await all(`SELECT * FROM mood_entries WHERE class_id = ?`, [class_id]);

        // Calculate category averages
        const categories = ['Academic', 'Social', 'Family', 'Health', 'Future'];
        const result = categories.map(cat => {
            const catEntries = entries.filter(e => e.category === cat);
            const avgScore = catEntries.length
                ? catEntries.reduce((sum, e) => sum + e.mood_score, 0) / catEntries.length
                : 3; // Default neutral

            return {
                subject: cat,
                A: Math.round((avgScore / 5) * 100),
                fullMark: 100
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teacher Activity Volume
app.get('/api/teacher/activity', async (req, res) => {
    try {
        const { class_id } = req.query;
        const entries = await all(`SELECT created_at FROM mood_entries WHERE class_id = ?`, [class_id]);

        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString();
        }).reverse();

        const result = last7Days.map(date => {
            // Note: This string matching is timezone sensitive and brittle in production, but fine for demo
            const count = entries.filter(e => new Date(e.created_at).toLocaleDateString() === date).length;
            return { date: date.split('/')[1] + '/' + date.split('/')[2], count }; // MM/DD
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Stacked Data (simplified)
app.get('/api/admin/stacked-data', async (req, res) => {
    try {
        const entries = await all(`SELECT * FROM mood_entries`);
        const validLocations = [
            'AQ1', 'AQ2', 'AQ3', 'AQ4', 'ElectricityBuilding', 'SideBuilding',
            'GirlDorm', 'BoyDorm', 'Canteen', 'SwimmingPool', 'DormAB', 'DormCD',
            'AdministrationBuilding', 'Gymnasium', 'BasketballCourt'
        ];

        const locationMap = {};
        validLocations.forEach(loc => {
            locationMap[loc] = { name: loc, Positive: 0, Neutral: 0, Negative: 0, Risk: 0 };
        });

        entries.forEach(e => {
            if (!e.location || !locationMap[e.location]) return;
            if (e.risk_level === 'High') locationMap[e.location].Risk++;
            else if (e.mood_score >= 4) locationMap[e.location].Positive++;
            else if (e.mood_score === 3) locationMap[e.location].Neutral++;
            else locationMap[e.location].Negative++;
        });

        res.json(Object.values(locationMap).filter(l => (l.Positive + l.Neutral + l.Negative + l.Risk) > 0));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Heatmap
app.get('/api/admin/heatmap', async (req, res) => {
    try {
        const entries = await all(`SELECT location, mood_color, risk_level FROM mood_entries`);
        const stats = {};

        entries.forEach(e => {
            if (!e.location) return;
            if (!stats[e.location]) stats[e.location] = { highRisk: 0, total: 0, moods: [] };

            stats[e.location].total++;
            stats[e.location].moods.push(e.mood_color);
            if (e.risk_level === 'High') stats[e.location].highRisk++;
        });

        const result = Object.keys(stats).map(loc => {
            const data = stats[loc];
            const rawRatio = data.highRisk / data.total;
            return {
                location: loc,
                riskScore: Math.min(rawRatio * 5, 1),
                recentMoods: data.moods.slice(-30)
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Risk Dist
app.get('/api/admin/risk-dist', async (req, res) => {
    try {
        const entries = await all(`SELECT mood_score, risk_level FROM mood_entries`);
        const total = entries.length;
        if (total === 0) return res.json([]);

        const high = entries.filter(e => e.risk_level === 'High').length;
        const medium = entries.filter(e => e.risk_level === 'Normal' && e.mood_score <= 2).length;
        const low = total - high - medium;

        res.json([
            { name: 'Low Risk', value: low, color: '#10b981' },
            { name: 'Medium Risk', value: medium, color: '#f59e0b' },
            { name: 'High Risk', value: high, color: '#ef4444' }
        ]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Demo Generate Data
app.post('/api/demo/generate', async (req, res) => {
    try {

        const { count, target_class } = req.body;

        // School Structure Definition for Backend
        const SCHOOL_DATA = {
            CNC: { classes: ["初一一班", "初一二班", "初一三班", "初二一班", "初二二班", "初三一班", "初三二班"], loc: "AQ1" },
            AA: {
                classes: ["G7SP", "G8TR", "G8AD", "G9TW", "G9RA", "S1ALevel", "S1Passion", "S1APower", "S2ALevel", "S2APower", "S2APassion", "S3ALevel", "S3APower", "S3APassion"],
                locs: { "S2": "AQ2", "S3": "AQ2", "default": "AQ4" }
            }
        };

        const flatClasses = [...SCHOOL_DATA.CNC.classes, ...SCHOOL_DATA.AA.classes];

        const stmt = `INSERT INTO mood_entries (user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (let i = 0; i < count; i++) {
            const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
            const isRisk = Math.random() > 0.9;

            // Determine Class
            let class_id = target_class;
            if (!class_id || class_id === 'All') {
                class_id = flatClasses[Math.floor(Math.random() * flatClasses.length)];
            }

            // Determine Location based on Class
            let location = "AQ1"; // Default
            if (SCHOOL_DATA.CNC.classes.includes(class_id)) {
                location = "AQ1";
            } else if (SCHOOL_DATA.AA.classes.includes(class_id)) {
                if (class_id.startsWith("S2") || class_id.startsWith("S3")) location = "AQ2";
                else location = "AQ4";
            }

            const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
            const created_at = Date.now() - timeOffset;

            await run(stmt, [
                '#' + Math.floor(1000 + Math.random() * 9000),
                'Student',
                class_id,
                emotion.score,
                emotion.label,
                emotion.color,
                isRisk ? "I want to hurt myself" : "Generated content",
                location,
                isRisk ? 'High' : 'Normal',
                category,
                created_at
            ]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/demo/clear', async (req, res) => {
    await run(`DELETE FROM mood_entries`);
    await run(`DELETE FROM safety_reports`);
    res.json({ success: true });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
