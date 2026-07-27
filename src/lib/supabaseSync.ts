import { getSupabaseClient } from './supabase';
import {
  SchoolConfig,
  ActivityType,
  SchoolClass,
  Student,
  AttendanceRecord,
  PermitSubmission,
  PushNotification
} from '../types';

export interface SupabaseFetchResult {
  success: boolean;
  message: string;
  config?: SchoolConfig;
  activities?: ActivityType[];
  classes?: SchoolClass[];
  students?: Student[];
  attendanceRecords?: AttendanceRecord[];
  permits?: PermitSubmission[];
  notifications?: PushNotification[];
  isEmpty?: boolean;
}

/**
 * Loads all data from Supabase Cloud Database.
 */
export async function fetchAllFromSupabase(config: SchoolConfig): Promise<SupabaseFetchResult> {
  const supabase = getSupabaseClient(config);
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client belum diinisialisasi. Periksa URL dan Anon Key.'
    };
  }

  try {
    // 1. Fetch Config
    const { data: configData, error: configError } = await supabase
      .from('school_config')
      .select('*')
      .limit(1);

    if (configError) throw configError;

    // 2. Fetch Classes
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*');
    if (classesError) throw classesError;

    // 3. Fetch Activities
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*');
    if (activitiesError) throw activitiesError;

    // 4. Fetch Students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*');
    if (studentsError) throw studentsError;

    // 5. Fetch Attendance Records
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });
    if (attendanceError) throw attendanceError;

    // 6. Fetch Permits
    const { data: permitsData, error: permitsError } = await supabase
      .from('permit_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (permitsError) throw permitsError;

    // 7. Fetch Notifications
    const { data: notifsData, error: notifsError } = await supabase
      .from('push_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (notifsError) throw notifsError;

    const isEmpty =
      (!studentsData || studentsData.length === 0) &&
      (!attendanceData || attendanceData.length === 0);

    // Map fetched DB rows to application types
    let fetchedConfig: SchoolConfig | undefined = undefined;
    if (configData && configData.length > 0) {
      const row = configData[0];
      fetchedConfig = {
        ...config,
        schoolName: row.school_name || config.schoolName,
        npsn: row.npsn || config.npsn,
        address: row.address || config.address,
        academicYear: row.academic_year || config.academicYear,
        semester: (row.semester as 'Ganjil' | 'Genap') || config.semester,
        principalName: row.principal_name || config.principalName,
        principalNip: row.principal_nip || config.principalNip,
        toleranceMinutes: row.tolerance_minutes ?? config.toleranceMinutes,
      };
    }

    const fetchedClasses: SchoolClass[] = (classesData || []).map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      major: c.major,
      homeroomTeacherId: c.homeroom_teacher_id || '',
      homeroomTeacherName: c.homeroom_teacher_name || '',
      studentCount: c.student_count || 0
    }));

    const fetchedActivities: ActivityType[] = (activitiesData || []).map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      startTime: a.start_time,
      endTime: a.end_time,
      genderConstraint: a.gender_constraint || 'ALL',
      dayConstraint: a.day_constraint || [1, 2, 3, 4, 5],
      isActive: a.is_active ?? true,
      isRequired: a.is_required ?? true,
    }));

    const fetchedStudents: Student[] = (studentsData || []).map(s => ({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      classId: s.class_id,
      className: s.class_name,
      parentId: s.parent_id,
      parentName: s.parent_name,
      parentPhone: s.parent_phone,
      qrCode: s.qr_code,
    }));

    const fetchedAttendance: AttendanceRecord[] = (attendanceData || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      className: r.class_name,
      gender: r.gender,
      date: r.date,
      activityId: r.activity_id,
      activityCode: r.activity_code,
      activityName: r.activity_name,
      time: r.time,
      status: r.status,
      notes: r.notes || undefined,
      method: r.method || 'QR_SCAN',
    }));

    const fetchedPermits: PermitSubmission[] = (permitsData || []).map(p => ({
      id: p.id,
      studentId: p.student_id,
      studentName: p.student_name,
      className: p.class_name,
      parentId: p.parent_id,
      parentName: p.parent_name,
      type: p.type,
      startDate: p.start_date,
      endDate: p.end_date,
      reason: p.reason,
      status: p.status,
      createdAt: p.created_at,
    }));

    const fetchedNotifs: PushNotification[] = (notifsData || []).map(n => ({
      id: n.id,
      recipientRole: n.recipient_role,
      recipientId: n.recipient_id,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.created_at || new Date().toISOString(),
      isRead: n.is_read ?? false,
      studentName: n.student_name,
    }));

    return {
      success: true,
      message: 'Berhasil menyinkronkan data dari Supabase Database.',
      config: fetchedConfig,
      classes: fetchedClasses,
      activities: fetchedActivities,
      students: fetchedStudents,
      attendanceRecords: fetchedAttendance,
      permits: fetchedPermits,
      notifications: fetchedNotifs,
      isEmpty,
    };
  } catch (error: any) {
    console.error('Error fetching Supabase data:', error);
    const rawMsg = String(error?.message || error || '');
    let userMsg = `Gagal membaca Supabase: ${rawMsg}.`;

    if (rawMsg.includes('Invalid path') || rawMsg.includes('URL') || rawMsg.includes('Failed to parse URL')) {
      userMsg = `URL Supabase tidak valid (${config.supabaseUrl || 'Kosong'}). Pastikan URL berformat 'https://xyz.supabase.co' tanpa '/rest/v1' di belakangnya.`;
    } else if (rawMsg.includes('relation') || rawMsg.includes('does not exist') || error?.code === '42P01') {
      userMsg = `Tabel belum dibuat di database Supabase Anda. Buka menu 'Integrasi Supabase' di Pengaturan, salin DDL Script, dan jalankan di SQL Editor Dashboard Supabase Anda.`;
    }

    return {
      success: false,
      message: userMsg
    };
  }
}

