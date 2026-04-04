import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={onClick}
            className={`
        bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.6)_100%)] 
        backdrop-blur-2xl 
        border border-white/60 
        shadow-[0_16px_42px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.68)]
        rounded-[28px] 
        overflow-hidden
        ${className}
      `}
        >
            {children}
        </motion.div>
    );
};
