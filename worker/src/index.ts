/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
    DB: D1Database;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// CONSTANTS (Ported)
// CONSTANTS (Ported)
const RISK_KEYWORDS = ['die', 'hurt', 'pain', 'bullying', 'suicide', 'kill', 'hopeless', 'blood', 'bomb', '死', '自杀', '暴力', '炸', '血', '痛苦', '绝望', '伤害'];
const CATEGORIES = ['学业', '社交', '家庭', '健康', '未来'];
const EMOTIONS = [
    { label: '开心', color: '#FCE205', score: 5, category: 'Positive' },
    { label: '满足', color: '#FFAB76', score: 4, category: 'Positive' },
    { label: '关怀', color: '#FFB7C5', score: 5, category: 'Positive' },
    { label: '感动', color: '#9370DB', score: 4, category: 'Positive' },
    { label: '平静', color: '#E0FFFF', score: 3, category: 'Neutral' },
    { label: '放松', color: '#98FF98', score: 3, category: 'Neutral' },
    { label: '无聊', color: '#B0C4DE', score: 2, category: 'Negative' },
    { label: '焦虑', color: '#FF4500', score: 1, category: 'Negative' },
    { label: '难过', color: '#708090', score: 2, category: 'Negative' },
    { label: '愤怒', color: '#B22222', score: 1, category: 'Negative' },
    // Fallback for old data
    { label: 'Happy', color: '#FCE205', score: 5, category: 'Positive' },
    { label: 'Abused', color: '#000000', score: 1, category: 'Negative' }
];

const analyzeRisk = (content: string) => {
    const lowerContent = (content || '').toLowerCase();
    return RISK_KEYWORDS.some(word => lowerContent.includes(word)) ? 'High' : 'Normal';
};

// --- ROUTES ---

