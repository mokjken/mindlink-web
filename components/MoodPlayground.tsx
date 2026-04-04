import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDemoI18n } from './DemoLanguageContext';
import { getPortalMode } from '../runtimeConfig';

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

export interface MoodCategoryChoice {
    id: 'Academic' | 'Social' | 'Environment' | 'Health' | 'Future';
    label: string;
    shortLabel: string;
    accent: string;
    angle: number;
}

export const MOOD_CATEGORY_CHOICES: MoodCategoryChoice[] = [
    { id: 'Academic', label: '学习任务', shortLabel: '学习', accent: '#2563EB', angle: -90 },
    { id: 'Social', label: '同伴互动', shortLabel: '同伴', accent: '#14B8A6', angle: -18 },
    { id: 'Environment', label: '校园环境', shortLabel: '环境', accent: '#F59E0B', angle: 54 },
    { id: 'Health', label: '身心状态', shortLabel: '状态', accent: '#EC4899', angle: 126 },
    { id: 'Future', label: '目标压力', shortLabel: '目标', accent: '#8B5CF6', angle: 198 },
];

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

const MOOD_LABELS_EN: Record<string, string> = {
    happy: 'Happy',
    satisfied: 'Content',
    caring: 'Caring',
    moved: 'Moved',
    calm: 'Calm',
    relaxed: 'Relaxed',
    thinking: 'Thoughtful',
    nervous: 'Nervous',
    stressed: 'Stressed',
    hesitant: 'Hesitant',
    angry: 'Angry',
    frustrated: 'Frustrated',
    depressed: 'Down',
    sad: 'Sad',
    lonely: 'Lonely',
};

const CATEGORY_SHORT_EN: Record<MoodCategoryChoice['id'], string> = {
    Academic: 'Study',
    Social: 'Peers',
    Environment: 'Space',
    Health: 'Health',
    Future: 'Goals',
};

const getBubbleLabelClass = (size: string) => {
    if (size.includes('w-24') || size.includes('w-22')) return 'text-[13px] md:text-[14px]';
    if (size.includes('w-20')) return 'text-[12px] md:text-[13px]';
    return 'text-[11px] md:text-[12px]';
};

const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians),
    };
};

const describeRingSector = (
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
) => {
    const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
    const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
    ].join(' ');
};

const RING_RENDER_CHOICES = MOOD_CATEGORY_CHOICES.map((option) => ({
    ...option,
    startAngle: option.angle - 27,
    endAngle: option.angle + 27,
    labelPoint: polarToCartesian(120, 120, 97, option.angle),
}));

type BubbleItemProps = {
    index: number;
    mood: MoodDef;
    isSelected: boolean;
    isDimmed: boolean | null;
    isPressing: boolean;
    ringExpanded: boolean;
    activeQuickCategory: MoodCategoryChoice['id'] | null;
    progressCircleRef: React.RefObject<SVGCircleElement | null>;
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, mood: MoodDef) => void;
    onPointerMove: (event: React.PointerEvent<HTMLButtonElement>, mood: MoodDef) => void;
    onPointerUp: (mood: MoodDef) => void;
    onPointerCancel: (mood: MoodDef) => void;
    guidePreviewRing?: boolean;
};

