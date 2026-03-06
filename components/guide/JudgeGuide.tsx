import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MousePointer2, User, LayoutDashboard, X } from 'lucide-react';

interface JudgeGuideProps {
    currentView: 'student' | 'teacher' | 'admin' | string;
    onNavigate: (view: 'student' | 'teacher' | 'admin') => void;
}

const STEPS = [
    {
        id: 'welcome',
        title: '欢迎体验 MindLink',
        content: '欢迎您！本向导将带领您沉浸式体验 "流体共情 (Liquid Empathy)" 系统的核心功能。请随意与界面元素互动。',
        targetView: 'student',
        action: '开始体验'
    },
    {
        id: 'student_intro',
        title: '第一站：学生端视图',
        content: '这是学生日常使用的界面。设计核心是 "零阻力 (Zero-Friction)" 输入。中心的流体球代表学生当前的情绪状态。',
        targetView: 'student',
        action: '下一步'
    },
    {
        id: 'interaction_tap',
        title: '微交互：点击 (Tap)',
        content: '请尝试【轻点】流体球。这会瞬间改变情绪颜色，但不会立即提交。让学生能直观地 "触摸" 到符合当下的情绪颜色。',
        targetView: 'student',
        action: '下一步'
    },
    {
        id: 'interaction_hold',
        title: '微交互：长按 (Long Press)',
        content: '现在，请【长按】流体球（约1秒）来提交记录。这个独特的交互手势能防止误触，并创造一个短暂的 "正念时刻"。',
        targetView: 'student',
        action: '下一步'
    },
    {
        id: 'community_intro',
        title: '情绪社区',
        content: '请向下滑动：这里是情绪社区。学生可以发布带即时情绪色彩的匿名动态，或使用预设的 "积极语录" 相互鼓励，营造温暖的班级氛围。',
        targetView: 'student',
        action: '下一步'
    },
    {
        id: 'go_teacher',
        title: '切换角色：教师端',
        content: '接下来，让我们看看老师的视角。请点击底部的 "控制中心" (药丸按钮)，然后选择 "教师端 (Teacher)"。',
        targetView: 'student',
        // No forceNavigate. We wait for user action.
        action: '等待切换...',
        waitFor: 'teacher'
    },
    {
        id: 'teacher_view',
        title: '第二站：教师仪表盘',
        content: '欢迎来到教师端！这里展示了班级的实时情绪 Bento Grid。请留意右侧的 "AI 建议" 面板，它就像一位全天候的学校心理学家。',
        targetView: 'teacher',
        action: '下一步'
    },
    {
        id: 'go_admin',
        title: '切换角色：管理端',
        content: '最后，让我们看看校长或心理咨询师的宏观视角。请再次点击控制中心，切换到 "管理端 (Admin)"。',
        targetView: 'teacher',
        action: '等待切换...',
        waitFor: 'admin'
    },
    {
        id: 'admin_view',
        title: '终点站：管理员仪表盘',
        content: '管理员视图聚合了全校数据。这里有 3D 情绪热力图 (如已启用) 和风险预警系统，帮助识别全校范围的压力热点。',
        targetView: 'admin',
        action: '完成向导'
    }
];

export const JudgeGuide: React.FC<JudgeGuideProps> = ({ currentView, onNavigate }) => {
    const [active, setActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        const done = localStorage.getItem('mindlink_guide_completed');
        if (!done) setActive(true);
    }, []);

    // Auto-advance when view changes matches expectation
    useEffect(() => {
        if (!active) return;
        const step = STEPS[currentStepIndex];

        if (step.id === 'go_teacher' && currentView === 'teacher') {
            setCurrentStepIndex(prev => prev + 1);
        }
        if (step.id === 'go_admin' && currentView === 'admin') {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [currentView, active, currentStepIndex]);


    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            finishGuide();
        }
    };

    const finishGuide = () => {
        localStorage.setItem('mindlink_guide_completed', 'true');
        setActive(false);
    };

    const resetGuide = () => {
        setCurrentStepIndex(0);
        setActive(true);
        onNavigate('student');
    };

    if (!active) {
        return (
            <button
                onClick={resetGuide}
                className="fixed bottom-6 left-6 z-[60] p-3 bg-white/80 backdrop-blur-md rounded-full shadow-md text-sm font-semibold text-indigo-600 hover:scale-105 transition-all"
                title="重新开始向导"
            >
                向导
            </button>
        );
    }

    const step = STEPS[currentStepIndex];
    // @ts-ignore
    const isWaiting = step.waitFor && currentView !== step.waitFor;

    return (
        <AnimatePresence mode="wait">
            {/* NO BACKDROP - Allowing interaction */}

            <motion.div
                key={step.id}
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                // Positioning: Bottom Center, floating above controls
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm pointer-events-none"
            >
                {/* Inner Card content needs pointer-events-auto */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-5 pointer-events-auto ring-1 ring-black/5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">
                                    {currentStepIndex + 1}
                                </span>
                                {step.title}
                            </h3>
                            <p className="text-slate-600 text-sm leading-snug">
                                {step.content}
                            </p>
                        </div>
                        <button
                            onClick={finishGuide}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="sr-only">关闭</span>
                            <X size={16} />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-1">
                            {STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-4 bg-indigo-500' : 'w-1 bg-slate-200'}`}
                                />
                            ))}
                        </div>

                        {!isWaiting ? (
                            <button
                                onClick={handleNext}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                            >
                                {step.action}
                                <ChevronRight size={14} />
                            </button>
                        ) : (
                            <span className="text-xs font-semibold text-indigo-500 animate-pulse px-2 py-1 bg-indigo-50 rounded-md">
                                请切换视图以继续...
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
