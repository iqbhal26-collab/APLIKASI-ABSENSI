-- ================================================================
-- SUPABASE DATABASE SCHEMA FOR PRESENSI SEKOLAH & GURU PIKET
-- ================================================================

-- 1. ENUM UNTUK ROLE USER
CREATE TYPE user_role AS ENUM (
  'admin',
  'guru',
  'guru_piket',
  'guru_agama',
  'orang_tua',
  'siswa'
);

-- 2. TABEL USERS (Pengguna & Akun Akses)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'guru_piket',
  nip VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  class_handled TEXT[], -- Array kelas yang ditangani (khusus wali kelas)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat NIP & Username
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_nip ON public.users(nip);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);


-- 3. TABEL SISWA (Master Data Siswa)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nisn VARCHAR(20) UNIQUE NOT NULL,
  nis VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  gender CHAR(1) CHECK (gender IN ('L', 'P')),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  qr_code VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_nisn ON public.students(nisn);
CREATE INDEX IF NOT EXISTS idx_students_qr ON public.students(qr_code);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_name);


-- 4. TABEL ATTENDANCE_RECORDS (Log Presensi Datang, Pulang, & Sholat)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  gender CHAR(1),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_code VARCHAR(50) NOT NULL, -- 'DATANG', 'PULANG', 'SHOLAT_DZUHUR', 'SHOLAT_JUMAT'
  activity_name VARCHAR(100) NOT NULL,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status VARCHAR(20) NOT NULL DEFAULT 'hadir', -- 'hadir', 'terlambat', 'sakit', 'izin', 'alfa'
  method VARCHAR(20) DEFAULT 'QR_SCAN', -- 'QR_SCAN', 'BARCODE', 'MANUAL'
  notes TEXT,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- ID Guru Piket / Petugas yang scan
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Mencegah presensi ganda pada kegiatan yang sama di hari yang sama
  CONSTRAINT unique_student_activity_per_day UNIQUE (student_id, date, activity_code)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_activity ON public.attendance_records(activity_code);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id);


-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik / authenticated user
CREATE POLICY "Allow read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow read students" ON public.students FOR SELECT USING (true);

-- Kebijakan Guru Piket & Admin untuk membaca & memasukkan presensi
CREATE POLICY "Allow insert attendance for authenticated users" 
ON public.attendance_records FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read attendance for authenticated users" 
ON public.attendance_records FOR SELECT 
USING (true);


-- 6. SEED DATA AKUN GURU PIKET (Contoh Data Awal)
INSERT INTO public.users (username, name, role, nip, email, phone)
VALUES 
  ('piket_guru', 'Guru Piket Utama', 'guru_piket', '198501012010011005', 'piket@sman1edukasi.sch.id', '081233445566'),
  ('piket_pagi', 'Guru Piket Datang & Pulang', 'guru_piket', '199003152015022003', 'piketpagi@sman1edukasi.sch.id', '081298765432')
ON CONFLICT (username) DO NOTHING;
