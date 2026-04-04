export type PortalMode = 'demo' | 'student' | 'teacher' | 'admin' | 'console';

const PORTAL_VALUES: PortalMode[] = ['demo', 'student', 'teacher', 'admin', 'console'];

const normalizeParam = (value: string | null): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const getPortalMode = (): PortalMode => {
  if (typeof window === 'undefined') return 'demo';

  const params = new URLSearchParams(window.location.search);
  const portalOverride = normalizeParam(params.get('portal'))?.toLowerCase();
  if (portalOverride && PORTAL_VALUES.includes(portalOverride as PortalMode)) {
    return portalOverride as PortalMode;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('student.')) return 'student';
  if (hostname.startsWith('teacher.')) return 'teacher';
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('console.')) return 'console';
  return 'demo';
};

export const getStudentUrlIdentity = () => {
  if (typeof window === 'undefined') {
    return { studentId: undefined, classId: undefined };
  }

  const params = new URLSearchParams(window.location.search);
  const studentId =
    normalizeParam(params.get('studentId')) ||
    normalizeParam(params.get('student_id')) ||
    normalizeParam(params.get('sid'));
  const classId =
    normalizeParam(params.get('classId')) ||
    normalizeParam(params.get('class_id')) ||
    normalizeParam(params.get('class'));

  return { studentId, classId };
};
