import React, { useState } from 'react';
import { SchoolClass, User, Student } from '../../types';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { downloadTeacherTemplate } from '../../lib/excelTemplates';

interface ClassManagementProps {
  classes: SchoolClass[];
  users: User[];
  students: Student[];
  onSaveClass: (updatedClass: SchoolClass, oldClassName?: string) => void;
  onDeleteClass: (classId: string) => void;
  onOpenExcelImportModal?: () => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  users,
  students,
  onSaveClass,
  onDeleteClass,
  onOpenExcelImportModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedMajor, setSelectedMajor] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  // Form State
  const [classNameInput, setClassNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState<'X' | 'XI' | 'XII'>('X');
  const [majorInput, setMajorInput] = useState<'IPA' | 'IPS' | 'BAHASA' | 'UMUM'>('IPA');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [customTeacherName, setCustomTeacherName] = useState('');

  // Delete Confirmation State
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // List of teachers (Guru) from users
  const teachers = users.filter(u => u.role === 'guru');

  // Filtered classes
  const filteredClasses = classes.filter(cls => {
    const matchSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.homeroomTeacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === 'ALL' || cls.grade === selectedGrade;
    const matchMajor = selectedMajor === 'ALL' || cls.major === selectedMajor;
    return matchSearch && matchGrade && matchMajor;
  });

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setClassNameInput('');
    setGradeInput('X');
    setMajorInput('IPA');
    setHomeroomTeacherId(teachers[0]?.id || '');
    setCustomTeacherName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cls: SchoolClass) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setGradeInput(cls.grade);
    setMajorInput(cls.major);
    setHomeroomTeacherId(cls.homeroomTeacherId);
    setCustomTeacherName(cls.homeroomTeacherId ? '' : cls.homeroomTeacherName);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    let selectedTeacherName = '';
    let selectedTeacherId = '';

    if (homeroomTeacherId === 'CUSTOM') {
      selectedTeacherName = customTeacherName.trim() || 'Belum Ditentukan';
      selectedTeacherId = '';
    } else if (homeroomTeacherId) {
      const foundTeacher = teachers.find(t => t.id === homeroomTeacherId);
      selectedTeacherName = foundTeacher ? foundTeacher.name : 'Belum Ditentukan';
      selectedTeacherId = homeroomTeacherId;
    } else {
      selectedTeacherName = 'Belum Ditentukan';
      selectedTeacherId = '';
    }

    // Count actual students in this class
    const currentStudentCount = students.filter(
      s => s.classId === (editingClass?.id || '') || s.className === classNameInput.trim()
    ).length;

    const newOrUpdatedClass: SchoolClass = {
      id: editingClass ? editingClass.id : `cls-${Date.now()}`,
      name: classNameInput.trim(),
      grade: gradeInput,
      major: majorInput,
      homeroomTeacherId: selectedTeacherId,
      homeroomTeacherName: selectedTeacherName,
      studentCount: editingClass ? Math.max(editingClass.studentCount, currentStudentCount) : currentStudentCount,
    };

    onSaveClass(newOrUpdatedClass, editingClass?.name);
    setIsModalOpen(false);
  };

  const confirmDelete = (classId: string) => {
    onDeleteClass(classId);
    setDeletingClassId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Kelola Nama Kelas & Wali Kelas</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Atur daftar rombel (rombongan belajar), tingkat kelas, jurusan, dan penugasan Wali Kelas (Guru).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenExcelImportModal && (
            <button
              onClick={onOpenExcelImportModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Import Wali Kelas (Excel)</span>
            </button>
          )}

          <button
            onClick={() => downloadTeacherTemplate()}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="Unduh Format Template Excel Wali Kelas"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Template Wali Kelas</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Kelas Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama Kelas atau Nama Wali Kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 shadow-sm"
          />
        </div>

        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Tingkat (X, XI, XII)</option>
            <option value="X">Tingkat X (Kelas 10)</option>
            <option value="XI">Tingkat XI (Kelas 11)</option>
            <option value="XII">Tingkat XII (Kelas 12)</option>
          </select>
        </div>

        <div>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Jurusan</option>
            <option value="IPA">MIPA / IPA</option>
            <option value="IPS">IPS / Sosial</option>
            <option value="BAHASA">Bahasa & Budaya</option>
            <option value="UMUM">Umum / Reguler</option>
          </select>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <School className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold">Tidak ada kelas yang sesuai dengan filter pencarian.</p>
            <p className="text-xs text-slate-500">Silakan ubah kata kunci atau klik "Tambah Kelas Baru".</p>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            // Live student count
            const actualStudentCount = students.filter(
              s => s.classId === cls.id || s.className === cls.name
            ).length;
            const displayStudentCount = Math.max(cls.studentCount, actualStudentCount);

            return (
              <div
                key={cls.id}
                className="bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 backdrop-blur-md transition-all flex flex-col justify-between space-y-4 group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                        Tingkat {cls.grade} &bull; {cls.major}
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                        {cls.name}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 text-xs font-semibold text-slate-300">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      <span>{displayStudentCount} Siswa</span>
                    </div>
                  </div>

                  {/* Homeroom Teacher Details */}
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1">
                    <div className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Wali Kelas:</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 pl-5">
                      {cls.homeroomTeacherName || 'Belum Ditentukan'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenEditModal(cls)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-all font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Kelas / Wali</span>
                  </button>

                  <button
                    onClick={() => setDeletingClassId(cls.id)}
                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-all"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL ADD / EDIT CLASS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <School className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {editingClass ? 'Edit Nama Kelas & Wali Kelas' : 'Tambah Kelas Baru'}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nama Kelas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: X IPA 1, XI IPS 2, XII BAHASA 1"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tingkat (Grade)
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="X">Tingkat X (10)</option>
                    <option value="XI">Tingkat XI (11)</option>
                    <option value="XII">Tingkat XII (12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Jurusan / Program
                  </label>
                  <select
                    value={majorInput}
                    onChange={(e) => setMajorInput(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="IPA">IPA / MIPA</option>
                    <option value="IPS">IPS / Sosum</option>
                    <option value="BAHASA">Bahasa & Budaya</option>
                    <option value="UMUM">Umum / Reguler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Wali Kelas (Pilih Guru)
                </label>
                <select
                  value={homeroomTeacherId}
                  onChange={(e) => setHomeroomTeacherId(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.phone ? `(${t.phone})` : ''}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Tulis Manual Nama Wali Kelas</option>
                </select>
              </div>

              {homeroomTeacherId === 'CUSTOM' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nama Wali Kelas (Manual)
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap beserta gelar..."
                    value={customTeacherName}
                    onChange={(e) => setCustomTeacherName(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Konfirmasi Hapus Kelas</h3>
            </div>
            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus kelas ini?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingClassId(null)}
                className="px-4 py-2 bg-white/10 text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => confirmDelete(deletingClassId)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20"
              >
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
