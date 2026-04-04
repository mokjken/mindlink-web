import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { ActualPortalUserRow, ClassBreakdownRow, ConsoleAnalytics, ConsoleHistoryItem, PortalClass, UploadRankingRow } from '../types';
import { GlassCard } from './GlassCard';
import { Activity, ArchiveRestore, BarChart3, Clock3, DatabaseZap, Download, Eraser, ListFilter, Plus, RefreshCw, ShieldCheck, Trash2, Users, Waves } from 'lucide-react';

const facultyOptions = ['CNC', 'AA', 'Custom'];
const historyFeatureOptions = [
  { value: 'all', label: '全部功能' },
  { value: 'mood_bubble', label: '情绪气泡' },
  { value: 'status_community', label: '情绪社区' }
] as const;
const injectCountOptions = [8, 16, 24, 40];

const formatHistoryTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const formatPortalTime = (timestamp?: number | null) =>
  timestamp
    ? new Date(timestamp).toLocaleString([], {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '未完成';

const MetricCard: React.FC<{ label: string; value: string | number; tone?: 'amber' | 'blue' | 'slate' | 'emerald' }> = ({
  label,
  value,
  tone = 'slate'
}) => {
  const toneClasses = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  } as const;

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-2xl font-semibold tracking-tight ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
};

const RankingTable: React.FC<{ title: string; rows: UploadRankingRow[]; accent: string }> = ({ title, rows, accent }) => (
  <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/60 bg-white/68">
    <div className="flex items-center justify-between border-b border-white/50 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <span className="rounded-full border border-white/70 bg-white/82 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{rows.length}</span>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto">
      {rows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">暂无上传数据</div>
      ) : (
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            <tr>
              <th className="px-4 py-3">排名</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">班级</th>
              <th className="px-4 py-3 text-right">次数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {rows.map((row) => (
              <tr key={`${title}-${row.rank}-${row.user_id}`} className="text-sm text-slate-700">
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: accent }}>
                    {row.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{row.user_id}</td>
                <td className="px-4 py-3 text-slate-500">{row.class_id}</td>
                <td className="px-4 py-3 text-right font-semibold">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const ClassBreakdownTable: React.FC<{ rows: ClassBreakdownRow[] }> = ({ rows }) => (
  <div className="h-full min-h-0 overflow-y-auto rounded-[24px] border border-white/60 bg-white/68">
    <table className="w-full text-left">
      <thead className="sticky top-0 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        <tr>
          <th className="px-4 py-3">班级</th>
          <th className="px-4 py-3">气泡</th>
          <th className="px-4 py-3">社区</th>
          <th className="px-4 py-3">参与人数</th>
          <th className="px-4 py-3">高风险</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100/80 text-sm">
        {rows.map((row) => (
          <tr key={row.class_id} className="text-slate-700">
            <td className="px-4 py-3">
              <div className="font-semibold">{row.class_id}</div>
              <div className="text-[11px] text-slate-400">{row.faculty}</div>
            </td>
            <td className="px-4 py-3 font-semibold text-amber-600">{row.bubbleCount}</td>
            <td className="px-4 py-3 font-semibold text-blue-600">{row.communityCount}</td>
            <td className="px-4 py-3">{row.uniqueUsers}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.highRiskCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {row.highRiskCount}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChartEmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-white/35 text-sm font-medium text-slate-400">
    {message}
  </div>
);

const HoverHint: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 whitespace-nowrap rounded-2xl border border-white/80 bg-slate-950/88 px-3 py-2 text-[11px] font-medium text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] opacity-0 transition duration-150 group-hover:opacity-100 ${className}`}>
    {children}
  </div>
);

const FeatureMixPanel: React.FC<{ bubbleUploads: number; communityUploads: number }> = ({ bubbleUploads, communityUploads }) => {
  const total = bubbleUploads + communityUploads;
  if (!total) {
    return <ChartEmptyState message="功能使用占比会在出现真实上传后显示。" />;
  }

  const bubbleRatio = (bubbleUploads / total) * 100;
  const communityRatio = (communityUploads / total) * 100;

  return (
    <div className="flex h-full flex-col justify-center gap-5 rounded-[24px] border border-white/60 bg-white/55 p-5">
      <div className="group relative">
        <HoverHint>情绪气泡 {bubbleUploads} 次，占比 {bubbleRatio.toFixed(1)}%</HoverHint>
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-600">
          <span>情绪气泡</span>
          <span>{bubbleUploads}</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-amber-400" style={{ width: `${bubbleRatio}%` }} />
        </div>
        <div className="mt-2 text-xs font-semibold text-amber-600">{bubbleRatio.toFixed(1)}%</div>
      </div>

      <div className="group relative">
        <HoverHint>情绪社区 {communityUploads} 次，占比 {communityRatio.toFixed(1)}%</HoverHint>
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-600">
          <span>情绪社区</span>
          <span>{communityUploads}</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-blue-500" style={{ width: `${communityRatio}%` }} />
        </div>
        <div className="mt-2 text-xs font-semibold text-blue-600">{communityRatio.toFixed(1)}%</div>
      </div>
    </div>
  );
};

const ClassRankingPanel: React.FC<{ rows: ClassBreakdownRow[] }> = ({ rows }) => {
  if (!rows.length || !rows.some((item) => item.totalCount > 0)) {
    return <ChartEmptyState message="班级活跃榜会在有上传后出现。" />;
  }

  const maxCount = Math.max(...rows.map((item) => item.totalCount), 1);
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-[24px] border border-white/60 bg-white/55 p-4">
      {rows.map((row) => (
        <div key={row.class_id} className="group relative space-y-2">
          <HoverHint className="min-w-[168px] text-left">
            <div>{row.class_id}</div>
            <div className="mt-1 text-white/80">总上传 {row.totalCount} 次</div>
            <div className="text-white/80">气泡 {row.bubbleCount} / 社区 {row.communityCount}</div>
            <div className="text-white/80">参与 {row.uniqueUsers} 人，高风险 {row.highRiskCount} 条</div>
          </HoverHint>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800">{row.class_id}</div>
              <div className="text-[11px] text-slate-400">{row.faculty}</div>
            </div>
            <div className="text-sm font-semibold text-slate-700">{row.totalCount}</div>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${(row.totalCount / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const WeeklyUsagePanel: React.FC<{ rows: ConsoleAnalytics['weeklyUsage'] }> = ({ rows }) => {
  if (!rows.length || !rows.some((item) => item.bubbleCount > 0 || item.statusCount > 0)) {
    return <ChartEmptyState message="近 7 天还没有上传数据。" />;
  }

  const maxValue = Math.max(1, ...rows.map((item) => Math.max(item.bubbleCount, item.statusCount)));

  return (
    <div className="grid h-full min-h-0 grid-cols-7 gap-3 rounded-[24px] border border-white/60 bg-white/55 p-4">
      {rows.map((row) => (
        <div key={row.date} className="group relative flex min-w-0 flex-col items-center justify-end gap-2">
          <HoverHint className="min-w-[148px] text-left">
            <div>{row.date}</div>
            <div className="mt-1 text-white/80">情绪气泡 {row.bubbleCount} 次</div>
            <div className="text-white/80">情绪社区 {row.statusCount} 次</div>
            <div className="text-white/80">气泡用户 {row.bubbleUsers} 人 / 社区用户 {row.statusUsers} 人</div>
          </HoverHint>
          <div className="flex h-full w-full items-end justify-center gap-1 rounded-[20px] bg-white/55 px-2 py-3">
            <div className="w-3 rounded-full bg-amber-400" style={{ height: `${(row.bubbleCount / maxValue) * 100}%` }} title={`气泡 ${row.bubbleCount}`} />
            <div className="w-3 rounded-full bg-blue-500" style={{ height: `${(row.statusCount / maxValue) * 100}%` }} title={`社区 ${row.statusCount}`} />
          </div>
          <div className="text-[11px] font-semibold text-slate-500">{row.date}</div>
        </div>
      ))}
    </div>
  );
};

const HistoryTable: React.FC<{ rows: ConsoleHistoryItem[] }> = ({ rows }) => (
  <div className="h-full min-h-0 overflow-y-auto rounded-[24px] border border-white/60 bg-white/68">
    {rows.length === 0 ? (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">当前筛选下还没有历史记录</div>
    ) : (
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          <tr>
            <th className="px-4 py-3">时间</th>
            <th className="px-4 py-3">功能</th>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">班级</th>
            <th className="px-4 py-3">内容</th>
            <th className="px-4 py-3">风险/地点</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 text-sm">
          {rows.map((row) => (
            <tr key={row.id} className="align-top text-slate-700">
              <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatHistoryTime(row.created_at)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.feature === 'mood_bubble' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  {row.feature === 'mood_bubble' ? '情绪气泡' : '情绪社区'}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold">{row.user_id}</td>
              <td className="px-4 py-3 text-slate-500">{row.class_id}</td>
              <td className="px-4 py-3">
                {row.feature === 'mood_bubble' ? (
                  <div className="space-y-1">
                    <div className="font-medium">{row.emotion_label || '未标记情绪'}</div>
                    <div className="max-w-[420px] text-slate-500">{row.content || '无备注内容'}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium">{row.custom_text || row.status_key || '社区状态'}</div>
                    <div className="text-slate-500">{row.status_key || '未命名状态'}</div>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {row.feature === 'mood_bubble' ? (
                  <div className="space-y-1">
                    <div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.risk_level === 'High' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {row.risk_level === 'High' ? '高风险' : '正常'}
                      </span>
                    </div>
                    <div className="text-slate-500">{row.location || '未标注地点'}</div>
                  </div>
                ) : (
                  <div className="text-slate-500">{row.location || '社区发布'}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const ActualPortalUsersTable: React.FC<{ rows: ActualPortalUserRow[] }> = ({ rows }) => (
  <div className="h-full min-h-0 overflow-y-auto rounded-[24px] border border-white/60 bg-white/68">
    {rows.length === 0 ? (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">还没有学生完成首次向导。</div>
    ) : (
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">班级</th>
            <th className="px-4 py-3">开始页</th>
            <th className="px-4 py-3">Guide 完成</th>
            <th className="px-4 py-3">最近更新</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80 text-sm">
          {rows.map((row) => (
            <tr key={`${row.user_id}-${row.portal_key}`} className="text-slate-700">
              <td className="px-4 py-3 font-semibold">{row.user_id}</td>
              <td className="px-4 py-3 text-slate-500">{row.class_id || '未绑定班级'}</td>
              <td className="px-4 py-3 text-slate-500">{formatPortalTime(row.start_seen_at)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  {formatPortalTime(row.guide_completed_at)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{formatPortalTime(row.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const ConsoleDashboard: React.FC = () => {
  const [classes, setClasses] = useState<PortalClass[]>([]);
  const [analytics, setAnalytics] = useState<ConsoleAnalytics | null>(null);
  const [historyRows, setHistoryRows] = useState<ConsoleHistoryItem[]>([]);
  const [actualUsers, setActualUsers] = useState<ActualPortalUserRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [newClassId, setNewClassId] = useState('');
  const [newFaculty, setNewFaculty] = useState('AA');
  const [newLocation, setNewLocation] = useState('AQ4');
  const [historyFeature, setHistoryFeature] = useState<'all' | 'mood_bubble' | 'status_community'>('all');
  const [historyClassId, setHistoryClassId] = useState('');
  const [manageClassId, setManageClassId] = useState('');
  const [injectCount, setInjectCount] = useState(16);
  const [actionState, setActionState] = useState<'idle' | 'clearing-class' | 'clearing-all' | 'injecting-class' | 'injecting-all' | 'clearing-injected-class' | 'clearing-injected-all' | 'backing-up-class' | 'backing-up-all' | 'clearing-actual-users'>('idle');
  const [managementMessage, setManagementMessage] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [classRows, analyticsRows, historyItems, actualUserRows] = await Promise.all([
        api.classes.list(),
        api.console.getAnalytics(7),
        api.console.getHistory({
          feature: historyFeature,
          class_id: historyClassId || undefined,
          limit: 200
        }),
        api.console.getActualUsers()
      ]);
      setClasses(classRows);
      setManageClassId((current) => {
        if (current && classRows.some((item) => item.class_id === current)) return current;
        return classRows[0]?.class_id || '';
      });
      setAnalytics(analyticsRows);
      setHistoryRows(historyItems);
      setActualUsers(actualUserRows);
      setLastRefreshedAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [historyClassId, historyFeature]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refreshAll]);

  const handleCreateClass = async () => {
    const classId = newClassId.trim();
    if (!classId) return;
    await api.classes.create({
      class_id: classId,
      faculty: newFaculty,
      default_location: newLocation || null
    });
    setNewClassId('');
    await refreshAll();
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm(`确认删除 ${classId} 吗？实际教师端的班级选择将同步移除。`)) return;
    await api.classes.remove(classId);
    await refreshAll();
  };

  const handleClearActualUsers = async () => {
    if (!window.confirm('确认清空全部学生端 Actual Portal 标记吗？这会让所有学生再次看到开始页和首次向导。')) return;
    await runManagementAction(
      'clearing-actual-users',
      () => api.console.clearActualUsers(),
      '已清空全部学生端标记。'
    );
  };

  const runManagementAction = useCallback(async (
    nextState: typeof actionState,
    runner: () => Promise<any>,
    successMessage: string
  ) => {
    setActionState(nextState);
    setManagementMessage(null);
    try {
      const result = await runner();
      if (result?.error) {
        setManagementMessage(`操作失败：${result.error}`);
      } else {
        setManagementMessage(successMessage);
        await refreshAll();
      }
    } finally {
      setActionState('idle');
    }
  }, [refreshAll]);

  const handleClearClassData = async () => {
    if (!manageClassId) return;
    if (!window.confirm(`确认删除 ${manageClassId} 的真实上传数据吗？这会清掉该班的情绪反馈、社区状态、相关统计和该班 AI 建议缓存。`)) return;
    await runManagementAction(
      'clearing-class',
      () => api.console.clearData({ scope: 'class', class_id: manageClassId }),
      `已删除 ${manageClassId} 的历史数据。`
    );
  };

  const handleClearAllData = async () => {
    if (!window.confirm('确认删除全校真实上传数据吗？这会清空情绪反馈、社区状态、相关统计缓存和 AI 建议缓存。')) return;
    await runManagementAction(
      'clearing-all',
      () => api.console.clearData({ scope: 'all' }),
      '已删除全校历史数据。'
    );
  };

  const handleInjectClassStatuses = async () => {
    if (!manageClassId) return;
    await runManagementAction(
      'injecting-class',
      () => api.console.injectStatuses({ scope: 'class', class_id: manageClassId, count: injectCount }),
      `已为 ${manageClassId} 注入 ${injectCount} 条情绪社区状态。`
    );
  };

  const handleInjectAllStatuses = async () => {
    await runManagementAction(
      'injecting-all',
      () => api.console.injectStatuses({ scope: 'all', count: injectCount }),
      `已为全校注入 ${injectCount} 条情绪社区状态。`
    );
  };

  const handleClearInjectedClassStatuses = async () => {
    if (!manageClassId) return;
    if (!window.confirm(`确认删除 ${manageClassId} 内所有注入的社区状态吗？只会删除 SYS- 注入状态，不会删除学生自己发布的状态。`)) return;
    await runManagementAction(
      'clearing-injected-class',
      () => api.console.clearInjectedStatuses({ scope: 'class', class_id: manageClassId }),
      `已清掉 ${manageClassId} 的注入社区状态。`
    );
  };

  const handleClearAllInjectedStatuses = async () => {
    if (!window.confirm('确认删除全校注入的社区状态吗？只会清掉 SYS- 注入状态，不会删除真实学生发布的社区状态。')) return;
    await runManagementAction(
      'clearing-injected-all',
      () => api.console.clearInjectedStatuses({ scope: 'all' }),
      '已清掉全校注入的社区状态。'
    );
  };

  const downloadBackupFile = async (scope: 'all' | 'class') => {
    const nextState = scope === 'class' ? 'backing-up-class' : 'backing-up-all';
    setActionState(nextState);
    setManagementMessage(null);
    try {
      const payload = await api.console.downloadBackup({
        scope,
        class_id: scope === 'class' ? manageClassId : undefined
      });
      if (payload?.error) {
        setManagementMessage(`备份失败：${payload.error}`);
        return;
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const suffix = scope === 'class' ? manageClassId : 'all';
      link.href = url;
      link.download = `mindlink-console-backup-${suffix}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setManagementMessage(scope === 'class' ? `已导出 ${manageClassId} 的备份文件。` : '已导出全校备份文件。');
    } finally {
      setActionState('idle');
    }
  };

  const classRanking = useMemo(
    () => (analytics?.classBreakdown || []).slice(0, 8),
    [analytics]
  );

  return (
    <div className="w-full space-y-6 pb-2">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-white/65 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
            Console Workspace
          </span>
          <h1 className="text-[2rem] font-semibold tracking-tight text-slate-800">MindLink Console</h1>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshedAt && (
            <span className="text-xs font-medium text-slate-400">
              更新于 {new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => refreshAll()}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? '刷新中...' : '刷新 Console'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="活跃班级" value={analytics?.metrics.activeClasses || 0} tone="slate" />
        <MetricCard label="7日气泡上传" value={analytics?.metrics.bubbleUploads || 0} tone="amber" />
        <MetricCard label="7日社区上传" value={analytics?.metrics.communityUploads || 0} tone="blue" />
        <MetricCard label="7日总上传" value={analytics?.metrics.totalUploads || 0} tone="emerald" />
        <MetricCard label="活跃用户" value={analytics?.metrics.activeUsers || 0} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="xl:col-span-4 min-w-0 p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">班级管理</h2>
              <p className="mt-1 text-sm text-slate-500">这里的增删会影响实际 teacher portal 的班级列表。</p>
            </div>
            <ShieldCheck className="text-emerald-500" size={22} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
            <input
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
              placeholder="新增班级 ID / 名称"
              className="min-w-0 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
            <select
              value={newFaculty}
              onChange={(e) => setNewFaculty(e.target.value)}
              className="min-w-0 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              {facultyOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="默认区域"
              className="min-w-0 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            />
            <button
              onClick={handleCreateClass}
              className="inline-flex min-w-[96px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              添加
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-[24px] border border-white/60 bg-white/68">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">班级</th>
                  <th className="px-4 py-3">学部</th>
                  <th className="px-4 py-3">区域</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-sm">
                {classes.map((item) => (
                  <tr key={item.class_id} className="text-slate-700">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{item.class_id}</td>
                    <td className="px-4 py-3 text-slate-500">{item.faculty}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.default_location || '未设定'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteClass(item.class_id)}
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="xl:col-span-8 p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">近一周上传趋势</h2>
              <p className="mt-1 text-sm text-slate-500">黄色代表情绪气泡上传，蓝色代表情绪社区发布。</p>
            </div>
            <Waves className="text-indigo-500" size={22} />
          </div>
          <div className="mt-4 flex-1 min-h-0">
            <WeeklyUsagePanel rows={analytics?.weeklyUsage || []} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 h-[380px] flex flex-col">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Actual Portal</h2>
            <p className="mt-1 text-sm text-slate-500">这里记录真实学生端里已经跑完 Guide 的“注册用户”。可用于核对实际启用人数，也可以统一清空首次使用标记。</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-2 text-xs font-semibold text-slate-500">
              <Users size={14} />
              已注册 {actualUsers.length} 人
            </span>
            <button
              onClick={handleClearActualUsers}
              disabled={actionState !== 'idle'}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              {actionState === 'clearing-actual-users' ? '清空中...' : '删除全部用户标记'}
            </button>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1">
          <ActualPortalUsersTable rows={actualUsers} />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">数据库管理</h2>
            <p className="mt-1 text-sm text-slate-500">这里直接作用于真实校园 3 个 Portal 的数据库。删除会清掉历史数据；注入只会生成情绪社区状态，不会碰情绪反馈数据。</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-2 text-xs font-semibold text-slate-500">
            <DatabaseZap size={14} />
            真实 Portal 数据操作
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-3 space-y-3 rounded-[24px] border border-white/60 bg-white/64 p-4">
            <div className="text-sm font-semibold text-slate-800">目标范围</div>
            <select
              value={manageClassId}
              onChange={(e) => setManageClassId(e.target.value)}
              className="w-full rounded-[22px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              {classes.map((item) => (
                <option key={item.class_id} value={item.class_id}>{item.class_id}</option>
              ))}
            </select>
            <select
              value={injectCount}
              onChange={(e) => setInjectCount(Number(e.target.value))}
              className="w-full rounded-[22px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              {injectCountOptions.map((count) => (
                <option key={count} value={count}>注入 {count} 条社区状态</option>
              ))}
            </select>
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/40 px-4 py-3 text-xs leading-6 text-slate-500">
              删除是永久操作。注入只会往 `情绪社区` 写入状态流，用于测试社区活跃度，不会制造新的情绪反馈记录。
            </div>
          </div>

          <div className="xl:col-span-3 space-y-3 rounded-[24px] border border-rose-100 bg-rose-50/55 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Eraser size={16} className="text-rose-500" />
              删除真实数据
            </div>
            <button
              onClick={handleClearClassData}
              disabled={actionState !== 'idle' || !manageClassId}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              {actionState === 'clearing-class' ? '删除中...' : '删除本班数据'}
            </button>
            <button
              onClick={handleClearAllData}
              disabled={actionState !== 'idle'}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              {actionState === 'clearing-all' ? '删除中...' : '删除全校数据'}
            </button>
          </div>

          <div className="xl:col-span-3 space-y-3 rounded-[24px] border border-blue-100 bg-blue-50/55 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Plus size={16} className="text-blue-500" />
              注入情绪社区数据
            </div>
            <button
              onClick={handleInjectClassStatuses}
              disabled={actionState !== 'idle' || !manageClassId}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} />
              {actionState === 'injecting-class' ? '注入中...' : '注入本班社区数据'}
            </button>
            <button
              onClick={handleInjectAllStatuses}
              disabled={actionState !== 'idle'}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} />
              {actionState === 'injecting-all' ? '注入中...' : '注入全校社区数据'}
            </button>
          </div>

          <div className="xl:col-span-3 space-y-3 rounded-[24px] border border-amber-100 bg-amber-50/55 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ArchiveRestore size={16} className="text-amber-500" />
              注入清理与备份
            </div>
            <button
              onClick={handleClearInjectedClassStatuses}
              disabled={actionState !== 'idle' || !manageClassId}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              {actionState === 'clearing-injected-class' ? '删除中...' : '删除本班注入社区'}
            </button>
            <button
              onClick={handleClearAllInjectedStatuses}
              disabled={actionState !== 'idle'}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={15} />
              {actionState === 'clearing-injected-all' ? '删除中...' : '删除全校注入社区'}
            </button>
            <button
              onClick={() => downloadBackupFile('class')}
              disabled={actionState !== 'idle' || !manageClassId}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={15} />
              {actionState === 'backing-up-class' ? '导出中...' : '导出本班备份'}
            </button>
            <button
              onClick={() => downloadBackupFile('all')}
              disabled={actionState !== 'idle'}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={15} />
              {actionState === 'backing-up-all' ? '导出中...' : '导出全校备份'}
            </button>
          </div>
        </div>

        {managementMessage && (
          <div className="mt-4 rounded-[20px] border border-white/70 bg-white/72 px-4 py-3 text-sm font-medium text-slate-600">
            {managementMessage}
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="xl:col-span-6 p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">上传次数排名</h2>
              <p className="mt-1 text-sm text-slate-500">按累计上传次数看谁最常使用情绪气泡和情绪社区。</p>
            </div>
            <Users className="text-slate-500" size={22} />
          </div>
          <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <RankingTable title="情绪气泡 Top Users" rows={analytics?.topUsers.bubble || []} accent="#F59E0B" />
            <RankingTable title="情绪社区 Top Users" rows={analytics?.topUsers.community || []} accent="#3B82F6" />
          </div>
        </GlassCard>

        <GlassCard className="xl:col-span-3 p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">功能占比</h2>
              <p className="mt-1 text-sm text-slate-500">看情绪气泡和社区发布在整体使用里的比重。</p>
            </div>
            <Activity className="text-emerald-500" size={22} />
          </div>
          <div className="mt-4 flex-1 min-h-0">
            <FeatureMixPanel
              bubbleUploads={analytics?.metrics.bubbleUploads || 0}
              communityUploads={analytics?.metrics.communityUploads || 0}
            />
          </div>
        </GlassCard>

        <GlassCard className="xl:col-span-3 p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">班级活跃榜</h2>
              <p className="mt-1 text-sm text-slate-500">按照总上传量看哪些班级最常使用系统。</p>
            </div>
            <BarChart3 className="text-indigo-500" size={22} />
          </div>
          <div className="mt-4 flex-1 min-h-0">
            <ClassRankingPanel rows={classRanking} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 h-[380px] flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">班级维度分析</h2>
            <p className="mt-1 text-sm text-slate-500">同时看气泡上传、社区上传、参与人数和高风险条数，方便你判断哪些班级真的在用、哪些班级真的值得盯。</p>
          </div>
          <span className="rounded-full border border-white/70 bg-white/82 px-3 py-1 text-xs font-semibold text-slate-500">
            {analytics?.classBreakdown.length || 0} 个班级
          </span>
        </div>
        <div className="mt-4 min-h-0 flex-1">
          <ClassBreakdownTable rows={analytics?.classBreakdown || []} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 h-[520px] flex flex-col">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">全历史上传记录</h2>
            <p className="mt-1 text-sm text-slate-500">这里保留真实 Portal 的历史上传，按时间倒序查看，方便你追溯具体是谁、什么班级、什么时候使用了哪个功能。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-2 text-xs font-semibold text-slate-500">
              <Clock3 size={14} />
              最近 {historyRows.length} 条
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-2 text-xs font-semibold text-slate-500">
              <ListFilter size={14} />
              历史可追溯
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="rounded-[22px] border border-white/60 bg-white/72 px-4 py-3 text-sm text-slate-500">
            历史记录直接来自正式数据库，不会因为刷新丢失；这里展示的是持久化保存后的真实上传时间。
          </div>
          <select
            value={historyFeature}
            onChange={(e) => setHistoryFeature(e.target.value as 'all' | 'mood_bubble' | 'status_community')}
            className="rounded-[22px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
          >
            {historyFeatureOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={historyClassId}
            onChange={(e) => setHistoryClassId(e.target.value)}
            className="rounded-[22px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="">全部班级</option>
            {classes.map((item) => (
              <option key={item.class_id} value={item.class_id}>{item.class_id}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 min-h-0 flex-1">
          <HistoryTable rows={historyRows} />
        </div>
      </GlassCard>
    </div>
  );
};

export default ConsoleDashboard;