// Submit Mood
app.post('/api/mood', async (c) => {
    try {
        const body = await c.req.json();
        const { user_id, role, class_id, mood_score, emotion_label, mood_color, content, location } = body;

        const risk_level = analyzeRisk(content);
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const created_at = Date.now();

        await c.env.DB.prepare(
            `INSERT INTO mood_entries (user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at).run();

        return c.json({ success: true, risk_level });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// Submit Safety Report
app.post('/api/safety', async (c) => {
    try {
        const { location, type, description } = await c.req.json();
        await c.env.DB.prepare(
            `INSERT INTO safety_reports (location, type, description, status, created_at) VALUES (?, ?, ?, ?, ?)`
        ).bind(location, type, description, 'Pending', Date.now()).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// Student Mood History
app.get('/api/student/history', async (c) => {
    const user_id = c.req.query('user_id');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const { results } = await c.env.DB.prepare(
        `SELECT mood_color, created_at FROM mood_entries WHERE user_id = ? AND created_at > ? ORDER BY created_at ASC`
    ).bind(user_id, sevenDaysAgo).all();

    return c.json(results);
});

// --- STATUS (WeChat Style) ---

app.get('/api/status', async (c) => {
    const user_id = c.req.query('user_id');
    const now = Date.now();
    const status = await c.env.DB.prepare(
        `SELECT * FROM user_statuses WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`
    ).bind(user_id, now).first();
    return c.json(status || null);
});

app.post('/api/status', async (c) => {
    try {
        const { user_id, class_id, status_key, custom_text, color_hex } = await c.req.json();
        const now = Date.now();
        const expires_at = now + (24 * 60 * 60 * 1000);

        await c.env.DB.prepare(`DELETE FROM user_statuses WHERE user_id = ?`).bind(user_id).run();
        await c.env.DB.prepare(
            `INSERT INTO user_statuses (user_id, class_id, status_key, custom_text, color_hex, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(user_id, class_id || null, status_key, custom_text || null, color_hex, now, expires_at).run();

        return c.json({ success: true, expires_at });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/status/feed', async (c) => {
    const now = Date.now();
    // 1. Get recent statuses
    const { results: statuses } = await c.env.DB.prepare(
        `SELECT class_id, status_key, custom_text, color_hex, created_at, 'status' as type FROM user_statuses WHERE expires_at > ? ORDER BY created_at DESC LIMIT 30`
    ).bind(now).all();

    // 2. Get recent moods
    const { results: moods } = await c.env.DB.prepare(
        `SELECT class_id, emotion_label as status_key, content as custom_text, mood_color as color_hex, created_at, 'mood' as type FROM mood_entries ORDER BY created_at DESC LIMIT 30`
    ).all();

    // 3. Merge, sort by created_at DESC, and limit to 50
    const feed = [...statuses, ...moods]
        .sort((a: any, b: any) => b.created_at - a.created_at)
        .slice(0, 40);

    return c.json(feed);
});

// --- TEACHER STATS ---

app.get('/api/teacher/class-stats', async (c) => {
    const class_id = c.req.query('class_id');
    const { results: entries } = await c.env.DB.prepare(
        `SELECT * FROM mood_entries WHERE class_id = ? ORDER BY created_at DESC LIMIT 50`
    ).bind(class_id).all();

    const highRisk = entries.filter((e: any) => e.risk_level === 'High');
    const distribution = EMOTIONS.map(e => ({
        name: e.label,
        value: entries.filter((entry: any) => entry.emotion_label === e.label).length,
        color: e.color
    })).filter(d => d.value > 0);

    return c.json({ entries, highRisk, distribution });
});

app.get('/api/teacher/radar', async (c) => {
    const class_id = c.req.query('class_id');
    const { results: entries } = await c.env.DB.prepare(`SELECT * FROM mood_entries WHERE class_id = ?`).bind(class_id).all();

    // Group by Real Emotion Category (Positive, Neutral, Negative)
    const stats = { 'Positive': 0, 'Neutral': 0, 'Negative': 0 };
    let total = 0;

    entries.forEach((e: any) => {
        // Find the definition to get the real category
        const def = EMOTIONS.find(def => def.label === e.emotion_label);
        if (def) {
            // @ts-ignore
            if (stats[def.category] !== undefined) {
                // @ts-ignore
                stats[def.category]++;
                total++;
            }
        }
    });

    // Convert to Chart Format (Normalize to 100 for decent visuals)
    // If total is 0, return 0
    const result = Object.keys(stats).map(key => ({
        subject: key,
        // @ts-ignore
        A: total > 0 ? Math.round((stats[key] / total) * 100) : 0,
        fullMark: 100
    }));

    return c.json(result);
});

app.get('/api/teacher/activity', async (c) => {
    const class_id = c.req.query('class_id');
    const { results: entries } = await c.env.DB.prepare(`SELECT created_at FROM mood_entries WHERE class_id = ?`).bind(class_id).all();

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Use YYYY-MM-DD for comparison stability
        const isoDate = d.toISOString().split('T')[0];
        // Format MM/DD for display
        const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
        return { iso: isoDate, display: displayDate };
    }).reverse();

    const result = last7Days.map(({ iso, display }) => {
        const count = entries.filter((e: any) => {
            const entryDate = new Date(e.created_at).toISOString().split('T')[0];
            return entryDate === iso;
        }).length;
        return { date: display, count };
    });
    return c.json(result);
});

// --- ADMIN ---

app.get('/api/admin/stacked-data', async (c) => {
    const { results: entries } = await c.env.DB.prepare(`SELECT * FROM mood_entries`).all();
    const validLocations = [
        'AQ1', 'AQ2', 'AQ3', 'AQ4', 'ElectricityBuilding', 'SideBuilding',
        'GirlDorm', 'BoyDorm', 'Canteen', 'SwimmingPool', 'DormAB', 'DormCD',
        'AdministrationBuilding', 'Gymnasium', 'BasketballCourt'
    ];

    const locationMap: any = {};
    validLocations.forEach(loc => {
        locationMap[loc] = { name: loc, Positive: 0, Neutral: 0, Negative: 0, Risk: 0 };
    });

    entries.forEach((e: any) => {
        if (!e.location || !locationMap[e.location]) return;
        if (e.risk_level === 'High') locationMap[e.location].Risk++;
        else if (e.mood_score >= 4) locationMap[e.location].Positive++;
        else if (e.mood_score === 3) locationMap[e.location].Neutral++;
        else locationMap[e.location].Negative++;
    });

    return c.json(Object.values(locationMap).filter((l: any) => (l.Positive + l.Neutral + l.Negative + l.Risk) > 0));
});

app.get('/api/admin/heatmap', async (c) => {
    const { results: entries } = await c.env.DB.prepare(`SELECT location, mood_color, risk_level FROM mood_entries`).all();
    const stats: any = {};

    entries.forEach((e: any) => {
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
    return c.json(result);
});
// --- AI ADVICE (Direct Gemini API) ---
// Call Gemini API directly from Worker - works even if user is in China
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// Helper function to call Gemini API directly
async function callGeminiAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 4000,
                temperature: 0.7
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        })
    });

    // Check if response is OK
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data: any = await response.json();

    if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate advice.";
}