/**
 * Seed initial state or current data into Supabase Cloud Database.
 */
export async function seedSupabaseData(
  config: SchoolConfig,
  data: {
    classes: SchoolClass[];
    activities: ActivityType[];
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    permits: PermitSubmission[];
    notifications: PushNotification[];
  }
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient(config);
  if (!supabase) {
    return { success: false, message: 'Supabase client tidak tersedia.' };
  }

  try {
    // Upsert Config
    await supabase.from('school_config').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      school_name: config.schoolName,
      npsn: config.npsn,
      address: config.address,
      academic_year: config.academicYear,
      semester: config.semester,
      principal_name: config.principalName,
      principal_nip: config.principalNip,
      tolerance_minutes: config.toleranceMinutes,
    });

    // Upsert Classes
    if (data.classes.length > 0) {
      const fullClassPayload = data.classes.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        major: c.major,
        homeroom_teacher_id: c.homeroomTeacherId || null,
        homeroom_teacher_name: c.homeroomTeacherName || null,
        student_count: c.studentCount,
      }));
      const { error: seedClsErr } = await supabase.from('classes').upsert(fullClassPayload);
      if (seedClsErr) {
        console.warn('Seed classes full payload failed, trying fallback payload...', seedClsErr);
        await supabase.from('classes').upsert(
          data.classes.map(c => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
            major: c.major,
            student_count: c.studentCount,
          }))
        );
      }
    }

    // Upsert Activities
    if (data.activities.length > 0) {
      await supabase.from('activities').upsert(
        data.activities.map(a => ({
          id: a.id,
          code: a.code,
          name: a.name,
          start_time: a.startTime,
          end_time: a.endTime,
          gender_constraint: a.genderConstraint || 'ALL',
          day_constraint: a.dayConstraint || [1, 2, 3, 4, 5],
          is_active: a.isActive,
          is_required: a.isRequired,
        }))
      );
    }

    // Upsert Students
    if (data.students.length > 0) {
      await supabase.from('students').upsert(
        data.students.map(s => ({
          id: s.id,
          nis: s.nis,
          nisn: s.nisn,
          name: s.name,
          gender: s.gender,
          class_id: s.classId,
          class_name: s.className,
          parent_id: s.parentId,
          parent_name: s.parentName,
          parent_phone: s.parentPhone,
          qr_code: s.qrCode,
        }))
      );
    }

    // Upsert Attendance Records
    if (data.attendanceRecords.length > 0) {
      await supabase.from('attendance_records').upsert(
        data.attendanceRecords.map(r => ({
          id: r.id,
          student_id: r.studentId,
          student_name: r.studentName,
          class_name: r.className,
          gender: r.gender,
          date: r.date,
          activity_id: r.activityId,
          activity_code: r.activityCode,
          activity_name: r.activityName,
          time: r.time,
          status: r.status,
          notes: r.notes || null,
          method: r.method,
        }))
      );
    }

    // Upsert Permits
    if (data.permits.length > 0) {
      await supabase.from('permit_submissions').upsert(
        data.permits.map(p => ({
          id: p.id,
          student_id: p.studentId,
          student_name: p.studentName,
          class_name: p.className,
          parent_id: p.parentId,
          parent_name: p.parentName,
          type: p.type,
          start_date: p.startDate,
          end_date: p.endDate,
          reason: p.reason,
          status: p.status,
          created_at: p.createdAt,
        }))
      );
    }

    // Upsert Notifications
    if (data.notifications.length > 0) {
      await supabase.from('push_notifications').upsert(
        data.notifications.map(n => ({
          id: n.id,
          recipient_role: n.recipientRole,
          recipient_id: n.recipientId,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.isRead,
          student_name: n.studentName,
          created_at: n.timestamp,
        }))
      );
    }

    return {
      success: true,
      message: 'Berhasil mengunggah & menyinkronkan data awal ke Supabase Database!',
    };
  } catch (error: any) {
    console.error('Error seeding Supabase:', error);
    const rawMsg = String(error?.message || error || '');
    let userMsg = `Gagal menyinkronkan data ke Supabase: ${rawMsg}.`;

    if (rawMsg.includes('Invalid path') || rawMsg.includes('URL') || rawMsg.includes('Failed to parse URL')) {
      userMsg = `URL Supabase tidak valid (${config.supabaseUrl || 'Kosong'}). Pastikan URL berformat 'https://xyz.supabase.co' tanpa '/rest/v1' di belakangnya.`;
    } else if (rawMsg.includes('relation') || rawMsg.includes('does not exist') || error?.code === '42P01') {
      userMsg = `Tabel belum dibuat di database Supabase Anda. Salin DDL Script di Pengaturan, lalu jalankan di SQL Editor Dashboard Supabase Anda.`;
    }

    return {
      success: false,
      message: userMsg,
    };
  }
}

