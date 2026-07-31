import React, { useState } from 'react';
import { Student, AttendanceRecord, ActivityType, SchoolConfig } from '../../types';
import { GraduationCap, QrCode, CheckCircle2, Moon, Calendar, CreditCard, Sparkles, AlertCircle, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentDashboardProps {
  student: Student;
  records: AttendanceRecord[];
  activities: ActivityType[];
  schoolConfig: SchoolConfig;
  onRecordAttendance?: (record: Omit<AttendanceRecord, 'id'>) => boolean | void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  records,
  activities,
  schoolConfig,
}) => {
  const [showFullQr, setShowFullQr] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const myRecords = records.filter(r => r.studentId === student.id);
  const todayRecords = myRecords.filter(r => r.date === todayStr);

  const isFriday = new Date().getDay() === 5;
  const isMale = student.gender === 'L';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>PORTAL PRESENSI SISWA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Selamat Datang, {student.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Kelas: <strong>{student.className}</strong> | NISN: <span className="font-mono text-amber-400">{student.nisn}</span>
          </p>
        </div>

        <button
          onClick={() => setShowFullQr(true)}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <QrCode className="w-5 h-5 text-slate-950" />
          <span>Tampilkan QR Kartu Pelajar Saya</span>
        </button>
      </div>

      {/* Information Banner regarding Scanner Centric Attendance */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-blue-500/30 shadow-lg backdrop-blur-md flex items-start space-x-3.5">
        <QrCode className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <span>Sistem Presensi Barcode Terpusat</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30 font-mono">INFO PRESENSI</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Presensi siswa dicatat secara resmi melalui pemindaian/scan barcode QR Kartu Pelajar oleh <strong>Guru Piket</strong> (Datang & Pulang) serta <strong>Guru Agama</strong> (Sholat Dzuhur & Sholat Jumat). Tunjukkan QR Kartu Pelajar Anda ke petugas scanner.
          </p>
        </div>
      </div>

      {/* Friday Prayer Alert for Males */}
      {isMale && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl text-white flex items-start space-x-3 shadow-lg backdrop-blur-md">
          <Moon className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm text-amber-300">
              Pengingat Rutin: Sholat Jumat Berjamaah di Masjid Sekolah
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Sebagai siswa laki-laki, Anda diwajibkan mengikuti Sholat Jumat berjamaah pada hari sekolah / Jumat. Lakukan scan QR di area masjid sebelum pukul 12:00 WIB.
            </p>
          </div>
        </div>
      )}

      {/* Today Attendance Cards */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-bold text-white text-base">Status Hasil Scan Barcode Hari Ini</h3>
          <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            {todayStr}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activities.map((act) => {
            const rec = todayRecords.find(r => r.activityCode === act.code);
            const isCompleted = !!rec && (rec.status === 'hadir' || rec.status === 'terlambat');
            const isLate = rec?.status === 'terlambat';

            const isFridayMaleAct = act.code === 'JUMAT';
            const isFemaleExempt = isFridayMaleAct && !isMale;

            const scannerOfficer = (act.code === 'DZUHUR' || act.code === 'JUMAT') ? 'Guru Agama' : 'Guru Piket';

            return (
              <div
                key={act.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isFemaleExempt
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : isCompleted
                    ? isLate
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    {act.code}
                  </span>
                  {isFemaleExempt ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-white/10 text-slate-300 rounded-full">
                      Khusus Laki-laki
                    </span>
                  ) : isCompleted ? (
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isLate ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {isLate ? 'TERLAMBAT' : 'SUDAH ABSEN'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full">
                      BELUM SCAN
                    </span>
                  )}
                </div>

                <div className="mt-3 font-bold text-sm text-white">
                  {act.name}
                </div>

                <div className="text-xs font-mono text-slate-400 mt-1">
                  Batas Jam: {act.startTime} - {act.endTime}
                </div>

                <div className="mt-4 pt-2 border-t border-white/10 flex flex-col space-y-2 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Waktu Scan:</span>
                    <span className="font-mono text-white">{rec ? rec.time : '-'}</span>
                  </div>

                  {isCompleted ? (
                    <div className="p-2.5 rounded-xl text-[11px] font-bold text-center flex flex-col items-center justify-center space-y-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <div className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Presensi Terverifikasi</span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-normal">
                        Hasil Scan Barcode oleh {scannerOfficer}
                      </span>
                    </div>
                  ) : !isFemaleExempt ? (
                    <div className="p-2.5 rounded-xl text-[11px] font-bold text-center flex flex-col items-center justify-center space-y-1 bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <div className="flex items-center space-x-1 text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Belum Scan Barcode</span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-normal">
                        Tunjukkan QR Kartu ke {scannerOfficer}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Screen Digital Card Modal */}
      {showFullQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-white/15 w-full max-w-sm text-center space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm">Kartu Digital QR Absensi</h3>
              <button
                onClick={() => setShowFullQr(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg my-2 border border-slate-200">
              <QRCodeSVG value={student.qrCode || `QR-STD-${student.nisn}`} size={192} level="H" />
            </div>

            <div>
              <div className="font-bold text-base text-white">{student.name}</div>
              <div className="text-xs text-amber-400 font-mono mt-0.5">NISN: {student.nisn}</div>
              <div className="text-xs text-slate-400 mt-1">
                Dekatkan layar HP ini ke mesin scanner di gerbang / masjid sekolah.
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Cetak Kartu</span>
              </button>
              <button
                onClick={() => setShowFullQr(false)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10"
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
