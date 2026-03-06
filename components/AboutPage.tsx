import React from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Heart } from 'lucide-react';

export const AboutPage: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-8 h-full min-h-[80vh] flex flex-col justify-center">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-6 rotate-3">
                    <Heart size={40} fill="currentColor" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">MindLink</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    A real-time student emotion and mental health tracking platform designed for K-12 educational environments.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-6 md:p-10 text-center max-w-2xl mx-auto w-full"
            >
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Open Source Repository</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                    MindLink is fully open-source. Discover the codebase, infrastructure setup, and Serverless deployment instructions on our GitHub repository.
                </p>

                <a
                    href="https://github.com/mokjken/mindlink-web"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20 w-full sm:w-auto"
                >
                    <Github size={24} />
                    <span>mokjken/mindlink-web</span>
                    <ExternalLink size={18} className="opacity-50 ml-2" />
                </a>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-sm text-slate-400 font-medium"
            >
                Powered by Cloudflare Workers & Google Gemini
            </motion.div>
        </div>
    );
};
