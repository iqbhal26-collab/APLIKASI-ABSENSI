import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, ActivityType, SchoolConfig, User, Announcement } from '../../types';
import { StudentCardModal } from '../common/StudentCardModal';
import {
  GraduationCap,
  QrCode,
  CheckCircle2,
  Moon,
  Calendar,
  CreditCard,
  Sparkles,
  AlertCircle,
  Printer,
  UserCog,
  Save,
  X,
  Lock,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  User as UserIcon,
  Megaphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentDashboardProps {
  student: Student;
  records: AttendanceRecord[];
  activities: ActivityType[];
  schoolConfig: SchoolConfig;
  currentUser?: User;
  announcements?: Announcement[];
  onNavigateTab?: (tab: string) => void;
  onRecordAttendance?: (record: Omit<AttendanceRecord, 'id'>) => boolean | void;
  onUpdateStudentAccount?: (
    updatedStudent: Student,
    accountData?: { username?: string; password?: string }
  ) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  records,
  activities,
  schoolConfig,
  currentUser,
  announcements = [],
  onNavigateTab,
  onUpdateStudentAccount,
}) => {
  const [showFullQr, setShowFullQr] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state initialized with student & user props
  const [accountForm, setAccountForm] = useState({
    name: student.name || '',
    nisn: student.nisn || '',
    gender: student.gender || 'L',
    phone: student.phone || '',
    email: student.email || '',
    birthDate: student.birthDate || '',
    address: student.address || '',
    parentName: student.parentName || '',
    parentPhone: student.parentPhone || '',
    username: currentUser?.username || student.nisn || '',
    password: currentUser?.password || '',
  });

  // Keep form updated if student prop changes
  useEffect(() => {
    setAccountForm({
      name: student.name || '',
      nisn: student.nisn || '',
      gender: student.gender || 'L',
      phone: student.phone || '',
      email: student.email || '',
      birthDate: student.birthDate || '',
      address: student.address || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      username: currentUser?.username || student.nisn || '',
      password: currentUser?.password || '',
    });
  }, [student, currentUser]);

  const todayStr = new Date().toISOString().split('T')[0];
  const myRecords = records.filter(r => r.studentId === student.id);
  const todayRecords = myRecords.filter(r => r.date === todayStr);

  const isFriday = new Date().getDay() === 5;
  const isMale = student.gender === 'L';

  const handleSaveAccountData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      setToastMessage('⚠️ Nama lengkap siswa tidak boleh kosong!');
      return;
    }
    if (!accountForm.nisn.trim()) {
      setToastMessage('⚠️ NISN siswa tidak boleh kosong!');
      return;
    }

    const updatedStudent: Student = {
      ...student,
      name: accountForm.name.trim(),
      nisn: accountForm.nisn.trim(),
      nis: student.nis || accountForm.nisn.trim(),
      gender: accountForm.gender,
      phone: accountForm.phone.trim(),
      email: accountForm.email.trim(),
      birthDate: accountForm.birthDate,
      address: accountForm.address.trim(),
      parentName: accountForm.parentName.trim(),
      parentPhone: accountForm.parentPhone.trim(),
      qrCode: `QR-STD-${accountForm.nisn.trim()}`,
    };

    if (onUpdateStudentAccount) {
      onUpdateStudentAccount(updatedStudent, {
        username: accountForm.username.trim() || accountForm.nisn.trim(),
        password: accountForm.password.trim() || undefined,
      });
    }

    setToastMessage('✅ Data akun dan profil siswa berhasil diperbarui!');
    setTimeout(() => {
      setToastMessage(null);
      setIsEditAccountOpen(false);
    }, 1500);
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsEditAccountOpen(true)}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 active:scale-95 cursor-pointer border border-indigo-400/30"
          >
            <UserCog className="w-4 h-4 text-white" />
            <span>Edit Data Akun</span>
          </button>

          <button
            onClick={() => setShowFullQr(true)}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-slate-950" />
            <span>Tampilkan QR Kartu Pelajar</span>
          </button>
        </div>
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

      {/* Pengumuman Terbaru Section for Student */}
      {announcements.length > 0 && (() => {
        const studentAnnouncements = announcements.filter(
          (a) =>
            a.targetType === 'ALL' ||
            (a.targetType === 'CLASS' &&
              (a.targetClassId === student.classId || a.targetClassName === student.className))
        );

        if (studentAnnouncements.length === 0) return null;

        return (
          <div className="bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Pengumuman Terbaru untuk Siswa</h3>
                  <p className="text-[11px] text-slate-400">
                    Pengumuman resmi dari Wali Kelas ({student.className}), Guru Agama & Sekolah
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('announcements')}
                  className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Lihat Semua ({studentAnnouncements.length}) →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studentAnnouncements.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab && onNavigateTab('announcements')}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/40 p-4 rounded-2xl space-y-2 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                      {item.category}
                    </span>
                    <span className="text-slate-400 font-mono">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                  <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Oleh: {item.authorName}</span>
                    <span className="text-blue-400 font-semibold group-hover:underline">Buka Detail →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
        <StudentCardModal
          student={student}
          schoolConfig={schoolConfig}
          onClose={() => setShowFullQr(false)}
        />
      )}

      {/* Modal Edit Data Akun Siswa */}
      {isEditAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 w-full max-w-2xl my-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">Edit Data Akun & Profil Siswa</h3>
                  <p className="text-xs text-slate-400">
                    Perbarui informasi identitas, nomor kontak, serta kata sandi akun login Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditAccountOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div className={`p-4 rounded-2xl mb-5 text-xs font-bold border flex items-center justify-between animate-fadeIn ${
                toastMessage.includes('✅')
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}>
                <span>{toastMessage}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                >
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleSaveAccountData} className="space-y-6">
              {/* Section 1: Identitas Siswa */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-white/5 pb-2">
                  <UserIcon className="w-4 h-4" />
                  <span>1. Data Identitas Utama</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountForm.name}
                      onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      NISN (Nomor Induk Siswa Nasional) *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountForm.nisn}
                      onChange={e => setAccountForm({ ...accountForm, nisn: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-amber-400 font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Masukkan NISN..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setAccountForm({ ...accountForm, gender: 'L' })}
                        className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          accountForm.gender === 'L'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Laki-Laki</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountForm({ ...accountForm, gender: 'P' })}
                        className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                          accountForm.gender === 'P'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>Perempuan</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={accountForm.birthDate}
                      onChange={e => setAccountForm({ ...accountForm, birthDate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Kontak & Alamat */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-white/5 pb-2">
                  <Phone className="w-4 h-4" />
                  <span>2. Informasi Kontak & Alamat</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      No. HP / WhatsApp Siswa
                    </label>
                    <input
                      type="tel"
                      value={accountForm.phone}
                      onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      placeholder="081234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Siswa
                    </label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="siswa@sekolah.sch.id"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Alamat Tempat Tinggal
                    </label>
                    <textarea
                      rows={2}
                      value={accountForm.address}
                      onChange={e => setAccountForm({ ...accountForm, address: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Masukkan alamat lengkap..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data Orang Tua / Wali */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-white/5 pb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Data Orang Tua / Wali</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={accountForm.parentName}
                      onChange={e => setAccountForm({ ...accountForm, parentName: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nama Ayah / Ibu / Wali..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      No. HP Orang Tua / Wali
                    </label>
                    <input
                      type="tel"
                      value={accountForm.parentPhone}
                      onChange={e => setAccountForm({ ...accountForm, parentPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      placeholder="081234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Keamanan Akun Login */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-white/5 pb-2">
                  <KeyRound className="w-4 h-4" />
                  <span>4. Keamanan Akun Login</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username Akun
                    </label>
                    <input
                      type="text"
                      value={accountForm.username}
                      onChange={e => setAccountForm({ ...accountForm, username: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      placeholder="Username login..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password / PIN Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={accountForm.password}
                        onChange={e => setAccountForm({ ...accountForm, password: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditAccountOpen(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
