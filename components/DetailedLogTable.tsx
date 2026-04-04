import React, { useState, useEffect } from 'react';
import { MoodEntry } from '../types';
import { AlertCircle, Clock, MapPin, Search, Filter, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useDemoI18n } from './DemoLanguageContext';

interface DetailedLogTableProps {
  initialEntries?: MoodEntry[]; // Optional initial data
  title: string;
  defaultClassId?: string; // If provided, locks search to this class
  showFilters?: boolean;
  embedded?: boolean;
  maskUserIds?: boolean;
  showClassId?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  Academic: '学习任务',
  Social: '同伴互动',
  Environment: '校园环境',
  Health: '身心状态',
  Future: '目标压力',
  Unspecified: '未补充',
  学业: '学习任务',
  社交: '同伴互动',
  环境: '校园环境',
  健康: '身心状态',
  未来: '目标压力',
  未分类: '未补充'
};

const EMOTION_LABELS_EN: Record<string, string> = {
  开心: 'Happy',
  满足: 'Content',
  关爱: 'Caring',
  关怀: 'Caring',
  感动: 'Moved',
  平静: 'Calm',
  放松: 'Relaxed',
  沉思: 'Thoughtful',
  无聊: 'Bored',
  紧张: 'Nervous',
  压力: 'Stressed',
  焦虑: 'Anxious',
  犹豫: 'Hesitant',
  愤怒: 'Angry',
  挫败: 'Frustrated',
  低落: 'Down',
  难过: 'Upset',
  悲伤: 'Sad',
  孤独: 'Lonely'
};

const maskUserId = (userId: string) => {
  const trimmed = userId.trim();
  if (!trimmed) return 'Anonymous';
  if (trimmed.length <= 2) return `${trimmed[0]}*`;
  if (trimmed.length <= 4) return `${trimmed.slice(0, 1)}**${trimmed.slice(-1)}`;
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
};

