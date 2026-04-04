
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, History, Calendar } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoI18n } from './DemoLanguageContext';

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
    source: 'db' | 'generated' | 'refreshed';
    refreshed_at?: number | null;
}

export const AIAdvicePanel: React.FC<AIAdvicePanelProps> = ({
    title,
    role,
    scopeId,
    onExpand
}) => {
    const { t } = useDemoI18n();
    const resolvedTitle = title || t('AI 智能建议', 'AI Insight');
    const [currentRecord, setCurrentRecord] = useState<AdviceRecord | null>(null);
    const [historyDates, setHistoryDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
    const todayStr = new Date().toISOString().split('T')[0];

    // Initial Load
    useEffect(() => {
        loadHistory();
        loadAdvice(selectedDate);
    }, [scopeId, role]);

    useEffect(() => {
        if (selectedDate !== todayStr) return;

        const interval = setInterval(() => {
            loadAdvice(selectedDate);
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, [selectedDate, role, scopeId]);

    const loadHistory = async () => {
        try {
            const dates = await api.ai.getHistory(role, scopeId);
            setHistoryDates(dates);
        } catch (e) { console.error("History load failed", e); }
    };

    const loadAdvice = async (date: string, options?: { force?: boolean }) => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (role === 'Teacher') {
                res = await api.ai.getTeacherAdvice(scopeId, date, options?.force);
            } else {
                res = await api.ai.getAdminAdvice(date, options?.force);
            }

            if (res.error) throw new Error(res.error);

            const nextRecord = {
                id: res.id,
                advice: res.advice,
                checked_indices: res.checked_indices || [],
                date: res.date || date,
                source: res.source,
                refreshed_at: res.refreshed_at ?? null
            };

            setCurrentRecord(nextRecord);
            return nextRecord;
        } catch (e: any) {
            setError(e.message || t('获取建议失败', 'Failed to load AI advice'));
            setCurrentRecord(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        const shouldForce = selectedDate === todayStr;
        const result = await loadAdvice(selectedDate, { force: shouldForce });
        if (!result) return;

        setRefreshNotice(shouldForce ? t('已强制刷新，正在展示最新建议', 'Force refresh complete. Showing the latest advice.') : t('已重新加载该日期建议', 'Reloaded advice for this date.'));
        window.setTimeout(() => setRefreshNotice(null), 2500);
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
            <div className="px-5 py-4 md:px-6 md:py-5 border-b border-white/30 flex flex-col gap-3 bg-white/18 backdrop-blur-xl z-10">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full border border-white/65 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                            {t('决策助手', 'Decision Assistant')}
                        </span>
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-500" />
                            <h3 className="font-semibold text-slate-800 tracking-tight">{resolvedTitle}</h3>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`h-9 w-9 flex items-center justify-center rounded-xl transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'hover:bg-white/50 text-slate-500'}`}
                            title={t('历史记录', 'History')}
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/50 text-slate-500 transition-colors disabled:opacity-50"
                            title={selectedDate === todayStr ? t('重新生成今日建议', "Regenerate today's advice") : t('重新加载该日建议', 'Reload advice for this date')}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Date Display / Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{selectedDate === todayStr ? t('今日建议', "Today's Advice") : selectedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentRecord?.refreshed_at && (
                            <span className="text-[10px] text-slate-400">
                                {t('更新于', 'Updated at')} {new Date(currentRecord.refreshed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                        {currentRecord?.source === 'db' && (
                            <span className="bg-emerald-100/90 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{t('缓存', 'Cached')}</span>
                        )}
                        {currentRecord?.source === 'generated' && (
                            <span className="bg-indigo-100/90 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{t('新生成', 'Generated')}</span>
                        )}
                        {currentRecord?.source === 'refreshed' && (
                            <span className="bg-amber-100/90 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{t('已刷新', 'Refreshed')}</span>
                        )}
                    </div>
                </div>
                <AnimatePresence>
                    {refreshNotice && (
                        <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-xl bg-indigo-50 px-3 py-2 text-[11px] text-indigo-700 border border-indigo-100"
                        >
                            {refreshNotice}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Overlay */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[104px] left-4 right-4 bg-white/95 backdrop-blur-xl border border-white/65 rounded-[24px] z-20 max-h-[300px] overflow-auto shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                    >
                        <div className="p-2 grid grid-cols-1 gap-1">
                            {historyDates.map(date => (
                                <button
                                    key={date}
                                    onClick={() => { setSelectedDate(date); loadAdvice(date); setShowHistory(false); }}
                                    className={`text-left px-4 py-3 rounded-xl text-sm flex justify-between items-center ${selectedDate === date ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span>{date}</span>
                                    {date === todayStr && <span className="text-[10px] bg-slate-200 px-1 rounded">{t('今日', 'Today')}</span>}
                                </button>
                            ))}
                            {historyDates.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">{t('暂无历史记录', 'No history yet')}</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className={`flex-1 p-5 md:p-6 overflow-auto custom-scrollbar ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                {error ? (
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-medium text-sm">{error}</p>
                            <button onClick={handleRefresh} className="mt-2 text-red-600 text-xs underline">{t('重试', 'Retry')}</button>
                        </div>
                    </div>
                ) : (
                    currentRecord ? renderContent() : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Sparkles size={32} className="opacity-20" />
                            <p className="text-sm">{t('点击刷新生成建议', 'Refresh to generate advice')}</p>
                        </div>
                    )
                )}
            </div>
        </GlassCard>
    );
};
