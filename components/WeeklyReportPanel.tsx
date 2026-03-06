import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { X, Calendar, TrendingUp, PieChart as PieIcon, Activity, Sparkles, AlertTriangle, Download, FileImage, FileText } from 'lucide-react';
import { api } from '../services/api';
import { AdminMap } from './AdminMap';
import { toPng } from 'html-to-image';
import { pdf } from '@react-pdf/renderer';
import { WeeklyReportPDF } from './reports/WeeklyReportPDF';

interface WeeklyReportPanelProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'Teacher' | 'Admin';
    scopeId: string;
}

const WeeklyReportPanel: React.FC<WeeklyReportPanelProps> = ({ isOpen, onClose, role, scopeId }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Refs for capturing charts
    const trendRef = useRef<HTMLDivElement>(null);
    const pieRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadReport();
        }
    }, [isOpen, role, scopeId]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await api.ai.getWeeklyReport(role, scopeId);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: 'png' | 'pdf') => {
        if (!data) return;
        setExporting(true);

        // Wait for charts/map to render/animate (increased to 1.5s for 3D map stability)
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Options for capture (Fonts should work now with crossorigin in index.html)
            const captureOptions: any = {
                quality: 0.95,
                backgroundColor: '#ffffff'
            };

            if (type === 'png') {
                if (!contentRef.current) return;
                const dataUrl = await toPng(contentRef.current, {
                    ...captureOptions,
                    width: contentRef.current.scrollWidth,
                    height: contentRef.current.scrollHeight,
                    style: { height: 'auto', maxHeight: 'none', overflow: 'visible' }
                });
                const link = document.createElement('a');
                link.download = `Weekly_Report_${role}_${scopeId}.png`;
                link.href = dataUrl;
                link.click();
            } else {
                // PDF Vector Export

                // 1. Capture Charts as Images
                const chartImages: any = {};
                // Increase pixelRatio for better quality in PDF
                const chartOpts = { ...captureOptions, quality: 1, pixelRatio: 2 };

                if (trendRef.current) chartImages.trend = await toPng(trendRef.current, chartOpts);
                if (pieRef.current) chartImages.composition = await toPng(pieRef.current, chartOpts);
                if (barRef.current) chartImages.category = await toPng(barRef.current, chartOpts);
                if (mapRef.current) chartImages.heatmap = await toPng(mapRef.current, chartOpts);

                // 2. Prepare Data
                const reportData = {
                    title: role === 'Admin' ? '全校情绪周报' : '班级情绪周报',
                    scope: scopeId,
                    date: new Date().toLocaleDateString(),
                    aiSummary: data.aiSummary,
                    stats: {
                        total: data.total,
                        risk: data.risk,
                        avgScore: data.trend && data.trend.length > 0 ? (data.trend.reduce((a: any, b: any) => a + b.score, 0) / data.trend.length).toFixed(1) : '-',
                        negRatio: data.composition ? `${Math.round(data.composition.find((c: any) => c.name === '消极')?.value / data.total * 100) || 0}%` : '0%'
                    },
                    charts: chartImages
                };

                // 3. Generate PDF Blob
                const blob = await pdf(<WeeklyReportPDF data={reportData} />).toBlob();
                const url = URL.createObjectURL(blob);

                // 4. Download
                const link = document.createElement('a');
                link.href = url;
                link.download = `MindLink_Report_${role}_${scopeId}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error("Export failed", error);
            alert("导出失败，请重试");
        } finally {
            setExporting(false);
        }
    };

    // Calculate Heatmap Data for Admin
    const heatmapData = React.useMemo(() => {
        if (role !== 'Admin' || !data?.categoryStats) return undefined;
        return data.categoryStats.map((stat: any) => {
            const riskScore = Math.max(0, Math.min(1, (5 - stat.score) / 4));
            const color = stat.score < 2.5 ? '#ef4444' : stat.score < 4 ? '#f59e0b' : '#10b981';
            return {
                location: stat.subject,
                riskScore: riskScore,
                recentMoods: [color, color, color]
            };
        });
    }, [data, role]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/90 backdrop-blur-xl w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/40"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Weekly Insight
                                </span>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <Calendar size={14} /> 本周概览
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {role === 'Admin' ? '全校情绪周报' : '班级情绪周报'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 print:hidden">
                            <button
                                onClick={() => handleExport('png')}
                                disabled={exporting || loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                                title="导出为图片"
                            >
                                {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div> : <FileImage size={16} />}
                                PNG
                            </button>
                            {/* PDF Export Temporarily Disabled */}
                            {false && (
                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={exporting || loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                                    title="导出为PDF"
                                >
                                    {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div> : <FileText size={16} />}
                                    PDF
                                </button>
                            )}
                            <div className="w-px h-6 bg-slate-300 mx-1"></div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div id="weekly-report-content" ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-slate-50/50 print:overflow-visible print:h-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : data ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">

                                {/* 1. AI Summary Section (Full Width) */}
                                <div className="lg:col-span-12">
                                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-lg">
                                        <div className="bg-white/95 backdrop-blur-3xl rounded-[14px] p-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Sparkles size={120} />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="bg-indigo-50 p-3 rounded-2xl h-fit shrink-0">
                                                    <Sparkles className="text-indigo-500" size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-800 mb-2">AI 智能决策建议</h3>
                                                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium">
                                                        {data.aiSummary}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Key Metrics Row */}
                                <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="总记录数" value={data.total} color="bg-blue-50 text-blue-600" />
                                    <StatCard label="高风险警报" value={data.risk} color="bg-red-50 text-red-600" icon={<AlertTriangle size={18} />} />
                                    <StatCard label="平均情绪分" value={data.trend && data.trend.length > 0 ? (data.trend.reduce((a: any, b: any) => a + b.score, 0) / data.trend.length).toFixed(1) : '-'} color="bg-green-50 text-green-600" />
                                    <StatCard label="消极占比" value={data.composition ? `${Math.round(data.composition.find((c: any) => c.name === '消极')?.value / data.total * 100) || 0}%` : '0%'} color="bg-orange-50 text-orange-600" />
                                </div>

                                {/* 3. Trend Chart (Large) */}
                                <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <TrendingUp size={18} className="text-blue-500" /> 情绪指数走势 (本周)
                                        </h3>
                                    </div>
                                    <div ref={trendRef} className="h-[300px] w-full bg-white">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.trend} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                                    dy={10}
                                                    interval={0}
                                                    padding={{ left: 20, right: 20 }}
                                                />
                                                <YAxis domain={[0, 5]} hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    cursor={{ stroke: '#CBD5E1', strokeWidth: 2 }}
                                                />
                                                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 4. Composition Chart (Pie) */}
                                <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <PieIcon size={18} className="text-purple-500" /> 情绪构成
                                        </h3>
                                    </div>
                                    <div ref={pieRef} className="h-[300px] relative bg-white">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.composition}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {data.composition.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Center Label */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-slate-800">{data.total}</div>
                                                <div className="text-xs text-slate-400">Total</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Category/Regional Bar Chart */}
                                <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <Activity size={18} className="text-orange-500" />
                                            {role === 'Admin' ? '区域情绪反馈指数 (最低Top6)' : '分类情绪反馈指数'}
                                        </h3>
                                    </div>
                                    <div ref={barRef} className="h-[250px] w-full bg-white">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.categoryStats} layout="vertical" margin={{ left: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                                <XAxis type="number" domain={[0, 5]} hide />
                                                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px' }} />
                                                <Bar dataKey="score" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 3. Admin Heatmap (Admin Only) */}
                                {role === 'Admin' && heatmapData && (
                                    <div className="lg:col-span-12">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                                            <Activity size={18} className="text-red-500" />
                                            校园负面情绪热力图 (本周累积)
                                        </h3>
                                        <div ref={mapRef} className="h-[500px] w-full border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                            <AdminMap heatmapData={heatmapData} disableFetch={true} />
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-20">暂无数据</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const StatCard = ({ label, value, color, icon }: any) => (
    <div className={`p-5 rounded-2xl ${color} bg-opacity-10 flex flex-col items-center justify-center text-center gap-1`}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-semibold opacity-80 uppercase tracking-wide flex items-center gap-1">
            {icon} {label}
        </div>
    </div>
);

export default WeeklyReportPanel;
