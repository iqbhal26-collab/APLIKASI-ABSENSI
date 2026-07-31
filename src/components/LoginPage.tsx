import React, { useState } from 'react';
import { User, Student, UserRole, SchoolConfig, SchoolClass } from '../types';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  Lock,
  CreditCard,
  School,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Moon,
  QrCode
} from 'lucide-react';

interface LoginPageProps {
  schoolConfig: SchoolConfig;
  users: User[];
  students: Student[];
  classes?: SchoolClass[];
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  schoolConfig,
  users,
  students,
  classes = [],
  onLoginSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [inputCredential, setInputCredential] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setInputCredential('');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const credential = inputCredential.trim();

    if (!credential) {
      if (selectedRole === 'admin') {
        setErrorMessage('Masukkan password admin');
      } else if (selectedRole === 'guru') {
        setErrorMessage('Masukkan NIP guru (Nomor Induk Pegawai)');
      } else if (selectedRole === 'siswa') {
        setErrorMessage('Masukkan NISN siswa (Nomor Induk Siswa Nasional)');
      } else {
        setErrorMessage('Masukkan NISN anak/siswa untuk login Orang Tua');
      }
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. ADMIN LOGIN
      if (selectedRole === 'admin') {
        if (credential === '26') {
          const adminUser = users.find(u => u.role === 'admin') || {
            id: 'user-admin-1',
            username: 'admin',
            name: 'IQBAL PRATAMA, S.Kom., Gr.',
            role: 'admin',
            email: 'admin@sman1edukasi.sch.id',
          };
          onLoginSuccess(adminUser);
        } else {
          setErrorMessage('Password admin salah!');
          setIsLoading(false);
        }
        return;
      }

      // 2. GURU / WALI KELAS LOGIN (NIP / Username / Nama Kelas)
      if (selectedRole === 'guru') {
        const normCred = credential.toLowerCase().replace(/[^a-z0-9]/g, '');

        // a) Find teacher by user credentials or class handled
        const teacherByUser = users.find(u => {
          if (u.role !== 'guru') return false;
          const uUserNorm = u.username.toLowerCase().replace(/[^a-z0-9]/g, '');
          const uNameNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (uUserNorm.includes(normCred) || uNameNorm.includes(normCred)) return true;
          if (u.phone && u.phone.includes(credential)) return true;
          if (u.classHandled && u.classHandled.some(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, '') === normCred)) return true;
          return false;
        });

        if (teacherByUser) {
          onLoginSuccess(teacherByUser);
          return;
        }

        // b) Match class directly from classes list (e.g. XI.B2 or X IPA 1)
        const classMatch = classes.find(c => {
          const normCName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normCId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normCName === normCred || normCId === normCred || (normCred.length >= 2 && normCName.includes(normCred));
        });

        if (classMatch) {
          const teacherName = classMatch.homeroomTeacherName && classMatch.homeroomTeacherName !== 'Belum Ditentukan'
            ? classMatch.homeroomTeacherName
            : `Wali Kelas ${classMatch.name}`;

          onLoginSuccess({
            id: classMatch.homeroomTeacherId || `user-guru-${classMatch.id}`,
            username: `wali_${classMatch.id}`,
            name: teacherName,
            role: 'guru',
            email: `walikelas.${classMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sman1edukasi.sch.id`,
            classHandled: [classMatch.id, classMatch.name]
          });
          return;
        }

        // c) Match student className (e.g. XI.B2)
        const stdMatch = students.find(s => s.className && s.className.toLowerCase().replace(/[^a-z0-9]/g, '') === normCred);
        if (stdMatch && stdMatch.className) {
          onLoginSuccess({
            id: `user-guru-stdclass-${normCred}`,
            username: `wali_${normCred}`,
            name: `Wali Kelas ${stdMatch.className}`,
            role: 'guru',
            email: `walikelas.${normCred}@sman1edukasi.sch.id`,
            classHandled: [stdMatch.className, stdMatch.classId]
          });
          return;
        }

        // d) NIP or credential input >= 3 chars fallback
        if (credential.length >= 3) {
          const firstGuru = users.find(u => u.role === 'guru') || {
            id: 'user-guru-1',
            username: 'siti_guru',
            name: 'Siti Rahmawati, S.Pd',
            role: 'guru' as const,
            email: 'siti.rahmawati@sman1edukasi.sch.id',
            classHandled: ['cls-1'],
          };
          onLoginSuccess({
            ...firstGuru,
            name: `Guru (NIP / Kelas: ${credential})`,
            classHandled: [credential]
          });
        } else {
          setErrorMessage('NIP atau Kelas tidak ditemukan!');
          setIsLoading(false);
        }
        return;
      }

