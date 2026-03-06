import { MoodEntry, StatPoint, Role, MoodCategory, HeatmapPoint } from '../types';
import { EMOTIONS, PSYCH_COLORS } from './constants';

// KEYWORD RISK ANALYSIS LOGIC
const RISK_KEYWORDS = ['die', 'hurt', 'pain', 'bullying', 'suicide', 'kill', 'hopeless', 'blood', 'bomb'];
const CATEGORIES: MoodCategory[] = ['Academic', 'Social', 'Family', 'Health', 'Future'];

const analyzeRisk = (content: string): 'Normal' | 'High' => {
  const lowerContent = content.toLowerCase();
  return RISK_KEYWORDS.some(word => lowerContent.includes(word)) ? 'High' : 'Normal';
};

// SIMULATED D1 DATABASE (localStorage)
const DB_KEY = 'mindlink_db_entries';

const VALID_LOCATIONS = [
  'AQ1', 'AQ2', 'AQ3', 'AQ4', 
  'ElectricityBuilding', 'SideBuilding', 
  'GirlDorm', 'BoyDorm', 
  'Canteen', 'SwimmingPool', 
  'DormAB', 'DormCD',
  'AdministrationBuilding', 'Gymnasium', 'BasketballCourt'
];

const VALID_CLASSES = ['3-A', '3-B', '2-A', '1-C'];

export const getEntries = (): MoodEntry[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntry = (data: Omit<MoodEntry, 'id' | 'created_at' | 'risk_level' | 'class_id' | 'category'>): MoodEntry => {
  const entries = getEntries();
  
  // Simple heuristic to guess category if not provided
  const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const newEntry: MoodEntry = {
    ...data,
    id: Date.now() + Math.random(),
    created_at: Date.now(),
    class_id: '3-A', 
    risk_level: analyzeRisk(data.content),
    category: randomCategory
  };

  const updatedEntries = [newEntry, ...entries];
  localStorage.setItem(DB_KEY, JSON.stringify(updatedEntries));
  return newEntry;
};

// --- TEACHER AGGREGATORS ---

export const getTeacherRadarData = (classId: string) => {
  const entries = getEntries().filter(e => e.class_id === classId);
  return CATEGORIES.map(cat => {
    const catEntries = entries.filter(e => e.category === cat);
    const avgScore = catEntries.length 
      ? catEntries.reduce((sum, e) => sum + e.mood_score, 0) / catEntries.length 
      : 3; // Default neutral
    // Normalize 1-5 score to 0-100 for Radar Chart aesthetics
    return {
      subject: cat,
      A: Math.round((avgScore / 5) * 100),
      fullMark: 100
    };
  });
};

export const getTeacherActivityVolume = (classId: string) => {
  const entries = getEntries().filter(e => e.class_id === classId);
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString();
  }).reverse();

  return last7Days.map(date => {
    const count = entries.filter(e => new Date(e.created_at).toLocaleDateString() === date).length;
    return { date: date.split('/')[1] + '/' + date.split('/')[2], count }; // MM/DD format
  });
};

// --- ADMIN AGGREGATORS ---

export const getAdminStackedData = () => {
  const entries = getEntries();
  // Group by Location -> Then by Emotion Category
  // Simplified to: Positive (4-5), Neutral (3), Negative (1-2), Risk (High Risk flag)
  
  const locationMap: Record<string, { name: string, Positive: number, Neutral: number, Negative: number, Risk: number }> = {};
  
  VALID_LOCATIONS.forEach(loc => {
    locationMap[loc] = { name: loc, Positive: 0, Neutral: 0, Negative: 0, Risk: 0 };
  });

  entries.forEach(e => {
    if (!e.location || !locationMap[e.location]) return;
    
    if (e.risk_level === 'High') {
      locationMap[e.location].Risk += 1;
    } else if (e.mood_score >= 4) {
      locationMap[e.location].Positive += 1;
    } else if (e.mood_score === 3) {
      locationMap[e.location].Neutral += 1;
    } else {
      locationMap[e.location].Negative += 1;
    }
  });

  return Object.values(locationMap).filter(l => (l.Positive + l.Neutral + l.Negative + l.Risk) > 0);
};

export const getAdminRiskDist = () => {
  const entries = getEntries();
  const total = entries.length;
  if (total === 0) return [];

  const high = entries.filter(e => e.risk_level === 'High').length;
  const medium = entries.filter(e => e.risk_level === 'Normal' && e.mood_score <= 2).length;
  const low = total - high - medium;

  return [
    { name: 'Low Risk', value: low, color: '#10b981' }, // Emerald
    { name: 'Medium Risk', value: medium, color: '#f59e0b' }, // Amber
    { name: 'High Risk', value: high, color: '#ef4444' }, // Red
  ];
};

