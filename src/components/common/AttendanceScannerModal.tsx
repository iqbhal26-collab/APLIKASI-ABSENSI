import React, { useState } from 'react';
import { Student, ActivityType, AttendanceRecord, Gender } from '../../types';
import { QrCode, X, CheckCircle2, AlertTriangle, Sparkles, User, Clock, Bell } from 'lucide-react';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  activities: ActivityType[];
  records?: AttendanceRecord[];
  onRecordAttendance: (record: Omit<AttendanceRecord, 'id'>) => boolean | void;
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  activities,
  records = [],
  onRecordAttendance
}) => {
  if (!isOpen) return null;

  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('DATANG');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    time?: string;
    status?: string;
  } | null>(null);

  const selectedActivity = activities.find(a => a.code === selectedActivityCode) || activities[0];
  const currentStudent = students.find(s => s.id === selectedStudentId);

  const handleSimulateScan = () => {
    if (!currentStudent || !selectedActivity) return;

    // Check gender constraint (e.g. Sholat Jumat for Male students only)
    if (selectedActivity.genderConstraint === 'L' && currentStudent.gender !== 'L') {
      setScanResult({
        success: false,
        message: `PERINGATAN: ${selectedActivity.name} khusus untuk Siswa Laki-Laki. ${currentStudent.name} (Perempuan) tidak diwajibkan absensi Sholat Jumat.`,
      });
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Anti-duplicate check: check if student has already recorded attendance for this activity today
    const existing = records.find(
      r => r.studentId === currentStudent.id &&
           r.date === todayStr &&
           r.activityCode === selectedActivity.code
    );

    if (existing) {
      setScanResult({
        success: false,
        message: `PERINGATAN / GAGAL: Siswa '${currentStudent.name}' SUDAH ABSEN untuk kegiatan '${selectedActivity.name}' hari ini pada pukul ${existing.time} WIB (Status: ${existing.status.toUpperCase()}). Data absensi tidak bisa dobel!`,
        studentName: currentStudent.name,
        time: existing.time,
        status: existing.status,
      });
      return;
    }

    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const hourMin = timeStr.substring(0, 5); // HH:mm

    // Simple lateness check vs end time
    let status: 'hadir' | 'terlambat' = 'hadir';
    if (selectedActivity.endTime && hourMin > selectedActivity.endTime) {
      status = 'terlambat';
    }

    const isSuccess = onRecordAttendance({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      className: currentStudent.className,
      gender: currentStudent.gender,
      date: todayStr,
      activityId: selectedActivity.id,
      activityCode: selectedActivity.code,
      activityName: selectedActivity.name,
      time: timeStr,
      status: status,
      method: 'QR_SCAN',
      notes: status === 'terlambat' ? 'Presensi melewati batas toleransi jam kegiatan' : undefined,
    });

    if (isSuccess === false) {
      setScanResult({
        success: false,
        message: `PERINGATAN: Absensi gagal karena data absensi untuk siswa '${currentStudent.name}' pada sesi '${selectedActivity.name}' sudah ada. Presensi tidak dapat diulang!`,
        studentName: currentStudent.name,
        time: timeStr,
        status: status,
      });
      return;
    }

    setScanResult({
      success: true,
      message: `PRESENSI BERHASIL DICATAT! Notifikasi push telah dikirimkan ke HP Orang Tua (${currentStudent.parentName}).`,
      studentName: currentStudent.name,
      time: timeStr,
      status: status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Kios Scan QR Kartu Siswa</h3>
              <p className="text-xs text-slate-300">
                Tap / Scan QR pada Kartu Pelajar untuk Presensi Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setScanResult(null);
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Activity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Pilih Sesi / Jenis Kegiatan Absensi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activities.map((act) => {
                const isSelected = selectedActivityCode === act.code;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setSelectedActivityCode(act.code);
                      setScanResult(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-md'
                        : 'border-white/10 hover:bg-white/10 text-slate-300 font-medium'
                    }`}
                  >
                    <div className="text-xs">{act.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {act.startTime} - {act.endTime}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Special Friday Note */}
            {selectedActivityCode === 'JUMAT' && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Catatan Sholat Jumat:</strong> Khusus untuk Siswa Laki-laki pada hari sekolah / Hari Jumat.
                </span>
              </div>
            )}
          </div>

          {/* Student Scanner Simulation Frame */}
          <div className="bg-black/40 rounded-2xl p-5 text-white relative overflow-hidden border border-white/10">
            {/* Viewfinder Grid Effect */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-emerald-400/80 flex flex-col items-center justify-center bg-white/5 p-3 shadow-inner">
                <QrCode className="w-16 h-16 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300 font-semibold mt-1">CAMERA SCANNER</span>
              </div>

              <p className="text-xs text-slate-300 max-w-sm">
                Arahkan QR Code Kartu Pelajar ke scanner atau pilih nama siswa di bawah untuk melakukan tes presensi.
              </p>

              {/* Student Dropdown for manual simulation */}
              <div className="w-full max-w-md pt-2">
                <label className="block text-[11px] text-slate-300 text-left font-semibold mb-1">
                  Pilih Siswa (Simulasi Tap Kartu):
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setScanResult(null);
                  }}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.className}) - NISN: {std.nisn} [{std.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Tap Button */}
              <button
                type="button"
                onClick={handleSimulateScan}
                className="w-full max-w-md mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>TAP / SCAN KARTU SEKARANG</span>
              </button>
            </div>
          </div>

          {/* Scan Result Feedback */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border text-sm animate-fadeIn ${
                scanResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {scanResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-base text-white">
                    {scanResult.success ? 'PRESENSI BERHASIL' : 'PRESENSI GAGAL'}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{scanResult.message}</p>

                  {scanResult.success && (
                    <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-medium text-slate-200">
                      <div>Siswa: <strong className="text-white">{scanResult.studentName}</strong></div>
                      <div>Waktu Tap: <span className="font-mono text-emerald-300">{scanResult.time}</span></div>
                      <div>Status: <span className="uppercase font-bold text-emerald-300">{scanResult.status}</span></div>
                      <div className="flex items-center space-x-1 text-emerald-300">
                        <Bell className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Push Alert Sent</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