export const DetailedLogTable: React.FC<DetailedLogTableProps> = ({
  initialEntries = [],
  title,
  defaultClassId,
  showFilters = true,
  embedded = false,
  maskUserIds = true,
  showClassId = false
}) => {
  const { isEnglish, t } = useDemoI18n();
  const hasTitle = title.trim().length > 0;
  const [entries, setEntries] = useState<MoodEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    if (!showFilters) return;

    const timer = setTimeout(async () => {
      if (!searchQuery && riskFilter === 'All') {
        // Reset to initial if available, or fetch default latest
        if (initialEntries.length > 0 && !searchQuery && riskFilter === 'All') {
          setEntries(initialEntries);
          return;
        }
      }

      setIsSearching(true);
      try {
        const results = await api.logs.search({
          q: searchQuery,
          risk_level: riskFilter === 'All' ? undefined : riskFilter,
          class_id: defaultClassId
        });
        setEntries(results);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, riskFilter, defaultClassId, initialEntries, showFilters]);

  // Update entries if props change (e.g. initial load)
  useEffect(() => {
    if (initialEntries.length > 0 && !searchQuery && riskFilter === 'All') {
      setEntries(initialEntries);
    }
  }, [initialEntries]);

  return (
    <div className={`overflow-hidden flex flex-col h-full transition-all ${
      embedded
        ? 'bg-transparent rounded-none border-0 shadow-none'
        : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.64)_100%)] backdrop-blur-xl rounded-[28px] border border-white/60 shadow-[0_16px_34px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.7)]'
    }`}>
      <div className={`${embedded ? 'border-b border-white/40 bg-white/24' : 'border-b border-white/55 bg-white/42'} flex flex-col gap-3 ${hasTitle ? 'p-4' : 'p-3 sm:p-4'}`}>

        {/* Header Row */}
        {(hasTitle || isSearching) && (
          <div className="flex justify-between items-center gap-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 min-w-0">
              {riskFilter === 'High' && <AlertCircle size={16} className="text-red-500 flex-shrink-0" />}
              {hasTitle && <span className="truncate">{title}</span>}
              <span className="text-[11px] font-medium text-slate-500 bg-white/75 border border-white/70 px-2 py-0.5 rounded-full flex-shrink-0">
                {entries.length}
              </span>
            </h3>

                    {isSearching && <div className="text-xs text-indigo-500 animate-pulse font-medium whitespace-nowrap">{t('搜索中...', 'Searching...')}</div>}
          </div>
        )}

        {/* Filters Row */}
        {showFilters && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('搜索日志（内容 / 地点）', 'Search logs (content / location)')}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/88 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/88 border border-slate-200/90 rounded-xl p-0.5 w-full lg:w-auto justify-between lg:justify-start">
              <button
                onClick={() => setRiskFilter('All')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${riskFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('全部', 'All')}
              </button>
              <button
                onClick={() => setRiskFilter('Normal')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${riskFilter === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('正常', 'Normal')}
              </button>
              <button
                onClick={() => setRiskFilter('High')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${riskFilter === 'High' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('高风险', 'High Risk')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[460px] sm:min-w-[560px]">
          <thead className="bg-white/75 backdrop-blur-xl sticky top-0 z-10 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em] shadow-sm">
              <tr>
                <th className="px-3 sm:px-4 py-3">{t('时间', 'Time')}</th>
                <th className="px-3 sm:px-4 py-3">
                  {showClassId
                    ? t('用户 / 班级 / 地点', 'User / Class / Location')
                    : t('用户 / 地点', 'User / Location')}
                </th>
                <th className="px-3 sm:px-4 py-3">{t('心情', 'Mood')}</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 w-1/3">{t('内容', 'Content')}</th>
                <th className="px-3 sm:px-4 py-3 text-right">{t('风险', 'Risk')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-sm">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <Search size={20} />
                  </div>
                  <p>{t('暂无匹配记录。', 'No matching records.')}</p>
                  <p className="text-xs text-slate-400">{t('试试调整关键词或筛选条件。', 'Try adjusting the keywords or filters.')}</p>
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const categoryLabel = CATEGORY_LABELS[String(entry.category)] || String(entry.category || '未补充');
                const displayUserId = maskUserIds ? maskUserId(String(entry.user_id || '')) : String(entry.user_id || '');
                return (
                <tr key={entry.id} className="hover:bg-white/55 transition-colors group">
                  <td className="px-3 sm:px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="font-semibold text-slate-700">{displayUserId || t('未知用户', 'Unknown user')}</div>
                    {showClassId && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t('班级', 'Class')}: {entry.class_id || t('未提供', 'N/A')}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {entry.location || t('未知地点', 'Unknown')}
                    </div>
                    <div className="mt-1 md:hidden max-w-[150px] truncate text-[11px] text-slate-500" title={entry.content}>
                      {entry.content}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/5"
                        style={{ backgroundColor: entry.mood_color }}
                      ></span>
                      <span className="text-slate-700 font-medium text-xs">
                        {isEnglish ? EMOTION_LABELS_EN[entry.emotion_label] || entry.emotion_label : entry.emotion_label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{isEnglish ? {
                      '学习任务': 'Academic Load',
                      '同伴互动': 'Peer Dynamics',
                      '校园环境': 'Campus Setting',
                      '身心状态': 'Body & Mind',
                      '目标压力': 'Goal Pressure',
                      '未补充': 'Not tagged'
                    }[categoryLabel] || categoryLabel : categoryLabel}</div>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-3 relative">
                    <div className="truncate max-w-[180px] lg:max-w-[260px] text-slate-600 group-hover:text-slate-900 transition-colors" title={entry.content}>
                      {entry.content}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${entry.risk_level === 'High'
                        ? 'bg-red-100 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                    >
                      {entry.risk_level === 'High' ? t('高风险', 'High Risk') : t('正常', 'Normal')}
                    </span>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
