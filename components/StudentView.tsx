import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, X } from 'lucide-react';
import { api, getStudentId } from '../services/api'; // Keeping API connection
import { AuroraBackground } from './AuroraBackground';
import { MoodPlayground, MoodDef } from './MoodPlayground';
import { StatusFeed } from './StatusFeed';

// Strict Location List matching Backend
import { SCHOOL_STRUCTURE, getTypeLocation } from './SchoolStructure';
import { ENCOURAGEMENT_MESSAGES } from './EncouragementMessages';

// Strict Location List matching Backend
const LOCATIONS = [
  "AQ1", "AQ2", "AQ3", "AQ4", "电力楼", "侧楼",
  "女生宿舍", "男生宿舍", "食堂", "游泳馆", "宿舍AB", "宿舍CD",
  "行政楼", "体育馆", "篮球场"
];

// --- Burst Animation Component ---
const BurstAnimation: React.FC<{ color: string; onComplete: () => void }> = ({ color, onComplete }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Central Burst */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2, 4], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-32 h-32 rounded-full"
        style={{ backgroundColor: color }}
        onAnimationComplete={onComplete}
      />
      {/* Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(i * 45 * (Math.PI / 180)) * 200,
            y: Math.sin(i * 45 * (Math.PI / 180)) * 200,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

const springTransition = { type: "spring", stiffness: 400, damping: 25 };

// Update Props Interface if explicit (but here it's FC)
// Instead of interface, define props inline for FC
interface StudentViewProps {
  onColorChange?: (color: string | undefined) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ onColorChange }) => {
  const [selectedMood, setSelectedMood] = useState<MoodDef | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [lastSubmittedMood, setLastSubmittedMood] = useState<MoodDef | null>(null);
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    setStudentId(getStudentId());
  }, []);

  // Sync color to parent App
  useEffect(() => {
    if (onColorChange) {
      const target = selectedMood?.color || lastSubmittedMood?.color;
      onColorChange(target);
    }
  }, [selectedMood, lastSubmittedMood, onColorChange]);

  const regenerateId = () => {
    localStorage.removeItem('mindlink_student_id');
    const newId = getStudentId();
    setStudentId(newId);
  };

  // Student Identity Simulation (Demo Feature)
  const [selectedFaculty, setSelectedFaculty] = useState<string>('CNC');
  const [selectedClass, setSelectedClass] = useState<string>(SCHOOL_STRUCTURE.CNC.classes[0]);
  const [location, setLocation] = useState(SCHOOL_STRUCTURE.CNC.defaultLocation);

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const faculty = e.target.value;
    setSelectedFaculty(faculty);
    // @ts-ignore
    const newClass = SCHOOL_STRUCTURE[faculty].classes[0];
    setSelectedClass(newClass);
    setLocation(getTypeLocation(faculty, newClass));
    localStorage.setItem('mindlink_class_id', newClass);
    regenerateId(); // New Identity for Demo
  };

  // Sync class to localStorage on change and mount
  useEffect(() => {
    localStorage.setItem('mindlink_class_id', selectedClass);
  }, [selectedClass]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    setLocation(getTypeLocation(selectedFaculty, newClass));
    regenerateId(); // New Identity for Demo
  };

  // Quick Submit (Long Press)
  const handleQuickSubmit = async (mood: MoodDef) => {
    setLastSubmittedMood(mood);
    setShowBurst(true);

    // Optimistic UI updates happen immediately via animations
    // Fire-and-forget API call
    api.submitMood({
      mood_score: mood.score || 3,
      emotion_label: mood.label,
      mood_color: mood.color,
      content: "快速打卡",
      location: location,
      class_id: selectedClass
    }).catch(console.error);
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    try {
      setLastSubmittedMood(selectedMood); // Track for comfort message

      await api.submitMood({
        mood_score: selectedMood.score || 3, // Default to 3 (Neutral) if missing
        emotion_label: selectedMood.label,
        mood_color: selectedMood.color,
        content: content,
        location: location,
        class_id: selectedClass
      });

      // Show burst effect after manual submit too
      setSelectedMood(null); // Clear input selection
      setShowBurst(true);    // Trigger burst/comfort flow
      setContent('');

    } catch (e) {
      console.error("Submission failed", e);
      alert("Failed to log mood. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col items-center relative transition-all duration-1000 w-full ${showBurst ? 'blur-xl scale-105' : ''}`}>

        {/* --- DEMO: Student Identity Selector --- */}
        <div className="absolute top-0 left-0 md:left-4 z-50 flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-md p-1 md:p-1.5 rounded-xl border border-white/20 max-w-[60vw] md:max-w-none overflow-hidden mt-2 md:mt-0">
          <span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0">当前身份:</span>
          <select
            value={selectedFaculty}
            onChange={handleFacultyChange}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none"
          >
            {Object.keys(SCHOOL_STRUCTURE).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="w-px h-3 bg-slate-400/30" />
          <select
            value={selectedClass}
            onChange={handleClassChange}
            className="bg-transparent text-xs font-bold text-slate-800 outline-none max-w-[80px]"
          >
            {/* @ts-ignore */}
            {SCHOOL_STRUCTURE[selectedFaculty].classes.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>



        {/* --- HEADER: Text Morphing --- */}
        <div className="h-24 flex items-center justify-center mb-4 mt-8 md:mt-0 relative w-full">
          <AnimatePresence mode="wait">
            {!selectedMood ? (
              <motion.h1
                key="question"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="text-3xl md:text-4xl font-bold text-slate-800/80 tracking-tight text-center"
              >
                今天感觉如何？
              </motion.h1>
            ) : (
              <motion.div
                key="comfort"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  我感受到了你的"{selectedMood.label}"。
                </h1>
                <p className="text-lg text-slate-600 font-medium">拥有这种感受是完全正常的。</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- TASK 2: Mood Playground (Physics Cloud) --- */}
        <div className="flex-1 w-full flex items-center justify-center relative">
          {/* Close Button when mood selected */}
          {/* 选中心情时的关闭按钮 */}
          <AnimatePresence>
            {selectedMood && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setSelectedMood(null)}
                className="absolute top-0 right-4 z-50 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
                style={{ top: -20 }} // 微调
              >
                <X size={20} className="text-slate-500" />
              </motion.button>
            )}
          </AnimatePresence>

          <MoodPlayground
            onSelect={setSelectedMood}
            onQuickSubmit={handleQuickSubmit}
            selectedMoodId={selectedMood?.id}
          />
        </div>

        {/* --- 任务5: 输入岛 (可选上下文) --- */}
        <AnimatePresence>
          {selectedMood && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={springTransition}
              className="fixed bottom-[110px] md:bottom-8 w-[90%] max-w-lg z-50 pointer-events-auto"
            >
              <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[32px] p-2 flex flex-col gap-2">

                <div className="flex items-center gap-2 pl-4 pr-1 h-14">
                  {/* 地点选择 */}
                  <div className="flex items-center text-indigo-600 gap-1.5 bg-indigo-50/50 px-3 py-1.5 rounded-full">
                    <MapPin size={14} fill="currentColor" className="opacity-80" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none text-indigo-800 cursor-pointer min-w-[40px]"
                    >
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="添加备注? (可选)"
                    className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 border-none outline-none focus:ring-0 px-2"
                  />

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Student ID Display */}
      <div
        onClick={regenerateId}
        title="点击重置身份"
        className="fixed bottom-[90px] md:bottom-2 right-2 md:right-2 text-[10px] text-slate-400 cursor-pointer pointer-events-auto z-40 font-mono opacity-50 hover:opacity-100 transition-opacity hover:underline"
      >
        ID: {studentId}
      </div>

      {/* --- TASK 6: Community Feed (Moved to Bottom) --- */}
      <div className="w-full max-w-5xl mt-12 pb-24 relative z-10 px-4">
        <StatusFeed />
      </div>

      {/* 爆发和安慰信息叠加层 */}
      <AnimatePresence>
        {showBurst && lastSubmittedMood && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* 爆发粒子 */}
            <BurstAnimation color={lastSubmittedMood.color} onComplete={() => {
              // 动画结束后自动关闭 + 小延迟
              setTimeout(() => setShowBurst(false), 2500);
            }} />

            {/* 安慰信息 - 延迟后出现 */}
            {/* 安慰信息 - 延迟后出现 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute text-center p-8 bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 max-w-sm mx-4"
            >
              <h2 className="text-3xl font-bold text-slate-800 mb-4">收到你的心声</h2>
              <p className="text-xl font-medium text-slate-700 leading-relaxed">
                {(() => {
                  if (!lastSubmittedMood) return "你的感受被看见了，这很重要。";
                  const messages = ENCOURAGEMENT_MESSAGES[lastSubmittedMood.id] || ENCOURAGEMENT_MESSAGES['calm'];
                  // Use a simple hash or random based on time if we want it random every time, 
                  // but inside render it should be stable ideally? 
                  // Actually, since this component is conditional rendered, it mounts fresh each time showBurst is true?
                  // No, parent is StudentView.
                  // Let's use a useMemo at the component level or just random here if it doesn't re-render often.
                  // BETTER: Select the message when showBurst is set to true/effect. 
                  // But for now, a simple random selection from the array is fine if we accept re-roll on re-render (which shouldn't happen much in this view).
                  // To be safe, let's use a deterministic selection based on second or just random.
                  // Actually, let's just pick one.
                  const randomIndex = Math.floor(Math.random() * messages.length);
                  return messages[randomIndex];
                })()}
                <br />
                <span className="text-sm opacity-60 mt-4 block">深呼吸...</span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};