const BubbleItem = React.memo(({
    index,
    mood,
    isSelected,
    isDimmed,
    isPressing,
    ringExpanded,
    activeQuickCategory,
    progressCircleRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    guidePreviewRing = false,
}: BubbleItemProps) => {
    const { isEnglish } = useDemoI18n();
    const isStudentPortal = getPortalMode() === 'student';
    const showGuidePreview = guidePreviewRing && !isPressing;
    const floatDistance = isStudentPortal
        ? Math.max(4, Math.round(7 / Math.max(mood.floatSpeed, 0.55)))
        : Math.max(6, Math.round(10 / Math.max(mood.floatSpeed, 0.45)));
    const floatDuration = (6.4 / Math.max(mood.floatSpeed, 0.45)).toFixed(2);
    const floatDelay = `${((mood.floatSpeed * 0.37) % 1.2).toFixed(2)}s`;
    const opacity = isDimmed ? 0.3 : 1;
    const scale = isSelected ? 1.42 : isPressing ? 1.12 : isDimmed ? 0.86 : 1;
    const shouldIdleFloat = !isSelected && !isPressing && (
        !isStudentPortal || mood.size.includes('w-24') || index % 2 === 0
    );
    const bubbleContent = (
        <>
            {(isPressing || showGuidePreview) && (
                <>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.84 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-1/2 top-1/2 h-[186%] w-[186%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/16 bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.03)_44%,transparent_72%)] pointer-events-none"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.72 }}
                        animate={{ opacity: (isPressing ? ringExpanded : showGuidePreview) ? 1 : 0, scale: (isPressing ? ringExpanded : showGuidePreview) ? 1 : 0.78 }}
                        transition={showGuidePreview ? { duration: 0.35, ease: 'easeOut' } : undefined}
                        className="absolute left-1/2 top-1/2 h-[224%] w-[224%] -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform"
                    >
                        <svg
                            viewBox="0 0 240 240"
                            className="h-full w-full overflow-visible"
                        >
                            <defs>
                                <radialGradient id={`ringHalo-${mood.id}`} cx="50%" cy="50%" r="58%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                                    <stop offset="64%" stopColor="rgba(255,255,255,0.05)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                </radialGradient>
                            </defs>
                            <circle
                                cx={120}
                                cy={120}
                                r={112}
                                fill={`url(#ringHalo-${mood.id})`}
                            />
                            <circle
                                cx={120}
                                cy={120}
                                r={97}
                                fill="none"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth={26}
                            />
                            {RING_RENDER_CHOICES.map((option) => {
                                const isActiveOption = activeQuickCategory === option.id;
                                return (
                                    <path
                                        key={option.id}
                                        d={describeRingSector(
                                            120,
                                            120,
                                            84,
                                            110,
                                            option.startAngle,
                                            option.endAngle
                                        )}
                                        fill={isActiveOption ? `${option.accent}C8` : showGuidePreview ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.32)'}
                                        stroke={isActiveOption ? 'rgba(255,255,255,0.82)' : showGuidePreview ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.28)'}
                                        strokeWidth={isActiveOption ? 2 : showGuidePreview ? 1.2 : 1}
                                    />
                                );
                            })}
                        </svg>

                        {RING_RENDER_CHOICES.map((option) => {
                            const isActiveOption = activeQuickCategory === option.id;

                            return (
                                <div
                                    key={`${option.id}-label`}
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: `${(option.labelPoint.x / 240) * 100}%`,
                                        top: `${(option.labelPoint.y / 240) * 100}%`,
                                        transform: `translate(-50%, -50%) scale(${isActiveOption ? 1.04 : 1})`,
                                        opacity: (isPressing ? ringExpanded : showGuidePreview) ? 1 : 0,
                                        transition: 'transform 180ms ease, opacity 160ms ease',
                                    }}
                                >
                                    <div
                                        className={`min-w-[42px] rounded-full px-2.5 py-1 text-center transition-all ${
                                            isActiveOption
                                                ? 'text-white shadow-[0_8px_18px_rgba(15,23,42,0.2)]'
                                                : showGuidePreview
                                                    ? 'text-slate-700/95 shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                                                    : 'text-slate-600/90'
                                        }`}
                                        style={{
                                            background: isActiveOption
                                                ? `linear-gradient(135deg, ${option.accent}, rgba(15,23,42,0.86))`
                                                : showGuidePreview
                                                    ? 'rgba(255,255,255,0.78)'
                                                    : 'rgba(255,255,255,0.14)',
                                            border: isActiveOption
                                                ? '1px solid rgba(255,255,255,0.78)'
                                                : showGuidePreview
                                                    ? '1px solid rgba(255,255,255,0.72)'
                                                    : '1px solid rgba(255,255,255,0.18)',
                                        }}
                                        >
                                        <div className={`whitespace-nowrap text-[10px] font-medium tracking-[0.08em] ${isActiveOption ? 'text-white/82' : 'text-slate-500/95'}`}>
                                            {isEnglish ? CATEGORY_SHORT_EN[option.id] : option.shortLabel}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </>
            )}

            {isPressing && (
                <svg className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] rotate-[-90deg] pointer-events-none z-10 drop-shadow-[0_4px_10px_rgba(255,255,255,0.55)]">
                    <circle
                        cx="50%" cy="50%" r="48%"
                        fill="none"
                        stroke="rgba(255,255,255,0.34)"
                        strokeWidth="3.5"
                    />
                    <circle
                        cx="50%" cy="50%" r="48%"
                        fill="none"
                        stroke="rgba(15,23,42,0.72)"
                        strokeWidth="3.5"
                        strokeDasharray="300"
                        strokeDashoffset={300}
                        strokeLinecap="round"
                        ref={progressCircleRef}
                    />
                </svg>
            )}

            <div className="absolute top-[14%] left-[16%] w-[28%] h-[16%] bg-white/46 blur-[1.5px] rounded-full rotate-[-45deg] pointer-events-none" />
            <div className="absolute inset-[11%] rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

            <span
                className={`${getBubbleLabelClass(mood.size)} font-medium leading-none tracking-[-0.03em] ${isSelected ? 'text-white' : 'text-slate-800/84'}`}
                style={{ textShadow: isSelected ? '0 1px 6px rgba(15,23,42,0.18)' : '0 1px 0 rgba(255,255,255,0.18)' }}
            >
                {isEnglish ? MOOD_LABELS_EN[mood.id] || mood.label : mood.label}
            </span>
        </>
    );

    if (isStudentPortal) {
        return (
            <button
                type="button"
                onPointerDown={(event) => {
                    event.preventDefault();
                    onPointerDown(event, mood);
                }}
                onPointerMove={(event) => onPointerMove(event, mood)}
                onPointerUp={() => onPointerUp(mood)}
                onPointerCancel={() => onPointerCancel(mood)}
                onContextMenu={(e) => e.preventDefault()}
                className={`
                    ${mood.size} rounded-full flex items-center justify-center
                    relative cursor-pointer touch-none select-none
                    border border-white/18
                    transition-[transform,opacity,box-shadow,background-image] duration-200 ease-out
                    transform-gpu group z-10
                `}
                style={{
                    opacity,
                    transform: `translate3d(0, 0, 0) scale(${scale})`,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    zIndex: isSelected ? 50 : 10,
                    backgroundColor: isSelected ? mood.color : `${mood.color}16`,
                    backgroundImage: isSelected
                        ? `radial-gradient(136% 136% at 28% 20%, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0.18) 26%, ${mood.color} 100%)`
                        : `radial-gradient(136% 136% at 28% 20%, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.24) 28%, ${mood.color}26 100%)`,
                    boxShadow: isSelected
                        ? `0 22px 40px ${mood.color}40, inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -8px 18px rgba(255,255,255,0.08)`
                        : `0 8px 14px ${mood.color}14, inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -4px 9px rgba(255,255,255,0.04)`,
                    animation: shouldIdleFloat ? `mindlink-float ${floatDuration}s ease-in-out ${floatDelay} infinite alternate` : 'none',
                    ['--mindlink-float-distance' as string]: `-${floatDistance}px`,
                }}
            >
                {bubbleContent}
            </button>
        );
    }

    return (
        <motion.button
            onPointerDown={(event) => {
                event.preventDefault();
                onPointerDown(event, mood);
            }}
            onPointerMove={(event) => onPointerMove(event, mood)}
            onPointerUp={() => onPointerUp(mood)}
            onPointerCancel={() => onPointerCancel(mood)}
            onContextMenu={(e) => e.preventDefault()}
            animate={{
                opacity,
                scale,
            }}
            whileHover={{ scale: isSelected ? 1.42 : 1.1, zIndex: 50 }}
            className={`
                ${mood.size} rounded-full flex items-center justify-center
                relative cursor-pointer touch-none select-none
                ${isStudentPortal ? '' : 'backdrop-blur-md'} border border-white/18
                shadow-[0_14px_28px_rgba(15,23,42,0.08)]
                transform-gpu
                group z-10
            `}
            style={{
                backgroundColor: isSelected ? mood.color : `${mood.color}16`,
                backgroundImage: isSelected
                    ? `radial-gradient(136% 136% at 28% 20%, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0.18) 26%, ${mood.color} 100%)`
                    : `radial-gradient(136% 136% at 28% 20%, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.24) 28%, ${mood.color}26 100%)`,
                boxShadow: isSelected
                    ? `0 22px 40px ${mood.color}40, inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -8px 18px rgba(255,255,255,0.08)`
                    : isStudentPortal
                        ? `0 10px 18px ${mood.color}16, inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -5px 10px rgba(255,255,255,0.04)`
                        : `0 12px 24px ${mood.color}1d, inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -6px 14px rgba(255,255,255,0.05)`,
                animation: shouldIdleFloat ? `mindlink-float ${floatDuration}s ease-in-out ${floatDelay} infinite alternate` : 'none',
                ['--mindlink-float-distance' as string]: `-${floatDistance}px`,
            }}
        >
            {bubbleContent}
        </motion.button>
    );
});

