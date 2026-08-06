import React, { useState } from 'react';
import { User, SchoolClass, Student, Announcement } from '../../types';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  User as UserIcon,
  Tag,
  Trash2,
  X,
  Send,
  School,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Sparkles,
  BookOpen,
  Moon,
  MessageSquare
} from 'lucide-react';

interface AnnouncementsViewProps {
  currentUser: User;
  announcements: Announcement[];
  classes: SchoolClass[];
  students: Student[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'date'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onTogglePinAnnouncement: (id: string) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  currentUser,
  announcements,
  classes,
  students,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onTogglePinAnnouncement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Determine managed classes for Wali Kelas
  const teacherClasses = classes.filter(
    (c) =>
      c.homeroomTeacherId === currentUser.id ||
      c.homeroomTeacherName === currentUser.name ||
      (currentUser.classHandled &&
        (currentUser.classHandled.includes(c.id) || currentUser.classHandled.includes(c.name)))
  );

  // Determine student's class for Siswa / Orang Tua
  let userStudent: Student | undefined;
  if (currentUser.role === 'siswa' || currentUser.role === 'orang_tua') {
    userStudent = students.find(
      (s) =>
        s.id === currentUser.studentId ||
        (currentUser.phone && (s.parentPhone === currentUser.phone || s.phone === currentUser.phone))
    ) || students[0];
  }

  // Permission check for creation
  const canCreate =
    currentUser.role === 'admin' ||
    currentUser.role === 'guru' ||
    currentUser.role === 'guru_agama' ||
    currentUser.role === 'guru_piket';

  // Modal Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<Announcement['category']>('Informasi Umum');
  const [formTargetType, setFormTargetType] = useState<'ALL' | 'CLASS'>(
    currentUser.role === 'guru' ? 'CLASS' : 'ALL'
  );
  const [formTargetClassId, setFormTargetClassId] = useState<string>(
    teacherClasses.length > 0 ? teacherClasses[0].id : classes[0]?.id || ''
  );
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Filter announcements for current user
  const visibleAnnouncements = announcements.filter((a) => {
    // 1. Target scope filtering
    if (currentUser.role === 'siswa' || currentUser.role === 'orang_tua') {
      const studentClassId = userStudent?.classId;
      const studentClassName = userStudent?.className;
      
      const isTargetedToMe =
        a.targetType === 'ALL' ||
        (a.targetType === 'CLASS' &&
          ((studentClassId && a.targetClassId === studentClassId) ||
            (studentClassName && a.targetClassName === studentClassName)));

      if (!isTargetedToMe) return false;
    }

    // 2. Search filtering
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Category filtering
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Sort: Pinned first, then newest
  const sortedAnnouncements = [...visibleAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Judul dan isi pengumuman wajib diisi!');
      return;
    }

    let targetClassName = undefined;
    if (formTargetType === 'CLASS') {
      const targetCls = classes.find((c) => c.id === formTargetClassId);
      targetClassName = targetCls?.name;
    }

    onAddAnnouncement({
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      targetType: formTargetType,
      targetClassId: formTargetType === 'CLASS' ? formTargetClassId : undefined,
      targetClassName: formTargetType === 'CLASS' ? targetClassName : undefined,
      isPinned: formIsPinned,
    });

    // Reset form
    setFormTitle('');
    setFormContent('');
    setFormCategory('Informasi Umum');
    setFormIsPinned(false);
    setIsCreateModalOpen(false);
  };

  const getCategoryBadge = (category: Announcement['category']) => {
    switch (category) {
      case 'PENTING':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Keagamaan':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Akademik':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Kegiatan':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: Announcement['category']) => {
    switch (category) {
      case 'PENTING':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'Keagamaan':
        return <Moon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Akademik':
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      case 'Kegiatan':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Megaphone className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-emerald-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Megaphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Papan Informasi & Pengumuman Sekolah</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Pengumuman Resmi SMAN 2 Bulukumba
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Informasi terkini kegiatan akademik, keagamaan, serta pengumuman khusus kelas dari
              Wali Kelas, Guru Agama, dan Pentadbir Sekolah.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2.5 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Scope Context Notice for Roles */}
      {currentUser.role === 'guru' && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Mode Wali Kelas</span>
              <span>
                Anda dapat membuat pengumuman khusus untuk siswa kelas bimbingan Anda (
                {teacherClasses.map((c) => c.name).join(', ') || 'Anak Wali'}).
              </span>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'guru_agama' && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Mode Guru Agama</span>
              <span>
                Anda dapat mengirim pengumuman kegiatan sholat Dzuhur/Jumat & pembinaan keagamaan untuk seluruh siswa.
              </span>
            </div>
          </div>
        </div>
      )}

      {(currentUser.role === 'siswa' || currentUser.role === 'orang_tua') && userStudent && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Menampilkan Pengumuman untuk {userStudent.name} ({userStudent.className})
              </span>
              <span>
                Mencakup pengumuman sekolah umum & pengumuman khusus wali kelas {userStudent.className}.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'PENTING', 'Akademik', 'Keagamaan', 'Kegiatan', 'Informasi Umum'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcement Cards List */}
      {sortedAnnouncements.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-white/10">
            <Megaphone className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Belum Ada Pengumuman</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'ALL'
                ? 'Tidak ada pengumuman yang sesuai dengan filter atau kata kunci pencarian Anda.'
                : 'Belum ada pengumuman yang diterbitkan untuk kategori dan kelas Anda saat ini.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`relative overflow-hidden bg-white/5 backdrop-blur-xl border rounded-3xl p-6 transition-all hover:border-white/20 ${
                item.isPinned
                  ? 'border-amber-500/40 shadow-xl shadow-amber-500/5 bg-gradient-to-r from-amber-500/10 via-white/5 to-white/5'
                  : 'border-white/10'
              }`}
            >
              {item.isPinned && (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded-bl-xl flex items-center space-x-1 shadow-md">
                  <Pin className="w-3 h-3 fill-slate-950" />
                  <span>DIPIN / PENTING</span>
                </div>
              )}

              <div className="flex flex-col space-y-4">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category badge */}
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getCategoryBadge(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                      <span>{item.category}</span>
                    </span>

                    {/* Target scope badge */}
                    {item.targetType === 'ALL' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[11px] font-semibold">
                        <UsersIcon className="w-3 h-3 text-slate-400" />
                        <span>Untuk Semua Siswa</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                        <School className="w-3 h-3 text-indigo-400" />
                        <span>Khusus Kelas: {item.targetClassName || 'Wali Kelas'}</span>
                      </span>
                    )}
                  </div>

                  {/* Author & Date */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-slate-200">{item.authorName}</span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {item.authorRole.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white leading-snug">{item.title}</h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
                    {item.content}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAnnouncement(item)}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Baca Selengkapnya</span>
                  </button>

                  {/* Creator / Admin Controls */}
                  {(currentUser.role === 'admin' || currentUser.id === item.authorId) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onTogglePinAnnouncement(item.id)}
                        title={item.isPinned ? 'Lepas Pin' : 'Sematkan Pengumuman'}
                        className={`p-2 rounded-xl text-xs transition-colors border cursor-pointer ${
                          item.isPinned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
                            onDeleteAnnouncement(item.id);
                          }
                        }}
                        title="Hapus Pengumuman"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Announcement */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getCategoryBadge(
                    selectedAnnouncement.category
                  )}`}
                >
                  {getCategoryIcon(selectedAnnouncement.category)}
                  <span>{selectedAnnouncement.category}</span>
                </span>

                {selectedAnnouncement.targetType === 'ALL' ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[11px] font-semibold">
                    <UsersIcon className="w-3 h-3 text-slate-400" />
                    <span>Untuk Semua Siswa & Orang Tua</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                    <School className="w-3 h-3 text-indigo-400" />
                    <span>Khusus Kelas: {selectedAnnouncement.targetClassName || 'Wali Kelas'}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                {selectedAnnouncement.title}
              </h2>

              <div className="flex items-center space-x-3 text-xs text-slate-400 border-y border-white/10 py-3">
                <div className="flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-slate-200">
                    {selectedAnnouncement.authorName}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedAnnouncement.authorRole.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diterbitkan: {selectedAnnouncement.date}</span>
                </div>
              </div>

              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-white/5 p-5 rounded-2xl border border-white/5">
                {selectedAnnouncement.content}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Announcement */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Buat Pengumuman Baru</h3>
                  <p className="text-xs text-slate-400">
                    Diterbitkan oleh: {currentUser.name} ({currentUser.role.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Judul */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Informasi Kegiatan Sholat Dzuhur / Pertemuan Orang Tua"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Announcement['category'])}
                  className="w-full bg-[#1e293b] border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all"
                >
                  <option value="Informasi Umum">Informasi Umum</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Keagamaan">Keagamaan</option>
                  <option value="Kegiatan">Kegiatan Sekolah</option>
                  <option value="PENTING">PENTING / Mendesak</option>
                </select>
              </div>

              {/* Target Scope Selection */}
              <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-slate-200 block">Target Sasaran Pengumuman</label>

                {/* If role is Wali Kelas ('guru') */}
                {currentUser.role === 'guru' ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-blue-300">
                      Sebagai Wali Kelas, Anda dapat mengirim pengumuman langsung ke anak wali kelas Anda:
                    </p>
                    {teacherClasses.length > 0 ? (
                      <select
                        value={formTargetClassId}
                        onChange={(e) => {
                          setFormTargetType('CLASS');
                          setFormTargetClassId(e.target.value);
                        }}
                        className="w-full bg-[#1e293b] border border-blue-500/40 focus:border-blue-400 rounded-xl px-4 py-2 text-xs text-white outline-none"
                      >
                        {teacherClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            🏫 Kelas Wali: {cls.name} ({cls.studentCount || 0} Siswa)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={formTargetClassId}
                        onChange={(e) => {
                          setFormTargetType('CLASS');
                          setFormTargetClassId(e.target.value);
                        }}
                        className="w-full bg-[#1e293b] border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2 text-xs text-white outline-none"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            🏫 Kelas: {cls.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  /* Admin, Guru Agama, Guru Piket */
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="inline-flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          value="ALL"
                          checked={formTargetType === 'ALL'}
                          onChange={() => setFormTargetType('ALL')}
                          className="text-blue-500 focus:ring-0"
                        />
                        <span>Semua Siswa & Orang Tua (Semua Kelas)</span>
                      </label>

                      <label className="inline-flex items-center space-x-2 text-xs text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          value="CLASS"
                          checked={formTargetType === 'CLASS'}
                          onChange={() => setFormTargetType('CLASS')}
                          className="text-blue-500 focus:ring-0"
                        />
                        <span>Pilih Kelas Tertentu</span>
                      </label>
                    </div>

                    {formTargetType === 'CLASS' && (
                      <select
                        value={formTargetClassId}
                        onChange={(e) => setFormTargetClassId(e.target.value)}
                        className="w-full bg-[#1e293b] border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2 text-xs text-white outline-none"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            🏫 Kelas {cls.name} (Wali: {cls.homeroomTeacherName || '-'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Isi Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Isi Pengumuman</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tuliskan detail informasi pengumuman secara lengkap..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-amber-500 focus:ring-0 bg-white/5 cursor-pointer"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-amber-300 cursor-pointer">
                  Sematkan di bagian atas (Pin Pengumuman Penting)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Terbitkan Pengumuman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper internal component for Users icon
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
