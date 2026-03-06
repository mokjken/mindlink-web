// Color Psychology Standard (Research Paper Compliance)
// Based on "14 Core Emotions Color Definition System"

export const PSYCH_COLORS = {
  // (一) Positive
  Happy: '#FFD700',      // Bright Yellow
  Satisfied: '#FFA07A',  // Warm Orange (Low Saturation)

  // (七) Calm / Relaxed
  Calm: '#E0FFFF',       // Pale Cyan
  Relaxed: '#98FF98',    // Light Mint Green

  // (二) Anger / Frustration
  Angry: '#B22222',      // Deep Vermilion
  Frustrated: '#CD5C5C', // Greyish Red

  // (三) Loss of Control / Confusion
  OutOfControl: '#FF4500', // High Saturation OrangeRed (Visual Overload)
  Confused: '#556B2F',     // Dark Olive Green (Camo/Chaos)

  // (四) Tension / Stress
  Tense: '#D87093',      // Pale Violet Red
  Stressed: '#191970',   // Dark Blue (Midnight)

  // (五) Melancholy / Sadness
  Melancholy: '#607B8B', // Blue Grey
  Sad: '#708090',        // Cold Grey

  // (六) Loneliness / Rejection
  Lonely: '#000000',     // Pure Black
  Rejected: '#8FBC8F',   // Dark Sea Green (Grey Green)
};

export interface EmotionDef {
  label: string;
  color: string;
  score: number;
  category: 'Positive' | 'Neutral' | 'Negative';
}

export const EMOTIONS: EmotionDef[] = [
  // Positive Group
  { label: 'Happy', color: PSYCH_COLORS.Happy, score: 5, category: 'Positive' },
  { label: 'Satisfied', color: PSYCH_COLORS.Satisfied, score: 4, category: 'Positive' },
  { label: 'Relaxed', color: PSYCH_COLORS.Relaxed, score: 4, category: 'Positive' },
  { label: 'Calm', color: PSYCH_COLORS.Calm, score: 3, category: 'Neutral' },

  // Negative Group (High Arousal)
  { label: 'Angry', color: PSYCH_COLORS.Angry, score: 1, category: 'Negative' },
  { label: 'Frustrated', color: PSYCH_COLORS.Frustrated, score: 2, category: 'Negative' },
  { label: 'Out of Control', color: PSYCH_COLORS.OutOfControl, score: 1, category: 'Negative' },
  { label: 'Tense', color: PSYCH_COLORS.Tense, score: 2, category: 'Negative' },

  // Negative Group (Confusion/Stress)
  { label: 'Confused', color: PSYCH_COLORS.Confused, score: 2, category: 'Negative' },
  { label: 'Stressed', color: PSYCH_COLORS.Stressed, score: 1, category: 'Negative' },

  // Negative Group (Low Arousal)
  { label: 'Melancholy', color: PSYCH_COLORS.Melancholy, score: 2, category: 'Negative' },
  { label: 'Sad', color: PSYCH_COLORS.Sad, score: 2, category: 'Negative' },
  { label: 'Lonely', color: PSYCH_COLORS.Lonely, score: 1, category: 'Negative' },
  { label: 'Rejected', color: PSYCH_COLORS.Rejected, score: 1, category: 'Negative' },
];