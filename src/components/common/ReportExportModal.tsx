import React, { useState } from 'react';
import { SchoolClass, ActivityType, AttendanceRecord, Student, SchoolConfig } from '../../types';
import { exportAttendanceToExcel, exportAttendanceToPDF } from '../../lib/exportUtils';
import { FileSpreadsheet, FileText, X, Download, Filter, Calendar } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  activities: ActivityType[];
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  schoolConfig: SchoolConfig;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  classes,
  activities,
  attendanceRecords,
  students,
  schoolConfig
}) => {
  if (!isOpen) return null;

  const currentYearMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');

  const handleExportExcel = () => {
    exportAttendanceToExcel(
      attendanceRecords,
      students,
      activities,
      schoolConfig,
      {
        month: selectedMonth,
        className: selectedClass,
        activityCode: selectedActivity
      }
    );
  };

  const handleExportPDF = () => {
    exportAttendanceToPDF(
      attendanceRecords,
      students,
      activities,
      schoolConfig,
      {
        month: selectedMonth,
        className: selectedClass,
        activityCode: selectedActivity
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cetak & Ekspor Laporan Absensi</h3>
              <p className="text-xs text-slate-300">
                Pilih format dokumen PDF atau Excel untuk laporan bulanan/harian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="space-y-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter Periode & Kriteria</span>
            </div>

            {/* Month selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Bulan & Tahun Absensi:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Class filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filter Kelas:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name} (Wali Kelas: {cls.homeroomTeacherName})
                  </option>
                ))}
              </select>
            </div>

            {/* Activity filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filter Sesi / Jenis Kegiatan:
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Sesi Kegiatan (Datang, Dzuhur, Jumat, Pulang)</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.code}>
                    {act.name} ({act.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <FileText className="w-5 h-5 text-rose-400" />
              <span>Cetak PDF (.pdf)</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 text-center text-xs text-slate-400">
          Format Laporan PDF dilengkapi KOP Surat Resmi SMA & Kolom Tanda Tangan Kepala Sekolah.
        </div>
      </div>
    </div>
  );
};
