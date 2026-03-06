
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, History, Calendar } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAdvicePanelProps {
    title?: string;
    role: 'Teacher' | 'Admin';
    scopeId: string; // class_id or 'All'
    onExpand?: () => void;
}

interface AdviceRecord {
    id?: number;
    advice: string;
    checked_indices: number[];
    date: string;
    source: 'db' | 'generated';
}

export const AIAdvicePanel: React.FC<AIAdvicePanelProps> = ({
    title = "AI 智能建议",
    role,
    scopeId,
    onExpand
}) => {
    const [currentRecord, setCurrentRecord] = useState<AdviceRecord | null>(null);
    const [historyDates, setHistoryDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Initial Load
    useEffect(() => {
        loadHistory();
        loadAdvice(selectedDate);
    }, [scopeId, role]);

    const loadHistory = async () => {
        try {
            const dates = await api.ai.getHistory(role, scopeId);
            setHistoryDates(dates);
        } catch (e) { console.error("History load failed", e); }
    };

    const loadAdvice = async (date: string) => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (role === 'Teacher') {
                res = await api.ai.getTeacherAdvice(scopeId, date);
            } else {
                res = await api.ai.getAdminAdvice(date);
            }

            if (res.error) throw new Error(res.error);

            setCurrentRecord({
                id: res.id,
                advice: res.advice,
                checked_indices: res.checked_indices || [],
                date: res.date || date,
                source: res.source
            });
        } catch (e: any) {
            setError(e.message || '获取建议失败');
            setCurrentRecord(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = async (index: number) => {
        if (!currentRecord) return;
        const newIndices = currentRecord.checked_indices.includes(index)
            ? currentRecord.checked_indices.filter(i => i !== index)
            : [...currentRecord.checked_indices, index];

        setCurrentRecord({ ...currentRecord, checked_indices: newIndices });

        if (currentRecord.id) {
            await api.ai.updateChecklist(currentRecord.id, newIndices);
        }
    };

    // Parse advice into checkable items
    const renderContent = () => {
        if (!currentRecord) return null;

        const lines = currentRecord.advice.split('\n');
        const items: { text: string; isItem: boolean; index: number }[] = [];
        let itemCounter = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            // Identify bullet points
            if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+[.、]/.test(trimmed)) {
                // Remove bullet char
                const cleanText = trimmed.replace(/^[•\-*]|\d+[.、]\s*/, '').trim();
                items.push({ text: cleanText, isItem: true, index: itemCounter++ });
            } else {
                items.push({ text: trimmed, isItem: false, index: -1 });
            }
        });

        return (
            <div className="space-y-3">
                {items.map((item, i) => {
                    if (item.isItem) {
                        const isChecked = currentRecord.checked_indices.includes(item.index);
                        return (
                            <motion.div
                                key={i}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleCheck(item.index)}
                                className={`
                                    p-3 rounded-xl border flex gap-3 cursor-pointer transition-all group
                                    ${isChecked
                                        ? 'bg-emerald-50/50 border-emerald-200 shadow-none'
                                        : 'bg-white/60 border-white/50 shadow-sm hover:shadow-md hover:bg-white/80'}
                                `}
                            >
                                <div className={`
                                    mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                    ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-indigo-400'}
                                `}>
                                    {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <p className={`text-sm leading-relaxed ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {item.text}
                                </p>
                            </motion.div>
                        );
                    } else {
                        // Regular text / Headers
                        if (item.text.startsWith('【')) {
                            return <h4 key={i} className="font-bold text-slate-800 mt-4 mb-2">{item.text}</h4>;
                        }
                        return <p key={i} className="text-sm text-slate-600 leading-relaxed mb-2 opacity-80">{item.text}</p>;
                    }
                })}
            </div>
        );
    };

    return (
        <GlassCard className="h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/20 flex flex-col gap-3 bg-white/10 backdrop-blur-md z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-600" />
                        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-white/40 text-slate-500'}`}
                            title="历史记录"
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={() => loadAdvice(selectedDate)}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-white/40 text-slate-500 transition-colors disabled:opacity-50"
                            title="刷新/生成"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Date Display / Selector */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{selectedDate === new Date().toISOString().split('T')[0] ? '今日建议' : selectedDate}</span>
                    </div>
                    {currentRecord?.source === 'db' && (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">已保存</span>
                    )}
                </div>
            </div>

            {/* History Overlay */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[88px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-indigo-100 z-20 max-h-[300px] overflow-auto shadow-lg"
                    >
                        <div className="p-2 grid grid-cols-1 gap-1">
                            {historyDates.map(date => (
                                <button
                                    key={date}
                                    onClick={() => { setSelectedDate(date); loadAdvice(date); setShowHistory(false); }}
                                    className={`text-left px-4 py-3 rounded-lg text-sm flex justify-between items-center ${selectedDate === date ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span>{date}</span>
                                    {date === new Date().toISOString().split('T')[0] && <span className="text-[10px] bg-slate-200 px-1 rounded">Today</span>}
                                </button>
                            ))}
                            {historyDates.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">暂无历史记录</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className={`flex-1 p-5 overflow-auto ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                {error ? (
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-medium text-sm">{error}</p>
                            <button onClick={() => loadAdvice(selectedDate)} className="mt-2 text-red-600 text-xs underline">重试</button>
                        </div>
                    </div>
                ) : (
                    currentRecord ? renderContent() : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Sparkles size={32} className="opacity-20" />
                            <p className="text-sm">点击刷新生成建议</p>
                        </div>
                    )
                )}
            </div>
        </GlassCard>
    );
};
