import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ChevronDown, MapPin, RefreshCw, Sparkles, X } from 'lucide-react';
import { api, getStudentId } from '../services/api'; // Keeping API connection
import { MoodPlayground, MoodDef, MOOD_CATEGORY_CHOICES } from './MoodPlayground';
import { PortalMode, getStudentUrlIdentity } from '../runtimeConfig';
import { useDemoI18n } from './DemoLanguageContext';

// Strict Location List matching Backend
import { SCHOOL_STRUCTURE, getTypeLocation } from './SchoolStructure';
import { ENCOURAGEMENT_MESSAGES } from './EncouragementMessages';

// Strict Location List matching Backend
const LOCATIONS = [
  "AQ1", "AQ2", "AQ3", "AQ4", "电力楼", "侧楼",
  "女生宿舍", "男生宿舍", "食堂", "游泳馆", "宿舍AB", "宿舍CD",
  "行政楼", "体育馆", "篮球场"
];

const MOOD_LABELS_EN: Record<string, string> = {
  happy: 'Happy',
  satisfied: 'Content',
  caring: 'Caring',
  moved: 'Moved',
  calm: 'Calm',
  relaxed: 'Relaxed',
  thinking: 'Thoughtful',
  nervous: 'Nervous',
  stressed: 'Stressed',
  hesitant: 'Hesitant',
  angry: 'Angry',
  frustrated: 'Frustrated',
  depressed: 'Down',
  sad: 'Sad',
  lonely: 'Lonely'
};

const ENCOURAGEMENT_MESSAGES_EN: Record<string, string[]> = {
  happy: ['Your joy is bright enough to light up the room.', 'Hold on to this good energy.'],
  satisfied: ['That sense of fulfillment looks good on you.', 'A small moment of contentment still counts.'],
  caring: ['Your warmth makes this space gentler.', 'Kindness is a quiet superpower.'],
  moved: ['This feeling can become a soft source of strength.', 'Tender moments matter.'],
  calm: ['A calm heart is a powerful place to start.', 'This quietness is worth keeping.'],
  relaxed: ['Let your shoulders drop a little more.', 'Rest is part of moving forward.'],
  thinking: ['It is okay to stay with your thoughts for a while.', 'Clarity often arrives in quieter moments.'],
  nervous: ['Take one more breath. You are steadier than you think.', 'Nerves often mean you care.'],
  stressed: ['You have been carrying a lot. Pause for a second.', 'One step at a time is still progress.'],
  hesitant: ['You do not need every answer right now.', 'A small next step is enough.'],
  angry: ['Let the heat pass before it speaks for you.', 'Your feelings are real. Give them space safely.'],
  frustrated: ['A hard moment does not erase your effort.', 'You can reset and try again.'],
  depressed: ['You do not have to force brightness right now.', 'Even a heavy day can soften.'],
  sad: ['It is okay to move gently today.', 'Sadness deserves kindness too.'],
  lonely: ['You are not the only one carrying this feeling.', 'Even quiet moments can still hold connection.']
};

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
const STUDENT_GUIDE_STORAGE_KEY = 'mindlink_student_quickstart_v1';
const STUDENT_START_PAGE_STORAGE_KEY = 'mindlink_student_startpage_v1';

