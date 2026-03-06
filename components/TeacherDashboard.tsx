import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Radar, RadarChart, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { api } from '../services/api';
import { MoodEntry } from '../types';
import { FileSpreadsheet, Users, Activity, Radar as RadarIcon } from 'lucide-react';
import { DetailedLogTable } from './DetailedLogTable';
import { GlassCard } from './GlassCard';
import { AIAdvicePanel } from './AIAdvicePanel';
import { SCHOOL_STRUCTURE } from './SchoolStructure';
import WeeklyReportPanel from './WeeklyReportPanel';

const formatFaculty = (key: string) => {
  // @ts-ignore
  return SCHOOL_STRUCTURE[key]?.name || key;
};

export const TeacherDashboard: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  // New Selectors
  const [selectedFaculty, setSelectedFaculty] = useState<string>('CNC');
  const [selectedClass, setSelectedClass] = useState<string>(SCHOOL_STRUCTURE.CNC.classes[0]);

  const refreshData = async () => {
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
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [selectedClass]); // Refresh when class changes

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const faculty = e.target.value;
    setSelectedFaculty(faculty);
    // @ts-ignore
    setSelectedClass(SCHOOL_STRUCTURE[faculty].classes[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans w-full">
      <WeeklyReportPanel
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        role="Teacher"
        scopeId={selectedClass}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
            <Users className="text-indigo-600" size={28} />
            教师管理面板
          </h1>
          <p className="text-slate-500 font-medium">查看 {selectedClass} 班级的情绪动态与分析</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-indigo-500 transition-all text-nowrap"
          >
            <React.Fragment>📊</React.Fragment> 班级周报
          </button>

          <div className="flex gap-2">
            <select
              value={selectedFaculty}
              onChange={handleFacultyChange}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm min-w-[100px]"
            >
              {Object.keys(SCHOOL_STRUCTURE).map((key) => (
                <option key={key} value={key}>
                  {formatFaculty(key)}
                </option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 shadow-sm min-w-[100px]"
            >
              {/* @ts-ignore */}
              {SCHOOL_STRUCTURE[selectedFaculty].classes.map((cls: string) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => api.export.downloadXlsx(selectedClass)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/20 rounded-full text-sm font-bold transition-all text-nowrap"
          >
            <FileSpreadsheet size={16} /> 导出班级数据
          </button>
        </div>
      </div>

      {/* Top Row: Charts (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Chart 1: Radar (Mood Dimensions) */}
        <GlassCard className="p-6 min-h-[350px] md:h-[420px] flex flex-col relative group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <RadarIcon size={20} className="text-indigo-500" />
              情绪维度分析
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">平均分</span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Class Average"
                  dataKey="A"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="#6366f1"
                  fillOpacity={0.2}
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
        <GlassCard className="p-6 min-h-[350px] md:h-[420px] flex flex-col relative group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <Activity size={20} className="text-emerald-500" />
              每日提交活跃度
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">近7天</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} barSize={32}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#34d399"
                  radius={[6, 6, 6, 6]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* AI Advice Section */}
      <div className="grid grid-cols-1">
        <AIAdvicePanel title="班级 AI 决策建议" role="Teacher" scopeId={selectedClass} />
      </div>

      {/* Detail Table */}
      <GlassCard className="p-0 overflow-hidden">
        <DetailedLogTable
          initialEntries={entries}
          title={`${selectedClass} 班级日志详情`}
          showFilters={true}
        />
      </GlassCard>

    </div>
  );
};