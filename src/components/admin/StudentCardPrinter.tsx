import React, { useState } from 'react';
import { Student, SchoolClass, SchoolConfig } from '../../types';
import { CreditCard, Printer, Search, School, QrCode, Filter, Sparkles, Check } from 'lucide-react';

interface StudentCardPrinterProps {
  students: Student[];
  classes: SchoolClass[];
  schoolConfig: SchoolConfig;
}

export const StudentCardPrinter: React.FC<StudentCardPrinterProps> = ({
  students,
  classes,
  schoolConfig
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    students.map(s => s.id)
  );

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'ALL' || s.classId === selectedClassId;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      s.nisn.includes(searchTerm);
    return matchClass && matchSearch;
  });

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(item => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Hidden when printing */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Cetak Kartu Pelajar Digital (QR Absensi)</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Kartu Pelajar PVC standar dengan QR Code unik untuk pemindaian di Kios Scanner Absensi Sekolah.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-950" />
          <span>Cetak Kartu Terpilih ({selectedStudentIds.length})</span>
        </button>
      </div>

      {/* Filter controls - Hidden when printing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>Kelas {c.name}</option>
            ))}
          </select>

          <button
            onClick={handleSelectAll}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl shrink-0 border border-white/10"
          >
            {selectedStudentIds.length === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        </div>
      </div>

      {/* Printable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:p-0">
        {filteredStudents
          .filter(s => selectedStudentIds.includes(s.id))
          .map((std) => (
            <div
              key={std.id}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 border-2 border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between aspect-[1.586/1] print:border-slate-800 print:shadow-none break-inside-avoid"
            >
              {/* Background Accent */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-bold shadow-md">
                    <School className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs tracking-tight text-white uppercase">
                      {schoolConfig.schoolName}
                    </div>
                    <div className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">
                      KARTU IDENTITAS PRESENSI SISWA
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {std.className}
                </span>
              </div>

              {/* Student Details & QR */}
              <div className="grid grid-cols-3 gap-3 my-2 items-center">
                {/* Photo Placeholder */}
                <div className="col-span-1 flex flex-col items-center">
                  <div className="w-20 h-24 rounded-xl bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400 shadow-inner overflow-hidden relative">
                    <span className="text-2xl font-bold text-emerald-400 mb-1">
                      {std.name.charAt(0)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">PAS FOTO</span>
                  </div>
                </div>

                {/* Details */}
                <div className="col-span-2 space-y-1">
                  <div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Nama Lengkap:</div>
                    <div className="text-sm font-extrabold text-white leading-tight truncate">
                      {std.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[9px] uppercase text-slate-400 font-bold">NISN:</div>
                      <div className="font-mono text-emerald-300 font-semibold">{std.nisn}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-400 font-bold">NIS:</div>
                      <div className="font-mono text-slate-300">{std.nis}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase text-slate-400 font-bold">Jenis Kelamin:</div>
                    <div className="text-xs text-slate-200">
                      {std.gender === 'L' ? 'Laki-Laki (Wajib Sholat Jumat)' : 'Perempuan'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with QR Code */}
              <div className="border-t border-slate-700/80 pt-2 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    ID QR: {std.qrCode}
                  </div>
                  <div className="text-[8px] text-slate-500">
                    Gunakan kartu ini untuk scan presensi Pagi, Dzuhur, Jumat & Pulang.
                  </div>
                </div>

                <div className="p-1 bg-white rounded-lg shadow-md shrink-0">
                  <QrCode className="w-9 h-9 text-slate-900" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
