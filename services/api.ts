import { MoodEntry, StatPoint, Role, SafetyReport, PortalClass, ConsoleAnalytics, ConsoleHistoryItem, ActualPortalUserRow } from '../types';
import {
  saveEntry as mockSave,
  getTeacherClassStats as mockGetTeacherStats,
  getTeacherRadarData,
  getTeacherActivityVolume,
  getAdminHeatmap as mockGetAdminHeatmap,
  getAdminStackedData,
  getAdminRiskDist,
  getMoodHistory as mockGetMoodHistory,
  getStatus as mockGetStatus,
  setStatus as mockSetStatus,
  getStatusFeed as mockGetStatusFeed,
  getStatusFeedForUser as mockGetStatusFeedForUser,
  toggleStatusResonance as mockToggleStatusResonance,
  searchLogs as mockSearchLogs,
  getEntries as mockGetEntries,
  getPortalClasses as mockGetPortalClasses,
  addPortalClass as mockAddPortalClass,
  deletePortalClass as mockDeletePortalClass,
  getConsoleAnalytics as mockGetConsoleAnalytics,
  getConsoleHistory as mockGetConsoleHistory,
  consoleClearData as mockConsoleClearData,
  consoleInjectStatuses as mockConsoleInjectStatuses,
  consoleClearInjectedStatuses as mockConsoleClearInjectedStatuses,
  consoleBackupData as mockConsoleBackupData,
  getActualPortalUsers as mockGetActualPortalUsers,
  clearActualPortalUsers as mockClearActualPortalUsers,
  generateDemoData,
  clearDatabase
} from './mockBackend';
import { getPortalMode, getStudentUrlIdentity } from '../runtimeConfig';

const getWorkerUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return 'http://127.0.0.1:8787/api';
    }

    const portalMode = getPortalMode();
    if (portalMode === 'demo') {
      return 'https://demo-backend.mindlink.cloud/api';
    }
  }

  return 'https://backend.mindlink.cloud/api';
};

const WORKER_URL = getWorkerUrl();
const isLocalPreview = typeof window !== 'undefined' && ['127.0.0.1', 'localhost'].includes(window.location.hostname);
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const USE_MOCK = isLocalPreview && params?.get('live') !== '1' && params?.get('backend') !== 'live';
const DEMO_CLASS_ID = 'G7SP';
const DEMO_LANGUAGE_KEY = 'mindlink_demo_language';
const PORTAL_PASSWORD_KEYS = {
  teacher: 'mindlink_teacher_portal_password',
  admin: 'mindlink_admin_portal_password',
  console: 'mindlink_console_portal_password'
} as const;

const getDemoLanguage = () => {
  if (typeof window === 'undefined') return 'zh';
  if (getPortalMode() !== 'demo') return 'zh';
  return window.localStorage.getItem(DEMO_LANGUAGE_KEY) === 'en' ? 'en' : 'zh';
};

const isDemoEnglish = () => getDemoLanguage() === 'en';
const shouldRestoreAliases = () => {
  if (typeof window === 'undefined') return false;
  const portalMode = getPortalMode();
  return portalMode === 'teacher' || portalMode === 'admin' || portalMode === 'demo';
};

const generateDemoStudentId = () => '#' + Math.floor(1000 + Math.random() * 9000).toString();

const getRestrictedPortalMode = () => {
  const mode = getPortalMode();
  return mode === 'teacher' || mode === 'admin' || mode === 'console' ? mode : null;
};

const getStoredPortalPassword = () => {
  if (typeof window === 'undefined') return '';
  const portal = getRestrictedPortalMode();
  if (!portal) return '';
  return window.sessionStorage.getItem(PORTAL_PASSWORD_KEYS[portal]) || '';
};

export const setPortalPassword = (portal: 'teacher' | 'admin' | 'console', password: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(PORTAL_PASSWORD_KEYS[portal], password);
};

export const getPortalPassword = (portal: 'teacher' | 'admin' | 'console') => {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(PORTAL_PASSWORD_KEYS[portal]) || '';
};

