import React from 'react';
import { User, SchoolConfig } from '../types';
import {
  School,
  Bell,
  QrCode,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  Users,
  Database,
  RefreshCw,
  LogOut,
  Moon
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  schoolConfig: SchoolConfig;
  unreadNotifCount: number;
  onOpenScanner: () => void;
  onToggleNotifDrawer: () => void;
  onOpenSupabaseModal: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  schoolConfig,
  unreadNotifCount,
  onOpenScanner,
  onToggleNotifDrawer,
  onOpenSupabaseModal,
  onLogout
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin Sekolah',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-300" />
        };
      case 'guru':
        return {
          label: 'Wali Kelas',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-300" />
        };
      case 'guru_piket':
        return {
          label: 'Guru Piket',
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: <QrCode className="w-3.5 h-3.5 mr-1 text-indigo-300" />
        };
      case 'guru_agama':
        return {
          label: 'Guru Agama',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <Moon className="w-3.5 h-3.5 mr-1 text-emerald-300" />
        };
      case 'orang_tua':
        return {
          label: 'Wali Murid',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <Users className="w-3.5 h-3.5 mr-1 text-emerald-300" />
        };
      case 'siswa':
        return {
          label: 'Siswa',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <GraduationCap className="w-3.5 h-3.5 mr-1 text-amber-300" />
        };
      default:
        return {
          label: role,
          bg: 'bg-white/10 text-slate-300 border-white/10',
          icon: null
        };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 bg-white/5 backdrop-blur-2xl text-slate-100 border-b border-white/10 shadow-xl print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & School Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
              {schoolConfig.logoUrl ? (
                <img src={schoolConfig.logoUrl} alt={schoolConfig.schoolName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <School className="w-6 h-6 text-slate-950" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  {schoolConfig.schoolName}
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRESENSI REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sistem Absensi Datang, Pulang, Dzuhur & Jumat
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase Status Button */}
            <button
              onClick={onOpenSupabaseModal}
              title="Konfigurasi Database Supabase"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                schoolConfig.useSupabaseLive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/15'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{schoolConfig.useSupabaseLive ? 'Supabase Connected' : 'Supabase Setup'}</span>
            </button>

            {/* Kios Scanner Button */}
            {currentUser.role !== 'orang_tua' && (
              <button
                onClick={onOpenScanner}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span className="hidden md:inline">Scan QR Absen</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onToggleNotifDrawer}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
              title="Notifikasi Realtime"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse shadow-md shadow-rose-500/40">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Profile Badge & Logout */}
            <div className="pl-1 sm:pl-2 border-l border-white/10 flex items-center space-x-2">
              <div className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 border border-white/10">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-100 leading-tight">
                    {currentUser.name}
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${roleBadge.bg}`}>
                  {roleBadge.icon}
                  <span>{roleBadge.label}</span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all flex items-center space-x-1 cursor-pointer"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden xl:inline text-xs font-bold">Keluar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
