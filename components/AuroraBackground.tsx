import React from 'react';
import { motion } from 'framer-motion';

// Task 3: Ambient Resonance Support
export const AuroraBackground: React.FC<{ children: React.ReactNode; targetColor?: string }> = ({ children, targetColor }) => {
    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#f5f5f7] overflow-hidden font-sans text-slate-900 selection:bg-indigo-500/30">

            {/* --- Resonance Layer (Global Tint) --- */}
            <motion.div
                className="absolute inset-0 z-0 bg-white/0"
                animate={{
                    backgroundColor: targetColor ? `${targetColor}15` : 'rgba(255,255,255,0)', // Subtle 10-15% tint
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* --- Ambient Orbs --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                {/* Orb 1: Pastel Yellow/Orange (Top Left) */}
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                        backgroundColor: targetColor || '#fde68a'
                    }}
                    transition={{
                        x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        backgroundColor: { duration: 3, ease: "easeInOut" } // Smooth color transition
                    }}
                    className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] opacity-40 rounded-full blur-[120px] mix-blend-multiply"
                />

                {/* Orb 2: Soft Red/Pink (Top Right) */}
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.1, 1],
                        backgroundColor: targetColor || '#fecdd3'
                    }}
                    transition={{
                        x: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        scale: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        backgroundColor: { duration: 3, ease: "easeInOut" }
                    }}
                    className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vw] opacity-40 rounded-full blur-[120px] mix-blend-multiply"
                />

                {/* Orb 3: Mint Green/Blue (Bottom Center) */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -100, 0],
                        scale: [1, 1.3, 1],
                        backgroundColor: targetColor || '#a7f3d0'
                    }}
                    transition={{
                        x: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        y: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        scale: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        backgroundColor: { duration: 3, ease: "easeInOut" }
                    }}
                    className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] opacity-30 rounded-full blur-[130px] mix-blend-multiply"
                />

            </div>

            {/* --- Glass Overlay to diffuse colors --- */}
            <div className="absolute inset-0 backdrop-blur-3xl z-0" />

            {/* --- Content --- */}
            <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
                {children}
            </div>

        </div>
    );
};
