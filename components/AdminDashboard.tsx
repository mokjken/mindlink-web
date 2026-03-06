import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { School, Activity, Sparkles, Zap } from 'lucide-react';
import { AdminMap } from './AdminMap';
import { DetailedLogTable } from './DetailedLogTable';
import { MoodEntry } from '../types';

import { GlassCard } from './GlassCard';
import { AIAdvicePanel } from './AIAdvicePanel';

import WeeklyReportPanel from './WeeklyReportPanel';

// Wrapper to adapt Props
const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}> = ({ children, className = '', title, icon }) => (
  <GlassCard className={`flex flex-col ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-white/20 flex items-center gap-2">
        {icon && <span className="text-slate-600">{icon}</span>}
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
    )}
    <div className="flex-1 min-h-0 relative">
      {children}
    </div>
  </GlassCard>
);

export const AdminDashboard: React.FC = () => {
  const [stackedData, setStackedData] = useState<any[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setStackedData(await api.admin.getStackedData());
      const allClassData = await api.teacher.getClassStats('3-A');
      setEntries(allClassData.entries);
    };
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-auto md:h-[calc(100vh-160px)] flex flex-col w-full">
      <WeeklyReportPanel
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        role="Admin"
        scopeId="All"
      />

      {/* Header */}
      <div className="flex flex-wrap justify-end gap-3 mb-4 px-2">
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-indigo-500 transition-all"
        >
          <React.Fragment>📊</React.Fragment> 情绪周报
        </button>
        <button
          onClick={() => api.export.downloadXlsx()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-full text-sm font-bold shadow-lg hover:bg-slate-700 transition-all"
        >
          <React.Fragment>📥</React.Fragment> 导出全校数据
        </button>
      </div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-5 gap-6 h-full pb-4">

        {/* Card 1: 3D Map (Top Left) */}
        <BentoCard className="md:col-span-8 md:row-span-3 min-h-[400px] md:min-h-0 relative group" title="空间风险分析" icon={<School size={18} />}>
          <div className="absolute inset-0">
            <AdminMap />
          </div>
        </BentoCard>

        {/* Card 2: Real-time Feed (Top Right) - Reduced height */}
        <BentoCard className="md:col-span-4 md:row-span-3 min-h-[350px] md:min-h-0 bg-white/60" title="实时警报" icon={<Zap size={18} />}>
          <div className="h-full overflow-hidden">
            <DetailedLogTable
              initialEntries={entries}
              title=""
              showFilters={true}
            />
          </div>
        </BentoCard>

        {/* Card 3: Regional Stats (Bottom Left) */}
        <BentoCard className="md:col-span-4 md:row-span-2 min-h-[300px] md:min-h-0" title="区域心情分布" icon={<Activity size={18} />}>
          <div className="p-4 h-full">
            {stackedData && stackedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval={0}
                    tickFormatter={(val) => val.length > 4 ? val.slice(0, 4) : val}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="Positive" stackId="a" fill="#34d399" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Risk" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                暂无区域数据
              </div>
            )}
          </div>
        </BentoCard>

        {/* Card 4: AI Strategic Insights (Bottom Right - EXTRA WIDE) */}
        <div className="md:col-span-8 md:row-span-2">
          <AIAdvicePanel
            title="AI 战略决策助手"
            role="Admin"
            scopeId="All"
          />
        </div>

      </div>
    </div>
  );
};