export const clearPortalPassword = (portal: 'teacher' | 'admin' | 'console') => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PORTAL_PASSWORD_KEYS[portal]);
};

const authFetch = async (url: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  const password = getStoredPortalPassword();
  if (password) headers.set('x-portal-password', password);

  const res = await fetch(url, {
    ...init,
    headers
  });

  if (res.status === 401) {
    const portal = getRestrictedPortalMode();
    if (portal) clearPortalPassword(portal);
  }

  return res;
};

export const getStudentClassId = (): string => {
  if (typeof window === 'undefined') return DEMO_CLASS_ID;

  const portalMode = getPortalMode();
  const { classId } = getStudentUrlIdentity();

  if (classId) return classId;
  if (portalMode === 'student') return '';

  return localStorage.getItem('mindlink_class_id') || DEMO_CLASS_ID;
};

export const getStudentId = (): string => {
  if (typeof window === 'undefined') return 'Guest';

  const portalMode = getPortalMode();
  const { studentId } = getStudentUrlIdentity();

  if (studentId) return studentId;
  if (portalMode === 'student') return 'Guest';

  let id = localStorage.getItem('mindlink_student_id');
  if (!id) {
    id = generateDemoStudentId();
    localStorage.setItem('mindlink_student_id', id);
  }
  return id;
};

