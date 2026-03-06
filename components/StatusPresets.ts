// Re-import icons to match new presets
import { Book, Zap, Coffee, Moon, Music, Gamepad2, Heart, Smile, Search, Flame, BatteryCharging, Sun } from 'lucide-react';

export interface StatusPreset {
    key: string;
    label: string;
    icon: any;
    color: string;
    defaultText?: string;
}

export const STATUS_PRESETS: StatusPreset[] = [
    { key: 'recharging', label: '充电中', icon: BatteryCharging, color: '#10B981', defaultText: '满血复活中...' },
    { key: 'focus', label: '沉浸中', icon: Book, color: '#3B82F6', defaultText: '专注学习模式' },
    { key: 'ranking', label: '上分中', icon: Gamepad2, color: '#8B5CF6', defaultText: '峡谷见' },
    { key: 'sleeping', label: '补觉中', icon: Moon, color: '#1E293B', defaultText: '勿扰模式' },
    { key: 'crushing', label: '小确幸', icon: Heart, color: '#EC4899', defaultText: '发现美好' },
    { key: 'vibing', label: '听歌', icon: Music, color: '#06B6D4', defaultText: 'BGM播放中' },
    { key: 'gym', label: '暴汗', icon: Zap, color: '#F59E0B', defaultText: '多巴胺分泌' },
    { key: 'exploring', label: '探索中', icon: Search, color: '#6366F1', defaultText: '寻找灵感' },
    { key: 'relaxing', label: '松弛感', icon: Coffee, color: '#64748B', defaultText: '享受当下' },
    { key: 'fire', label: '燃起来', icon: Flame, color: '#EF4444', defaultText: '全力以赴！' }
];
