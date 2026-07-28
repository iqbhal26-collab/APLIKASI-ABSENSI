import * as XLSX from 'xlsx';
import { Student, SchoolClass, User } from '../types';

/**
 * Generate & Download Excel Template for Importing Student Data (Data Siswa)
 */
export function downloadStudentTemplate() {
  // Sample Rows
  const sampleData = [
    {
      'NIS': '23241011',
      'NISN': '0078921011',
      'Nama_Lengkap_Siswa': 'Ahmad Fauzan Putera',
      'Jenis_Kelamin': 'L', // L / P
      'Kelas': 'X IPA 1',
      'Nama_Orang_Tua': 'Bpk. Hendra Putera',
      'No_WhatsApp_Orang_Tua': '081234567890'
    },
    {
      'NIS': '23241012',
      'NISN': '0078921012',
      'Nama_Lengkap_Siswa': 'Anisa Rahmawati',
      'Jenis_Kelamin': 'P',
      'Kelas': 'X IPA 1',
      'Nama_Orang_Tua': 'Ibu Dewi Rahma',
      'No_WhatsApp_Orang_Tua': '081399887766'
    },
    {
      'NIS': '23241013',
      'NISN': '0078921013',
      'Nama_Lengkap_Siswa': 'Bagas Aditya Pratama',
      'Jenis_Kelamin': 'L',
      'Kelas': 'XI IPS 2',
      'Nama_Orang_Tua': 'Bpk. Bambang Pratama',
      'No_WhatsApp_Orang_Tua': '081511223344'
    },
    {
      'NIS': '23241014',
      'NISN': '0078921014',
      'Nama_Lengkap_Siswa': 'Citra Kirana Pertiwi',
      'Jenis_Kelamin': 'P',
      'Kelas': 'XII IPA 3',
      'Nama_Orang_Tua': 'Bpk. Agus Pertiwi',
      'No_WhatsApp_Orang_Tua': '081788776655'
    }
  ];

  // Instructions Sheet
  const instructions = [
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '1. Jangan mengubah nama header kolom di Baris 1.' },
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '2. NIS dan NISN wajib diisi angka unik.' },
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '3. Jenis_Kelamin wajib diisi "L" (Laki-Laki) atau "P" (Perempuan).' },
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '4. Kolom Kelas diisi nama kelas seperti "X IPA 1", "XI IPS 2". Setiap kelas dibatasi MAKSIMAL 36 SISWA.' },
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '5. No_WhatsApp_Orang_Tua diisi nomor HP aktif diawali angka 08... untuk menerima notifikasi absensi & sholat.' },
    { 'PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA': '6. Hapus baris contoh sebelum mengunggah atau langsung timpa dengan data siswa asli Anda.' }
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.json_to_sheet(sampleData);
  // Set column widths
  wsData['!cols'] = [
    { wch: 15 }, // NIS
    { wch: 15 }, // NISN
    { wch: 30 }, // Nama_Lengkap_Siswa
    { wch: 15 }, // Jenis_Kelamin
    { wch: 15 }, // Kelas
    { wch: 25 }, // Nama_Orang_Tua
    { wch: 22 }  // No_WhatsApp_Orang_Tua
  ];

  const wsInstruct = XLSX.utils.json_to_sheet(instructions);
  wsInstruct['!cols'] = [{ wch: 110 }];

  XLSX.utils.book_append_sheet(wb, wsData, 'Data_Siswa');
  XLSX.utils.book_append_sheet(wb, wsInstruct, 'Petunjuk_Pengisian');

  XLSX.writeFile(wb, 'Template_Import_Data_Siswa_SMA.xlsx');
}

/**
 * Generate & Download Excel Template for Importing Homeroom Teachers / Guru (Data Wali Kelas)
 */
export function downloadTeacherTemplate() {
  const sampleData = [
    {
      'NIP_KODE_GURU': '197805122005011002',
      'Nama_Lengkap_Guru': 'Siti Rahmawati, S.Pd',
      'Username': 'siti_rahma',
      'Password_Awal': 'guru123',
      'No_WhatsApp': '081298765432',
      'Email': 'siti.rahmawati@sman1edukasi.sch.id',
      'Wali_Kelas_Diampu': 'X IPA 1'
    },
    {
      'NIP_KODE_GURU': '198203152009021004',
      'Nama_Lengkap_Guru': 'Dedi Kurniawan, M.Si',
      'Username': 'dedi_kurniawan',
      'Password_Awal': 'guru123',
      'No_WhatsApp': '081399998888',
      'Email': 'dedi.kurniawan@sman1edukasi.sch.id',
      'Wali_Kelas_Diampu': 'XI IPS 2'
    },
    {
      'NIP_KODE_GURU': '197511202003122001',
      'Nama_Lengkap_Guru': 'Dra. Nurhayati',
      'Username': 'nurhayati_guru',
      'Password_Awal': 'guru123',
      'No_WhatsApp': '081577665544',
      'Email': 'nurhayati@sman1edukasi.sch.id',
      'Wali_Kelas_Diampu': 'XII IPA 3'
    }
  ];

  const instructions = [
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '1. Jangan mengubah nama header kolom di Baris 1.' },
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '2. NIP_KODE_GURU diisi NIP resmi atau Kode Pengenal Guru.' },
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '3. Username diisi ID unik untuk login Guru / Wali Kelas ke aplikasi.' },
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '4. Wali_Kelas_Diampu diisi nama kelas yang menjadi tanggung jawabnya (misal: "X IPA 1"). Kolom ini otomatis menghubungkan guru sebagai Wali Kelas.' },
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '5. Jika guru tidak menjabat Wali Kelas, kosongkan kolom Wali_Kelas_Diampu.' },
    { 'PETUNJUK PENGISIAN TEMPLATE WALI KELAS & GURU': '6. Hapus data contoh sebelum mengunggah file Anda.' }
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.json_to_sheet(sampleData);
  wsData['!cols'] = [
    { wch: 22 }, // NIP_KODE_GURU
    { wch: 28 }, // Nama_Lengkap_Guru
    { wch: 18 }, // Username
    { wch: 15 }, // Password_Awal
    { wch: 20 }, // No_WhatsApp
    { wch: 32 }, // Email
    { wch: 20 }  // Wali_Kelas_Diampu
  ];

  const wsInstruct = XLSX.utils.json_to_sheet(instructions);
  wsInstruct['!cols'] = [{ wch: 110 }];

  XLSX.utils.book_append_sheet(wb, wsData, 'Data_Wali_Kelas');
  XLSX.utils.book_append_sheet(wb, wsInstruct, 'Petunjuk_Pengisian');

  XLSX.writeFile(wb, 'Template_Import_Data_Wali_Kelas_SMA.xlsx');
}