/* ================= CRUD Helper Actions ================= */

export async function dbAddStudent(config: SchoolConfig, student: Student) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('students').insert({
      id: student.id,
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      class_id: student.classId,
      class_name: student.className,
      parent_id: student.parentId,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      qr_code: student.qrCode,
    });
  } catch (err) {
    console.warn('dbAddStudent error:', err);
  }
}

export async function dbDeleteStudent(config: SchoolConfig, studentId: string) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('students').delete().eq('id', studentId);
  } catch (err) {
    console.warn('dbDeleteStudent error:', err);
  }
}

export async function dbRecordAttendance(config: SchoolConfig, record: AttendanceRecord) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('attendance_records').upsert({
      id: record.id,
      student_id: record.studentId,
      student_name: record.studentName,
      class_name: record.className,
      gender: record.gender,
      date: record.date,
      activity_id: record.activityId,
      activity_code: record.activityCode,
      activity_name: record.activityName,
      time: record.time,
      status: record.status,
      notes: record.notes || null,
      method: record.method,
    });
  } catch (err) {
    console.warn('dbRecordAttendance error:', err);
  }
}

export async function dbSubmitPermit(config: SchoolConfig, permit: PermitSubmission) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('permit_submissions').insert({
      id: permit.id,
      student_id: permit.studentId,
      student_name: permit.studentName,
      class_name: permit.className,
      parent_id: permit.parentId,
      parent_name: permit.parentName,
      type: permit.type,
      start_date: permit.startDate,
      end_date: permit.endDate,
      reason: permit.reason,
      status: permit.status,
      created_at: permit.createdAt,
    });
  } catch (err) {
    console.warn('dbSubmitPermit error:', err);
  }
}

export async function dbUpdatePermitStatus(config: SchoolConfig, permitId: string, status: 'approved' | 'rejected') {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('permit_submissions').update({ status }).eq('id', permitId);
  } catch (err) {
    console.warn('dbUpdatePermitStatus error:', err);
  }
}

