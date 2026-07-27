import React, { useState } from 'react';
import { SchoolClass, ActivityType, Student, AttendanceRecord, PermitSubmission, AttendanceStatus } from '../../types';
import { UserCheck, CheckCircle2, Clock, Calendar, FileText, Check, X, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface GuruDashboardProps {
  classes: SchoolClass[];
  activities: ActivityType[];
  students: Student[];
  records: AttendanceRecord[];
  permits: PermitSubmission[];
  teacherClassHandled?: string[];
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
  onUpdateAttendanceStatus,
  onApprovePermit,
  onOpenExportModal
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    teacherClassHandled && teacherClassHandled[0] ? teacherClassHandled[0] : classes[0]?.id || ''
  );
  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('DATANG');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.classId === selectedClassId);
  const selectedActivity = activities.find(a => a.code === selectedActivityCode) || activities[0];

  const pendingPermits = permits.filter(p => p.className === currentClass?.name && p.status === 'pending');

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
            Presensi Siswa Kelas {currentClass?.name || 'X IPA 1'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Wali Kelas: <strong>{currentClass?.homeroomTeacherName}</strong> | Total: {classStudents.length} Siswa
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-950" />
          <span>Cetak Laporan Kelas</span>
        </button>
      </div>

      {/* Control Selector Bar */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Class selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Pilih Kelas Binaan:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white bg-slate-900"
          >
            {classes.map((c) => (
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
            className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white bg-slate-900"
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
            className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white bg-black/40"
          />
        </div>
      </div>

      {/* Pending Permits Alert Box */}
      {pendingPermits.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-white space-y-3 backdrop-blur-md">
          <div className="flex items-center space-x-2 font-bold text-sm text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Ada {pendingPermits.length} Pengajuan Surat Izin / Sakit dari Orang Tua Perlu Persetujuan:</span>
          </div>

          <div className="space-y-2">
            {pendingPermits.map((p) => (
              <div key={p.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <strong className="text-white">{p.studentName}</strong> ({p.type.toUpperCase()})
                  <div className="text-slate-300 mt-0.5">Alasan: "{p.reason}"</div>
                  <div className="text-[10px] text-slate-400 font-mono">Waktu Pengajuan: {p.createdAt}</div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onApprovePermit(p.id, false)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => onApprovePermit(p.id, true)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-md transition-colors flex items-center space-x-1"
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

      {/* Class Attendance Matrix */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">
              Daftar Kehadiran Siswa: {selectedActivity?.name}
            </h3>
            <p className="text-xs text-slate-400">
              Klik tombol status di samping nama siswa untuk mengubah atau override status presensi secara manual.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                          className="px-2.5 py-1 hover:bg-emerald-500/20 text-emerald-300 font-bold border-r border-white/10 transition-colors"
                          title="Hadir"
                        >
                          Hadir
                        </button>
                        <button
                          onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'sakit', 'Surat Sakit')}
                          className="px-2.5 py-1 hover:bg-sky-500/20 text-sky-300 font-bold border-r border-white/10 transition-colors"
                          title="Sakit"
                        >
                          Sakit
                        </button>
                        <button
                          onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'izin', 'Izin Resmi')}
                          className="px-2.5 py-1 hover:bg-amber-500/20 text-amber-300 font-bold border-r border-white/10 transition-colors"
                          title="Izin"
                        >
                          Izin
                        </button>
                        <button
                          onClick={() => onUpdateAttendanceStatus(std.id, selectedActivityCode, 'alpa', 'Tanpa Keterangan')}
                          className="px-2.5 py-1 hover:bg-rose-500/20 text-rose-300 font-bold transition-colors"
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
        </div>
      </div>
    </div>
  );
};
