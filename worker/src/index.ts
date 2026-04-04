/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
    DB: D1Database;
    GEMINI_API_KEY: string;
    TEACHER_PORTAL_PASSWORD?: string;
    ADMIN_PORTAL_PASSWORD?: string;
    CONSOLE_PORTAL_PASSWORD?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

type RestrictedPortal = 'teacher' | 'admin' | 'console';

const getPortalSecret = (env: Bindings, portal: RestrictedPortal) => {
    if (portal === 'teacher') return env.TEACHER_PORTAL_PASSWORD;
    if (portal === 'admin') return env.ADMIN_PORTAL_PASSWORD;
    return env.CONSOLE_PORTAL_PASSWORD;
};

const portalAuthMiddleware = (allowedPortals: RestrictedPortal[]) => {
    return async (c: any, next: any) => {
        const suppliedPassword = (c.req.header('x-portal-password') || '').trim();
        const configuredPortals = allowedPortals.filter((portal) => Boolean(getPortalSecret(c.env, portal)));

        if (!configuredPortals.length) {
            return c.json({ error: 'Portal auth is not configured.' }, 503);
        }

        if (!suppliedPassword) {
            return c.json({ error: 'Portal password required.' }, 401);
        }

        const isAllowed = configuredPortals.some((portal) => suppliedPassword === getPortalSecret(c.env, portal));
        if (!isAllowed) {
            return c.json({ error: 'Invalid portal password.' }, 401);
        }

        await next();
    };
};

