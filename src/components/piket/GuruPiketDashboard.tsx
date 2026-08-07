import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Student, ActivityType, AttendanceRecord, SchoolConfig, SchoolClass, PermitSubmission } from '../../types';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  Search,
  Users,
  Clock,
  LogIn,
  LogOut,
  Volume2,
  Check,
  UserCheck,
  Zap,
  Barcode,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { IntegratedAttendanceReport } from '../common/IntegratedAttendanceReport';

interface GuruPiketDashboardProps {
  currentUser: User;
  students: Student[];
  activities: ActivityType[];
  records: AttendanceRecord[];
  classes?: SchoolClass[];
  permits?: PermitSubmission[];
  schoolConfig: SchoolConfig;
  onRecordAttendance: (record: Omit<AttendanceRecord, 'id'>) => boolean | void;
  onOpenExportModal?: () => void;
}

// Audio warning chime & speech synthesis
const playWarningAlert = (studentName?: string, customText?: string) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);
    }
  } catch (e) {}

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const spokenMsg = customText || (studentName
        ? `Peringatan! Siswa ${studentName} sudah presensi.`
        : 'Peringatan! Siswa sudah presensi.');
      const utterance = new SpeechSynthesisUtterance(spokenMsg);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {}
  }
};

const playSuccessAlert = (studentName?: string, activityName?: string) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {}

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const spokenMsg = studentName
        ? `Presensi ${activityName || ''} berhasil untuk ${studentName}`
        : 'Presensi berhasil';
      const utterance = new SpeechSynthesisUtterance(spokenMsg);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (err) {}
  }
};

