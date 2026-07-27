import React from 'react';
import { PushNotification, UserRole } from '../../types';
import { Bell, X, Check, Clock, AlertCircle, CheckCircle2, Send, Sparkles } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotification[];
  currentRole: UserRole;
  currentUserId: string;
  onMarkAsRead: (id: string) => void;
  onSimulateTestNotif: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentRole,
  currentUserId,
  onMarkAsRead,
  onSimulateTestNotif
}) => {
  if (!isOpen) return null;

  // Filter notifications relevant to current user/role
  const filteredNotifs = notifications.filter((n) => {
    if (n.recipientRole === 'ALL') return true;
    if (n.recipientRole === currentRole) {
      if (n.recipientId) return n.recipientId === currentUserId;
      return true;
    }
    return true; // Show all for demo
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 text-white shadow-2xl flex flex-col border-l border-white/15">
          {/* Header */}
          <div className="p-5 bg-white/5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Notifikasi Push Realtime</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Test Push Simulator Banner */}
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="text-xs text-emerald-300 font-medium">
              Simulasi Pesan Push untuk Orang Tua
            </div>
            <button
              onClick={onSimulateTestNotif}
              className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
            >
              <Send className="w-3 h-3 text-slate-950" />
              <span>Kirim Alert Tes</span>
            </button>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">Belum ada notifikasi baru.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Notifikasi akan muncul saat siswa melakukan scan presensi atau jika ada keterlambatan.
                </p>
              </div>
            ) : (
              filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkAsRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative backdrop-blur-md ${
                    n.isRead
                      ? 'bg-white/5 border-white/10 text-slate-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 shadow-lg text-white font-medium'
                  }`}
                >
                  {!n.isRead && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}

                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      n.type === 'LATE' || n.type === 'ABSENT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {n.type === 'LATE' || n.type === 'ABSENT' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 pr-3">
                      <div className="text-xs font-bold text-white leading-tight">
                        {n.title}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{n.timestamp}</span>
                        </span>
                        {n.studentName && (
                          <span className="font-semibold text-slate-200 bg-white/10 px-2 py-0.5 rounded text-[10px] border border-white/10">
                            {n.studentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-white/5 text-center text-xs text-slate-400">
            Sistem notifikasi real-time terintegrasi WhatsApp / Push Notification HP Wali Murid.
          </div>
        </div>
      </div>
    </div>
  );
};
