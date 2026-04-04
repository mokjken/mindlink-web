import React from 'react';
import { motion } from 'framer-motion';
import { getPortalMode } from '../runtimeConfig';

// Task 3: Ambient Resonance Support
export const AuroraBackground: React.FC<{ children: React.ReactNode; targetColor?: string }> = ({ children, targetColor }) => {
    const portalMode = getPortalMode();
    const isStudentPortal = portalMode === 'student';
    const orbBlurClass = isStudentPortal ? 'blur-[86px]' : 'blur-[135px]';
    const orbBlurLargeClass = isStudentPortal ? 'blur-[98px]' : 'blur-[145px]';
    const overlayBlurClass = isStudentPortal ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),rgba(255,255,255,0.12)_48%,rgba(255,255,255,0.22)_100%)]' : 'backdrop-blur-[90px]';
    const orbScaleA = isStudentPortal ? [1, 1.12, 1] : [1, 1.2, 1];
    const orbScaleB = isStudentPortal ? [1, 1.08, 1] : [1, 1.1, 1];
    const orbScaleC = isStudentPortal ? [1, 1.16, 1] : [1, 1.3, 1];

    if (isStudentPortal) {
        return (
            <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#f4f4f5] font-sans text-slate-900 selection:bg-indigo-500/20">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,255,255,0.52)_40%,rgba(248,250,252,0.84)_100%)]" />
                <div
                    className="absolute inset-0 z-0 transition-colors duration-[1600ms] ease-in-out"
                    style={{ backgroundColor: targetColor ? `${targetColor}0f` : 'rgba(255,255,255,0)' }}
                />
                <div className="absolute inset-0 z-0 bg-[radial-gradient(42%_44%_at_16%_14%,rgba(253,230,138,0.26),transparent_64%),radial-gradient(34%_36%_at_86%_18%,rgba(254,205,211,0.22),transparent_60%),radial-gradient(48%_54%_at_34%_88%,rgba(167,243,208,0.22),transparent_66%)]" />
                <div className="mindlink-aurora-breathe absolute inset-0 z-0 bg-[radial-gradient(34%_40%_at_62%_40%,rgba(255,255,255,0.18),transparent_72%),radial-gradient(28%_32%_at_40%_70%,rgba(255,255,255,0.12),transparent_74%)] opacity-70" />
                <div className={`absolute inset-0 z-0 ${overlayBlurClass}`} />

                <div className="relative z-10 h-full w-full overflow-x-hidden overflow-y-auto">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#f4f4f5] overflow-hidden font-sans text-slate-900 selection:bg-indigo-500/20">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,255,255,0.5)_38%,rgba(248,250,252,0.82)_100%)] z-0" />

            {/* --- Resonance Layer (Global Tint) --- */}
            <motion.div
                className="absolute inset-0 z-0 bg-white/0"
                animate={{
                    backgroundColor: targetColor ? `${targetColor}12` : 'rgba(255,255,255,0)',
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
                        scale: orbScaleA,
                        backgroundColor: targetColor || '#fde68a'
                    }}
                    transition={{
                        x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                        backgroundColor: { duration: 3, ease: "easeInOut" }
                    }}
                    className={`absolute -top-[14%] -left-[10%] w-[54vw] h-[54vw] opacity-28 rounded-full ${orbBlurClass} mix-blend-multiply will-change-transform transform-gpu`}
                />

                {/* Orb 2: Soft Red/Pink (Top Right) */}
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: orbScaleB,
                        backgroundColor: targetColor || '#fecdd3'
                    }}
                    transition={{
                        x: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        scale: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 },
                        backgroundColor: { duration: 3, ease: "easeInOut" }
                    }}
                    className={`absolute top-[8%] -right-[12%] w-[46vw] h-[46vw] opacity-26 rounded-full ${orbBlurClass} mix-blend-multiply will-change-transform transform-gpu`}
                />

                {/* Orb 3: Mint Green/Blue (Bottom Center) */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -100, 0],
                        scale: orbScaleC,
                        backgroundColor: targetColor || '#a7f3d0'
                    }}
                    transition={{
                        x: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        y: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        scale: { duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 },
                        backgroundColor: { duration: 3, ease: "easeInOut" }
                    }}
                    className={`absolute -bottom-[24%] left-[14%] w-[64vw] h-[64vw] opacity-22 rounded-full ${orbBlurLargeClass} mix-blend-multiply will-change-transform transform-gpu`}
                />

            </div>

            {/* --- Glass Overlay to diffuse colors --- */}
            <div className={`absolute inset-0 ${overlayBlurClass} z-0`} />

            {/* --- Content --- */}
            <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
                {children}
            </div>

        </div>
    );
};