      // GURU PIKET LOGIN
      if (selectedRole === 'guru_piket') {
        const normCred = credential.toLowerCase().replace(/[^a-z0-9]/g, '');
        const piketUser = users.find(u => {
          if (u.role !== 'guru_piket') return false;
          const uUserNorm = u.username.toLowerCase().replace(/[^a-z0-9]/g, '');
          const uNameNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (uUserNorm.includes(normCred) || uNameNorm.includes(normCred)) return true;
          if (u.phone && u.phone.includes(credential)) return true;
          return false;
        }) || {
          id: 'user-guru-piket-1',
          username: 'piket_guru',
          name: credential ? `Guru Piket (NIP: ${credential})` : 'Guru Piket Sekolah',
          role: 'guru_piket' as const,
          email: 'piket@sman1edukasi.sch.id',
          phone: '081233445566',
        };
        onLoginSuccess(piketUser);
        return;
      }

      // GURU AGAMA LOGIN
      if (selectedRole === 'guru_agama') {
        const agamaUser = users.find(u => u.role === 'guru_agama') || {
          id: 'user-guru-agama-1',
          username: 'ustadz_ahmad',
          name: 'Ustadz Ahmad, S.Ag.',
          role: 'guru_agama' as const,
          email: 'ahmad.fauzan@sman1edukasi.sch.id',
          phone: '081299887766',
        };
        onLoginSuccess(agamaUser);
        return;
      }

      // 3. SISWA LOGIN (NISN)
      if (selectedRole === 'siswa') {
        const foundStudent = students.find(
          s => s.nisn === credential || s.nis === credential
        );

        if (foundStudent) {
          const existingUser = users.find(
            u => u.role === 'siswa' && u.studentId === foundStudent.id
          );
          if (existingUser) {
            onLoginSuccess(existingUser);
          } else {
            const studentUser: User = {
              id: `user-siswa-${foundStudent.id}`,
              username: `siswa_${foundStudent.nis}`,
              name: foundStudent.name,
              role: 'siswa',
              email: `${foundStudent.nis}@siswa.sman1.sch.id`,
              studentId: foundStudent.id,
            };
            onLoginSuccess(studentUser);
          }
        } else {
          setErrorMessage(`NISN '${credential}' tidak ditemukan di database siswa.`);
          setIsLoading(false);
        }
        return;
      }