// --- TASK 2: MoodPlayground (Physics Cloud) ---
interface MoodPlaygroundProps {
    onSelect: (mood: MoodDef) => void;
    onQuickSubmit: (mood: MoodDef, categoryId?: MoodCategoryChoice['id']) => void;
    selectedMoodId?: string | null;
    className?: string;
    guidePreviewBubbleId?: string | null;
    showGuideRingPreview?: boolean;
}

export const MoodPlayground: React.FC<MoodPlaygroundProps> = ({
    onSelect,
    onQuickSubmit,
    selectedMoodId,
    className = '',
    guidePreviewBubbleId = null,
    showGuideRingPreview = false
}) => {
    const [pressingId, setPressingId] = React.useState<string | null>(null);
    const [ringExpanded, setRingExpanded] = React.useState(false);
    const startTimeRef = React.useRef<number>(0);
    const lastProgressRef = React.useRef<number>(0);
    const animationFrameRef = React.useRef<number | null>(null);
    const progressCircleRef = React.useRef<SVGCircleElement | null>(null);
    const ringExpandedRef = React.useRef(false);
    const [activeQuickCategory, setActiveQuickCategory] = React.useState<MoodCategoryChoice['id'] | null>(null);
    const activeQuickCategoryRef = React.useRef<MoodCategoryChoice['id'] | null>(null);

    const syncQuickCategory = useCallback((value: MoodCategoryChoice['id'] | null) => {
        if (activeQuickCategoryRef.current === value) return;
        activeQuickCategoryRef.current = value;
        setActiveQuickCategory(value);
    }, []);

    const angleDistance = (a: number, b: number) => {
        const diff = Math.abs(a - b) % 360;
        return diff > 180 ? 360 - diff : diff;
    };

    const getQuickCategoryFromPointer = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < rect.width * 0.6 || lastProgressRef.current < 16) {
            return null;
        }

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return MOOD_CATEGORY_CHOICES.reduce((closest, option) => {
            if (!closest) return option;
            return angleDistance(angle, option.angle) < angleDistance(angle, closest.angle) ? option : closest;
        }, null as MoodCategoryChoice | null)?.id || null;
    }, []);

    const handlePressEnd = useCallback((completed: boolean, mood: MoodDef) => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setPressingId(null);
        setRingExpanded(false);
        ringExpandedRef.current = false;
        lastProgressRef.current = 0;
        progressCircleRef.current = null;
        const resolvedCategory = activeQuickCategoryRef.current || undefined;
        syncQuickCategory(null);

        if (completed) {
            onQuickSubmit(mood, resolvedCategory);
        } else {
            // Only select if it was a short press (less than 2s and not cancelled)
            // But we need to distinguish between cancel (leave) and release (click)
            // For simplicity here, relying on the 'completed' flag from timer vs manual release
            // If manual release happened before 100%, we treat it as a click
        }
    }, [onQuickSubmit, syncQuickCategory]);

    const handlePressStart = useCallback((event: React.PointerEvent<HTMLButtonElement>, id: string, mood: MoodDef) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setPressingId(id);
        setRingExpanded(false);
        ringExpandedRef.current = false;
        lastProgressRef.current = 0;
        progressCircleRef.current = null;
        syncQuickCategory(null);
        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const p = Math.min((elapsed / 2000) * 100, 100);
            lastProgressRef.current = p;

            if (!ringExpandedRef.current && p >= 8) {
                ringExpandedRef.current = true;
                setRingExpanded(true);
            }

            if (progressCircleRef.current) {
                progressCircleRef.current.style.strokeDashoffset = `${300 - (300 * p) / 100}`;
            }

            if (p < 100) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                handlePressEnd(true, mood);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [handlePressEnd, syncQuickCategory]);

    const handlePointerUp = useCallback((mood: MoodDef) => {
        if (pressingId === mood.id && lastProgressRef.current < 100) {
            onSelect(mood);
        }
        handlePressEnd(false, mood);
    }, [handlePressEnd, onSelect, pressingId]);

    const handleBubblePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>, mood: MoodDef) => {
        handlePressStart(event, mood.id, mood);
    }, [handlePressStart]);

    const handleBubblePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>, mood: MoodDef) => {
        if (pressingId === mood.id) {
            syncQuickCategory(getQuickCategoryFromPointer(event));
        }
    }, [getQuickCategoryFromPointer, pressingId, syncQuickCategory]);

    const handleBubblePointerUp = useCallback((mood: MoodDef) => {
        handlePointerUp(mood);
    }, [handlePointerUp]);

    const handleBubblePointerCancel = useCallback((mood: MoodDef) => {
        handlePressEnd(false, mood);
    }, [handlePressEnd]);

    return (
        <div
            className={`relative w-full flex flex-wrap items-center justify-center content-center gap-2.5 md:gap-4 max-w-[390px] sm:max-w-[430px] md:max-w-3xl mx-auto px-3 py-3 md:px-4 md:py-5 pt-6 md:pt-4 scale-[0.94] sm:scale-[0.97] md:scale-100 origin-top ${className}`}
            style={{ contain: 'layout style' }}
        >
            {MOODS.map((mood, index) => {
                const isSelected = selectedMoodId === mood.id;
                const isDimmed = selectedMoodId && !isSelected;
                const isPressing = pressingId === mood.id;

                return (
                    <BubbleItem
                        key={mood.id}
                        index={index}
                        mood={mood}
                        isSelected={isSelected}
                        isDimmed={isDimmed}
                        isPressing={isPressing}
                        ringExpanded={isPressing && ringExpanded}
                        activeQuickCategory={isPressing ? activeQuickCategory : null}
                        progressCircleRef={progressCircleRef}
                        onPointerDown={handleBubblePointerDown}
                        onPointerMove={handleBubblePointerMove}
                        onPointerUp={handleBubblePointerUp}
                        onPointerCancel={handleBubblePointerCancel}
                        guidePreviewRing={showGuideRingPreview && guidePreviewBubbleId === mood.id}
                    />
                );
            })}
        </div>
    );
};
