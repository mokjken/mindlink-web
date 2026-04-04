import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock3, Heart, Plus, Sparkles, User } from 'lucide-react';
import { api } from '../services/api';
import { STATUS_PRESETS } from './StatusPresets';
import { StatusSelector } from './StatusSelector';
import { useUserStatus } from '../hooks/useUserStatus';
import { useToast } from './ToastProvider';
import { getStudentClassId } from '../services/api';
import { useDemoI18n } from './DemoLanguageContext';
import { getPortalMode } from '../runtimeConfig';

interface FeedItem {
    id: number;
    class_id: string | null;
    status_key: string;
    custom_text: string | null;
    color_hex: string;
    created_at: number;
    resonance_count?: number;
    reacted_by_viewer?: number;
}

const STATUS_PRESET_EN: Record<string, { label: string; text: string }> = {
    recharging: { label: 'Recharging', text: 'Recovering energy...' },
    focus: { label: 'Focused', text: 'Bringing my attention back' },
    crushing: { label: 'Little Joy', text: 'Caught a small bright moment' },
    vibing: { label: 'Music', text: 'BGM on' },
    gym: { label: 'Workout', text: 'Let the dopamine flow' },
    exploring: { label: 'Exploring', text: 'Looking for inspiration' },
    relaxing: { label: 'Relaxing', text: 'Enjoying the moment' },
    fire: { label: 'On Fire', text: 'Giving it everything' }
};

const getPresetCopy = (statusKey: string, isEnglish: boolean) => {
    const preset = STATUS_PRESETS.find(p => p.key === statusKey);
    const label = isEnglish ? (STATUS_PRESET_EN[statusKey]?.label || preset?.label || statusKey) : (preset?.label || statusKey);
    const text = isEnglish ? (STATUS_PRESET_EN[statusKey]?.text || preset?.defaultText || label) : (preset?.defaultText || label);
    return { preset, label, text };
};

interface StatusFeedProps {
    composerOpenSignal?: number;
    onStatusPublished?: () => void;
    highlightComposer?: boolean;
}

