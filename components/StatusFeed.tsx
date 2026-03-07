import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Heart } from 'lucide-react';
import { api } from '../services/api';
import { STATUS_PRESETS } from './StatusPresets';

interface FeedItem {
    class_id: string | null;
    status_key: string;
    custom_text: string | null;
    color_hex: string;
    created_at: number;
}

export const StatusFeed: React.FC = () => {
    const [feed, setFeed] = useState<FeedItem[]>([]);

    useEffect(() => {
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

        fetchFeed();
        // Poll every 30s
        const interval = setInterval(fetchFeed, 30000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return `${mins}分钟前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}小时前`;
        return '1天前';
    };

    if (feed.length === 0) return null;

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    校园情绪广场
                </h3>
                <span className="text-xs font-medium text-slate-400 bg-white/50 px-2 py-1 rounded-full">
                    {feed.length} 人正在分享
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
                {feed.map((item, i) => {
                    const preset = STATUS_PRESETS.find(p => p.key === item.status_key);
                    const Icon = preset?.icon || User;
                    const label = preset?.label || item.status_key;

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative group"
                        >
                            <div
                                className="relative p-4 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 h-full"
                                style={{
                                    background: `linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)`
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                                        style={{ backgroundColor: item.color_hex }}
                                    >
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono text-right pl-2">
                                        {getTimeAgo(item.created_at)}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        来自 {item.class_id || '未知班级'} {(item.class_id || '').endsWith('班') ? '' : '班'}
                                    </span>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                        {item.custom_text || label}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {feed.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                    暂无动态，快来发布第一条状态吧！
                </div>
            )}
        </div>
    );
};
