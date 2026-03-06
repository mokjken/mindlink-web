import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_PRESETS, StatusPreset } from './StatusPresets';
import { GlassCard } from './GlassCard';
import { Smile, X, Check } from 'lucide-react';

interface StatusSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (preset: StatusPreset, customText: string) => void;
    currentStatusId?: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentStatusId
}) => {
    const [selectedKey, setSelectedKey] = useState<string | null>(currentStatusId || null);
    const [customText, setCustomText] = useState('');

    const handleConfirm = () => {
        if (selectedKey) {
            const preset = STATUS_PRESETS.find(s => s.key === selectedKey);
            if (preset) {
                // Use default text if custom is empty
                const text = customText.trim() || preset.defaultText || '';
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
                            <GlassCard className="w-[90vw] max-w-[400px] p-6 bg-white border-white/60 shadow-2xl shadow-black/10 rounded-[32px] overflow-hidden">

                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">设定状态</h2>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Bento Grid Options */}
                                <div className="grid grid-cols-4 gap-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
                                    {STATUS_PRESETS.map((preset) => {
                                        const isSelected = selectedKey === preset.key;
                                        return (
                                            <motion.button
                                                key={preset.key}
                                                onClick={() => {
                                                    setSelectedKey(preset.key);
                                                    setCustomText(preset.defaultText || '');
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`
                          relative group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200
                          ${/* preset.span || */ 'col-span-1'} 
                          ${isSelected
                                                        ? 'bg-white shadow-md border-transparent ring-2 ring-offset-2'
                                                        : 'bg-white/40 border-white/50 hover:bg-white/80'
                                                    }
                        `}
                                                style={{
                                                    // Dynamic ring color based on option color
                                                    ['--tw-ring-color' as any]: preset.color
                                                }}
                                            >
                                                <div
                                                    className={`
                            mb-2 w-10 h-10 rounded-full flex items-center justify-center text-white
                            transition-shadow duration-300
                            ${isSelected ? 'shadow-lg' : 'shadow-sm group-hover:shadow-md'}
                          `}
                                                    style={{ backgroundColor: preset.color }}
                                                >
                                                    <preset.icon size={20} />
                                                </div>
                                                <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {preset.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Input Area */}
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
                                            placeholder="此刻想说什么？"
                                            className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                {/* Confirm Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    disabled={!selectedKey}
                                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} />
                                    确认
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
