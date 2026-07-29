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
 * Flexible helper to extract a value from a row object using multiple keyword matches
 */
function extractRowValue(row: Record<string, any>, keywords: string[]): string {
  if (!row || typeof row !== 'object') return '';
  const keys = Object.keys(row);

  for (const keyword of keywords) {
    const cleanKw = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = keys.find(k => {
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanK === cleanKw || cleanK.includes(cleanKw);
    });

    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      const val = String(row[matchedKey]).trim();
      if (val !== '') return val;
    }
  }
  return '';
}

/**
 * Parse uploaded Excel file into raw JSON rows with automatic header row detection
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
        
        // 1. Get raw 2D array representation to detect true header row index
        const rawArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!rawArray || rawArray.length === 0) {
          resolve([]);
          return;
        }

        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawArray.length, 10); i++) {
          const rowStr = rawArray[i].map(c => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('nama') ||
            rowStr.includes('nis') ||
            rowStr.includes('kelas') ||
            rowStr.includes('nip')
          ) {
            headerRowIndex = i;
            break;
          }
        }

        const jsonResult = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: ''
        });

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

  // Filter out completely blank rows
  const validRawRows = rawRows.filter(row => {
    if (!row || typeof row !== 'object') return false;
    const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
    return values.length > 0;
  });

  return validRawRows.map((row, idx) => {
    // Flexibly match headers
    const name = extractRowValue(row, ['nama_lengkap_siswa', 'nama_lengkap', 'nama_siswa', 'nama_murid', 'nama', 'student_name', 'name']);
    let nis = extractRowValue(row, ['nis', 'no_induk', 'nomor_induk', 'induk', 'id_siswa', 'nisn']);
    let nisn = extractRowValue(row, ['nisn', 'nomor_nisn', 'no_nisn', 'nis']);
    let genderStr = extractRowValue(row, ['jenis_kelamin', 'jeniskelamin', 'jk', 'l/p', 'gender', 'sex']).toUpperCase();
    let className = extractRowValue(row, ['kelas', 'namakelas', 'nama_kelas', 'rombel', 'class', 'grade']);
    let parentName = extractRowValue(row, ['nama_orang_tua', 'nama_ortu', 'orang_tua', 'ortu', 'wali', 'nama_wali', 'parent']);
    let parentPhone = extractRowValue(row, ['no_whatsapp_orang_tua', 'no_whatsapp', 'no_hp', 'no_wa', 'hp_ortu', 'phone', 'whatsapp', 'kontak', 'telepon']);

    // Defaults and fallbacks
    if (!className) className = 'X IPA 1';
    if (!parentName) parentName = 'Orang Tua Siswa';
    if (!parentPhone) parentPhone = '081200000000';
    if (!nis && name) nis = `100${idx + 1}`;
    if (!nisn) nisn = nis;

    let gender: 'L' | 'P' = 'L';
    if (genderStr === 'P' || genderStr.startsWith('PEREMPUAN') || genderStr.startsWith('FEMALE') || genderStr.includes('PEREMPUAN')) {
      gender = 'P';
    }

    let isValid = true;
    let validationError = '';

    if (!name) {
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
      nisn,
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
  const validRawRows = rawRows.filter(row => {
    if (!row || typeof row !== 'object') return false;
    const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
    return values.length > 0;
  });

  return validRawRows.map((row, idx) => {
    const nip = extractRowValue(row, ['nip_kode_guru', 'nip', 'kode_guru', 'nip_guru']);
    const name = extractRowValue(row, ['nama_lengkap_guru', 'nama_lengkap', 'nama_guru', 'nama', 'teacher_name', 'name']);
    const username = extractRowValue(row, ['username', 'user', 'id_user']);
    const password = extractRowValue(row, ['password_awal', 'password', 'pass']) || 'guru123';
    const phone = extractRowValue(row, ['no_whatsapp', 'no_hp', 'no_wa', 'phone', 'whatsapp', 'kontak', 'telepon']) || '081200000000';
    const email = extractRowValue(row, ['email', 'surel']);
    const className = extractRowValue(row, ['wali_kelas_diampu', 'wali_kelas', 'kelas', 'rombel']);

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = 'Nama guru kosong';
    }

    return {
      nip,
      name,
      username: username || (nip ? `guru_${nip}` : `guru_${Date.now()}_${idx}`),
      password,
      phone,
      email: email || `${username || 'guru'}_${idx}@sekolah.sch.id`,
      className,
      isValid,
      validationError,
    };
  });
}
