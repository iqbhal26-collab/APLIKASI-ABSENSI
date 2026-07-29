import { User, SchoolClass, Student } from '../types';

/**
 * Normalizes strings by removing non-alphanumeric characters and converting to lowercase.
 */
export const normalizeClassString = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Sanitize academic titles from teacher names
 */
export const sanitizeTitle = (s: string | undefined | null): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\b(s\.?pd|m\.?pd|m\.?si|dra|dr|h|hj|s\.?ag|s\.?kom|s\.?st|gr|m\.?kom)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
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
      if (!h) continue;
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
    if (uNameNorm && hrNorm && (hrNorm === uNameNorm || hrNorm.includes(uNameNorm) || uNameNorm.includes(hrNorm))) return true;

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
 * Never leaks another teacher's class.
 */
export const getTeacherClasses = (
  user: User | null | undefined,
  classes: SchoolClass[],
  students: Student[] = []
): SchoolClass[] => {
  if (!user || user.role !== 'guru') return classes;

  // 1. Direct matches in existing classes list
  const matched = classes.filter(c => isTeacherClassMatch(user, c));
  if (matched.length > 0) return matched;

  // 2. Match via user.classHandled if it contains target class ID/Name
  if (Array.isArray(user.classHandled) && user.classHandled.length > 0) {
    const targets = user.classHandled.map(h => normalizeClassString(String(h))).filter(Boolean);
    const matchedVirtual = classes.filter(c => {
      const cNormName = normalizeClassString(c.name);
      const cNormId = normalizeClassString(c.id);
      return targets.some(t => t === cNormName || t === cNormId || (t.length >= 2 && (cNormName.includes(t) || t.includes(cNormName))));
    });
    if (matchedVirtual.length > 0) return matchedVirtual;
  }

  // 3. Match via user credentials (username, name, email) against class names
  const userTextNorm = [user.username, user.name, user.email].map(s => normalizeClassString(s)).join(' ');
  const matchedFromUserText = classes.filter(c => {
    const cNameNorm = normalizeClassString(c.name);
    return cNameNorm && cNameNorm.length >= 2 && userTextNorm.includes(cNameNorm);
  });
  if (matchedFromUserText.length > 0) return matchedFromUserText;

  // 4. Try matching with students array if students exist for this class handled
  if (Array.isArray(user.classHandled) && user.classHandled.length > 0) {
    for (const h of user.classHandled) {
      if (!h) continue;
      const hNorm = normalizeClassString(String(h));
      const studentClassMatches = students.filter(s => normalizeClassString(s.className) === hNorm || s.classId === h);
      if (studentClassMatches.length > 0) {
        const firstStdClass = studentClassMatches[0].className || String(h);
        return [{
          id: `cls-v-${hNorm}`,
          name: firstStdClass,
          grade: firstStdClass.startsWith('XII') ? 'XII' : firstStdClass.startsWith('XI') ? 'XI' : 'X',
          major: firstStdClass.includes('IPA') ? 'IPA' : firstStdClass.includes('IPS') ? 'IPS' : 'UMUM',
          homeroomTeacherId: user.id,
          homeroomTeacherName: user.name,
          studentCount: studentClassMatches.length
        }];
      }
    }
  }

  // 5. Try matching unique classNames from students against userTextNorm
  const uniqueClassNames = Array.from(new Set(students.map(s => s.className).filter(Boolean)));
  for (const cName of uniqueClassNames) {
    const cNorm = normalizeClassString(cName);
    if (cNorm && cNorm.length >= 2 && userTextNorm.includes(cNorm)) {
      const stdCount = students.filter(s => normalizeClassString(s.className) === cNorm).length;
      return [{
        id: `cls-v-${cNorm}`,
        name: cName,
        grade: cName.startsWith('XII') ? 'XII' : cName.startsWith('XI') ? 'XI' : 'X',
        major: cName.includes('IPA') ? 'IPA' : cName.includes('IPS') ? 'IPS' : 'UMUM',
        homeroomTeacherId: user.id,
        homeroomTeacherName: user.name,
        studentCount: stdCount
      }];
    }
  }

  // 6. If user.classHandled has an entry, create a class object for that entry
  if (Array.isArray(user.classHandled) && user.classHandled.length > 0 && user.classHandled[0]) {
    const classNameStr = String(user.classHandled[0]);
    const stdCount = students.filter(s => normalizeClassString(s.className) === normalizeClassString(classNameStr)).length;
    return [{
      id: `cls-handled-${normalizeClassString(classNameStr)}`,
      name: classNameStr,
      grade: classNameStr.startsWith('XII') ? 'XII' : classNameStr.startsWith('XI') ? 'XI' : 'X',
      major: classNameStr.includes('IPA') ? 'IPA' : classNameStr.includes('IPS') ? 'IPS' : 'UMUM',
      homeroomTeacherId: user.id,
      homeroomTeacherName: user.name,
      studentCount: stdCount
    }];
  }

  // 7. If still no match, return empty array (DO NOT leak other teachers' classes)
  return [];
};

