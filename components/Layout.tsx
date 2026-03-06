import React from 'react';
import { ShieldAlert, Github, HeartHandshake, Settings, School, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarStatus } from './AvatarStatus';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'student', label: '学生端', icon: HeartHandshake },
    { id: 'teacher', label: '教师端', icon: GraduationCap },
    { id: 'admin', label: '管理端', icon: School },
    { id: 'demo', label: '演示', icon: Settings },
    { id: 'specs', label: '关于项目', icon: Github },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-indigo-500/20 relative z-10 pointer-events-none">

      {/* 
        ========================================
        TABLET / DESKTOP HEADER (Hidden on mobile)
        ========================================
      */}
      <div className="hidden md:flex fixed top-6 w-full z-[100] pointer-events-auto justify-center px-4">
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 rounded-full p-2 flex items-center max-w-[95vw] lg:max-w-fit"
        >
          {/* Logo */}
          <div className="w-10 h-10 bg-slate-900 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-lg mx-2">
            <ShieldAlert size={20} />
          </div>

          {/* Scrollable Tabs Wrapper (Saves layout if screen is too thin like 800px iPad) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={`desktop-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${isActive ? 'text-white shadow-md' : 'text-slate-500 hover:bg-white/40'}`}
                >
                  {isActive && (
                    <motion.div layoutId="navPillDesktop" className="absolute inset-0 bg-slate-900 rounded-full -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <item.icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
                  <span className={isActive ? "text-white" : "text-slate-600"}>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-8 bg-slate-200/60 mx-2 flex-shrink-0"></div>

          {/* Avatar on Right side of Pill */}
          <div className="flex-shrink-0 pr-1">
            <AvatarStatus />
          </div>
        </motion.nav>
      </div>

      {/* 
        ========================================
        MOBILE HEADER (Hidden on tablet/desktop)
        ========================================
      */}
      <div className="md:hidden fixed top-0 w-full z-[100] pb-8 pt-4 px-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-auto flex items-center justify-between">
        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg border border-white/20">
          <ShieldAlert size={20} />
        </div>
        <div className="scale-90 origin-top-right">
          <AvatarStatus />
        </div>
      </div>

      {/* 
        ========================================
        MOBILE BOTTOM TAB BAR (Hidden on tablet/desktop)
        ========================================
      */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] pointer-events-auto bg-white/95 backdrop-blur-2xl border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+5px)] pt-1">
        <div className="flex w-full overflow-x-auto px-2 py-3 gap-2 scrollbar-hide items-center justify-start">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={`mobile-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`relative flex-shrink-0 flex-1 min-w-[70px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${isActive ? 'bg-indigo-600/5 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-indigo-600 drop-shadow-md" : "text-slate-400"} />
                <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 
        ========================================
        MAIN CONTENT AREA
        ========================================
      */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 pt-[90px] pb-[100px] md:pt-[120px] md:pb-12 relative z-0 pointer-events-auto">
        {children}
      </main>
    </div>
  );
};