      // 4. ORANG TUA LOGIN (NISN ANAK)
      if (selectedRole === 'orang_tua') {
        const foundStudent = students.find(
          s => s.nisn === credential || s.nis === credential
        );

        if (foundStudent) {
          const existingOrtu = users.find(
            u => u.role === 'orang_tua' && u.studentId === foundStudent.id
          );
          if (existingOrtu) {
            onLoginSuccess(existingOrtu);
          } else {
            const ortuUser: User = {
              id: `user-ortu-${foundStudent.id}`,
              username: `ortu_${foundStudent.nis}`,
              name: foundStudent.parentName || `Orang Tua (${foundStudent.name})`,
              role: 'orang_tua',
              email: `ortu.${foundStudent.nis}@gmail.com`,
              studentId: foundStudent.id,
            };
            onLoginSuccess(ortuUser);
          }
        } else {
          setErrorMessage(`NISN Anak '${credential}' tidak ditemukan.`);
          setIsLoading(false);
        }
        return;
      }
    }, 400);
  };

  const roleTabs: {
    id: UserRole;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
    activeBg: string;
    badgeColor: string;
    credentialTitle: string;
    credentialPlaceholder: string;
    credentialIcon: React.ReactNode;
    credentialType: string;
  }[] = [
    {
      id: 'admin',
      label: 'Admin',
      sublabel: 'Akses Admin',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-500/60',
      activeBg: 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/30',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      credentialTitle: 'Password Admin',
      credentialPlaceholder: 'Masukkan password admin',
      credentialIcon: <Lock className="w-4 h-4 text-purple-400" />,
      credentialType: 'password',
    },
    {
      id: 'guru',
      label: 'Wali Kelas',
      sublabel: 'Gunakan NIP',
      icon: <UserCheck className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/30 hover:border-sky-500/60',
      activeBg: 'bg-sky-500/20 border-sky-500 ring-2 ring-sky-500/30',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      credentialTitle: 'NIP Wali Kelas',
      credentialPlaceholder: 'Masukkan NIP Guru Wali Kelas',
      credentialIcon: <CreditCard className="w-4 h-4 text-sky-400" />,
      credentialType: 'text',
    },
    {
      id: 'guru_piket',
      label: 'Guru Piket',
      sublabel: 'Scan Datang & Pulang',
      icon: <QrCode className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/30 hover:border-indigo-500/60',
      activeBg: 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/30',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      credentialTitle: 'NIP / User Guru Piket',
      credentialPlaceholder: 'Masukkan NIP Guru Piket',
      credentialIcon: <CreditCard className="w-4 h-4 text-indigo-400" />,
      credentialType: 'text',
    },
    {
      id: 'guru_agama',
      label: 'Guru Agama',
      sublabel: 'Sholat Dzuhur & Jumat',
      icon: <Moon className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      activeBg: 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      credentialTitle: 'NIP / User Guru Agama',
      credentialPlaceholder: 'Masukkan NIP atau Klik Masuk (Demo)',
      credentialIcon: <CreditCard className="w-4 h-4 text-emerald-400" />,
      credentialType: 'text',
    },
    {
      id: 'siswa',
      label: 'Siswa',
      sublabel: 'Gunakan NISN',
      icon: <GraduationCap className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60',
      activeBg: 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      credentialTitle: 'NISN Siswa (Nomor Induk Siswa Nasional)',
      credentialPlaceholder: 'Masukkan NISN Siswa',
      credentialIcon: <KeyRound className="w-4 h-4 text-amber-400" />,
      credentialType: 'text',
    },
    {
      id: 'orang_tua',
      label: 'Orang Tua',
      sublabel: 'Gunakan NISN Anak',
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      activeBg: 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      credentialTitle: 'NISN Anak / Siswa',
      credentialPlaceholder: 'Masukkan NISN Anak',
      credentialIcon: <KeyRound className="w-4 h-4 text-emerald-400" />,
      credentialType: 'text',
    }
  ];

  const currentTab = roleTabs.find(t => t.id === selectedRole) || roleTabs[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/10 via-emerald-500/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-blue-500/20 overflow-hidden shrink-0">
              {schoolConfig.logoUrl ? (
                <img src={schoolConfig.logoUrl} alt={schoolConfig.schoolName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <School className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div className="text-left">
              <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                {schoolConfig.schoolName}
              </h1>
              <p className="text-[11px] text-emerald-400 font-medium">
                Portal Presensi & Kehadiran Digital
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Selamat Datang
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Silakan pilih hak akses peran dan masukkan kredensial Anda untuk masuk ke sistem presensi.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Pilih Akses Peran Login:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roleTabs.map((tab) => {
                const isActive = selectedRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleRoleChange(tab.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                      isActive ? tab.activeBg : `bg-white/5 ${tab.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {tab.icon}
                      {isActive && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white leading-tight">
                        {tab.label}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {tab.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  {currentTab.credentialIcon}
                  <span>{currentTab.credentialTitle}</span>
                </label>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${currentTab.badgeColor}`}>
                  {currentTab.label}
                </span>
              </div>

              <div className="relative">
                <input
                  type={currentTab.credentialType}
                  placeholder={currentTab.credentialPlaceholder}
                  value={inputCredential}
                  onChange={(e) => {
                    setInputCredential(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-black/50 border border-white/20 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifikasi Kredensial...</span>
              ) : (
                <>
                  <span>Masuk ke Portal Presensi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          {schoolConfig.schoolName} &bull; T.A. {schoolConfig.academicYear} {schoolConfig.semester}
        </div>
      </div>
    </div>
  );
};
