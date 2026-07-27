import React from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserCheck, Users, GraduationCap, X, Check } from 'lucide-react';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser
}) => {
  if (!isOpen) return null;

  const roleConfigs: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      role: 'admin',
      title: 'Administrator Sekolah',
      desc: 'Mencetak kartu siswa, mengelola data pengguna, konfigurasi kegiatan, cetak laporan & sistem.',
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/10',
    },
    {
      role: 'guru',
      title: 'Guru / Wali Kelas',
      desc: 'Memeriksa kehadiran siswa per kelas per kegiatan, validasi pengajuan izin/sakit & rekap kelas.',
      icon: <UserCheck className="w-6 h-6 text-sky-400" />,
      color: 'border-sky-500/30 hover:border-sky-500 bg-sky-500/10',
    },
    {
      role: 'orang_tua',
      title: 'Orang Tua / Wali Murid',
      desc: 'Memantau jam datang, sholat dzuhur, jumat & jam pulang anak secara realtime + notifikasi push.',
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10',
    },
    {
      role: 'siswa',
      title: 'Siswa / Siswi',
      desc: 'Melihat status presensi harian, kartu QR digital untuk scanner, dan checklist sholat jumat/dzuhur.',
      icon: <GraduationCap className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500 bg-amber-500/10',
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold">Simulasi Multi-Login Hak Akses</h3>
            <p className="text-xs text-slate-300">
              Pilih salah satu akun demo di bawah untuk menguji fitur dengan hak akses berbeda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Roles */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {roleConfigs.map((cfg) => {
            const userForRole = users.find(u => u.role === cfg.role);
            const isSelected = currentUser.id === userForRole?.id;

            return (
              <div
                key={cfg.role}
                onClick={() => {
                  if (userForRole) {
                    onSelectUser(userForRole);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex items-start space-x-4 backdrop-blur-md ${cfg.color} ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' : ''
                }`}
              >
                <div className="p-3 rounded-xl bg-black/40 shadow-sm border border-white/10 shrink-0">
                  {cfg.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {cfg.title}
                    </h4>
                    {isSelected && (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Akun Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {cfg.desc}
                  </p>

                  {userForRole && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span>Nama Demo: <strong className="text-white">{userForRole.name}</strong></span>
                      <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/10 text-slate-300">
                        @{userForRole.username}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/5 p-4 border-t border-white/10 text-center text-xs text-slate-400">
          Hak akses otomatis disesuaikan sesuai regulasi sekolah SMA. Anda dapat berganti akun kapan saja dari menu utama.
        </div>
      </div>
    </div>
  );
};
