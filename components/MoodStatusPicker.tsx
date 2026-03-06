import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Zap, Moon, Sun, Book, Music, Ghost, Smile } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface StatusOption {
    id: string;
    icon: React.ElementType;
    label: string;
    color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
    { id: 'focus', icon: Book, label: 'Focusing', color: '#6366f1' }, // Indigo
    { id: 'chill', icon: Coffee, label: 'Chilling', color: '#10b981' }, // Emerald
    { id: 'sleeping', icon: Moon, label: 'Sleeping', color: '#8b5cf6' }, // Violet
    { id: 'energetic', icon: Zap, label: 'Energetic', color: '#f59e0b' }, // Amber
    { id: 'happy', icon: Smile, label: 'Happy', color: '#ec4899' }, // Pink
    { id: 'music', icon: Music, label: 'Vibing', color: '#06b6d4' }, // Cyan
    { id: 'daydream', icon: Sun, label: 'Daydreaming', color: '#f97316' }, // Orange
    { id: 'invisible', icon: Ghost, label: 'Invisible', color: '#94a3b8' }, // Slate
];

interface MoodStatusPickerProps {
    onSelect: (status: StatusOption) => void;
    onClose: () => void;
}

export const MoodStatusPicker: React.FC<MoodStatusPickerProps> = ({ onSelect, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 right-0 z-50 w-72"
        >
            <GlassCard className="p-4 bg-white/80 backdrop-blur-2xl border-white/50 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-700">Set Status</h3>
                    <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((status) => (
                        <button
                            key={status.id}
                            onClick={() => onSelect(status)}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/5 transition-colors group"
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110"
                                style={{ backgroundColor: status.color }}
                            >
                                <status.icon size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{status.label}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>
        </motion.div>
    );
};
