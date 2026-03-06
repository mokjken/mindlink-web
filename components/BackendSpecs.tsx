import React from 'react';
import { Copy, Server, Database } from 'lucide-react';
import { BACKEND_CODE } from '../services/mockBackend';
import { GlassCard } from './GlassCard';

export const BackendSpecs: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      <GlassCard className="p-8 text-slate-800 bg-indigo-50/50">
        <h2 className="text-3xl font-bold mb-4 tracking-tight flex items-center gap-2">
          <Server className="text-indigo-600" />
          Backend Implementation
        </h2>
        <p className="text-slate-600 leading-relaxed max-w-3xl font-medium">
          Below is the production-ready code for the Cloudflare D1 Database Schema and the Hono Worker API.
          This logic is currently <strong>simulated</strong> in this browser demo to allow you to test the functionality immediately.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schema Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
              <Database size={18} className="text-emerald-500" /> D1 Database Schema
            </h3>
            <button
              onClick={() => copyToClipboard(BACKEND_CODE.schemaSql)}
              className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-white/50 px-3 py-1 rounded-full border border-indigo-100 transition-all hover:bg-white"
            >
              <Copy size={14} /> Copy SQL
            </button>
          </div>
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs text-slate-400 font-mono font-bold">schema.sql</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed">
              <code>{BACKEND_CODE.schemaSql.trim()}</code>
            </pre>
          </div>
        </div>

        {/* Worker Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
              <Server size={18} className="text-blue-500" /> Worker API
            </h3>
            <button
              onClick={() => copyToClipboard(BACKEND_CODE.workerJs)}
              className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-white/50 px-3 py-1 rounded-full border border-indigo-100 transition-all hover:bg-white"
            >
              <Copy size={14} /> Copy JS
            </button>
          </div>
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs text-slate-400 font-mono font-bold">src/index.js</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-blue-300 leading-relaxed h-[500px] overflow-y-auto custom-scrollbar">
              <code>{BACKEND_CODE.workerJs.trim()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};