/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Check, Settings } from 'lucide-react';
import {
  User,
  UserRole,
  Student,
  SchoolClass,
  ActivityType,
  AttendanceRecord,
  PermitSubmission,
  PushNotification,
  SchoolConfig,
  AttendanceStatus
} from './types';
import {
  PERMANENT_SUPABASE_URL,
  PERMANENT_SUPABASE_ANON_KEY,
  initialSchoolConfig,
  initialActivities,
  initialClasses,
  initialStudents,
  initialUsers,
  initialAttendanceRecords,
  initialPermitSubmissions,
  initialNotifications
} from './data/mockData';
import {
  fetchAllFromSupabase,
  seedSupabaseData,
  dbAddStudent,
  dbBatchAddStudents,
  dbDeleteStudent,
  dbRecordAttendance,
  dbSubmitPermit,
  dbUpdatePermitStatus,
  dbUpdateActivities,
  dbUpdateClasses,
  dbDeleteClass,
  dbUpdateSchoolConfig,
  dbPushNotification,
  dbMarkNotificationRead,
  dbAddTeacher,
  dbDeleteTeacher
} from './lib/supabaseSync';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { RoleSelectorModal } from './components/RoleSelectorModal';
import { AttendanceScannerModal } from './components/common/AttendanceScannerModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ReportExportModal } from './components/common/ReportExportModal';
import { ExcelImportModal } from './components/admin/ExcelImportModal';
import { ParsedStudentRow, ParsedTeacherRow } from './lib/excelTemplates';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherManagement } from './components/admin/TeacherManagement';
import { ClassManagement } from './components/admin/ClassManagement';
import { UserManagement } from './components/admin/UserManagement';
import { StudentCardPrinter } from './components/admin/StudentCardPrinter';
import { ActivityManagement } from './components/admin/ActivityManagement';
import { SystemConfig } from './components/admin/SystemConfig';

import { GuruDashboard } from './components/guru/GuruDashboard';
import { ReligionTeacherDashboard } from './components/guru_agama/ReligionTeacherDashboard';
import { ParentDashboard } from './components/orangtua/ParentDashboard';
import { StudentDashboard } from './components/siswa/StudentDashboard';