export const api = {
  auth: {
    verifyPortalPassword: async (portal: 'teacher' | 'admin' | 'console', password: string) => {
      if (USE_MOCK) return { success: Boolean(password.trim()) };
      const res = await fetch(`${WORKER_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal, password })
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error(json?.error || 'Portal auth failed');
        (error as any).payload = json;
        throw error;
      }
      return json;
    }
  },
  submitMood: async (data: { mood_score: number; emotion_label: string; mood_color: string; content: string; location?: string, class_id?: string; category?: string }) => {
    const user_id = getStudentId();
    const targetClass = data.class_id || getStudentClassId() || DEMO_CLASS_ID;
    const payload = { ...data, role: 'Student' as Role, user_id, class_id: targetClass };
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const allRows = mockGetEntries().filter((row) => row.user_id === user_id).sort((a, b) => b.created_at - a.created_at);
      const todayCount = allRows.filter((row) => row.created_at >= todayStart.getTime()).length;
      if (todayCount >= 6) {
        const error = new Error('今天的情绪反馈次数已达上限，请明天再来。');
        (error as any).payload = {
          error: 'TODAY_LIMIT_REACHED',
          message: '今天的情绪反馈次数已达上限，请明天再来。',
          today_upload_count: todayCount,
          daily_limit: 6
        };
        throw error;
      }
      const lastCreatedAt = allRows[0]?.created_at || 0;
      const cooldownMs = 30 * 60 * 1000;
      if (lastCreatedAt && now - lastCreatedAt < cooldownMs) {
        const retryAfterMs = cooldownMs - (now - lastCreatedAt);
        const error = new Error('两次提交至少需要间隔 30 分钟。');
        (error as any).payload = {
          error: 'COOLDOWN_ACTIVE',
          message: '两次提交至少需要间隔 30 分钟。',
          retry_after_ms: retryAfterMs,
          next_allowed_at: now + retryAfterMs,
          today_upload_count: todayCount,
          daily_limit: 6
        };
        throw error;
      }
      const entry = mockSave(payload);
      const todayRows = mockGetEntries()
        .filter((row) => row.class_id === targetClass && row.created_at >= todayStart.getTime());
      const myTodayCount = todayRows.filter((row) => row.user_id === user_id).length;
      const shareCountToday = new Set(todayRows.map((row) => row.user_id)).size;
      return {
        success: true,
        risk_level: entry.risk_level,
        today_upload_count: myTodayCount,
        daily_limit: 6,
        share_count_today: shareCountToday,
        cooldown_minutes: 30
      };
    }
    const res = await fetch(`${WORKER_URL}/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json?.message || json?.error || 'Submit failed');
      (error as any).payload = json;
      throw error;
    }
    return json;
  },

  getMoodHistory: async () => {
    const user_id = getStudentId();
    if (USE_MOCK) {
      return mockGetMoodHistory(user_id);
    }
    const res = await fetch(`${WORKER_URL}/student/history?user_id=${user_id}`);
    return res.json();
  },

  student: {
    getOnboarding: async () => {
      const user_id = getStudentId();
      const class_id = getStudentClassId() || DEMO_CLASS_ID;
      if (USE_MOCK) {
        const localKey = `mindlink_student_onboarding_${user_id}_${class_id}`;
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
        return raw
          ? JSON.parse(raw)
          : {
              user_id,
              class_id,
              portal_key: 'student',
              start_seen_at: null,
              guide_completed_at: null,
              updated_at: null
            };
      }
      const res = await fetch(`${WORKER_URL}/student/onboarding?user_id=${encodeURIComponent(user_id)}&class_id=${encodeURIComponent(class_id)}`);
      return res.json();
    },
    updateOnboarding: async (payload: { mark_start_seen?: boolean; mark_guide_completed?: boolean }) => {
      const user_id = getStudentId();
      const class_id = getStudentClassId() || DEMO_CLASS_ID;
      if (USE_MOCK) {
        const localKey = `mindlink_student_onboarding_${user_id}_${class_id}`;
        const previousRaw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
        const previous = previousRaw
          ? JSON.parse(previousRaw)
          : {
              user_id,
              class_id,
              portal_key: 'student',
              start_seen_at: null,
              guide_completed_at: null,
              updated_at: null
            };
        const next = {
          ...previous,
          start_seen_at: payload.mark_start_seen ? Date.now() : previous.start_seen_at,
          guide_completed_at: payload.mark_guide_completed ? Date.now() : previous.guide_completed_at,
          updated_at: Date.now()
        };
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(localKey, JSON.stringify(next));
        }
        return next;
      }
      const res = await fetch(`${WORKER_URL}/student/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          class_id,
          mark_start_seen: payload.mark_start_seen,
          mark_guide_completed: payload.mark_guide_completed
        })
      });
      return res.json();
    }
  },

  submitSafetyReport: async (data: { location: string; type: string; description: string }) => {
    if (USE_MOCK) { await new Promise(resolve => setTimeout(resolve, 800)); return { success: true }; }
    const res = await fetch(`${WORKER_URL}/safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  status: {
    get: async () => {
      const user_id = getStudentId();
      if (USE_MOCK) return mockGetStatus(user_id);
      const res = await fetch(`${WORKER_URL}/status?user_id=${encodeURIComponent(user_id)}`);
      return res.json();
    },
    set: async (statusKey: string, customText: string | null, colorHex: string, classId?: string) => {
      const user_id = getStudentId();
      const resolvedClassId = classId || getStudentClassId() || DEMO_CLASS_ID;
      if (USE_MOCK) {
        return mockSetStatus({
          user_id,
          class_id: resolvedClassId,
          status_key: statusKey,
          custom_text: customText,
          color_hex: colorHex
        });
      }
      const res = await fetch(`${WORKER_URL}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          class_id: resolvedClassId,
          status_key: statusKey,
          custom_text: customText,
          color_hex: colorHex
        })
      });
      return res.json();
    },
    getFeed: async () => {
      const user_id = getStudentId();
      const class_id = getStudentClassId() || DEMO_CLASS_ID;
      if (USE_MOCK) return mockGetStatusFeedForUser(user_id, class_id);
      const res = await fetch(`${WORKER_URL}/status/feed?viewer_user_id=${encodeURIComponent(user_id)}&class_id=${encodeURIComponent(class_id)}`);
      return res.json();
    },
    toggleResonance: async (statusId: number) => {
      const user_id = getStudentId();
      if (USE_MOCK) return mockToggleStatusResonance(statusId, user_id);
      const res = await fetch(`${WORKER_URL}/status/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id: statusId, user_id })
      });
      return res.json();
    }
  },

  teacher: {
    getClassStats: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return mockGetTeacherStats(classId);
      return (await authFetch(`${WORKER_URL}/teacher/class-stats?class_id=${classId}`)).json();
    },
    getRadarData: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return getTeacherRadarData(classId);
      return (await authFetch(`${WORKER_URL}/teacher/radar?class_id=${classId}`)).json();
    },
    getActivityVolume: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return getTeacherActivityVolume(classId);
      return (await authFetch(`${WORKER_URL}/teacher/activity?class_id=${classId}`)).json();
    }
  },

  ai: {
    getTeacherAdvice: async (classId: string, date?: string, force?: boolean) => {
      const englishDemo = isDemoEnglish();
      const restoreAliases = shouldRestoreAliases();
      if (USE_MOCK) {
        const day = date || new Date().toISOString().split('T')[0];
        const total = mockGetTeacherStats(classId).entries.length;
        return {
          id: Number(day.replaceAll('-', '') + '1'),
          advice: englishDemo
            ? `Class Snapshot\n${classId} currently has ${total} local demo records. Focus first on repeated low scores and visible fluctuations.\n\n1. Before the next class meeting, run a 3-minute anonymous mood check-in to confirm the class atmosphere.\n2. Arrange short break-time conversations for students who have shown repeated low scores, starting with rest, workload, and peer dynamics.\n3. If any high-risk entries appear today, ask the counselor to do a second review before escalating communication.\n4. Before dismissal, give the class one small achievable goal, such as finishing the smallest task first and then resting.`
            : `【班级概况】\n${classId} 当前共有 ${total} 条本地演示记录，建议老师优先关注低分与高频波动同学。\n\n1. 在下一节班会前用 3 分钟做一次匿名状态打卡，快速确认整体气压。\n2. 对最近连续低分的学生安排课间短聊，先问休息、作业和同伴关系。\n3. 若今日出现高风险记录，请先联系心理老师做二次判断，再决定是否升级沟通。\n4. 今天放学前给全班一个可执行的小目标，例如“先完成最小任务，再休息”。`,
          checked_indices: [],
          date: day,
          source: force ? 'refreshed' : 'generated',
          refreshed_at: Date.now()
        };
      }
      let url = `${WORKER_URL}/teacher/advice?class_id=${encodeURIComponent(classId)}`;
      if (date) url += `&date=${date}`;
      if (force) url += `&force=1`;
      if (englishDemo) url += `&lang=en`;
      if (restoreAliases) url += `&restore=1`;
      const res = await authFetch(url);
      return res.json();
    },
    getAdminAdvice: async (date?: string, force?: boolean) => {
      const englishDemo = isDemoEnglish();
      const restoreAliases = shouldRestoreAliases();
      if (USE_MOCK) {
        const day = date || new Date().toISOString().split('T')[0];
        const total = mockGetEntries().length;
        return {
          id: Number(day.replaceAll('-', '') + '2'),
          advice: englishDemo
            ? `School Snapshot\nThe local demo currently shows ${total} emotion records. Review the highest-risk locations first, then look for clustering across spaces.\n\n1. Check which area has the most high-risk entries today and see whether it relates to exams, events, or midday crowding.\n2. If one floor shows continuous negative clustering, ask the duty team to observe it during the next break.\n3. Share a list of classes with sharp emotional fluctuation this week, but only at the trend level and without raw student details.\n4. Prioritize environment adjustments in hotspot areas, such as flow redistribution, quiet corners, or temporary recovery zones.`
            : `【校级概况】\n当前本地演示环境共展示 ${total} 条情绪记录，建议先看高风险点位，再看空间聚集。\n\n1. 先查看今日高风险记录最多的区域，判断是否与考试、活动或午间拥挤有关。\n2. 若某一楼层连续出现负面聚集，请让值班老师在下一个课间做现场观察。\n3. 本周向班主任同步“情绪波动明显班级”名单，但只共享班级趋势，不共享学生原始细节。\n4. 对热点区域优先做环境优化，例如分流、安静角或临时休息点。`,
          checked_indices: [],
          date: day,
          source: force ? 'refreshed' : 'generated',
          refreshed_at: Date.now()
        };
      }
      let url = `${WORKER_URL}/admin/advice`;
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (force) params.append('force', '1');
      if (englishDemo) params.append('lang', 'en');
      if (restoreAliases) params.append('restore', '1');
      if (params.toString()) url += `?${params.toString()}`;
      const res = await authFetch(url);
      return res.json();
    },
    getHistory: async (role: 'Teacher' | 'Admin', scopeId: string) => {
      const englishDemo = isDemoEnglish();
      if (USE_MOCK) {
        const today = new Date();
        return [0, 1, 2].map((offset) => {
          const d = new Date(today);
          d.setDate(today.getDate() - offset);
          return d.toISOString().split('T')[0];
        });
      }
      let url = `${WORKER_URL}/advice/history?role=${role}&scope_id=${encodeURIComponent(scopeId)}`;
      if (englishDemo) url += `&lang=en`;
      const res = await authFetch(url);
      return res.json();
    },
    updateChecklist: async (id: number, checkedIndices: number[]) => {
      if (USE_MOCK) return;
      await authFetch(`${WORKER_URL}/advice/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, checked_indices: checkedIndices })
      });
    },
    getWeeklyReport: async (role: 'Teacher' | 'Admin', scopeId: string) => {
      const englishDemo = isDemoEnglish();
      const restoreAliases = shouldRestoreAliases();
      if (USE_MOCK) {
        const scopedEntries = role === 'Teacher'
          ? mockGetEntries().filter((entry) => entry.class_id === scopeId)
          : mockGetEntries();

        return {
          trend: [],
          composition: [],
          categoryStats: [],
          aiSummary: englishDemo
            ? `${role === 'Teacher' ? scopeId : 'School-wide'} weekly demo report is ready for layout and content-flow review.`
            : `${role === 'Teacher' ? scopeId : '全校'} 本地演示周报已生成，可用于检查面板布局与文本流。`,
          total: scopedEntries.length,
          risk: scopedEntries.filter((entry) => entry.risk_level === 'High').length
        };
      }
      const reportUrl = new URL(`${WORKER_URL}/report/weekly`);
      reportUrl.searchParams.set('role', role);
      reportUrl.searchParams.set('scope_id', scopeId);
      if (englishDemo) reportUrl.searchParams.set('lang', 'en');
      if (restoreAliases) reportUrl.searchParams.set('restore', '1');
      return (await authFetch(reportUrl.toString())).json();
    }
  },

  admin: {
    getStackedData: async () => {
      if (USE_MOCK) return getAdminStackedData();
      return (await authFetch(`${WORKER_URL}/admin/stacked-data`)).json();
    },
    getRiskDist: async () => {
      if (USE_MOCK) return getAdminRiskDist();
      return (await authFetch(`${WORKER_URL}/admin/risk-dist`)).json();
    },
    getHeatmap: async () => {
      if (USE_MOCK) return mockGetAdminHeatmap();
      return (await authFetch(`${WORKER_URL}/admin/heatmap`)).json();
    }
  },

  classes: {
    list: async (): Promise<PortalClass[]> => {
      if (USE_MOCK) return mockGetPortalClasses();
      return (await authFetch(`${WORKER_URL}/classes`)).json();
    },
    create: async (payload: { class_id: string; faculty: string; default_location?: string | null }) => {
      if (USE_MOCK) return mockAddPortalClass(payload);
      const res = await authFetch(`${WORKER_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    remove: async (classId: string) => {
      if (USE_MOCK) return mockDeletePortalClass(classId);
      const res = await authFetch(`${WORKER_URL}/classes/${encodeURIComponent(classId)}`, {
        method: 'DELETE'
      });
      return res.json();
    }
  },

  console: {
    getAnalytics: async (days = 7): Promise<ConsoleAnalytics> => {
      if (USE_MOCK) return mockGetConsoleAnalytics(days);
      return (await authFetch(`${WORKER_URL}/console/analytics?days=${days}`)).json();
    },
    getHistory: async (params?: { feature?: 'mood_bubble' | 'status_community' | 'all'; class_id?: string; limit?: number }): Promise<ConsoleHistoryItem[]> => {
      if (USE_MOCK) return mockGetConsoleHistory(params);
      const query = new URLSearchParams();
      if (params?.feature && params.feature !== 'all') query.append('feature', params.feature);
      if (params?.class_id) query.append('class_id', params.class_id);
      if (params?.limit) query.append('limit', String(params.limit));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return (await authFetch(`${WORKER_URL}/console/history${suffix}`)).json();
    },
    clearData: async (payload: { scope: 'all' | 'class'; class_id?: string }) => {
      if (USE_MOCK) return mockConsoleClearData(payload);
      const res = await authFetch(`${WORKER_URL}/console/manage/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    injectStatuses: async (payload: { scope: 'all' | 'class'; class_id?: string; count: number }) => {
      if (USE_MOCK) return mockConsoleInjectStatuses(payload);
      const res = await authFetch(`${WORKER_URL}/console/manage/inject-statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    clearInjectedStatuses: async (payload: { scope: 'all' | 'class'; class_id?: string }) => {
      if (USE_MOCK) return mockConsoleClearInjectedStatuses(payload);
      const res = await authFetch(`${WORKER_URL}/console/manage/clear-injected-statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    downloadBackup: async (params?: { scope?: 'all' | 'class'; class_id?: string }) => {
      if (USE_MOCK) return mockConsoleBackupData(params);
      const query = new URLSearchParams();
      if (params?.scope) query.append('scope', params.scope);
      if (params?.class_id) query.append('class_id', params.class_id);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const res = await authFetch(`${WORKER_URL}/console/manage/backup${suffix}`);
      return res.json();
    },
    getActualUsers: async (): Promise<ActualPortalUserRow[]> => {
      if (USE_MOCK) return mockGetActualPortalUsers();
      return (await authFetch(`${WORKER_URL}/console/actual-users`)).json();
    },
    clearActualUsers: async () => {
      if (USE_MOCK) return mockClearActualPortalUsers();
      const res = await authFetch(`${WORKER_URL}/console/manage/clear-actual-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    }
  },

  logs: {
    search: async (params: { q?: string; risk_level?: string; class_id?: string; start_date?: number; end_date?: number }) => {
      if (USE_MOCK) return mockSearchLogs(params);
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.risk_level) query.append('risk_level', params.risk_level);
      if (params.class_id) query.append('class_id', params.class_id);
      if (params.start_date) query.append('start_date', params.start_date.toString());
      if (params.end_date) query.append('end_date', params.end_date.toString());

      const res = await authFetch(`${WORKER_URL}/logs/search?${query.toString()}`);
      return res.json();
    }
  },

  export: {
    downloadXlsx: async (classId?: string) => {
      if (USE_MOCK) { alert("Simulating Download: mindlink_report.csv"); return; }
      const url = new URL(`${WORKER_URL}/export/csv`);
      if (classId) url.searchParams.append('class_id', classId);
      window.location.href = url.toString();
    },
    downloadPdfData: async () => {
      if (USE_MOCK) { alert("Simulating Download: mindlink_summary.json"); return; }
      window.location.href = `${WORKER_URL}/export/pdf-data`;
    }
  },

  demo: {
    generateData: async (count: number, targetClass?: string) => {
      if (USE_MOCK) return generateDemoData(count);
      return (await fetch(`${WORKER_URL}/demo/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count, target_class: targetClass }) })).json();
    },
    clearData: async () => {
      if (USE_MOCK) return clearDatabase();
      return (await fetch(`${WORKER_URL}/demo/clear`, { method: 'POST' })).json();
    }
  }
};
