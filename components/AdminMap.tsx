import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Layers, MousePointer2 } from 'lucide-react';
import { SchoolModel } from './SchoolModel';
import { api } from '../services/api';
import { HeatmapPoint } from '../types';

interface AdminMapProps {
    heatmapData?: HeatmapPoint[];
    disableFetch?: boolean;
}

export const AdminMap: React.FC<AdminMapProps> = ({ heatmapData: externalData, disableFetch = false }) => {
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
        <div className="w-full h-[600px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl relative border border-slate-200 flex flex-col group">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl text-slate-800 border border-slate-200 shadow-sm pointer-events-auto">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        校园数字孪生
                    </h2>
                    <p className="text-xs text-slate-500">实时风险热力图与情感粒子</p>
                </div>

                <div className="flex gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('3D')}
                        className={`p-2 rounded-lg transition-all ${viewMode === '3D' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Perspective View"
                    >
                        <Box size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('2D')}
                        className={`p-2 rounded-lg transition-all ${viewMode === '2D' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Top-Down View"
                    >
                        <Layers size={20} />
                    </button>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 w-full h-full relative cursor-move">
                <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
                    <SchoolModel viewMode={viewMode} heatmapData={activeData} />
                </Canvas>

                {/* Hint Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <MousePointer2 size={12} />
                    <span>拖拽旋转 • 滚动缩放</span>
                </div>

                {/* Legend */}
                <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur px-3 py-2 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1">
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
