import React, { useState } from 'react';
import { Student, AttendanceRecord, ActivityType, SchoolConfig } from '../../types';
import { GraduationCap, QrCode, CheckCircle2, Moon, Calendar, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

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
  onRecordAttendance
}) => {
  const [showFullQr, setShowFullQr] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const myRecords = records.filter(r => r.studentId === student.id);
  const todayRecords = myRecords.filter(r => r.date === todayStr);

  const isFriday = new Date().getDay() === 5;
  const isMale = student.gender === 'L';

  const handleSelfCheckIn = (act: ActivityType) => {
    // Anti-duplicate check
    const existing = todayRecords.find(r => r.activityCode === act.code);
    if (existing) {
      setActionAlert(`⚠️ PRESENSI GAGAL: Anda sudah melakukan presensi ${act.name} hari ini pada pukul ${existing.time} WIB. Presensi tidak bisa diulang!`);
      return;
    }

    if (onRecordAttendance) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const hourMin = timeStr.substring(0, 5);
      let status: 'hadir' | 'terlambat' = 'hadir';
      if (act.endTime && hourMin > act.endTime) {
        status = 'terlambat';
      }

      const ok = onRecordAttendance({
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        gender: student.gender,
        date: todayStr,
        activityId: act.id,
        activityCode: act.code,
        activityName: act.name,
        time: timeStr,
        status: status,
        method: 'SELF_CHECKIN',
        notes: status === 'terlambat' ? 'Presensi mandiri melewati jam kegiatan' : undefined,
      });

      if (ok === false) {
        setActionAlert(`⚠️ PRESENSI GAGAL: Presensi ${act.name} sudah tercatat sebelumnya. Data tidak bisa dobel!`);
      } else {
        setActionAlert(`✅ PRESENSI BERHASIL! Presensi ${act.name} telah dicatat pada pukul ${timeStr} WIB.`);
      }
    }
  };

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
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95"
        >
          <QrCode className="w-5 h-5 text-slate-950" />
          <span>Tampilkan QR Kartu Pelajar Saya</span>
        </button>
      </div>

      {/* Action alert */}
      {actionAlert && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          actionAlert.includes('BERHASIL')
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          <span>{actionAlert}</span>
          <button
            onClick={() => setActionAlert(null)}
            className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
          >
            Tutup
          </button>
        </div>
      )}

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
          <h3 className="font-bold text-white text-base">Status Presensi Sesi Hari Ini</h3>
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
                      BELUM ABSEN
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
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-center">
                      🔒 Presensi Terkunci (Sudah Absen)
                    </div>
                  ) : !isFemaleExempt && onRecordAttendance ? (
                    <button
                      type="button"
                      onClick={() => handleSelfCheckIn(act)}
                      className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center justify-center space-x-1 active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Absen Mandiri Sekarang</span>
                    </button>
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

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg my-2">
              <QrCode className="w-48 h-48 text-slate-900" />
            </div>

            <div>
              <div className="font-bold text-base text-white">{student.name}</div>
              <div className="text-xs text-amber-400 font-mono mt-0.5">NISN: {student.nisn}</div>
              <div className="text-xs text-slate-400 mt-1">
                Dekatkan layar HP ini ke mesin scanner di gerbang / masjid sekolah.
              </div>
            </div>

            <button
              onClick={() => setShowFullQr(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10"
            >
              Tutup Modal QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
