import React, { useState } from 'react';
import { Student, SchoolClass, Gender } from '../../types';
import { Search, Plus, UserPlus, Filter, Trash2, Edit, GraduationCap, Phone, QrCode } from 'lucide-react';

interface UserManagementProps {
  students: Student[];
  classes: SchoolClass[];
  onAddStudent: (student: Omit<Student, 'id' | 'qrCode'>) => void;
  onDeleteStudent: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  students,
  classes,
  onAddStudent,
  onDeleteStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      s.nisn.includes(searchTerm) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    return matchSearch && matchClass;
  });

  const handleSubmitNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nis || !nisn) return;

    const selectedCls = classes.find(c => c.id === classId);
    onAddStudent({
      nis,
      nisn,
      name,
      gender,
      classId,
      className: selectedCls?.name || 'X IPA 1',
      parentId: `user-ortu-${Date.now()}`,
      parentName: parentName || 'Orang Tua Siswa',
      parentPhone: parentPhone || '081200000000',
    });

    // Reset
    setNis('');
    setNisn('');
    setName('');
    setParentName('');
    setParentPhone('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white">Kelola Data Siswa & Wali Murid</h2>
          <p className="text-xs text-slate-300 mt-1">
            Daftar lengkap seluruh siswa SMA beserta data NIS, NISN, Kelas, dan kontak Orang Tua.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama Siswa, NIS, NISN, atau Nama Orang Tua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 shadow-sm"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 shadow-sm"
          >
            <option value="ALL">Semua Rombongan Belajar / Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name} ({c.studentCount} Siswa)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/10 text-slate-200 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5">NIS / NISN</th>
                <th className="px-4 py-3.5">Nama Lengkap Siswa</th>
                <th className="px-4 py-3.5">Gender</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">Orang Tua / Wali</th>
                <th className="px-4 py-3.5">No. WhatsApp / HP</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-200">
                      <div>{std.nis}</div>
                      <div className="text-[10px] text-slate-400">{std.nisn}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{std.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        std.gender === 'L'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                      }`}>
                        {std.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {std.className}
                    </td>

                    <td className="px-4 py-3.5 text-slate-200">
                      {std.parentName}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{std.parentPhone}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => onDeleteStudent(std.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/15 w-full max-w-lg overflow-hidden text-white">
            <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
              <h3 className="font-bold text-base">Tambah Siswa Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitNewStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NIS (Nomor Induk Siswa):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="23241010"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NISN:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0078921010"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ahmad Fauzan Putera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jenis Kelamin:
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="L">Laki-Laki (Ikut Sholat Jumat)</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kelas:
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Data Orang Tua / Wali Murid (Penerima Notifikasi)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Orang Tua:
                    </label>
                    <input
                      type="text"
                      placeholder="Bpk. Hendra"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      No WhatsApp:
                    </label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-300 text-xs font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