/**
 * Interface for Parsed Student Row from Excel
 */
export interface ParsedStudentRow {
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  className: string;
  parentName: string;
  parentPhone: string;
  isValid: boolean;
  validationError?: string;
}

/**
 * Interface for Parsed Teacher Row from Excel
 */
export interface ParsedTeacherRow {
  nip: string;
  name: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  className: string;
  isValid: boolean;
  validationError?: string;
}

/**
 * Parse uploaded Excel file into raw JSON rows
 */
export async function parseExcelData(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonResult = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonResult);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert raw json rows into validated ParsedStudentRow list
 */
export function normalizeStudentImportRows(
  rawRows: any[],
  existingClassCounts: Record<string, number> = {}
): ParsedStudentRow[] {
  const classTracker: Record<string, number> = { ...existingClassCounts };

  return rawRows.map((row) => {
    // Flexibly match headers
    const nis = String(row['NIS'] || row['nis'] || row['Nis'] || '').trim();
    const nisn = String(row['NISN'] || row['nisn'] || row['Nisn'] || '').trim();
    const name = String(row['Nama_Lengkap_Siswa'] || row['Nama Lengkap Siswa'] || row['Nama'] || row['nama'] || '').trim();
    let genderStr = String(row['Jenis_Kelamin'] || row['Jenis Kelamin'] || row['JK'] || row['jk'] || 'L').trim().toUpperCase();
    const className = String(row['Kelas'] || row['kelas'] || row['Nama Kelas'] || 'X IPA 1').trim();
    const parentName = String(row['Nama_Orang_Tua'] || row['Nama Orang Tua'] || row['Orang Tua'] || 'Orang Tua Siswa').trim();
    const parentPhone = String(row['No_WhatsApp_Orang_Tua'] || row['No WhatsApp Orang Tua'] || row['No HP'] || row['Phone'] || '081200000000').trim();

    let gender: 'L' | 'P' = 'L';
    if (genderStr === 'P' || genderStr.startsWith('PEREMPUAN') || genderStr.startsWith('FEMALE')) {
      gender = 'P';
    }

    let isValid = true;
    let validationError = '';

    if (!nis) {
      isValid = false;
      validationError = 'NIS kosong';
    } else if (!name) {
      isValid = false;
      validationError = 'Nama siswa kosong';
    } else {
      const clsKey = className.toLowerCase().trim();
      const currentCount = classTracker[clsKey] || 0;
      if (currentCount >= 36) {
        isValid = false;
        validationError = `Kapasitas kelas "${className}" penuh (Maks 36 siswa)`;
      } else {
        classTracker[clsKey] = currentCount + 1;
      }
    }

    return {
      nis,
      nisn: nisn || nis,
      name,
      gender,
      className,
      parentName,
      parentPhone,
      isValid,
      validationError,
    };
  });
}

/**
 * Convert raw json rows into validated ParsedTeacherRow list
 */
export function normalizeTeacherImportRows(rawRows: any[]): ParsedTeacherRow[] {
  return rawRows.map((row) => {
    const nip = String(row['NIP_KODE_GURU'] || row['NIP'] || row['Kode Guru'] || '').trim();
    const name = String(row['Nama_Lengkap_Guru'] || row['Nama Lengkap Guru'] || row['Nama'] || '').trim();
    const username = String(row['Username'] || row['username'] || row['User'] || '').trim();
    const password = String(row['Password_Awal'] || row['Password'] || 'guru123').trim();
    const phone = String(row['No_WhatsApp'] || row['No HP'] || row['Phone'] || '081200000000').trim();
    const email = String(row['Email'] || row['email'] || '').trim();
    const className = String(row['Wali_Kelas_Diampu'] || row['Wali Kelas'] || row['Kelas'] || '').trim();

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = 'Nama guru kosong';
    } else if (!username && !nip) {
      isValid = false;
      validationError = 'NIP atau Username kosong';
    }

    return {
      nip,
      name,
      username: username || (nip ? `guru_${nip}` : `guru_${Date.now()}`),
      password,
      phone,
      email: email || `${username || 'guru'}@sekolah.sch.id`,
      className,
      isValid,
      validationError,
    };
  });
}
