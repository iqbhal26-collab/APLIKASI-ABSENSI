import React, { useState } from 'react';
import { SchoolConfig } from '../../types';
import { SUPABASE_SQL_SCHEMA, sanitizeSupabaseUrl } from '../../lib/supabase';
import { Settings, Database, Copy, Check, School, ShieldCheck, Sparkles, AlertCircle, RefreshCw, UploadCloud, DownloadCloud, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

interface SystemConfigProps {
  config: SchoolConfig;
  onUpdateConfig: (newConfig: SchoolConfig) => void;
  syncStatus?: { isSyncing: boolean; message: string | null; isError: boolean };
  onFetchFromSupabase?: () => void;
  onSeedToSupabase?: () => void;
}

export const SystemConfig: React.FC<SystemConfigProps> = ({
  config,
  onUpdateConfig,
  syncStatus,
  onFetchFromSupabase,
  onSeedToSupabase
}) => {
  const [formData, setFormData] = useState<SchoolConfig>({
    ...config,
    supabaseUrl: sanitizeSupabaseUrl(config.supabaseUrl || '')
  });
  const [isCopied, setIsCopied] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');

  const handleLogoFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (PNG, JPG, SVG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/png');
          setFormData(prev => ({ ...prev, logoUrl: resizedDataUrl }));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedUrl = sanitizeSupabaseUrl(formData.supabaseUrl || '');
    const cleanedConfig = { ...formData, supabaseUrl: cleanedUrl };
    setFormData(cleanedConfig);
    onUpdateConfig(cleanedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Konfigurasi Sistem Absensi & Supabase Database</h2>
          <p className="text-xs text-slate-300 mt-1">
            Pengaturan identitas sekolah, toleransi keterlambatan, dan kredensial Supabase.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center space-x-1.5 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Supabase Database Integration */}
        <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 shadow-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Integrasi Supabase Cloud Database</h3>
                <p className="text-xs text-slate-300">
                  Aplikasi ini siap dihubungkan langsung ke database Supabase milik Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 shrink-0"
            >
              <Copy className="w-4 h-4 text-slate-950" />
              <span>Lihat & Salin Script DDL SQL Supabase</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supabase Project URL:
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl || ''}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                onBlur={() => setFormData(prev => ({ ...prev, supabaseUrl: sanitizeSupabaseUrl(prev.supabaseUrl || '') }))}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-emerald-400/80 mt-1">
                Contoh: <code className="bg-black/30 px-1 py-0.5 rounded">https://xyz.supabase.co</code> (Otomatis dibersihkan jika ada <code>/rest/v1</code>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supabase Anon Public API Key:
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseAnonKey || ''}
                onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value.trim() })}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Kunci publik anon (dapat ditemukan di Supabase Project Settings &gt; API)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useSupabaseLive"
                checked={formData.useSupabaseLive}
                onChange={(e) => setFormData({ ...formData, useSupabaseLive: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded border-white/20 focus:ring-emerald-500 bg-black/40"
              />
              <label htmlFor="useSupabaseLive" className="text-xs font-bold text-slate-200 cursor-pointer">
                Gunakan Supabase Live Connection (Koneksi Database Aktif)
              </label>
            </div>

            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              formData.useSupabaseLive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 text-slate-400 border-white/10'
            }`}>
              {formData.useSupabaseLive ? 'Mode: SUPABASE CLOUD LIVE' : 'Mode: LOCAL STATE SIMULATED'}
            </span>
          </div>

          {/* Sync Status Feedback & Action Controls */}
          {syncStatus?.message && (
            <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
              syncStatus.isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center space-x-2">
                {syncStatus.isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : syncStatus.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            </div>
          )}

          {/* Manual Sync Triggers */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onFetchFromSupabase}
              disabled={syncStatus?.isSyncing}
              className="flex-1 px-4 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4 text-sky-400" />
              <span>Tarik Data Terbaru dari Supabase</span>
            </button>

            <button
              type="button"
              onClick={onSeedToSupabase}
              disabled={syncStatus?.isSyncing}
              className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Unggah / Sinkronkan Data Awal ke Supabase</span>
            </button>
          </div>
        </div>

        {/* Section 2: School Profile & Tolerances */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg p-6 space-y-4 text-white">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <School className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Profil Identitas Sekolah & Aturan Toleransi</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Upload Block */}
            <div className="md:col-span-2 bg-black/30 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Logo Resmi Sekolah:</span>
                </label>
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      logoInputMode === 'upload' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      logoInputMode === 'url' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Input URL
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Current Logo Preview */}
                <div className="relative group w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {formData.logoUrl ? (
                    <>
                      <img
                        src={formData.logoUrl}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                        className="absolute inset-0 bg-slate-950/85 text-rose-300 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-xs font-bold gap-1"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-5 h-5 text-rose-400" />
                        <span>Hapus Logo</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <School className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                      <span className="text-[10px]">Belum Ada Logo</span>
                    </div>
                  )}
                </div>

                {/* Input Method */}
                <div className="flex-1 w-full space-y-2">
                  {logoInputMode === 'upload' ? (
                    <div>
                      <label className="block border-2 border-dashed border-white/20 hover:border-emerald-400/60 rounded-2xl p-3.5 text-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all group">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-white">
                          Klik atau Seret Gambar ke Sini untuk Upload Logo
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format: PNG, JPG, WEBP, atau SVG (Otomatis dioptimalkan)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="https://domain-sekolah.sch.id/logo.png"
                        value={formData.logoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Masukkan link URL gambar logo sekolah langsung dari website/storage.
                      </p>
                    </div>
                  )}

                  {/* Preset Samples */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Contoh / Preset Logo:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/200px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png' })}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-emerald-300 rounded text-[10px] border border-white/10 font-semibold transition-all"
                    >
                      Tut Wuri Handayani
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[10px] border border-rose-500/30 font-semibold transition-all"
                      >
                        Reset Ikon Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Resmi Sekolah:
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-semibold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional):
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat Lengkap Sekolah (Untuk Kop Surat Laporan):
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tahun Ajaran:
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Semester:
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Kepala Sekolah:
              </label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-semibold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NIP Kepala Sekolah:
              </label>
              <input
                type="text"
                value={formData.principalNip}
                onChange={(e) => setFormData({ ...formData, principalNip: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Toleransi Keterlambatan (Menit):
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.toleranceMinutes}
                onChange={(e) => setFormData({ ...formData, toleranceMinutes: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Absensi melewati batas toleransi akan otomatis ditandai status <strong className="text-amber-300">Terlambat</strong>.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              Simpan Perubahan Konfigurasi
            </button>
          </div>
        </div>
      </form>

      {/* SQL Script Viewer Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Script DDL Tables Supabase</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-300">
                Salin script SQL di bawah ini lalu tempelkan di menu <strong>SQL Editor</strong> di Dashboard Supabase Anda untuk membuat seluruh struktur tabel otomatis.
              </p>

              <div className="relative">
                <pre className="bg-black/60 p-4 rounded-2xl border border-white/10 text-xs font-mono text-emerald-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {SUPABASE_SQL_SCHEMA}
                </pre>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center space-x-1.5 transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 text-center text-xs text-slate-400">
              Setelah mengeksekusi SQL di Supabase, Anda cukup memasukkan URL dan Anon Key pada form konfigurasi.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
