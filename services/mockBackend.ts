import { MoodEntry, StatPoint, Role, MoodCategory, HeatmapPoint, PortalClass, ConsoleAnalytics, ConsoleHistoryItem, ActualPortalUserRow } from '../types';
import { EMOTIONS } from './constants';
import { FLATTENED_CLASSES, SCHOOL_STRUCTURE, getTypeLocation } from '../components/SchoolStructure';

type StatusFeedItem = {
  id: number;
  user_id: string;
  class_id: string | null;
  status_key: string;
  custom_text: string | null;
  color_hex: string;
  created_at: number;
  resonance_count?: number;
  reacted_by_viewer?: number;
};

const DB_KEY = 'mindlink_mock_entries_v2';
const STATUS_DB_KEY = 'mindlink_mock_status_feed_v2';
const STATUS_REACTION_DB_KEY = 'mindlink_mock_status_reactions_v1';
const CLASS_DB_KEY = 'mindlink_mock_portal_classes_v1';
const USAGE_DB_KEY = 'mindlink_mock_feature_usage_v1';
const ONBOARDING_DB_KEY = 'mindlink_mock_onboarding_v1';

const RISK_KEYWORDS = ['die', 'hurt', 'pain', 'bullying', 'suicide', 'kill', 'hopeless', 'blood', 'bomb', '活不下去', '不想活', '想消失', '没人懂我'];
const CATEGORIES: MoodCategory[] = ['Academic', 'Social', 'Environment', 'Health', 'Future'];
const VALID_LOCATIONS = [
  'AQ1', 'AQ2', 'AQ3', 'AQ4', '电力楼', '侧楼',
  '女生宿舍', '男生宿舍', '食堂', '游泳馆', '宿舍AB', '宿舍CD',
  '行政楼', '体育馆', '篮球场'
];

const STATUS_LIBRARY = [
  { key: 'focus', color: '#3B82F6', text: '专注学习模式' },
  { key: 'recharging', color: '#10B981', text: '慢慢回血中' },
  { key: 'vibing', color: '#06B6D4', text: '戴着耳机缓一缓' },
  { key: 'relaxing', color: '#64748B', text: '在找一点松弛感' },
  { key: 'crushing', color: '#EC4899', text: '今天也有小确幸' },
  { key: 'fire', color: '#EF4444', text: '给自己一点冲劲' },
  { key: 'exploring', color: '#6366F1', text: '想法正在发芽' }
];

const LEGACY_STATUS_KEY_MAP: Record<string, string> = {
  ranking: 'relaxing',
  sleeping: 'recharging'
};

const STUDENT_POOL = [
  'S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007', 'S008',
  'S009', 'S010', 'S011', 'S012', 'S013', 'S014', 'S015', 'S016'
];

const getSeedUserIdForClass = (classId: string, offset = 0) => {
  const classIndex = Math.max(0, FLATTENED_CLASSES.indexOf(classId));
  const studentBase = STUDENT_POOL[(classIndex + offset) % STUDENT_POOL.length];
  return `${studentBase}-1`;
};

const getSyntheticStatusUserId = (classId: string, index: number) => {
  const compactClass = classId.replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '').slice(0, 6) || 'CLS';
  return `SYS-${compactClass}-${String(index + 1).padStart(3, '0')}`;
};

type FeatureUsageRecord = {
  user_id: string;
  class_id: string;
  feature_key: 'mood_bubble' | 'status_community';
  upload_count: number;
  last_uploaded_at: number;
};

const ENTRY_COPY = [
  '今天状态还行，想把节奏稳住。',
  '刚下课有点累，想先缓一下。',
  '作业有点多，但还能顶住。',
  '和朋友聊完之后轻松很多。',
  '刚考完试，心里终于放下一点。',
  '中午人太多了，有点吵。',
  '今天上课注意力有点飘。',
  '运动完感觉舒服不少。',
  '这节课我其实挺有成就感。',
  '想安静一点，不太想说话。'
];

const RISK_COPY = [
  '这两天压力太大了，感觉有点撑不住。',
  '最近总觉得没人懂我。',
  '今天真的很想消失一下。',
  '状态很糟，什么都不想做。'
];

const canUseStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

const readStatusReactions = () => readJson<Record<string, string[]>>(STATUS_REACTION_DB_KEY, {});
const writeStatusReactions = (value: Record<string, string[]>) => writeJson(STATUS_REACTION_DB_KEY, value);
const readFeatureUsage = () => readJson<FeatureUsageRecord[]>(USAGE_DB_KEY, []);
const writeFeatureUsage = (value: FeatureUsageRecord[]) => writeJson(USAGE_DB_KEY, value);
const readOnboarding = () => readJson<ActualPortalUserRow[]>(ONBOARDING_DB_KEY, []);
const writeOnboarding = (value: ActualPortalUserRow[]) => writeJson(ONBOARDING_DB_KEY, value);