export const StatusFeed: React.FC<StatusFeedProps> = ({
    composerOpenSignal = 0,
    onStatusPublished,
    highlightComposer = false
}) => {
    const isStudentPortal = getPortalMode() === 'student';
    const { isEnglish, t } = useDemoI18n();
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const { status, updateStatus } = useUserStatus();
    const { showToast } = useToast();

    const fetchFeed = async () => {
        try {
            const data = await api.status.getFeed();
            if (Array.isArray(data)) {
                setFeed(data);
            }
        } catch (e) {
            console.error("Failed to load feed", e);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 10000);
        const handleVisibilityChange = () => {
            if (!document.hidden) fetchFeed();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!composerOpenSignal) return;
        setIsComposerOpen(true);
    }, [composerOpenSignal]);

    const handlePublishStatus = async (preset: (typeof STATUS_PRESETS)[number], presetText: string) => {
        try {
            const classId = getStudentClassId() || 'G7SP';
            await updateStatus(preset.key, presetText, preset.color, classId);
            await fetchFeed();
            onStatusPublished?.();
            showToast(t('状态已发布到社区', 'Status published to the community'), 'success');
        } catch (e) {
            showToast(t('发布状态失败', 'Failed to publish status'), 'error');
        } finally {
            setIsComposerOpen(false);
        }
    };

    const handleResonate = async (statusId: number) => {
        if (typeof statusId !== 'number') {
            showToast(t('这条状态暂时还不能互动，请刷新后再试。', 'This status cannot be interacted with yet. Please refresh and try again.'), 'error');
            return;
        }
        const previousFeed = feed;
        setFeed((current) =>
            current.map((item) => {
                if (item.id !== statusId) return item;
                const hasReacted = Boolean(item.reacted_by_viewer);
                const nextCount = Math.max((item.resonance_count || 0) + (hasReacted ? -1 : 1), 0);
                return {
                    ...item,
                    reacted_by_viewer: hasReacted ? 0 : 1,
                    resonance_count: nextCount
                };
            })
        );

        try {
            const result = await api.status.toggleResonance(statusId);
            setFeed((current) =>
                current.map((item) =>
                    item.id === statusId
                        ? {
                            ...item,
                            reacted_by_viewer: result.reacted ? 1 : 0,
                            resonance_count: result.resonance_count || 0
                        }
                        : item
                )
            );
        } catch (e) {
            setFeed(previousFeed);
            showToast(t('同感发送失败', 'Failed to send resonance'), 'error');
        }
    };

    const getTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('刚刚', 'Just now');
        if (mins < 60) return isEnglish ? `${mins}m ago` : `${mins}分钟前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return isEnglish ? `${hours}h ago` : `${hours}小时前`;
        return t('1天前', '1d ago');
    };

    const highlightFeed = feed.slice(0, Math.min(feed.length, 8));
    const currentStatusMeta = status ? getPresetCopy(status.status_key, isEnglish) : null;
    const currentStatusEntry = status
        ? feed.find((item) =>
            item.id === (status as any).id ||
            (
                item.status_key === status.status_key &&
                item.color_hex === status.color_hex &&
                (item.custom_text || '') === (status.custom_text || '')
            )
        )
        : null;

    if (feed.length === 0 && !status) {
        return (
            <div className="w-full pb-6">
                <div className={`rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.34)_100%)] px-5 py-6 ${isStudentPortal ? 'backdrop-blur-[10px]' : 'backdrop-blur-[22px]'} shadow-[0_18px_42px_rgba(15,23,42,0.06)]`}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/68 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase shadow-sm">
                                {t('我的状态', 'My Status')}
                                <Sparkles size={11} className="text-slate-400" />
                            </span>
                            <div>
                                <h3 className="text-[1.45rem] font-semibold tracking-tight text-slate-800">
                                    {t('先挂一个状态吧', 'Set your status first')}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsComposerOpen(true)}
                            className={`inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/76 px-4 py-2.5 text-[12px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white ${
                                highlightComposer ? 'ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-white/20' : ''
                            }`}
                        >
                            <Plus size={14} />
                            {t('发布状态', 'Post Status')}
                        </button>
                    </div>
                </div>

                <StatusSelector
                    isOpen={isComposerOpen}
                    onClose={() => setIsComposerOpen(false)}
                    onSelect={handlePublishStatus}
                    currentStatusId={status?.status_key}
                    allowCustomText={false}
                />
            </div>
        );
    }

    return (
        <div className="w-full pb-6">
            <div className={`rounded-[32px] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.34)_100%)] ${isStudentPortal ? 'backdrop-blur-[10px]' : 'backdrop-blur-[22px]'} shadow-[0_18px_46px_rgba(15,23,42,0.06)] overflow-hidden`}>
                <div className="px-5 pt-5 pb-5 md:px-6 md:pt-6 md:pb-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)]">
                        <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.6)_100%)] p-4 md:p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase shadow-sm">
                                        {t('我的状态', 'My Status')}
                                        <Sparkles size={11} className="text-slate-400" />
                                    </span>
                                    <div>
                                        <h3 className="text-[1.35rem] font-semibold tracking-tight text-slate-800">
                                            {status ? t('今天我挂着这个', 'This is my current status') : t('给今天挂一个状态', 'Set a status for today')}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsComposerOpen(true)}
                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/78 text-slate-600 shadow-sm transition-colors hover:bg-white ${
                                        highlightComposer ? 'ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-white/20' : ''
                                    }`}
                                    aria-label={status ? t('更新状态', 'Update Status') : t('发布状态', 'Post Status')}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {status && currentStatusMeta ? (
                                <div className="mt-4 rounded-[26px] border border-white/70 bg-white/66 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-[18px] text-white shadow-sm"
                                            style={{ backgroundColor: status.color_hex }}
                                        >
                                            {currentStatusMeta.preset ? <currentStatusMeta.preset.icon size={22} /> : <User size={20} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-base font-semibold text-slate-800">{currentStatusMeta.label}</p>
                                                <span className="text-[11px] text-slate-400">{t('挂着中', 'Active')}</span>
                                            </div>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                {status.custom_text || currentStatusMeta.text}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[11px] text-slate-400">
                                                    {currentStatusEntry
                                                        ? (isEnglish
                                                            ? `${currentStatusEntry.resonance_count || 0} resonated`
                                                            : `${currentStatusEntry.resonance_count || 0} 人同感`)
                                                        : t('还没有同感', 'No resonance yet')}
                                                </span>
                                                {currentStatusEntry?.id ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResonate(currentStatusEntry.id)}
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                                                            currentStatusEntry.reacted_by_viewer
                                                                ? 'border-rose-200 bg-rose-50 text-rose-500'
                                                                : 'border-white/70 bg-white/72 text-slate-500 hover:bg-white'
                                                        }`}
                                                    >
                                                        <Heart size={12} className={currentStatusEntry.reacted_by_viewer ? 'fill-current' : ''} />
                                                        <span>{t('同感', 'Resonate')}</span>
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsComposerOpen(true)}
                                    className="mt-4 flex w-full items-center justify-between rounded-[26px] border border-dashed border-white/75 bg-white/58 px-4 py-4 text-left transition-colors hover:bg-white/74"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{t('还没有挂状态', 'No status yet')}</p>
                                        <p className="mt-1 text-sm text-slate-500">{t('选一个轻状态挂上去，让今天更有一点存在感。', 'Pick a light status and hang it up for today.')}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                        <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.56)_100%)] p-4 md:p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('本班此刻', 'Class Now')}</p>
                            <h3 className="mt-1 text-[1.15rem] font-semibold text-slate-800">{t('本班挂着的状态', 'Statuses in this class')}</h3>
                        </div>
                        <span className="inline-flex text-[11px] font-medium text-slate-400 bg-white/58 px-2.5 py-1 rounded-full border border-white/60">
                            {isEnglish ? `${feed.length} posts` : `${feed.length} 条动态`}
                        </span>
                    </div>

                    {highlightFeed.length > 0 ? (
                        <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
                            {highlightFeed.map((item, i) => {
                                const { preset, label } = getPresetCopy(item.status_key, isEnglish);
                                const Icon = preset?.icon || User;

                                return (
                                    <motion.div
                                        key={`ring-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex min-w-[84px] flex-col items-center gap-2"
                                    >
                                        <div
                                            className="relative h-[66px] w-[66px] rounded-full p-[2px] shadow-sm"
                                            style={{
                                                background: `linear-gradient(135deg, ${item.color_hex}, rgba(255,255,255,0.94))`
                                            }}
                                        >
                                            <div className={`flex h-full w-full items-center justify-center rounded-full border border-white/70 bg-white/86 ${isStudentPortal ? 'backdrop-blur-[6px]' : 'backdrop-blur-xl'}`}>
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm"
                                                    style={{ backgroundColor: item.color_hex }}
                                                >
                                                    <Icon size={18} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-semibold text-slate-700 truncate">{label}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{getTimeAgo(item.created_at)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-[22px] border border-dashed border-white/70 bg-white/48 px-4 py-6 text-center">
                            <p className="text-sm font-medium text-slate-500">
                                {t('你已经挂上状态了，等本班更多人加入这里吧。', 'Your status is up. This space will feel fuller once more classmates join in.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

                    {feed.length > 0 && (
                        <div className="mt-4 rounded-[28px] border border-white/68 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.52)_100%)] p-3 md:p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                            <div className="px-2 pb-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('轻状态流', 'Status Stream')}</p>
                                <h3 className="mt-1 text-[1.05rem] font-semibold text-slate-800">{t('轻轻看见彼此的此刻', 'A gentle glimpse into the moment')}</h3>
                            </div>

                            <div className="space-y-2">
                                {feed.map((item, i) => {
                                    const { preset, label, text } = getPresetCopy(item.status_key, isEnglish);
                                    const Icon = preset?.icon || User;
                                    const mainText = item.custom_text || text;

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="flex items-start gap-3 rounded-[22px] border border-white/70 bg-white/66 px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                                        >
                                            <div
                                                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                                                style={{ backgroundColor: item.color_hex }}
                                            >
                                                <Icon size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                                                        <Clock3 size={12} />
                                                        <span>{getTimeAgo(item.created_at)}</span>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
                                                    {mainText}
                                                </p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResonate(item.id)}
                                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                                            item.reacted_by_viewer
                                                                ? 'border-rose-200 bg-rose-50 text-rose-500'
                                                                : 'border-white/70 bg-white/72 text-slate-500 hover:bg-white'
                                                        }`}
                                                    >
                                                        <Heart size={13} className={item.reacted_by_viewer ? 'fill-current' : ''} />
                                                        <span>{t('同感', 'Resonate')}</span>
                                                    </button>
                                                    <span className="text-[11px] text-slate-400">
                                                        {isEnglish
                                                            ? `${item.resonance_count || 0} resonated`
                                                            : `${item.resonance_count || 0} 人同感`}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <StatusSelector
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                onSelect={handlePublishStatus}
                currentStatusId={status?.status_key}
                allowCustomText={false}
            />
        </div>
    );
};
