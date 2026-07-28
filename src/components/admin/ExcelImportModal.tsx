import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  GraduationCap,
  School,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  downloadStudentTemplate,
  downloadTeacherTemplate,
  parseExcelData,
  normalizeStudentImportRows,
  normalizeTeacherImportRows,
  ParsedStudentRow,
  ParsedTeacherRow
} from '../../lib/excelTemplates';
import { SchoolClass } from '../../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  onImportStudents: (students: ParsedStudentRow[], autoCreateClasses: boolean) => void;
  onImportTeachers: (teachers: ParsedTeacherRow[], autoCreateClasses: boolean) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportStudents,
  onImportTeachers
}) => {
  const [activeType, setActiveType] = useState<'students' | 'teachers'>('students');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed state
  const [parsedStudents, setParsedStudents] = useState<ParsedStudentRow[]>([]);
  const [parsedTeachers, setParsedTeachers] = useState<ParsedTeacherRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Options
  const [autoCreateClasses, setAutoCreateClasses] = useState(true);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const rawJson = await parseExcelData(selectedFile);
      if (!rawJson || rawJson.length === 0) {
        setParseError('File Excel kosong atau tidak terbaca data di Sheet pertama.');
        setIsParsing(false);
        return;
      }

      if (activeType === 'students') {
        const existingCounts: Record<string, number> = {};
        classes.forEach(c => {
          existingCounts[c.name.toLowerCase().trim()] = c.studentCount || 0;
        });
        const normalized = normalizeStudentImportRows(rawJson, existingCounts);
        setParsedStudents(normalized);
        // Select all valid rows by default
        const validSet = new Set<number>();
        normalized.forEach((row, idx) => {
          if (row.isValid) validSet.add(idx);
        });
        setSelectedIndices(validSet);
      } else {
        const normalized = normalizeTeacherImportRows(rawJson);
        setParsedTeachers(normalized);
        const validSet = new Set<number>();
        normalized.forEach((row, idx) => {
          if (row.isValid) validSet.add(idx);
        });
        setSelectedIndices(validSet);
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setParseError(`Gagal membaca file Excel: ${err?.message || 'Format file tidak didukung.'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (activeType === 'students') {
      if (checked) {
        const allIdx = new Set<number>();
        parsedStudents.forEach((row, idx) => {
          if (row.isValid) allIdx.add(idx);
        });
        setSelectedIndices(allIdx);
      } else {
        setSelectedIndices(new Set());
      }
    } else {
      if (checked) {
        const allIdx = new Set<number>();
        parsedTeachers.forEach((row, idx) => {
          if (row.isValid) allIdx.add(idx);
        });
        setSelectedIndices(allIdx);
      } else {
        setSelectedIndices(new Set());
      }
    }
  };

  const handleToggleRow = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleExecuteImport = () => {
    if (activeType === 'students') {
      const selectedStudents = parsedStudents.filter((_, idx) => selectedIndices.has(idx));
      if (selectedStudents.length === 0) {
        alert('Silakan pilih minimal 1 baris data siswa yang valid untuk diimport.');
        return;
      }
      onImportStudents(selectedStudents, autoCreateClasses);
    } else {
      const selectedTeachers = parsedTeachers.filter((_, idx) => selectedIndices.has(idx));
      if (selectedTeachers.length === 0) {
        alert('Silakan pilih minimal 1 baris data wali kelas/guru yang valid untuk diimport.');
        return;
      }
      onImportTeachers(selectedTeachers, autoCreateClasses);
    }

    // Reset and close
    setFile(null);
    setParsedStudents([]);
    setParsedTeachers([]);
    setSelectedIndices(new Set());
    onClose();
  };

  const currentCount = activeType === 'students' ? parsedStudents.length : parsedTeachers.length;
  const validCount = activeType === 'students'
    ? parsedStudents.filter(s => s.isValid).length
    : parsedTeachers.filter(t => t.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/15 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Pusat Import Data File Excel (.xlsx)</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold">
                  Otomatis Synced
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Unggah file Excel untuk memasukkan data siswa dan wali kelas secara massal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector & Template Downloads */}
        <div className="bg-black/30 p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveType('students');
                setFile(null);
                setParsedStudents([]);
                setParsedTeachers([]);
                setSelectedIndices(new Set());
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeType === 'students'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Import Data Siswa</span>
            </button>

            <button
              onClick={() => {
                setActiveType('teachers');
                setFile(null);
                setParsedStudents([]);
                setParsedTeachers([]);
                setSelectedIndices(new Set());
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeType === 'teachers'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Import Data Wali Kelas</span>
            </button>
          </div>

          {/* Template Download Button */}
          <button
            onClick={() => {
              if (activeType === 'students') downloadStudentTemplate();
              else downloadTeacherTemplate();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Template {activeType === 'students' ? 'Siswa' : 'Wali Kelas'} (.xlsx)</span>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Upload Drop Zone */}
          {!file && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-white/20 hover:border-emerald-400/80 rounded-3xl p-8 text-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all group flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-emerald-500/30">
                  <UploadCloud className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Pilih atau Seret File Excel (.xlsx / .csv) di Sini
                </h3>
                <p className="text-xs text-slate-300 max-w-md">
                  Pastikan susunan kolom sesuai dengan template standar. Klik tombol "Unduh Template" di atas jika Anda memerlukan format acuan baku.
                </p>
              </label>

              {/* Helpful Tips */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-200 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Tips Fitur Otomatis:</span>
                  <p className="text-slate-300">
                    Sistem secara otomatis akan mencocokkan nama kelas (misal: "X IPA 1"). Jika kelas belum ada di sistem, kelas baru akan langsung dibuatkan dan dihubungkan ke Wali Kelas atau Siswa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Membaca dan memvalidasi file Excel...</p>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{parseError}</span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setParseError(null);
                }}
                className="px-3 py-1 bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold text-[11px] rounded-lg"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {file && !isParsing && !parseError && (
            <div className="space-y-4">
              {/* Controls & Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{file.name}</h4>
                    <p className="text-xs text-slate-300">
                      Terbaca <strong className="text-emerald-400">{currentCount} baris</strong> ({validCount} valid)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedStudents([]);
                      setParsedTeachers([]);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-xl border border-white/10"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Option check */}
              <div className="flex items-center space-x-2 text-xs text-slate-200 bg-white/5 p-3 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  id="autoCreateClasses"
                  checked={autoCreateClasses}
                  onChange={(e) => setAutoCreateClasses(e.target.checked)}
                  className="rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoCreateClasses" className="cursor-pointer font-medium">
                  Otomatis buatkan Rombongan Belajar / Kelas Baru jika nama kelas di Excel belum terdaftar.
                </label>
              </div>

              {/* Table Preview */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                <div className="max-h-72 overflow-y-auto">
                  {activeType === 'students' ? (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/10 text-slate-200 uppercase font-bold sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIndices.size === validCount && validCount > 0}
                              onChange={(e) => handleToggleSelectAll(e.target.checked)}
                              className="rounded border-white/20 bg-slate-900 text-emerald-500"
                            />
                          </th>
                          <th className="px-3 py-2.5">NIS / NISN</th>
                          <th className="px-3 py-2.5">Nama Siswa</th>
                          <th className="px-3 py-2.5">JK</th>
                          <th className="px-3 py-2.5">Kelas</th>
                          <th className="px-3 py-2.5">Orang Tua</th>
                          <th className="px-3 py-2.5">No WhatsApp</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedStudents.map((s, idx) => (
                          <tr key={idx} className={selectedIndices.has(idx) ? 'bg-emerald-500/10' : 'hover:bg-white/5'}>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                disabled={!s.isValid}
                                checked={selectedIndices.has(idx)}
                                onChange={() => handleToggleRow(idx)}
                                className="rounded border-white/20 bg-slate-900 text-emerald-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-white">
                              <div>{s.nis}</div>
                              <div className="text-[10px] text-slate-400">{s.nisn}</div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-white">{s.name}</td>
                            <td className="px-3 py-2 font-bold">{s.gender}</td>
                            <td className="px-3 py-2 text-emerald-300 font-semibold">{s.className}</td>
                            <td className="px-3 py-2">{s.parentName}</td>
                            <td className="px-3 py-2 font-mono text-[11px]">{s.parentPhone}</td>
                            <td className="px-3 py-2 text-center">
                              {s.isValid ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold" title={s.validationError}>
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{s.validationError}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/10 text-slate-200 uppercase font-bold sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIndices.size === validCount && validCount > 0}
                              onChange={(e) => handleToggleSelectAll(e.target.checked)}
                              className="rounded border-white/20 bg-slate-900 text-emerald-500"
                            />
                          </th>
                          <th className="px-3 py-2.5">NIP / Kode</th>
                          <th className="px-3 py-2.5">Nama Guru / Wali Kelas</th>
                          <th className="px-3 py-2.5">Username</th>
                          <th className="px-3 py-2.5">No WhatsApp</th>
                          <th className="px-3 py-2.5">Wali Kelas Diampu</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedTeachers.map((t, idx) => (
                          <tr key={idx} className={selectedIndices.has(idx) ? 'bg-emerald-500/10' : 'hover:bg-white/5'}>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                disabled={!t.isValid}
                                checked={selectedIndices.has(idx)}
                                onChange={() => handleToggleRow(idx)}
                                className="rounded border-white/20 bg-slate-900 text-emerald-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-200">{t.nip || '-'}</td>
                            <td className="px-3 py-2 font-bold text-white">{t.name}</td>
                            <td className="px-3 py-2 font-mono text-emerald-300">{t.username}</td>
                            <td className="px-3 py-2 font-mono text-[11px]">{t.phone}</td>
                            <td className="px-3 py-2 font-semibold text-purple-300">{t.className || 'Bukan Wali Kelas'}</td>
                            <td className="px-3 py-2 text-center">
                              {t.isValid ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold" title={t.validationError}>
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{t.validationError}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white/5 p-4 px-6 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Batal
          </button>

          <button
            disabled={selectedIndices.size === 0 || !file}
            onClick={handleExecuteImport}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
          >
            <span>Eksekusi Import ({selectedIndices.size} Record)</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