const createSeedClasses = (): PortalClass[] => {
  const rows: PortalClass[] = [];
  Object.entries(SCHOOL_STRUCTURE).forEach(([facultyKey, faculty], facultyIndex) => {
    faculty.classes.forEach((classId, classIndex) => {
      rows.push({
        class_id: classId,
        faculty: facultyKey,
        default_location: getTypeLocation(facultyKey, classId),
        sort_order: facultyIndex * 100 + classIndex + 1,
        is_active: 1,
        created_at: Date.now()
      });
    });
  });
  return rows;
};

const getPortalClassStore = (): PortalClass[] => {
  ensureSeeded();
  return readJson<PortalClass[]>(CLASS_DB_KEY, []);
};

const bumpFeatureUsage = (userId: string, classId: string, featureKey: 'mood_bubble' | 'status_community', timestamp = Date.now()) => {
  const usage = readFeatureUsage();
  const existing = usage.find((item) => item.user_id === userId && item.class_id === classId && item.feature_key === featureKey);
  if (existing) {
    existing.upload_count += 1;
    existing.last_uploaded_at = timestamp;
  } else {
    usage.push({
      user_id: userId,
      class_id: classId,
      feature_key: featureKey,
      upload_count: 1,
      last_uploaded_at: timestamp
    });
  }
  writeFeatureUsage(usage);
};

const analyzeRisk = (content: string): 'Normal' | 'High' => {
  const lower = content.toLowerCase();
  return RISK_KEYWORDS.some(word => lower.includes(word.toLowerCase())) ? 'High' : 'Normal';
};

const getFacultyForClass = (classId: string) => {
  if (SCHOOL_STRUCTURE.AA.classes.includes(classId)) return 'AA';
  return 'CNC';
};

const getDemoLocation = (classId: string, offset: number) => {
  const faculty = getFacultyForClass(classId);
  const home = getTypeLocation(faculty, classId);
  const rotation = faculty === 'AA'
    ? [home, '食堂', '体育馆', 'AQ4', '行政楼']
    : [home, 'AQ3', '食堂', '篮球场', '行政楼'];
  return rotation[offset % rotation.length];
};

const createSeedEntries = (): MoodEntry[] => {
  const now = Date.now();
  const seeded: MoodEntry[] = [];

  FLATTENED_CLASSES.forEach((classId, classIndex) => {
    const baseStudent = STUDENT_POOL[classIndex % STUDENT_POOL.length];

    for (let i = 0; i < 3; i++) {
      const emotion = EMOTIONS[(classIndex * 3 + i * 2) % EMOTIONS.length];
      const risky = (classIndex + i) % 11 === 0;
      const createdAt = now - ((classIndex * 5 + i * 13) % 144) * 60 * 60 * 1000;
      const content = risky ? RISK_COPY[(classIndex + i) % RISK_COPY.length] : ENTRY_COPY[(classIndex + i) % ENTRY_COPY.length];

      seeded.push({
        id: Number(`${createdAt}`.slice(-8)) + classIndex * 10 + i,
        user_id: `${baseStudent}-${i + 1}`,
        role: 'Student' as Role,
        class_id: classId,
        mood_score: risky ? Math.min(emotion.score, 2) : emotion.score,
        emotion_label: emotion.label,
        mood_color: emotion.color,
        content,
        location: getDemoLocation(classId, i),
        risk_level: risky ? 'High' : analyzeRisk(content),
        category: CATEGORIES[(classIndex + i) % CATEGORIES.length],
        created_at: createdAt
      });
    }
  });

  return seeded.sort((a, b) => b.created_at - a.created_at);
};

const createSeedStatuses = (): StatusFeedItem[] => {
  const now = Date.now();
  const featuredClasses = [
    SCHOOL_STRUCTURE.AA.classes[0],
    SCHOOL_STRUCTURE.AA.classes[1],
    SCHOOL_STRUCTURE.AA.classes[4],
    SCHOOL_STRUCTURE.CNC.classes[0],
    SCHOOL_STRUCTURE.CNC.classes[2],
    SCHOOL_STRUCTURE.CNC.classes[5]
  ];

  return featuredClasses.map((classId, index) => {
    const preset = STATUS_LIBRARY[index % STATUS_LIBRARY.length];
    return {
      id: now + index,
      user_id: getSeedUserIdForClass(classId, index),
      class_id: classId,
      status_key: preset.key,
      custom_text: preset.text,
      color_hex: preset.color,
      created_at: now - index * 23 * 60 * 1000
    };
  });
};

