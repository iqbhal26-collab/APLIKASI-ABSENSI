import React, { useState } from 'react';
import { Student, SchoolConfig } from '../../types';
import { QrCode, X, Printer, LayoutGrid, RotateCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentCardModalProps {
  student: Student;
  schoolConfig?: SchoolConfig;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  student,
  schoolConfig,
  onClose,
}) => {
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const qrVal = student.qrCode || `QR-STD-${student.nisn}`;

  // Handle Printing Single Card in Portrait (Tegak) or Landscape (Mendatar)
  const handlePrintCard = (orientation: 'portrait' | 'landscape' = printOrientation) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const logoHtml = schoolConfig?.logoUrl
        ? `<img src="${schoolConfig.logoUrl}" style="width: 28px; height: 28px; object-fit: contain; background: white; padding: 2px; border-radius: 6px; border: 1px solid #10b981;" />`
        : `<div style="width: 28px; height: 28px; border-radius: 6px; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">🏫</div>`;

      if (orientation === 'portrait') {
        // PORTRAIT CARD PRINTING (Matching Screenshot Model: 53.9mm x 85.6mm)
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Kartu Pelajar Portrait - ${student.name}</title>
            <style>
              @page {
                size: 53.9mm 85.6mm;
                margin: 0;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
                .card-container {
                  width: 53.9mm !important;
                  height: 85.6mm !important;
                  border: none !important;
                  box-shadow: none !important;
                  page-break-after: avoid !important;
                  margin: 0 auto !important;
                }
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 15px;
                background: #090d16;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .no-print {
                margin-bottom: 16px;
                display: flex;
                gap: 10px;
              }
              .btn-print {
                padding: 8px 18px;
                background: #10b981;
                color: #022c22;
                font-weight: 800;
                font-size: 13px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              .card-container {
                width: 53.9mm;
                height: 85.6mm;
                border-radius: 14px;
                padding: 10px;
                box-sizing: border-box;
                background: #0f172a;
                color: #ffffff;
                border: 2px solid #10b981;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="btn-print" onclick="window.print()">🖨️ Cetak Kartu Portrait (ID Card Tegak)</button>
            </div>
            <div class="card-container">
              <!-- Top Header with Logo -->
              <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 5px;">
                  ${logoHtml}
                  <div style="text-align: left;">
                    <div style="font-weight: 800; font-size: 8px; text-transform: uppercase; letter-spacing: -0.2px; color: #ffffff;">${schoolConfig?.schoolName || 'SMA NEGERI EDUSMART'}</div>
                    <div style="font-size: 6.5px; color: #34d399; font-weight: 700;">KARTU PELAJAR DIGITAL</div>
                  </div>
                </div>
                <div style="font-size: 7px; font-weight: 800; padding: 2px 4px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid #059669;">
                  ${student.className}
                </div>
              </div>

              <!-- Top Squircle Icon / Avatar -->
              <div style="margin-top: 4px; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 20px; font-weight: bold; overflow: hidden;">
                  ${student.avatarUrl 
                    ? `<img src="${student.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : `📱`}
                </div>
              </div>

              <!-- Student Name & Info -->
              <div style="margin-top: 2px; width: 100%;">
                <div style="font-weight: 900; font-size: 10.5px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.2px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${student.name}
                </div>
                <div style="font-size: 8px; font-weight: 800; color: #34d399; margin-top: 2px; letter-spacing: 0.2px;">
                  Kelas ${student.className} | NISN: ${student.nisn}
                </div>
              </div>

              <!-- Big QR Code Box -->
              <div style="background: #ffffff; padding: 8px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: inline-flex; align-items: center; justify-content: center; margin: 4px 0;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrVal)}&margin=1" style="width: 108px; height: 108px; display: block;" alt="QR Code" />
              </div>

              <!-- String Code Box -->
              <div style="width: 90%; padding: 4px 6px; background: #020617; border-radius: 8px; border: 1px solid #1e293b; color: #34d399; font-family: monospace; font-weight: 800; font-size: 8.5px; letter-spacing: 0.5px; box-sizing: border-box; margin-bottom: 2px;">
                ${qrVal}
              </div>

              <!-- Bottom Footer -->
              <div style="font-size: 6px; color: #64748b; margin-top: 1px; font-weight: 600;">
                Scan di Kios Presensi Sekolah
              </div>
            </div>
          </body>
          </html>
        `);
      } else {
        // LANDSCAPE CARD PRINTING (Horizontal PVC 85.6mm x 53.9mm)
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Kartu Pelajar Landscape - ${student.name}</title>
            <style>
              @page {
                size: 85.6mm 53.9mm;
                margin: 0;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
                .card-container {
                  width: 85.6mm !important;
                  height: 53.9mm !important;
                  border: none !important;
                  box-shadow: none !important;
                  page-break-after: avoid !important;
                  margin: 0 auto !important;
                }
              }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 15px;
                background: #0f172a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .no-print {
                margin-bottom: 16px;
                display: flex;
                gap: 10px;
              }
              .btn-print {
                padding: 8px 18px;
                background: #10b981;
                color: #022c22;
                font-weight: 800;
                font-size: 13px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              .card-container {
                width: 85.6mm;
                height: 53.9mm;
                border-radius: 10px;
                padding: 8px 10px;
                box-sizing: border-box;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%);
                color: #ffffff;
                border: 2px solid #10b981;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <div class="no-print">
              <button class="btn-print" onclick="window.print()">🖨️ Cetak Kartu Pelajar (Landscape)</button>
            </div>
            <div class="card-container">
              <!-- Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  ${logoHtml}
                  <div>
                    <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: -0.2px;">${schoolConfig?.schoolName || 'SMA NEGERI EDUSMART'}</div>
                    <div style="font-size: 7.5px; color: #34d399; font-weight: 700; letter-spacing: 0.3px;">KARTU PELAJAR DIGITAL</div>
                  </div>
                </div>
                <div style="font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid #059669;">
                  ${student.className}
                </div>
              </div>

              <!-- Body -->
              <div style="display: flex; align-items: center; gap: 8px; margin: 2px 0;">
                <div style="width: 46px; height: 56px; border-radius: 6px; background: #1e293b; border: 1px solid #475569; display: flex; flex-direction: column; align-items: center; justify-content: center; shrink: 0; overflow: hidden;">
                  ${student.avatarUrl 
                    ? `<img src="${student.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                    : `<span style="font-size: 18px; font-weight: 800; color: #10b981;">${student.name.charAt(0)}</span>`}
                </div>

                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 7px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Nama Siswa:</div>
                  <div style="font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ffffff; line-height: 1.2;">
                    ${student.name}
                  </div>

                  <div style="display: flex; gap: 10px; margin-top: 3px;">
                    <div>
                      <div style="font-size: 6.5px; color: #94a3b8; font-weight: 700;">NISN:</div>
                      <div style="font-size: 9px; font-family: monospace; font-weight: 700; color: #34d399;">${student.nisn}</div>
                    </div>
                    <div>
                      <div style="font-size: 6.5px; color: #94a3b8; font-weight: 700;">NIS:</div>
                      <div style="font-size: 9px; font-family: monospace; font-weight: 600; color: #cbd5e1;">${student.nis || student.nisn}</div>
                    </div>
                  </div>

                  <div style="font-size: 7.5px; margin-top: 3px; color: #e2e8f0;">
                    JK: <strong>${student.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</strong>
                  </div>
                </div>
              </div>

              <!-- Footer with QR -->
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #334155; padding-top: 3px;">
                <div>
                  <div style="font-size: 7.5px; font-family: monospace; color: #94a3b8; font-weight: 600;">
                    KODE: ${qrVal}
                  </div>
                  <div style="font-size: 6.5px; color: #64748b;">
                    Scan Presensi Kios Gerbang/Masjid
                  </div>
                </div>

                <div style="background: #ffffff; padding: 2px; border-radius: 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; shrink: 0;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrVal)}&margin=1" style="width: 40px; height: 40px; display: block;" alt="QR Code" />
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      console.error('Error printing student card', err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center relative shadow-2xl space-y-4 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top QR Icon Squircle */}
        <div className="pt-1">
          <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>
        </div>

        {/* Student Information Header */}
        <div>
          <h3 className="font-extrabold text-lg text-white uppercase tracking-wide leading-snug">
            {student.name}
          </h3>
          <p className="text-xs font-bold text-emerald-400 tracking-wide mt-1">
            Kelas {student.className} | NISN: {student.nisn}
          </p>
        </div>

        {/* Big QR Code Container */}
        <div className="p-4 bg-white rounded-3xl shadow-2xl inline-block border border-slate-200">
          <QRCodeSVG
            value={qrVal}
            size={200}
            level="H"
            marginSize={1}
          />
        </div>

        {/* QR Code String Box */}
        <div className="w-full py-2.5 px-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-center text-xs font-mono font-bold text-emerald-400 tracking-wider shadow-inner">
          {qrVal}
        </div>

        {/* Print Buttons Area */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Main Portrait Print Button */}
          <button
            type="button"
            onClick={() => handlePrintCard('portrait')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Cetak Format Portrait (Tegak)</span>
          </button>

          {/* Secondary Landscape Print Button */}
          <button
            type="button"
            onClick={() => handlePrintCard('landscape')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cetak Format Landscape (PVC Horizontal)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-2xl border border-slate-800 transition-all cursor-pointer mt-1"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

