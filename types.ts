import React from 'react';

export type Role = 'Student' | 'Teacher' | 'Admin';
export type RiskLevel = 'Normal' | 'High';
export type MoodCategory =
  | 'Academic'
  | 'Social'
  | 'Environment'
  | 'Health'
  | 'Future'
  | 'Unspecified'
  | '学业'
  | '社交'
  | '环境'
  | '健康'
  | '未来'
  | '未分类';

export interface MoodEntry {
  id: number;
  user_id: string;
  role: Role;
  class_id: string; 
  mood_score: number;
  emotion_label: string; 
  mood_color: string;
  content: string;
  location?: string;
  risk_level: RiskLevel;
  category: MoodCategory;
  created_at: number;
}

export interface HeatmapPoint {
  location: string;
  riskScore: number; // 0 to 1
  recentMoods: string[]; // Array of hex colors
}

export interface SafetyReport {
  id: number;
  type: string;
  location: string;
  description: string;
  status: 'Pending' | 'Resolved';
  created_at: number;
}

export interface StatPoint {
  date: string;
  averageScore: number;
  count: number;
}

export interface BackendFiles {
  schemaSql: string;
  workerJs: string;
}

export interface PortalClass {
  class_id: string;
  faculty: string;
  default_location?: string | null;
  sort_order?: number;
  is_active?: number;
  created_at?: number;
}

export interface UploadRankingRow {
  rank: number;
  user_id: string;
  class_id: string;
  count: number;
}

export interface ClassBreakdownRow {
  class_id: string;
  faculty: string;
  bubbleCount: number;
  communityCount: number;
  totalCount: number;
  highRiskCount: number;
  uniqueUsers: number;
}

export interface WeeklyUsagePoint {
  date: string;
  bubbleCount: number;
  statusCount: number;
  bubbleUsers: number;
  statusUsers: number;
}

export interface AchievementBadgeRow {
  user_id: string;
  class_id: string | null;
  badge_key: string;
  badge_name: string;
  badge_description: string;
  badge_tier: 'bronze' | 'silver' | 'gold';
  progress_value: number;
  unlocked_at: number;
}

export interface AchievementStreakRow {
  user_id: string;
  class_id: string | null;
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalBadges: number;
}

export interface ConsoleHistoryItem {
  id: string;
  feature: 'mood_bubble' | 'status_community';
  user_id: string;
  class_id: string;
  created_at: number;
  location?: string | null;
  emotion_label?: string | null;
  status_key?: string | null;
  custom_text?: string | null;
  risk_level?: string | null;
  content?: string | null;
}

export interface ActualPortalUserRow {
  user_id: string;
  class_id: string | null;
  portal_key: string;
  start_seen_at: number | null;
  guide_completed_at: number | null;
  updated_at: number | null;
}

export interface ConsoleAnalytics {
  metrics: {
    activeClasses: number;
    bubbleUploads: number;
    communityUploads: number;
    totalUploads: number;
    activeUsers: number;
  };
  achievements: {
    totalEvents: number;
    totalBadges: number;
    usersWithBadges: number;
    topCurrentStreak: number;
    latestUnlocks: AchievementBadgeRow[];
    topStreaks: AchievementStreakRow[];
  };
  weeklyUsage: WeeklyUsagePoint[];
  topUsers: {
    bubble: UploadRankingRow[];
    community: UploadRankingRow[];
  };
  classBreakdown: ClassBreakdownRow[];
  featureMix: Array<{ name: string; value: number; color: string }>;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // HTML
      div: any;
      header: any;
      span: any;
      nav: any;
      button: any;
      main: any;
      form: any;
      label: any;
      select: any;
      option: any;
      svg: any;
      path: any;
      textarea: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      pre: any;
      code: any;
      strong: any;
      ul: any;
      li: any;
      input: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      th: any;
      td: any;
      rect: any;
      g: any;
      text: any;
      circle: any;
      
      // React Three Fiber Elements
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshPhysicalMaterial: any;
      meshStandardMaterial: any;
      primitive: any;
      ambientLight: any;
      directionalLight: any;
    }
  }
}