const ensureSeeded = () => {
  if (!canUseStorage()) return;
  if (!localStorage.getItem(DB_KEY)) {
    writeJson(DB_KEY, createSeedEntries());
  }
  if (!localStorage.getItem(STATUS_DB_KEY)) {
    writeJson(STATUS_DB_KEY, createSeedStatuses());
  }
  if (!localStorage.getItem(CLASS_DB_KEY)) {
    writeJson(CLASS_DB_KEY, createSeedClasses());
  }
  if (!localStorage.getItem(USAGE_DB_KEY)) {
    writeFeatureUsage([]);
  }
  if (!localStorage.getItem(ONBOARDING_DB_KEY)) {
    const now = Date.now();
    const seeded = FLATTENED_CLASSES.slice(0, 8).map((classId, index) => ({
      user_id: getSeedUserIdForClass(classId, index),
      class_id: classId,
      portal_key: 'student',
      start_seen_at: now - (index + 2) * 60 * 60 * 1000,
      guide_completed_at: now - (index + 1) * 50 * 60 * 1000,
      updated_at: now - index * 35 * 60 * 1000
    }));
    writeOnboarding(seeded);
  }
};

export const getEntries = (): MoodEntry[] => {
  ensureSeeded();
  return readJson<MoodEntry[]>(DB_KEY, []);
};

export const getStatusFeed = (): StatusFeedItem[] => {
  ensureSeeded();
  const stored = readJson<StatusFeedItem[]>(STATUS_DB_KEY, []);
  const normalized = stored.map((item, index) => ({
    ...item,
    status_key: LEGACY_STATUS_KEY_MAP[item.status_key] || item.status_key,
    id: typeof item.id === 'number' ? item.id : (item.created_at || Date.now()) + index,
    user_id: typeof item.user_id === 'string' && item.user_id.startsWith('feed-')
      ? getSeedUserIdForClass(item.class_id || FLATTENED_CLASSES[index % FLATTENED_CLASSES.length], index)
      : item.user_id
  }));
  if (normalized.some((item, index) =>
    item.id !== stored[index]?.id ||
    item.status_key !== stored[index]?.status_key ||
    item.user_id !== stored[index]?.user_id
  )) {
    writeJson(STATUS_DB_KEY, normalized);
  }
  return normalized.sort((a, b) => b.created_at - a.created_at);
};

export const getStatus = (userId: string) => {
  return getStatusFeed().find((item) => item.user_id === userId) || null;
};

export const setStatus = (payload: {
  user_id: string;
  class_id: string;
  status_key: string;
  custom_text: string | null;
  color_hex: string;
}) => {
  const current = getStatusFeed().filter((item) => item.user_id !== payload.user_id);
  const nextItem: StatusFeedItem = {
    id: Date.now(),
    ...payload,
    created_at: Date.now()
  };
  writeJson(STATUS_DB_KEY, [nextItem, ...current].slice(0, 18));
  bumpFeatureUsage(payload.user_id, payload.class_id, 'status_community', nextItem.created_at);
  return { success: true, item: nextItem };
};

export const getStatusFeedForUser = (viewerUserId: string, classId?: string): StatusFeedItem[] => {
  const reactions = readStatusReactions();
  return getStatusFeed()
    .filter((item) => !classId || item.class_id === classId)
    .map((item) => {
    const voters = reactions[String(item.id)] || [];
    return {
      ...item,
      resonance_count: voters.length,
      reacted_by_viewer: voters.includes(viewerUserId) ? 1 : 0
    };
  });
};

export const toggleStatusResonance = (statusId: number, viewerUserId: string) => {
  const reactions = readStatusReactions();
  const key = String(statusId);
  const current = reactions[key] || [];
  const hasReacted = current.includes(viewerUserId);
  const next = hasReacted
    ? current.filter((id) => id !== viewerUserId)
    : [...current, viewerUserId];
  reactions[key] = next;
  writeStatusReactions(reactions);
  return {
    success: true,
    reacted: !hasReacted,
    resonance_count: next.length
  };
};

