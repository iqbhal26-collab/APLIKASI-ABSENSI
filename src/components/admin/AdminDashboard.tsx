import React from 'react';
import { Student, AttendanceRecord, ActivityType, SchoolClass, PermitSubmission, SchoolConfig } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Moon,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  Settings,
  Calendar,
  Sparkles,
  Award,
  School,
  ShieldCheck
} from 'lucide-react';
import { IntegratedAttendanceReport } from '../common/IntegratedAttendanceReport';

interface AdminDashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  activities: ActivityType[];
  classes: SchoolClass[];
  permits: PermitSubmission[];
  schoolConfig?: SchoolConfig;
  onNavigateTab: (tabId: string) => void;
  onOpenScanner: () => void;
  onOpenExportModal: () => void;
  onOpenExcelImportModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  records,
  activities,
  classes,
  permits,
  schoolConfig,
  onNavigateTab,
  onOpenScanner,
  onOpenExportModal,
  onOpenExcelImportModal
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === todayStr);

  // Metrics
  const totalStudents = students.length;
  const datangs = todayRecords.filter(r => r.activityCode === 'DATANG');
  const hadirPagi = datangs.filter(r => r.status === 'hadir').length;
  const terlambatPagi = datangs.filter(r => r.status === 'terlambat').length;
  const dzuhurs = todayRecords.filter(r => r.activityCode === 'DZUHUR' && r.status === 'hadir').length;
  const jumats = todayRecords.filter(r => r.activityCode === 'JUMAT' && r.status === 'hadir').length;
  const totalMales = students.filter(s => s.gender === 'L').length;

  const pendingPermitsCount = permits.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DASBOR ADMINISTRATOR SMA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sistem Pemantauan Absensi & Sholat Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Memantau kehadiran Jam Datang, Sholat Dzuhur, Sholat Jumat (Siswa Laki-Laki), dan Jam Pulang secara realtime terintegrasi notifikasi wali murid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenExcelImportModal && (
              <button
                onClick={onOpenExcelImportModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 font-bold text-xs text-slate-950 shadow-lg shadow-teal-500/20 transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                <span>Import Excel (.xlsx)</span>
              </button>
            )}
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Clock className="w-4 h-4 text-slate-950" />
              <span>Buka Scanner QR</span>
            </button>
            <button
              onClick={onOpenExportModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs text-slate-200 border border-white/10 transition-all flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Siswa */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Siswa Terdaftar</span>
            <div className="text-2xl font-bold text-white mt-1">{totalStudents} Siswa</div>
            <div className="text-xs text-slate-400 mt-1">{classes.length} Rombongan Belajar</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Hadir Pagi */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presensi Datang Pagi</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{hadirPagi} Siswa</div>
            <div className="text-xs text-amber-400 mt-1 font-medium">{terlambatPagi} Terlambat Hari Ini</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Sholat Dzuhur & Jumat */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presensi Sholat Berjamaah</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">{dzuhurs + jumats} Presensi</div>
            <div className="text-xs text-slate-400 mt-1">Dzuhur: {dzuhurs} | Jumat: {jumats}/{totalMales}</div>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Moon className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pengajuan Surat Izin */}
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengajuan Izin / Sakit</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingPermitsCount} Pending</div>
            <div className="text-xs text-slate-400 mt-1">Perlu Validasi Wali Kelas</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Routine Activities Status Table */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Jadwal Sesi Kegiatan Absensi Rutin Hari Ini</h3>
            <p className="text-xs text-slate-400">
              Pengaturan rentang waktu dan aturan khusus (Laki-laki / Perempuan)
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('activities')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Kelola Kegiatan</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {activities.map((act) => {
            const countForAct = todayRecords.filter(r => r.activityCode === act.code && r.status === 'hadir').length;
            return (
              <div key={act.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-slate-200 font-bold text-xs shrink-0 border border-white/10">
                    {act.code}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center space-x-2">
                      <span>{act.name}</span>
                      {act.genderConstraint === 'L' && (
                        <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded-full font-bold border border-amber-500/30">
                          Khusus Laki-Laki (Jumat)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Waktu: <span className="font-mono text-slate-200 font-semibold">{act.startTime} - {act.endTime}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    {countForAct} Siswa Absen
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {act.isActive ? 'Status: Aktif' : 'Status: Non-Aktif'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('classes')}
          className="p-5 bg-white/5 backdrop-blur-md text-white rounded-2xl cursor-pointer hover:bg-white/10 transition-all group border border-white/10 shadow-lg"
        >
          <School className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-base">Kelola Kelas & Wali Kelas</h4>
          <p className="text-xs text-slate-300 mt-1">
            Atur nama kelas, jurusan, tingkat, dan penugasan guru Wali Kelas.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('student_cards')}
          className="p-5 bg-white/5 backdrop-blur-md text-white rounded-2xl cursor-pointer hover:bg-white/10 transition-all group border border-white/10 shadow-lg"
        >
          <CreditCard className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-base">Cetak Kartu Pelajar (QR Code)</h4>
          <p className="text-xs text-slate-300 mt-1">
            Cetak kartu fisik ber-QR untuk absensi otomatis siswa di mesin scanner sekolah.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('users')}
          className="p-5 bg-white/5 backdrop-blur-md text-white rounded-2xl cursor-pointer hover:bg-white/10 transition-all group border border-white/10 shadow-lg"
        >
          <Users className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-base">Kelola Data Siswa & Wali</h4>
          <p className="text-xs text-slate-300 mt-1">
            Tambah data siswa baru, hubungan dengan wali murid, dan penempatan kelas.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('config')}
          className="p-5 bg-white/5 backdrop-blur-md text-white rounded-2xl cursor-pointer hover:bg-white/10 transition-all group border border-white/10 shadow-lg"
        >
          <Settings className="w-8 h-8 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-base">Konfigurasi Database & Supabase</h4>
          <p className="text-xs text-slate-300 mt-1">
            Hubungkan aplikasi ke Supabase Cloud, toleransi keterlambatan & profil sekolah.
          </p>
        </div>
      </div>

      {/* Integrated Attendance Report Section for Admin */}
      <IntegratedAttendanceReport
        classes={classes}
        activities={activities}
        students={students}
        records={records}
        permits={permits}
        schoolConfig={schoolConfig || { schoolName: 'Sekolah', npsn: '', address: '', academicYear: '', semester: '', principalName: '', principalNip: '', toleranceMinutes: 15 }}
        userRole="admin"
        onOpenExportModal={onOpenExportModal}
      />
    </div>
  );
};