app.use('/api/teacher/*', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/admin/*', portalAuthMiddleware(['admin', 'console']));
app.use('/api/console/*', portalAuthMiddleware(['console']));
app.use('/api/classes', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/classes/*', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/logs/*', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/export/*', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/advice/history', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/advice/*', portalAuthMiddleware(['teacher', 'admin', 'console']));
app.use('/api/report/*', portalAuthMiddleware(['teacher', 'admin', 'console']));

// CONSTANTS (Ported)
// CONSTANTS (Ported)
const RISK_KEYWORDS = ['die', 'hurt', 'pain', 'bullying', 'suicide', 'kill', 'hopeless', 'blood', 'bomb', '死', '自杀', '暴力', '炸', '血', '痛苦', '绝望', '伤害'];
const CATEGORIES = ['Academic', 'Social', 'Environment', 'Health', 'Future'];
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

const LOCATION_ALIAS_LABELS: Record<string, string> = {
    AQ1: '区域-A1',
    AQ2: '区域-A2',
    AQ3: '区域-A3',
    AQ4: '区域-A4',
    ElectricityBuilding: '区域-B1',
    SideBuilding: '区域-B2',
    GirlDorm: '区域-C1',
    BoyDorm: '区域-C2',
    Canteen: '区域-D1',
    SwimmingPool: '区域-D2',
    DormAB: '区域-E1',
    DormCD: '区域-E2',
    AdministrationBuilding: '区域-F1',
    Gymnasium: '区域-F2',
    BasketballCourt: '区域-F3',
    '电力楼': '区域-B1',
    '侧楼': '区域-B2',
    '女生宿舍': '区域-C1',
    '男生宿舍': '区域-C2',
    '食堂': '区域-D1',
    '游泳馆': '区域-D2',
    '宿舍AB': '区域-E1',
    '宿舍CD': '区域-E2',
    '行政楼': '区域-F1',
    '体育馆': '区域-F2',
    '篮球场': '区域-F3'
};

const LOCATION_DISPLAY_LABELS: Record<string, string> = {
    AQ1: 'AQ1',
    AQ2: 'AQ2',
    AQ3: 'AQ3',
    AQ4: 'AQ4',
    ElectricityBuilding: '电力楼',
    SideBuilding: '侧楼',
    GirlDorm: '女生宿舍',
    BoyDorm: '男生宿舍',
    Canteen: '食堂',
    SwimmingPool: '游泳馆',
    DormAB: '宿舍AB',
    DormCD: '宿舍CD',
    AdministrationBuilding: '行政楼',
    Gymnasium: '体育馆',
    BasketballCourt: '篮球场',
    '电力楼': '电力楼',
    '侧楼': '侧楼',
    '女生宿舍': '女生宿舍',
    '男生宿舍': '男生宿舍',
    '食堂': '食堂',
    '游泳馆': '游泳馆',
    '宿舍AB': '宿舍AB',
    '宿舍CD': '宿舍CD',
    '行政楼': '行政楼',
    '体育馆': '体育馆',
    '篮球场': '篮球场'
};

const KNOWN_LOCATION_KEYS = Object.keys(LOCATION_DISPLAY_LABELS);

const CATEGORY_LABELS: Record<string, string> = {
    Academic: '学习任务',
    Social: '同伴互动',
    Environment: '校园环境',
    Health: '身心状态',
    Future: '目标压力',
    Unspecified: '未补充',
    学业: '学习任务',
    社交: '同伴互动',
    环境: '校园环境',
    健康: '身心状态',
    未来: '目标压力',
    未分类: '未补充'
};

const AI_ADVICE_REFRESH_MS = 15 * 60 * 1000;
const LEGACY_STATUS_KEY_MAP: Record<string, string> = {
    ranking: 'relaxing',
    sleeping: 'recharging'
};
const FEATURE_KEYS = {
    mood: 'mood_bubble',
    status: 'status_community'
} as const;

type AchievementStats = {
    moodCount: number;
    statusCount: number;
    resonanceSentCount: number;
    resonanceReceivedCount: number;
    totalEvents: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
};

type BadgeTier = 'bronze' | 'silver' | 'gold';

const ACHIEVEMENT_BADGES: Array<{
    key: string;
    name: string;
    description: string;
    tier: BadgeTier;
    progress: (stats: AchievementStats) => number;
    unlocked: (stats: AchievementStats) => boolean;
}> = [
    {
        key: 'first_bubble',
        name: '第一次冒泡',
        description: '首次提交情绪气泡反馈',
        tier: 'bronze',
        progress: (stats) => stats.moodCount,
        unlocked: (stats) => stats.moodCount >= 1
    },
    {
        key: 'first_status',
        name: '状态亮相',
        description: '首次发布情绪社区状态',
        tier: 'bronze',
        progress: (stats) => stats.statusCount,
        unlocked: (stats) => stats.statusCount >= 1
    },
    {
        key: 'first_resonance_sent',
        name: '同感发出',
        description: '首次向同学送出同感',
        tier: 'bronze',
        progress: (stats) => stats.resonanceSentCount,
        unlocked: (stats) => stats.resonanceSentCount >= 1
    },
    {
        key: 'first_resonance_received',
        name: '被看见了',
        description: '首次收到同学的同感回应',
        tier: 'bronze',
        progress: (stats) => stats.resonanceReceivedCount,
        unlocked: (stats) => stats.resonanceReceivedCount >= 1
    },
    {
        key: 'mood_ten',
        name: '情绪记录者',
        description: '累计完成 10 次情绪气泡反馈',
        tier: 'silver',
        progress: (stats) => stats.moodCount,
        unlocked: (stats) => stats.moodCount >= 10
    },
    {
        key: 'status_five',
        name: '班级状态搭子',
        description: '累计发布 5 次情绪社区状态',
        tier: 'silver',
        progress: (stats) => stats.statusCount,
        unlocked: (stats) => stats.statusCount >= 5
    },
    {
        key: 'streak_three',
        name: '稳定在线',
        description: '连续 3 天保持上传或互动',
        tier: 'silver',
        progress: (stats) => stats.longestStreak,
        unlocked: (stats) => stats.longestStreak >= 3
    },
    {
        key: 'streak_seven',
        name: '一周同频',
        description: '连续 7 天保持上传或互动',
        tier: 'gold',
        progress: (stats) => stats.longestStreak,
        unlocked: (stats) => stats.longestStreak >= 7
    },
    {
        key: 'all_rounder',
        name: '全链路体验官',
        description: '完成气泡反馈、状态发布和同感互动三种行为',
        tier: 'gold',
        progress: (stats) => Number(stats.moodCount > 0) + Number(stats.statusCount > 0) + Number(stats.resonanceSentCount > 0),
        unlocked: (stats) => stats.moodCount > 0 && stats.statusCount > 0 && stats.resonanceSentCount > 0
    }
];

const STATUS_COMMUNITY_PRESETS = [
    { key: 'recharging', color: '#10B981', text: '满血复活中...' },
    { key: 'focus', color: '#3B82F6', text: '先把注意力放回来' },
    { key: 'crushing', color: '#EC4899', text: '发现美好' },
    { key: 'vibing', color: '#06B6D4', text: 'BGM播放中' },
    { key: 'gym', color: '#F59E0B', text: '多巴胺分泌' },
    { key: 'exploring', color: '#6366F1', text: '寻找灵感' },
    { key: 'relaxing', color: '#64748B', text: '享受当下' },
    { key: 'fire', color: '#EF4444', text: '全力以赴！' }
] as const;

const DEFAULT_PORTAL_CLASSES = [
    { class_id: '初一一班', faculty: 'CNC', default_location: 'AQ1', sort_order: 1 },
    { class_id: '初一二班', faculty: 'CNC', default_location: 'AQ1', sort_order: 2 },
    { class_id: '初一三班', faculty: 'CNC', default_location: 'AQ1', sort_order: 3 },
    { class_id: '初二一班', faculty: 'CNC', default_location: 'AQ1', sort_order: 4 },
    { class_id: '初二二班', faculty: 'CNC', default_location: 'AQ1', sort_order: 5 },
    { class_id: '初三一班', faculty: 'CNC', default_location: 'AQ1', sort_order: 6 },
    { class_id: '初三二班', faculty: 'CNC', default_location: 'AQ1', sort_order: 7 },
    { class_id: 'G7SP', faculty: 'AA', default_location: 'AQ4', sort_order: 101 },
    { class_id: 'G8TR', faculty: 'AA', default_location: 'AQ4', sort_order: 102 },
    { class_id: 'G8AD', faculty: 'AA', default_location: 'AQ4', sort_order: 103 },
    { class_id: 'G9TW', faculty: 'AA', default_location: 'AQ4', sort_order: 104 },
    { class_id: 'G9RA', faculty: 'AA', default_location: 'AQ4', sort_order: 105 },
    { class_id: 'S1ALevel', faculty: 'AA', default_location: 'AQ4', sort_order: 106 },
    { class_id: 'S1Passion', faculty: 'AA', default_location: 'AQ4', sort_order: 107 },
    { class_id: 'S1APower', faculty: 'AA', default_location: 'AQ4', sort_order: 108 },
    { class_id: 'S2ALevel', faculty: 'AA', default_location: 'AQ2', sort_order: 109 },
    { class_id: 'S2APower', faculty: 'AA', default_location: 'AQ2', sort_order: 110 },
    { class_id: 'S2APassion', faculty: 'AA', default_location: 'AQ2', sort_order: 111 },
    { class_id: 'S3ALevel', faculty: 'AA', default_location: 'AQ2', sort_order: 112 },
    { class_id: 'S3APower', faculty: 'AA', default_location: 'AQ2', sort_order: 113 },
    { class_id: 'S3APassion', faculty: 'AA', default_location: 'AQ2', sort_order: 114 }
] as const;

const normalizeStatusKey = (statusKey?: string | null) => {
    if (!statusKey) return statusKey || null;
    return LEGACY_STATUS_KEY_MAP[statusKey] || statusKey;
};

const normalizeStatusRow = <T extends { status_key?: string | null }>(row: T | null) =>
    row ? { ...row, status_key: normalizeStatusKey(row.status_key) } : row;

const ensurePortalClassesSeeded = async (db: D1Database) => {
    const existing = await db.prepare(`SELECT COUNT(*) as count FROM portal_classes`).first<{ count: number | string }>();
    if (Number(existing?.count || 0) > 0) return;

    const seedBatch = DEFAULT_PORTAL_CLASSES.map((item) =>
        db.prepare(
            `INSERT OR IGNORE INTO portal_classes (class_id, faculty, default_location, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)`
        ).bind(item.class_id, item.faculty, item.default_location, item.sort_order, Date.now())
    );

    if (seedBatch.length > 0) {
        await db.batch(seedBatch);
    }
};

const incrementUserFeatureUsage = async (
    db: D1Database,
    userId: string,
    classId: string | null | undefined,
    featureKey: string,
    timestamp = Date.now()
) => {
    if (!userId || !featureKey) return;

    await db.prepare(
        `INSERT INTO user_feature_usage (user_id, class_id, feature_key, upload_count, last_uploaded_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(user_id, class_id, feature_key)
         DO UPDATE SET
           upload_count = user_feature_usage.upload_count + 1,
           last_uploaded_at = excluded.last_uploaded_at,
           class_id = excluded.class_id`
        ).bind(userId, classId || null, featureKey, timestamp).run();
};

const ensureAchievementTables = async (db: D1Database) => {
    await db.batch([
        db.prepare(
            `CREATE TABLE IF NOT EXISTS achievement_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                class_id TEXT,
                event_key TEXT NOT NULL,
                feature_key TEXT,
                reference_id TEXT,
                event_value INTEGER DEFAULT 1,
                created_at INTEGER NOT NULL
            )`
        ),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_achievement_events_user_time ON achievement_events(user_id, created_at DESC)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_achievement_events_event ON achievement_events(event_key, created_at DESC)`),
        db.prepare(
            `CREATE TABLE IF NOT EXISTS daily_user_activity (
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
            )`
        ),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_daily_user_activity_class_date ON daily_user_activity(class_id, activity_date DESC)`),
        db.prepare(
            `CREATE TABLE IF NOT EXISTS user_badges (
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
            )`
        ),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_badges_user_time ON user_badges(user_id, unlocked_at DESC)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at DESC)`)
    ]);
};

const ensureUserPortalProgressTable = async (db: D1Database) => {
    await db.batch([
        db.prepare(
            `CREATE TABLE IF NOT EXISTS user_portal_progress (
                user_id TEXT NOT NULL,
                class_id TEXT,
                portal_key TEXT NOT NULL,
                start_seen_at INTEGER,
                guide_completed_at INTEGER,
                updated_at INTEGER,
                PRIMARY KEY (user_id, portal_key)
            )`
        ),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_portal_progress_class_portal ON user_portal_progress(class_id, portal_key)`),
        db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_portal_progress_guide ON user_portal_progress(portal_key, guide_completed_at DESC)`)
    ]);
};

const isSyntheticAnalyticsUser = (userId: unknown) => {
    if (typeof userId !== 'string') return false;
    return /^#MockUser\d+$/i.test(userId)
        || /^#\d{4,}$/.test(userId)
        || /^feed-\d+$/i.test(userId)
        || /^SYS-/i.test(userId);
};

const buildSystemStatusUserId = (classId: string, index: number) => {
    const compactClass = (classId || 'CLS').replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '').slice(0, 6) || 'CLS';
    return `SYS-${compactClass}-${String(index + 1).padStart(3, '0')}`;
};

const formatConsoleDayLabel = (timestamp: number) => {
    const bjDate = new Date(timestamp + 8 * 60 * 60 * 1000);
    const month = bjDate.getUTCMonth() + 1;
    const day = bjDate.getUTCDate();
    return `${month}/${day}`;
};

const getBeijingDayKey = (timestamp = Date.now()) =>
    new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().split('T')[0];

const getBeijingDayRange = (timestamp = Date.now()) => {
    const dayKey = getBeijingDayKey(timestamp);
    const start = new Date(`${dayKey}T00:00:00+08:00`).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return { start, end, dayKey };
};

const computeStreaksFromDays = (dates: string[]) => {
    const normalized = [...new Set(dates.filter(Boolean))].sort((a, b) => b.localeCompare(a));
    if (!normalized.length) {
        return { currentStreak: 0, longestStreak: 0, activeDays: 0 };
    }

    const isConsecutive = (current: string, previous: string) => {
        const currentDate = new Date(`${current}T00:00:00+08:00`);
        const previousDate = new Date(`${previous}T00:00:00+08:00`);
        const diff = Math.round((previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
        return diff === 1;
    };

    let longestStreak = 1;
    let running = 1;
    for (let index = 1; index < normalized.length; index += 1) {
        if (isConsecutive(normalized[index], normalized[index - 1])) {
            running += 1;
            longestStreak = Math.max(longestStreak, running);
        } else {
            running = 1;
        }
    }

    const todayKey = getBeijingDayKey();
    const yesterdayKey = getBeijingDayKey(Date.now() - 24 * 60 * 60 * 1000);
    let currentStreak = 0;
    if (normalized[0] === todayKey || normalized[0] === yesterdayKey) {
        currentStreak = 1;
        for (let index = 1; index < normalized.length; index += 1) {
            if (isConsecutive(normalized[index], normalized[index - 1])) {
                currentStreak += 1;
            } else {
                break;
            }
        }
    }

    return {
        currentStreak,
        longestStreak,
        activeDays: normalized.length
    };
};

const getUserAchievementStats = async (db: D1Database, userId: string): Promise<AchievementStats> => {
    const [usageResult, dailyResult] = await Promise.all([
        db.prepare(
            `SELECT feature_key, upload_count FROM user_feature_usage WHERE user_id = ?`
        ).bind(userId).all(),
        db.prepare(
            `SELECT activity_date, mood_count, status_count, resonance_sent_count, resonance_received_count
             FROM daily_user_activity
             WHERE user_id = ?
             ORDER BY activity_date DESC`
        ).bind(userId).all()
    ]);

    const usageRows = (usageResult.results || []) as Array<{ feature_key: string; upload_count: number | string }>;
    const dailyRows = (dailyResult.results || []) as Array<{
        activity_date: string;
        mood_count: number | string;
        status_count: number | string;
        resonance_sent_count: number | string;
        resonance_received_count: number | string;
    }>;

    const moodCount = usageRows
        .filter((row) => row.feature_key === FEATURE_KEYS.mood)
        .reduce((sum, row) => sum + Number(row.upload_count || 0), 0);
    const statusCount = usageRows
        .filter((row) => row.feature_key === FEATURE_KEYS.status)
        .reduce((sum, row) => sum + Number(row.upload_count || 0), 0);
    const resonanceSentCount = dailyRows.reduce((sum, row) => sum + Number(row.resonance_sent_count || 0), 0);
    const resonanceReceivedCount = dailyRows.reduce((sum, row) => sum + Number(row.resonance_received_count || 0), 0);
    const streaks = computeStreaksFromDays(dailyRows.map((row) => row.activity_date));

    return {
        moodCount,
        statusCount,
        resonanceSentCount,
        resonanceReceivedCount,
        totalEvents: moodCount + statusCount + resonanceSentCount + resonanceReceivedCount,
        activeDays: streaks.activeDays,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak
    };
};

const syncUserBadges = async (
    db: D1Database,
    userId: string,
    classId: string | null | undefined,
    timestamp = Date.now()
) => {
    const stats = await getUserAchievementStats(db, userId);
    const upserts = ACHIEVEMENT_BADGES
        .filter((badge) => badge.unlocked(stats))
        .map((badge) =>
            db.prepare(
                `INSERT INTO user_badges (user_id, class_id, badge_key, badge_name, badge_description, badge_tier, progress_value, unlocked_at, last_seen_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(user_id, badge_key)
                 DO UPDATE SET
                   class_id = excluded.class_id,
                   progress_value = CASE
                     WHEN excluded.progress_value > user_badges.progress_value THEN excluded.progress_value
                     ELSE user_badges.progress_value
                   END,
                   last_seen_at = excluded.last_seen_at`
            ).bind(
                userId,
                classId || null,
                badge.key,
                badge.name,
                badge.description,
                badge.tier,
                badge.progress(stats),
                timestamp,
                timestamp
            )
        );

    if (upserts.length) {
        await db.batch(upserts);
    }
};

const recordAchievementEvent = async (
    db: D1Database,
    payload: {
        userId: string;
        classId?: string | null;
        eventKey: string;
        featureKey?: string | null;
        referenceId?: string | number | null;
        eventValue?: number;
        createdAt?: number;
        moodDelta?: number;
        statusDelta?: number;
        resonanceSentDelta?: number;
        resonanceReceivedDelta?: number;
    }
) => {
    const {
        userId,
        classId = null,
        eventKey,
        featureKey = null,
        referenceId = null,
        eventValue = 1,
        createdAt = Date.now(),
        moodDelta = 0,
        statusDelta = 0,
        resonanceSentDelta = 0,
        resonanceReceivedDelta = 0
    } = payload;

    if (!userId || isSyntheticAnalyticsUser(userId)) return;

    await ensureAchievementTables(db);

    const activityDate = getBeijingDayKey(createdAt);
    await db.batch([
        db.prepare(
            `INSERT INTO achievement_events (user_id, class_id, event_key, feature_key, reference_id, event_value, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(userId, classId, eventKey, featureKey, referenceId ? String(referenceId) : null, eventValue, createdAt),
        db.prepare(
            `INSERT INTO daily_user_activity (
                user_id,
                activity_date,
                class_id,
                mood_count,
                status_count,
                resonance_sent_count,
                resonance_received_count,
                total_events,
                last_activity_at
            )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id, activity_date)
             DO UPDATE SET
               class_id = excluded.class_id,
               mood_count = daily_user_activity.mood_count + excluded.mood_count,
               status_count = daily_user_activity.status_count + excluded.status_count,
               resonance_sent_count = daily_user_activity.resonance_sent_count + excluded.resonance_sent_count,
               resonance_received_count = daily_user_activity.resonance_received_count + excluded.resonance_received_count,
               total_events = daily_user_activity.total_events + excluded.total_events,
               last_activity_at = excluded.last_activity_at`
        ).bind(
            userId,
            activityDate,
            classId,
            moodDelta,
            statusDelta,
            resonanceSentDelta,
            resonanceReceivedDelta,
            eventValue,
            createdAt
        )
    ]);

    await syncUserBadges(db, userId, classId, createdAt);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const replaceStandaloneToken = (input: string, token: string, replacement: string) =>
    input.replace(
        new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(token)}(?=$|[^A-Za-z0-9])`, 'g'),
        (_, prefix: string) => `${prefix}${replacement}`
    );

const stripMarkdownFormatting = (input: string) => {
    if (!input) return input;

    return input
        .replace(/\r\n/g, '\n')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/^[ \t]*\*\s+/gm, '• ')
        .replace(/^[ \t]*-\s+/gm, '• ')
        .replace(/^[ \t]*\d+\.\s+/gm, '• ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const buildAdviceScopeId = (scopeId: string, lang: 'zh' | 'en') =>
    lang === 'en' ? `${scopeId}::en` : scopeId;

const getBeijingNow = () => {
    const now = new Date();
    return new Date(now.getTime() + 8 * 60 * 60 * 1000);
};

const getBeijingDateString = () => getBeijingNow().toISOString().split('T')[0];

const getTimeContextLabel = (date = getBeijingNow()) => {
    const hour = date.getUTCHours();
    if (hour < 6) return '凌晨时段';
    if (hour < 11) return '上午时段';
    if (hour < 14) return '中午时段';
    if (hour < 18) return '下午时段';
    if (hour < 22) return '晚间时段';
    return '夜间时段';
};

const createAliasRegistry = (classIds: string[], locations: string[]) => {
    const classAliasMap: Record<string, string> = {};
    const locationAliasMap: Record<string, string> = {};

    [...new Set(classIds.filter(Boolean))].sort().forEach((classId, index) => {
        classAliasMap[classId] = `班级组-${String(index + 1).padStart(2, '0')}`;
    });

    [...new Set([...KNOWN_LOCATION_KEYS, ...locations.filter(Boolean)])].sort().forEach((location, index) => {
        locationAliasMap[location] = LOCATION_ALIAS_LABELS[location] || `区域-${String(index + 1).padStart(2, '0')}`;
    });

    const replaceSensitiveTerms = (input: string) => {
        let output = input || '';

        Object.entries(classAliasMap).forEach(([raw, alias]) => {
            output = output.replace(new RegExp(escapeRegExp(raw), 'g'), alias);
        });

        Object.entries(locationAliasMap).forEach(([raw, alias]) => {
            output = output.replace(new RegExp(escapeRegExp(raw), 'g'), alias);
        });

        output = output
            .replace(/MindLink/gi, '本系统')
            .replace(/mindlink\.cloud/gi, '系统域名')
            .replace(/学校|学部|校区|班主任|辅导员/g, (match) => match);

        return output;
    };

    const restoreAliasedTerms = (input: string) => {
        let output = input || '';

        Object.entries(classAliasMap).forEach(([raw, alias]) => {
            output = output.replace(new RegExp(escapeRegExp(alias), 'g'), raw);

            const aliasDigits = alias.match(/(\d+)/)?.[1];
            if (aliasDigits) {
                output = output.replace(
                    new RegExp(`Class\\s+Group-?0*${escapeRegExp(aliasDigits)}\\b`, 'gi'),
                    raw
                );
            }
        });

        Object.entries(locationAliasMap).forEach(([raw, alias]) => {
            const displayLabel = LOCATION_DISPLAY_LABELS[raw] || raw;
            output = output.replace(new RegExp(escapeRegExp(alias), 'g'), displayLabel);

            if (alias.startsWith('区域-')) {
                const compactAlias = alias.replace('区域-', '');
                output = output.replace(
                    new RegExp(`(?:Zone|Area)-?${escapeRegExp(compactAlias)}\\b`, 'gi'),
                    displayLabel
                );
                if (compactAlias && compactAlias !== displayLabel) {
                    output = replaceStandaloneToken(output, compactAlias, displayLabel);
                }
            }

            if (raw !== displayLabel) {
                output = output.replace(new RegExp(escapeRegExp(raw), 'g'), displayLabel);
            }
        });

        return output;
    };

    return { classAliasMap, locationAliasMap, replaceSensitiveTerms, restoreAliasedTerms };
};

const summarizeTeacherEntries = (entries: any[], classId: string) => {
    const aliasRegistry = createAliasRegistry([classId], entries.map((entry) => entry.location || ''));
    const total = entries.length;
    const positive = entries.filter((entry) => entry.mood_score >= 4).length;
    const neutral = entries.filter((entry) => entry.mood_score === 3).length;
    const negative = entries.filter((entry) => entry.mood_score <= 2).length;
    const risk = entries.filter((entry) => entry.risk_level === 'High').length;

    const emotionCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const weekdayScores: Record<string, { total: number; sum: number }> = {
        周一: { total: 0, sum: 0 },
        周二: { total: 0, sum: 0 },
        周三: { total: 0, sum: 0 },
        周四: { total: 0, sum: 0 },
        周五: { total: 0, sum: 0 },
        周六: { total: 0, sum: 0 },
        周日: { total: 0, sum: 0 }
    };

    entries.forEach((entry) => {
        emotionCounts[entry.emotion_label] = (emotionCounts[entry.emotion_label] || 0) + 1;

        const normalizedCategory = CATEGORY_LABELS[entry.category] || entry.category || '未分类';
        categoryCounts[normalizedCategory] = (categoryCounts[normalizedCategory] || 0) + 1;

        if (entry.location) {
            const locationAlias = aliasRegistry.locationAliasMap[entry.location] || '区域-未标记';
            locationCounts[locationAlias] = (locationCounts[locationAlias] || 0) + 1;
        }

        const beijingDate = new Date(entry.created_at + 8 * 60 * 60 * 1000);
        const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdayNames[beijingDate.getUTCDay()];
        weekdayScores[weekday].total += 1;
        weekdayScores[weekday].sum += entry.mood_score;
    });

    const topEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([emotion, count]) => `${emotion}(${count})`)
        .join('、');

    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => `${category}(${count})`)
        .join('、');

    const topLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([location, count]) => `${location}(${count})`)
        .join('、');

    const weekdayTrend = Object.entries(weekdayScores)
        .filter(([, value]) => value.total > 0)
        .map(([weekday, value]) => `${weekday}:${(value.sum / value.total).toFixed(1)}`)
        .join('、');

    const sanitizedScope = aliasRegistry.classAliasMap[classId] || '目标班级';

    const summary = [
        `分析对象：${sanitizedScope}`,
        `样本量：${total}`,
        `情绪结构：积极 ${positive}，平稳 ${neutral}，消极 ${negative}`,
        `高风险条数：${risk}`,
        `高频情绪：${topEmotions || '暂无'}`,
        `主要压力来源：${topCategories || '暂无'}`,
        `主要活动区域：${topLocations || '暂无'}`,
        `工作日趋势：${weekdayTrend || '暂无'}`
    ].join('\n');

    return {
        aliasRegistry,
        sanitizedScope,
        summary,
        metrics: { total, positive, neutral, negative, risk }
    };
};

const summarizeAdminEntries = (entries: any[]) => {
    const aliasRegistry = createAliasRegistry(
        entries.map((entry) => entry.class_id || ''),
        entries.map((entry) => entry.location || '')
    );

    const total = entries.length;
    const positive = entries.filter((entry) => entry.mood_score >= 4).length;
    const neutral = entries.filter((entry) => entry.mood_score === 3).length;
    const negative = entries.filter((entry) => entry.mood_score <= 2).length;
    const risk = entries.filter((entry) => entry.risk_level === 'High').length;

    const locationStats: Record<string, { total: number; negative: number; risk: number }> = {};
    const classStats: Record<string, { total: number; negative: number; risk: number }> = {};

    entries.forEach((entry) => {
        const locationAlias = aliasRegistry.locationAliasMap[entry.location] || '区域-未标记';
        if (!locationStats[locationAlias]) locationStats[locationAlias] = { total: 0, negative: 0, risk: 0 };
        locationStats[locationAlias].total++;
        if (entry.mood_score <= 2) locationStats[locationAlias].negative++;
        if (entry.risk_level === 'High') locationStats[locationAlias].risk++;

        const classAlias = aliasRegistry.classAliasMap[entry.class_id] || '班级组-未标记';
        if (!classStats[classAlias]) classStats[classAlias] = { total: 0, negative: 0, risk: 0 };
        classStats[classAlias].total++;
        if (entry.mood_score <= 2) classStats[classAlias].negative++;
        if (entry.risk_level === 'High') classStats[classAlias].risk++;
    });

    const topLocations = Object.entries(locationStats)
        .sort((a, b) => (b[1].negative + b[1].risk * 2) - (a[1].negative + a[1].risk * 2))
        .slice(0, 5)
        .map(([location, stats]) => `${location}: 样本${stats.total}，消极${stats.negative}，高风险${stats.risk}`)
        .join('\n');

    const topClasses = Object.entries(classStats)
        .filter(([, stats]) => stats.total >= 3)
        .sort((a, b) => (b[1].negative / b[1].total) - (a[1].negative / a[1].total))
        .slice(0, 5)
        .map(([classAlias, stats]) => `${classAlias}: 消极率${Math.round(stats.negative / stats.total * 100)}%，高风险${stats.risk}`)
        .join('\n');

    const summary = [
        '分析对象：全校聚合视角（已脱敏）',
        `样本量：${total}`,
        `情绪结构：积极 ${positive}，平稳 ${neutral}，消极 ${negative}`,
        `高风险条数：${risk}`,
        `重点区域：\n${topLocations || '暂无'}`,
        `重点班级组：\n${topClasses || '暂无'}`
    ].join('\n');

    return {
        aliasRegistry,
        summary,
        metrics: { total, positive, neutral, negative, risk }
    };
};

// --- ROUTES ---

// Submit Mood
app.post('/api/mood', async (c) => {
    try {
        const body = await c.req.json();
        const { user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, category: providedCategory } = body;

        const risk_level = analyzeRisk(content);
        const category = CATEGORIES.includes(providedCategory) ? providedCategory : 'Unspecified';
        const created_at = Date.now();
        const { start: dayStart, end: dayEnd } = getBeijingDayRange(created_at);

        const [todaySummary, lastEntry] = await Promise.all([
            c.env.DB.prepare(
                `SELECT COUNT(*) as today_count
                 FROM mood_entries
                 WHERE user_id = ? AND created_at >= ? AND created_at < ?`
            ).bind(user_id, dayStart, dayEnd).first<{ today_count: number | string }>(),
            c.env.DB.prepare(
                `SELECT created_at
                 FROM mood_entries
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT 1`
            ).bind(user_id).first<{ created_at: number | string }>()
        ]);

        const todayCount = Number(todaySummary?.today_count || 0);
        if (todayCount >= 6) {
            return c.json({
                error: 'TODAY_LIMIT_REACHED',
                message: '今天的情绪反馈次数已达上限，请明天再来。',
                today_upload_count: todayCount,
                daily_limit: 6
            }, 429);
        }

        const lastCreatedAt = Number(lastEntry?.created_at || 0);
        const cooldownMs = 30 * 60 * 1000;
        if (lastCreatedAt && created_at - lastCreatedAt < cooldownMs) {
            const retryAfterMs = cooldownMs - (created_at - lastCreatedAt);
            return c.json({
                error: 'COOLDOWN_ACTIVE',
                message: '两次提交至少需要间隔 30 分钟。',
                retry_after_ms: retryAfterMs,
                next_allowed_at: created_at + retryAfterMs,
                today_upload_count: todayCount,
                daily_limit: 6
            }, 429);
        }

        await c.env.DB.prepare(
            `INSERT INTO mood_entries (user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(user_id, role, class_id, mood_score, emotion_label, mood_color, content, location, risk_level, category, created_at).run();
        await incrementUserFeatureUsage(c.env.DB, user_id, class_id, FEATURE_KEYS.mood, created_at);
        await recordAchievementEvent(c.env.DB, {
            userId: user_id,
            classId: class_id,
            eventKey: 'mood_submitted',
            featureKey: FEATURE_KEYS.mood,
            moodDelta: 1,
            createdAt: created_at
        });

        const shareSummary = await c.env.DB.prepare(
            `SELECT COUNT(DISTINCT user_id) as share_count
             FROM mood_entries
             WHERE class_id = ? AND created_at >= ? AND created_at < ?`
        ).bind(class_id, dayStart, dayEnd).first<{ share_count: number | string }>();

        return c.json({
            success: true,
            risk_level,
            today_upload_count: todayCount + 1,
            daily_limit: 6,
            share_count_today: Number(shareSummary?.share_count || 0),
            cooldown_minutes: 30
        });
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

app.post('/api/auth/verify', async (c) => {
    try {
        const body = await c.req.json();
        const portal = body.portal as RestrictedPortal | undefined;
        const suppliedPassword = String(body.password || '').trim();

        if (!portal || !['teacher', 'admin', 'console'].includes(portal)) {
            return c.json({ error: 'Invalid portal' }, 400);
        }

        const expectedPassword = getPortalSecret(c.env, portal);
        if (!expectedPassword) {
            return c.json({ error: 'Portal auth is not configured.' }, 503);
        }

        if (!suppliedPassword || suppliedPassword !== expectedPassword) {
            return c.json({ error: 'Invalid portal password.' }, 401);
        }

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/student/onboarding', async (c) => {
    try {
        await ensureAchievementTables(c.env.DB);
        await ensureUserPortalProgressTable(c.env.DB);
        const userId = c.req.query('user_id');
        const classId = c.req.query('class_id') || null;
        if (!userId) {
            return c.json({ error: 'Missing user_id' }, 400);
        }

        const row = await c.env.DB.prepare(
            `SELECT user_id, class_id, portal_key, start_seen_at, guide_completed_at, updated_at
             FROM user_portal_progress
             WHERE user_id = ? AND portal_key = 'student'
             LIMIT 1`
        ).bind(userId).first();

        return c.json(row || {
            user_id: userId,
            class_id: classId,
            portal_key: 'student',
            start_seen_at: null,
            guide_completed_at: null,
            updated_at: null
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/student/onboarding', async (c) => {
    try {
        await ensureAchievementTables(c.env.DB);
        await ensureUserPortalProgressTable(c.env.DB);
        const body = await c.req.json();
        const userId = body.user_id;
        const classId = body.class_id || null;
        const markStartSeen = Boolean(body.mark_start_seen);
        const markGuideCompleted = Boolean(body.mark_guide_completed);
        const now = Date.now();

        if (!userId) {
            return c.json({ error: 'Missing user_id' }, 400);
        }

        await c.env.DB.prepare(
            `INSERT INTO user_portal_progress (user_id, class_id, portal_key, start_seen_at, guide_completed_at, updated_at)
             VALUES (?, ?, 'student', ?, ?, ?)
             ON CONFLICT(user_id, portal_key)
             DO UPDATE SET
               class_id = excluded.class_id,
               start_seen_at = CASE
                 WHEN excluded.start_seen_at IS NOT NULL THEN excluded.start_seen_at
                 ELSE user_portal_progress.start_seen_at
               END,
               guide_completed_at = CASE
                 WHEN excluded.guide_completed_at IS NOT NULL THEN excluded.guide_completed_at
                 ELSE user_portal_progress.guide_completed_at
               END,
               updated_at = excluded.updated_at`
        ).bind(
            userId,
            classId,
            markStartSeen ? now : null,
            markGuideCompleted ? now : null,
            now
        ).run();

        const row = await c.env.DB.prepare(
            `SELECT user_id, class_id, portal_key, start_seen_at, guide_completed_at, updated_at
             FROM user_portal_progress
             WHERE user_id = ? AND portal_key = 'student'
             LIMIT 1`
        ).bind(userId).first();

        return c.json(row);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// --- STATUS (WeChat Style) ---

app.get('/api/status', async (c) => {
    const user_id = c.req.query('user_id');
    const now = Date.now();
    const status = await c.env.DB.prepare(
        `SELECT * FROM user_statuses WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`
    ).bind(user_id, now).first();
    return c.json(normalizeStatusRow(status || null));
});

app.post('/api/status', async (c) => {
    try {
        const { user_id, class_id, status_key, custom_text, color_hex } = await c.req.json();
        const normalizedStatusKey = normalizeStatusKey(status_key);
        const now = Date.now();
        const expires_at = now + (24 * 60 * 60 * 1000);

        await c.env.DB.prepare(`DELETE FROM user_statuses WHERE user_id = ?`).bind(user_id).run();
        await c.env.DB.prepare(
            `INSERT INTO user_statuses (user_id, class_id, status_key, custom_text, color_hex, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(user_id, class_id || null, normalizedStatusKey, custom_text || null, color_hex, now, expires_at).run();
        await incrementUserFeatureUsage(c.env.DB, user_id, class_id, FEATURE_KEYS.status, now);

        const item = await c.env.DB.prepare(
            `SELECT * FROM user_statuses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
        ).bind(user_id).first();
        await recordAchievementEvent(c.env.DB, {
            userId: user_id,
            classId: class_id,
            eventKey: 'status_posted',
            featureKey: FEATURE_KEYS.status,
            referenceId: (item as any)?.id || null,
            statusDelta: 1,
            createdAt: now
        });

        return c.json({ success: true, expires_at, item: normalizeStatusRow(item) });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/status/feed', async (c) => {
    const now = Date.now();
    const viewerUserId = c.req.query('viewer_user_id') || '';
    const classId = c.req.query('class_id') || '';
    try {
        const baseQuery = classId
            ? `SELECT
                s.id,
                s.class_id,
                s.status_key,
                s.custom_text,
                s.color_hex,
                s.created_at,
                COUNT(r.id) AS resonance_count,
                MAX(CASE WHEN r.reactor_user_id = ? THEN 1 ELSE 0 END) AS reacted_by_viewer
            FROM user_statuses s
            LEFT JOIN user_status_reactions r ON r.status_id = s.id
            WHERE s.expires_at > ? AND s.class_id = ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT 50`
            : `SELECT
                s.id,
                s.class_id,
                s.status_key,
                s.custom_text,
                s.color_hex,
                s.created_at,
                COUNT(r.id) AS resonance_count,
                MAX(CASE WHEN r.reactor_user_id = ? THEN 1 ELSE 0 END) AS reacted_by_viewer
            FROM user_statuses s
            LEFT JOIN user_status_reactions r ON r.status_id = s.id
            WHERE s.expires_at > ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT 50`;
        const stmt = c.env.DB.prepare(baseQuery);
        const { results } = classId
            ? await stmt.bind(viewerUserId, now, classId).all()
            : await stmt.bind(viewerUserId, now).all();
        return c.json((results || []).map((row: any) => normalizeStatusRow(row)));
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/status/react', async (c) => {
    try {
        const { status_id, user_id } = await c.req.json();
        if (!status_id || !user_id) {
            return c.json({ error: 'Missing status_id or user_id' }, 400);
        }

        const targetStatus = await c.env.DB.prepare(
            `SELECT id, user_id, class_id FROM user_statuses WHERE id = ? LIMIT 1`
        ).bind(status_id).first<{ id: number; user_id: string; class_id: string | null }>();
        if (!targetStatus) {
            return c.json({ error: 'Status not found' }, 404);
        }

        const existing = await c.env.DB.prepare(
            `SELECT id FROM user_status_reactions WHERE status_id = ? AND reactor_user_id = ? LIMIT 1`
        ).bind(status_id, user_id).first();

        let reacted = false;
        if (existing) {
            await c.env.DB.prepare(
                `DELETE FROM user_status_reactions WHERE status_id = ? AND reactor_user_id = ?`
            ).bind(status_id, user_id).run();
        } else {
            const reactedAt = Date.now();
            await c.env.DB.prepare(
                `INSERT INTO user_status_reactions (status_id, reactor_user_id, created_at) VALUES (?, ?, ?)`
            ).bind(status_id, user_id, reactedAt).run();
            reacted = true;
            await recordAchievementEvent(c.env.DB, {
                userId: user_id,
                classId: targetStatus.class_id,
                eventKey: 'resonance_sent',
                featureKey: FEATURE_KEYS.status,
                referenceId: status_id,
                resonanceSentDelta: 1,
                createdAt: reactedAt
            });

            if (targetStatus.user_id && targetStatus.user_id !== user_id) {
                await recordAchievementEvent(c.env.DB, {
                    userId: targetStatus.user_id,
                    classId: targetStatus.class_id,
                    eventKey: 'resonance_received',
                    featureKey: FEATURE_KEYS.status,
                    referenceId: status_id,
                    resonanceReceivedDelta: 1,
                    createdAt: reactedAt
                });
            }
        }

        const countRow = await c.env.DB.prepare(
            `SELECT COUNT(*) as count FROM user_status_reactions WHERE status_id = ?`
        ).bind(status_id).first<{ count: number | string }>();

        return c.json({
            success: true,
            reacted,
            resonance_count: Number(countRow?.count || 0)
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// --- PORTAL CLASS MANAGEMENT ---

app.get('/api/classes', async (c) => {
    await ensurePortalClassesSeeded(c.env.DB);
    const { results } = await c.env.DB.prepare(
        `SELECT class_id, faculty, default_location, sort_order, is_active, created_at
         FROM portal_classes
         WHERE is_active = 1
         ORDER BY faculty ASC, sort_order ASC, class_id ASC`
    ).all();
    return c.json(results || []);
});

app.post('/api/classes', async (c) => {
    try {
        await ensurePortalClassesSeeded(c.env.DB);
        const body = await c.req.json();
        const classId = String(body.class_id || '').trim();
        const faculty = String(body.faculty || 'Custom').trim() || 'Custom';
        const defaultLocation = String(body.default_location || '').trim() || null;

        if (!classId) {
            return c.json({ error: 'Missing class_id' }, 400);
        }

        const existing = await c.env.DB.prepare(
            `SELECT class_id FROM portal_classes WHERE class_id = ? LIMIT 1`
        ).bind(classId).first();

        if (existing) {
            await c.env.DB.prepare(
                `UPDATE portal_classes
                 SET faculty = ?, default_location = ?, is_active = 1
                 WHERE class_id = ?`
            ).bind(faculty, defaultLocation, classId).run();
        } else {
            const row = await c.env.DB.prepare(
                `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM portal_classes WHERE faculty = ?`
            ).bind(faculty).first<{ max_sort: number | string }>();
            const sortOrder = Number(row?.max_sort || 0) + 1;
            await c.env.DB.prepare(
                `INSERT INTO portal_classes (class_id, faculty, default_location, sort_order, is_active, created_at)
                 VALUES (?, ?, ?, ?, 1, ?)`
            ).bind(classId, faculty, defaultLocation, sortOrder, Date.now()).run();
        }

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.delete('/api/classes/:classId', async (c) => {
    try {
        await ensurePortalClassesSeeded(c.env.DB);
        const classId = decodeURIComponent(c.req.param('classId'));
        if (!classId) return c.json({ error: 'Missing classId' }, 400);

        await c.env.DB.prepare(
            `UPDATE portal_classes SET is_active = 0 WHERE class_id = ?`
        ).bind(classId).run();

        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// --- CONSOLE ANALYTICS ---

app.get('/api/console/analytics', async (c) => {
    try {
        await ensurePortalClassesSeeded(c.env.DB);
        await ensureAchievementTables(c.env.DB);
        const days = Math.max(1, Math.min(30, Number(c.req.query('days') || 7)));
        const now = Date.now();
        const startTs = now - ((days - 1) * 24 * 60 * 60 * 1000);

        const [classesResult, moodResult, statusResult, usageResult, eventCountResult, badgeResult, dailyResult] = await Promise.all([
            c.env.DB.prepare(
                `SELECT class_id, faculty, default_location, sort_order
                 FROM portal_classes
                 WHERE is_active = 1
                 ORDER BY faculty ASC, sort_order ASC, class_id ASC`
            ).all(),
            c.env.DB.prepare(
                `SELECT user_id, class_id, risk_level, created_at
                 FROM mood_entries
                 WHERE created_at >= ?`
            ).bind(startTs).all(),
            c.env.DB.prepare(
                `SELECT user_id, class_id, created_at
                 FROM user_statuses
                 WHERE created_at >= ?`
            ).bind(startTs).all(),
            c.env.DB.prepare(
                `SELECT user_id, class_id, feature_key, upload_count, last_uploaded_at
                 FROM user_feature_usage`
            ).all(),
            c.env.DB.prepare(
                `SELECT COUNT(*) as count FROM achievement_events`
            ).first<{ count: number | string }>(),
            c.env.DB.prepare(
                `SELECT user_id, class_id, badge_key, badge_name, badge_description, badge_tier, progress_value, unlocked_at
                 FROM user_badges
                 ORDER BY unlocked_at DESC`
            ).all(),
            c.env.DB.prepare(
                `SELECT user_id, class_id, activity_date
                 FROM daily_user_activity
                 ORDER BY activity_date DESC`
            ).all()
        ]);

        const classes = (classesResult.results || []) as any[];
        const moodRows = ((moodResult.results || []) as any[]).filter((row) => !isSyntheticAnalyticsUser(row.user_id));
        const statusRows = ((statusResult.results || []) as any[]).filter((row) => !isSyntheticAnalyticsUser(row.user_id));
        const usageRows = ((usageResult.results || []) as any[]).filter((row) => !isSyntheticAnalyticsUser(row.user_id));
        const badgeRows = ((badgeResult.results || []) as any[]).filter((row) => !isSyntheticAnalyticsUser(row.user_id));
        const dailyRows = ((dailyResult.results || []) as any[]).filter((row) => !isSyntheticAnalyticsUser(row.user_id));

        const facultyMap = new Map<string, string>(classes.map((item) => [item.class_id, item.faculty]));
        const classBreakdownMap = new Map<string, any>();

        classes.forEach((item) => {
            classBreakdownMap.set(item.class_id, {
                class_id: item.class_id,
                faculty: item.faculty,
                bubbleCount: 0,
                communityCount: 0,
                totalCount: 0,
                highRiskCount: 0,
                uniqueUsers: new Set<string>()
            });
        });

        const dailyMap = new Map<string, {
            date: string;
            bubbleCount: number;
            statusCount: number;
            bubbleUsers: Set<string>;
            statusUsers: Set<string>;
        }>();

        for (let index = 0; index < days; index += 1) {
            const dayStart = startTs + index * 24 * 60 * 60 * 1000;
            const dayKey = new Date(dayStart + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
            dailyMap.set(dayKey, {
                date: formatConsoleDayLabel(dayStart),
                bubbleCount: 0,
                statusCount: 0,
                bubbleUsers: new Set<string>(),
                statusUsers: new Set<string>()
            });
        }

        moodRows.forEach((entry) => {
            const dayKey = new Date(entry.created_at + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
            const dayBucket = dailyMap.get(dayKey);
            if (dayBucket) {
                dayBucket.bubbleCount += 1;
                if (entry.user_id) dayBucket.bubbleUsers.add(entry.user_id);
            }

            const current = classBreakdownMap.get(entry.class_id) || {
                class_id: entry.class_id,
                faculty: facultyMap.get(entry.class_id) || 'Custom',
                bubbleCount: 0,
                communityCount: 0,
                totalCount: 0,
                highRiskCount: 0,
                uniqueUsers: new Set<string>()
            };
            current.bubbleCount += 1;
            current.totalCount += 1;
            if (entry.risk_level === 'High') current.highRiskCount += 1;
            if (entry.user_id) current.uniqueUsers.add(entry.user_id);
            classBreakdownMap.set(entry.class_id, current);
        });

        statusRows.forEach((entry) => {
            const dayKey = new Date(entry.created_at + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
            const dayBucket = dailyMap.get(dayKey);
            if (dayBucket) {
                dayBucket.statusCount += 1;
                if (entry.user_id) dayBucket.statusUsers.add(entry.user_id);
            }

            const current = classBreakdownMap.get(entry.class_id) || {
                class_id: entry.class_id,
                faculty: facultyMap.get(entry.class_id) || 'Custom',
                bubbleCount: 0,
                communityCount: 0,
                totalCount: 0,
                highRiskCount: 0,
                uniqueUsers: new Set<string>()
            };
            current.communityCount += 1;
            current.totalCount += 1;
            if (entry.user_id) current.uniqueUsers.add(entry.user_id);
            classBreakdownMap.set(entry.class_id, current);
        });

        const fallbackBubbleUsage = Array.from(
            moodRows.reduce((map, row) => {
                const key = `${row.user_id}::${row.class_id}`;
                const current = map.get(key) || {
                    user_id: row.user_id,
                    class_id: row.class_id,
                    count: 0
                };
                current.count += 1;
                map.set(key, current);
                return map;
            }, new Map<string, { user_id: string; class_id: string; count: number }>() ).values()
        );

        const fallbackStatusUsage = Array.from(
            statusRows.reduce((map, row) => {
                const classId = row.class_id || 'Unassigned';
                const key = `${row.user_id}::${classId}`;
                const current = map.get(key) || {
                    user_id: row.user_id,
                    class_id: classId,
                    count: 0
                };
                current.count += 1;
                map.set(key, current);
                return map;
            }, new Map<string, { user_id: string; class_id: string; count: number }>() ).values()
        );

        const topMoodSource = usageRows.some((row) => row.feature_key === FEATURE_KEYS.mood)
            ? usageRows
                .filter((row) => row.feature_key === FEATURE_KEYS.mood)
                .map((row) => ({
                    user_id: row.user_id,
                    class_id: row.class_id,
                    count: Number(row.upload_count || 0)
                }))
            : fallbackBubbleUsage;

        const topStatusSource = usageRows.some((row) => row.feature_key === FEATURE_KEYS.status)
            ? usageRows
                .filter((row) => row.feature_key === FEATURE_KEYS.status)
                .map((row) => ({
                    user_id: row.user_id,
                    class_id: row.class_id,
                    count: Number(row.upload_count || 0)
                }))
            : fallbackStatusUsage;

        const topMoodUsers = topMoodSource
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map((row, index) => ({
                rank: index + 1,
                user_id: row.user_id,
                class_id: row.class_id,
                count: Number(row.count || 0)
            }));

        const topStatusUsers = topStatusSource
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map((row, index) => ({
                rank: index + 1,
                user_id: row.user_id,
                class_id: row.class_id,
                count: Number(row.count || 0)
            }));

        const weeklyUsage = Array.from(dailyMap.values()).map((item) => ({
            date: item.date,
            bubbleCount: item.bubbleCount,
            statusCount: item.statusCount,
            bubbleUsers: item.bubbleUsers.size,
            statusUsers: item.statusUsers.size
        }));

        const classBreakdown = Array.from(classBreakdownMap.values())
            .map((item) => ({
                class_id: item.class_id,
                faculty: item.faculty,
                bubbleCount: item.bubbleCount,
                communityCount: item.communityCount,
                totalCount: item.totalCount,
                highRiskCount: item.highRiskCount,
                uniqueUsers: item.uniqueUsers.size
            }))
            .filter((item) => item.class_id)
            .sort((a, b) => b.totalCount - a.totalCount);

        const bubbleUploads = weeklyUsage.reduce((sum, item) => sum + item.bubbleCount, 0);
        const communityUploads = weeklyUsage.reduce((sum, item) => sum + item.statusCount, 0);
        const featureMix = [
            { name: '气泡反馈', value: bubbleUploads, color: '#FACC15' },
            { name: '情绪社区', value: communityUploads, color: '#3B82F6' }
        ];
        const badgeCountByUser = badgeRows.reduce((map, row) => {
            map.set(row.user_id, (map.get(row.user_id) || 0) + 1);
            return map;
        }, new Map<string, number>());
        const activityDatesByUser = dailyRows.reduce((map, row) => {
            const current = map.get(row.user_id) || {
                user_id: row.user_id,
                class_id: row.class_id || null,
                dates: [] as string[]
            };
            current.class_id = current.class_id || row.class_id || null;
            current.dates.push(row.activity_date);
            map.set(row.user_id, current);
            return map;
        }, new Map<string, { user_id: string; class_id: string | null; dates: string[] }>());
        const topStreaks = Array.from(activityDatesByUser.values())
            .map((row) => {
                const streaks = computeStreaksFromDays(row.dates);
                return {
                    user_id: row.user_id,
                    class_id: row.class_id,
                    currentStreak: streaks.currentStreak,
                    longestStreak: streaks.longestStreak,
                    activeDays: streaks.activeDays,
                    totalBadges: badgeCountByUser.get(row.user_id) || 0
                };
            })
            .sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak || b.activeDays - a.activeDays)
            .slice(0, 8);

        return c.json({
            metrics: {
                activeClasses: classes.length,
                bubbleUploads,
                communityUploads,
                totalUploads: bubbleUploads + communityUploads,
                activeUsers: new Set([
                    ...moodRows.map((row) => row.user_id).filter(Boolean),
                    ...statusRows.map((row) => row.user_id).filter(Boolean)
                ]).size
            },
            achievements: {
                totalEvents: Number(eventCountResult?.count || 0),
                totalBadges: badgeRows.length,
                usersWithBadges: new Set(badgeRows.map((row) => row.user_id).filter(Boolean)).size,
                topCurrentStreak: topStreaks[0]?.currentStreak || 0,
                latestUnlocks: badgeRows.slice(0, 10),
                topStreaks
            },
            weeklyUsage,
            topUsers: {
                bubble: topMoodUsers,
                community: topStatusUsers
            },
            classBreakdown,
            featureMix
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/console/history', async (c) => {
    try {
        const feature = c.req.query('feature') || 'all';
        const classId = c.req.query('class_id');
        const limit = Math.max(20, Math.min(500, Number(c.req.query('limit') || 200)));

        const moodPromise = (feature === 'all' || feature === FEATURE_KEYS.mood)
            ? c.env.DB.prepare(
                `SELECT id, user_id, class_id, created_at, location, emotion_label, risk_level, content
                 FROM mood_entries
                 WHERE (? IS NULL OR class_id = ?)
                 ORDER BY created_at DESC
                 LIMIT ?`
            ).bind(classId || null, classId || null, limit).all()
            : Promise.resolve({ results: [] as any[] });

        const statusPromise = (feature === 'all' || feature === FEATURE_KEYS.status)
            ? c.env.DB.prepare(
                `SELECT id, user_id, class_id, created_at, status_key, custom_text
                 FROM user_statuses
                 WHERE (? IS NULL OR class_id = ?)
                 ORDER BY created_at DESC
                 LIMIT ?`
            ).bind(classId || null, classId || null, limit).all()
            : Promise.resolve({ results: [] as any[] });

        const [moodResult, statusResult] = await Promise.all([moodPromise, statusPromise]);

        const moodRows = ((moodResult.results || []) as any[])
            .filter((row) => !isSyntheticAnalyticsUser(row.user_id))
            .map((row) => ({
                id: `mood-${row.id}`,
                feature: FEATURE_KEYS.mood,
                user_id: row.user_id,
                class_id: row.class_id,
                created_at: row.created_at,
                location: row.location || null,
                emotion_label: row.emotion_label || null,
                risk_level: row.risk_level || null,
                content: row.content || null
            }));

        const statusRows = ((statusResult.results || []) as any[])
            .filter((row) => !isSyntheticAnalyticsUser(row.user_id))
            .map((row) => ({
                id: `status-${row.id}`,
                feature: FEATURE_KEYS.status,
                user_id: row.user_id,
                class_id: row.class_id,
                created_at: row.created_at,
                status_key: normalizeStatusKey(row.status_key) || null,
                custom_text: row.custom_text || null
            }));

        const merged = [...moodRows, ...statusRows]
            .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
            .slice(0, limit);

        return c.json(merged);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/console/actual-users', async (c) => {
    try {
        await ensureUserPortalProgressTable(c.env.DB);
        const { results } = await c.env.DB.prepare(
            `SELECT user_id, class_id, portal_key, start_seen_at, guide_completed_at, updated_at
             FROM user_portal_progress
             WHERE portal_key = 'student' AND guide_completed_at IS NOT NULL
             ORDER BY guide_completed_at DESC, updated_at DESC, user_id ASC`
        ).all();

        return c.json(results || []);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/console/manage/clear-actual-users', async (c) => {
    try {
        await ensureUserPortalProgressTable(c.env.DB);
        const before = await c.env.DB.prepare(
            `SELECT COUNT(*) as count FROM user_portal_progress WHERE portal_key = 'student'`
        ).first<{ count: number | string }>();

        await c.env.DB.prepare(
            `DELETE FROM user_portal_progress WHERE portal_key = 'student'`
        ).run();

        return c.json({
            success: true,
            removed: Number(before?.count || 0)
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/console/manage/clear', async (c) => {
    try {
        await ensureAchievementTables(c.env.DB);
        const body = await c.req.json();
        const scope = body.scope === 'class' ? 'class' : 'all';
        const classId = typeof body.class_id === 'string' ? body.class_id : null;

        if (scope === 'class' && !classId) {
            return c.json({ error: 'Missing class_id' }, 400);
        }

        if (scope === 'all') {
            await c.env.DB.batch([
                c.env.DB.prepare(`DELETE FROM user_status_reactions`),
                c.env.DB.prepare(`DELETE FROM user_statuses`),
                c.env.DB.prepare(`DELETE FROM mood_entries`),
                c.env.DB.prepare(`DELETE FROM safety_reports`),
                c.env.DB.prepare(`DELETE FROM ai_advice`),
                c.env.DB.prepare(`DELETE FROM user_feature_usage`),
                c.env.DB.prepare(`DELETE FROM achievement_events`),
                c.env.DB.prepare(`DELETE FROM daily_user_activity`),
                c.env.DB.prepare(`DELETE FROM user_badges`)
            ]);
            return c.json({ success: true, cleared: 'all' });
        }

        await c.env.DB.batch([
            c.env.DB.prepare(`DELETE FROM user_status_reactions WHERE status_id IN (SELECT id FROM user_statuses WHERE class_id = ? )`).bind(classId),
            c.env.DB.prepare(`DELETE FROM user_statuses WHERE class_id = ?`).bind(classId),
            c.env.DB.prepare(`DELETE FROM mood_entries WHERE class_id = ?`).bind(classId),
            c.env.DB.prepare(`DELETE FROM user_feature_usage WHERE class_id = ?`).bind(classId),
            c.env.DB.prepare(`DELETE FROM ai_advice WHERE scope_id = ? OR scope_id = ? OR scope_id = ?`).bind(classId, `${classId}::en`, buildAdviceScopeId(classId, 'en')),
            c.env.DB.prepare(`DELETE FROM achievement_events WHERE class_id = ?`).bind(classId),
            c.env.DB.prepare(`DELETE FROM daily_user_activity WHERE class_id = ?`).bind(classId),
            c.env.DB.prepare(`DELETE FROM user_badges WHERE class_id = ?`).bind(classId)
        ]);

        return c.json({ success: true, cleared: classId });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/console/manage/inject-statuses', async (c) => {
    try {
        await ensurePortalClassesSeeded(c.env.DB);
        const body = await c.req.json();
        const scope = body.scope === 'class' ? 'class' : 'all';
        const classId = typeof body.class_id === 'string' ? body.class_id : null;
        const count = Math.max(1, Math.min(200, Number(body.count || 12)));

        if (scope === 'class' && !classId) {
            return c.json({ error: 'Missing class_id' }, 400);
        }

        const classRows = await c.env.DB.prepare(
            `SELECT class_id FROM portal_classes WHERE is_active = 1 ${scope === 'class' ? 'AND class_id = ?' : ''} ORDER BY faculty ASC, sort_order ASC, class_id ASC`
        ).bind(...(scope === 'class' ? [classId] : [])).all();

        const targetClasses = ((classRows.results || []) as Array<{ class_id: string }>).map((row) => row.class_id).filter(Boolean);
        if (!targetClasses.length) {
            return c.json({ error: 'No target classes found' }, 400);
        }

        const now = Date.now();
        const statusBatch = [];
        const usageBatch = [];

        for (let index = 0; index < count; index += 1) {
            const targetClass = targetClasses[index % targetClasses.length];
            const preset = STATUS_COMMUNITY_PRESETS[index % STATUS_COMMUNITY_PRESETS.length];
            const createdAt = now - index * 19 * 60 * 1000;
            const userId = buildSystemStatusUserId(targetClass, index);

            statusBatch.push(
                c.env.DB.prepare(
                    `INSERT INTO user_statuses (user_id, class_id, status_key, custom_text, color_hex, created_at, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    userId,
                    targetClass,
                    preset.key,
                    preset.text,
                    preset.color,
                    createdAt,
                    createdAt + 24 * 60 * 60 * 1000
                )
            );

            usageBatch.push(
                c.env.DB.prepare(
                    `INSERT INTO user_feature_usage (user_id, class_id, feature_key, upload_count, last_uploaded_at)
                     VALUES (?, ?, ?, 1, ?)
                     ON CONFLICT(user_id, class_id, feature_key)
                     DO UPDATE SET upload_count = user_feature_usage.upload_count + 1, last_uploaded_at = excluded.last_uploaded_at, class_id = excluded.class_id`
                ).bind(userId, targetClass, FEATURE_KEYS.status, createdAt)
            );
        }

        if (statusBatch.length) await c.env.DB.batch(statusBatch);
        if (usageBatch.length) await c.env.DB.batch(usageBatch);

        return c.json({ success: true, injected: count, classes: targetClasses.length });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.post('/api/console/manage/clear-injected-statuses', async (c) => {
    try {
        const body = await c.req.json();
        const scope = body.scope === 'class' ? 'class' : 'all';
        const classId = typeof body.class_id === 'string' ? body.class_id : null;

        if (scope === 'class' && !classId) {
            return c.json({ error: 'Missing class_id' }, 400);
        }

        const whereClause = scope === 'class'
            ? `user_id LIKE 'SYS-%' AND class_id = ?`
            : `user_id LIKE 'SYS-%'`;

        const statusRows = await c.env.DB.prepare(
            `SELECT id FROM user_statuses WHERE ${whereClause}`
        ).bind(...(scope === 'class' ? [classId] : [])).all();

        const statusIds = ((statusRows.results || []) as Array<{ id: number }>).map((row) => row.id);
        if (statusIds.length) {
            const placeholders = statusIds.map(() => '?').join(', ');
            await c.env.DB.prepare(
                `DELETE FROM user_status_reactions WHERE status_id IN (${placeholders})`
            ).bind(...statusIds).run();
        }

        await c.env.DB.batch([
            c.env.DB.prepare(`DELETE FROM user_statuses WHERE ${whereClause}`).bind(...(scope === 'class' ? [classId] : [])),
            c.env.DB.prepare(
                `DELETE FROM user_feature_usage
                 WHERE feature_key = ? AND user_id LIKE 'SYS-%' ${scope === 'class' ? 'AND class_id = ?' : ''}`
            ).bind(...(scope === 'class' ? [FEATURE_KEYS.status, classId] : [FEATURE_KEYS.status]))
        ]);

        return c.json({ success: true, removed: statusIds.length });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

app.get('/api/console/manage/backup', async (c) => {
    try {
        await ensurePortalClassesSeeded(c.env.DB);
        await ensureAchievementTables(c.env.DB);
        await ensureUserPortalProgressTable(c.env.DB);
        const scope = c.req.query('scope') === 'class' ? 'class' : 'all';
        const classId = c.req.query('class_id');
        const params = scope === 'class' ? [classId, classId] : [];

        if (scope === 'class' && !classId) {
            return c.json({ error: 'Missing class_id' }, 400);
        }

        const [classesResult, moodResult, statusResult, usageResult, adviceResult, eventResult, dailyResult, badgeResult, progressResult] = await Promise.all([
            c.env.DB.prepare(
                `SELECT class_id, faculty, default_location, sort_order, is_active, created_at
                 FROM portal_classes
                 WHERE is_active = 1 ${scope === 'class' ? 'AND class_id = ?' : ''}
                 ORDER BY faculty ASC, sort_order ASC, class_id ASC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM mood_entries WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY created_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM user_statuses WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY created_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM user_feature_usage WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY last_uploaded_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM ai_advice WHERE ${scope === 'class' ? '(scope_id = ? OR scope_id = ?)' : '1=1'} ORDER BY created_at DESC`
            ).bind(...(scope === 'class' ? [classId, `${classId}::en`] : [])).all()
            ,
            c.env.DB.prepare(
                `SELECT * FROM achievement_events WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY created_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM daily_user_activity WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY activity_date DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM user_badges WHERE ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY unlocked_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all(),
            c.env.DB.prepare(
                `SELECT * FROM user_portal_progress WHERE portal_key = 'student' AND ${scope === 'class' ? 'class_id = ?' : '1=1'} ORDER BY guide_completed_at DESC, updated_at DESC`
            ).bind(...(scope === 'class' ? [classId] : [])).all()
        ]);

        return c.json({
            exported_at: Date.now(),
            scope,
            class_id: scope === 'class' ? classId : null,
            counts: {
                classes: (classesResult.results || []).length,
                mood_entries: (moodResult.results || []).length,
                user_statuses: (statusResult.results || []).length,
                user_feature_usage: (usageResult.results || []).length,
                ai_advice: (adviceResult.results || []).length,
                achievement_events: (eventResult.results || []).length,
                daily_user_activity: (dailyResult.results || []).length,
                user_badges: (badgeResult.results || []).length,
                user_portal_progress: (progressResult.results || []).length
            },
            classes: classesResult.results || [],
            mood_entries: moodResult.results || [],
            user_statuses: statusResult.results || [],
            user_feature_usage: usageResult.results || [],
            ai_advice: adviceResult.results || [],
            achievement_events: eventResult.results || [],
            daily_user_activity: dailyResult.results || [],
            user_badges: badgeResult.results || [],
            user_portal_progress: progressResult.results || []
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
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
    const forceRefresh = c.req.query('force') === '1';
    const responseLang = c.req.query('lang') === 'en' ? 'en' : 'zh';
    const wantsEnglish = responseLang === 'en';
    const shouldRestore = c.req.query('restore') === '1';
    const adviceScopeId = buildAdviceScopeId(class_id, responseLang);
    const beijingTime = getBeijingNow();
    const today = beijingTime.toISOString().split('T')[0];
    const targetDate = dateQuery || today;
    const timeContext = getTimeContextLabel(beijingTime);

    try {
        const existing: any = await c.env.DB.prepare(
            `SELECT * FROM ai_advice WHERE target_role = 'Teacher' AND scope_id = ? AND date_str = ?`
        ).bind(adviceScopeId, targetDate).first();

        const isFresh = existing && (Date.now() - (existing.created_at || 0) < AI_ADVICE_REFRESH_MS);

        if (existing && (!forceRefresh || targetDate !== today) && (targetDate !== today || isFresh)) {
            const { results: existingEntries } = await c.env.DB.prepare(
                `SELECT class_id, location FROM mood_entries WHERE class_id = ? ORDER BY created_at DESC LIMIT 50`
            ).bind(class_id).all();
            const existingRegistry = createAliasRegistry(
                [class_id],
                (existingEntries as any[]).map((entry) => entry.location || '')
            );
            return c.json({
                id: existing.id,
                advice: stripMarkdownFormatting(shouldRestore ? existingRegistry.restoreAliasedTerms(existing.content) : existing.content),
                checked_indices: JSON.parse(existing.checked_indices || '[]'),
                date: existing.date_str,
                source: 'db',
                refreshed_at: existing.created_at || null
            });
        }

        if (targetDate !== today) {
            return c.json({ error: wantsEnglish ? "No advice recorded for this date." : "No advice recorded for this date." });
        }

        // --- Generate New Advice ---
        const { results: entries } = await c.env.DB.prepare(
            `SELECT * FROM mood_entries WHERE class_id = ? ORDER BY created_at DESC LIMIT 50`
        ).bind(class_id).all();

        if (!entries || entries.length === 0) {
            return c.json({ advice: wantsEnglish ? "Not enough data yet to generate advice. Please wait for more student check-ins." : "暂无足够数据生成建议。请等待更多学生登记情绪后再试。" });
        }

        const typedEntries = entries as any[];

        const teacherContext = summarizeTeacherEntries(typedEntries, class_id);
        const { summary, metrics, sanitizedScope, aliasRegistry } = teacherContext;

        // @ts-ignore
        const apiKey = c.env.GEMINI_API_KEY;

        let adviceContent = "";

        if (!apiKey) {
            adviceContent = wantsEnglish
                ? `Class Snapshot\n${metrics.total} samples this period, ${metrics.negative} negative entries, and ${metrics.risk} high-risk entries.\n\nAction Suggestions\n• Let the homeroom teacher run a low-pressure emotional check-in during the next class meeting to confirm whether the fluctuation is continuing.\n• Ask the counselor to screen high-risk records today and arrange private follow-up without naming students publicly.\n• Let subject teachers reduce or clarify the most frequent pressure sources during this week.\n• Ask the grade team to discuss only trends and aliases during the next review, not individual identities.`
                : `【班级情绪概况】\n${timeContext}样本 ${metrics.total} 条，消极 ${metrics.negative} 条，高风险 ${metrics.risk} 条。\n\n【行动建议】\n• 由班主任在本周最近一次班会先做低压力情绪签到，确认波动是否持续\n• 由心理老师在今天内筛查高风险相关记录并安排私下跟进，不在公开场景点名\n• 由任课老师在本周内对高频压力来源相关任务做一次减负或说明澄清\n• 由年级组在下次复盘时只讨论趋势和代号，不讨论个体身份`;
        } else {
            try {
                const systemPrompt = wantsEnglish
                    ? `You are a school mental-health support advisor. You only receive anonymized aggregate statistics. Never request, infer, or reveal any real school name, class name, location name, student identity, direct quote, or information that could re-identify a person.

Output requirements:
1. Respond in English.
2. Start with a short "Class Snapshot" no longer than 30 words.
3. Then write "Action Suggestions" and give 4 plain-text lines.
4. Each bullet must include: what to do, who should do it, and when to do it.
5. Keep the suggestions realistic and executable within a school today or this week.
6. Do not make medical diagnoses.
7. Do not quote raw text or reveal real class or area names; only use anonymized aliases from the input if needed.`
                    : `你是一位校园心理支持顾问。你只接收已经脱敏的聚合统计数据，禁止要求、推测或输出任何真实学校名称、班级名称、地点名称、学生身份信息、引号内原话或可逆向定位个体的信息。

输出要求：
1. 用中文回答。
2. 必须先写一个不超过40字的【班级情绪概况】。
3. 再写【行动建议】并给出4条纯文本建议。
4. 每条建议都要包含：做什么、谁来做、何时做。
5. 建议必须具体、现实、可在校园里当天或本周执行。
6. 不做心理诊断，不使用“患有”“确诊”等医学判断。
7. 不引用任何原始文本，不输出真实班级/区域名称；如果需要指代，只能使用输入中的脱敏代号。
8. 输出纯文本，不使用 Markdown、星号项目符号、井号标题或加粗标记。`;
                const userPrompt = wantsEnglish
                    ? `Here is the anonymized summary for ${sanitizedScope} during ${timeContext}:\n\n${summary}\n\nPlease provide a truly actionable checklist for the homeroom teacher. Prioritize high-risk records, sustained low-score trends, and repeated stress sources. The actions should be realistic for a school to carry out during ${timeContext}.`
                    : `以下是 ${sanitizedScope} 在${timeContext}的脱敏摘要：\n\n${summary}\n\n请基于这些数据给班主任一份真正可执行的建议清单。优先处理：高风险记录、持续低分趋势、重复出现的压力来源。建议要符合${timeContext}能实际落地的校园动作。`;

                adviceContent = await callGeminiAI(apiKey, systemPrompt, userPrompt);
                adviceContent = aliasRegistry.replaceSensitiveTerms(stripMarkdownFormatting(adviceContent));
            } catch (e: any) {
                console.error('AI Service Error:', e);
                adviceContent = wantsEnglish ? "AI generation is temporarily unavailable. Please try again later." : "AI生成暂时不可用，请稍后重试。";
            }
        }

        let newId = existing?.id;
        if (existing) {
            await c.env.DB.prepare(
                `UPDATE ai_advice SET content = ?, checked_indices = ?, created_at = ? WHERE id = ?`
            ).bind(adviceContent, '[]', Date.now(), existing.id).run();
        } else {
            const result: any = await c.env.DB.prepare(
                `INSERT INTO ai_advice (target_role, scope_id, content, checked_indices, date_str, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
            ).bind('Teacher', adviceScopeId, adviceContent, '[]', today, Date.now()).first();
            newId = result?.id;
        }

        return c.json({
            id: newId,
            advice: stripMarkdownFormatting(shouldRestore ? aliasRegistry.restoreAliasedTerms(adviceContent) : adviceContent),
            checked_indices: [],
            date: today,
            source: forceRefresh ? 'refreshed' : 'generated',
            refreshed_at: Date.now()
        });

    } catch (e: any) {
        console.error('Advice Error:', e);
        return c.json({ advice: wantsEnglish ? "An error occurred while fetching the advice." : "获取建议时发生错误。" });
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
    const responseLang = c.req.query('lang') === 'en' ? 'en' : 'zh';
    const adviceScopeId = buildAdviceScopeId(scope_id, responseLang);

    try {
        const { results } = await c.env.DB.prepare(
            `SELECT date_str FROM ai_advice WHERE target_role = ? AND scope_id = ? ORDER BY date_str DESC LIMIT 30`
        ).bind(role, adviceScopeId).all();
        return c.json((results || []).map((r: any) => r.date_str));
    } catch (e) {
        console.error('Advice history error:', e);
        return c.json([]);
    }
});



app.get('/api/report/weekly', async (c) => {
    const role = c.req.query('role') || 'Teacher';
    const scope_id = c.req.query('scope_id') || 'Unknown';
    const shouldRestore = c.req.query('restore') === '1';

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

    const reportAliasRegistry = createAliasRegistry(
        filteredEntries.map((entry) => entry.class_id || ''),
        filteredEntries.map((entry) => entry.location || '')
    );

    const safeCategoryStats = categoryStats.map((item) => ({
        ...item,
        subject: reportAliasRegistry.replaceSensitiveTerms(item.subject)
    }));

    const visibleCategoryStats = shouldRestore
        ? safeCategoryStats.map((item) => ({
            ...item,
            subject: reportAliasRegistry.restoreAliasedTerms(item.subject)
        }))
        : safeCategoryStats;

    // 5. AI Summary
    // @ts-ignore
    const apiKey = c.env.GEMINI_API_KEY;
    let aiSummary = "系统暂无足够数据生成周报汇总。";

    if (apiKey && filteredEntries.length > 0) {
        try {
            const prompt = `以下是已经脱敏的周报数据（仅周一至周五，忽略周末）：
            - 角色：${role === 'Teacher' ? '班级视角' : '全校视角'}
            - 本周趋势：${trend.map(t => `${t.date}:${t.score}`).join('，')}
            - 低分重点对象：${safeCategoryStats.map(c => c.subject).join('，')}
            - 整体消极占比：${Math.round(negative / filteredEntries.length * 100)}%

            请生成 100 字以内的中文决策提示，禁止输出真实班级、地点、学校名称，只能使用脱敏代号。`;

            aiSummary = await callGeminiAI(apiKey, "你是一位学校数据分析助手，只能基于脱敏汇总给出趋势判断，不得输出身份信息。输出纯文本，不使用 Markdown、星号项目符号、井号标题或加粗标记。", prompt);
            aiSummary = reportAliasRegistry.replaceSensitiveTerms(stripMarkdownFormatting(aiSummary));
        } catch (e) { console.error(e); }
    } else if (filteredEntries.length === 0) {
        aiSummary = "本周（周一至周五）暂无数据记录，无法生成分析。";
    }

    const visibleSummary = stripMarkdownFormatting(shouldRestore ? reportAliasRegistry.restoreAliasedTerms(aiSummary) : aiSummary);

    return c.json({
        trend,
        composition,
        categoryStats: visibleCategoryStats,
        aiSummary: visibleSummary,
        total: filteredEntries.length,
        risk: filteredEntries.filter(e => e.risk_level === 'High').length
    });
});

// Admin Advice Endpoint - School-wide analysis
app.get('/api/admin/advice', async (c) => {
    const dateQuery = c.req.query('date');
    const forceRefresh = c.req.query('force') === '1';
    const responseLang = c.req.query('lang') === 'en' ? 'en' : 'zh';
    const wantsEnglish = responseLang === 'en';
    const shouldRestore = c.req.query('restore') === '1';
    const adviceScopeId = buildAdviceScopeId('All', responseLang);
    const beijingTime = getBeijingNow();
    const today = beijingTime.toISOString().split('T')[0];
    const targetDate = dateQuery || today;
    const timeContext = getTimeContextLabel(beijingTime);

    try {
        const existing: any = await c.env.DB.prepare(
            `SELECT * FROM ai_advice WHERE target_role = 'Admin' AND scope_id = ? AND date_str = ?`
        ).bind(adviceScopeId, targetDate).first();

        const isFresh = existing && (Date.now() - (existing.created_at || 0) < AI_ADVICE_REFRESH_MS);

        if (existing && (!forceRefresh || targetDate !== today) && (targetDate !== today || isFresh)) {
            const { results: existingEntries } = await c.env.DB.prepare(
                `SELECT class_id, location FROM mood_entries ORDER BY created_at DESC LIMIT 200`
            ).all();
            const existingRegistry = createAliasRegistry(
                (existingEntries as any[]).map((entry) => entry.class_id || ''),
                (existingEntries as any[]).map((entry) => entry.location || '')
            );
            return c.json({
                id: existing.id,
                advice: stripMarkdownFormatting(shouldRestore ? existingRegistry.restoreAliasedTerms(existing.content) : existing.content),
                checked_indices: JSON.parse(existing.checked_indices || '[]'),
                date: existing.date_str,
                source: 'db',
                refreshed_at: existing.created_at || null
            });
        }

        if (targetDate !== today) {
            return c.json({ error: wantsEnglish ? "No advice recorded for this date." : "No advice recorded for this date." });
        }

        // Get all recent entries
        const { results: entries } = await c.env.DB.prepare(
            `SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 200`
        ).all();

        if (!entries || entries.length === 0) {
            return c.json({ advice: wantsEnglish ? "Not enough data yet to generate advice. The system needs more student records for analysis." : "暂无足够数据生成建议。系统需要更多学生数据才能进行分析。" });
        }

        const typedEntries = entries as any[];

        const adminContext = summarizeAdminEntries(typedEntries);
        const { summary, metrics, aliasRegistry } = adminContext;

        const apiKey = c.env.GEMINI_API_KEY;

        let adviceContent = "";

        if (!apiKey) {
            adviceContent = wantsEnglish
                ? `School Snapshot\n${metrics.total} samples this period, ${metrics.negative} negative entries, and ${metrics.risk} high-risk entries.\n\nStrategic Actions\n• Ask the discipline or duty team to observe the anonymized hotspot areas with the highest risk concentration today.\n• Let the grade leadership review class groups with sustained high negative rates within this week.\n• Have the counseling center publish one shared response plan for the most common stress sources rather than letting each class improvise.\n• Ensure leadership reports only trends and aliases externally, never real class or location names.`
                : `【全校情绪概况】\n${timeContext}样本 ${metrics.total} 条，消极 ${metrics.negative} 条，高风险 ${metrics.risk} 条。\n\n【战略行动建议】\n• 由德育或值班团队在今天优先覆盖高风险最集中的脱敏区域做现场观察\n• 由年级组在本周内对连续消极率偏高的班级组做一次专项复盘\n• 由心理中心在本周统一输出针对共性压力来源的减压动作，避免各班自行摸索\n• 由管理层对外汇报时只呈现趋势和代号，不呈现真实班级与地点`;
        } else {
            try {
                const systemPrompt = wantsEnglish
                    ? `You are a school management decision advisor. You receive only anonymized school-wide aggregate data and may only provide trend-based management actions.

Output requirements:
1. Respond in English.
2. Start with a "School Snapshot" no longer than 35 words.
3. Then write "Strategic Actions" and give 4 plain-text lines.
4. Each bullet must include: action, responsible role, timing, and expected effect.
5. The suggestions should be immediately usable by school leaders, discipline staff, counselors, or grade teams.
6. Never reveal real school, class, location, student information, or raw text.
7. If you need to reference targets, only use anonymized aliases from the input.
8. Output plain text only. Do not use Markdown, asterisks, hash headings, or bold markers.`
                : `你是一位学校管理决策顾问。你拿到的是已经脱敏的全校聚合数据，只能基于趋势做管理建议。

输出要求：
1. 用中文回答。
2. 先写一个不超过50字的【全校情绪概况】。
3. 再写【战略行动建议】并给出4条纯文本建议。
4. 每条建议都要包含：动作、责任角色、执行时点、预期效果。
5. 建议要能被校长、德育、心理、年级组立即采用。
6. 禁止输出真实学校名、班级名、地点名、学生信息或原始文本。
7. 如果需要指代对象，只能使用脱敏代号。
8. 输出纯文本，不使用 Markdown、星号项目符号、井号标题或加粗标记。`;

                const userPrompt = wantsEnglish
                    ? `Here is the anonymized school-wide summary for ${timeContext}:\n\n${summary}\n\nPlease produce a truly actionable school-level brief. Prioritize high-risk hotspots, sustained negative trends, and issues that require cross-team coordination. The actions should be realistic for ${timeContext}.`
                    : `以下是全校在${timeContext}的脱敏摘要：\n\n${summary}\n\n请输出一份真正可执行的校级简报，优先处理：高风险点位、连续性消极趋势、需要跨部门协同的问题。建议要符合${timeContext}能立即安排的管理动作。`;

                adviceContent = await callGeminiAI(apiKey, systemPrompt, userPrompt);
                adviceContent = aliasRegistry.replaceSensitiveTerms(stripMarkdownFormatting(adviceContent));
            } catch (e: any) {
                console.error('AI Service Error:', e);
                adviceContent = wantsEnglish ? "AI generation is temporarily unavailable. Please try again later." : "AI生成暂时不可用，请稍后重试。";
            }
        }

        let resultId = existing?.id;
        if (existing) {
            await c.env.DB.prepare(
                `UPDATE ai_advice SET content = ?, checked_indices = ?, created_at = ? WHERE id = ?`
            ).bind(adviceContent, '[]', Date.now(), existing.id).run();
        } else {
            const result: any = await c.env.DB.prepare(
                `INSERT INTO ai_advice (target_role, scope_id, content, checked_indices, date_str, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
            ).bind('Admin', adviceScopeId, adviceContent, '[]', today, Date.now()).first();
            resultId = result?.id;
        }

        return c.json({
            id: resultId,
            advice: stripMarkdownFormatting(shouldRestore ? aliasRegistry.restoreAliasedTerms(adviceContent) : adviceContent),
            checked_indices: [],
            date: today,
            source: forceRefresh ? 'refreshed' : 'generated',
            refreshed_at: Date.now()
        });
    } catch (e) {
        console.error('Admin advice error:', e);
        return c.json({
            error: wantsEnglish ? "Failed to load admin advice." : "获取管理端建议失败。",
            advice: wantsEnglish ? "AI generation is temporarily unavailable. Please try again later." : "AI生成暂时不可用，请稍后重试。"
        }, 500);
    }
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
    await ensurePortalClassesSeeded(c.env.DB);
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
    const usageBatch = [];

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
        const userId = '#' + Math.floor(1000 + Math.random() * 9000);

        batch.push(stmt.bind(
            userId,
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

        usageBatch.push(c.env.DB.prepare(
            `INSERT INTO user_feature_usage (user_id, class_id, feature_key, upload_count, last_uploaded_at)
             VALUES (?, ?, ?, 1, ?)
             ON CONFLICT(user_id, class_id, feature_key)
             DO UPDATE SET upload_count = user_feature_usage.upload_count + 1, last_uploaded_at = excluded.last_uploaded_at, class_id = excluded.class_id`
        ).bind(userId, class_id, FEATURE_KEYS.mood, created_at));
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

        usageBatch.push(c.env.DB.prepare(
            `INSERT INTO user_feature_usage (user_id, class_id, feature_key, upload_count, last_uploaded_at)
             VALUES (?, ?, ?, 1, ?)
             ON CONFLICT(user_id, class_id, feature_key)
             DO UPDATE SET upload_count = user_feature_usage.upload_count + 1, last_uploaded_at = excluded.last_uploaded_at, class_id = excluded.class_id`
        ).bind(userId, class_id, FEATURE_KEYS.status, Date.now()));
    }

    if (statusBatch.length > 0) {
        await c.env.DB.batch(statusBatch);
    }
    if (usageBatch.length > 0) {
        await c.env.DB.batch(usageBatch);
    }

    return c.json({ success: true, message: `Generated ${count} entries and ${statusCount} statuses.` });
});

app.post('/api/demo/clear', async (c) => {
    await ensureAchievementTables(c.env.DB);
    await c.env.DB.prepare(`DELETE FROM mood_entries`).run();
    await c.env.DB.prepare(`DELETE FROM safety_reports`).run();
    await c.env.DB.prepare(`DELETE FROM ai_advice`).run();
    await c.env.DB.prepare(`DELETE FROM user_statuses`).run();
    await c.env.DB.prepare(`DELETE FROM user_status_reactions`).run();
    await c.env.DB.prepare(`DELETE FROM user_feature_usage`).run();
    await c.env.DB.prepare(`DELETE FROM achievement_events`).run();
    await c.env.DB.prepare(`DELETE FROM daily_user_activity`).run();
    await c.env.DB.prepare(`DELETE FROM user_badges`).run();
    return c.json({ success: true, message: "Cleared all data." });
});

export default app;
