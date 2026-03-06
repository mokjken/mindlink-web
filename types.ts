import React from 'react';

export type Role = 'Student' | 'Teacher' | 'Admin';
export type RiskLevel = 'Normal' | 'High';
export type MoodCategory = 'Academic' | 'Social' | 'Family' | 'Health' | 'Future';

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