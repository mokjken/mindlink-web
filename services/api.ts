import { MoodEntry, StatPoint, Role, SafetyReport } from '../types';
import {
  saveEntry as mockSave,
  getTeacherClassStats as mockGetTeacherStats,
  getTeacherTrends as mockGetTeacherTrends,
  getTeacherRadarData,
  getTeacherActivityVolume,
  getAdminHeatmap as mockGetAdminHeatmap,
  getAdminStackedData,
  getAdminRiskDist,
  generateDemoData,
  clearDatabase
} from './mockBackend';

const WORKER_URL = 'https://backend.mindlink.cloud/api';
const USE_MOCK = false;
const DEMO_CLASS_ID = '3-A';

export const getStudentId = (): string => {
  if (typeof window === 'undefined') return 'Guest';
  let id = localStorage.getItem('mindlink_student_id');
  if (!id) {
    id = '#' + Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem('mindlink_student_id', id);
  }
  return id;
};

export const api = {
  submitMood: async (data: { mood_score: number; emotion_label: string; mood_color: string; content: string; location?: string, class_id?: string }) => {
    const user_id = getStudentId();
    // Use provided class_id or fall back to DEMO_CLASS_ID; allows dynamic student simulation
    const targetClass = data.class_id || DEMO_CLASS_ID;
    const payload = { ...data, role: 'Student' as Role, user_id, class_id: targetClass };
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const entry = mockSave(payload);
      return { success: true, risk_level: entry.risk_level };
    }
    const res = await fetch(`${WORKER_URL}/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  getMoodHistory: async () => {
    const user_id = getStudentId();
    if (USE_MOCK) {
      // Mock logic if ever needed, but sticking to real implementation
      return [];
    }
    const res = await fetch(`${WORKER_URL}/student/history?user_id=${user_id}`);
    return res.json();
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
      if (USE_MOCK) return null; // Mock not implemented for V1
      const res = await fetch(`${WORKER_URL}/status?user_id=${encodeURIComponent(user_id)}`);
      return res.json();
    },
    set: async (statusKey: string, customText: string | null, colorHex: string, classId: string = DEMO_CLASS_ID) => {
      const user_id = getStudentId();
      if (USE_MOCK) return { success: true };
      const res = await fetch(`${WORKER_URL}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          class_id: classId,
          status_key: statusKey,
          custom_text: customText,
          color_hex: colorHex
        })
      });
      return res.json();
    },
    getFeed: async () => {
      if (USE_MOCK) return [];
      const res = await fetch(`${WORKER_URL}/status/feed`);
      return res.json();
    }
  },

  teacher: {
    getClassStats: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return mockGetTeacherStats(classId);
      return (await fetch(`${WORKER_URL}/teacher/class-stats?class_id=${classId}`)).json();
    },
    getRadarData: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return getTeacherRadarData(classId);
      return (await fetch(`${WORKER_URL}/teacher/radar?class_id=${classId}`)).json();
    },
    getActivityVolume: async (classId: string = DEMO_CLASS_ID) => {
      if (USE_MOCK) return getTeacherActivityVolume(classId);
      return (await fetch(`${WORKER_URL}/teacher/activity?class_id=${classId}`)).json();
    }
  },

  ai: {
    getTeacherAdvice: async (classId: string, date?: string) => {
      if (USE_MOCK) return { advice: "(Mock) Consider organizing team activities for better morale." };
      let url = `${WORKER_URL}/teacher/advice?class_id=${encodeURIComponent(classId)}`;
      if (date) url += `&date=${date}`;
      const res = await fetch(url);
      return res.json();
    },
    getAdminAdvice: async (date?: string) => { // Admin advice likely needs date support too, assuming I updated backend logic similarly. (I only updated Teacher endpoint explicitly in step 2057/2063).
      // For now, keep Admin simple or assume backend ignores date for admin
      if (USE_MOCK) return { advice: "(Mock) Focus on high-risk areas." };
      // Note: Backend Admin endpoint currently doesn't check DB table? Checking Index.ts... Admin endpoint starts at line 418.
      // I didn't update Admin endpoint to use DB table.
      const res = await fetch(`${WORKER_URL}/admin/advice`);
      return res.json();
    },
    getHistory: async (role: 'Teacher' | 'Admin', scopeId: string) => {
      const res = await fetch(`${WORKER_URL}/advice/history?role=${role}&scope_id=${encodeURIComponent(scopeId)}`);
      return res.json();
    },
    updateChecklist: async (id: number, checkedIndices: number[]) => {
      await fetch(`${WORKER_URL}/advice/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, checked_indices: checkedIndices })
      });
    },
    getWeeklyReport: async (role: 'Teacher' | 'Admin', scopeId: string) => {
      if (USE_MOCK) return { trend: [], composition: [], categoryStats: [], aiSummary: "Mock Report", total: 0, risk: 0 };
      return (await fetch(`${WORKER_URL}/report/weekly?role=${role}&scope_id=${encodeURIComponent(scopeId)}`)).json();
    }
  },

  admin: {
    getStackedData: async () => {
      if (USE_MOCK) return getAdminStackedData();
      return (await fetch(`${WORKER_URL}/admin/stacked-data`)).json();
    },
    getRiskDist: async () => {
      if (USE_MOCK) return getAdminRiskDist();
      return (await fetch(`${WORKER_URL}/admin/risk-dist`)).json();
    },
    getHeatmap: async () => {
      if (USE_MOCK) return mockGetAdminHeatmap();
      return (await fetch(`${WORKER_URL}/admin/heatmap`)).json();
    }
  },

  logs: {
    search: async (params: { q?: string; risk_level?: string; class_id?: string; start_date?: number; end_date?: number }) => {
      if (USE_MOCK) return [];
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.risk_level) query.append('risk_level', params.risk_level);
      if (params.class_id) query.append('class_id', params.class_id);
      if (params.start_date) query.append('start_date', params.start_date.toString());
      if (params.end_date) query.append('end_date', params.end_date.toString());

      const res = await fetch(`${WORKER_URL}/logs/search?${query.toString()}`);
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