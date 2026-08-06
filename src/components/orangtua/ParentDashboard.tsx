import React, { useState } from 'react';
import { Student, AttendanceRecord, ActivityType, PermitSubmission, PushNotification, Announcement } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  Moon,
  AlertCircle,
  HeartHandshake,
  FileSpreadsheet,
  Calendar,
  Send,
  Bell,
  Sparkles,
  PhoneCall,
  Upload,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Eye,
  Check,
  FileCheck,
  Megaphone
} from 'lucide-react';

interface ParentDashboardProps {
  linkedStudent: Student;
  records: AttendanceRecord[];
  activities: ActivityType[];
  permits: PermitSubmission[];
  notifications: PushNotification[];
  announcements?: Announcement[];
  onNavigateTab?: (tab: string) => void;
  onSubmitPermit: (permit: Omit<PermitSubmission, 'id' | 'createdAt' | 'status'>) => void;
  onOpenExportModal: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  linkedStudent,
  records,
  activities,
  permits,
  notifications,
  announcements = [],
  onNavigateTab,
  onSubmitPermit,
  onOpenExportModal
}) => {
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [permitType, setPermitType] = useState<'sakit' | 'izin'>('sakit');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentFileName, setAttachmentFileName] = useState<string>('');
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.studentId === linkedStudent.id && r.date === todayStr);

  const myNotifications = notifications.filter(n => {
    if (n.studentName) {
      return n.studentName.toLowerCase().trim() === linkedStudent.name.toLowerCase().trim();
    }
    if (n.recipientId) {
      return n.recipientId === linkedStudent.id || n.recipientId === linkedStudent.parentId;
    }
    return n.recipientRole === 'orang_tua' || n.recipientRole === 'ALL';
  });

  const myPermits = permits.filter(
    p => p.studentId === linkedStudent.id || p.studentName === linkedStudent.name
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 5MB.');
      return;
    }

    setAttachmentFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePermitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    onSubmitPermit({
      studentId: linkedStudent.id,
      studentName: linkedStudent.name,
      className: linkedStudent.className,
      parentId: linkedStudent.parentId,
      parentName: linkedStudent.parentName,
      type: permitType,
      startDate,
      endDate,
      reason,
      attachmentUrl: attachmentUrl || undefined
    });

    setReason('');
    setAttachmentUrl('');
    setAttachmentFileName('');
    setIsPermitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>PORTAL WALI MURID REALTIME</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Memantau Ananda: {linkedStudent.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Kelas: <strong>{linkedStudent.className}</strong> | NISN: <span className="font-mono text-emerald-400">{linkedStudent.nisn}</span> | Wali Murid: <strong>{linkedStudent.parentName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPermitModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
          >
            <HeartHandshake className="w-4 h-4 text-slate-950" />
            <span>Ajukan Surat Izin / Sakit</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl border border-white/10 transition-colors"
            title="Download Rekap Absensi Bulanan"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Pengumuman Sekolah Section for Parents */}
      {announcements.length > 0 && (() => {
        const parentAnnouncements = announcements.filter(
          (a) =>
            a.targetType === 'ALL' ||
            (a.targetType === 'CLASS' &&
              (a.targetClassId === linkedStudent.classId || a.targetClassName === linkedStudent.className))
        );

        if (parentAnnouncements.length === 0) return null;

        return (
          <div className="bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Pengumuman Terbaru untuk Orang Tua Wali</h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi penting dari Wali Kelas ({linkedStudent.className}), Guru Agama & Sekolah
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('announcements')}
                  className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Buka Pengumuman ({parentAnnouncements.length}) →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parentAnnouncements.slice(0, 2).map((item) => (
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
                    <span>Penulis: {item.authorName}</span>
                    <span className="text-blue-400 font-semibold group-hover:underline">Baca Selengkapnya →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Today's Activity Progress Steps */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="font-bold text-white text-base">Timeline Kehadiran Ananda Hari Ini</h3>
            <p className="text-xs text-slate-400">
              Pantau kepatuhan jam kedatangan, sholat berjamaah, dan jam kepulangan
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
            {todayStr}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activities.map((act) => {
            const rec = todayRecords.find(r => r.activityCode === act.code);
            const isCompleted = !!rec && (rec.status === 'hadir' || rec.status === 'terlambat');
            const isLate = rec?.status === 'terlambat';
            const isPermit = rec?.status === 'sakit' || rec?.status === 'izin';
            const isAbsent = rec?.status === 'alpa';

            // Check male Friday prayer logic
            const isFridayMaleAct = act.code === 'JUMAT';
            const isFemaleExempt = isFridayMaleAct && linkedStudent.gender === 'P';

            return (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isFemaleExempt
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : isCompleted
                    ? isLate
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : isPermit
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : isAbsent
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                    {act.code}
                  </span>
                  {isFemaleExempt ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      Khusus Siswa Laki-laki
                    </span>
                  ) : isCompleted ? (
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                      isLate ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {isLate ? 'TERLAMBAT' : 'HADIR'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      BELUM PRESENSI
                    </span>
                  )}
                </div>

                <div className="mt-3 font-bold text-sm text-white">
                  {act.name}
                </div>

                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Jadwal: {act.startTime} - {act.endTime}
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Waktu Scan:</span>
                  <span className="font-mono text-white">
                    {rec ? rec.time : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History of Submitted Permits */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">Riwayat Pengajuan Surat Izin / Sakit Ananda</h3>
          </div>
          <button
            onClick={() => setIsPermitModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-950" />
            <span>+ Ajukan Baru</span>
          </button>
        </div>

        <div className="space-y-3">
          {myPermits.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada riwayat pengajuan surat izin atau sakit.
            </p>
          ) : (
            myPermits.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      p.type === 'sakit'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      IZIN {p.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : p.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {p.status === 'approved' ? 'DISETUJUI' : p.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU WALI KELAS'}
                    </span>
                  </div>

                  <p className="text-white font-medium mt-1">
                    "{p.reason}"
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono pt-0.5">
                    <span>Periode: {p.startDate} s/d {p.endDate}</span>
                    <span>•</span>
                    <span>Diajukan: {p.createdAt}</span>
                  </div>
                </div>

                {p.attachmentUrl && (
                  <button
                    onClick={() => setPreviewAttachmentUrl(p.attachmentUrl || null)}
                    className="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-sky-300" />
                    <span>Lihat Berkas</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Push Alert Feed */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <Bell className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base">Notifikasi Push Realtime ke HP Wali Murid</h3>
        </div>

        <div className="space-y-3">
          {myNotifications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada pesan notifikasi baru.
            </p>
          ) : (
            myNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3 text-xs"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {notif.title}
                  </div>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    {notif.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Permit Modal */}
      {isPermitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/15 w-full max-w-lg overflow-hidden text-white">
            <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
              <h3 className="font-bold text-base">Ajukan Surat Izin / Sakit Ananda</h3>
              <button
                onClick={() => setIsPermitModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePermitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jenis Pengajuan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPermitType('sakit')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      permitType === 'sakit'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Izin Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermitType('izin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      permitType === 'izin'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Izin Keperluan Keluarga / Resmi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Selesai:
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alasan Lengkap / Keterangan:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Ananda mengalami gejala demam dan berobat ke klinik terdekat..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Upload Berkas Pendukung */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Berkas Pendukung (Surat Dokter / Foto Surat Izin):
                </label>
                {attachmentUrl ? (
                  <div className="p-3 bg-white/5 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs truncate">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-medium truncate">
                        {attachmentFileName || 'Berkas_Pendukung_Izin.png'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachmentUrl(attachmentUrl)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-sky-300" />
                        <span>Pratinjau</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentUrl('');
                          setAttachmentFileName('');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Hapus Berkas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 bg-black/30 hover:bg-black/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs text-slate-200 font-semibold">
                      Klik untuk Pilih Berkas / Ambil Foto Surat
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Format: PNG, JPG, PDF, atau DOCX (Maks 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPermitModalOpen(false)}
                  className="px-4 py-2 text-slate-300 text-xs font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Permohonan ke Wali Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Attachment Image / Document */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span>Berkas Pendukung Surat Izin</span>
              </div>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center rounded-2xl bg-black/50 p-2 border border-white/10">
              {previewAttachmentUrl.startsWith('data:image') || previewAttachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <img
                  src={previewAttachmentUrl}
                  alt="Berkas Pendukung Surat Dokter / Izin"
                  className="max-h-[60vh] object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText className="w-12 h-12 text-sky-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    Dokumen / Berkas Terlampir
                  </p>
                  <a
                    href={previewAttachmentUrl}
                    download="Berkas_Pendukung_Izin"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    <span>Unduh / Buka Dokumen</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
