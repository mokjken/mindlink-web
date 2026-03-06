import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- TASK 1: Mood Universe Data (Single Source of Truth) ---
export interface MoodDef {
    id: string;
    label: string;
    color: string;
    category: 'positive' | 'calm' | 'anxious' | 'negative';
    floatSpeed: number;
    size: string; // Tailwind class
    score?: number; // Backend compatibility
}

export const MOODS: MoodDef[] = [
    // --- Positive (High Energy & Warmth) ---
    { id: 'happy', label: '开心', color: '#FCE205', category: 'positive', floatSpeed: 1.2, size: 'w-24 h-24', score: 5 },
    { id: 'satisfied', label: '满足', color: '#FFAB76', category: 'positive', floatSpeed: 1.0, size: 'w-20 h-20', score: 4 },
    { id: 'caring', label: '关爱', color: '#FFB7C5', category: 'positive', floatSpeed: 0.9, size: 'w-22 h-22', score: 5 },
    { id: 'moved', label: '感动', color: '#9370DB', category: 'positive', floatSpeed: 0.8, size: 'w-20 h-20', score: 4 },

    // --- Calm (Balance & Cool) ---
    { id: 'calm', label: '平静', color: '#E0FFFF', category: 'calm', floatSpeed: 0.5, size: 'w-18 h-18', score: 3 },
    { id: 'relaxed', label: '放松', color: '#98FF98', category: 'calm', floatSpeed: 0.6, size: 'w-20 h-20', score: 4 },
    { id: 'thinking', label: '沉思', color: '#B0C4DE', category: 'calm', floatSpeed: 0.4, size: 'w-16 h-16', score: 3 },

    // --- Anxious (Tension & Vibration) ---
    { id: 'nervous', label: '紧张', color: '#DB7093', category: 'anxious', floatSpeed: 1.5, size: 'w-18 h-18', score: 2 },
    { id: 'stressed', label: '压力', color: '#191970', category: 'anxious', floatSpeed: 0.2, size: 'w-24 h-24', score: 1 },
    { id: 'hesitant', label: '犹豫', color: '#967BB6', category: 'anxious', floatSpeed: 0.7, size: 'w-16 h-16', score: 2 },

    // --- Negative (Heavy & Deep) ---
    { id: 'angry', label: '愤怒', color: '#B22222', category: 'negative', floatSpeed: 1.8, size: 'w-24 h-24', score: 1 },
    { id: 'frustrated', label: '挫败', color: '#CD5C5C', category: 'negative', floatSpeed: 0.5, size: 'w-20 h-20', score: 2 },
    { id: 'depressed', label: '低落', color: '#778899', category: 'negative', floatSpeed: 0.3, size: 'w-22 h-22', score: 1 },
    { id: 'sad', label: '悲伤', color: '#708090', category: 'negative', floatSpeed: 0.2, size: 'w-20 h-20', score: 2 },
    { id: 'lonely', label: '孤独', color: '#1A1A1A', category: 'negative', floatSpeed: 0.1, size: 'w-16 h-16', score: 1 },
];

// --- TASK 2: MoodPlayground (Physics Cloud) ---
interface MoodPlaygroundProps {
    onSelect: (mood: MoodDef) => void;
    onQuickSubmit: (mood: MoodDef) => void;
    selectedMoodId?: string | null;
}

export const MoodPlayground: React.FC<MoodPlaygroundProps> = ({ onSelect, onQuickSubmit, selectedMoodId }) => {

    // Trace active long-press state
    const [pressingId, setPressingId] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState(0);
    const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = React.useRef<number>(0);
    const animationFrameRef = React.useRef<number | null>(null);

    // Memoize random positions
    const bubbles = useMemo(() => {
        return MOODS.map(mood => ({
            ...mood,
            initialX: Math.random() * 60 - 30,
            initialY: Math.random() * 60 - 30,
        }));
    }, []);

    const handlePressStart = (id: string, mood: MoodDef) => {
        setPressingId(id);
        setProgress(0);
        startTimeRef.current = Date.now();

        // Start progress animation
        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const p = Math.min((elapsed / 2000) * 100, 100); // 2s duration
            setProgress(p);

            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Completed
                handlePressEnd(true, mood);
            }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handlePressEnd = (completed: boolean, mood: MoodDef) => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setPressingId(null);
        setProgress(0);

        if (completed) {
            onQuickSubmit(mood);
        } else {
            // Only select if it was a short press (less than 2s and not cancelled)
            // But we need to distinguish between cancel (leave) and release (click)
            // For simplicity here, relying on the 'completed' flag from timer vs manual release
            // If manual release happened before 100%, we treat it as a click
        }
    };

    const handlePointerUp = (mood: MoodDef) => {
        if (pressingId === mood.id && progress < 100) {
            onSelect(mood);
        }
        handlePressEnd(false, mood);
    };

    return (
        <div className="relative w-full h-[50vh] flex flex-wrap items-center justify-center content-center gap-4 max-w-2xl mx-auto p-4">
            {bubbles.map((mood) => {
                const isSelected = selectedMoodId === mood.id;
                const isDimmed = selectedMoodId && !isSelected;
                const isPressing = pressingId === mood.id;

                return (
                    <motion.button
                        key={mood.id}
                        onPointerDown={(e) => {
                            e.preventDefault(); // Prevent text selection
                            handlePressStart(mood.id, mood);
                        }}
                        onPointerUp={() => handlePointerUp(mood)}
                        onPointerLeave={() => handlePressEnd(false, mood)}
                        onContextMenu={(e) => e.preventDefault()} // Prevent right click menu

                        layout
                        animate={{
                            y: [0, -20 / (mood.floatSpeed || 1), 0],
                            opacity: isDimmed ? 0.3 : 1,
                            scale: isSelected ? 1.5 : isPressing ? 1.2 : isDimmed ? 0.8 : 1,
                        }}
                        transition={{
                            y: {
                                duration: 3 / (mood.floatSpeed || 1),
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatType: "reverse"
                            },
                            layout: { type: "spring", bounce: 0.4 }
                        }}
                        whileHover={{ scale: isSelected ? 1.5 : 1.15, zIndex: 50 }}
                        className={`
                            ${mood.size} rounded-full flex items-center justify-center
                            relative cursor-pointer touch-none select-none
                            backdrop-blur-md border border-white/20
                            shadow-lg group
                        `}
                        style={{
                            backgroundColor: isSelected ? mood.color : `${mood.color}20`,
                            backgroundImage: `radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,0.4) 0%, ${mood.color}40 100%)`,
                            boxShadow: `0 8px 32px 0 ${mood.color}30`
                        }}
                    >
                        {/* Progress Ring (Only visible when pressing) */}
                        {isPressing && (
                            <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] rotate-[-90deg] pointer-events-none">
                                <circle
                                    cx="50%" cy="50%" r="48%"
                                    fill="none"
                                    stroke={mood.color}
                                    strokeWidth="4"
                                    strokeOpacity="0.3"
                                />
                                <circle
                                    cx="50%" cy="50%" r="48%"
                                    fill="none"
                                    stroke={mood.color}
                                    strokeWidth="4"
                                    strokeDasharray="300"
                                    strokeDashoffset={300 - (300 * progress) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}

                        {/* Highlight Reflection */}
                        <div className="absolute top-[15%] left-[15%] w-[25%] h-[15%] bg-white/40 blur-[2px] rounded-full rotate-[-45deg]" />

                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800/80'}`}>
                            {mood.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
};
