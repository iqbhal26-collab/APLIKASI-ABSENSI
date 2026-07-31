import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, Student, SchoolConfig, ActivityType } from '../types';

interface ExportFilter {
  date?: string; // e.g. "2026-07-30" (for daily export)
  month?: string; // e.g. "2026-07" (for monthly export)
  className?: string;
  activityCode?: string;
  reportType?: 'daily' | 'monthly';
}

// Format date to Indonesian string
export const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  } else if (parts.length === 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${year}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const exportAttendanceToExcel = (
  records: AttendanceRecord[],
  students: Student[],
  activities: ActivityType[],
  config: SchoolConfig,
  filter: ExportFilter
) => {
  const isDaily = filter.reportType === 'daily' || Boolean(filter.date);

  const filteredRecords = records.filter(r => {
    let matchTime = true;
    if (isDaily && filter.date) {
      matchTime = r.date === filter.date;
    } else if (filter.month) {
      matchTime = r.date.startsWith(filter.month);
    }

    const matchClass = filter.className && filter.className !== 'ALL'
      ? (r.className ? r.className.toLowerCase().replace(/[^a-z0-9]/g, '') === filter.className.toLowerCase().replace(/[^a-z0-9]/g, '') : true)
      : true;
    const matchAct = filter.activityCode && filter.activityCode !== 'ALL' ? r.activityCode === filter.activityCode : true;
    return matchTime && matchClass && matchAct;
  });

  // Prepare sheet data
  const periodText = isDaily && filter.date
    ? `HARIAN (${formatIndonesianDate(filter.date)})`
    : `BULANAN (${filter.month ? formatIndonesianDate(filter.month) : 'Semua Periode'})`;

  const titleRow = [`REKAPITULASI ABSENSI SISWA ${isDaily ? 'HARIAN' : 'BULANAN'} - ${config.schoolName.toUpperCase()}`];
  const subTitleRow = [`PERIODE: ${periodText} | KELAS: ${filter.className || 'Semua Kelas'}`];
  const emptyRow = [''];

  const headers = [
    'No',
    'NISN',
    'NIS',
    'Nama Siswa',
    'L/P',
    'Kelas',
    'Tanggal',
    'Kegiatan Absen',
    'Jam Absen',
    'Status Kehadiran',
    'Metode',
    'Keterangan'
  ];

  const rows = filteredRecords.map((rec, index) => [
    index + 1,
    students.find(s => s.id === rec.studentId)?.nisn || '-',
    students.find(s => s.id === rec.studentId)?.nis || '-',
    rec.studentName,
    rec.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    rec.className,
    rec.date,
    rec.activityName,
    rec.time,
    rec.status.toUpperCase(),
    rec.method,
    rec.notes || '-'
  ]);

  // Calculate summary counts
  const totalHadir = filteredRecords.filter(r => r.status === 'hadir').length;
  const totalTerlambat = filteredRecords.filter(r => r.status === 'terlambat').length;
  const totalSakit = filteredRecords.filter(r => r.status === 'sakit').length;
  const totalIzin = filteredRecords.filter(r => r.status === 'izin').length;
  const totalAlpa = filteredRecords.filter(r => r.status === 'alpa').length;

  const summaryRows = [
    [''],
    ['TOTAL RINGKASAN KEHADIRAN:'],
    ['Total Hadir', totalHadir],
    ['Total Terlambat', totalTerlambat],
    ['Total Sakit', totalSakit],
    ['Total Izin', totalIzin],
    ['Total Alpa', totalAlpa],
    ['Total Record Absensi', filteredRecords.length]
  ];

  const worksheetData = [
    titleRow,
    subTitleRow,
    emptyRow,
    headers,
    ...rows,
    ...summaryRows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set col widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 10 }, // NIS
    { wch: 28 }, // Nama
    { wch: 10 }, // L/P
    { wch: 12 }, // Kelas
    { wch: 12 }, // Tanggal
    { wch: 28 }, // Kegiatan
    { wch: 10 }, // Jam
    { wch: 14 }, // Status
    { wch: 14 }, // Metode
    { wch: 30 }  // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Absensi');

  const fileName = `Laporan_Absensi_${config.schoolName.replace(/\s+/g, '_')}_${filter.className || 'Semua'}_${filter.month || 'Bulan'}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Helper to create crisp SMA school emblem logo data URL using Canvas
export function getDefaultSmaLogoDataUrl(): string {
  try {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Outer circle - Emerald
    ctx.beginPath();
    ctx.arc(70, 70, 64, 0, 2 * Math.PI);
    ctx.fillStyle = '#065f46';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(70, 70, 56, 0, 2 * Math.PI);
    ctx.fillStyle = '#047857';
    ctx.fill();

    // Emblem Shield
    ctx.beginPath();
    ctx.moveTo(70, 28);
    ctx.lineTo(96, 50);
    ctx.lineTo(88, 86);
    ctx.lineTo(70, 78);
    ctx.lineTo(52, 86);
    ctx.lineTo(44, 50);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // Open Book shape
    ctx.beginPath();
    ctx.moveTo(38, 80);
    ctx.quadraticCurveTo(70, 66, 102, 80);
    ctx.lineTo(98, 94);
    ctx.quadraticCurveTo(70, 80, 42, 94);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center emblem star
    ctx.beginPath();
    ctx.arc(70, 42, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Text "SMA BULUKUMBA"
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('SMA BULUKUMBA', 70, 114);

    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
}

export const exportAttendanceToPDF = (
  records: AttendanceRecord[],
  students: Student[],
  activities: ActivityType[],
  config: SchoolConfig,
  filter: ExportFilter
) => {
  const isDaily = filter.reportType === 'daily' || Boolean(filter.date);

  const filteredRecords = records.filter(r => {
    let matchTime = true;
    if (isDaily && filter.date) {
      matchTime = r.date === filter.date;
    } else if (filter.month) {
      matchTime = r.date.startsWith(filter.month);
    }

    const matchClass = filter.className && filter.className !== 'ALL'
      ? (r.className ? r.className.toLowerCase().replace(/[^a-z0-9]/g, '') === filter.className.toLowerCase().replace(/[^a-z0-9]/g, '') : true)
      : true;
    const matchAct = filter.activityCode && filter.activityCode !== 'ALL' ? r.activityCode === filter.activityCode : true;
    return matchTime && matchClass && matchAct;
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Kop Surat - Render School Logo
  let logoData = config.logoUrl;
  if (!logoData || !logoData.trim()) {
    logoData = getDefaultSmaLogoDataUrl();
  }

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 8, 18, 18);
    } catch (e) {
      try {
        doc.addImage(logoData, 'JPEG', 14, 8, 18, 18);
      } catch (e2) {
        // Fallback to generated canvas logo
        try {
          const fallbackLogo = getDefaultSmaLogoDataUrl();
          if (fallbackLogo) {
            doc.addImage(fallbackLogo, 'PNG', 14, 8, 18, 18);
          }
        } catch (e3) {
          console.warn('Could not add logo image to PDF export:', e3);
        }
      }
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`NPSN: ${config.npsn} | Alamat: ${config.address}`, pageWidth / 2, 19, { align: 'center' });
  doc.text(`Tahun Ajaran: ${config.academicYear} - Semester ${config.semester}`, pageWidth / 2, 23, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.8);
  doc.line(14, 26, pageWidth - 14, 26);
  doc.setLineWidth(0.2);
  doc.line(14, 27, pageWidth - 14, 27);

  // Title
  const periodLabel = isDaily && filter.date
    ? `Harian (${formatIndonesianDate(filter.date)})`
    : `Bulanan (${filter.month ? formatIndonesianDate(filter.month) : 'Semua Periode'})`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI ABSENSI PRESENSI SISWA ${isDaily ? 'HARIAN' : 'BULANAN'}`, pageWidth / 2, 34, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kelas: ${filter.className || 'Semua Kelas'}  |  Periode: ${periodLabel}  |  Jenis Sesi: ${filter.activityCode || 'Semua Sesi'}`, pageWidth / 2, 40, { align: 'center' });

  // Table columns
  const tableHeaders = [
    ['No', 'NISN / NIS', 'Nama Siswa', 'L/P', 'Kelas', 'Tanggal', 'Kegiatan Absen', 'Waktu', 'Status', 'Catatan']
  ];

  const tableData = filteredRecords.map((rec, index) => {
    const std = students.find(s => s.id === rec.studentId);
    return [
      (index + 1).toString(),
      `${std?.nisn || '-'}\n${std?.nis || '-'}`,
      rec.studentName,
      rec.gender === 'L' ? 'L' : 'P',
      rec.className,
      rec.date,
      rec.activityName,
      rec.time,
      rec.status.toUpperCase(),
      rec.notes || '-'
    ];
  });

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 45,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 22 },
      6: { cellWidth: 42 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 22 },
      9: { cellWidth: 'auto' }
    }
  });

  // Summary counts
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 8 || 120;

  const totalHadir = filteredRecords.filter(r => r.status === 'hadir').length;
  const totalTerlambat = filteredRecords.filter(r => r.status === 'terlambat').length;
  const totalSakit = filteredRecords.filter(r => r.status === 'sakit').length;
  const totalIzin = filteredRecords.filter(r => r.status === 'izin').length;
  const totalAlpa = filteredRecords.filter(r => r.status === 'alpa').length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Kehadiran:', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Hadir: ${totalHadir} | Terlambat: ${totalTerlambat} | Sakit: ${totalSakit} | Izin: ${totalIzin} | Alpa: ${totalAlpa} | Total: ${filteredRecords.length} Record`, 14, finalY + 5);

  // Signatures
  const signatureY = Math.min(finalY + 15, doc.internal.pageSize.getHeight() - 35);
  const todayFormatted = formatIndonesianDate(new Date().toISOString().split('T')[0]);

  doc.text(`Bulukumba, ${todayFormatted}`, pageWidth - 70, signatureY);
  doc.text('Mengetahui,', 14, signatureY);
  doc.text('Kepala Sekolah', 14, signatureY + 5);
  doc.text('Admin / Petugas Absensi', pageWidth - 70, signatureY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(config.principalName, 14, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${config.principalNip}`, 14, signatureY + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('IQBAL PRATAMA, S.Kom., Gr.', pageWidth - 70, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19890426 202221 1 012', pageWidth - 70, signatureY + 26);

  const fileName = `Laporan_Absensi_${config.schoolName.replace(/\s+/g, '_')}_${filter.className || 'Semua'}_${filter.month || 'Bulan'}.pdf`;
  doc.save(fileName);
};
