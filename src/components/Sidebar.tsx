import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Clock,
  Settings,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Bell,
  Calendar,
  CreditCard,
  Moon,
  School,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange
}) => {
  const renderNavItems = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dasbor Utama', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'teachers', label: 'Kelola Data Guru & Agama', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'classes', label: 'Kelola Kelas & Wali Kelas', icon: <School className="w-4 h-4" /> },
          { id: 'users', label: 'Kelola Pengguna & Siswa', icon: <Users className="w-4 h-4" /> },
          { id: 'student_cards', label: 'Cetak Kartu Siswa (QR)', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'activities', label: 'Jenis Kegiatan & Jam', icon: <Clock className="w-4 h-4" /> },
          { id: 'config', label: 'Konfigurasi & Supabase', icon: <Settings className="w-4 h-4" /> },
          { id: 'reports', label: 'Laporan & Ekspor Data', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ];

      case 'guru':
        return [
          { id: 'class_attendance', label: 'Presensi Kelas Hari Ini', icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: 'permits', label: 'Persetujuan Izin / Sakit', icon: <FileText className="w-4 h-4" /> },
          { id: 'reports', label: 'Rekap Absensi Kelas', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ];

      case 'guru_agama':
        return [
          { id: 'religion_report', label: 'Laporan Sholat Dzuhur & Jumat', icon: <Moon className="w-4 h-4" /> },
          { id: 'reports', label: 'Ekspor Laporan Sholat', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ];

      case 'orang_tua':
        return [
          { id: 'parent_child', label: 'Presensi Realtime Anak', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'parent_history', label: 'Riwayat & Kalender', icon: <Calendar className="w-4 h-4" /> },
          { id: 'parent_permit', label: 'Ajukan Surat Izin/Sakit', icon: <HeartHandshake className="w-4 h-4" /> },
          { id: 'notifications', label: 'Pusat Notifikasi Push', icon: <Bell className="w-4 h-4" /> },
        ];

      case 'siswa':
        return [
          { id: 'student_my', label: 'Presensi Hari Ini', icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: 'student_card', label: 'Kartu Pelajar Digital', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'student_friday', label: 'Jadwal Sholat Jumat/Dzuhur', icon: <Moon className="w-4 h-4" /> },
        ];

      default:
        return [];
    }
  };

  const navItems = renderNavItems();

  return (
    <aside className="w-full md:w-64 bg-white/5 backdrop-blur-2xl text-slate-200 border-r border-white/10 p-5 flex flex-col justify-between shrink-0 print:hidden">
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4 flex items-center justify-between">
          <span>MENU ({currentRole.toUpperCase()})</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-emerald-500/20 text-white border border-white/15 shadow-lg shadow-blue-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="w-1 h-4 bg-blue-400 rounded-full shrink-0 -ml-1 mr-0.5" />
                )}
                <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t border-white/10 text-xs text-slate-400">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-2">
          <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sistem Presensi Live</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            SMAN 2 Bulukumba
            <br />
            <span className="text-emerald-400/90 font-mono text-[10px]">Toleransi: 15 Menit</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
