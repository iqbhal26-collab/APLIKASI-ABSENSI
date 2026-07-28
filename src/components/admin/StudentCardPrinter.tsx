import React, { useState } from 'react';
import { Student, SchoolClass, SchoolConfig } from '../../types';
import { CreditCard, Printer, Search, School, QrCode, Filter, Sparkles, Check, Download, Eye, X, Image as ImageIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [cardTheme, setCardTheme] = useState<'emerald' | 'light'>('emerald');
  const [previewQrStudent, setPreviewQrStudent] = useState<Student | null>(null);

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

  // Primary Browser Print
  const handlePrint = () => {
    // Try opening popup print window first (100% reliable in iframes)
    try {
      const selected = students.filter(s => selectedStudentIds.includes(s.id));
      if (selected.length === 0) {
        alert('Silakan pilih minimal 1 siswa untuk dicetak kartu.');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const logoHtml = schoolConfig.logoUrl
          ? `<img src="${schoolConfig.logoUrl}" style="width: 38px; height: 38px; object-fit: contain; background: white; padding: 2px; border-radius: 8px; border: 1px solid #10b981;" />`
          : `<div style="width: 38px; height: 38px; border-radius: 8px; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">🏫</div>`;

        const cardsHtml = selected.map(std => {
          const qrVal = std.qrCode || `QR-STD-${std.nisn}`;
          // Generate inline SVG or standard clean layout
          return `
            <div className="card" style="
              width: 86mm;
              height: 54mm;
              border-radius: 12px;
              padding: 10px 12px;
              box-sizing: border-box;
              background: ${cardTheme === 'emerald' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)' : '#ffffff'};
              color: ${cardTheme === 'emerald' ? '#ffffff' : '#0f172a'};
              border: 2px solid ${cardTheme === 'emerald' ? '#10b981' : '#cbd5e1'};
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              break-inside: avoid;
              position: relative;
              overflow: hidden;
              font-family: system-ui, -apple-system, sans-serif;
            ">
              <!-- Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${cardTheme === 'emerald' ? '#334155' : '#e2e8f0'}; padding-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${logoHtml}
                  <div>
                    <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: -0.2px;">${schoolConfig.schoolName}</div>
                    <div style="font-size: 8px; color: ${cardTheme === 'emerald' ? '#34d399' : '#059669'}; font-weight: 700; letter-spacing: 0.5px;">KARTU PELAJAR & PRESENSI DIGITAL</div>
                  </div>
                </div>
                <div style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${cardTheme === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : '#e0f2fe'}; color: ${cardTheme === 'emerald' ? '#6ee7b7' : '#0369a1'}; border: 1px solid ${cardTheme === 'emerald' ? '#059669' : '#bae6fd'};">
                  ${std.className}
                </div>
              </div>

              <!-- Body -->
              <div style="display: flex; align-items: center; gap: 10px; margin: 4px 0;">
                <div style="width: 52px; height: 62px; border-radius: 8px; background: ${cardTheme === 'emerald' ? '#1e293b' : '#f1f5f9'}; border: 1px solid ${cardTheme === 'emerald' ? '#475569' : '#cbd5e1'}; display: flex; flex-direction: column; align-items: center; justify-content: center; shrink: 0;">
                  ${std.avatarUrl ? `<img src="${std.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 7px;" />` : `<span style="font-size: 20px; font-weight: 800; color: #10b981;">${std.name.charAt(0)}</span><span style="font-size: 7px; color: #64748b;">FOTO</span>`}
                </div>

                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 8px; text-transform: uppercase; color: ${cardTheme === 'emerald' ? '#94a3b8' : '#64748b'}; font-weight: 700;">Nama Siswa:</div>
                  <div style="font-size: 12px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${cardTheme === 'emerald' ? '#ffffff' : '#0f172a'}; line-height: 1.2;">
                    ${std.name}
                  </div>

                  <div style="display: flex; gap: 12px; margin-top: 3px;">
                    <div>
                      <div style="font-size: 7px; color: ${cardTheme === 'emerald' ? '#94a3b8' : '#64748b'}; font-weight: 700;">NISN:</div>
                      <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: ${cardTheme === 'emerald' ? '#34d399' : '#059669'};">${std.nisn}</div>
                    </div>
                    <div>
                      <div style="font-size: 7px; color: ${cardTheme === 'emerald' ? '#94a3b8' : '#64748b'}; font-weight: 700;">NIS:</div>
                      <div style="font-size: 10px; font-family: monospace; font-weight: 600; color: ${cardTheme === 'emerald' ? '#cbd5e1' : '#475569'};">${std.nis}</div>
                    </div>
                  </div>

                  <div style="font-size: 8px; margin-top: 3px; color: ${cardTheme === 'emerald' ? '#e2e8f0' : '#334155'};">
                    JK: <strong>${std.gender === 'L' ? 'Laki-Laki (Wajib Sholat Jumat)' : 'Perempuan'}</strong>
                  </div>
                </div>
              </div>

              <!-- Footer with Complete QR -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid ${cardTheme === 'emerald' ? '#334155' : '#e2e8f0'}; padding-top: 4px;">
                <div>
                  <div style="font-size: 8px; font-family: monospace; color: ${cardTheme === 'emerald' ? '#94a3b8' : '#64748b'}; font-weight: 600;">
                    KODE QR: ${qrVal}
                  </div>
                  <div style="font-size: 7px; color: ${cardTheme === 'emerald' ? '#64748b' : '#94a3b8'};">
                    Scan pada Kios Scanner Presensi Sekolah
                  </div>
                </div>

                <div style="background: #ffffff; padding: 3px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; shrink: 0;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrVal)}&margin=1" style="width: 48px; height: 48px; display: block;" alt="QR Code" />
                </div>
              </div>
            </div>
          `;
        }).join('');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Cetak Kartu Pelajar - ${schoolConfig.schoolName}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              body {
                margin: 0;
                padding: 10px;
                background: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                justify-content: center;
              }
              @media print {
                body {
                  background: white;
                  padding: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div className="no-print" style="margin-bottom: 16px; padding: 12px; background: #0f172a; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong>Siap Mencetak ${selected.length} Kartu Pelajar Digital</strong>
                <div style="font-size: 12px; color: #94a3b8;">Halaman siap dicetak pada kertas A4 / PVC Card Printer.</div>
              </div>
              <button onclick="window.print()" style="padding: 8px 16px; background: #10b981; color: #022c22; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">
                🖨️ Cetak Sekarang
              </button>
            </div>
            <div className="grid-container">
              ${cardsHtml}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 600);
        return;
      }
    } catch (e) {
      console.warn('Fallback window.print() triggered directly', e);
    }

    // Direct fallback
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls - Hidden when printing */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Cetak Kartu Pelajar Digital & QR Presensi</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Cetak kartu siswa dengan QR code presensi lengkap, data NISN/NIS, serta logo resmi sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Card Theme Toggle */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
            <button
              onClick={() => setCardTheme('emerald')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                cardTheme === 'emerald' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow' : 'hover:text-white'
              }`}
            >
              Tema PVC Gelap
            </button>
            <button
              onClick={() => setCardTheme('light')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                cardTheme === 'light' ? 'bg-white text-slate-950 font-extrabold shadow' : 'hover:text-white'
              }`}
            >
              Tema Putih (Hemat Tinta)
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={selectedStudentIds.length === 0}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Cetak Kartu Terpilih ({selectedStudentIds.length})</span>
          </button>
        </div>
      </div>

      {/* Filter controls - Hidden when printing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIS, atau NISN siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white font-semibold"
          >
            <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>Kelas {c.name}</option>
            ))}
          </select>

          <button
            onClick={handleSelectAll}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl shrink-0 border border-white/10 cursor-pointer"
          >
            {selectedStudentIds.length === filteredStudents.length ? 'Batal Semua' : 'Pilih Semua'}
          </button>
        </div>
      </div>

      {/* Info Status Banner */}
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300 print:hidden">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Menampilkan <strong className="text-white">{filteredStudents.length}</strong> siswa. Terpilih: <strong className="text-emerald-300">{selectedStudentIds.length}</strong> kartu.
          </span>
        </div>
        {schoolConfig.logoUrl && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Logo Sekolah Terpasang</span>
          </div>
        )}
      </div>

      {/* Printable Cards Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-3 print-area">
        {filteredStudents
          .filter(s => selectedStudentIds.includes(s.id))
          .map((std) => {
            const isSelected = selectedStudentIds.includes(std.id);
            const qrValue = std.qrCode || `QR-STD-${std.nisn}`;

            return (
              <div
                key={std.id}
                className={`rounded-2xl p-4 border-2 shadow-xl relative flex flex-col justify-between transition-all print-card-item min-h-[220px] ${
                  cardTheme === 'emerald'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border-emerald-500/40'
                    : 'bg-white text-slate-900 border-slate-300 shadow-md'
                }`}
              >
                {/* Checkbox Selector - Hidden when printing */}
                <div className="absolute top-2.5 right-2.5 z-10 print:hidden">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectStudent(std.id)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Card Header with School Logo */}
                <div className={`flex items-center justify-between border-b pb-2.5 pr-6 ${
                  cardTheme === 'emerald' ? 'border-slate-700/80' : 'border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2.5">
                    {/* School Logo */}
                    {schoolConfig.logoUrl ? (
                      <img
                        src={schoolConfig.logoUrl}
                        alt="Logo Sekolah"
                        className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-emerald-500/40 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-bold shadow-sm shrink-0">
                        <School className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className={`font-extrabold text-xs tracking-tight uppercase truncate ${
                        cardTheme === 'emerald' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {schoolConfig.schoolName}
                      </div>
                      <div className={`text-[9px] font-bold tracking-wider uppercase ${
                        cardTheme === 'emerald' ? 'text-emerald-400' : 'text-emerald-600'
                      }`}>
                        KARTU PELAJAR & PRESENSI DIGITAL
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${
                    cardTheme === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-sky-100 text-sky-800 border-sky-300'
                  }`}>
                    {std.className}
                  </span>
                </div>

                {/* Student Details Body */}
                <div className="grid grid-cols-3 gap-3 my-2 items-center">
                  {/* Photo Box */}
                  <div className="col-span-1 flex flex-col items-center">
                    <div className={`w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-center shadow-inner overflow-hidden relative shrink-0 ${
                      cardTheme === 'emerald'
                        ? 'bg-slate-800/90 border-slate-700 text-slate-400'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                    }`}>
                      {std.avatarUrl ? (
                        <img
                          src={std.avatarUrl}
                          alt={std.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-2xl font-black text-emerald-500 mb-0.5">
                            {std.name.charAt(0)}
                          </span>
                          <span className="text-[8px] font-mono tracking-widest uppercase text-slate-400">
                            PAS FOTO
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Student Attributes */}
                  <div className="col-span-2 space-y-1 min-w-0">
                    <div>
                      <div className={`text-[9px] uppercase font-bold ${
                        cardTheme === 'emerald' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Nama Lengkap Siswa:
                      </div>
                      <div className={`text-sm font-extrabold leading-tight truncate ${
                        cardTheme === 'emerald' ? 'text-white' : 'text-slate-900'
                      }`} title={std.name}>
                        {std.name}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                      <div>
                        <div className={`text-[9px] uppercase font-bold ${
                          cardTheme === 'emerald' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          NISN:
                        </div>
                        <div className={`font-mono font-bold text-xs ${
                          cardTheme === 'emerald' ? 'text-emerald-300' : 'text-emerald-700'
                        }`}>
                          {std.nisn}
                        </div>
                      </div>
                      <div>
                        <div className={`text-[9px] uppercase font-bold ${
                          cardTheme === 'emerald' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          NIS:
                        </div>
                        <div className={`font-mono text-xs ${
                          cardTheme === 'emerald' ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {std.nis}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className={`text-[9px] uppercase font-bold ${
                        cardTheme === 'emerald' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Jenis Kelamin:
                      </div>
                      <div className={`text-xs font-semibold ${
                        cardTheme === 'emerald' ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {std.gender === 'L' ? 'Laki-Laki (Wajib Sholat Jumat)' : 'Perempuan'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Complete QR Code */}
                <div className={`border-t pt-2.5 flex items-center justify-between ${
                  cardTheme === 'emerald' ? 'border-slate-700/80' : 'border-slate-200'
                }`}>
                  <div className="pr-2">
                    <div className={`text-[10px] font-mono font-bold ${
                      cardTheme === 'emerald' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      KODE QR: <span className="text-emerald-400">{qrValue}</span>
                    </div>
                    <div className={`text-[8.5px] leading-tight ${
                      cardTheme === 'emerald' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Scan di Kios Scanner Pagi, Dzuhur, Jumat & Pulang.
                    </div>
                  </div>

                  {/* Clean White Wrapper for QR Code - 100% Unclipped */}
                  <div
                    onClick={() => setPreviewQrStudent(std)}
                    className="p-1.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center border border-slate-200 cursor-pointer hover:scale-105 transition-all group"
                    title="Klik untuk memperbesar QR Code"
                  >
                    <QRCodeSVG
                      value={qrValue}
                      size={56}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* QR Code Enlarged Preview Modal */}
      {previewQrStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative">
            <button
              onClick={() => setPreviewQrStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30 mb-3">
                <QrCode className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-black text-white">{previewQrStudent.name}</h3>
              <p className="text-xs text-emerald-400 font-semibold mb-4">
                Kelas {previewQrStudent.className} | NISN: {previewQrStudent.nisn}
              </p>

              <div className="p-4 bg-white rounded-2xl shadow-2xl border border-slate-200 inline-block mb-4">
                <QRCodeSVG
                  value={previewQrStudent.qrCode || `QR-STD-${previewQrStudent.nisn}`}
                  size={192}
                  level="H"
                  marginSize={1}
                />
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-emerald-300 w-full mb-4 break-all">
                {previewQrStudent.qrCode || `QR-STD-${previewQrStudent.nisn}`}
              </div>

              <button
                onClick={() => setPreviewQrStudent(null)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