export const GuruPiketDashboard: React.FC<GuruPiketDashboardProps> = ({
  currentUser,
  students,
  activities,
  records,
  classes = [],
  permits = [],
  schoolConfig,
  onRecordAttendance,
  onOpenExportModal,
}) => {
  const [activePiketTab, setActivePiketTab] = useState<'scanner' | 'report'>('scanner');

  // Only DATANG and PULANG activities for Guru Piket
  const piquetActivities = activities.filter(
    a => a.code === 'DATANG' || a.code === 'PULANG'
  );

  const [selectedActivityCode, setSelectedActivityCode] = useState<'DATANG' | 'PULANG'>('DATANG');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSimulateStudentId, setSelectedSimulateStudentId] = useState<string>(students[0]?.id || '');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    className?: string;
    time?: string;
    status?: string;
    activityName?: string;
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'piket-qr-reader-viewport';

  const currentActivity = piquetActivities.find(a => a.code === selectedActivityCode) || {
    id: selectedActivityCode === 'DATANG' ? 'act-1' : 'act-4',
    code: selectedActivityCode,
    name: selectedActivityCode === 'DATANG' ? 'Jam Datang Pagi' : 'Jam Pulang Sekolah',
    startTime: selectedActivityCode === 'DATANG' ? '06:30' : '14:00',
    endTime: selectedActivityCode === 'DATANG' ? '07:15' : '16:00',
    isActive: true,
    isRequired: true,
  };

  // Helper to find student by scanned code
  const findStudentByCode = useCallback((scannedText: string): Student | undefined => {
    const cleanText = scannedText.trim();
    return students.find(s =>
      s.qrCode === cleanText ||
      s.nisn === cleanText ||
      s.nis === cleanText ||
      cleanText === `QR-STD-${s.nisn}` ||
      cleanText === `QR-STD-${s.nis}` ||
      (cleanText.includes(s.nisn) && s.nisn.length >= 4) ||
      (s.qrCode && cleanText.includes(s.qrCode))
    );
  }, [students]);

  // Execute attendance recording
  const processStudentScan = useCallback((targetStudent: Student) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check anti-duplicate
    const existing = records.find(
      r => r.studentId === targetStudent.id &&
           r.date === todayStr &&
           r.activityCode === currentActivity.code
    );

    if (existing) {
      playWarningAlert(targetStudent.name, `Peringatan! Siswa ${targetStudent.name} sudah presensi ${currentActivity.name} hari ini.`);
      setScanResult({
        success: false,
        message: `PERINGATAN / GAGAL: Siswa '${targetStudent.name}' (${targetStudent.className}) SUDAH ABSEN ${currentActivity.name} hari ini pukul ${existing.time} WIB.`,
        studentName: targetStudent.name,
        className: targetStudent.className,
        time: existing.time,
        status: existing.status,
        activityName: currentActivity.name,
      });
      return;
    }

    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const hourMin = timeStr.substring(0, 5);

    let status: 'hadir' | 'terlambat' = 'hadir';
    if (currentActivity.code === 'DATANG' && currentActivity.endTime && hourMin > currentActivity.endTime) {
      status = 'terlambat';
    }

    const isSuccess = onRecordAttendance({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      className: targetStudent.className,
      gender: targetStudent.gender,
      date: todayStr,
      activityId: currentActivity.id,
      activityCode: currentActivity.code,
      activityName: currentActivity.name,
      time: timeStr,
      status: status,
      method: 'QR_SCAN',
      notes: status === 'terlambat' ? 'Presensi Datang melewati batas toleransi jam masuk sekolah' : undefined,
    });

    if (isSuccess === false) {
      playWarningAlert(targetStudent.name, `Peringatan! Siswa ${targetStudent.name} sudah presensi.`);
      setScanResult({
        success: false,
        message: `PERINGATAN: Presensi gagal karena data ${currentActivity.name} untuk '${targetStudent.name}' sudah ada.`,
        studentName: targetStudent.name,
        className: targetStudent.className,
        time: timeStr,
        status: status,
        activityName: currentActivity.name,
      });
      return;
    }

    playSuccessAlert(targetStudent.name, currentActivity.name);
    setScanResult({
      success: true,
      message: `PRESENSI ${currentActivity.name.toUpperCase()} BERHASIL! Notifikasi WhatsApp telah dikirim ke Orang Tua (${targetStudent.parentName}).`,
      studentName: targetStudent.name,
      className: targetStudent.className,
      time: timeStr,
      status: status,
      activityName: currentActivity.name,
    });
  }, [currentActivity, records, onRecordAttendance]);

  // Handle camera scan result
  const handleScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    if (decodedText === lastScannedText && (now - lastScanTime) < 3000) {
      return;
    }

    setLastScannedText(decodedText);
    setLastScanTime(now);

    const found = findStudentByCode(decodedText);
    if (found) {
      processStudentScan(found);
    } else {
      playWarningAlert(undefined, 'Kode Barcode atau QR Code Siswa tidak dikenali.');
      setScanResult({
        success: false,
        message: `KODE TIDAK DIKENALI: '${decodedText}' tidak cocok dengan data NISN/QR siswa mana pun.`,
      });
    }
  }, [findStudentByCode, lastScannedText, lastScanTime, processStudentScan]);

  // Manual Barcode Gun Input Handler
  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const found = findStudentByCode(barcodeInput.trim());
    if (found) {
      processStudentScan(found);
      setBarcodeInput('');
    } else {
      playWarningAlert(undefined, 'Kode Barcode tidak ditemukan.');
      setScanResult({
        success: false,
        message: `KODE BARCODE TIDAK DIKENALI: '${barcodeInput}' tidak ditemukan di database.`,
      });
      setBarcodeInput('');
    }

    // Auto re-focus input for hardware barcode guns
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Enumerate cameras
  useEffect(() => {
    if (isCameraActive) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Kamera Perangkat ${index + 1}`
          })));
        }
      }).catch((err) => {
        console.warn('Could not enumerate cameras in Piket dashboard:', err);
      });
    }
  }, [isCameraActive]);

  // Camera initialization
  useEffect(() => {
    if (!isCameraActive) {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(console.error);
      }
      setIsScanning(false);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode(qrContainerId);
        }

        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }

        const config = {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        const cameraConstraint = selectedCameraId
          ? selectedCameraId
          : { facingMode };

        await html5QrcodeRef.current.start(
          cameraConstraint,
          config,
          (decodedText) => {
            if (isMounted) handleScanSuccess(decodedText);
          },
          () => {}
        );

        if (isMounted) setIsScanning(true);
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera access warning:', err);
          setCameraError('Kamera tidak tersedia atau tidak diizinkan di browser ini. Gunakan Input Barcode Hardware / Manual di bawah.');
          setIsScanning(false);
        }
      }
    };

    const timeoutId = setTimeout(startScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(console.error);
        }
      }
    };
  }, [isCameraActive, facingMode, selectedCameraId, handleScanSuccess]);

  // Today stats for Datang & Pulang
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPiketRecords = records.filter(r => r.date === todayStr && (r.activityCode === 'DATANG' || r.activityCode === 'PULANG'));
  const todayDatangCount = records.filter(r => r.date === todayStr && r.activityCode === 'DATANG').length;
  const todayPulangCount = records.filter(r => r.date === todayStr && r.activityCode === 'PULANG').length;
  const todayTerlambatCount = records.filter(r => r.date === todayStr && r.activityCode === 'DATANG' && r.status === 'terlambat').length;

  // Filtered records list for display
  const filteredRecords = todayPiketRecords.filter(r => {
    const matchSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner Guru Piket */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/80 via-slate-900 to-emerald-950 border border-indigo-500/30 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Portal Guru Piket Sekolah</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activePiketTab === 'scanner' ? 'Kios Pemindaian Barcode & QR Siswa' : 'Laporan Terintegrasi Guru Piket'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {activePiketTab === 'scanner'
                ? 'Fasilitas khusus Guru Piket untuk mencatat Presensi Jam Datang Pagi & Jam Pulang Siswa secara realtime.'
                : 'Koneksi laporan terpadu antara hasil pemindaian Guru Piket, Guru Agama (Sholat), dan Wali Kelas (Verifikasi Izin).'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">TANGGAL HARI INI</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Scanner vs Integrated Report) */}
      <div className="flex items-center bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setActivePiketTab('scanner')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
            activePiketTab === 'scanner'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Pemindaian Kios Barcode</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePiketTab('report')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
            activePiketTab === 'report'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Laporan Terintegrasi (Piket, Agama, Wali Kelas)</span>
        </button>
      </div>

      {activePiketTab === 'report' ? (
        <IntegratedAttendanceReport
          classes={classes}
          activities={activities}
          students={students}
          records={records}
          permits={permits}
          schoolConfig={schoolConfig}
          userRole="guru_piket"
          onOpenExportModal={onOpenExportModal}
        />
      ) : (
        <>

      {/* Activity Mode Selector (DATANG vs PULANG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setSelectedActivityCode('DATANG');
            setScanResult(null);
          }}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer text-left ${
            selectedActivityCode === 'DATANG'
              ? 'bg-emerald-500/20 border-emerald-500 ring-4 ring-emerald-500/20 shadow-xl'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              selectedActivityCode === 'DATANG'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">PILIHAN KEGIATAN #1</div>
              <div className="text-lg font-black text-white">1. Presensi Jam Datang Pagi</div>
              <div className="text-xs text-slate-400">Jam Masuk Sekolah (Batas Toleransi: 07:15 WITA)</div>
            </div>
          </div>
          {selectedActivityCode === 'DATANG' && (
            <span className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          )}
        </button>

        <button
          onClick={() => {
            setSelectedActivityCode('PULANG');
            setScanResult(null);
          }}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer text-left ${
            selectedActivityCode === 'PULANG'
              ? 'bg-blue-500/20 border-blue-500 ring-4 ring-blue-500/20 shadow-xl'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              selectedActivityCode === 'PULANG'
                ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-blue-400">PILIHAN KEGIATAN #2</div>
              <div className="text-lg font-black text-white">2. Presensi Jam Pulang Sekolah</div>
              <div className="text-xs text-slate-400">Pencatatan Waktu Kepulangan Siswa</div>
            </div>
          </div>
          {selectedActivityCode === 'PULANG' && (
            <span className="w-4 h-4 rounded-full bg-blue-400 animate-pulse shrink-0" />
          )}
        </button>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Scanner & Barcode Hardware Input */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-extrabold text-sm text-white">Pemindai Barcode Kamera / Hardware</span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isCameraActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{isCameraActive ? 'Matikan Kamera' : 'Aktifkan Kamera'}</span>
              </button>
            </div>
          </div>

          {/* Menu Pilih & Ganti Kamera Depan / Belakang */}
          {isCameraActive && (
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <SwitchCamera className="w-4 h-4 text-emerald-400" />
                  <span>Menu Ganti Kamera:</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  {selectedCameraId
                    ? 'Kamera Perangkat Spesifik'
                    : facingMode === 'user'
                    ? '🤳 Kamera Depan (Selfie)'
                    : '📷 Kamera Belakang (Utama)'}
                </span>
              </div>

              {/* Quick Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCameraId('');
                    setFacingMode('user');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    !selectedCameraId && facingMode === 'user'
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span>🤳 Kamera Depan (Selfie)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCameraId('');
                    setFacingMode('environment');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    !selectedCameraId && facingMode === 'environment'
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span>📷 Kamera Belakang (Utama)</span>
                </button>
              </div>

              {/* Hardware Device Selection if multiple cameras present */}
              {availableCameras.length > 0 && (
                <div>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Spesifik Perangkat Kamera --</option>
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        📷 {cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Camera Stream Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-video flex items-center justify-center">
            {/* HTML5 QrCode Container */}
            <div
              id={qrContainerId}
              className={`w-full h-full ${!isCameraActive || cameraError ? 'hidden' : 'block'}`}
            />

            {/* Overlay Grid lines when active */}
            {isCameraActive && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-lg" />
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <span className="mt-3 px-3 py-1 bg-slate-950/80 text-emerald-300 font-mono text-[10px] rounded-full border border-emerald-500/30">
                  Arahkan QR Code / Barcode Kartu Siswa Ke Kotak Pemindai
                </span>
              </div>
            )}

            {/* Camera Off / Error State */}
            {(!isCameraActive || cameraError) && (
              <div className="p-6 text-center space-y-3 text-slate-400">
                <CameraOff className="w-12 h-12 mx-auto text-slate-600" />
                <div>
                  <p className="font-bold text-slate-300 text-sm">
                    {cameraError || 'Kamera Pemindai Nonaktif.'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Gunakan slot input USB Barcode Gun Hardware atau Simulasi Scan di bawah ini.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* USB Barcode Hardware Scanner Box */}
          <form onSubmit={handleManualBarcodeSubmit} className="space-y-2 pt-1">
            <label className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Barcode className="w-4 h-4 text-indigo-400" />
                <span>Input Barcode Gun USB / Ketik NISN/NIS Siswa</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tekan Enter untuk Absen</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan dengan Barcode Gun USB atau ketik NISN / NIS..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-indigo-500/40 rounded-2xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  autoFocus
                />
                <Barcode className="w-5 h-5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all cursor-pointer shrink-0 flex items-center space-x-1"
              >
                <Zap className="w-4 h-4" />
                <span>Absenkan</span>
              </button>
            </div>
          </form>

          {/* Simulation Demo Button */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">Tidak membawa kartu fisik?</span>
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulasi Scan Siswa (Demo)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Scan Result Alert Banner & Quick Today Stats */}
        <div className="lg:col-span-5 space-y-5">
          {/* Scan Feedback Banner */}
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-xs text-white uppercase tracking-wider">Hasil Pemindaian Terakhir</span>
              </div>
              {scanResult && (
                <button
                  onClick={() => setScanResult(null)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Tutup Banner
                </button>
              )}
            </div>

            {scanResult ? (
              <div className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
                scanResult.success
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {scanResult.success ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-white">
                        {scanResult.studentName || 'Hasil Pemindaian'}
                      </span>
                      {scanResult.className && (
                        <span className="px-2 py-0.5 bg-slate-950/80 border border-white/10 text-white font-extrabold text-[10px] rounded-lg">
                          {scanResult.className}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed">
                      {scanResult.message}
                    </p>
                    {scanResult.time && (
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                        <span className="text-slate-300">Waktu: <strong>{scanResult.time} WITA</strong></span>
                        <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${
                          scanResult.status === 'terlambat' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {scanResult.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/50 border border-dashed border-white/10 rounded-2xl text-slate-500 space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-400">Siap menerima pemindaian barcode / QR code siswa...</p>
                <p className="text-[11px] text-slate-500">Silakan dekatkan kartu pelajar siswa ke kamera atau scan NISN.</p>
              </div>
            )}
          </div>

          {/* Today Summary Widgets */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-extrabold text-emerald-400">Presensi Datang</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{todayDatangCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Siswa Masuk</div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-extrabold text-blue-400">Presensi Pulang</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{todayPulangCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Siswa Pulang</div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-extrabold text-amber-400">Siswa Terlambat</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">{todayTerlambatCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Jam Pagi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Table: Today Scanned Students Log */}
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Log Riwayat Presensi Guru Piket Hari Ini</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar siswa yang telah dipindai untuk jam datang & jam pulang hari ini ({filteredRecords.length} Data)
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa atau kelas..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Belum ada riwayat presensi yang dipindai hari ini.</p>
            <p className="text-xs text-slate-500">Pindai kartu siswa menggunakan kamera atau barcode gun di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-extrabold">No</th>
                  <th className="px-4 py-3 font-extrabold">Nama Siswa</th>
                  <th className="px-4 py-3 font-extrabold">Kelas</th>
                  <th className="px-4 py-3 font-extrabold">Jenis Presensi</th>
                  <th className="px-4 py-3 font-extrabold">Waktu Scan</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                  <th className="px-4 py-3 font-extrabold">Metode Pemindaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-white/5 transition-all">
                    <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-white">{rec.studentName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px] font-bold">
                        {rec.className}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                        rec.activityCode === 'DATANG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {rec.activityName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{rec.time} WITA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        rec.status === 'terlambat' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center space-x-1 text-slate-400 text-[11px]">
                        <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Barcode / QR Scanner</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Simulation Demo */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Simulasi Scan Kartu Siswa</span>
              </h3>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Pilih Siswa untuk Disimulasikan:</label>
              <select
                value={selectedSimulateStudentId}
                onChange={(e) => setSelectedSimulateStudentId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className}) - NISN: {s.nisn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = students.find(s => s.id === selectedSimulateStudentId);
                  if (target) {
                    processStudentScan(target);
                  }
                  setIsSimulateModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Jalankan Simulasi Scan
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
