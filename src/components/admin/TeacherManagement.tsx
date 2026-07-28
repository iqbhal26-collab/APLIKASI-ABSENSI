import React, { useState } from 'react';
import { User, UserRole, SchoolClass } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  Moon,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  X,
  CreditCard,
  Phone,
  FileSpreadsheet
} from 'lucide-react';

interface TeacherManagementProps {
  users: User[];
  classes: SchoolClass[];
  onAddTeacher: (teacherData: { name: string; nip: string; role: 'guru_agama' | 'guru' }) => void;
  onDeleteTeacher: (id: string) => void;
  onUpdateTeacher?: (updatedUser: User) => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  users,
  classes,
  onAddTeacher,
  onDeleteTeacher,
  onUpdateTeacher
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL'); // 'ALL' | 'guru_agama' | 'guru'

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State (Simple inputs: Nama & NIP)
  const [teacherName, setTeacherName] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [teacherRole, setTeacherRole] = useState<'guru_agama' | 'guru'>('guru_agama');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter list of teacher users
  const teachers = users.filter(u => u.role === 'guru' || u.role === 'guru_agama');

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.username.includes(searchTerm) ||
      (t.phone && t.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || t.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalGuruAgama = teachers.filter(t => t.role === 'guru_agama').length;
  const totalWaliKelas = teachers.filter(t => t.role === 'guru').length;

  const handleSubmitNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      setFormError('Nama guru wajib diisi!');
      return;
    }
    if (!teacherNip.trim()) {
      setFormError('NIP (Nomor Induk Pegawai) wajib diisi!');
      return;
    }

    // Check duplicate NIP/username
    const exists = users.some(u => u.username === teacherNip.trim());
    if (exists) {
      setFormError(`Guru dengan NIP "${teacherNip.trim()}" sudah terdaftar dalam sistem.`);
      return;
    }

    setFormError(null);
    onAddTeacher({
      name: teacherName.trim(),
      nip: teacherNip.trim(),
      role: teacherRole
    });

    // Reset Form
    setTeacherName('');
    setTeacherNip('');
    setTeacherRole('guru_agama');
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setTeacherName(user.name);
    setTeacherNip(user.username);
    setTeacherRole(user.role === 'guru_agama' ? 'guru_agama' : 'guru');
    setIsEditModalOpen(true);
  };

  const handleSubmitEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!teacherName.trim() || !teacherNip.trim()) {
      setFormError('Nama dan NIP wajib diisi.');
      return;
    }

    setFormError(null);
    if (onUpdateTeacher) {
      onUpdateTeacher({
        ...editingUser,
        name: teacherName.trim(),
        username: teacherNip.trim(),
        role: teacherRole,
        phone: teacherNip.trim(),
      });
    }

    setIsEditModalOpen(false);
    setEditingUser(null);
    setTeacherName('');
    setTeacherNip('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>KELOLA DATA GURU & PENDIDIK</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Menu Manajemen Data Guru Agama & Wali Kelas
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Tambah dan kelola identitas Guru Agama serta Wali Kelas berdasarkan NIP dan Nama Pendidik untuk keperluan hak akses sistem presensi.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setTeacherName('');
            setTeacherNip('');
            setTeacherRole('guru_agama');
            setIsAddModalOpen(true);
          }}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>+ Tambah Data Guru Agama</span>
        </button>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Seluruh Guru</span>
            <div className="text-2xl font-black text-white mt-1">{teachers.length} Guru</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tercatat di Sistem</p>
          </div>
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Guru Agama</span>
            <div className="text-2xl font-black text-emerald-300 mt-1">{totalGuruAgama} Orang</div>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">Pengawas Sholat Dzuhur & Jumat</p>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Moon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Wali Kelas</span>
            <div className="text-2xl font-black text-sky-300 mt-1">{totalWaliKelas} Orang</div>
            <p className="text-[11px] text-sky-400/80 mt-0.5">Pembina Kelas SISWA</p>
          </div>
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Toolbar (Search & Filter) */}
      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nama Guru / NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-bold shrink-0">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">Semua Peran Guru ({teachers.length})</option>
            <option value="guru_agama">Guru Agama ({totalGuruAgama})</option>
            <option value="guru">Wali Kelas ({totalWaliKelas})</option>
          </select>
        </div>
      </div>

      {/* Table of Teachers */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              Daftar Guru Terdaftar
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Tampil: {filteredTeachers.length} Guru
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 text-slate-300 font-bold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5">NIP (Username)</th>
                <th className="px-4 py-3.5">Nama Guru</th>
                <th className="px-4 py-3.5">Hak Akses / Jabatan</th>
                <th className="px-4 py-3.5">Kontak / Email Auto</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Belum ada data guru sesuai pencarian. Klik "+ Tambah Data Guru Agama" untuk menambah guru baru.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isAgama = t.role === 'guru_agama';
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-emerald-300 font-bold">
                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.username}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-white text-sm">{t.name}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        {isAgama ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center space-x-1">
                            <Moon className="w-3 h-3 text-emerald-400" />
                            <span>Guru Agama (Laporan Sholat)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-flex items-center space-x-1">
                            <UserCheck className="w-3 h-3 text-sky-400" />
                            <span>Wali Kelas</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                        <div>{t.email}</div>
                        {t.phone && <div className="text-slate-500">{t.phone}</div>}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-all cursor-pointer"
                            title="Edit Data Guru"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(t.id)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-all cursor-pointer"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Teacher (Input: Nama & NIP) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Tambah Data Guru Baru</h3>
                <p className="text-xs text-slate-400">Masukkan Nama Lengkap dan NIP pendidik</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewTeacher} className="space-y-4">
              {/* Nama Guru Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Lengkap Guru <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ustadz Ahmad Fauzan, S.Ag."
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* NIP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  NIP (Nomor Induk Pegawai) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 198803152015031002"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">NIP ini digunakan juga sebagai Username saat login masuk sistem.</p>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Jabatan / Peran Hak Akses
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTeacherRole('guru_agama')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      teacherRole === 'guru_agama'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span>Guru Agama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeacherRole('guru')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      teacherRole === 'guru'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500/30'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <span>Wali Kelas</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Teacher */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Edit Data Guru</h3>
                <p className="text-xs text-slate-400">Perbarui Nama atau NIP Guru</p>
              </div>
            </div>

            <form onSubmit={handleSubmitEditTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nama Lengkap Guru
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Jabatan / Peran
                </label>
                <select
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value as 'guru_agama' | 'guru')}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="guru_agama">Guru Agama (Pemantauan Sholat)</option>
                  <option value="guru">Wali Kelas</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400 border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Konfirmasi Hapus Data Guru</h3>
            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus data guru ini dari sistem?
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteTeacher(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