// Teacher Advice Endpoint
app.get('/api/teacher/advice', async (c) => {
    const class_id = c.req.query('class_id') || 'Unknown';
    const dateQuery = c.req.query('date');
    // Use UTC+8 for date consistency
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = beijingTime.toISOString().split('T')[0];
    const targetDate = dateQuery || today;

    try {

        // 1. Check DB for existing advice
        const existing: any = await c.env.DB.prepare(
            `SELECT * FROM ai_advice WHERE target_role = 'Teacher' AND scope_id = ? AND date_str = ?`
        ).bind(class_id, targetDate).first();

        if (existing) {
            return c.json({
                id: existing.id,
                advice: existing.content,
                checked_indices: JSON.parse(existing.checked_indices || '[]'),
                date: existing.date_str,
                source: 'db'
            });
        }

        // If querying past date and not found
        if (targetDate !== today) {
            return c.json({ error: "No advice recorded for this date." });
        }

        // --- Generate New Advice ---
        const { results: entries } = await c.env.DB.prepare(
            `SELECT * FROM mood_entries WHERE class_id = ? ORDER BY created_at DESC LIMIT 50`
        ).bind(class_id).all();

        if (!entries || entries.length === 0) {
            return c.json({ advice: "暂无足够数据生成建议。请等待更多学生登记情绪后再试。" });
        }

        const typedEntries = entries as any[];

        // Analyze data
        const total = typedEntries.length;
        const negatives = typedEntries.filter(e => e.mood_score <= 2).length;
        const positives = typedEntries.filter(e => e.mood_score >= 4).length;
        const risks = typedEntries.filter(e => e.risk_level === 'High').length;

        const emotionCounts: Record<string, number> = {};
        typedEntries.forEach(e => {
            emotionCounts[e.emotion_label] = (emotionCounts[e.emotion_label] || 0) + 1;
        });
        const mainEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

        const summary = `班级 ${class_id} 共有 ${total} 条近期记录。${positives} 位学生情绪积极，${negatives} 位学生情绪消极，${risks} 条高风险警报。主要情绪是"${mainEmotion}"。`;

        // @ts-ignore
        const apiKey = c.env.GEMINI_API_KEY;

        let adviceContent = "";

        if (!apiKey) {
            adviceContent = `【模拟AI建议】\n\n根据 ${total} 条记录分析，班级主要情绪为"${mainEmotion}"。\n\n• 建议组织一次团队活动增强凝聚力\n• ${negatives} 位同学情绪低落，可考虑减轻本周作业量\n• 关注 ${risks} 条高风险警报，必要时进行一对一沟通`;
        } else {
            try {
                const systemPrompt = `你是一位专业的教育心理学家，擅长分析学生情绪数据并为班主任提供具体、可操作的建议。请用中文回答，保持专业但友好的语气。`;
                const userPrompt = `以下是班级的近期情绪数据摘要：\n\n${summary}\n\n请为班主任提供 3-5 条具体、可操作的建议，帮助改善班级整体情绪健康。每条建议应该：\n1. 简洁明了（不超过30字）\n2. 可立即执行\n3. 针对当前数据特点\n\n请用项目符号列表格式输出。`;

                adviceContent = await callGeminiAI(apiKey, systemPrompt, userPrompt);
            } catch (e: any) {
                console.error('AI Service Error:', e);
                adviceContent = "AI生成暂时不可用，请稍后重试。";
            }
        }

        // Save to DB
        // Save to DB and get ID
        const result: any = await c.env.DB.prepare(
            `INSERT INTO ai_advice (target_role, scope_id, content, checked_indices, date_str, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
        ).bind('Teacher', class_id, adviceContent, '[]', today, Date.now()).first();

        const newId = result?.id;

        return c.json({
            id: newId,
            advice: adviceContent,
            checked_indices: [],
            date: today,
            source: 'generated'
        });

    } catch (e: any) {
        console.error('Advice Error:', e);
        return c.json({ advice: "获取建议时发生错误。" });
    }
});

// Update Checklist Status
app.post('/api/advice/check', async (c) => {
    const { id, checked_indices } = await c.req.json();
    await c.env.DB.prepare(
        `UPDATE ai_advice SET checked_indices = ? WHERE id = ?`
    ).bind(JSON.stringify(checked_indices), id).run();
    return c.json({ success: true });
});

// Get Advice History
app.get('/api/advice/history', async (c) => {
    const role = c.req.query('role') || 'Teacher';
    const scope_id = c.req.query('scope_id') || 'Unknown';
    const { results } = await c.env.DB.prepare(
        `SELECT date_str FROM ai_advice WHERE target_role = ? AND scope_id = ? ORDER BY date_str DESC LIMIT 30`
    ).bind(role, scope_id).all();
    return c.json(results.map((r: any) => r.date_str));
});



app.get('/api/report/weekly', async (c) => {
    const role = c.req.query('role') || 'Teacher';
    const scope_id = c.req.query('scope_id') || 'Unknown';

    // Calculate This Week's Monday (Beijing Time)
    const now = new Date();
    const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const day = beijingNow.getUTCDay(); // 0 is Sunday
    const diff = beijingNow.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday

    const mondayBeijing = new Date(beijingNow);
    mondayBeijing.setUTCDate(diff);
    mondayBeijing.setUTCHours(0, 0, 0, 0);

    // Convert back to UTC timestamp for DB Query
    const startTs = mondayBeijing.getTime() - 8 * 60 * 60 * 1000;
    const endTs = startTs + 7 * 24 * 60 * 60 * 1000 - 1; // End of Sunday

    // Query Data
    let sql = `SELECT * FROM mood_entries WHERE created_at >= ? AND created_at <= ?`;
    const params: any[] = [startTs, endTs];
    if (role === 'Teacher' && scope_id !== 'All') {
        sql += ` AND class_id = ?`;
        params.push(scope_id);
    }
    const { results: entries } = await c.env.DB.prepare(sql).bind(...params).all();
    const typedEntries = entries as any[];

    // 1. Trend Data (Mon-Fri Only)
    const trendMap: Record<string, { total: number; sum: number }> = {};
    const weekDays = ['周一', '周二', '周三', '周四', '周五'];
    // Init map for 5 days
    for (let i = 0; i < 5; i++) {
        const d = new Date(mondayBeijing.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        trendMap[key] = { total: 0, sum: 0 };
    }

    typedEntries.forEach(e => {
        // Check if Sat/Sun (skip)
        const entryDateBeijing = new Date(e.created_at + 8 * 3600 * 1000);
        const entryDay = entryDateBeijing.getUTCDay();
        if (entryDay === 0 || entryDay === 6) return; // Skip Sat/Sun

        const dateStr = entryDateBeijing.toISOString().split('T')[0];
        if (trendMap[dateStr]) {
            trendMap[dateStr].total++;
            trendMap[dateStr].sum += e.mood_score;
        }
    });

    const trend = Object.keys(trendMap).sort().map((date, idx) => {
        const t = trendMap[date];
        return {
            date: weekDays[idx] || date,
            score: t.total > 0 ? parseFloat((t.sum / t.total).toFixed(1)) : 0
        };
    });

    // 2. Filter for other stats (Mon-Fri only)
    const filteredEntries = typedEntries.filter(e => {
        const entryDay = new Date(e.created_at + 8 * 3600 * 1000).getUTCDay();
        return entryDay !== 0 && entryDay !== 6;
    });

    // 3. Composition (Pie Chart)
    let positive = 0, neutral = 0, negative = 0;
    filteredEntries.forEach(e => {
        if (e.mood_score >= 4) positive++;
        else if (e.mood_score === 3) neutral++;
        else negative++;
    });
    const composition = [
        { name: '积极', value: positive, color: '#34d399' },
        { name: '平静', value: neutral, color: '#94a3b8' },
        { name: '消极', value: negative, color: '#f87171' }
    ].filter(i => i.value > 0);

    // 4. Radar/Bar Stats (Category or Location)
    const statKey = role === 'Admin' ? 'location' : 'category';
    const avgMap: Record<string, { sum: number, count: number }> = {};
    filteredEntries.forEach(e => {
        const key = e[statKey] || 'Other';
        if (!avgMap[key]) avgMap[key] = { sum: 0, count: 0 };
        avgMap[key].sum += e.mood_score;
        avgMap[key].count++;
    });

    const categoryStats = Object.entries(avgMap).map(([key, val]) => ({
        subject: key,
        score: parseFloat((val.sum / val.count).toFixed(1)),
        fullMark: 5
    })).sort((a, b) => a.score - b.score).slice(0, 6); // Top 6 concern areas

    // 5. AI Summary
    // @ts-ignore
    const apiKey = c.env.GEMINI_API_KEY;
    let aiSummary = "系统暂无足够数据生成周报汇总。";

    if (apiKey && filteredEntries.length > 0) {
        try {
            const prompt = `基于以下周报数据（仅周一至周五，忽略周末）生成简短的决策提示（100字内）：
            - 角色：${role}
            - 本周趋势（周一至周五）：${trend.map(t => t.score).join(', ')}
            - 最低分区域/类别：${categoryStats.map(c => c.subject).join(', ')}
            - 整体消极占比：${Math.round(negative / filteredEntries.length * 100)}%
            
            请给出针对性建议，比如“周三情绪低谷需关注”或“xx区域需加强疏导”。`;

            aiSummary = await callGeminiAI(apiKey, "你是一位学校数据分析助手。", prompt);
        } catch (e) { console.error(e); }
    } else if (filteredEntries.length === 0) {
        aiSummary = "本周（周一至周五）暂无数据记录，无法生成分析。";
    }

    return c.json({
        trend,
        composition,
        categoryStats,
        aiSummary,
        total: filteredEntries.length,
        risk: filteredEntries.filter(e => e.risk_level === 'High').length
    });
});

// Admin Advice Endpoint - School-wide analysis
app.get('/api/admin/advice', async (c) => {
    const dateQuery = c.req.query('date');
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = beijingTime.toISOString().split('T')[0];
    const targetDate = dateQuery || today;

    // 1. Check DB for existing advice
    const existing: any = await c.env.DB.prepare(
        `SELECT * FROM ai_advice WHERE target_role = 'Admin' AND scope_id = 'All' AND date_str = ?`
    ).bind(targetDate).first();

    if (existing) {
        return c.json({
            id: existing.id,
            advice: existing.content,
            checked_indices: JSON.parse(existing.checked_indices || '[]'),
            date: existing.date_str,
            source: 'db'
        });
    }

    if (targetDate !== today) {
        return c.json({ error: "No advice recorded for this date." });
    }

    // Get all recent entries
    const { results: entries } = await c.env.DB.prepare(
        `SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 200`
    ).all();

    if (!entries || entries.length === 0) {
        return c.json({ advice: "暂无足够数据生成建议。系统需要更多学生数据才能进行分析。" });
    }

    const typedEntries = entries as any[];

    // Aggregate by location
    const locationStats: Record<string, { total: number; negative: number; risk: number }> = {};
    typedEntries.forEach(e => {
        const loc = e.location || 'Unknown';
        if (!locationStats[loc]) locationStats[loc] = { total: 0, negative: 0, risk: 0 };
        locationStats[loc].total++;
        if (e.mood_score <= 2) locationStats[loc].negative++;
        if (e.risk_level === 'High') locationStats[loc].risk++;
    });

    // Aggregate by class
    const classStats: Record<string, { total: number; negative: number; risk: number }> = {};
    typedEntries.forEach(e => {
        const cls = e.class_id || 'Unknown';
        if (!classStats[cls]) classStats[cls] = { total: 0, negative: 0, risk: 0 };
        classStats[cls].total++;
        if (e.mood_score <= 2) classStats[cls].negative++;
        if (e.risk_level === 'High') classStats[cls].risk++;
    });

    // Find problem areas
    const total = typedEntries.length;
    const totalNegative = typedEntries.filter(e => e.mood_score <= 2).length;
    const totalRisk = typedEntries.filter(e => e.risk_level === 'High').length;

    const locationSummary = Object.entries(locationStats)
        .map(([loc, stats]) => `${loc}: ${stats.total}条记录, ${stats.negative}消极, ${stats.risk}高风险`)
        .join('\n');

    const topProblemClasses = Object.entries(classStats)
        .filter(([_, stats]) => stats.total >= 3)
        .sort((a, b) => (b[1].negative / b[1].total) - (a[1].negative / a[1].total))
        .slice(0, 5)
        .map(([cls, stats]) => `${cls}: ${Math.round(stats.negative / stats.total * 100)}%消极率`)
        .join(', ');

    const summary = `全校共有 ${total} 条近期记录。整体消极情绪占比 ${Math.round(totalNegative / total * 100)}%，共 ${totalRisk} 条高风险警报。

按区域分布：
${locationSummary}

消极率较高的班级：${topProblemClasses || '暂无'}`;

    const apiKey = c.env.GEMINI_API_KEY;

    let adviceContent = "";

    if (!apiKey) {
        adviceContent = `【全校情绪概况】\n本周共采集 ${total} 条数据，整体消极率 ${Math.round(totalNegative / total * 100)}%。高风险警报 ${totalRisk} 条，主要集中在 ${topProblemClasses.split(',')[0] || 'Unknown'}。\n\n【战略行动建议】\n• 立即启动针对高风险区域的心理干预小组\n• 在下周一晨会通报积极班级，树立榜样\n• 建议对初三/高三学生增加减压活动预算\n• 检查高风险区域（如${(topProblemClasses.split(',')[0] || '').split(':')[0]}）的硬件安全设施`;
    } else {
        try {
            const systemPrompt = `你是一位康奈尔大学毕业的资深教育心理学家兼学校管理顾问，擅长数据驱动的决策支持。你的任务是根据学校情绪数据，提供一份简报。
            
            结构要求：
            1. 【全校情绪概况】：用一两句话总结当前数据亮点和痛点（50字以内）。
            2. 【战略行动建议】：提供 3-4 条具体的行动建议。每条建议必须包含“做什么”和“预期效果”。

            语气要求：专业、果断、有同理心。`;

            const userPrompt = `数据摘要：
            - 总记录：${total}
            - 高风险警报：${totalRisk}
            - 整体消极率：${Math.round(totalNegative / total * 100)}%
            - 区域分布详情：\n${locationSummary}
            - 重点关注班级：${topProblemClasses}

            请生成简报。建议要非常具体，例如“在xx区域增加巡逻”、“为xx年级调整作息”等。`;

            const advice = await callGeminiAI(apiKey, systemPrompt, userPrompt);
            adviceContent = advice;
        } catch (e: any) {
            console.error('AI Service Error:', e);
            adviceContent = "AI生成暂时不可用，请稍后重试。";
        }
    }

    // Save to DB and get ID (Run for both Mock and Real AI)
    const result: any = await c.env.DB.prepare(
        `INSERT INTO ai_advice (target_role, scope_id, content, checked_indices, date_str, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
    ).bind('Admin', 'All', adviceContent, '[]', today, Date.now()).first();

    return c.json({
        id: result?.id,
        advice: adviceContent,
        checked_indices: [],
        date: today,
        source: 'generated'
    });
});



// --- EXPORT ---
app.get('/api/export/csv', async (c) => {
    const class_id = c.req.query('class_id');
    let sql = `SELECT * FROM mood_entries`;
    const params: any[] = [];

    if (class_id) {
        sql += ` WHERE class_id = ?`;
        params.push(class_id);
    }
    sql += ` ORDER BY created_at DESC`;

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();

    if (!results || results.length === 0) {
        return c.text('No data found', 404);
    }

    // Convert to CSV
    // Localize CSV
    const COLUMN_MAP: Record<string, string> = {
        'id': '记录ID',
        'user_id': '学生ID',
        'role': '角色',
        'class_id': '班级',
        'mood_score': '心情指数',
        'emotion_label': '情绪词',
        'mood_color': '颜色代码',
        'content': '备注内容',
        'location': '地点',
        'risk_level': '风险等级',
        'category': '类别',
        'created_at': '提交时间'
    };

    const keys = Object.keys(results[0]).filter(k => COLUMN_MAP[k]);
    const headers = keys.map(k => COLUMN_MAP[k]).join(',');

    const rows = results.map((row: any) => {
        return keys.map(key => {
            let value = row[key];

            // Localize Values
            if (key === 'risk_level' && typeof value === 'string') {
                const map: Record<string, string> = { 'Normal': '正常', 'High': '高风险', 'Medium': '中风险' };
                if (map[value]) value = map[value];
            }
            if (key === 'role' && typeof value === 'string') {
                const map: Record<string, string> = { 'Student': '学生', 'Teacher': '教师', 'Admin': '管理员' };
                if (map[value]) value = map[value];
            }

            // Format Time (Assume UTC->Beijing +8)
            if (key === 'created_at' && value) {
                try {
                    const d = new Date(value);
                    const beijing = new Date(d.getTime() + 8 * 60 * 60 * 1000);
                    // Add tab explicitly to force Excel text mode
                    value = "\t" + beijing.toISOString().replace('T', ' ').substring(0, 19);
                } catch (e) { value = String(value); }
            }

            if (value === null || value === undefined) return '';
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n'); // Add BOM for Excel

    return c.text(csvContent, 200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mindlink_export_${class_id || 'all'}_${Date.now()}.csv"`
    });
});

// --- LOG SEARCH ---
app.get('/api/logs/search', async (c) => {
    const { q, risk_level, class_id, start_date, end_date } = c.req.query();

    let sql = `SELECT * FROM mood_entries WHERE 1=1`;
    const params: any[] = [];

    if (class_id) { sql += ` AND class_id = ?`; params.push(class_id); }
    if (risk_level && risk_level !== 'All') { sql += ` AND risk_level = ?`; params.push(risk_level); }
    if (q) { sql += ` AND (content LIKE ? OR location LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (start_date) { sql += ` AND created_at >= ?`; params.push(parseInt(start_date)); }
    if (end_date) { sql += ` AND created_at <= ?`; params.push(parseInt(end_date)); }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json(results);
});

// --- DEMO GENERATOR ---
app.post('/api/demo/generate', async (c) => {
    const { count, target_class } = await c.req.json();
    const SCHOOL_DATA = {
        CNC: { classes: ["初一一班", "初一二班", "初一三班", "初二一班", "初二二班", "初三一班", "初三二班"], loc: "AQ1" },
        AA: {
            classes: ["G7SP", "G8TR", "G8AD", "G9TW", "G9RA", "S1ALevel", "S1Passion", "S1APower", "S2ALevel", "S2APower", "S2APassion", "S3ALevel", "S3APower", "S3APassion"],
            locs: { "S2": "AQ2", "S3": "AQ2", "default": "AQ4" }
        }
    };
    const flatClasses = [...SCHOOL_DATA.CNC.classes, ...SCHOOL_DATA.AA.classes];

    const stmt = c.env.DB.prepare(`INSERT INTO mood_entries (user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const batch = [];

    // Beijing Time Helper: get timestamp for recent Mon-Fri
    const getRecentWeekday = () => {
        const now = Date.now();
        // Try up to 100 times to find a weekday
        for (let i = 0; i < 100; i++) {
            const ts = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
            const bjDate = new Date(ts + 8 * 3600 * 1000);
            const day = bjDate.getUTCDay();
            if (day !== 0 && day !== 6) return ts; // Found Mon-Fri
        }
        return now; // Fallback
    };

    for (let i = 0; i < count; i++) {
        const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
        const isRisk = Math.random() > 0.9;
        let class_id = target_class;
        if (!class_id || class_id === 'All') class_id = flatClasses[Math.floor(Math.random() * flatClasses.length)];

        let location = "AQ1";
        if (SCHOOL_DATA.CNC.classes.includes(class_id)) location = "AQ1";
        else if (SCHOOL_DATA.AA.classes.includes(class_id)) {
            if (class_id.startsWith("S2") || class_id.startsWith("S3")) location = "AQ2";
            else location = "AQ4";
        }

        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const created_at = getRecentWeekday(); // Enforce Mon-Fri

        batch.push(stmt.bind(
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
        ));
    }

    // D1 Batch Execution for Mood Entries
    await c.env.DB.batch(batch);

    // --- Generate Fake User Statuses for Community Feed ---
    const STATUS_PRESETS = [
        { key: 'recharging', label: '充电中', color: '#10B981', texts: ['满血复活中...', '电量严重不足', '正在回血'] },
        { key: 'focus', label: '沉浸中', color: '#3B82F6', texts: ['专注学习模式', '勿扰', '刷题中'] },
        { key: 'ranking', label: '上分中', color: '#8B5CF6', texts: ['峡谷见', '求带飞', '冲冲冲'] },
        { key: 'sleeping', label: '补觉中', color: '#1E293B', texts: ['勿扰模式', '梦里见', '早八人'] },
        { key: 'crushing', label: '小确幸', color: '#EC4899', texts: ['发现美好', '今天天气真好', '心情美美哒'] },
        { key: 'vibing', label: '听歌', color: '#06B6D4', texts: ['BGM播放中', '单曲循环', '耳机是本体'] },
        { key: 'gym', label: '暴汗', color: '#F59E0B', texts: ['多巴胺分泌', '减肥痛苦', '练腿日'] },
        { key: 'exploring', label: '探索中', color: '#6366F1', texts: ['寻找灵感', '发呆中', '思考人生'] },
        { key: 'relaxing', label: '松弛感', color: '#64748B', texts: ['享受当下', '偷得浮生半日闲', '放空'] },
        { key: 'fire', label: '燃起来', color: '#EF4444', texts: ['全力以赴！', '决战期末', '不能输'] }
    ];

    const statusBatch = [];
    const statusCount = Math.min(count, 30); // Generate up to 30 statuses

    for (let i = 0; i < statusCount; i++) {
        const preset = STATUS_PRESETS[Math.floor(Math.random() * STATUS_PRESETS.length)];
        const text = preset.texts[Math.floor(Math.random() * preset.texts.length)];

        let class_id = target_class;
        if (!class_id || class_id === 'All') class_id = flatClasses[Math.floor(Math.random() * flatClasses.length)];

        // Upsert logic simulation (insert new for random user)
        const userId = '#MockUser' + Math.floor(1000 + Math.random() * 9000);

        statusBatch.push(c.env.DB.prepare(
            `INSERT INTO user_statuses (user_id, class_id, status_key, custom_text, color_hex, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            userId,
            class_id,
            preset.key,
            text,
            preset.color,
            Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000), // Within 24h
            Date.now() + 24 * 60 * 60 * 1000
        ));
    }

    if (statusBatch.length > 0) {
        await c.env.DB.batch(statusBatch);
    }

    return c.json({ success: true, message: `Generated ${count} entries and ${statusCount} statuses.` });
});

app.post('/api/demo/clear', async (c) => {
    await c.env.DB.prepare(`DELETE FROM mood_entries`).run();
    await c.env.DB.prepare(`DELETE FROM safety_reports`).run();
    await c.env.DB.prepare(`DELETE FROM ai_advice`).run();
    await c.env.DB.prepare(`DELETE FROM user_statuses`).run();
    return c.json({ success: true, message: "Cleared all data." });
});

export default app;