export default function App() {
  // Load state from localStorage or initial mock data
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => {
    const saved = localStorage.getItem('sma_school_config');
    const parsed = saved ? JSON.parse(saved) : initialSchoolConfig;
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    const url = parsed.supabaseUrl || metaEnv.VITE_SUPABASE_URL || initialSchoolConfig.supabaseUrl || PERMANENT_SUPABASE_URL;
    const key = parsed.supabaseAnonKey || metaEnv.VITE_SUPABASE_ANON_KEY || initialSchoolConfig.supabaseAnonKey || PERMANENT_SUPABASE_ANON_KEY;
    return {
      ...parsed,
      supabaseUrl: url,
      supabaseAnonKey: key,
      useSupabaseLive: true,
    };
  });

  const [activities, setActivities] = useState<ActivityType[]>(() => {
    const saved = localStorage.getItem('sma_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('sma_classes');
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sma_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sma_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('sma_attendance_records');
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [permits, setPermits] = useState<PermitSubmission[]>(() => {
    const saved = localStorage.getItem('sma_permits');
    return saved ? JSON.parse(saved) : initialPermitSubmissions;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('sma_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Authentication & Current active user login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem('sma_is_authenticated');
    return savedAuth === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('sma_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // ignore
      }
    }
    return users.find(u => u.role === 'admin') || users[0];
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('sma_is_authenticated', 'true');
    localStorage.setItem('sma_current_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('sma_is_authenticated', 'false');
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  // Supabase sync status state
  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    message: string | null;
    isError: boolean;
  }>({
    isSyncing: false,
    message: null,
    isError: false,
  });

  // Fetch all data from Supabase Cloud Database
  const handleFetchFromSupabase = async (cfg: SchoolConfig = schoolConfig) => {
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    const url = cfg.supabaseUrl || metaEnv.VITE_SUPABASE_URL || PERMANENT_SUPABASE_URL;
    const key = cfg.supabaseAnonKey || metaEnv.VITE_SUPABASE_ANON_KEY || PERMANENT_SUPABASE_ANON_KEY;

    if (!url || !key) return;

    const activeCfg: SchoolConfig = {
      ...cfg,
      supabaseUrl: url,
      supabaseAnonKey: key,
      useSupabaseLive: true,
    };

    setSyncStatus({ isSyncing: true, message: 'Menghubungkan & menarik data otomatis dari Supabase...', isError: false });
    const result = await fetchAllFromSupabase(activeCfg);

    if (result.success) {
      if (result.isEmpty) {
        setSyncStatus({ isSyncing: true, message: 'Tabel Supabase masih kosong. Mengunggah data awal ke Supabase...', isError: false });
        const seedRes = await seedSupabaseData(activeCfg, {
          classes,
          activities,
          teachers: users.filter(u => u.role === 'guru' || u.role === 'guru_agama'),
          students,
          attendanceRecords,
          permits,
          notifications,
        });

        if (seedRes.success) {
          setSyncStatus({
            isSyncing: false,
            message: 'Tersambung ke Supabase & Data Awal Berhasil Diunggah!',
            isError: false,
          });
          setTimeout(() => setSyncStatus(prev => ({ ...prev, message: null })), 4000);
        } else {
          setSyncStatus({
            isSyncing: false,
            message: seedRes.message,
            isError: true,
          });
        }
      } else {
        if (result.config) setSchoolConfig({ ...result.config, useSupabaseLive: true });
        if (result.classes) setClasses(result.classes);
        if (result.activities) setActivities(result.activities);
        if (result.teachers && result.teachers.length > 0) {
          setUsers(prev => {
            const nonTeacherUsers = prev.filter(u => u.role !== 'guru' && u.role !== 'guru_agama');
            return [...nonTeacherUsers, ...result.teachers!];
          });
        }
        if (result.students) setStudents(result.students);
        if (result.attendanceRecords) setAttendanceRecords(result.attendanceRecords);
        if (result.permits) setPermits(result.permits);
        if (result.notifications) setNotifications(result.notifications);

        setSyncStatus({
          isSyncing: false,
          message: 'Data Berhasil Disinkronkan Otomatis dari Supabase Cloud Database!',
          isError: false,
        });
        setTimeout(() => setSyncStatus(prev => ({ ...prev, message: null })), 4000);
      }
    } else {
      setSyncStatus({
        isSyncing: false,
        message: result.message,
        isError: true,
      });
    }
  };

  // Seed current local state to Supabase Cloud
  const handleSeedToSupabase = async () => {
    setSyncStatus({ isSyncing: true, message: 'Mengunggah & menyinkronkan seluruh data ke Supabase...', isError: false });
    const seedRes = await seedSupabaseData(schoolConfig, {
      classes,
      activities,
      students,
      attendanceRecords,
      permits,
      notifications,
    });

    setSyncStatus({
      isSyncing: false,
      message: seedRes.message,
      isError: !seedRes.success,
    });
  };

  // Auto-fetch immediately when application opens / mounts
  useEffect(() => {
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    const url = schoolConfig.supabaseUrl || metaEnv.VITE_SUPABASE_URL || PERMANENT_SUPABASE_URL;
    const key = schoolConfig.supabaseAnonKey || metaEnv.VITE_SUPABASE_ANON_KEY || PERMANENT_SUPABASE_ANON_KEY;

    if (url && key) {
      handleFetchFromSupabase({
        ...schoolConfig,
        supabaseUrl: url,
        supabaseAnonKey: key,
        useSupabaseLive: true,
      });
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sma_school_config', JSON.stringify(schoolConfig));
  }, [schoolConfig]);

  useEffect(() => {
    localStorage.setItem('sma_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('sma_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sma_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('sma_permits', JSON.stringify(permits));
  }, [permits]);

  useEffect(() => {
    localStorage.setItem('sma_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sma_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('sma_users', JSON.stringify(users));
  }, [users]);

  // Class Management Handlers
  const handleSaveClass = async (updatedClass: SchoolClass, oldClassName?: string) => {
    setClasses(prev => {
      const exists = prev.some(c => c.id === updatedClass.id);
      if (exists) {
        return prev.map(c => c.id === updatedClass.id ? updatedClass : c);
      } else {
        return [...prev, updatedClass];
      }
    });

    if (schoolConfig.useSupabaseLive) {
      const dbRes = await dbUpdateClasses(schoolConfig, [updatedClass]);
      if (dbRes && !dbRes.success) {
        setSyncStatus({
          isSyncing: false,
          message: `Gagal simpan kelas ke Supabase: ${dbRes.message}`,
          isError: true,
        });
      }
    }

    if (oldClassName && oldClassName !== updatedClass.name) {
      setStudents(prev =>
        prev.map(s => s.classId === updatedClass.id || s.className === oldClassName
          ? { ...s, className: updatedClass.name, classId: updatedClass.id }
          : s
        )
      );
    }

    if (updatedClass.homeroomTeacherId) {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === updatedClass.homeroomTeacherId) {
            const currentHandled = u.classHandled || [];
            if (!currentHandled.includes(updatedClass.id)) {
              return { ...u, classHandled: [...currentHandled, updatedClass.id] };
            }
          }
          return u;
        })
      );
    }
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    dbDeleteClass(schoolConfig, classId);
  };

  // Teacher Handlers (Guru Agama & Wali Kelas)
  const handleAddTeacher = (teacherData: { name: string; nip: string; role: 'guru_agama' | 'guru' }) => {
    const newTeacher: User = {
      id: `user-guru-${Date.now()}`,
      username: teacherData.nip,
      name: teacherData.name,
      role: teacherData.role,
      email: `${teacherData.nip}@sman1edukasi.sch.id`,
      phone: teacherData.nip,
    };

    setUsers(prev => [...prev, newTeacher]);
    dbAddTeacher(schoolConfig, newTeacher);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setUsers(prev => prev.filter(u => u.id !== teacherId));
    dbDeleteTeacher(schoolConfig, teacherId);
  };

  const handleUpdateTeacher = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    dbAddTeacher(schoolConfig, updatedUser);
  };

  // Handle switching user/role
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('sma_is_authenticated', 'true');
    localStorage.setItem('sma_current_user', JSON.stringify(user));
    if (user.role === 'admin') setActiveTab('dashboard');
    else if (user.role === 'guru') setActiveTab('class_attendance');
    else if (user.role === 'guru_agama') setActiveTab('religion_report');
    else if (user.role === 'orang_tua') setActiveTab('parent_child');
    else if (user.role === 'siswa') setActiveTab('student_my');
  };

  // Record Attendance from Scanner or Manual
  const handleRecordAttendance = (newRecordData: Omit<AttendanceRecord, 'id'>): boolean => {
    // Prevent double attendance for same student, date, and activityCode
    const isDuplicate = attendanceRecords.some(
      r => r.studentId === newRecordData.studentId &&
           r.date === newRecordData.date &&
           r.activityCode === newRecordData.activityCode
    );

    if (isDuplicate) {
      console.warn(`Presensi ganda dicegah untuk ${newRecordData.studentName} (${newRecordData.activityCode}) pada ${newRecordData.date}`);
      return false;
    }

    const newRecord: AttendanceRecord = {
      ...newRecordData,
      id: `att-${Date.now()}`,
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
    dbRecordAttendance(schoolConfig, newRecord);

    // Generate real-time push alert for parent
    const std = students.find(s => s.id === newRecord.studentId);
    if (std) {
      const newNotif: PushNotification = {
        id: `notif-${Date.now()}`,
        recipientRole: 'orang_tua',
        recipientId: std.parentId,
        title: `Pemberitahuan Presensi: ${newRecord.activityName}`,
        message: `Ananda ${newRecord.studentName} (${newRecord.className}) telah dicatat ${newRecord.status.toUpperCase()} pada pukul ${newRecord.time} WIB.`,
        type: newRecord.status === 'terlambat' ? 'LATE' : 'CHECK_IN',
        timestamp: `${newRecord.date} ${newRecord.time}`,
        isRead: false,
        studentName: newRecord.studentName,
      };
      setNotifications(prev => [newNotif, ...prev]);
      dbPushNotification(schoolConfig, newNotif);
    }
    return true;
  };

  // Add new student
  const handleAddStudent = (newStd: Omit<Student, 'id' | 'qrCode'>) => {
    const id = `std-${Date.now()}`;
    const qrCode = `QR-STD-${newStd.nis}`;
    const created: Student = { ...newStd, id, qrCode };
    setStudents(prev => [...prev, created]);

    setClasses(prevClasses => {
      const updated = prevClasses.map(c => {
        if (c.id === created.classId || c.name.toLowerCase().trim() === created.className.toLowerCase().trim()) {
          return { ...c, studentCount: (c.studentCount || 0) + 1 };
        }
        return c;
      });
      dbUpdateClasses(schoolConfig, updated);
      return updated;
    });

    dbAddStudent(schoolConfig, created);
  };

  // Bulk Import Students from Excel
  const handleImportStudentsBulk = (
    parsedStudents: ParsedStudentRow[],
    autoCreateClasses: boolean
  ) => {
    let newClassesAdded: SchoolClass[] = [];
    const currentClassesMap = new Map<string, SchoolClass>(classes.map(c => [c.name.toLowerCase().trim(), { ...c }]));

    const newStudentList: Student[] = [];

    parsedStudents.forEach((p, idx) => {
      const clsNameKey = p.className.toLowerCase().trim();
      let matchedClass = currentClassesMap.get(clsNameKey);

      if (!matchedClass && autoCreateClasses) {
        const newClsId = `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        let grade: 'X' | 'XI' | 'XII' = 'X';
        if (p.className.toUpperCase().startsWith('XII')) grade = 'XII';
        else if (p.className.toUpperCase().startsWith('XI')) grade = 'XI';

        let major: 'IPA' | 'IPS' | 'BAHASA' | 'UMUM' = 'IPA';
        if (p.className.toUpperCase().includes('IPS')) major = 'IPS';
        else if (p.className.toUpperCase().includes('BAHASA')) major = 'BAHASA';

        matchedClass = {
          id: newClsId,
          name: p.className,
          grade,
          major,
          homeroomTeacherId: '',
          homeroomTeacherName: 'Belum Ditentukan',
          studentCount: 1,
        };
        currentClassesMap.set(clsNameKey, matchedClass);
        newClassesAdded.push(matchedClass);
      } else if (matchedClass) {
        matchedClass.studentCount += 1;
        currentClassesMap.set(clsNameKey, matchedClass);
      }

      const stdId = `std-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
      const newStd: Student = {
        id: stdId,
        nis: p.nis,
        nisn: p.nisn,
        name: p.name,
        gender: p.gender,
        classId: matchedClass?.id || classes[0]?.id || 'cls-1',
        className: p.className,
        parentId: `user-ortu-${stdId}`,
        parentName: p.parentName || 'Orang Tua Siswa',
        parentPhone: p.parentPhone || '081200000000',
        qrCode: `QR-STD-${p.nis}`,
      };
      newStudentList.push(newStd);
    });

    if (newStudentList.length === 0) return;

    // Update state
    setStudents(prev => [...prev, ...newStudentList]);
    setClasses(Array.from(currentClassesMap.values()));
    dbUpdateClasses(schoolConfig, Array.from(currentClassesMap.values()));

    // Sync students to Supabase
    dbBatchAddStudents(schoolConfig, newStudentList);
  };

  // Bulk Import Teachers / Wali Kelas from Excel
  const handleImportTeachersBulk = (
    parsedTeachers: ParsedTeacherRow[],
    autoCreateClasses: boolean
  ) => {
    let updatedClassesMap = new Map<string, SchoolClass>(classes.map(c => [c.name.toLowerCase().trim(), { ...c }]));
    const newUsersList: User[] = [];

    parsedTeachers.forEach((t, idx) => {
      const teacherUserId = `user-guru-${Date.now()}-${idx}`;
      const clsNameKey = t.className ? t.className.toLowerCase().trim() : '';

      let handledClassIds: string[] = [];

      if (clsNameKey) {
        let matchedClass = updatedClassesMap.get(clsNameKey);
        if (!matchedClass && autoCreateClasses) {
          const newClsId = `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          let grade: 'X' | 'XI' | 'XII' = 'X';
          if (t.className.toUpperCase().startsWith('XII')) grade = 'XII';
          else if (t.className.toUpperCase().startsWith('XI')) grade = 'XI';

          let major: 'IPA' | 'IPS' | 'BAHASA' | 'UMUM' = 'IPA';
          if (t.className.toUpperCase().includes('IPS')) major = 'IPS';

          matchedClass = {
            id: newClsId,
            name: t.className,
            grade,
            major,
            homeroomTeacherId: teacherUserId,
            homeroomTeacherName: t.name,
            studentCount: 0,
          };
          updatedClassesMap.set(clsNameKey, matchedClass);
        } else if (matchedClass) {
          matchedClass.homeroomTeacherId = teacherUserId;
          matchedClass.homeroomTeacherName = t.name;
          updatedClassesMap.set(clsNameKey, matchedClass);
        }

        if (matchedClass) {
          handledClassIds.push(matchedClass.id);
        }
      }

      const newTeacherUser: User = {
        id: teacherUserId,
        username: t.username || `guru_${Date.now()}_${idx}`,
        name: t.name,
        role: 'guru',
        email: t.email || `${t.username}@sekolah.sch.id`,
        phone: t.phone || '081200000000',
        classHandled: handledClassIds,
      };

      newUsersList.push(newTeacherUser);
    });

    if (newUsersList.length === 0) return;

    setUsers(prev => [...prev, ...newUsersList]);
    setClasses(Array.from(updatedClassesMap.values()));

    dbUpdateClasses(schoolConfig, Array.from(updatedClassesMap.values()));
  };

  // Delete student
  const handleDeleteStudent = (id: string) => {
    const targetStudent = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));

    if (targetStudent) {
      setClasses(prevClasses => {
        const updated = prevClasses.map(c => {
          if (c.id === targetStudent.classId || c.name.toLowerCase().trim() === targetStudent.className.toLowerCase().trim()) {
            return { ...c, studentCount: Math.max(0, (c.studentCount || 1) - 1) };
          }
          return c;
        });
        dbUpdateClasses(schoolConfig, updated);
        return updated;
      });
    }

    dbDeleteStudent(schoolConfig, id);
  };

  // Update attendance status manually by Teacher
  const handleUpdateAttendanceStatus = (
    studentId: string,
    activityCode: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => {
    const std = students.find(s => s.id === studentId);
    const act = activities.find(a => a.code === activityCode);
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toTimeString().split(' ')[0];

    // Check if record exists for today
    const existingIndex = attendanceRecords.findIndex(
      r => r.studentId === studentId && r.date === today && r.activityCode === activityCode
    );

    if (existingIndex >= 0) {
      const updated = [...attendanceRecords];
      const updatedRecord = {
        ...updated[existingIndex],
        status: newStatus,
        notes: notes || updated[existingIndex].notes,
      };
      updated[existingIndex] = updatedRecord;
      setAttendanceRecords(updated);
      dbRecordAttendance(schoolConfig, updatedRecord);
    } else if (std && act) {
      handleRecordAttendance({
        studentId: std.id,
        studentName: std.name,
        className: std.className,
        gender: std.gender,
        date: today,
        activityId: act.id,
        activityCode: act.code,
        activityName: act.name,
        time: timeNow,
        status: newStatus,
        notes: notes || 'Entry Manual Guru',
        method: 'MANUAL_GURU',
      });
    }
  };

  // Submit permit by parent
  const handleSubmitPermit = (permit: Omit<PermitSubmission, 'id' | 'createdAt' | 'status'>) => {
    const newPermit: PermitSubmission = {
      ...permit,
      id: `prm-${Date.now()}`,
      status: 'pending',
      createdAt: `${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}`,
    };
    setPermits(prev => [newPermit, ...prev]);
    dbSubmitPermit(schoolConfig, newPermit);
  };

  // Approve or Reject permit by Teacher
  const handleApprovePermit = (permitId: string, isApproved: boolean) => {
    const prm = permits.find(p => p.id === permitId);
    if (!prm) return;

    const newStatus = isApproved ? 'approved' : 'rejected';
    setPermits(prev =>
      prev.map(p => p.id === permitId ? { ...p, status: newStatus } : p)
    );
    dbUpdatePermitStatus(schoolConfig, permitId, newStatus);

    if (isApproved) {
      // Record status as sakit/izin
      handleUpdateAttendanceStatus(prm.studentId, 'DATANG', prm.type, prm.reason);
    }
  };

  // Mark notification read
  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    dbMarkNotificationRead(schoolConfig, id);
  };

  // Simulate test push notification
  const handleSimulateTestNotif = () => {
    const sampleStd = students[0];
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'orang_tua',
      recipientId: sampleStd.parentId,
      title: 'Uji Coba Push Notifikasi Realtime',
      message: `Peringatan: Ananda ${sampleStd.name} terpantau telah tiba di sekolah pukul 06:58 WIB.`,
      type: 'CHECK_IN',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}`,
      isRead: false,
      studentName: sampleStd.name,
    };
    setNotifications(prev => [newNotif, ...prev]);
    dbPushNotification(schoolConfig, newNotif);
  };

  // Get current student object for Student/Parent role
  const linkedStudent = students.find(s => s.id === currentUser.studentId) || students[0];

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  // Render main content area based on role and activeTab
  const renderMainContent = () => {
    if (currentUser.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return (
            <AdminDashboard
              students={students}
              records={attendanceRecords}
              activities={activities}
              classes={classes}
              permits={permits}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
            />
          );
        case 'teachers':
          return (
            <TeacherManagement
              users={users}
              classes={classes}
              onAddTeacher={handleAddTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onUpdateTeacher={handleUpdateTeacher}
            />
          );
        case 'classes':
          return (
            <ClassManagement
              classes={classes}
              users={users}
              students={students}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
            />
          );
        case 'users':
          return (
            <UserManagement
              students={students}
              classes={classes}
              onAddStudent={handleAddStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          );
        case 'student_cards':
          return (
            <StudentCardPrinter
              students={students}
              classes={classes}
              schoolConfig={schoolConfig}
            />
          );
        case 'activities':
          return (
            <ActivityManagement
              activities={activities}
              onUpdateActivities={(newActs) => {
                setActivities(newActs);
                dbUpdateActivities(schoolConfig, newActs);
              }}
            />
          );
        case 'config':
          return (
            <SystemConfig
              config={schoolConfig}
              onUpdateConfig={(cfg) => {
                setSchoolConfig(cfg);
                dbUpdateSchoolConfig(cfg);
                if (cfg.useSupabaseLive) {
                  handleFetchFromSupabase(cfg);
                }
              }}
              syncStatus={syncStatus}
              onFetchFromSupabase={() => handleFetchFromSupabase()}
              onSeedToSupabase={handleSeedToSupabase}
            />
          );
        case 'reports':
          return (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <h3 className="font-bold text-lg text-slate-900">Pusat Laporan & Ekspor Absensi Bulanan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Unduh rekap data absensi presensi harian, sholat dzuhur & sholat jumat dalam format Microsoft Excel (.xlsx) atau Dokumen Resmi PDF.
              </p>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                Buka Modal Ekspor Excel / PDF
              </button>
            </div>
          );
        default:
          return (
            <AdminDashboard
              students={students}
              records={attendanceRecords}
              activities={activities}
              classes={classes}
              permits={permits}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          );
      }
    } else if (currentUser.role === 'guru') {
      return (
        <GuruDashboard
          classes={classes}
          activities={activities}
          students={students}
          records={attendanceRecords}
          permits={permits}
          teacherClassHandled={currentUser.classHandled}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          onApprovePermit={handleApprovePermit}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
      );
    } else if (currentUser.role === 'guru_agama') {
      return (
        <ReligionTeacherDashboard
          classes={classes}
          activities={activities}
          students={students}
          records={attendanceRecords}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
      );
    } else if (currentUser.role === 'orang_tua') {
      return (
        <ParentDashboard
          linkedStudent={linkedStudent}
          records={attendanceRecords}
          activities={activities}
          permits={permits}
          notifications={notifications}
          onSubmitPermit={handleSubmitPermit}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />
      );
    } else if (currentUser.role === 'siswa') {
      return (
        <StudentDashboard
          student={linkedStudent}
          records={attendanceRecords}
          activities={activities}
          schoolConfig={schoolConfig}
          onRecordAttendance={handleRecordAttendance}
        />
      );
    }
  };

  // Render Login page if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage
        schoolConfig={schoolConfig}
        users={users}
        students={students}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050a18] font-sans text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Frosted Glass Ambient Lighting Effects */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Navigation */}
      <div className="relative z-10">
        <Navbar
          currentUser={currentUser}
          schoolConfig={schoolConfig}
          unreadNotifCount={unreadNotifCount}
          onOpenRoleSelector={() => setIsRoleSelectorOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onToggleNotifDrawer={() => setIsNotifDrawerOpen(true)}
          onOpenSupabaseModal={() => {
            if (currentUser.role === 'admin') setActiveTab('config');
            else setIsRoleSelectorOpen(true);
          }}
          onLogout={handleLogout}
        />
      </div>

      {/* Auto-Sync Status Notification Banner */}
      {syncStatus.message && (
        <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-3 transition-all animate-fadeIn">
          <div className={`p-3 rounded-2xl border text-xs font-semibold shadow-xl flex items-center justify-between gap-3 ${
            syncStatus.isError
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 backdrop-blur-md'
              : syncStatus.isSyncing
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 backdrop-blur-md'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 backdrop-blur-md'
          }`}>
            <div className="flex items-center space-x-2.5">
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-sky-300 shrink-0" />
              ) : syncStatus.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{syncStatus.message}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {syncStatus.isError && (
                <button
                  onClick={() => {
                    const adminUser = users.find(u => u.role === 'admin') || currentUser;
                    setCurrentUser(adminUser);
                    setIsAuthenticated(true);
                    setActiveTab('config');
                    setSyncStatus(prev => ({ ...prev, message: null }));
                  }}
                  className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1 shrink-0"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Buka Pengaturan Supabase</span>
                </button>
              )}
              {!syncStatus.isSyncing && (
                <button
                  onClick={() => setSyncStatus(prev => ({ ...prev, message: null }))}
                  className="text-slate-400 hover:text-white text-sm px-2 font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row relative z-10">
        {/* Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Role Switcher Modal */}
      <RoleSelectorModal
        isOpen={isRoleSelectorOpen}
        onClose={() => setIsRoleSelectorOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* Attendance Scanner Modal */}
      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        activities={activities}
        records={attendanceRecords}
        onRecordAttendance={handleRecordAttendance}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        currentRole={currentUser.role}
        currentUserId={currentUser.id}
        onMarkAsRead={handleMarkNotifRead}
        onSimulateTestNotif={handleSimulateTestNotif}
      />

      {/* Report Export Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classes={classes}
        activities={activities}
        attendanceRecords={attendanceRecords}
        students={students}
        schoolConfig={schoolConfig}
        userRole={currentUser.role}
      />

      {/* Excel Import Center Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        classes={classes}
        onImportStudents={handleImportStudentsBulk}
        onImportTeachers={handleImportTeachersBulk}
      />
    </div>
  );
}
