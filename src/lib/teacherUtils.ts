import { User, SchoolClass } from '../types';

/**
 * Normalizes strings by removing non-alphanumeric characters and converting to lowercase.
 */
export const normalizeClassString = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Determines whether a teacher (User) is the homeroom teacher for a given SchoolClass.
 */
export const isTeacherClassMatch = (user: User | null | undefined, c: SchoolClass): boolean => {
  if (!user) return false;

  const cIdNorm = normalizeClassString(c.id);
  const cNameNorm = normalizeClassString(c.name);

  // 1. Check user.classHandled array
  if (Array.isArray(user.classHandled) && user.classHandled.length > 0) {
    for (const h of user.classHandled) {
      const hNorm = normalizeClassString(String(h));
      if (hNorm === cIdNorm || hNorm === cNameNorm) return true;
      if (cNameNorm.length >= 2 && (hNorm.includes(cNameNorm) || cNameNorm.includes(hNorm))) return true;
    }
  }

  // 2. Check c.homeroomTeacherId
  if (c.homeroomTeacherId && user.id && c.homeroomTeacherId === user.id) return true;

  // 3. Check c.homeroomTeacherName vs user.name
  if (c.homeroomTeacherName && user.name) {
    const hrNorm = normalizeClassString(c.homeroomTeacherName);
    const uNameNorm = normalizeClassString(user.name);
    if (uNameNorm && (hrNorm === uNameNorm || hrNorm.includes(uNameNorm) || uNameNorm.includes(hrNorm))) return true;

    // Remove titles like S.Pd, M.Pd, etc.
    const sanitizeTitle = (s: string) => s.toLowerCase()
      .replace(/\b(s\.?pd|m\.?pd|m\.?si|dra|dr|h|hj|s\.?ag|s\.?kom|s\.?st|gr)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const hrClean = sanitizeTitle(c.homeroomTeacherName);
    const userClean = sanitizeTitle(user.name);
    if (hrClean && userClean && (hrClean === userClean || hrClean.includes(userClean) || userClean.includes(hrClean))) {
      return true;
    }
  }

  // 4. Check user.username, user.name, user.email against c.name (e.g. XI.B2, X.1, X IPA 1)
  if (cNameNorm && cNameNorm.length >= 2) {
    const uUsernameNorm = normalizeClassString(user.username);
    const uNameNorm = normalizeClassString(user.name);
    const uEmailNorm = normalizeClassString(user.email);

    if (uUsernameNorm.includes(cNameNorm) || uNameNorm.includes(cNameNorm) || uEmailNorm.includes(cNameNorm)) {
      return true;
    }
  }

  return false;
};

/**
 * Returns the array of SchoolClass items that belong to the teacher.
 * If no specific match is found for a teacher, returns only the first available class or empty array,
 * to prevent leaking other classes' data to unassigned teachers.
 */
export const getTeacherClasses = (user: User | null | undefined, classes: SchoolClass[]): SchoolClass[] => {
  if (!user || user.role !== 'guru') return classes;

  const matched = classes.filter(c => isTeacherClassMatch(user, c));
  if (matched.length > 0) return matched;

  // If user has classHandled containing a string that doesn't match existing classes by ID/Name directly
  if (Array.isArray(user.classHandled) && user.classHandled.length > 0) {
    const virtualTarget = normalizeClassString(user.classHandled[0]);
    const matchedVirtual = classes.filter(c => normalizeClassString(c.name).includes(virtualTarget));
    if (matchedVirtual.length > 0) return matchedVirtual;
  }

  // Fallback: Return the first class if classes exists
  return classes.length > 0 ? [classes[0]] : [];
};
