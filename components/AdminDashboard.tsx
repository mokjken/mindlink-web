import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { School, Activity, Zap } from 'lucide-react';
import { AdminMap } from './AdminMap';
import { DetailedLogTable } from './DetailedLogTable';
import { MoodEntry } from '../types';

import { GlassCard } from './GlassCard';
import { AIAdvicePanel } from './AIAdvicePanel';
import { useDemoI18n } from './DemoLanguageContext';

const WeeklyReportPanel = lazy(() => import('./WeeklyReportPanel'));

// Wrapper to adapt Props
const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}> = ({ children, className = '', title, icon }) => (
  <GlassCard className={`flex flex-col ${className}`}>
    {title && (
      <div className="px-5 py-3.5 border-b border-white/30 flex items-center gap-2">
        {icon && <span className="text-slate-600">{icon}</span>}
        <h3 className="font-semibold text-slate-800 tracking-tight">{title}</h3>
      </div>
    )}
    <div className="flex-1 min-h-0 relative">
      {children}
    </div>
  </GlassCard>
);

export const AdminDashboard: React.FC = () => {
  const { t } = useDemoI18n();
  const [stackedData, setStackedData] = useState<any[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [showReport, setShowReport] = useState(false);
  const liveFeedEntries = useMemo(
    () => entries.slice(0, 12),
    [entries]
  );

  useEffect(() => {
    const fetchData = async () => {
      setStackedData(await api.admin.getStackedData());
      const allEntries = await api.logs.search({});
      setEntries(allEntries);
    };
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-5 md:space-y-6">
      <Suspense fallback={null}>
        <WeeklyReportPanel
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          role="Admin"
          scopeId="All"
        />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-white/65 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
            {t('校级总览', 'School Overview')}
          </span>
          <h1 className="text-[1.95rem] md:text-[2.15rem] font-semibold text-slate-800 tracking-tight">
            {t('管理端工作台', 'Admin Workspace')}
          </h1>
          <p className="text-slate-500 font-medium">{t('查看空间风险、实时日志与 AI 决策建议，快速判断校园整体状态。', 'Review spatial risk, live logs, and AI recommendations to quickly assess the whole campus.')}</p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-[28px] bg-white/72 backdrop-blur-2xl border border-white/55 shadow-[0_14px_36px_rgba(15,23,42,0.06)] px-3 py-3">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold shadow-md hover:bg-slate-800 transition-all"
          >
            <React.Fragment>📊</React.Fragment> {t('情绪周报', 'Emotion Weekly Report')}
          </button>
          <button
            onClick={() => api.export.downloadXlsx()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/88 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold shadow-sm hover:bg-white transition-all"
          >
            <React.Fragment>📥</React.Fragment> {t('导出全校数据', 'Export School Data')}
          </button>
        </div>
      </div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="space-y-5 pb-2">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: 3D Map (Top Left) */}
        <BentoCard className="md:col-span-8 h-[360px] md:h-[430px] xl:h-[500px] relative group" title={t('空间风险分析', 'Spatial Risk Analysis')} icon={<School size={18} />}>
          <div className="absolute inset-0">
            <AdminMap embedded />
          </div>
        </BentoCard>

        {/* Card 2: Real-time Feed */}
        <BentoCard className="md:col-span-4 h-[360px] md:h-[430px] xl:h-[500px] bg-white/55" title={t('实时警报', 'Live Alerts')} icon={<Zap size={18} />}>
          <div className="h-full min-h-0 p-3">
            <DetailedLogTable
              initialEntries={liveFeedEntries}
              title=""
              showFilters={true}
              embedded={true}
              maskUserIds={false}
              showClassId={true}
            />
          </div>
        </BentoCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Card 3: Regional Stats (Bottom Left) */}
        <BentoCard className="md:col-span-4 h-[280px] md:h-[310px]" title={t('区域心情分布', 'Regional Mood Distribution')} icon={<Activity size={18} />}>
          <div className="p-4 h-full min-h-[240px]">
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
                {t('暂无区域数据', 'No regional data yet')}
              </div>
            )}
          </div>
        </BentoCard>

        {/* Card 4: AI Strategic Insights (Bottom Right - EXTRA WIDE) */}
        <div className="md:col-span-8 h-[280px] md:h-[310px]">
          <AIAdvicePanel
            title={t('AI 战略决策助手', 'AI Strategic Decision Assistant')}
            role="Admin"
            scopeId="All"
          />
        </div>
        </div>

      </div>
    </div>
  );
};
