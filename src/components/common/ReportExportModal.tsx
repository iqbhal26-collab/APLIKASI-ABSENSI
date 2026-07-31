import React, { useState, useEffect } from 'react';
import { SchoolClass, ActivityType, AttendanceRecord, Student, SchoolConfig, UserRole, User } from '../../types';
import { exportAttendanceToExcel, exportAttendanceToPDF } from '../../lib/exportUtils';
import { getTeacherClasses } from '../../lib/teacherUtils';
import { FileSpreadsheet, FileText, X, Download, Filter, Calendar, Moon, Users, UserCheck } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  activities: ActivityType[];
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  schoolConfig: SchoolConfig;
  userRole: UserRole;
  currentUser?: User;
  linkedStudent?: Student;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  activities,
  attendanceRecords,
  students,
  schoolConfig,
  userRole,
  currentUser,
  linkedStudent
}) => {
  if (!isOpen) return null;

  const isReligionTeacher = userRole === 'guru_agama';
  const isParent = userRole === 'orang_tua';
  const isStudentRole = userRole === 'siswa';
  const isHomeroomTeacher = userRole === 'guru';

  // Scope Isolation Rules:
  // 1. Parent or Student: ONLY their own child / student data
  // 2. Homeroom Teacher (Wali Kelas): ONLY their assigned class(es) & students
  let effectiveClasses = classes;
  let effectiveStudents = students;
  let effectiveRecords = attendanceRecords;

  if ((isParent || isStudentRole) && linkedStudent) {
    effectiveStudents = students.filter(s => s.id === linkedStudent.id);
    const parentClass = classes.filter(
      c => c.id === linkedStudent.classId || c.name === linkedStudent.className
    );
    effectiveClasses = parentClass.length > 0 ? parentClass : [{
      id: linkedStudent.classId || 'cls-linked',
      name: linkedStudent.className || 'Kelas',
      grade: 'X',
      major: 'IPA',
      homeroomTeacherId: '',
      homeroomTeacherName: '',
      studentCount: 1
    }];
    effectiveRecords = attendanceRecords.filter(
      r => r.studentId === linkedStudent.id || r.studentName === linkedStudent.name
    );
  } else if (isHomeroomTeacher && currentUser) {
    const activeTeacherClasses = getTeacherClasses(currentUser, classes, students);

    effectiveClasses = activeTeacherClasses;
    const classIds = new Set(activeTeacherClasses.map(c => c.id));
    const classNamesNorm = new Set(activeTeacherClasses.map(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

    effectiveStudents = students.filter(
      s => classIds.has(s.classId) || (s.className && classNamesNorm.has(s.className.toLowerCase().replace(/[^a-z0-9]/g, '')))
    );
    const studentIds = new Set(effectiveStudents.map(s => s.id));

    effectiveRecords = attendanceRecords.filter(
      r => studentIds.has(r.studentId) || (r.className && classNamesNorm.has(r.className.toLowerCase().replace(/[^a-z0-9]/g, '')))
    );
  }

  // Filter activities for religion teacher: only Dzuhur and Jumat
  const filteredActivities = isReligionTeacher
    ? activities.filter(a => a.code === 'DZUHUR' || a.code === 'JUMAT')
    : activities;

  const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
  const todayStr = new Date().toISOString().substring(0, 10); // e.g. "2026-07-30"
  const [exportType, setExportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if ((isParent || isStudentRole) && linkedStudent) {
      return linkedStudent.className;
    }
    if (isHomeroomTeacher && effectiveClasses.length > 0) {
      return effectiveClasses[0].name;
    }
    return 'ALL';
  });
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');

  useEffect(() => {
    if (isHomeroomTeacher && effectiveClasses.length > 0) {
      if (selectedClass === 'ALL' || !effectiveClasses.some(c => c.name === selectedClass)) {
        setSelectedClass(effectiveClasses[0].name);
      }
    }
  }, [isHomeroomTeacher, effectiveClasses, selectedClass]);

  const getRecordsToExport = () => {
    let recs = effectiveRecords;
    if (isReligionTeacher) {
      recs = recs.filter(r => r.activityCode === 'DZUHUR' || r.activityCode === 'JUMAT');
    }
    return recs;
  };

  const handleExportExcel = () => {
    const targetClassName = (isParent || isStudentRole) ? (linkedStudent?.className || selectedClass) : selectedClass;
    exportAttendanceToExcel(
      getRecordsToExport(),
      effectiveStudents,
      filteredActivities,
      schoolConfig,
      {
        reportType: exportType,
        date: exportType === 'daily' ? selectedDate : undefined,
        month: exportType === 'monthly' ? selectedMonth : undefined,
        className: targetClassName,
        activityCode: selectedActivity
      }
    );
  };

  const handleExportPDF = () => {
    const targetClassName = (isParent || isStudentRole) ? (linkedStudent?.className || selectedClass) : selectedClass;
    exportAttendanceToPDF(
      getRecordsToExport(),
      effectiveStudents,
      filteredActivities,
      schoolConfig,
      {
        reportType: exportType,
        date: exportType === 'daily' ? selectedDate : undefined,
        month: exportType === 'monthly' ? selectedMonth : undefined,
        className: targetClassName,
        activityCode: selectedActivity
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cetak & Ekspor Laporan Absensi</h3>
              <p className="text-xs text-slate-300">
                Pilih format dokumen PDF atau Excel untuk laporan bulanan/harian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Role Scope Notice */}
          {(isParent || isStudentRole) && linkedStudent && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                <Users className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Akses Laporan Orang Tua / Siswa</div>
                <div className="text-[11px] text-emerald-300 mt-0.5">
                  Laporan rekap khusus untuk Ananda <strong>{linkedStudent.name}</strong> (Kelas {linkedStudent.className} | NISN: {linkedStudent.nisn}).
                </div>
              </div>
            </div>
          )}

          {isHomeroomTeacher && (
            <div className="p-3.5 bg-blue-500/15 border border-blue-500/30 rounded-2xl text-blue-200 text-xs flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-xl shrink-0">
                <UserCheck className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">Akses Laporan Wali Kelas</div>
                <div className="text-[11px] text-blue-300 mt-0.5">
                  Menampilkan khusus data siswa kelas binaan: <strong>{effectiveClasses.map(c => 'Kelas ' + c.name).join(', ')}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter Periode & Kriteria</span>
            </div>

            {/* Export Mode Selector: Daily vs Monthly */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jenis / Mode Rekapan:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setExportType('daily')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    exportType === 'daily'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Rekapan Harian</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportType('monthly')}
                  className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    exportType === 'monthly'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Rekap Bulanan</span>
                </button>
              </div>
            </div>

            {/* Date or Month Picker based on exportType */}
            {exportType === 'daily' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Tanggal Presensi Harian:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Bulan & Tahun Absensi:
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            )}

            {/* Class filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filter Kelas:
              </label>
              {(isParent || isStudentRole) && linkedStudent ? (
                <input
                  type="text"
                  disabled
                  value={`Kelas ${linkedStudent.className} (Khusus Ananda: ${linkedStudent.name})`}
                  className="w-full bg-slate-950/80 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl px-3 py-2 text-xs cursor-not-allowed"
                />
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {(!isHomeroomTeacher || effectiveClasses.length > 1) && (
                    <option value="ALL">
                      {isHomeroomTeacher ? 'Semua Kelas Binaan Wali Kelas' : 'Semua Kelas'}
                    </option>
                  )}
                  {effectiveClasses.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      Kelas {cls.name} {cls.homeroomTeacherName ? `(Wali Kelas: ${cls.homeroomTeacherName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Activity filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filter Sesi / Jenis Kegiatan:
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">
                  {isReligionTeacher
                    ? 'Semua Sesi Sholat (Dzuhur & Jumat)'
                    : 'Semua Sesi Kegiatan (Datang, Dzuhur, Jumat, Pulang)'}
                </option>
                {filteredActivities.map((act) => (
                  <option key={act.id} value={act.code}>
                    {act.name} ({act.code})
                  </option>
                ))}
              </select>
            </div>

            {isReligionTeacher && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <Moon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hak Akses Guru Agama: Pencetakan terkhusus untuk Laporan Sholat Dzuhur & Sholat Jumat.</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-rose-400" />
              <span>Cetak PDF (.pdf)</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 text-center text-xs text-slate-400">
          Format Laporan PDF dilengkapi KOP Surat Resmi SMA & Kolom Tanda Tangan Kepala Sekolah.
        </div>
      </div>
    </div>
  );
};