export async function dbUpdateActivities(config: SchoolConfig, activities: ActivityType[]) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('activities').upsert(
      activities.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        start_time: a.startTime,
        end_time: a.endTime,
        gender_constraint: a.genderConstraint || 'ALL',
        day_constraint: a.dayConstraint || [1, 2, 3, 4, 5],
        is_active: a.isActive,
        is_required: a.isRequired,
      }))
    );
  } catch (err) {
    console.warn('dbUpdateActivities error:', err);
  }
}

export async function dbUpdateClasses(config: SchoolConfig, classes: SchoolClass[]) {
  if (!config.useSupabaseLive) return { success: false, message: 'Supabase Live Connection nonaktif.' };
  const supabase = getSupabaseClient(config);
  if (!supabase) return { success: false, message: 'Supabase client tidak tersedia.' };

  try {
    // Primary attempt: try with all fields
    const fullPayload = classes.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      major: c.major,
      homeroom_teacher_id: c.homeroomTeacherId ? c.homeroomTeacherId : null,
      homeroom_teacher_name: c.homeroomTeacherName ? c.homeroomTeacherName : null,
      student_count: c.studentCount || 0,
    }));

    const { error: fullError } = await supabase.from('classes').upsert(fullPayload);
    if (!fullError) {
      return { success: true };
    }

    console.warn('dbUpdateClasses full payload failed:', fullError);

    // Fallback 1: Try without homeroom_teacher_id if homeroom_teacher_id has UUID/FK constraint mismatch
    const payloadNoTeacherId = classes.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      major: c.major,
      homeroom_teacher_name: c.homeroomTeacherName ? c.homeroomTeacherName : null,
      student_count: c.studentCount || 0,
    }));

    const { error: err1 } = await supabase.from('classes').upsert(payloadNoTeacherId);
    if (!err1) {
      return { success: true, message: 'Data kelas & nama wali kelas tersimpan di Supabase.' };
    }

    // Fallback 2: Try basic payload if homeroom_teacher_name column is missing in Supabase schema
    const basicPayload = classes.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      major: c.major,
      student_count: c.studentCount || 0,
    }));

    const { error: err2 } = await supabase.from('classes').upsert(basicPayload);
    if (!err2) {
      return {
        success: true,
        message: 'Data kelas tersimpan, tetapi kolom homeroom_teacher_name belum ada di Supabase. Silakan tambahkan kolom homeroom_teacher_name TEXT di tabel classes Supabase.'
      };
    }

    return { success: false, message: fullError.message || err1.message || err2.message };
  } catch (err: any) {
    console.warn('dbUpdateClasses exception:', err);
    return { success: false, message: err?.message || 'Gagal menyimpan kelas ke Supabase' };
  }
}

export async function dbDeleteClass(config: SchoolConfig, classId: string) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('classes').delete().eq('id', classId);
  } catch (err) {
    console.warn('dbDeleteClass error:', err);
  }
}

export async function dbUpdateSchoolConfig(config: SchoolConfig) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('school_config').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      school_name: config.schoolName,
      npsn: config.npsn,
      address: config.address,
      academic_year: config.academicYear,
      semester: config.semester,
      principal_name: config.principalName,
      principal_nip: config.principalNip,
      tolerance_minutes: config.toleranceMinutes,
    });
  } catch (err) {
    console.warn('dbUpdateSchoolConfig error:', err);
  }
}

export async function dbPushNotification(config: SchoolConfig, notif: PushNotification) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('push_notifications').insert({
      id: notif.id,
      recipient_role: notif.recipientRole,
      recipient_id: notif.recipientId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.isRead,
      student_name: notif.studentName,
      created_at: notif.timestamp,
    });
  } catch (err) {
    console.warn('dbPushNotification error:', err);
  }
}

export async function dbMarkNotificationRead(config: SchoolConfig, notifId: string) {
  if (!config.useSupabaseLive) return;
  const supabase = getSupabaseClient(config);
  if (!supabase) return;

  try {
    await supabase.from('push_notifications').update({ is_read: true }).eq('id', notifId);
  } catch (err) {
    console.warn('dbMarkNotificationRead error:', err);
  }
}
