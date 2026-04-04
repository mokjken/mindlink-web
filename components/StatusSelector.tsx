import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_PRESETS, StatusPreset } from './StatusPresets';
import { GlassCard } from './GlassCard';
import { Smile, X, Check } from 'lucide-react';
import { useDemoI18n } from './DemoLanguageContext';

interface StatusSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (preset: StatusPreset, customText: string) => void;
    currentStatusId?: string;
    allowCustomText?: boolean;
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

const STATUS_GROUPS = [
    {
        key: 'busy',
        titleZh: '此刻',
        titleEn: 'Right Now',
        keys: ['focus', 'exploring', 'fire']
    },
    {
        key: 'activity',
        titleZh: '活动',
        titleEn: 'Activity',
        keys: ['vibing', 'gym', 'crushing']
    },
    {
        key: 'rest',
        titleZh: '休息',
        titleEn: 'Rest',
        keys: ['recharging', 'relaxing']
    }
];

export const StatusSelector: React.FC<StatusSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentStatusId,
    allowCustomText = true
}) => {
    const { isEnglish, t } = useDemoI18n();
    const [selectedKey, setSelectedKey] = useState<string | null>(currentStatusId || null);
    const [customText, setCustomText] = useState('');
    const selectedPreset = STATUS_PRESETS.find(s => s.key === selectedKey) || null;

    useEffect(() => {
        if (!isOpen) return;
        setSelectedKey(currentStatusId || null);
        if (!currentStatusId) {
            setCustomText('');
            return;
        }
        const preset = STATUS_PRESETS.find((item) => item.key === currentStatusId);
        if (preset) {
            setCustomText((isEnglish ? STATUS_PRESET_EN[preset.key]?.text : preset.defaultText) || preset.defaultText || '');
        }
    }, [currentStatusId, isEnglish, isOpen]);

    const handleConfirm = () => {
        if (selectedKey) {
            const preset = STATUS_PRESETS.find(s => s.key === selectedKey);
            if (preset) {
                // Use default text if custom is empty
                const text = customText.trim() || (isEnglish ? STATUS_PRESET_EN[preset.key]?.text : preset.defaultText) || preset.defaultText || '';
                onSelect(preset, text);
                onClose();
            }
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[100]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="pointer-events-auto"
                        >
                            <GlassCard className="w-[92vw] max-w-[430px] p-6 bg-white/90 border-white/60 shadow-2xl shadow-black/10 rounded-[32px] overflow-hidden">

                                {/* Header */}
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('挂个状态', 'Set a Status')}</h2>
                                        <p className="mt-1 text-sm text-slate-500">{t('选一个轻轻代表今天的此刻。', 'Choose a light status for this moment.')}</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-5 max-h-[52vh] overflow-y-auto pr-1">
                                    {STATUS_GROUPS.map((group) => (
                                        <div key={group.key}>
                                            <p className="mb-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-slate-400">
                                                {isEnglish ? group.titleEn : group.titleZh}
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {group.keys.map((key) => {
                                                    const preset = STATUS_PRESETS.find(item => item.key === key);
                                                    if (!preset) return null;
                                                    const isSelected = selectedKey === preset.key;
                                                    return (
                                                        <motion.button
                                                            key={preset.key}
                                                            onClick={() => {
                                                                setSelectedKey(preset.key);
                                                                setCustomText((isEnglish ? STATUS_PRESET_EN[preset.key]?.text : preset.defaultText) || preset.defaultText || '');
                                                            }}
                                                            whileHover={{ scale: 1.015 }}
                                                            whileTap={{ scale: 0.985 }}
                                                            className={`relative flex aspect-square flex-col items-center justify-center rounded-[20px] border px-2 py-3 transition-all duration-200 ${
                                                                isSelected
                                                                    ? 'border-transparent bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
                                                                    : 'border-white/60 bg-white/42 hover:bg-white/72'
                                                            }`}
                                                            style={isSelected ? {
                                                                boxShadow: `inset 0 0 0 2px ${preset.color}, 0 12px 24px rgba(15,23,42,0.08)`
                                                            } : undefined}
                                                        >
                                                            <div
                                                                className={`mb-2 flex h-11 w-11 items-center justify-center rounded-[16px] text-white ${isSelected ? 'shadow-lg' : 'shadow-sm'}`}
                                                                style={{ backgroundColor: preset.color }}
                                                            >
                                                                <preset.icon size={20} />
                                                            </div>
                                                            <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {isEnglish ? STATUS_PRESET_EN[preset.key]?.label || preset.label : preset.label}
                                                            </span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {allowCustomText ? (
                                    <div className="bg-white/50 rounded-2xl p-4 mb-4 border border-white/50 focus-within:bg-white focus-within:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                {STATUS_PRESETS.find(s => s.key === selectedKey)?.icon ? (
                                                    React.createElement(STATUS_PRESETS.find(s => s.key === selectedKey)!.icon, { size: 16 })
                                                ) : (
                                                    <Smile size={16} />
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={customText}
                                                onChange={(e) => setCustomText(e.target.value)}
                                                placeholder={t('此刻想说什么？', "What's on your mind right now?")}
                                                className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/45 rounded-2xl px-4 py-3.5 mb-4 border border-white/50">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                {selectedPreset?.icon ? (
                                                    React.createElement(selectedPreset.icon, { size: 16 })
                                                ) : (
                                                    <Smile size={16} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium">{t('将用预设状态发布', 'This will be posted as a preset status')}</p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {selectedPreset
                                                        ? (isEnglish ? STATUS_PRESET_EN[selectedPreset.key]?.text || selectedPreset.defaultText : selectedPreset.defaultText)
                                                        : t('自由输入已关闭，保持更轻量的表达。', 'Free text is disabled to keep the expression lightweight.')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Confirm Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    disabled={!selectedKey}
                                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} />
                                    {t('确认', 'Confirm')}
                                </motion.button>

                            </GlassCard>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
