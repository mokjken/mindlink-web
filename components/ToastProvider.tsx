import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToast({ message, type, id });
        setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'error'
                            ? 'bg-red-500/80 border-red-400 text-white'
                            : 'bg-slate-900/80 border-slate-700 text-white'
                            }`}
                    >
                        {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                        <span className="text-sm font-bold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/20 rounded-full p-1"><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
};
