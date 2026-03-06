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
        bg-white/60 
        backdrop-blur-xl 
        border border-white/40 
        shadow-xl shadow-black/5 
        rounded-3xl 
        overflow-hidden
        ${className}
      `}
        >
            {children}
        </motion.div>
    );
};
