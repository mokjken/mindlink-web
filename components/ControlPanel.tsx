import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Trash2, AlertOctagon, RefreshCw, Power, Zap, School } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { motion } from 'framer-motion';
import { SCHOOL_STRUCTURE } from './SchoolStructure';

export const ControlPanel: React.FC = () => {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('CNC');
  const [selectedClass, setSelectedClass] = useState<string>(SCHOOL_STRUCTURE.CNC.classes[0]);

  // Handle Faculty Change
  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const faculty = e.target.value;
    setSelectedFaculty(faculty);
    // Reset class to first of new faculty
    // @ts-ignore
    setSelectedClass(SCHOOL_STRUCTURE[faculty].classes[0]);
  };

  const handleGenerate = async (count: number, id: string, target?: string) => {
    setActiveBtn(id);
    await api.demo.generateData(count, target || selectedClass);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleClear = async () => {
    if (window.confirm("确定要清空所有模拟数据吗？")) {
      await api.demo.clearData();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-8 pb-32 md:pb-0 pt-12 md:pt-0">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">控制中心</h2>
        <p className="text-slate-500 font-medium">模拟控制与系统诊断</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Faculty Select */}
        <div className="relative">
          <select
            value={selectedFaculty}
            onChange={handleFacultyChange}
            className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {Object.keys(SCHOOL_STRUCTURE).map(key => (
              <option key={key} value={key}>{SCHOOL_STRUCTURE[key as keyof typeof SCHOOL_STRUCTURE].name}</option>
            ))}
          </select>
        </div>

        {/* Class Select */}
        <div className="relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {/* @ts-ignore */}
            {SCHOOL_STRUCTURE[selectedFaculty as keyof typeof SCHOOL_STRUCTURE].classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {/* Squircle Button: Generate 10 */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleGenerate(10, 'gen10')}
          className={`col-span-1 aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors ${activeBtn === 'gen10' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'bg-white/60 backdrop-blur-xl hover:bg-white/80 text-slate-600'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeBtn === 'gen10' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
            <Database size={24} />
          </div>
          <div className="text-center">
            <span className="block text-sm font-bold">注入到 {selectedClass}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeBtn === 'gen10' ? 'text-indigo-100' : 'text-slate-400'}`}>+10 条记录</span>
          </div>
        </motion.button>

        {/* Squircle Button: Generate 50 */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleGenerate(50, 'gen50')}
          className={`col-span-1 aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors ${activeBtn === 'gen50' ? 'bg-purple-500 text-white shadow-xl shadow-purple-500/30' : 'bg-white/60 backdrop-blur-xl hover:bg-white/80 text-slate-600'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeBtn === 'gen50' ? 'bg-white/20' : 'bg-purple-100 text-purple-600'}`}>
            <RefreshCw size={24} className={activeBtn === 'gen50' ? 'animate-spin' : ''} />
          </div>
          <div className="text-center">
            <span className="block text-sm font-bold">全天数据</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeBtn === 'gen50' ? 'text-purple-100' : 'text-slate-400'}`}>模拟</span>
          </div>
        </motion.button>

        {/* Squircle Button: Generate All School */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleGenerate(200, 'genAll', 'All')}
          className={`col-span-1 aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-colors ${activeBtn === 'genAll' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'bg-white/60 backdrop-blur-xl hover:bg-white/80 text-slate-600'
            }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeBtn === 'genAll' ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>
            <School size={24} />
          </div>
          <div className="text-center">
            <span className="block text-sm font-bold">模拟全校</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeBtn === 'genAll' ? 'text-orange-100' : 'text-slate-400'}`}>+200 条</span>
          </div>
        </motion.button>

        {/* Small Toggle: Reset (1 col) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleClear}
          className="col-span-1 aspect-square bg-white/60 backdrop-blur-xl rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-red-50/50 group transition-colors cursor-pointer border border-white/40"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-red-500 group-hover:text-white transition-all shadow-inner">
            <Trash2 size={24} />
          </div>
          <div className="text-center">
            <span className="block text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">重置</span>
            <span className="text-[10px] text-slate-500 font-medium">清空数据</span>
          </div>
        </motion.button>

        {/* Info Card (Spans 4 cols) */}
        <GlassCard className="col-span-2 md:col-span-4 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">模拟逻辑</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              生成器会触发 10% 的“高风险”事件以测试警报系统。
              数据重置将在刷新页面后生效。
            </p>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};