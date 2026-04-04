import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Radar, RadarChart, PolarAngleAxis, PolarRadiusAxis, PolarGrid, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { MoodEntry, PortalClass } from '../types';
import { FileSpreadsheet, RefreshCw, Users, Activity, Radar as RadarIcon } from 'lucide-react';
import { DetailedLogTable } from './DetailedLogTable';
import { GlassCard } from './GlassCard';
import { AIAdvicePanel } from './AIAdvicePanel';
import { SCHOOL_STRUCTURE } from './SchoolStructure';
import { useDemoI18n } from './DemoLanguageContext';
const WeeklyReportPanel = lazy(() => import('./WeeklyReportPanel'));

const formatFaculty = (key: string) => {
  // @ts-ignore
  return SCHOOL_STRUCTURE[key]?.name || key;
};

const FALLBACK_PORTAL_CLASSES: PortalClass[] = Object.entries(SCHOOL_STRUCTURE).flatMap(([faculty, value], facultyIndex) =>
  value.classes.map((classId, classIndex) => ({
    class_id: classId,
    faculty,
    default_location: 'defaultLocation' in value ? value.defaultLocation : 'AQ1',
    sort_order: facultyIndex * 100 + classIndex + 1,
    is_active: 1
  }))
);

export const TeacherDashboard: React.FC = () => {
  const { t } = useDemoI18n();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [portalClasses, setPortalClasses] = useState<PortalClass[]>(FALLBACK_PORTAL_CLASSES);

  // New Selectors
  const [selectedFaculty, setSelectedFaculty] = useState<string>('CNC');
  const [selectedClass, setSelectedClass] = useState<string>(FALLBACK_PORTAL_CLASSES.find((item) => item.faculty === 'CNC')?.class_id || '');

  const facultyOptions = useMemo(
    () => Array.from(new Set(portalClasses.map((item) => item.faculty))),
    [portalClasses]
  );

  const classesForFaculty = useMemo(
    () => portalClasses.filter((item) => item.faculty === selectedFaculty),
    [portalClasses, selectedFaculty]
  );

  useEffect(() => {
    const loadPortalClasses = async () => {
      try {
        const rows = await api.classes.list();
        if (rows?.length) {
          setPortalClasses(rows);
        }
      } catch (error) {
        console.error('Failed to load portal classes', error);
      }
    };
    loadPortalClasses();
  }, []);

  useEffect(() => {
    const hasFaculty = facultyOptions.includes(selectedFaculty);
    if (!hasFaculty && facultyOptions.length > 0) {
      setSelectedFaculty(facultyOptions[0]);
      return;
    }

    const availableInFaculty = portalClasses.filter((item) => item.faculty === selectedFaculty);
    if (availableInFaculty.length === 0 && portalClasses.length > 0) {
      setSelectedClass(portalClasses[0].class_id);
      return;
    }

    const hasSelectedClass = availableInFaculty.some((item) => item.class_id === selectedClass);
    if (!hasSelectedClass && availableInFaculty[0]) {
      setSelectedClass(availableInFaculty[0].class_id);
    }
  }, [facultyOptions, portalClasses, selectedFaculty, selectedClass]);

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const classData = await api.teacher.getClassStats(selectedClass);
      const radar = await api.teacher.getRadarData(selectedClass);
      const activity = await api.teacher.getActivityVolume(selectedClass);

      setEntries(classData.entries);
      setRadarData(radar);
      setActivityData(activity);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
      if (!silent) setIsRefreshing(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshData]);

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const faculty = e.target.value;
    setSelectedFaculty(faculty);
    const nextClass = portalClasses.find((item) => item.faculty === faculty)?.class_id;
    if (nextClass) setSelectedClass(nextClass);
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in duration-500 font-sans w-full">
      <Suspense fallback={null}>
        <WeeklyReportPanel
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          role="Teacher"
          scopeId={selectedClass}
        />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-white/65 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
            {t('班级工作台', 'Class Workspace')}
          </span>
          <h1 className="text-[1.95rem] md:text-[2.15rem] font-semibold text-slate-800 flex items-center gap-3 tracking-tight">
            <Users className="text-indigo-600" size={28} />
            {t('教师管理面板', 'Teacher Dashboard')}
          </h1>
          <p className="text-slate-500 font-medium">{t(`当前聚焦 ${selectedClass} 的情绪走势、活跃度与决策建议。`, `Focusing on ${selectedClass}'s mood trends, activity, and recommended actions.`)}</p>
        </div>

        <div className="grid w-full xl:w-auto grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] gap-2 rounded-[28px] bg-white/72 backdrop-blur-2xl border border-white/55 shadow-[0_14px_36px_rgba(15,23,42,0.06)] px-3 py-3 mt-2 xl:mt-0 items-center">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold shadow-md hover:bg-slate-800 transition-all text-nowrap"
          >
            <React.Fragment>📊</React.Fragment> {t('班级周报', 'Class Weekly Report')}
          </button>

          <div className="flex flex-1 min-w-[220px] gap-2">
            <select
              value={selectedFaculty}
              onChange={handleFacultyChange}
              className="bg-white/88 border border-slate-200/90 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2.5 shadow-sm min-w-[104px] flex-1"
            >
              {facultyOptions.map((key) => (
                <option key={key} value={key}>
                  {formatFaculty(key)}
                </option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white/88 border border-slate-200/90 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2.5 shadow-sm min-w-[112px] flex-1"
            >
              {classesForFaculty.map((item) => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => api.export.downloadXlsx(selectedClass)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/20 rounded-full text-sm font-semibold transition-all text-nowrap"
          >
            <FileSpreadsheet size={16} /> {t('导出班级数据', 'Export Class Data')}
          </button>

          <button
            onClick={() => refreshData()}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/82 hover:bg-white text-slate-700 border border-slate-200/80 rounded-full text-sm font-semibold transition-all text-nowrap disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> {t('刷新', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Top Row: Charts (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

        {/* Chart 1: Radar (Mood Dimensions) */}
        <GlassCard className="p-5 md:p-6 h-[280px] md:h-[310px] flex flex-col relative group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base md:text-lg">
              <RadarIcon size={20} className="text-indigo-500" />
              {t('情绪维度分析', 'Mood Dimension Analysis')}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-white/72 border border-white/65 px-2.5 py-1 rounded-full">{t('平均分', 'Average')}</span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="54%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.28)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickCount={6} />
                <Radar
                  name="Class Average"
                  dataKey="A"
                  stroke="#6366f1"
                  strokeWidth={3.5}
                  fill="#6366f1"
                  fillOpacity={0.28}
                  isAnimationActive={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart 2: Activity Volume (Bar) */}
        <GlassCard className="p-5 md:p-6 h-[280px] md:h-[310px] flex flex-col relative group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base md:text-lg">
              <Activity size={20} className="text-emerald-500" />
              {t('每日提交活跃度', 'Daily Submission Activity')}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-white/72 border border-white/65 px-2.5 py-1 rounded-full">{t('近7天', 'Last 7 Days')}</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} barSize={24}>
                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  width={26}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#34d399"
                  radius={[6, 6, 6, 6]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* AI Advice Section */}
      <div className="grid grid-cols-1">
        <div className="h-[280px] md:h-[310px]">
          <AIAdvicePanel title={t('班级 AI 决策建议', 'AI Decision Support for the Class')} role="Teacher" scopeId={selectedClass} />
        </div>
      </div>

      {/* Detail Table */}
      <GlassCard className="p-0 overflow-hidden h-[360px] md:h-[430px] xl:h-[500px]">
        <DetailedLogTable
          initialEntries={entries}
          title={t(`${selectedClass} 班级日志详情`, `${selectedClass} Log Details`)}
          defaultClassId={selectedClass}
          showFilters={true}
          embedded={true}
        />
      </GlassCard>

    </div>
  );
};
