import React, { useState, useEffect } from 'react';
import { MoodEntry } from '../types';
import { AlertCircle, Clock, MapPin, Search, Filter, Calendar } from 'lucide-react';
import { api } from '../services/api';

interface DetailedLogTableProps {
  initialEntries?: MoodEntry[]; // Optional initial data
  title: string;
  defaultClassId?: string; // If provided, locks search to this class
  showFilters?: boolean;
}

export const DetailedLogTable: React.FC<DetailedLogTableProps> = ({
  initialEntries = [],
  title,
  defaultClassId,
  showFilters = true
}) => {
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">

        {/* Header Row */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {riskFilter === 'High' && <AlertCircle size={16} className="text-red-500" />}
            {title}
            <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          </h3>

          {isSearching && <div className="text-xs text-indigo-500 animate-pulse font-medium">搜索中...</div>}
        </div>

        {/* Filters Row */}
        {showFilters && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索日志... (内容, 地点)"
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setRiskFilter('All')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${riskFilter === 'All' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                全部
              </button>
              <button
                onClick={() => setRiskFilter('Normal')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${riskFilter === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                正常
              </button>
              <button
                onClick={() => setRiskFilter('High')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${riskFilter === 'High' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                高风险
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-sm">
            <tr>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">用户 / 地点</th>
              <th className="px-4 py-3">心情</th>
              <th className="px-4 py-3 w-1/3">内容</th>
              <th className="px-4 py-3 text-right">风险</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <Search size={20} />
                  </div>
                  <p>无匹配记录 found.</p>
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700">{entry.user_id}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {entry.location || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/5"
                        style={{ backgroundColor: entry.mood_color }}
                      ></span>
                      <span className="text-slate-700 font-medium text-xs">{entry.emotion_label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{entry.category}</div>
                  </td>
                  <td className="px-4 py-3 relative">
                    <div className="truncate max-w-[200px] text-slate-600 group-hover:text-slate-900 transition-colors" title={entry.content}>
                      {entry.content}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${entry.risk_level === 'High'
                        ? 'bg-red-100 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                    >
                      {entry.risk_level === 'High' ? '高风险' : '正常'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};