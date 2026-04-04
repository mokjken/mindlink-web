import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Layers, MousePointer2 } from 'lucide-react';
import { SchoolModel } from './SchoolModel';
import { api } from '../services/api';
import { HeatmapPoint } from '../types';

interface AdminMapProps {
    heatmapData?: HeatmapPoint[];
    disableFetch?: boolean;
    embedded?: boolean;
}

export const AdminMap: React.FC<AdminMapProps> = ({ heatmapData: externalData, disableFetch = false, embedded = false }) => {
    const [internalData, setInternalData] = useState<HeatmapPoint[]>([]);
    const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

    useEffect(() => {
        if (disableFetch || externalData) return;

        const fetchHeatmap = async () => {
            try {
                const data = await api.admin.getHeatmap() as HeatmapPoint[];
                setInternalData(data);
            } catch (error) {
                console.error("Failed to fetch heatmap data", error);
            }
        };

        fetchHeatmap();
        const interval = setInterval(fetchHeatmap, 5000);
        return () => clearInterval(interval);
    }, [disableFetch, externalData]);

    const activeData = externalData || internalData;

    return (
        <div className={`w-full h-full min-h-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(226,232,240,0.75)_100%)] overflow-hidden relative flex flex-col group ${
            embedded
                ? 'rounded-[27px]'
                : 'rounded-[30px] shadow-[0_22px_52px_rgba(15,23,42,0.12)] border border-white/70'
        }`}>
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2.5 md:p-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="bg-white/88 backdrop-blur-xl px-3 py-2.5 md:px-4 md:py-3 rounded-[20px] text-slate-800 border border-white/75 shadow-sm pointer-events-auto max-w-[160px] sm:max-w-[220px] md:max-w-none">
                    <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Digital Twin</p>
                    <h2 className="font-semibold text-[15px] md:text-lg flex items-center gap-2 mt-1 leading-tight">
                        校园数字孪生
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-snug">实时风险热力图与情绪粒子</p>
                </div>

                <div className="flex gap-1 pointer-events-auto bg-white/88 backdrop-blur-xl p-1 rounded-[16px] border border-white/70 shadow-sm">
                    <button
                        onClick={() => setViewMode('3D')}
                        className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-[12px] transition-all flex items-center gap-1.5 ${viewMode === '3D' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                        title="Perspective View"
                    >
                        <Box size={15} />
                        <span className="text-[11px] font-semibold">3D</span>
                    </button>
                    <button
                        onClick={() => setViewMode('2D')}
                        className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-[12px] transition-all flex items-center gap-1.5 ${viewMode === '2D' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                        title="Top-Down View"
                    >
                        <Layers size={15} />
                        <span className="text-[11px] font-semibold">2D</span>
                    </button>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
                <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
                    <SchoolModel viewMode={viewMode} heatmapData={activeData} />
                </Canvas>

                {/* Hint Overlay */}
                <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 bg-black/68 backdrop-blur-md text-white px-3 py-1.5 md:px-3.5 md:py-2 rounded-full text-[10px] md:text-xs font-medium pointer-events-none opacity-85 md:opacity-70 md:group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <MousePointer2 size={12} />
                    <span>拖拽旋转 · 滚动缩放</span>
                </div>

                {/* Legend */}
                <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 bg-white/82 backdrop-blur-xl px-2.5 py-2 md:px-3 md:py-2.5 rounded-[16px] md:rounded-[18px] text-[10px] md:text-xs font-medium text-slate-500 border border-white/70 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#98FF98]"></div> 正常
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#B22222] animate-pulse"></div> 高风险
                    </div>
                </div>
            </div>
        </div>
    );
};
