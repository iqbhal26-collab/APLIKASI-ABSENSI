import React, { useState, useEffect } from 'react';
import { SchoolClass, ActivityType, Student, AttendanceRecord, PermitSubmission, AttendanceStatus, User } from '../../types';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Paperclip,
  Filter,
  Search,
  HeartHandshake,
  User as UserIcon,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface GuruDashboardProps {
  classes: SchoolClass[];
  activities: ActivityType[];
  students: Student[];
  records: AttendanceRecord[];
  permits: PermitSubmission[];
  teacherClassHandled?: string[];
  currentUser?: User;
  activeTab?: string;
  onUpdateAttendanceStatus: (studentId: string, activityCode: string, newStatus: AttendanceStatus, notes?: string) => void;
  onApprovePermit: (permitId: string, isApproved: boolean) => void;
  onOpenExportModal: () => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  classes,
  activities,
  students,
  records,
  permits,
  teacherClassHandled,
  currentUser,
  activeTab = 'class_attendance',
  onUpdateAttendanceStatus,
  onApprovePermit,
  onOpenExportModal
}) => {
  const activeClasses = classes;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    activeClasses[0]?.id || ''
  );
  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('DATANG');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  // Permit Filter State
  const [permitStatusFilter, setPermitStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [permitSearchQuery, setPermitSearchQuery] = useState<string>('');

  useEffect(() => {
    if (activeClasses.length > 0 && (!selectedClassId || !activeClasses.some(c => c.id === selectedClassId))) {
      setSelectedClassId(activeClasses[0].id);
    }
  }, [activeClasses, selectedClassId]);

  const currentClass = activeClasses.find(c => c.id === selectedClassId) || activeClasses[0];

  // Filter students belonging strictly to the teacher's binaan class
  const classStudents = students.filter(s => {
    if (!currentClass) return false;
    if (s.classId === currentClass.id) return true;
    if (s.className && currentClass.name) {
      const cNorm = currentClass.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sNorm = s.className.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cNorm && sNorm && cNorm === sNorm) return true;
    }
    return false;
  });

  const selectedActivity = activities.find(a => a.code === selectedActivityCode) || activities[0];

  // Filter permits belonging strictly to the teacher's binaan class students
  const classPermits = permits.filter(p => {
    if (!currentClass) return false;

    const cNameNorm = currentClass.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const pNameNorm = (p.className || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchesClassName = pNameNorm === cNameNorm;
    const matchesStudent = classStudents.some(s =>
      s.id === p.studentId || (p.studentName && s.name && s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === p.studentName.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    return matchesClassName || matchesStudent;
  });

  const pendingPermits = classPermits.filter(p => p.status === 'pending');
  const approvedPermits = classPermits.filter(p => p.status === 'approved');
  const rejectedPermits = classPermits.filter(p => p.status === 'rejected');

  // Filtered permits for dedicated view
  const filteredClassPermits = classPermits.filter(p => {
    const matchesStatus =
      permitStatusFilter === 'all'
        ? true
        : p.status === permitStatusFilter;

    const q = permitSearchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      p.studentName.toLowerCase().includes(q) ||
      (p.parentName && p.parentName.toLowerCase().includes(q)) ||
      p.reason.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  // Calculate statistics for today
  const todayRecords = records.filter(
    r => r.date === selectedDate && r.activityCode === selectedActivityCode && classStudents.some(s => s.id === r.studentId)
  );
  const hadirCount = todayRecords.filter(r => r.status === 'hadir').length;
  const sakitIzinCount = todayRecords.filter(r => r.status === 'sakit' || r.status === 'izin').length;
  const alpaCount = todayRecords.filter(r => r.status === 'alpa').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-2xl text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>DASBOR GURU / WALI KELAS</span>
          </div>
          <h2 className="text-xl font-bold">
            Presensi & Izin Siswa Kelas {currentClass?.name || 'Binaan'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Wali Kelas: <strong>{currentUser?.name || currentClass?.homeroomTeacherName || 'Wali Kelas'}</strong> | Total: {classStudents.length} Siswa Binaan
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenExportModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-950" />
            <span>Cetak Laporan Rekap Kelas</span>
          </button>
        </div>
      </div>

      {/* RENDER BASED ON ACTIVE TAB */}

      {/* 1. VIEW PERMITS ONLY (Persetujuan Izin / Sakit) */}
      {activeTab === 'permits' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                  <HeartHandshake className="w-5 h-5 text-sky-400" />
                  <span>Laporan Pemberitahuan Izin & Sakit dari Orang Tua</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Menampilkan laporan surat izin/sakit resmi dari orang tua khusus untuk siswa <strong>Kelas {currentClass?.name}</strong> ({classStudents.length} siswa).
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center space-x-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start md:self-auto overflow-x-auto">
                <button
                  onClick={() => setPermitStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    permitStatusFilter === 'all'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({classPermits.length})
                </button>
                <button
                  onClick={() => setPermitStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    permitStatusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  Pending ({pendingPermits.length})
                </button>
                <button
                  onClick={() => setPermitStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    permitStatusFilter === 'approved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  Disetujui ({approvedPermits.length})
                </button>
                <button
                  onClick={() => setPermitStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    permitStatusFilter === 'rejected'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Ditolak ({rejectedPermits.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama siswa, orang tua, atau alasan..."
                value={permitSearchQuery}
                onChange={(e) => setPermitSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            {/* Permit Cards List */}
            {filteredClassPermits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3 bg-black/20 rounded-2xl border border-white/5">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs font-medium">
                  {permitSearchQuery
                    ? 'Tidak ditemukan laporan izin yang sesuai kata kunci pencarian.'
                    : 'Belum ada laporan pemberitahuan izin dari orang tua untuk kelas binaan ini.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClassPermits.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                            <span>{p.studentName}</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] rounded-md font-mono">
                              {p.className || currentClass?.name}
                            </span>
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                            <UserIcon className="w-3 h-3 text-slate-500" />
                            <span>Orang Tua: <strong>{p.parentName || 'Orang Tua / Wali'}</strong></span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border shrink-0 ${
                          p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : p.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {p.status === 'pending' ? 'Menunggu Wali Kelas' : p.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            p.type === 'sakit' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            Pemberitahuan {p.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Diajukan: {p.createdAt}
                          </span>
                        </div>
                        <div className="text-slate-200">
                          <strong>Alasan:</strong> "{p.reason}"
                        </div>
                        <div className="text-[11px] text-sky-300 font-mono flex items-center space-x-1 pt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Periode Izin: {p.startDate} s/d {p.endDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      {p.attachmentUrl ? (
                        <button
                          onClick={() => setPreviewAttachmentUrl(p.attachmentUrl || null)}
                          className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Lihat Berkas Dokumen</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Tanpa Berkas Lampiran</span>
                      )}

                      {p.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onApprovePermit(p.id, false)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                          <button
                            onClick={() => onApprovePermit(p.id, true)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. RECAP / REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Laporan & Rekap Absensi Bulanan Kelas {currentClass?.name}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Rekap absensi siswa kelas binaan <strong>Kelas {currentClass?.name}</strong>. Anda dapat mengunduh format Excel (.xlsx) atau Dokumen PDF.
              </p>
            </div>

            <button
              onClick={onOpenExportModal}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Buka Modal Ekspor Excel / PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-xs text-slate-400">Total Siswa Binaan</div>
              <div className="text-2xl font-bold text-white mt-1">{classStudents.length} Siswa</div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <div className="text-xs text-emerald-300">Total Laporan Izin Orang Tua</div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">{classPermits.length} Pengajuan</div>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <div className="text-xs text-amber-300">Izin Menunggu Persetujuan</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{pendingPermits.length} Surat</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DEFAULT / CLASS ATTENDANCE VIEW */}
      {(activeTab === 'class_attendance' || activeTab === 'dashboard' || (!['permits', 'reports'].includes(activeTab))) && (
        <>
          {/* Control Selector Bar */}
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Class selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Kelas Binaan Wali Kelas:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white bg-slate-900 cursor-pointer"
              >
                {activeClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c.studentCount} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Activity selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Sesi / Jenis Kegiatan:
              </label>
              <select
                value={selectedActivityCode}
                onChange={(e) => setSelectedActivityCode(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white bg-slate-900 cursor-pointer"
              >
                {activities.map((a) => (
                  <option key={a.id} value={a.code}>
                    {a.name} ({a.startTime} - {a.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tanggal Presensi:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white bg-black/40 cursor-pointer"
              />
            </div>
          </div>

          {/* Pending Permits Alert Box */}
          {pendingPermits.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-white space-y-3 backdrop-blur-md">
              <div className="flex items-center space-x-2 font-bold text-sm text-amber-300">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Ada {pendingPermits.length} Pengajuan Surat Izin / Sakit dari Orang Tua Kelas {currentClass?.name} Perlu Persetujuan:</span>
              </div>

              <div className="space-y-2">
                {pendingPermits.map((p) => (
                  <div key={p.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-white">{p.studentName}</strong>
                        <span className="text-emerald-400 font-mono">({p.className || currentClass?.name})</span>
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 font-bold rounded-md uppercase text-[10px]">
                          {p.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-0.5">Orang Tua: {p.parentName || 'Orang Tua / Wali'} | Alasan: "{p.reason}"</div>
                      <div className="text-[10px] text-slate-400 font-mono">Periode: {p.startDate} s/d {p.endDate} • Diajukan: {p.createdAt}</div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                      {p.attachmentUrl && (
                        <button
                          onClick={() => setPreviewAttachmentUrl(p.attachmentUrl || null)}
                          className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Berkas</span>
                        </button>
                      )}
                      <button
                        onClick={() => onApprovePermit(p.id, false)}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                      <button
                        onClick={() => onApprovePermit(p.id, true)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-md transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa Binaan</div>
              <div className="text-xl font-bold text-white mt-1">{classStudents.length} Siswa</div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <div className="text-[11px] font-bold text-emerald-300 uppercase">Hadir ({selectedActivity?.code})</div>
              <div className="text-xl font-bold text-emerald-300 mt-1">{hadirCount} Siswa</div>
            </div>
            <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20">
              <div className="text-[11px] font-bold text-sky-300 uppercase">Sakit / Izin</div>
              <div className="text-xl font-bold text-sky-300 mt-1">{sakitIzinCount} Siswa</div>
            </div>
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              <div className="text-[11px] font-bold text-rose-300 uppercase">Alpa / Belum</div>
              <div className="text-xl font-bold text-rose-300 mt-1">{classStudents.length - (hadirCount + sakitIzinCount)} Siswa</div>
            </div>
          </div>

          {/* Class Attendance Matrix */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  Daftar Kehadiran Siswa Kelas Binaan: {currentClass?.name} ({selectedActivity?.name})
                </h3>
                <p className="text-xs text-slate-400">
                  Menampilkan {classStudents.length} siswa kelas binaan {currentClass?.name}. Klik tombol status untuk override status presensi manual.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {classStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada data siswa untuk kelas binaan {currentClass?.name}.
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-white/10 text-slate-200 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">NISN / NIS</th>
                      <th className="px-4 py-3.5">Nama Siswa</th>
                      <th className="px-4 py-3.5">Gender</th>
                      <th className="px-4 py-3.5">Jam Absen</th>
                      <th className="px-4 py-3.5">Status Kehadiran</th>
                      <th className="px-4 py-3.5 text-right">Ubah Status Manual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {classStudents.map((std) => {
                      const rec = records.find(
                        r => r.studentId === std.id && r.date === selectedDate && r.activityCode === selectedActivityCode
                      );

                      const currentStatus: AttendanceStatus = rec ? rec.status : 'belum_absen';
                      const isMaleSpecialNotReq = selectedActivityCode === 'JUMAT' && std.gender !== 'L';

                      return (
                        <tr key={std.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                            <div>{std.nisn}</div>
                            <div className="text-[10px] text-slate-400">{std.nis}</div>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-white">
                            {std.name}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              std.gender === 'L' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            }`}>
                              {std.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs text-slate-200">
                            {rec ? rec.time : '-'}
                          </td>

                          <td className="px-4 py-3.5">
                            {isMaleSpecialNotReq ? (
                              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-white/5 text-slate-400 border border-white/10">
                                N/A (Bukan Laki-Laki)
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                currentStatus === 'hadir'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : currentStatus === 'terlambat'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : currentStatus === 'sakit' || currentStatus === 'izin'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                  : currentStatus === 'alpa'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-white/10 text-slate-300 border-white/10'
                              }`}>
                                {currentStatus.toUpperCase().replace('_', ' ')}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex rounded-xl shadow-sm border border-white/10 overflow-hidden text-xs bg-white/5">
                              <button
                                onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'hadir', 'Verifikasi Wali Kelas')}
                                className="px-2.5 py-1 hover:bg-emerald-500/20 text-emerald-300 font-bold border-r border-white/10 transition-colors cursor-pointer"
                                title="Hadir"
                              >
                                Hadir
                              </button>
                              <button
                                onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'sakit', 'Surat Sakit')}
                                className="px-2.5 py-1 hover:bg-sky-500/20 text-sky-300 font-bold border-r border-white/10 transition-colors cursor-pointer"
                                title="Sakit"
                              >
                                Sakit
                              </button>
                              <button
                                onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'izin', 'Izin Resmi')}
                                className="px-2.5 py-1 hover:bg-amber-500/20 text-amber-300 font-bold border-r border-white/10 transition-colors cursor-pointer"
                                title="Izin"
                              >
                                Izin
                              </button>
                              <button
                                onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'alpa', 'Tanpa Keterangan')}
                                className="px-2.5 py-1 hover:bg-rose-500/20 text-rose-300 font-bold transition-colors cursor-pointer"
                                title="Alpa"
                              >
                                Alpa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Laporan Pemberitahuan Izin dari Orang Tua (Kelas Binaan) Section */}
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-white">
                <HeartHandshake className="w-5 h-5 text-sky-400" />
                <span>Laporan Pemberitahuan Izin / Sakit dari Orang Tua (Kelas {currentClass?.name})</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: {classPermits.length} Laporan
              </span>
            </div>

            {classPermits.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada laporan pemberitahuan izin dari orang tua untuk siswa kelas binaan ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classPermits.slice(0, 6).map((p) => (
                  <div key={p.id} className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{p.studentName}</strong>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        p.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : p.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {p.status === 'pending' ? 'Pending' : p.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      Orang Tua: {p.parentName || 'Orang Tua / Wali'} | Alasan: "{p.reason}"
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-white/5">
                      <span>Periode: {p.startDate} s/d {p.endDate}</span>
                      {p.attachmentUrl && (
                        <button
                          onClick={() => setPreviewAttachmentUrl(p.attachmentUrl || null)}
                          className="text-sky-300 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Berkas</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Preview Attachment Image / Document */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span>Berkas Pendukung Surat Izin (Dari Orang Tua)</span>
              </div>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center rounded-2xl bg-black/50 p-2 border border-white/10">
              {previewAttachmentUrl.startsWith('data:image') || previewAttachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <img
                  src={previewAttachmentUrl}
                  alt="Berkas Surat Dokter / Izin"
                  className="max-h-[60vh] object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText className="w-12 h-12 text-sky-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    Dokumen / Berkas Surat Izin Terlampir
                  </p>
                  <a
                    href={previewAttachmentUrl}
                    download="Berkas_Pendukung_Surat_Izin"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    <span>Unduh / Buka Dokumen</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