export const saveEntry = (data: Omit<MoodEntry, 'id' | 'created_at' | 'risk_level' | 'category'> & { category?: MoodCategory | string }): MoodEntry => {
  const entries = getEntries();
  const nextEntry: MoodEntry = {
    ...data,
    id: Date.now(),
    created_at: Date.now(),
    risk_level: analyzeRisk(data.content),
    category: data.category || 'Unspecified'
  };
  writeJson(DB_KEY, [nextEntry, ...entries]);
  bumpFeatureUsage(data.user_id, data.class_id, 'mood_bubble', nextEntry.created_at);
  return nextEntry;
};

export const getMoodHistory = (userId: string) => {
  return getEntries()
    .filter((entry) => entry.user_id === userId)
    .slice(0, 24);
};

export const searchLogs = (params: { q?: string; risk_level?: string; class_id?: string; start_date?: number; end_date?: number }) => {
  const q = params.q?.trim().toLowerCase();
  return getEntries().filter((entry) => {
    if (params.class_id && entry.class_id !== params.class_id) return false;
    if (params.risk_level && entry.risk_level !== params.risk_level) return false;
    if (params.start_date && entry.created_at < params.start_date) return false;
    if (params.end_date && entry.created_at > params.end_date) return false;
    if (q) {
      const haystack = `${entry.content} ${entry.location || ''} ${entry.user_id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
};

export const getTeacherRadarData = (classId: string) => {
  const entries = getEntries().filter((entry) => entry.class_id === classId);
  return CATEGORIES.map((category) => {
    const matches = entries.filter((entry) => entry.category === category);
    const average = matches.length
      ? matches.reduce((sum, entry) => sum + entry.mood_score, 0) / matches.length
      : 3.2;
    return {
      subject: category,
      A: Number(average.toFixed(1)),
      fullMark: 5
    };
  });
};

export const getTeacherActivityVolume = (classId: string) => {
  const entries = getEntries().filter((entry) => entry.class_id === classId);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().split('T')[0];
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    return { key, label };
  });

  return days.map((day) => ({
    date: day.label,
    count: entries.filter((entry) => new Date(entry.created_at).toISOString().split('T')[0] === day.key).length
  }));
};

export const getAdminStackedData = () => {
  const locationMap: Record<string, { name: string; Positive: number; Neutral: number; Negative: number; Risk: number }> = {};

  VALID_LOCATIONS.forEach((location) => {
    locationMap[location] = { name: location, Positive: 0, Neutral: 0, Negative: 0, Risk: 0 };
  });

  getEntries().forEach((entry) => {
    if (!entry.location || !locationMap[entry.location]) return;
    if (entry.risk_level === 'High') locationMap[entry.location].Risk += 1;
    else if (entry.mood_score >= 4) locationMap[entry.location].Positive += 1;
    else if (entry.mood_score === 3) locationMap[entry.location].Neutral += 1;
    else locationMap[entry.location].Negative += 1;
  });

  return Object.values(locationMap).filter((location) => location.Positive + location.Neutral + location.Negative + location.Risk > 0);
};

export const getAdminRiskDist = () => {
  const entries = getEntries();
  if (entries.length === 0) return [];
  const high = entries.filter((entry) => entry.risk_level === 'High').length;
  const medium = entries.filter((entry) => entry.risk_level === 'Normal' && entry.mood_score <= 2).length;
  const low = Math.max(entries.length - high - medium, 0);

  return [
    { name: 'Low Risk', value: low, color: '#10b981' },
    { name: 'Medium Risk', value: medium, color: '#f59e0b' },
    { name: 'High Risk', value: high, color: '#ef4444' }
  ];
};

export const getAdminHeatmap = (): HeatmapPoint[] => {
  const stats: Record<string, { highRisk: number; total: number; moods: string[] }> = {};

  getEntries().forEach((entry) => {
    if (!entry.location) return;
    if (!stats[entry.location]) stats[entry.location] = { highRisk: 0, total: 0, moods: [] };
    stats[entry.location].total += 1;
    stats[entry.location].moods.push(entry.mood_color);
    if (entry.risk_level === 'High') stats[entry.location].highRisk += 1;
  });

  return Object.entries(stats).map(([location, value]) => ({
    location,
    riskScore: Math.min((value.highRisk / Math.max(value.total, 1)) * 4, 1),
    recentMoods: value.moods.slice(-24)
  }));
};

export const getTeacherClassStats = (classId: string) => {
  const entries = getEntries().filter((entry) => entry.class_id === classId);
  return {
    entries: entries.slice(0, 50),
    highRisk: entries.filter((entry) => entry.risk_level === 'High'),
    distribution: EMOTIONS.map((emotion) => ({
      name: emotion.label,
      value: entries.filter((entry) => entry.emotion_label === emotion.label).length,
      color: emotion.color
    })).filter((item) => item.value > 0)
  };
};

export const getTeacherTrends = (classId: string): StatPoint[] => {
  const grouped: Record<string, { total: number; count: number }> = {};

  getEntries()
    .filter((entry) => entry.class_id === classId)
    .forEach((entry) => {
      const date = new Date(entry.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
      grouped[date].total += entry.mood_score;
      grouped[date].count += 1;
    });

  return Object.keys(grouped)
    .map((date) => ({
      date,
      averageScore: Number((grouped[date].total / grouped[date].count).toFixed(1)),
      count: grouped[date].count
    }))
    .reverse()
    .slice(-7);
};

export const clearDatabase = () => {
  if (!canUseStorage()) return;
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(STATUS_DB_KEY);
  localStorage.removeItem(STATUS_REACTION_DB_KEY);
  localStorage.removeItem(USAGE_DB_KEY);
  localStorage.removeItem(CLASS_DB_KEY);
  localStorage.removeItem(ONBOARDING_DB_KEY);
  localStorage.removeItem('mindlink_student_id');
  ensureSeeded();
};

export const generateDemoData = (count: number) => {
  const entries = getEntries();
  const generated: MoodEntry[] = [];

  for (let i = 0; i < count; i++) {
    const classId = FLATTENED_CLASSES[i % FLATTENED_CLASSES.length];
    const emotion = EMOTIONS[(i * 5) % EMOTIONS.length];
    const risky = i % 9 === 0;
    const text = risky ? RISK_COPY[i % RISK_COPY.length] : ENTRY_COPY[i % ENTRY_COPY.length];
    generated.push({
      id: Date.now() + i,
      user_id: `AUTO-${i + 1}`,
      role: 'Student' as Role,
      class_id: classId,
      mood_score: risky ? Math.min(emotion.score, 2) : emotion.score,
      emotion_label: emotion.label,
      mood_color: emotion.color,
      content: text,
      location: getDemoLocation(classId, i),
      risk_level: risky ? 'High' : analyzeRisk(text),
      category: CATEGORIES[i % CATEGORIES.length],
      created_at: Date.now() - i * 45 * 60 * 1000
    });
  }

  writeJson(DB_KEY, [...generated, ...entries]);
  generated.forEach((entry) => bumpFeatureUsage(entry.user_id, entry.class_id, 'mood_bubble', entry.created_at));
};

export const getPortalClasses = (): PortalClass[] => {
  return getPortalClassStore()
    .filter((item) => item.is_active !== 0)
    .sort((a, b) => (a.faculty || '').localeCompare(b.faculty || '') || (a.sort_order || 0) - (b.sort_order || 0));
};

export const addPortalClass = (payload: { class_id: string; faculty: string; default_location?: string | null }) => {
  const classId = payload.class_id.trim();
  if (!classId) return { success: false, error: 'Missing class_id' };

  const classes = getPortalClassStore();
  const existing = classes.find((item) => item.class_id === classId);
  if (existing) {
    existing.faculty = payload.faculty || existing.faculty || 'Custom';
    existing.default_location = payload.default_location || existing.default_location || 'AQ1';
    existing.is_active = 1;
  } else {
    classes.push({
      class_id: classId,
      faculty: payload.faculty || 'Custom',
      default_location: payload.default_location || 'AQ1',
      sort_order: classes.length + 1,
      is_active: 1,
      created_at: Date.now()
    });
  }
  writeJson(CLASS_DB_KEY, classes);
  return { success: true };
};

export const deletePortalClass = (classId: string) => {
  const classes = getPortalClassStore().map((item) =>
    item.class_id === classId ? { ...item, is_active: 0 } : item
  );
  writeJson(CLASS_DB_KEY, classes);
  return { success: true };
};

export const consoleClearData = (params: { scope: 'all' | 'class'; class_id?: string }) => {
  const scope = params.scope;
  const classId = params.class_id;
  const currentEntries = getEntries();
  const currentStatuses = getStatusFeed();

  if (scope === 'class' && !classId) {
    return { success: false, error: 'Missing class_id' };
  }

  const nextEntries = scope === 'all'
    ? []
    : currentEntries.filter((entry) => entry.class_id !== classId);

  const removedStatusIds = currentStatuses
    .filter((item) => scope === 'all' || item.class_id === classId)
    .map((item) => String(item.id));

  const nextStatuses = scope === 'all'
    ? []
    : currentStatuses.filter((item) => item.class_id !== classId);

  const nextReactions = Object.fromEntries(
    Object.entries(readStatusReactions()).filter(([statusId]) => !removedStatusIds.includes(statusId))
  );

  const nextUsage = scope === 'all'
    ? []
    : readFeatureUsage().filter((item) => item.class_id !== classId);

  writeJson(DB_KEY, nextEntries);
  writeJson(STATUS_DB_KEY, nextStatuses);
  writeStatusReactions(nextReactions);
  writeFeatureUsage(nextUsage);

  return {
    success: true,
    deleted: {
      moodEntries: currentEntries.length - nextEntries.length,
      statuses: removedStatusIds.length
    }
  };
};

export const consoleInjectStatuses = (params: { scope: 'all' | 'class'; class_id?: string; count: number }) => {
  const scope = params.scope;
  const classId = params.class_id;
  const count = Math.max(1, Math.min(200, Number(params.count || 12)));

  const activeClasses = getPortalClasses().map((item) => item.class_id);
  const targets = scope === 'all'
    ? activeClasses
    : classId
      ? [classId]
      : [];

  if (!targets.length) {
    return { success: false, error: 'No target classes available' };
  }

  const now = Date.now();
  const existing = getStatusFeed();
  const injected: StatusFeedItem[] = Array.from({ length: count }, (_, index) => {
    const targetClass = targets[index % targets.length];
    const preset = STATUS_LIBRARY[index % STATUS_LIBRARY.length];
    return {
      id: now + index,
      user_id: getSyntheticStatusUserId(targetClass, index),
      class_id: targetClass,
      status_key: preset.key,
      custom_text: preset.text,
      color_hex: preset.color,
      created_at: now - index * 17 * 60 * 1000
    };
  });

  writeJson(STATUS_DB_KEY, [...injected, ...existing].sort((a, b) => b.created_at - a.created_at).slice(0, 300));
  injected.forEach((item) => bumpFeatureUsage(item.user_id, item.class_id || 'Unassigned', 'status_community', item.created_at));

  return {
    success: true,
    injected: count,
    classes: targets.length
  };
};

export const consoleClearInjectedStatuses = (params: { scope: 'all' | 'class'; class_id?: string }) => {
  const scope = params.scope;
  const classId = params.class_id;
  const currentStatuses = getStatusFeed();
  const currentUsage = readFeatureUsage();

  const removableStatuses = currentStatuses.filter((item) =>
    item.user_id.startsWith('SYS-') && (scope === 'all' || item.class_id === classId)
  );
  const removableIds = new Set(removableStatuses.map((item) => String(item.id)));

  const nextStatuses = currentStatuses.filter((item) => !removableIds.has(String(item.id)));
  const nextReactions = Object.fromEntries(
    Object.entries(readStatusReactions()).filter(([statusId]) => !removableIds.has(statusId))
  );
  const nextUsage = currentUsage.filter((item) =>
    !(item.feature_key === 'status_community' && item.user_id.startsWith('SYS-') && (scope === 'all' || item.class_id === classId))
  );

  writeJson(STATUS_DB_KEY, nextStatuses);
  writeStatusReactions(nextReactions);
  writeFeatureUsage(nextUsage);

  return {
    success: true,
    removed: removableStatuses.length
  };
};

export const consoleBackupData = (params?: { scope?: 'all' | 'class'; class_id?: string }) => {
  const scope = params?.scope === 'class' ? 'class' : 'all';
  const classId = params?.class_id;
  const classFilter = (value?: string | null) => scope === 'all' || value === classId;

  const moodEntries = getEntries().filter((item) => classFilter(item.class_id));
  const statuses = getStatusFeed().filter((item) => classFilter(item.class_id));
  const usage = readFeatureUsage().filter((item) => classFilter(item.class_id));
  const onboarding = readOnboarding().filter((item) => classFilter(item.class_id || undefined));
  const classes = getPortalClasses().filter((item) => scope === 'all' || item.class_id === classId);

  return {
    exported_at: Date.now(),
    scope,
    class_id: scope === 'class' ? classId || null : null,
    counts: {
      classes: classes.length,
      moodEntries: moodEntries.length,
      statuses: statuses.length,
      featureUsage: usage.length
      ,
      actualPortalUsers: onboarding.length
    },
    classes,
    mood_entries: moodEntries,
    user_statuses: statuses,
    user_feature_usage: usage,
    user_portal_progress: onboarding
  };
};

export const getActualPortalUsers = (): ActualPortalUserRow[] => {
  return readOnboarding()
    .filter((row) => row.portal_key === 'student' && row.guide_completed_at)
    .sort((a, b) => Number(b.guide_completed_at || 0) - Number(a.guide_completed_at || 0));
};

export const clearActualPortalUsers = () => {
  const existing = readOnboarding();
  const remaining = existing.filter((row) => row.portal_key !== 'student');
  writeOnboarding(remaining);
  return {
    success: true,
    removed: existing.length - remaining.length
  };
};

export const getConsoleAnalytics = (days = 7): ConsoleAnalytics => {
  const now = Date.now();
  const start = now - ((days - 1) * 24 * 60 * 60 * 1000);
  const entries = getEntries().filter((entry) => entry.created_at >= start);
  const statuses = getStatusFeed().filter((item) => item.created_at >= start);
  const classes = getPortalClasses();
  const usage = readFeatureUsage();

  const daily = Array.from({ length: days }, (_, index) => {
    const timestamp = start + index * 24 * 60 * 60 * 1000;
    const key = new Date(timestamp).toISOString().split('T')[0];
    return {
      key,
      date: `${new Date(timestamp).getMonth() + 1}/${new Date(timestamp).getDate()}`,
      bubbleCount: 0,
      statusCount: 0,
      bubbleUsers: new Set<string>(),
      statusUsers: new Set<string>()
    };
  });
  const dailyMap = new Map(daily.map((item) => [item.key, item]));

  const classMap = new Map<string, any>(
    classes.map((item) => [item.class_id, {
      class_id: item.class_id,
      faculty: item.faculty,
      bubbleCount: 0,
      communityCount: 0,
      totalCount: 0,
      highRiskCount: 0,
      uniqueUsers: new Set<string>()
    }])
  );

  entries.forEach((entry) => {
    const key = new Date(entry.created_at).toISOString().split('T')[0];
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.bubbleCount += 1;
      bucket.bubbleUsers.add(entry.user_id);
    }
    const classBucket = classMap.get(entry.class_id) || {
      class_id: entry.class_id,
      faculty: 'Custom',
      bubbleCount: 0,
      communityCount: 0,
      totalCount: 0,
      highRiskCount: 0,
      uniqueUsers: new Set<string>()
    };
    classBucket.bubbleCount += 1;
    classBucket.totalCount += 1;
    if (entry.risk_level === 'High') classBucket.highRiskCount += 1;
    classBucket.uniqueUsers.add(entry.user_id);
    classMap.set(entry.class_id, classBucket);
  });

  statuses.forEach((status) => {
    const key = new Date(status.created_at).toISOString().split('T')[0];
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.statusCount += 1;
      bucket.statusUsers.add(status.user_id);
    }
    const classBucket = classMap.get(status.class_id || '') || {
      class_id: status.class_id || 'Unassigned',
      faculty: 'Custom',
      bubbleCount: 0,
      communityCount: 0,
      totalCount: 0,
      highRiskCount: 0,
      uniqueUsers: new Set<string>()
    };
    classBucket.communityCount += 1;
    classBucket.totalCount += 1;
    classBucket.uniqueUsers.add(status.user_id);
    classMap.set(status.class_id || 'Unassigned', classBucket);
  });

  const fallbackBubbleUsage = Array.from(
    entries.reduce((map, entry) => {
      const key = `${entry.user_id}::${entry.class_id}`;
      const current = map.get(key) || { user_id: entry.user_id, class_id: entry.class_id, count: 0 };
      current.count += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { user_id: string; class_id: string; count: number }>() ).values()
  );

  const fallbackStatusUsage = Array.from(
    statuses.reduce((map, entry) => {
      const classId = entry.class_id || 'Unassigned';
      const key = `${entry.user_id}::${classId}`;
      const current = map.get(key) || { user_id: entry.user_id, class_id: classId, count: 0 };
      current.count += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { user_id: string; class_id: string; count: number }>() ).values()
  );

  const topBubbleSource = usage.some((item) => item.feature_key === 'mood_bubble')
    ? usage
        .filter((item) => item.feature_key === 'mood_bubble')
        .map((item) => ({ user_id: item.user_id, class_id: item.class_id, count: item.upload_count }))
    : fallbackBubbleUsage;

  const topCommunitySource = usage.some((item) => item.feature_key === 'status_community')
    ? usage
        .filter((item) => item.feature_key === 'status_community')
        .map((item) => ({ user_id: item.user_id, class_id: item.class_id, count: item.upload_count }))
    : fallbackStatusUsage;

  const topBubble = topBubbleSource
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item, index) => ({ rank: index + 1, user_id: item.user_id, class_id: item.class_id, count: item.count }));

  const topCommunity = topCommunitySource
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item, index) => ({ rank: index + 1, user_id: item.user_id, class_id: item.class_id, count: item.count }));

  const weeklyUsage = daily.map((item) => ({
    date: item.date,
    bubbleCount: item.bubbleCount,
    statusCount: item.statusCount,
    bubbleUsers: item.bubbleUsers.size,
    statusUsers: item.statusUsers.size
  }));

  const bubbleUploads = weeklyUsage.reduce((sum, item) => sum + item.bubbleCount, 0);
  const communityUploads = weeklyUsage.reduce((sum, item) => sum + item.statusCount, 0);
  const activityDatesByUser = new Map<string, string[]>();
  [...entries, ...statuses.map((item) => ({
    user_id: item.user_id,
    created_at: item.created_at
  }))].forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const current = activityDatesByUser.get(item.user_id) || [];
    if (!current.includes(date)) current.push(date);
    activityDatesByUser.set(item.user_id, current);
  });
  const topStreaks = Array.from(activityDatesByUser.entries())
    .map(([user_id, dates]) => {
      const sorted = [...dates].sort((a, b) => b.localeCompare(a));
      let longest = sorted.length ? 1 : 0;
      let running = sorted.length ? 1 : 0;
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = new Date(`${sorted[i - 1]}T00:00:00`);
        const current = new Date(`${sorted[i]}T00:00:00`);
        const diff = Math.round((previous.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
        if (diff === 1) {
          running += 1;
          longest = Math.max(longest, running);
        } else {
          running = 1;
        }
      }
      return {
        user_id,
        class_id: entries.find((entry) => entry.user_id === user_id)?.class_id || statuses.find((item) => item.user_id === user_id)?.class_id || null,
        currentStreak: longest,
        longestStreak: longest,
        activeDays: dates.length,
        totalBadges: 0
      };
    })
    .sort((a, b) => b.currentStreak - a.currentStreak || b.activeDays - a.activeDays)
    .slice(0, 8);

  return {
    metrics: {
      activeClasses: classes.length,
      bubbleUploads,
      communityUploads,
      totalUploads: bubbleUploads + communityUploads,
      activeUsers: new Set([
        ...entries.map((item) => item.user_id),
        ...statuses.map((item) => item.user_id)
      ]).size
    },
    achievements: {
      totalEvents: bubbleUploads + communityUploads,
      totalBadges: 0,
      usersWithBadges: 0,
      topCurrentStreak: topStreaks[0]?.currentStreak || 0,
      latestUnlocks: [],
      topStreaks
    },
    weeklyUsage,
    topUsers: {
      bubble: topBubble,
      community: topCommunity
    },
    classBreakdown: Array.from(classMap.values())
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
      .sort((a, b) => b.totalCount - a.totalCount),
    featureMix: [
      { name: '气泡反馈', value: bubbleUploads, color: '#FACC15' },
      { name: '情绪社区', value: communityUploads, color: '#3B82F6' }
    ]
  };
};

export const getConsoleHistory = (params?: { feature?: 'mood_bubble' | 'status_community' | 'all'; class_id?: string; limit?: number }): ConsoleHistoryItem[] => {
  const feature = params?.feature || 'all';
  const classId = params?.class_id;
  const limit = Math.max(20, Math.min(500, params?.limit || 200));

  const moodItems: ConsoleHistoryItem[] = getEntries()
    .filter((entry) => !classId || entry.class_id === classId)
    .filter(() => feature === 'all' || feature === 'mood_bubble')
    .map((entry) => ({
      id: `mood-${entry.id}`,
      feature: 'mood_bubble',
      user_id: entry.user_id,
      class_id: entry.class_id,
      created_at: entry.created_at,
      location: entry.location || null,
      emotion_label: entry.emotion_label,
      risk_level: entry.risk_level,
      content: entry.content
    }));

  const statusItems: ConsoleHistoryItem[] = getStatusFeed()
    .filter((item) => !classId || item.class_id === classId)
    .filter(() => feature === 'all' || feature === 'status_community')
    .map((item) => ({
      id: `status-${item.id}`,
      feature: 'status_community',
      user_id: item.user_id,
      class_id: item.class_id || 'Unassigned',
      created_at: item.created_at,
      status_key: item.status_key,
      custom_text: item.custom_text
    }));

  return [...moodItems, ...statusItems]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
};

export const BACKEND_CODE = {
  schemaSql: `Mock backend only`,
  workerJs: `Mock backend only`
};
