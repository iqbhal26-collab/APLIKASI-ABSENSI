import React, { useState } from 'react';
import { SchoolClass, ActivityType, Student, AttendanceRecord, PermitSubmission, AttendanceStatus, SchoolConfig, UserRole } from '../../types';
import {
  FileSpreadsheet,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Check,
  X,
  AlertCircle,
  Moon,
  LogIn,
  LogOut,
  Users,
  ShieldCheck,
  Filter,
  FileText,
  UserCheck,
  Paperclip,
  Printer
} from 'lucide-react';

interface IntegratedAttendanceReportProps {
  classes: SchoolClass[];
  activities: ActivityType[];
  students: Student[];
  records: AttendanceRecord[];
  permits: PermitSubmission[];
  schoolConfig: SchoolConfig;
  userRole?: UserRole;
  selectedClassIdProp?: string;
  onOpenExportModal?: () => void;
  onUpdateAttendanceStatus?: (studentId: string, activityCode: string, newStatus: AttendanceStatus, notes?: string) => void;
}

export const IntegratedAttendanceReport: React.FC<IntegratedAttendanceReportProps> = ({
  classes,
  activities,
  students,
  records,
  permits,
  schoolConfig,
  userRole = 'admin',
  selectedClassIdProp,
  onOpenExportModal,
  onUpdateAttendanceStatus,
}) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [selectedClassId, setSelectedClassId] = useState<string>(selectedClassIdProp || 'ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PIKET' | 'AGAMA' | 'WALI_KELAS'>('ALL');
  const [selectedPermitAttachment, setSelectedPermitAttachment] = useState<string | null>(null);

  const currentClass = classes.find(c => c.id === selectedClassId);

  // Filter students by class & search
  const filteredStudents = students.filter(s => {
    let matchesClass = true;
    if (selectedClassId !== 'ALL') {
      if (currentClass) {
        matchesClass = s.classId === currentClass.id || (s.className && currentClass.name && s.className.toLowerCase().replace(/[^a-z0-9]/g, '') === currentClass.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
      } else {
        matchesClass = s.classId === selectedClassId;
      }
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nis.includes(q) ||
      s.nisn.includes(q) ||
      s.className.toLowerCase().includes(q);

    return matchesClass && matchesSearch;
  });

  // Calculate stats based on timeframe
  const periodRecords = timeframe === 'daily'
    ? records.filter(r => r.date === selectedDate)
    : records.filter(r => r.date && r.date.startsWith(selectedMonth));

  const periodPermits = timeframe === 'daily'
    ? permits.filter(p => p.date === selectedDate && p.status === 'approved')
    : permits.filter(p => p.date && p.date.startsWith(selectedMonth) && p.status === 'approved');

  const totalDatang = periodRecords.filter(r => r.activityCode === 'DATANG' && (r.status === 'hadir' || r.status === 'terlambat')).length;
  const totalTerlambatPagi = periodRecords.filter(r => r.activityCode === 'DATANG' && r.status === 'terlambat').length;
  const totalDzuhur = periodRecords.filter(r => r.activityCode === 'DZUHUR' && r.status === 'hadir').length;
  const totalJumat = periodRecords.filter(r => r.activityCode === 'JUMAT' && r.status === 'hadir').length;
  const totalPulang = periodRecords.filter(r => r.activityCode === 'PULANG' && r.status === 'hadir').length;
  const activePermitsCount = periodPermits.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 border border-indigo-500/30 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Laporan Terintegrasi Tiga Peran (Guru Piket, Guru Agama, Wali Kelas)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Rekapitulasi Hasil Pemindaian & Presensi Terpadu
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Koneksi data realtime antara scan Jam Datang/Pulang (Guru Piket), Sholat Dzuhur/Jumat (Guru Agama), serta Verifikasi Surat Izin/Sakit (Wali Kelas).
            </p>
          </div>

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Cetak / Export Laporan (.XLSX)</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
            <span>Datang Pagi</span>
            <LogIn className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalDatang}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">({totalTerlambatPagi} Terlambat)</div>
        </div>

        <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase">
            <span>Sholat Dzuhur</span>
            <Moon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalDzuhur}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa Scan Agama</div>
        </div>

        <div className="bg-slate-900/90 border border-teal-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-teal-400 uppercase">
            <span>Sholat Jumat</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalJumat}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siswa Laki-laki</div>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase">
            <span>Scan Pulang</span>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{totalPulang}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Guru Piket</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
            <span>Surat Izin/Sakit</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{activePermitsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Disetujui Wali Kelas</div>
        </div>
      </div>

      {/* Control Bar: Timeframe, Filters & Date */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Timeframe Selector (Harian / Bulanan) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                timeframe === 'daily' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Laporan Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                timeframe === 'monthly' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Rekap Bulanan</span>
            </button>
          </div>

          {/* Date Picker or Month Picker */}
          {timeframe === 'daily' ? (
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/10 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/10 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">-- Semua Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Role Focus Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${roleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Semua Peran
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('PIKET')}
              className={`px-3 py-1 rounded-lg transition-all ${roleFilter === 'PIKET' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Guru Piket
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('AGAMA')}
              className={`px-3 py-1 rounded-lg transition-all ${roleFilter === 'AGAMA' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Guru Agama
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('WALI_KELAS')}
              className={`px-3 py-1 rounded-lg transition-all ${roleFilter === 'WALI_KELAS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Wali Kelas
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau NISN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Main Integrated Table */}
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead key={timeframe} className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-white/10">
              {timeframe === 'daily' ? (
                <tr>
                  <th className="px-4 py-3.5 font-extrabold">No</th>
                  <th className="px-4 py-3.5 font-extrabold">Nama Siswa / NISN</th>
                  <th className="px-4 py-3.5 font-extrabold">Kelas</th>
                  {(roleFilter === 'ALL' || roleFilter === 'PIKET') && (
                    <th className="px-4 py-3.5 font-extrabold text-center bg-emerald-950/40 border-x border-white/5">
                      1. Jam Datang (Guru Piket)
                    </th>
                  )}
                  {(roleFilter === 'ALL' || roleFilter === 'AGAMA') && (
                    <>
                      <th className="px-4 py-3.5 font-extrabold text-center bg-blue-950/40 border-r border-white/5">
                        2. Sholat Dzuhur (Guru Agama)
                      </th>
                      <th className="px-4 py-3.5 font-extrabold text-center bg-teal-950/40 border-r border-white/5">
                        3. Sholat Jumat (Guru Agama)
                      </th>
                    </>
                  )}
                  {(roleFilter === 'ALL' || roleFilter === 'PIKET') && (
                    <th className="px-4 py-3.5 font-extrabold text-center bg-indigo-950/40 border-r border-white/5">
                      4. Jam Pulang (Guru Piket)
                    </th>
                  )}
                  {(roleFilter === 'ALL' || roleFilter === 'WALI_KELAS') && (
                    <th className="px-4 py-3.5 font-extrabold text-center bg-amber-950/40">
                      5. Status Wali Kelas / Surat Izin
                    </th>
                  )}
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3.5 font-extrabold">No</th>
                  <th className="px-4 py-3.5 font-extrabold">Nama Siswa / NISN</th>
                  <th className="px-4 py-3.5 font-extrabold">Kelas</th>
                  <th className="px-4 py-3.5 font-extrabold text-center bg-emerald-950/40 border-x border-white/5">
                    Total Datang (Terlambat)
                  </th>
                  <th className="px-4 py-3.5 font-extrabold text-center bg-blue-950/40 border-r border-white/5">
                    Total Sholat Dzuhur
                  </th>
                  <th className="px-4 py-3.5 font-extrabold text-center bg-teal-950/40 border-r border-white/5">
                    Total Sholat Jumat
                  </th>
                  <th className="px-4 py-3.5 font-extrabold text-center bg-indigo-950/40 border-r border-white/5">
                    Total Pulang
                  </th>
                  <th className="px-4 py-3.5 font-extrabold text-center bg-amber-950/40">
                    Surat Izin / Sakit
                  </th>
                  <th className="px-4 py-3.5 font-extrabold text-center">
                    Rekap Bulanan
                  </th>
                </tr>
              )}
            </thead>
            <tbody key={`${timeframe}-${roleFilter}-${selectedDate}-${selectedMonth}`} className="divide-y divide-white/5 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    Tidak ada data siswa ditemukan untuk kriteria yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  if (timeframe === 'daily') {
                    const stdRecords = records.filter(r => r.studentId === std.id && r.date === selectedDate);
                    const datangRec = stdRecords.find(r => r.activityCode === 'DATANG');
                    const dzuhurRec = stdRecords.find(r => r.activityCode === 'DZUHUR');
                    const jumatRec = stdRecords.find(r => r.activityCode === 'JUMAT');
                    const pulangRec = stdRecords.find(r => r.activityCode === 'PULANG');
                    const approvedPermit = permits.find(p => p.studentId === std.id && p.date === selectedDate && p.status === 'approved');

                    return (
                      <tr key={`daily-${std.id}`} className="hover:bg-white/5 transition-all">
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white text-sm">{std.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NISN: {std.nisn} ({std.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</div>
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px]">
                            {std.className}
                          </span>
                        </td>

                        {/* 1. Datang Pagi (Guru Piket) */}
                        {(roleFilter === 'ALL' || roleFilter === 'PIKET') && (
                          <td className="px-4 py-3 text-center bg-emerald-950/20 border-x border-white/5">
                            {approvedPermit ? (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase">
                                {approvedPermit.type}
                              </span>
                            ) : datangRec ? (
                              <div className="space-y-0.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  datangRec.status === 'terlambat' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  {datangRec.status === 'terlambat' ? 'Terlambat' : 'Hadir'}
                                </span>
                                <div className="text-[10px] font-mono text-emerald-400">{datangRec.time}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                Belum Scan
                              </span>
                            )}
                          </td>
                        )}

                        {/* 2. Sholat Dzuhur (Guru Agama) */}
                        {(roleFilter === 'ALL' || roleFilter === 'AGAMA') && (
                          <td className="px-4 py-3 text-center bg-blue-950/20 border-r border-white/5">
                            {approvedPermit ? (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Izin / Sakit</span>
                            ) : dzuhurRec ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-[10px] font-extrabold uppercase">
                                  Hadir
                                </span>
                                <div className="text-[10px] font-mono text-blue-400">{dzuhurRec.time}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                Belum Scan
                              </span>
                            )}
                          </td>
                        )}

                        {/* 3. Sholat Jumat (Guru Agama) */}
                        {(roleFilter === 'ALL' || roleFilter === 'AGAMA') && (
                          <td className="px-4 py-3 text-center bg-teal-950/20 border-r border-white/5">
                            {std.gender === 'P' ? (
                              <span className="text-[10px] text-slate-500 italic">Non-Wajib (P)</span>
                            ) : approvedPermit ? (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Izin / Sakit</span>
                            ) : jumatRec ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded text-[10px] font-extrabold uppercase">
                                  Hadir
                                </span>
                                <div className="text-[10px] font-mono text-teal-400">{jumatRec.time}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                Belum Scan
                              </span>
                            )}
                          </td>
                        )}

                        {/* 4. Jam Pulang (Guru Piket) */}
                        {(roleFilter === 'ALL' || roleFilter === 'PIKET') && (
                          <td className="px-4 py-3 text-center bg-indigo-950/20 border-r border-white/5">
                            {approvedPermit ? (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Izin / Sakit</span>
                            ) : pulangRec ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-extrabold uppercase">
                                  Pulang
                                </span>
                                <div className="text-[10px] font-mono text-indigo-400">{pulangRec.time}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold">Belum Pulang</span>
                            )}
                          </td>
                        )}

                        {/* 5. Status Wali Kelas / Surat Izin */}
                        {(roleFilter === 'ALL' || roleFilter === 'WALI_KELAS') && (
                          <td className="px-4 py-3 text-center bg-amber-950/20">
                            {approvedPermit ? (
                              <div className="space-y-1">
                                <span className="px-2.5 py-1 bg-amber-500/30 text-amber-200 border border-amber-500/50 rounded-lg text-[10px] font-black uppercase inline-flex items-center space-x-1">
                                  <FileText className="w-3 h-3 text-amber-400" />
                                  <span>{approvedPermit.type}: {approvedPermit.reason}</span>
                                </span>
                                {approvedPermit.attachmentUrl && (
                                  <button
                                    onClick={() => setSelectedPermitAttachment(approvedPermit.attachmentUrl || null)}
                                    className="text-[10px] text-sky-400 hover:underline flex items-center justify-center space-x-1 mx-auto"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>Lihat Surat Dokter / Izin</span>
                                  </button>
                                )}
                              </div>
                            ) : datangRec || dzuhurRec || jumatRec || pulangRec ? (
                              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold">
                                Verifikasi Hadir
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold uppercase">
                                Tanpa Keterangan / Alpa
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  } else {
                    // MONTHLY TIMEFRAME AGGREGATION
                    const mRecords = records.filter(r => r.studentId === std.id && r.date && r.date.startsWith(selectedMonth));
                    const mDatangCount = mRecords.filter(r => r.activityCode === 'DATANG' && (r.status === 'hadir' || r.status === 'terlambat')).length;
                    const mTerlambatCount = mRecords.filter(r => r.activityCode === 'DATANG' && r.status === 'terlambat').length;
                    const mDzuhurCount = mRecords.filter(r => r.activityCode === 'DZUHUR' && r.status === 'hadir').length;
                    const mJumatCount = mRecords.filter(r => r.activityCode === 'JUMAT' && r.status === 'hadir').length;
                    const mPulangCount = mRecords.filter(r => r.activityCode === 'PULANG' && r.status === 'hadir').length;
                    const mPermitsCount = permits.filter(p => p.studentId === std.id && p.date && p.date.startsWith(selectedMonth) && p.status === 'approved').length;

                    return (
                      <tr key={`monthly-${std.id}`} className="hover:bg-white/5 transition-all">
                        <td className="px-4 py-3.5 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-sm">{std.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NISN: {std.nisn}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px]">
                            {std.className}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center bg-emerald-950/20 border-x border-white/5 font-mono">
                          <span className="font-extrabold text-emerald-400">{mDatangCount}x</span>
                          {mTerlambatCount > 0 && (
                            <div className="text-[10px] text-amber-300 font-semibold">({mTerlambatCount}x terlambat)</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center bg-blue-950/20 border-r border-white/5 font-mono font-extrabold text-blue-400">
                          {mDzuhurCount}x
                        </td>
                        <td className="px-4 py-3.5 text-center bg-teal-950/20 border-r border-white/5 font-mono font-extrabold text-teal-400">
                          {std.gender === 'P' ? '-' : `${mJumatCount}x`}
                        </td>
                        <td className="px-4 py-3.5 text-center bg-indigo-950/20 border-r border-white/5 font-mono font-extrabold text-indigo-400">
                          {mPulangCount}x
                        </td>
                        <td className="px-4 py-3.5 text-center bg-amber-950/20 font-mono font-extrabold text-amber-300">
                          {mPermitsCount} Hari
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold uppercase">
                            Aktif ({mDatangCount + mPermitsCount} hari)
                          </span>
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {selectedPermitAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-indigo-400" />
                <span>Lampiran Surat Dokter / Permohonan Izin</span>
              </h3>
              <button
                onClick={() => setSelectedPermitAttachment(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                &times;
              </button>
            </div>
            <div className="p-2 bg-slate-950 rounded-2xl border border-white/10 flex justify-center">
              <img
                src={selectedPermitAttachment}
                alt="Lampiran Surat Izin"
                className="max-h-96 rounded-xl object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPermitAttachment(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