const MindLinkWordmark: React.FC = () => (
  <svg viewBox="0 0 816 244" className="h-auto w-[min(72vw,360px)]" fill="none" aria-label="MindLink">
    <defs>
      <linearGradient x1="879.262" y1="-437.575" x2="1002.03" y2="-22.3637" gradientUnits="userSpaceOnUse" spreadMethod="reflect" id="mindlinkGradient">
        <stop offset="0%" stopColor="#39A6FF" />
        <stop offset="50%" stopColor="#A4B5BE" />
        <stop offset="100%" stopColor="#F1F1FF" />
      </linearGradient>
    </defs>
    <g transform="translate(-220 -782)">
      <g>
        <g>
          <g>
            <g>
              <path
                d="M919.242-246.578C904.636-246.578 895.45-234.636 895.45-215.254L895.45-215.162C895.45-195.78 904.544-183.837 919.242-183.837 933.388-183.837 943.217-196.055 943.217-215.162L943.217-215.254C943.217-234.269 933.296-246.578 919.242-246.578ZM1086.97-263.848 1109.85-263.848 1109.85-166.477 1086.97-166.477ZM728.847-263.848 751.72-263.848 751.72-166.477 728.847-166.477ZM1182.29-265.868C1203.7-265.868 1215.92-252.09 1215.92-229.492L1215.92-166.477 1193.04-166.477 1193.04-224.899C1193.04-238.77 1186.61-246.578 1173.57-246.578 1160.43-246.578 1152.07-237.025 1152.07-222.97L1152.07-166.477 1129.21-166.477 1129.21-263.848 1152.07-263.848 1152.07-248.599 1152.54-248.599C1157.59-259.071 1167.51-265.868 1182.29-265.868ZM824.167-265.868C845.57-265.868 857.787-252.09 857.787-229.492L857.787-166.477 834.915-166.477 834.915-224.899C834.915-238.77 828.484-246.578 815.44-246.578 802.304-246.578 793.945-237.025 793.945-222.97L793.945-166.477 771.071-166.477 771.071-263.848 793.945-263.848 793.945-248.599 794.404-248.599C799.456-259.071 809.377-265.868 824.167-265.868ZM1235.3-299.03 1258.17-299.03 1258.17-223.43 1258.63-223.43 1295.01-263.848 1321.47-263.848 1282.88-221.96 1323.03-166.477 1296.66-166.477 1265.89-208.365 1258.17-200.281 1258.17-166.477 1235.3-166.477ZM987.707-299.03 1011.41-299.03 1011.41-186.409 1071.57-186.409 1071.57-166.477 987.707-166.477ZM943.217-299.03 966.091-299.03 966.091-166.477 943.217-166.477 943.217-183.011 942.666-183.011C937.154-171.529 926.407-164.547 912.352-164.547 887.734-164.547 872.117-183.837 872.117-215.162L872.117-215.254C872.117-246.669 887.826-265.868 912.26-265.868 926.04-265.868 937.154-258.795 942.666-247.129L943.217-247.129ZM570.542-299.03 597.916-299.03 638.518-197.8 639.161-197.8 679.763-299.03 707.137-299.03 707.137-166.477 685.825-166.477 685.825-260.724 685.091-260.724 646.877-166.477 630.802-166.477 592.588-260.724 591.945-260.724 591.945-166.477 570.542-166.477ZM1098.46-302.888C1105.62-302.888 1111.14-297.285 1111.14-290.304 1111.14-283.506 1105.62-277.811 1098.46-277.811 1091.3-277.811 1085.69-283.506 1085.69-290.304 1085.69-297.285 1091.3-302.888 1098.46-302.888ZM740.329-302.888C747.494-302.888 753.006-297.285 753.006-290.304 753.006-283.506 747.494-277.811 740.329-277.811 733.164-277.811 727.561-283.506 727.561-290.304 727.561-297.285 733.164-302.888 740.329-302.888Z"
                fill="url(#mindlinkGradient)"
                fillRule="evenodd"
                transform="matrix(1.00095 0 0 1 -313.538 1133.78)"
              />
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

type StudentGuideStepId = 'welcome' | 'tap' | 'manual' | 'quick' | 'community' | 'status' | 'done';

type StudentGuideStep = {
  id: StudentGuideStepId;
  title: string;
  content: string;
  actionLabel?: string;
  waitingLabel?: string;
};

const GuideFocusRing: React.FC<{ active: boolean; className?: string }> = ({ active, className = '' }) =>
  active ? (
    <div className={`pointer-events-none absolute inset-0 rounded-[32px] ring-2 ring-indigo-400/65 shadow-[0_0_0_10px_rgba(99,102,241,0.12)] ${className}`} />
  ) : null;

const LazyStatusFeed = React.lazy(async () => {
  const module = await import('./StatusFeed');
  return { default: module.StatusFeed };
});

const StudentGuideCard: React.FC<{
  step: StudentGuideStep;
  index: number;
  total: number;
  waiting?: boolean;
  onNext?: () => void;
  onClose: () => void;
  auxiliaryAction?: { label: string; onClick: () => void } | null;
  placementClassName?: string;
}> = ({ step, index, total, waiting = false, onNext, onClose, auxiliaryAction, placementClassName = '' }) => (
  <motion.div
    key={step.id}
    initial={{ opacity: 0, y: 28, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 18, scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    className={`fixed bottom-5 left-1/2 z-[140] w-[min(92vw,420px)] -translate-x-1/2 ${placementClassName}`}
  >
    <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 backdrop-blur-2xl shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            新手向导
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            {index + 1}/{total}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{step.content}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/72 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, bulletIndex) => (
            <div
              key={bulletIndex}
              className={`h-1.5 rounded-full transition-all ${bulletIndex === index ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {auxiliaryAction && (
            <button
              onClick={auxiliaryAction.onClick}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {auxiliaryAction.label}
            </button>
          )}
          {waiting ? (
            <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600">
              {step.waitingLabel || '按提示完成这个动作'}
            </span>
          ) : (
            <button
              onClick={onNext}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              {step.actionLabel || '下一步'}
            </button>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const StudentStartPage: React.FC<{
  version: string;
  onContinue: () => void;
}> = ({ version, onContinue }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden px-4"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,166,255,0.2),transparent_42%),radial-gradient(circle_at_bottom,rgba(164,181,190,0.18),transparent_38%),rgba(248,250,252,0.72)] backdrop-blur-[14px]" />
    <div className="relative w-full max-w-3xl overflow-hidden rounded-[40px] border border-white/70 bg-white/58 px-6 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-[16px] md:px-10 md:py-10">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center rounded-full border border-white/75 bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm">
          Student Portal · v1.4
        </span>
        <MindLinkWordmark />
        <h1 className="mt-6 text-[2rem] font-semibold tracking-tight text-slate-900 md:text-[2.5rem]">
          匿名、共情、轻量地表达今天的你
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          不用长篇解释，也不会公开你的身份。轻点或长按气泡，就能留下今天的感觉；下滑还能进入本班状态社区，看看彼此此刻的气氛。
        </p>

        <div className="mt-8 grid w-full gap-3 md:grid-cols-3">
          {[
            {
              title: '匿名',
              body: '不公开显示个人身份，只保留必要的支持数据。'
            },
            {
              title: '共情',
              body: '每次表达都会看到同伴也在分享，减少“只有我这样”的孤单感。'
            },
            {
              title: '轻量',
              body: '轻点预览，长按快提，整个过程只需要几秒钟。'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-[26px] border border-white/75 bg-white/64 px-4 py-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="text-sm font-semibold text-slate-800">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">{item.body}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.2)] transition hover:bg-black"
        >
          开始体验
        </button>
      </div>
    </div>
  </motion.div>
);

// Update Props Interface if explicit (but here it's FC)
// Instead of interface, define props inline for FC
interface StudentViewProps {
  onColorChange?: (color: string | undefined) => void;
  portalMode?: PortalMode;
}

type QuickSubmitPayload = {
  mood_score: number;
  emotion_label: string;
  mood_color: string;
  content: string;
  location: string;
  class_id: string;
  category?: string;
};

type MoodSubmitResult = {
  success: boolean;
  risk_level?: string;
  today_upload_count?: number;
  daily_limit?: number;
  share_count_today?: number;
  cooldown_minutes?: number;
};

const findFacultyByClass = (className?: string) => {
  if (!className) return 'CNC';

  const faculty = Object.entries(SCHOOL_STRUCTURE).find(([, value]) =>
    value.classes.includes(className)
  );

  return faculty?.[0] || 'CNC';
};

export const StudentView: React.FC<StudentViewProps> = ({ onColorChange, portalMode = 'demo' }) => {
  const { isEnglish, t } = useDemoI18n();
  const isDemoPortal = portalMode === 'demo';
  const isDedicatedPortal = !isDemoPortal;
  const isStudentPortal = portalMode === 'student';
  const initialUrlIdentity = getStudentUrlIdentity();
  const hasRequiredIdentity = isDemoPortal || Boolean(initialUrlIdentity.studentId && initialUrlIdentity.classId);
  const initialClass = initialUrlIdentity.classId || SCHOOL_STRUCTURE.CNC.classes[0];
  const initialFaculty = findFacultyByClass(initialClass);

  const [selectedMood, setSelectedMood] = useState<MoodDef | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [lastSubmittedMood, setLastSubmittedMood] = useState<MoodDef | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(initialFaculty);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [location, setLocation] = useState<string>(getTypeLocation(initialFaculty, initialClass));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quickSubmitError, setQuickSubmitError] = useState<string | null>(null);
  const [retryPayload, setRetryPayload] = useState<QuickSubmitPayload | null>(null);
  const [retryMood, setRetryMood] = useState<MoodDef | null>(null);
  const [isRetryingQuickSubmit, setIsRetryingQuickSubmit] = useState(false);
  const [manualSubmitError, setManualSubmitError] = useState<string | null>(null);
  const [manualRetryPayload, setManualRetryPayload] = useState<QuickSubmitPayload | null>(null);
  const [manualRetryMood, setManualRetryMood] = useState<MoodDef | null>(null);
  const [isRetryingManualSubmit, setIsRetryingManualSubmit] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState<string>('');
  const [submissionMetaMessage, setSubmissionMetaMessage] = useState<string>('');
  const [showStartPage, setShowStartPage] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [guideActive, setGuideActive] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [shouldMountCommunity] = useState(true);
  const [statusComposerSignal, setStatusComposerSignal] = useState(0);
  const [hasVisitedCommunity, setHasVisitedCommunity] = useState(false);
  const [hasPublishedCommunityStatus, setHasPublishedCommunityStatus] = useState(false);
  const [lastSubmissionSource, setLastSubmissionSource] = useState<'manual' | 'quick' | null>(null);
  const communityAnchorId = 'emotion-community';
  const communitySectionRef = useRef<HTMLElement | null>(null);
  const studentGlassSoft = isStudentPortal ? 'backdrop-blur-[10px]' : 'backdrop-blur-xl';
  const studentGlassCard = isStudentPortal ? 'backdrop-blur-[12px]' : 'backdrop-blur-2xl';
  const studentPanelGlass = isStudentPortal ? 'backdrop-blur-[14px]' : 'backdrop-blur-[26px]';

  const guideSteps = useMemo<StudentGuideStep[]>(() => [
    {
      id: 'welcome',
      title: t('10 秒学会怎么用', 'Learn it in 10 seconds'),
      content: t('我们会带你走一遍最常用的 4 个动作：轻点预览、手动提交、长按快提、进入社区挂状态。跟着做一遍，之后就会很顺。', 'We will walk you through the four core actions: tap to preview, submit manually, quick-submit by holding, and post a class status. One guided pass is enough to make it feel natural.'),
      actionLabel: t('开始', 'Start')
    },
    {
      id: 'tap',
      title: t('先轻点一个气泡', 'Start by tapping one bubble'),
      content: t('轻点只是“选中”情绪，不会立刻提交。先试着点一个最接近你此刻感觉的气泡。', 'A tap only selects a mood. It does not submit yet. Try tapping the bubble that feels closest to this moment.'),
      waitingLabel: t('等你点中一个气泡', 'Waiting for you to tap a bubble')
    },
    {
      id: 'manual',
      title: t('这是精细提交区', 'This is the precise submit area'),
      content: t('选中后，下面会出现确认区。你可以改位置、补一个来源标签，然后点“提交心情”。这是最稳妥的提交方式。', 'After selection, the confirmation panel appears below. You can adjust the location, add a context label, and tap “Submit Mood”. This is the most precise way to submit.'),
      waitingLabel: t('试着完成一次手动提交', 'Try one manual submission')
    },
    {
      id: 'quick',
      title: t('再学一个更快的动作', 'Now learn the faster gesture'),
      content: t('长按任意气泡约 2 秒，会出现进度圈和外环来源。松手就能直接提交；如果顺手拖向外圈，还能补充“学习 / 同伴 / 环境”等来源。', 'Press and hold any bubble for about 2 seconds. The progress ring and outer context ring will appear. Release to submit instantly, or drag outward to add context like study, peers, or environment.'),
      waitingLabel: t('试一次长按快提', 'Try one quick hold submission')
    },
    {
      id: 'community',
      title: t('往下看本班社区', 'Scroll down to the class community'),
      content: t('第一屏负责快速反馈情绪；第二屏是“本班此刻”。往下滑，你会看到大家挂着的轻状态。', 'The first screen is for quick mood input. The second screen is “Class Now.” Scroll down to see the lightweight statuses your classmates are hanging up.'),
      waitingLabel: t('向下滑到社区', 'Scroll down to the community')
    },
    {
      id: 'status',
      title: t('最后，挂一个自己的状态', 'Finally, post one status'),
      content: t('在社区里点“发布状态”，选一个轻状态挂上去。这样你就学会了学生端的两条主线：情绪反馈和班级状态。', 'Tap “Post Status” in the community and hang up one light status. That completes both student flows: mood check-ins and class statuses.'),
      actionLabel: t('打开状态面板', 'Open Status Panel'),
      waitingLabel: t('发出一个状态就完成了', 'Publish one status to finish')
    },
    {
      id: 'done',
      title: t('你已经会用了', 'You are ready'),
      content: t('之后你只需要记住：轻点是预览，长按是快提，下滑能进社区。需要时也可以点左下角重新打开这份向导。', 'From here on, remember: tap to preview, hold to quick-submit, and scroll down for the community. You can reopen this guide later from the lower-left corner.'),
      actionLabel: t('完成', 'Finish')
    }
  ], [t]);

  const currentGuideStep = guideSteps[guideStepIndex] || guideSteps[0];
  const isGuideWaiting = guideActive && ['tap', 'manual', 'quick', 'community', 'status'].includes(currentGuideStep.id);
  const bubbleGuideActive = guideActive && (currentGuideStep.id === 'tap' || currentGuideStep.id === 'quick');
  const manualGuideActive = guideActive && currentGuideStep.id === 'manual';
  const communityGuideActive = guideActive && currentGuideStep.id === 'community';
  const statusGuideActive = guideActive && currentGuideStep.id === 'status';
  const getMoodLabel = useMemo(
    () => (mood: MoodDef | null) => {
      if (!mood) return '';
      return isEnglish ? MOOD_LABELS_EN[mood.id] || mood.label : mood.label;
    },
    [isEnglish]
  );
  const categoryOptions = useMemo(
    () =>
      MOOD_CATEGORY_CHOICES.map((option) => ({
        id: option.id,
        label: t(option.label, option.id === 'Academic'
          ? 'Academic Load'
          : option.id === 'Social'
            ? 'Peer Dynamics'
            : option.id === 'Environment'
              ? 'Campus Setting'
              : option.id === 'Health'
                ? 'Body & Mind'
                : 'Goal Pressure'),
        hint: option.id === 'Academic'
          ? t('作业 / 考试 / 课堂', 'Homework / exams / class')
          : option.id === 'Social'
            ? t('朋友 / 冲突 / 社交', 'Friends / tension / social')
            : option.id === 'Environment'
              ? t('噪音 / 拥挤 / 空间', 'Noise / crowding / space')
              : option.id === 'Health'
                ? t('疲惫 / 睡眠 / 身体感受', 'Fatigue / sleep / physical state')
                : t('目标 / 选择 / 焦虑', 'Goals / choices / pressure')
      })),
    [t]
  );

  const pickEncouragementMessage = useMemo(
    () => (moodId: string) => {
      const messages = isEnglish
        ? ENCOURAGEMENT_MESSAGES_EN[moodId] || ENCOURAGEMENT_MESSAGES_EN['calm']
        : ENCOURAGEMENT_MESSAGES[moodId] || ENCOURAGEMENT_MESSAGES['calm'];
      return messages[Math.floor(Math.random() * messages.length)] || t("你的感受被看见了，这很重要。", 'Your feelings have been seen, and that matters.');
    },
    [isEnglish, t]
  );

  useEffect(() => {
    if (!isDedicatedPortal || !hasRequiredIdentity) {
      setOnboardingLoaded(true);
      return;
    }

    let cancelled = false;
    const loadOnboarding = async () => {
      try {
        const progress = await api.student.getOnboarding();
        if (cancelled) return;
        const localGuideDone = localStorage.getItem(STUDENT_GUIDE_STORAGE_KEY) === 'true';
        const localStartSeen = localStorage.getItem(STUDENT_START_PAGE_STORAGE_KEY) === 'true';
        const startSeen = Boolean(progress?.start_seen_at) || localStartSeen;
        const guideDone = Boolean(progress?.guide_completed_at) || localGuideDone;

        if (!startSeen) {
          setShowStartPage(true);
          setGuideActive(false);
        } else if (!guideDone) {
          setShowStartPage(false);
          setGuideActive(true);
          setGuideStepIndex(0);
        } else {
          setShowStartPage(false);
          setGuideActive(false);
        }
      } catch {
        const localGuideDone = localStorage.getItem(STUDENT_GUIDE_STORAGE_KEY) === 'true';
        const localStartSeen = localStorage.getItem(STUDENT_START_PAGE_STORAGE_KEY) === 'true';
        if (!localStartSeen) {
          setShowStartPage(true);
          setGuideActive(false);
        } else if (!localGuideDone) {
          setShowStartPage(false);
          setGuideActive(true);
          setGuideStepIndex(0);
        }
      } finally {
        if (!cancelled) setOnboardingLoaded(true);
      }
    };

    loadOnboarding();
    return () => {
      cancelled = true;
    };
  }, [hasRequiredIdentity, isDedicatedPortal]);

  useEffect(() => {
    if (!isDemoPortal && initialUrlIdentity.classId) {
      const nextFaculty = findFacultyByClass(initialUrlIdentity.classId);
      setSelectedFaculty(nextFaculty);
      setSelectedClass(initialUrlIdentity.classId);
      setLocation(getTypeLocation(nextFaculty, initialUrlIdentity.classId));
    }
  }, [initialUrlIdentity.classId, isDemoPortal]);

  // Sync color to parent App
  useEffect(() => {
    if (onColorChange) {
      const target = selectedMood?.color || (showBurst ? lastSubmittedMood?.color : undefined);
      onColorChange(target);
    }
  }, [selectedMood, lastSubmittedMood, onColorChange, showBurst]);

  useEffect(() => {
    if (!hasRequiredIdentity && onColorChange) {
      onColorChange(undefined);
    }
  }, [hasRequiredIdentity, onColorChange]);

  useEffect(() => {
    if (!selectedMood) {
      setSelectedCategory(null);
    }
  }, [selectedMood]);

  useEffect(() => {
    const node = document.getElementById(communityAnchorId);
    if (!node) return;
    communitySectionRef.current = node as HTMLElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasVisitedCommunity(true);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [communityAnchorId]);

  useEffect(() => {
    if (!guideActive) return;

    if (currentGuideStep.id === 'tap' && selectedMood) {
      const timeout = window.setTimeout(() => setGuideStepIndex((prev) => prev + 1), 320);
      return () => window.clearTimeout(timeout);
    }

    if (currentGuideStep.id === 'manual' && lastSubmissionSource === 'manual') {
      const timeout = window.setTimeout(() => setGuideStepIndex((prev) => prev + 1), 260);
      return () => window.clearTimeout(timeout);
    }

    if (currentGuideStep.id === 'quick' && lastSubmissionSource === 'quick') {
      const timeout = window.setTimeout(() => setGuideStepIndex((prev) => prev + 1), 260);
      return () => window.clearTimeout(timeout);
    }

    if (currentGuideStep.id === 'community' && hasVisitedCommunity) {
      const timeout = window.setTimeout(() => setGuideStepIndex((prev) => prev + 1), 260);
      return () => window.clearTimeout(timeout);
    }

    if (currentGuideStep.id === 'status' && hasPublishedCommunityStatus) {
      const timeout = window.setTimeout(() => setGuideStepIndex((prev) => prev + 1), 260);
      return () => window.clearTimeout(timeout);
    }
  }, [
    currentGuideStep.id,
    guideActive,
    hasPublishedCommunityStatus,
    hasVisitedCommunity,
    lastSubmissionSource,
    selectedMood
  ]);

  useEffect(() => {
    if (!guideActive) return;

    if (currentGuideStep.id === 'quick') {
      setSelectedMood(null);
      setSelectedCategory(null);
      setLastSubmissionSource(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (currentGuideStep.id === 'manual') {
      setLastSubmissionSource(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (currentGuideStep.id === 'community' || currentGuideStep.id === 'status') {
      communitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentGuideStep.id, guideActive]);

  const regenerateId = () => {
    if (!isDemoPortal) return;
    localStorage.removeItem('mindlink_student_id');
    getStudentId();
  };

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
    if (isDemoPortal) {
      localStorage.setItem('mindlink_class_id', selectedClass);
    }
  }, [isDemoPortal, selectedClass]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    setLocation(getTypeLocation(selectedFaculty, newClass));
    regenerateId(); // New Identity for Demo
  };

  const submitQuickPayload = async (payload: QuickSubmitPayload) => {
    return api.submitMood(payload) as Promise<MoodSubmitResult>;
  };

  const triggerSubmissionFeedback = (mood: MoodDef, source: 'manual' | 'quick', meta?: MoodSubmitResult) => {
    setLastSubmittedMood(mood);
    setLastSubmissionSource(source);
    setEncouragementMessage(pickEncouragementMessage(mood.id));
    const todayCount = meta?.today_upload_count || 1;
    const shareCount = meta?.share_count_today || 1;
    setSubmissionMetaMessage(
      t(
        `这是你今天第 ${todayCount} 次上传，今天已有 ${shareCount} 人在这里分享了 ta 们的感觉。`,
        `This is your ${todayCount}${todayCount === 1 ? 'st' : todayCount === 2 ? 'nd' : todayCount === 3 ? 'rd' : 'th'} upload today, and ${shareCount} people have shared how they feel here today.`
      )
    );
    setShowBurst(true);
  };

  // Quick Submit (Long Press)
  const handleQuickSubmit = async (mood: MoodDef, quickCategoryId?: string) => {
    setQuickSubmitError(null);

    const payload: QuickSubmitPayload = {
      mood_score: mood.score || 3,
      emotion_label: mood.label,
      mood_color: mood.color,
      content: "气泡快速打卡",
      location: location,
      class_id: selectedClass,
      category: quickCategoryId || selectedCategory || undefined
    };

    try {
      const result = await submitQuickPayload(payload);
      setRetryPayload(null);
      setRetryMood(null);
      triggerSubmissionFeedback(mood, 'quick', result);
    } catch (error) {
      console.error("Quick submit failed", error);
      setRetryPayload(payload);
      setRetryMood(mood);
      const payloadError = (error as any)?.payload;
      if (payloadError?.error === 'TODAY_LIMIT_REACHED') {
        setQuickSubmitError(t('今天最多只能上传 6 次，明天再来记录也没关系。', 'You can upload up to 6 times per day. It is okay to come back tomorrow.'));
      } else if (payloadError?.error === 'COOLDOWN_ACTIVE') {
        const minutes = Math.max(1, Math.ceil(Number(payloadError?.retry_after_ms || 0) / 60000));
        setQuickSubmitError(t(`两次提交至少间隔 30 分钟，请大约 ${minutes} 分钟后再试。`, `Uploads must be at least 30 minutes apart. Please try again in about ${minutes} minutes.`));
      } else {
        setQuickSubmitError(t('刚刚那次打卡没有成功上传。', 'The last check-in was not uploaded successfully.'));
      }
    }
  };

  const handleRetryQuickSubmit = async () => {
    if (!retryPayload) return;

    setIsRetryingQuickSubmit(true);
    setQuickSubmitError(null);
    try {
      const result = await submitQuickPayload(retryPayload);
      setRetryPayload(null);
      if (retryMood) {
        triggerSubmissionFeedback(retryMood, 'quick', result);
      }
      setRetryMood(null);
    } catch (error) {
      console.error("Quick submit retry failed", error);
      const payloadError = (error as any)?.payload;
      if (payloadError?.error === 'TODAY_LIMIT_REACHED') {
        setQuickSubmitError(t('今天最多只能上传 6 次，明天再来记录也没关系。', 'You can upload up to 6 times per day. It is okay to come back tomorrow.'));
      } else if (payloadError?.error === 'COOLDOWN_ACTIVE') {
        const minutes = Math.max(1, Math.ceil(Number(payloadError?.retry_after_ms || 0) / 60000));
        setQuickSubmitError(t(`两次提交至少间隔 30 分钟，请大约 ${minutes} 分钟后再试。`, `Uploads must be at least 30 minutes apart. Please try again in about ${minutes} minutes.`));
      } else {
        setQuickSubmitError(t('重试仍未成功，请检查网络后再试一次。', 'Retry failed again. Please check the network and try once more.'));
      }
    } finally {
      setIsRetryingQuickSubmit(false);
    }
  };

  const handleRetryManualSubmit = async () => {
    if (!manualRetryPayload || !manualRetryMood) return;

    setIsRetryingManualSubmit(true);
    setManualSubmitError(null);
    try {
      const result = await submitQuickPayload(manualRetryPayload);
      setManualRetryPayload(null);
      setManualRetryMood(null);
      setSelectedMood(null);
      setSelectedCategory(null);
      triggerSubmissionFeedback(manualRetryMood, 'manual', result);
    } catch (error) {
      console.error("Manual submit retry failed", error);
      const payloadError = (error as any)?.payload;
      if (payloadError?.error === 'TODAY_LIMIT_REACHED') {
        setManualSubmitError(t('今天最多只能上传 6 次，明天再来记录也没关系。', 'You can upload up to 6 times per day. It is okay to come back tomorrow.'));
      } else if (payloadError?.error === 'COOLDOWN_ACTIVE') {
        const minutes = Math.max(1, Math.ceil(Number(payloadError?.retry_after_ms || 0) / 60000));
        setManualSubmitError(t(`两次提交至少间隔 30 分钟，请大约 ${minutes} 分钟后再试。`, `Uploads must be at least 30 minutes apart. Please try again in about ${minutes} minutes.`));
      } else {
        setManualSubmitError(t('重试仍未成功，请检查网络后再试一次。', 'Retry failed again. Please check the network and try once more.'));
      }
    } finally {
      setIsRetryingManualSubmit(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    setManualSubmitError(null);
    try {
      const payload: QuickSubmitPayload = {
        mood_score: selectedMood.score || 3, // Default to 3 (Neutral) if missing
        emotion_label: selectedMood.label,
        mood_color: selectedMood.color,
        content: "气泡点选提交",
        location: location,
        class_id: selectedClass,
        category: selectedCategory || undefined
      };

      const result = await api.submitMood(payload) as MoodSubmitResult;
      setManualRetryPayload(null);
      setManualRetryMood(null);

      // Show burst effect after manual submit too
      setSelectedMood(null); // Clear input selection
      setSelectedCategory(null);
      triggerSubmissionFeedback(selectedMood, 'manual', result);    // Trigger burst/comfort flow

    } catch (e) {
      console.error("Submission failed", e);
      setManualRetryPayload({
        mood_score: selectedMood.score || 3,
        emotion_label: selectedMood.label,
        mood_color: selectedMood.color,
        content: "气泡点选提交",
        location: location,
        class_id: selectedClass,
        category: selectedCategory || undefined
      });
      setManualRetryMood(selectedMood);
      const payloadError = (e as any)?.payload;
      if (payloadError?.error === 'TODAY_LIMIT_REACHED') {
        setManualSubmitError(t('今天最多只能上传 6 次，明天再来记录也没关系。', 'You can upload up to 6 times per day. It is okay to come back tomorrow.'));
      } else if (payloadError?.error === 'COOLDOWN_ACTIVE') {
        const minutes = Math.max(1, Math.ceil(Number(payloadError?.retry_after_ms || 0) / 60000));
        setManualSubmitError(t(`两次提交至少间隔 30 分钟，请大约 ${minutes} 分钟后再试。`, `Uploads must be at least 30 minutes apart. Please try again in about ${minutes} minutes.`));
      } else {
        setManualSubmitError(t('这次提交还没有保存成功。', 'This submission has not been saved yet.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasRequiredIdentity) {
    return (
      <section className="min-h-[76svh] w-full flex items-center justify-center px-4">
        <div className={`w-full max-w-lg rounded-[32px] border border-white/65 bg-white/76 p-7 md:p-9 ${studentGlassCard} shadow-[0_28px_60px_rgba(15,23,42,0.12)] text-center`}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500 shadow-sm">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-[1.8rem] md:text-[2rem] font-semibold tracking-tight text-slate-800">{t('链接信息不完整', 'Missing Link Parameters')}</h1>
          <p className="mt-3 text-sm md:text-base font-medium leading-relaxed text-slate-500">
            {t('当前学生端缺少必要身份参数，暂时无法进入匿名打卡页。', 'This student portal is missing the required identity parameters, so the anonymous check-in view cannot be opened yet.')}
            <br />
            {t('请联系老师或运维重新打开正确链接。', 'Please ask a teacher or operator to reopen the correct link.')}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {t('需要参数', 'Required')}
            <span className="text-slate-500">studentId</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">classId</span>
          </div>
        </div>
      </section>
    );
  }

  if (isDedicatedPortal && !onboardingLoaded) {
    return (
      <section className="min-h-[76svh] w-full flex items-center justify-center px-4">
        <div className={`rounded-[28px] border border-white/65 bg-white/76 px-5 py-4 text-sm font-medium text-slate-500 ${studentGlassCard} shadow-[0_24px_54px_rgba(15,23,42,0.1)]`}>
          正在准备学生端体验...
        </div>
      </section>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isDedicatedPortal && showStartPage && (
          <StudentStartPage
            version="v1.4"
            onContinue={async () => {
              localStorage.setItem(STUDENT_START_PAGE_STORAGE_KEY, 'true');
              try {
                await api.student.updateOnboarding({ mark_start_seen: true });
              } catch {}
              setShowStartPage(false);
              setGuideActive(true);
              setGuideStepIndex(0);
            }}
          />
        )}
      </AnimatePresence>

        <AnimatePresence>
          {quickSubmitError && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`fixed left-1/2 top-4 z-[120] w-[min(92vw,520px)] -translate-x-1/2 rounded-[24px] border border-amber-200/70 bg-white/88 px-4 py-3 ${studentGlassCard} shadow-[0_18px_40px_rgba(15,23,42,0.12)]`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <AlertCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{t('打卡还没有保存成功', 'Check-in not saved yet')}</p>
                  <p className="text-xs text-slate-500">{quickSubmitError}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetryQuickSubmit}
                  disabled={!retryPayload || isRetryingQuickSubmit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
                >
                  {isRetryingQuickSubmit ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {t('重试', 'Retry')}
                </button>
              </div>
            </motion.div>
          )}
          {manualSubmitError && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: quickSubmitError ? 98 : 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`fixed left-1/2 top-4 z-[119] w-[min(92vw,520px)] -translate-x-1/2 rounded-[24px] border border-amber-200/70 bg-white/88 px-4 py-3 ${studentGlassCard} shadow-[0_18px_40px_rgba(15,23,42,0.12)]`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <AlertCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{t('提交还没有保存成功', 'Submission not saved yet')}</p>
                  <p className="text-xs text-slate-500">{manualSubmitError}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetryManualSubmit}
                  disabled={!manualRetryPayload || !manualRetryMood || isRetryingManualSubmit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
                >
                  {isRetryingManualSubmit ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {t('重试', 'Retry')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className={`flex flex-col items-center justify-center relative transition-all duration-700 w-full max-w-6xl mx-auto ${isDedicatedPortal ? 'min-h-[100svh] pb-20 md:pb-24' : 'min-h-[100svh] pb-24 md:pb-28'}`}>

        {isDemoPortal && (
          <div className="absolute top-0 left-0 md:left-4 z-50 flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-md p-1 md:p-1.5 rounded-xl border border-white/20 max-w-[60vw] md:max-w-none overflow-hidden mt-2 md:mt-0">
            <span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0">{t('当前身份:', 'Current identity:')}</span>
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
        )}



        {/* --- HEADER: Text Morphing --- */}
        <div className="w-full max-w-3xl px-2 text-center mb-4 md:mb-5 mt-2 md:mt-0">
          <div className="min-h-[108px] md:min-h-[124px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {!selectedMood ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  className="flex flex-col items-center gap-3.5"
                >
                  {isDedicatedPortal && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase shadow-sm">
                      {t('匿名反馈', 'Anonymous Check-In')}
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      {selectedClass}
                    </span>
                  )}
                  <h1 className="text-[2.1rem] md:text-[2.85rem] font-semibold text-slate-800/90 tracking-tight text-center leading-[1.04]">
                    {t('今天感觉如何？', 'How are you feeling today?')}
                  </h1>
                  <p className={`max-w-md text-[12px] md:text-sm font-medium text-slate-500 text-center px-4 py-2.5 rounded-full bg-white/62 ${isStudentPortal ? 'backdrop-blur-[6px]' : 'backdrop-blur-md'} border border-white/60 shadow-sm`}>
                    {t('轻触选择情绪，长按可直接提交，拖向外圈可补充来源', 'Tap to choose a mood. Press and hold to submit. Drag outward to add context.')}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="comfort"
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  className="text-center flex flex-col items-center gap-2"
                >
                  <span className="inline-flex items-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase shadow-sm">
                    {t('已选情绪', 'Selected Mood')}
                  </span>
                  <h1 className="text-[1.9rem] md:text-[2.4rem] font-semibold text-slate-900 leading-tight">
                    {t(`我感受到了你的"${getMoodLabel(selectedMood)}"。`, `I can feel your "${getMoodLabel(selectedMood)}".`)}
                  </h1>
                  <p className="text-sm md:text-base text-slate-500 font-medium">{t('确认位置后，一次提交即可完成记录。', 'Confirm the location and submit in one step.')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- TASK 2: Mood Playground (Physics Cloud) --- */}
        <div className="flex-1 w-full flex items-center justify-center relative mt-1 md:mt-0">
          {/* Close Button when mood selected */}
          {/* 选中心情时的关闭按钮 */}
          <AnimatePresence>
            {selectedMood && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setSelectedMood(null)}
                className={`absolute top-4 right-2 md:right-6 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/65 bg-white/78 ${studentGlassSoft} text-slate-500 shadow-sm hover:bg-white transition-colors`}
              >
                <X size={20} className="text-slate-500" />
              </motion.button>
            )}
          </AnimatePresence>

          <MoodPlayground
            onSelect={setSelectedMood}
            onQuickSubmit={handleQuickSubmit}
            selectedMoodId={selectedMood?.id}
            guidePreviewBubbleId={null}
            showGuideRingPreview={false}
            className={isDedicatedPortal ? 'h-[41svh] min-h-[320px] max-h-[450px] md:h-[42vh]' : 'h-[48vh] min-h-[360px] max-h-[540px] md:h-[52vh]'}
          />
          {bubbleGuideActive && <GuideFocusRing active={bubbleGuideActive} className="rounded-[38px]" />}
        </div>

        {/* --- 任务5: 输入岛 (可选上下文) --- */}
        <AnimatePresence>
          {selectedMood && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={springTransition}
              className={`fixed ${isDemoPortal ? 'bottom-[108px] md:bottom-8' : 'bottom-4 md:bottom-8'} w-[92%] max-w-2xl z-50 pointer-events-auto`}
            >
              <div className={`bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.74)_100%)] ${studentPanelGlass} border border-white/60 shadow-[0_20px_48px_rgba(15,23,42,0.12)] rounded-[30px] px-4 py-4 md:px-5 md:py-4 flex flex-col gap-4`}>
                {manualGuideActive && <GuideFocusRing active={manualGuideActive} className="rounded-[30px]" />}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t('准备提交', 'Ready')}</p>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/5"
                        style={{ backgroundColor: selectedMood.color }}
                      />
                      <span className="text-lg md:text-xl font-semibold text-slate-800">{getMoodLabel(selectedMood)}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">{t('确认一次位置后即可完成提交。', 'Confirm the location once to finish this check-in.')}</p>
                  </div>

                  <div className="md:min-w-[168px]">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1.5">{t('当前位置', 'Location')}</label>
                    <div className="flex items-center text-indigo-600 gap-2 bg-indigo-50/75 px-3.5 py-2.5 rounded-full border border-indigo-100 shadow-sm">
                      <MapPin size={14} fill="currentColor" className="opacity-80" />
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-transparent text-xs font-semibold outline-none text-indigo-800 cursor-pointer min-w-[72px] w-full"
                      >
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {t('如果愿意补充一下', 'Optional context')}
                    </label>
                    <span className="text-[11px] text-slate-400">{t('可跳过，也可长按时顺手拖向外圈', 'You can skip this or drag outward while holding.')}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {categoryOptions.map((option) => {
                      const isActive = selectedCategory === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedCategory(isActive ? null : option.id)}
                          className={`rounded-2xl border px-3 py-2.5 text-left transition-all ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                              : 'border-white/70 bg-white/58 text-slate-600 hover:bg-white/82'
                          }`}
                        >
                          <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                            {option.label}
                          </div>
                          <div className={`mt-0.5 text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                            {option.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 md:gap-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full md:w-auto min-w-[176px] h-11.5 md:h-12 rounded-full bg-slate-900 text-white flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-colors disabled:opacity-50 px-5"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={18} />
                        <span className="font-bold">{t('提交心情', 'Submit Mood')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {!selectedMood && (
            <motion.a
              href={`#${communityAnchorId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            className={`absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 inline-flex flex-col items-center gap-1 rounded-full border border-white/55 bg-white/54 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${studentGlassSoft} hover:bg-white/70 transition-colors pointer-events-auto`}
          >
            <span>{t('上滑进入社区', 'Swipe up for the community')}</span>
            <ChevronDown size={15} className="animate-bounce text-slate-400" />
          </motion.a>
          )}
      </section>

      {isDemoPortal && (
        <div
          className={`fixed bottom-[90px] md:bottom-3 right-2 md:right-3 max-w-[280px] rounded-[20px] border border-white/65 bg-white/74 px-3.5 py-3 ${studentGlassSoft} shadow-[0_14px_30px_rgba(15,23,42,0.08)] pointer-events-auto z-40`}
        >
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">MINDLINK DEMO MODE</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            This mode is for demonstration purposes.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            All the results will be shown in the independent demo dashboard and be saved in the demo database.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            For real scenario demonstration, please add ID/Class strings after the URL.
          </p>
        </div>
      )}

      {/* --- TASK 6: Community Feed (Second Screen) --- */}
      <section
        id={communityAnchorId}
        className={`w-full max-w-5xl mx-auto min-h-[100svh] ${isDedicatedPortal ? 'pt-8 pb-10' : 'pt-10 pb-24'} relative z-10 px-2 md:px-4 scroll-mt-0`}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '960px' }}
      >
        <div className="relative">
          {communityGuideActive && <GuideFocusRing active={communityGuideActive} className="rounded-[34px]" />}
          {shouldMountCommunity ? (
            <Suspense
              fallback={
                <div className={`rounded-[32px] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.34)_100%)] px-5 py-6 ${isStudentPortal ? 'backdrop-blur-[10px]' : 'backdrop-blur-[18px]'} shadow-[0_18px_46px_rgba(15,23,42,0.06)]`}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 w-32 rounded-full bg-white/70" />
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)]">
                      <div className="h-40 rounded-[28px] bg-white/60" />
                      <div className="h-40 rounded-[28px] bg-white/54" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="h-28 rounded-[24px] bg-white/56" />
                      <div className="h-28 rounded-[24px] bg-white/52" />
                      <div className="h-28 rounded-[24px] bg-white/48" />
                    </div>
                  </div>
                </div>
              }
            >
              <LazyStatusFeed
                composerOpenSignal={statusComposerSignal}
                onStatusPublished={() => setHasPublishedCommunityStatus(true)}
                highlightComposer={statusGuideActive}
              />
            </Suspense>
          ) : (
            <div className="rounded-[32px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.28)_100%)] px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t('本班此刻', 'Class Now')}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-700">
                    {t('继续下滑，马上进入本班社区', 'Keep scrolling to enter the class community')}
                  </div>
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 rounded-[24px] bg-white/55" />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="h-24 rounded-[22px] bg-white/48" />
                    <div className="h-24 rounded-[22px] bg-white/44" />
                    <div className="h-24 rounded-[22px] bg-white/40" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 爆发和安慰信息叠加层 */}
      <AnimatePresence>
        {showBurst && lastSubmittedMood && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* 爆发粒子 */}
            <BurstAnimation color={lastSubmittedMood.color} onComplete={() => {
              // 动画结束后自动关闭 + 小延迟
              setTimeout(() => {
                setShowBurst(false);
                setLastSubmittedMood(null);
                setEncouragementMessage('');
                setSubmissionMetaMessage('');
              }, 2500);
            }} />

            {/* 安慰信息 - 延迟后出现 */}
            {/* 安慰信息 - 延迟后出现 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={`absolute text-center p-7 md:p-8 bg-white/55 ${studentGlassCard} rounded-[28px] shadow-[0_24px_52px_rgba(15,23,42,0.18)] border border-white/50 max-w-sm mx-4`}
            >
              <h2 className="text-[2rem] font-semibold text-slate-800 mb-4">{t('收到你的心声', 'We heard you')}</h2>
              <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
                {encouragementMessage || t("你的感受被看见了，这很重要。", 'Your feelings have been seen, and that matters.')}
                <br />
                <span className="mt-4 block text-sm leading-6 text-slate-500">
                  {submissionMetaMessage}
                </span>
                <span className="text-sm opacity-60 mt-4 block">{t('深呼吸，给自己一点空间。', 'Take a breath and give yourself a little space.')}</span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isDedicatedPortal && !guideActive && (
        <button
          type="button"
          onClick={() => {
            setGuideActive(true);
            setGuideStepIndex(0);
            setHasVisitedCommunity(false);
            setHasPublishedCommunityStatus(false);
            setLastSubmissionSource(null);
            localStorage.removeItem(STUDENT_GUIDE_STORAGE_KEY);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`fixed bottom-5 left-4 z-[120] inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-[0_12px_28px_rgba(15,23,42,0.1)] ${studentGlassSoft} hover:bg-white`}
        >
          <Sparkles size={15} />
          {t('使用向导', 'Guide')}
        </button>
      )}

      <AnimatePresence mode="wait">
        {guideActive && (
          <StudentGuideCard
            key={currentGuideStep.id}
            step={currentGuideStep}
            index={guideStepIndex}
            total={guideSteps.length}
            placementClassName={currentGuideStep.id === 'manual' ? 'top-5 bottom-auto' : ''}
            waiting={isGuideWaiting && currentGuideStep.id !== 'status'}
            onNext={() => {
              if (currentGuideStep.id === 'welcome') {
                setGuideStepIndex(1);
                return;
              }
              if (currentGuideStep.id === 'status') {
                setStatusComposerSignal((value) => value + 1);
                return;
              }
              if (currentGuideStep.id === 'done') {
                localStorage.setItem(STUDENT_GUIDE_STORAGE_KEY, 'true');
                api.student.updateOnboarding({ mark_guide_completed: true }).catch(() => {});
                setGuideActive(false);
                return;
              }
              setGuideStepIndex((prev) => Math.min(prev + 1, guideSteps.length - 1));
            }}
            onClose={() => {
              localStorage.setItem(STUDENT_GUIDE_STORAGE_KEY, 'true');
              api.student.updateOnboarding({ mark_guide_completed: true }).catch(() => {});
              setGuideActive(false);
            }}
            auxiliaryAction={currentGuideStep.id === 'manual' && !selectedMood ? {
              label: t('重新点一个气泡', 'Pick a bubble again'),
              onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
            } : currentGuideStep.id === 'status' ? {
              label: t('滚动到社区', 'Go to community'),
              onClick: () => communitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } : null}
          />
        )}
      </AnimatePresence>
    </>
  );
};
