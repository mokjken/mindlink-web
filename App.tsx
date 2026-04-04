import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { AuroraBackground } from './components/AuroraBackground';
import { DemoLanguageProvider, useDemoLanguage } from './components/DemoLanguageContext';
import { ToastProvider } from './components/ToastProvider';
import { getPortalMode } from './runtimeConfig';
import { api, clearPortalPassword, getPortalPassword, setPortalPassword } from './services/api';

const StudentView = React.lazy(async () => ({ default: (await import('./components/StudentView')).StudentView }));
const TeacherDashboard = React.lazy(async () => ({ default: (await import('./components/TeacherDashboard')).TeacherDashboard }));
const AdminDashboard = React.lazy(async () => ({ default: (await import('./components/AdminDashboard')).AdminDashboard }));
const ConsoleDashboard = React.lazy(async () => ({ default: (await import('./components/ConsoleDashboard')).default }));
const ControlPanel = React.lazy(async () => ({ default: (await import('./components/ControlPanel')).ControlPanel }));
const AboutPage = React.lazy(async () => ({ default: (await import('./components/AboutPage')).AboutPage }));
const JudgeGuide = React.lazy(async () => ({ default: (await import('./components/guide/JudgeGuide')).JudgeGuide }));

const ViewFallback: React.FC = () => {
  const { isDemo, language } = useDemoLanguage();
  const copy = isDemo && language === 'en' ? 'Loading...' : '加载中...';

  return (
    <div className="min-h-[52svh] flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/72 px-4 py-2.5 backdrop-blur-xl shadow-sm">
        <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
        <span className="text-sm font-medium text-slate-600">{copy}</span>
      </div>
    </div>
  );
};

const RestrictedPortalGate: React.FC<{
  portal: 'teacher' | 'admin' | 'console';
  children: React.ReactNode;
}> = ({ portal, children }) => {
  const portalTitle = portal === 'teacher' ? 'Teacher Portal' : portal === 'admin' ? 'Admin Portal' : 'MindLink Console';
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyStoredPassword = async () => {
      const stored = getPortalPassword(portal);
      if (!stored) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        await api.auth.verifyPortalPassword(portal, stored);
        if (!cancelled) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch {
        clearPortalPassword(portal);
        if (!cancelled) {
          setChecking(false);
          setError('密码已失效，请重新输入。');
        }
      }
    };
    verifyStoredPassword();
    return () => {
      cancelled = true;
    };
  }, [portal]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setError('请输入密码。');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.auth.verifyPortalPassword(portal, password.trim());
      setPortalPassword(portal, password.trim());
      setAuthorized(true);
    } catch {
      clearPortalPassword(portal);
      setError('密码不正确，请重试。');
    } finally {
      setSubmitting(false);
      setChecking(false);
    }
  };

  if (authorized) return <>{children}</>;

  return (
    <div className="min-h-[72svh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/80 p-7 backdrop-blur-2xl shadow-[0_28px_60px_rgba(15,23,42,0.14)]">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Protected Access</div>
          <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-800">{portalTitle}</h1>
          <p className="text-sm leading-6 text-slate-500">请输入当前 Portal 密码后继续。通过校验前，不会加载任何后台数据。</p>
        </div>

        {checking ? (
          <div className="mt-6 flex items-center gap-3 rounded-full border border-white/70 bg-white/70 px-4 py-3 text-sm font-medium text-slate-500">
            <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
            正在校验访问权限...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入 Portal 密码"
              className="w-full rounded-[22px] border border-slate-200/90 bg-white/92 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/15"
            />
            {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {submitting ? '校验中...' : '进入 Portal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const portalMode = getPortalMode();
  const isDemoPortal = portalMode === 'demo';
  const [activeTab, setActiveTab] = useState<string>(isDemoPortal ? 'student' : portalMode);
  const [globalColor, setGlobalColor] = useState<string | undefined>(undefined);
  const currentView: string = isDemoPortal ? activeTab : portalMode;
  const availableTabs = useMemo(
    () => (isDemoPortal ? ['student', 'teacher', 'admin', 'demo', 'specs'] : [portalMode]),
    [isDemoPortal, portalMode]
  );

  return (
    <DemoLanguageProvider isDemo={isDemoPortal}>
      <ToastProvider>
        <AuroraBackground targetColor={globalColor}>
          <Layout
            activeTab={currentView}
            onTabChange={isDemoPortal ? setActiveTab : () => {}}
            availableTabs={availableTabs}
            showAvatar={portalMode === 'demo'}
          >
            {portalMode === 'teacher' || portalMode === 'admin' || portalMode === 'console' ? (
              <RestrictedPortalGate portal={portalMode}>
                <Suspense fallback={<ViewFallback />}>
                  <div className="animate-in fade-in zoom-in-95 duration-700 ease-out">
                    {currentView === 'teacher' && <TeacherDashboard />}
                    {currentView === 'admin' && <AdminDashboard />}
                    {currentView === 'console' && <ConsoleDashboard />}
                  </div>
                </Suspense>
              </RestrictedPortalGate>
            ) : (
              <Suspense fallback={<ViewFallback />}>
                <div className="animate-in fade-in zoom-in-95 duration-700 ease-out">
                  {currentView === 'student' && <StudentView onColorChange={setGlobalColor} portalMode={portalMode} />}
                  {currentView === 'demo' && <ControlPanel />}
                  {currentView === 'specs' && <AboutPage />}
                </div>
              </Suspense>
            )}
            {isDemoPortal && (
              <Suspense fallback={null}>
                <JudgeGuide currentView={currentView} onNavigate={(v: any) => setActiveTab(v)} />
              </Suspense>
            )}
          </Layout>
        </AuroraBackground>
      </ToastProvider>
    </DemoLanguageProvider>
  );
};

export default App;
