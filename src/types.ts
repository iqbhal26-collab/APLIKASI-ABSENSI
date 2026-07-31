export type UserRole = 'admin' | 'guru' | 'guru_piket' | 'guru_agama' | 'orang_tua' | 'siswa';

export type Gender = 'L' | 'P'; // Laki-laki | Perempuan

export type AttendanceStatus = 'hadir' | 'terlambat' | 'sakit' | 'izin' | 'alpa' | 'belum_absen';

export interface ActivityType {
  id: string;
  code: string; // e.g. 'DATANG', 'PULANG', 'DZUHUR', 'JUMAT'
  name: string; // e.g. 'Jam Datang', 'Jam Pulang', 'Sholat Dzuhur', 'Sholat Jumat'
  startTime: string; // e.g. '06:30'
  endTime: string; // e.g. '07:15'
  genderConstraint?: 'L' | 'P' | 'ALL'; // 'L' for Sholat Jumat
  dayConstraint?: number[]; // [1,2,3,4,5] (1=Monday ... 5=Friday)
  isActive: boolean;
  isRequired: boolean;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: Gender;
  classId: string;
  className: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  avatarUrl?: string;
  qrCode: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  address?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  studentId?: string; // Linked student for role 'siswa' or 'orang_tua'
  classHandled?: string[]; // For role 'guru' (wali kelas)
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  gender: Gender;
  date: string; // YYYY-MM-DD
  activityId: string;
  activityCode: string;
  activityName: string;
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  verifiedBy?: string; // Teacher or System
  method: 'QR_SCAN' | 'MANUAL_GURU' | 'IZIN_ORANGTUA';
  attachmentUrl?: string;
}

export interface PermitSubmission {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentId: string;
  parentName: string;
  type: 'sakit' | 'izin';
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PushNotification {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientId?: string; // e.g. parent ID
  title: string;
  message: string;
  type: 'LATE' | 'ABSENT' | 'CHECK_IN' | 'PERMIT_REQUEST' | 'SYSTEM';
  timestamp: string;
  isRead: boolean;
  studentName?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "X IPA 1"
  grade: 'X' | 'XI' | 'XII';
  major: 'IPA' | 'IPS' | 'BAHASA' | 'UMUM';
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentCount: number;
}

export interface SchoolConfig {
  schoolName: string;
  npsn: string;
  address: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  principalName: string;
  principalNip: string;
  toleranceMinutes: number; // e.g. 15 mins
  logoUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  useSupabaseLive: boolean;
}
