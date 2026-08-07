import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, ActivityType, AttendanceRecord } from '../../types';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  Bell,
  Volume2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  activities: ActivityType[];
  records?: AttendanceRecord[];
  onRecordAttendance: (record: Omit<AttendanceRecord, 'id'>) => boolean | void;
}

// Audio & Voice Speech Synthesizer for Attendance Warnings
const playWarningAlert = (studentName?: string, customText?: string) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // Dual-tone warning buzzer sound (Descending warning frequency)
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

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(320, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(140, now + 0.42);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.42);
    }
  } catch (e) {
    console.warn('Audio warning failed', e);
  }

  // Indonesian Text-To-Speech (Speech Synthesis) for loud audible notification
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const spokenMsg = customText || (studentName
        ? `Peringatan! Siswa ${studentName} sudah melakukan presensi hari ini.`
        : 'Peringatan! Siswa sudah absen.');
      const utterance = new SpeechSynthesisUtterance(spokenMsg);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error', err);
    }
  }
};

const playSuccessAlert = (studentName?: string) => {
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
      const spokenMsg = studentName ? `Presensi berhasil, ${studentName}` : 'Presensi berhasil';
      const utterance = new SpeechSynthesisUtterance(spokenMsg);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (err) {}
  }
};

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  activities,
  records = [],
  onRecordAttendance
}) => {
  if (!isOpen) return null;

  const [selectedActivityCode, setSelectedActivityCode] = useState<string>('DATANG');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    time?: string;
    status?: string;
  } | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'qr-reader-viewport';

  const selectedActivity = activities.find(a => a.code === selectedActivityCode) || activities[0];
  const currentStudent = students.find(s => s.id === selectedStudentId);

  // Match scanned QR string to student record
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

  // Execute attendance record logic
  const processAttendanceForStudent = useCallback((targetStudent: Student) => {
    if (!selectedActivity) return;

    // Check gender constraint (e.g. Sholat Jumat for Male students only)
    if (selectedActivity.genderConstraint === 'L' && targetStudent.gender !== 'L') {
      playWarningAlert(targetStudent.name, `Peringatan! ${selectedActivity.name} khusus untuk Siswa Laki-Laki.`);
      setScanResult({
        success: false,
        message: `PERINGATAN: ${selectedActivity.name} khusus untuk Siswa Laki-Laki. ${targetStudent.name} (Perempuan) tidak diwajibkan absensi.`,
        studentName: targetStudent.name,
      });
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Anti-duplicate check
    const existing = records.find(
      r => r.studentId === targetStudent.id &&
           r.date === todayStr &&
           r.activityCode === selectedActivity.code
    );

    if (existing) {
      playWarningAlert(targetStudent.name, `Peringatan! Siswa ${targetStudent.name} sudah absen ${selectedActivity.name} hari ini.`);
      setScanResult({
        success: false,
        message: `PERINGATAN / GAGAL: Siswa '${targetStudent.name}' SUDAH ABSEN untuk '${selectedActivity.name}' hari ini pukul ${existing.time} WIB. Presensi tidak bisa dobel!`,
        studentName: targetStudent.name,
        time: existing.time,
        status: existing.status,
      });
      return;
    }

    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const hourMin = timeStr.substring(0, 5); // HH:mm

    let status: 'hadir' | 'terlambat' = 'hadir';
    if (selectedActivity.endTime && hourMin > selectedActivity.endTime) {
      status = 'terlambat';
    }

    const isSuccess = onRecordAttendance({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      className: targetStudent.className,
      gender: targetStudent.gender,
      date: todayStr,
      activityId: selectedActivity.id,
      activityCode: selectedActivity.code,
      activityName: selectedActivity.name,
      time: timeStr,
      status: status,
      method: 'QR_SCAN',
      notes: status === 'terlambat' ? 'Presensi melewati batas toleransi jam kegiatan' : undefined,
    });

    if (isSuccess === false) {
      playWarningAlert(targetStudent.name, `Peringatan! Siswa ${targetStudent.name} sudah absen.`);
      setScanResult({
        success: false,
        message: `PERINGATAN: Absensi gagal karena data absensi untuk '${targetStudent.name}' sudah ada.`,
        studentName: targetStudent.name,
        time: timeStr,
        status: status,
      });
      return;
    }

    // Success Sound & Result
    playSuccessAlert(targetStudent.name);
    setScanResult({
      success: true,
      message: `PRESENSI BERHASIL DICATAT! Notifikasi WhatsApp/Push telah dikirim ke Orang Tua (${targetStudent.parentName}).`,
      studentName: targetStudent.name,
      time: timeStr,
      status: status,
    });
  }, [selectedActivity, records, onRecordAttendance]);

  // Handle successful scan from HTML5 QR Reader
  const handleScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    // Debounce exact same scan within 3 seconds
    if (decodedText === lastScannedText && (now - lastScanTime) < 3000) {
      return;
    }

    setLastScannedText(decodedText);
    setLastScanTime(now);

    const matchedStudent = findStudentByCode(decodedText);

    if (!matchedStudent) {
      playWarningAlert(undefined, 'Peringatan! Kode QR tidak terdaftar dalam database sekolah.');
      setScanResult({
        success: false,
        message: `QR CODE TIDAK DIKENALI: Kode "${decodedText}" tidak terdaftar dalam database siswa sekolah.`
      });
      return;
    }

    processAttendanceForStudent(matchedStudent);
  }, [findStudentByCode, lastScannedText, lastScanTime, processAttendanceForStudent]);

  // Handle manual test button
  const handleSimulateScan = () => {
    if (!currentStudent) return;
    processAttendanceForStudent(currentStudent);
  };

  // Enumerate cameras when modal opens
  useEffect(() => {
    if (isOpen) {
      Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Kamera Perangkat ${index + 1}`
          })));
        }
      }).catch((err) => {
        console.warn('Could not enumerate cameras:', err);
      });
    }
  }, [isOpen]);

  // Initialize and control HTML5 QR Code scanner
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let isSubscribed = true;

    if (isOpen && isCameraActive) {
      setCameraError(null);
      setIsScanning(true);

      const startScanner = async () => {
        try {
          // Ensure DOM element is present
          const element = document.getElementById(qrContainerId);
          if (!element) return;

          html5Qrcode = new Html5Qrcode(qrContainerId);
          html5QrcodeRef.current = html5Qrcode;

          const cameraConstraint = selectedCameraId
            ? selectedCameraId
            : { facingMode: facingMode };

          await html5Qrcode.start(
            cameraConstraint,
            {
              fps: 10,
              qrbox: { width: 200, height: 200 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (isSubscribed) {
                handleScanSuccess(decodedText);
              }
            },
            () => {
              // Ignore frame-by-frame scanning errors
            }
          );
        } catch (err: any) {
          console.warn('Primary camera start failed:', err);
          if (!isSubscribed) return;

          // Try fallback to standard user camera if environment mode or device ID failed
          try {
            if (html5Qrcode) {
              await html5Qrcode.start(
                { facingMode: 'user' },
                { fps: 10, qrbox: { width: 200, height: 200 } },
                (decodedText) => {
                  if (isSubscribed) {
                    handleScanSuccess(decodedText);
                  }
                },
                () => {}
              );
              return;
            }
          } catch (fallbackErr: any) {
            console.error('All camera attempts failed:', fallbackErr);
            if (isSubscribed) {
              setCameraError('Kamera tidak aktif atau izin kamera ditolak. Pastikan memberikan izin kamera pada browser.');
              setIsScanning(false);
            }
          }
        }
      };

      // Slight delay to ensure modal DOM is fully rendered
      const timeoutId = setTimeout(startScanner, 150);

      return () => {
        isSubscribed = false;
        clearTimeout(timeoutId);
        if (html5QrcodeRef.current) {
          if (html5QrcodeRef.current.isScanning) {
            html5QrcodeRef.current.stop().catch(() => {}).finally(() => {
              html5QrcodeRef.current?.clear();
            });
          } else {
            html5QrcodeRef.current.clear();
          }
        }
      };
    } else {
      setIsScanning(false);
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(() => {}).finally(() => {
            html5QrcodeRef.current?.clear();
          });
        } else {
          html5QrcodeRef.current.clear();
        }
      }
    }
  }, [isOpen, isCameraActive, facingMode, selectedCameraId, handleScanSuccess]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-white/15 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Kios Scan QR Kartu Siswa</h3>
              <p className="text-xs text-slate-300">
                Pemindai Kamera Aktif Real-time untuk Presensi Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setScanResult(null);
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Activity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Pilih Sesi / Jenis Kegiatan Absensi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activities.map((act) => {
                const isSelected = selectedActivityCode === act.code;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setSelectedActivityCode(act.code);
                      setScanResult(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-md'
                        : 'border-white/10 hover:bg-white/10 text-slate-300 font-medium'
                    }`}
                  >
                    <div className="text-xs">{act.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {act.startTime} - {act.endTime}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Special Friday Note */}
            {selectedActivityCode === 'JUMAT' && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Catatan Sholat Jumat:</strong> Khusus untuk Siswa Laki-laki pada hari sekolah / Hari Jumat.
                </span>
              </div>
            )}
          </div>

          {/* Active Camera Frame & Scanner Area */}
          <div className="bg-black/60 rounded-2xl p-4 border border-white/10 relative overflow-hidden flex flex-col items-center space-y-3">
            {/* Camera Controls Bar */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="font-bold text-slate-200">
                  {isScanning ? 'Kamera Pemindai Aktif' : 'Kamera Nonaktif'}
                </span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isCameraActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Aktifkan Kamera</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Menu Ganti Kamera Depan / Belakang */}
            {isCameraActive && (
              <div className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center space-x-1">
                    <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilih / Ganti Kamera:</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
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
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      !selectedCameraId && facingMode === 'user'
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>🤳 Kamera Depan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCameraId('');
                      setFacingMode('environment');
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      !selectedCameraId && facingMode === 'environment'
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>📷 Kamera Belakang</span>
                  </button>
                </div>

                {/* Optional Device Selector Dropdown if multiple cameras detected */}
                {availableCameras.length > 0 && (
                  <div className="pt-1">
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

            {/* Viewport for HTML5 QR Code Camera Stream */}
            {isCameraActive ? (
              <div className="w-full flex flex-col items-center relative">
                <div
                  id={qrContainerId}
                  className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-black min-h-[220px] shadow-inner relative"
                />

                {cameraError && (
                  <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs text-center space-y-2 w-full max-w-sm">
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraActive(false);
                        setTimeout(() => setIsCameraActive(true), 200);
                      }}
                      className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Coba Sambung Ulang Kamera
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-sm h-48 rounded-2xl border-2 border-dashed border-slate-700 bg-white/5 flex flex-col items-center justify-center p-4 text-center">
                <CameraOff className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">
                  Kamera pemindai dimatikan. Klik tombol "Aktifkan Kamera" di atas untuk memindai QR Code via webcam/kamera HP.
                </p>
              </div>
            )}

            {/* Manual Selection Fallback / Simulation */}
            <div className="w-full pt-4 mt-4 border-t border-white/10 space-y-2">
              <label className="block text-[11px] text-slate-300 text-left font-semibold">
                Atau Pilih Siswa Secara Manual (Simulasi Tap Kartu):
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setScanResult(null);
                  }}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.className}) - NISN: {std.nisn} [{std.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}]
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="w-full sm:w-auto shrink-0 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TAP KARTU</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scan Result Alert Feedback */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border text-sm animate-fadeIn ${
                scanResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {scanResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 w-full">
                  <div className="font-bold text-base text-white">
                    {scanResult.success ? 'PRESENSI BERHASIL' : 'PRESENSI GAGAL'}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{scanResult.message}</p>

                  {scanResult.success && (
                    <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-medium text-slate-200">
                      <div>Siswa: <strong className="text-white">{scanResult.studentName}</strong></div>
                      <div>Waktu Tap: <span className="font-mono text-emerald-300">{scanResult.time}</span></div>
                      <div>Status: <span className="uppercase font-bold text-emerald-300">{scanResult.status}</span></div>
                      <div className="flex items-center space-x-1 text-emerald-300">
                        <Bell className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Push Alert Sent</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
