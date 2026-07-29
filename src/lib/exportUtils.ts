import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, Student, SchoolConfig, ActivityType } from '../types';

interface ExportFilter {
  month: string; // e.g. "2026-07"
  className?: string;
  activityCode?: string;
}

// Format date to Indonesian string
export const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
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
  const filteredRecords = records.filter(r => {
    const matchMonth = filter.month ? r.date.startsWith(filter.month) : true;
    const matchClass = filter.className && filter.className !== 'ALL' ? r.className === filter.className : true;
    const matchAct = filter.activityCode && filter.activityCode !== 'ALL' ? r.activityCode === filter.activityCode : true;
    return matchMonth && matchClass && matchAct;
  });

  // Prepare sheet data
  const monthName = filter.month ? formatIndonesianDate(`${filter.month}-01`).split(' ').slice(1).join(' ') : 'Semua Periode';
  const titleRow = [`REKAPITULASI ABSENSI SISWA - ${config.schoolName.toUpperCase()}`];
  const subTitleRow = [`PERIODE: ${monthName} | KELAS: ${filter.className || 'Semua Kelas'}`];
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

export const exportAttendanceToPDF = (
  records: AttendanceRecord[],
  students: Student[],
  activities: ActivityType[],
  config: SchoolConfig,
  filter: ExportFilter
) => {
  const filteredRecords = records.filter(r => {
    const matchMonth = filter.month ? r.date.startsWith(filter.month) : true;
    const matchClass = filter.className && filter.className !== 'ALL' ? r.className === filter.className : true;
    const matchAct = filter.activityCode && filter.activityCode !== 'ALL' ? r.activityCode === filter.activityCode : true;
    return matchMonth && matchClass && matchAct;
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Kop Surat
  if (config.logoUrl) {
    try {
      doc.addImage(config.logoUrl, 'PNG', 14, 9, 16, 16);
    } catch (e) {
      try {
        doc.addImage(config.logoUrl, 'JPEG', 14, 9, 16, 16);
      } catch (e2) {
        console.warn('Could not add logo image to PDF export:', e2);
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
  const monthLabel = filter.month ? formatIndonesianDate(`${filter.month}-01`).split(' ').slice(1).join(' ') : 'Semua Periode';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN REKAPITULASI ABSENSI PRESENSI SISWA', pageWidth / 2, 34, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kelas: ${filter.className || 'Semua Kelas'}  |  Periode: ${monthLabel}  |  Jenis Kegiatan: ${filter.activityCode || 'Semua Kegiatan'}`, pageWidth / 2, 40, { align: 'center' });

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
  doc.text('Wali Kelas / Petugas Absensi', pageWidth - 70, signatureY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(config.principalName, 14, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${config.principalNip}`, 14, signatureY + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('( .................................................... )', pageWidth - 70, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. -', pageWidth - 70, signatureY + 26);

  const fileName = `Laporan_Absensi_${config.schoolName.replace(/\s+/g, '_')}_${filter.className || 'Semua'}_${filter.month || 'Bulan'}.pdf`;
  doc.save(fileName);
};