export const getAdminHeatmap = (): HeatmapPoint[] => {
  const entries = getEntries();
  const locationStats: Record<string, { highRisk: number; total: number; moods: string[] }> = {};

  entries.forEach(e => {
    if (!e.location) return;
    if (!locationStats[e.location]) locationStats[e.location] = { highRisk: 0, total: 0, moods: [] };
    
    locationStats[e.location].total += 1;
    locationStats[e.location].moods.push(e.mood_color);
    if (e.risk_level === 'High') {
      locationStats[e.location].highRisk += 1;
    }
  });

  return Object.keys(locationStats).map(location => {
    const stats = locationStats[location];
    // Risk Score: Simple ratio of high risk to total, normalized loosely
    // Capping at 1.0. If 20% of entries are high risk, we consider that VERY high (score 1.0)
    const rawRatio = stats.highRisk / stats.total;
    const riskScore = Math.min(rawRatio * 5, 1); 

    return {
      location,
      riskScore,
      recentMoods: stats.moods.slice(-30) // Limit to last 30 particles per building
    };
  });
};

// --- EXISTING HELPERS ---
export const getTeacherClassStats = (classId: string) => {
  const entries = getEntries().filter(e => e.class_id === classId);
  return {
    entries: entries.slice(0, 50),
    highRisk: entries.filter(e => e.risk_level === 'High'),
    distribution: EMOTIONS.map(e => ({
      name: e.label,
      value: entries.filter(entry => entry.emotion_label === e.label).length,
      color: e.color
    })).filter(d => d.value > 0)
  };
};

export const getTeacherTrends = (classId: string): StatPoint[] => {
  const entries = getEntries().filter(e => e.class_id === classId);
  const grouped: Record<string, { total: number; count: number }> = {};
  entries.forEach(entry => {
    const date = new Date(entry.created_at).toLocaleDateString();
    if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
    grouped[date].total += entry.mood_score;
    grouped[date].count += 1;
  });
  return Object.keys(grouped).map(date => ({
    date,
    averageScore: parseFloat((grouped[date].total / grouped[date].count).toFixed(1)),
    count: grouped[date].count
  })).reverse().slice(-7); 
};

export const getAdminRegionalStats = () => {
   // Re-implement if needed, but stacked bar replaces this mostly
   return []; 
};

// --- DEMO TOOLS ---

export const clearDatabase = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DB_KEY);
    // Also remove the student ID to fully reset the user session state
    localStorage.removeItem('mindlink_student_id');
  }
};

export const generateDemoData = (count: number) => {
  const currentEntries = getEntries();
  const newEntries: MoodEntry[] = [];
  
  const contents = [
    "I love the new science project!",
    "Math is getting really hard.",
    "Someone took my lunch today.",
    "Feeling okay, just tired.",
    "I'm so happy about the field trip!",
    "I don't want to come to school tomorrow.",
    "My cat died and I'm sad.",
    "The teacher helped me a lot.",
    "I feel invisible.",
    "Can we have more recess?"
  ];

  for (let i = 0; i < count; i++) {
    const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    const randomContent = contents[Math.floor(Math.random() * contents.length)];
    const isRisk = Math.random() > 0.9; // 10% chance
    const randomLocation = VALID_LOCATIONS[Math.floor(Math.random() * VALID_LOCATIONS.length)];
    const randomClass = VALID_CLASSES[Math.floor(Math.random() * VALID_CLASSES.length)];
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // 7 days
    
    newEntries.push({
      id: Date.now() + i,
      user_id: '#' + Math.floor(1000 + Math.random() * 9000),
      role: 'Student' as Role,
      class_id: randomClass,
      mood_score: randomEmotion.score,
      emotion_label: randomEmotion.label,
      mood_color: randomEmotion.color,
      content: isRisk ? "I want to hurt myself" : randomContent,
      location: randomLocation,
      risk_level: isRisk ? 'High' : analyzeRisk(randomContent),
      category: randomCategory,
      created_at: Date.now() - timeOffset
    });
  }

  localStorage.setItem(DB_KEY, JSON.stringify([...newEntries, ...currentEntries]));
};

export const BACKEND_CODE = {
  schemaSql: `... (Updated schema to include category column) ...`,
  workerJs: `... (Updated worker to handle aggregations) ...`
};