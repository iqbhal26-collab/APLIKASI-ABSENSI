import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SchoolConfig } from '../types';

let supabaseClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

/**
 * Sanitizes Supabase URL input to prevent invalid path errors like /rest/v1 appended.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Strip trailing whitespace and slashes
  url = url.replace(/\/+$/, '');

  // Strip trailing /rest/v1 or /rest/v1/* if user accidentally pasted rest endpoint
  url = url.replace(/\/rest\/v1.*$/i, '');

  // Strip trailing slashes again after replacing rest/v1
  url = url.replace(/\/+$/, '');

  // Ensure protocol
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
}

export function getSupabaseClient(config?: SchoolConfig): SupabaseClient | null {
  const metaEnv = (import.meta as any).env || {};
  const rawUrl = config?.supabaseUrl || metaEnv.VITE_SUPABASE_URL || '';
  const key = (config?.supabaseAnonKey || metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

  const url = sanitizeSupabaseUrl(rawUrl);

  if (!url || !key) {
    supabaseClient = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }

  // Return cached client if URL and Key haven't changed
  if (supabaseClient && cachedUrl === url && cachedKey === key) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false }
    });
    cachedUrl = url;
    cachedKey = key;
    return supabaseClient;
  } catch (error) {
    console.warn('Gagal inisialisasi Supabase client:', error);
    supabaseClient = null;
    cachedUrl = '';
    cachedKey = '';
    return null;
  }
}

export function resetSupabaseClient() {
  supabaseClient = null;
  cachedUrl = '';
  cachedKey = '';
}

// SQL Script for Supabase setup
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA DDL SUPABASE UNTUK APLIKASI ABSENSI SISWA SMA
-- Jalankan script ini di menu "SQL Editor" pada Dashboard Supabase Anda

-- 1. Table Konfigurasi Sekolah
CREATE TABLE IF NOT EXISTS public.school_config (
    id TEXT PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    school_name TEXT NOT NULL,
    npsn TEXT,
    address TEXT,
    academic_year TEXT,
    semester TEXT,
    principal_name TEXT,
    principal_nip TEXT,
    tolerance_minutes INT DEFAULT 15,
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pastikan kolom logo_url ada jika tabel school_config sudah dibuat sebelumnya
ALTER TABLE public.school_config ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Table Kelas
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    major TEXT NOT NULL,
    homeroom_teacher_id TEXT,
    homeroom_teacher_name TEXT,
    student_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2b. Table Guru / Pendidik (Guru Agama & Wali Kelas)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    nip TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'guru_agama',
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pastikan kolom homeroom_teacher_name ada jika tabel classes sudah pernah dibuat sebelumnya
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS homeroom_teacher_name TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS homeroom_teacher_id TEXT;

-- 3. Table Siswa
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    nis TEXT NOT NULL UNIQUE,
    nisn TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    class_name TEXT NOT NULL,
    parent_id TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Jenis Kegiatan Absensi
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    gender_constraint VARCHAR(10) DEFAULT 'ALL',
    day_constraint INT[] DEFAULT '{1,2,3,4,5}',
    is_active BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT TRUE
);

-- 5. Table Catatan Absensi (Attendance Records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    gender CHAR(1) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_id TEXT REFERENCES public.activities(id),
    activity_code TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('hadir', 'terlambat', 'sakit', 'izin', 'alpa', 'belum_absen')),
    notes TEXT,
    method VARCHAR(30) NOT NULL DEFAULT 'QR_SCAN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table Pengajuan Surat Izin / Sakit Orang Tua
CREATE TABLE IF NOT EXISTS public.permit_submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('sakit', 'izin')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table Notifikasi Push Orang Tua
CREATE TABLE IF NOT EXISTS public.push_notifications (
    id TEXT PRIMARY KEY,
    recipient_role VARCHAR(20) NOT NULL,
    recipient_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    student_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Allow public read/write for app demo
ALTER TABLE public.school_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access" ON public.school_config;
DROP POLICY IF EXISTS "Allow public full access" ON public.classes;
DROP POLICY IF EXISTS "Allow public full access" ON public.teachers;
DROP POLICY IF EXISTS "Allow public full access" ON public.students;
DROP POLICY IF EXISTS "Allow public full access" ON public.activities;
DROP POLICY IF EXISTS "Allow public full access" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public full access" ON public.permit_submissions;
DROP POLICY IF EXISTS "Allow public full access" ON public.push_notifications;

CREATE POLICY "Allow public full access" ON public.school_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.permit_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.push_notifications FOR ALL USING (true) WITH CHECK (true);
`;
