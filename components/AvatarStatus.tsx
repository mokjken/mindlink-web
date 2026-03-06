import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Plus } from 'lucide-react';
import { StatusSelector } from './StatusSelector';
import { useUserStatus } from '../hooks/useUserStatus';
import { useToast } from './ToastProvider';
import { StatusPreset } from './StatusPresets';

export const AvatarStatus: React.FC = () => {
    const { status, updateStatus } = useUserStatus();
    const { showToast } = useToast();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleSetStatus = async (preset: StatusPreset, customText: string) => {
        setIsPickerOpen(false);
        try {
            const classId = localStorage.getItem('mindlink_class_id') || '3-A';
            await updateStatus(preset.key, customText, preset.color, classId);
            showToast("状态已更新！", "success");
        } catch (e) {
            showToast("更新失败", "error");
        }
    };

    return (
        <div className="relative">
            {/* Avatar Pill */}
            <motion.button
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all shadow-sm border border-white/20"
                style={{
                    // Dynamic Gradient Background based on status color
                    background: status
                        ? `linear-gradient(90deg, ${status.color_hex}15 0%, rgba(255,255,255,0.4) 100%)`
                        : 'rgba(255,255,255,0.4)'
                }}
            >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md relative group">
                    <User size={16} />
                    {/* Status Badge (Small Dot) if status exists */}
                    {status && (
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] transition-colors"
                            style={{ backgroundColor: status.color_hex }}
                        />
                    )}
                </div>

                {/* Status Label or placeholder */}
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-xs font-bold text-slate-800">学生</span>
                    {status ? (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 opacity-80">
                            {status.custom_text || status.status_key}
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            设定状态 <Plus size={8} />
                        </span>
                    )}
                </div>
            </motion.button>

            {/* Picker Modal */}
            <StatusSelector
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleSetStatus}
                currentStatusId={status?.status_key}
            />
        </div>
    );
};
