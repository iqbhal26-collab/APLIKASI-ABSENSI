import React, { useState } from 'react';
import { SchoolClass, ActivityType, Student, AttendanceRecord, AttendanceStatus, SchoolConfig } from '../../types';
import { Moon, FileSpreadsheet, Filter, Search, Calendar, CheckCircle2, Clock, Check, X, AlertCircle, BookOpen, ShieldCheck } from 'lucide-react';

interface ReligionTeacherDashboardProps {
  classes: SchoolClass[];
  activities: ActivityType[];
  students: Student[];
  records: AttendanceRecord[];
  onUpdateAttendanceStatus: (studentId: string, activityCode: string, newStatus: AttendanceStatus, notes?: string) => void;
  onOpenExportModal: () => void;
}

export const ReligionTeacherDashboard: React.FC<ReligionTeacherDashboardProps> = ({
  classes,
  activities,
  students,
  records,
  onUpdateAttendanceStatus,
  onOpenExportModal
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('ALL'); // 'ALL' | 'DZUHUR' | 'JUMAT'
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter activities relevant to Guru Agama (Dzuhur & Jumat)
  const prayerActivities = activities.filter(a => 
    a.code === 'DZUHUR' || a.code === 'JUMAT' || a.name.toLowerCase().includes('sholat') || a.code.includes('PRAY')
  );

  // Filter records specifically for prayer activities
  const prayerActivityCodes = prayerActivities.length > 0 ? prayerActivities.map(a => a.code) : ['DZUHUR', 'JUMAT'];

  // Filter students based on selected class & search
  const filteredStudents = students.filter(std => {
    const matchesClass = selectedClassId === 'ALL' || std.classId === selectedClassId;
    const matchesSearch = 
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.nis.includes(searchQuery) ||
      std.nisn.includes(searchQuery) ||
      std.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Determine active prayer code for statistics/views
  const activePrayerCode = selectedActivityCode === 'ALL' ? 'DZUHUR' : selectedActivityCode;

  // Calculate stats for today/selectedDate
  const todayPrayerRecords = records.filter(r => 
    r.date === selectedDate && prayerActivityCodes.includes(r.activityCode)
  );

  const totalDzuhurHadir = records.filter(r => r.date === selectedDate && r.activityCode === 'DZUHUR' && r.status === 'hadir').length;
  const totalJumatHadir = records.filter(r => r.date === selectedDate && r.activityCode === 'JUMAT' && r.status === 'hadir').length;
  const totalMaleStudents = students.filter(s => s.gender === 'L').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <Moon className="w-4 h-4 text-emerald-400" />
            <span>DASBOR GURU AGAMA - PEMANTAUAN SHOLAT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Laporan Keikutsertaan Sholat Dzuhur & Sholat Jumat
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Halaman rekapitulasi presensi ibadah siswa untuk Sholat Dzuhur Berjamaah dan Sholat Jumat. Guru Agama memiliki hak akses khusus untuk melihat & memperbarui status presensi sholat.
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-950" />
          <span>Cetak Laporan Sholat (.XLSX / .PDF)</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sholat Dzuhur Hadir</span>
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalDzuhurHadir} <span className="text-xs font-normal text-slate-400">/ {students.length} Siswa</span></div>
          <p className="text-[11px] text-emerald-400 mt-1">Tanggal: {selectedDate}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sholat Jumat Hadir</span>
            <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400 border border-sky-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalJumatHadir} <span className="text-xs font-normal text-slate-400">/ {totalMaleStudents} Putra</span></div>
          <p className="text-[11px] text-sky-400 mt-1">Khusus Siswa Laki-Laki</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sesi Kegiatan Sholat</span>
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white">Dzuhur & Jumat</div>
          <p className="text-[11px] text-amber-300/80 mt-1">2 Sesi Ibadah Aktif</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hak Akses Aktif</span>
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white">Guru Agama</div>
          <p className="text-[11px] text-purple-300 mt-1">Sistem Absensi Keagamaan</p>
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tanggal:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Class Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Filter Kelas:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Prayer Activity Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Sesi Sholat:
          </label>
          <select
            value={selectedActivityCode}
            onChange={(e) => setSelectedActivityCode(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Sesi Sholat (Dzuhur & Jumat)</option>
            <option value="DZUHUR">Sholat Dzuhur Berjamaah</option>
            <option value="JUMAT">Sholat Jumat (Putra)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Status Presensi:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="hadir">Hadir / Ikut Sholat</option>
            <option value="terlambat">Terlambat</option>
            <option value="sakit">Sakit</option>
            <option value="izin">Izin</option>
            <option value="alpa">Alpa / Belum Absen</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Cari Siswa:
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nama / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Student Prayer Attendance Table */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              Rekap Presensi Sholat Siswa — Tanggal {selectedDate}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Tampil: {filteredStudents.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 text-slate-300 font-bold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5">NIS / NISN</th>
                <th className="px-4 py-3.5">Nama Siswa</th>
                <th className="px-4 py-3.5">L/P</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5 text-center">Status Sholat Dzuhur</th>
                <th className="px-4 py-3.5 text-center">Status Sholat Jumat</th>
                <th className="px-4 py-3.5 text-right">Aksi Verifikasi Guru Agama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data siswa ditemukan sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const dzuhurRecord = records.find(
                    r => r.studentId === std.id && r.date === selectedDate && r.activityCode === 'DZUHUR'
                  );
                  const jumatRecord = records.find(
                    r => r.studentId === std.id && r.date === selectedDate && r.activityCode === 'JUMAT'
                  );

                  // Helper badge renderer
                  const renderStatusBadge = (record?: AttendanceRecord, isFridayConstraint?: boolean) => {
                    if (isFridayConstraint && std.gender === 'P') {
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Non-Wajib (Perempuan)
                        </span>
                      );
                    }

                    if (!record || record.status === 'belum_absen' || record.status === 'alpa') {
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          Alpa / Belum
                        </span>
                      );
                    }

                    if (record.status === 'hadir') {
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Hadir ({record.time || '12:15'})</span>
                        </span>
                      );
                    }

                    if (record.status === 'terlambat') {
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Terlambat ({record.time})
                        </span>
                      );
                    }

                    if (record.status === 'izin' || record.status === 'sakit') {
                      return (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                          {record.status}
                        </span>
                      );
                    }

                    return null;
                  };

                  return (
                    <tr key={std.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-300 font-semibold">
                        <div>{std.nis}</div>
                        <div className="text-[10px] text-slate-500">{std.nisn}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{std.name}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          ID QR: {std.qrCode}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          std.gender === 'L' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                        }`}>
                          {std.gender}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-200 font-semibold border border-white/10">
                          {std.className}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {renderStatusBadge(dzuhurRecord, false)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {renderStatusBadge(jumatRecord, true)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onUpdateAttendanceStatus(std.id, 'DZUHUR', 'hadir', 'Presensi Sholat oleh Guru Agama')}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                            title="Tandai Hadir Sholat Dzuhur"
                          >
                            + Dzuhur
                          </button>
                          {std.gender === 'L' && (
                            <button
                              onClick={() => onUpdateAttendanceStatus(std.id, 'JUMAT', 'hadir', 'Presensi Sholat Jumat oleh Guru Agama')}
                              className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 text-[11px] font-bold border border-sky-500/30 transition-all cursor-pointer"
                              title="Tandai Hadir Sholat Jumat"
                            >
                              + Jumat
                            </button>
                          )}
                          <button
                            onClick={() => onUpdateAttendanceStatus(std.id, 'DZUHUR', 'alpa', 'Diubah oleh Guru Agama')}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-all cursor-pointer"
                            title="Tandai Tidak Hadir"
                          >
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
