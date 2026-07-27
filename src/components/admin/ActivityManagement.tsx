import React, { useState } from 'react';
import { ActivityType } from '../../types';
import { Clock, Plus, Edit, Trash2, CheckCircle2, AlertTriangle, Moon, Calendar } from 'lucide-react';

interface ActivityManagementProps {
  activities: ActivityType[];
  onUpdateActivities: (activities: ActivityType[]) => void;
}

export const ActivityManagement: React.FC<ActivityManagementProps> = ({
  activities,
  onUpdateActivities
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:15');
  const [genderConstraint, setGenderConstraint] = useState<'ALL' | 'L' | 'P'>('ALL');

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setCode(`ACT_${Date.now().toString().slice(-4)}`);
    setName('');
    setStartTime('07:00');
    setEndTime('07:30');
    setGenderConstraint('ALL');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: ActivityType) => {
    setEditingActivity(act);
    setCode(act.code);
    setName(act.name);
    setStartTime(act.startTime);
    setEndTime(act.endTime);
    setGenderConstraint(act.genderConstraint || 'ALL');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    if (editingActivity) {
      const updated = activities.map(a =>
        a.id === editingActivity.id
          ? {
              ...a,
              code,
              name,
              startTime,
              endTime,
              genderConstraint,
            }
          : a
      );
      onUpdateActivities(updated);
    } else {
      const newAct: ActivityType = {
        id: `act-${Date.now()}`,
        code,
        name,
        startTime,
        endTime,
        genderConstraint,
        dayConstraint: genderConstraint === 'L' ? [5] : [1, 2, 3, 4, 5],
        isActive: true,
        isRequired: true,
      };
      onUpdateActivities([...activities, newAct]);
    }

    setIsModalOpen(false);
  };

  const toggleActive = (id: string) => {
    const updated = activities.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    onUpdateActivities(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Pengelolaan Sesi & Jenis Kegiatan Absensi</h2>
          <p className="text-xs text-slate-300 mt-1">
            Atur jam kehadiran Jam Datang, Sholat Dzuhur Berjamaah, Sholat Jumat (Siswa Laki-Laki), dan Jam Pulang.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Tambah Kegiatan Baru</span>
        </button>
      </div>

      {/* Activity Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className={`p-5 rounded-2xl border transition-all ${
              act.isActive
                ? 'bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:bg-white/10'
                : 'bg-white/5 opacity-50 border-white/5'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl font-bold text-xs shrink-0 border ${
                  act.code === 'JUMAT'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : act.code === 'DZUHUR'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-base text-white leading-tight">
                    {act.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Kode: <strong>{act.code}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenEdit(act)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Kegiatan"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Waktu Absensi:</span>
                <span className="font-bold font-mono text-white text-sm">
                  {act.startTime} - {act.endTime} WIB
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Aturan Peserta:</span>
                <span className="font-bold text-slate-200">
                  {act.genderConstraint === 'L' ? (
                    <span className="text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                      Khusus Siswa Laki-Laki
                    </span>
                  ) : act.genderConstraint === 'P' ? (
                    <span className="text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded border border-pink-500/30 text-[11px]">
                      Khusus Siswa Perempuan
                    </span>
                  ) : (
                    <span className="text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                      Seluruh Siswa (L/P)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hari: {act.dayConstraint?.includes(5) && act.dayConstraint.length === 1 ? 'Khusus Hari Jumat' : 'Hari Sekolah (Senin - Jumat)'}</span>
              </span>

              <button
                onClick={() => toggleActive(act.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                  act.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/10 text-slate-400 border-white/10'
                }`}
              >
                {act.isActive ? 'Status: Aktif' : 'Status: Non-Aktif'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-white/15 w-full max-w-md overflow-hidden text-white">
            <div className="bg-white/5 p-5 flex items-center justify-between border-b border-white/10">
              <h3 className="font-bold text-base">
                {editingActivity ? 'Edit Sesi Absensi' : 'Tambah Sesi Absensi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Kegiatan (Unik):
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Sesi Kegiatan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sholat Jumat Berjamaah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jam Mulai (HH:mm):
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jam Selesai (Batas Toleransi):
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Aturan Khusus Gender:
                </label>
                <select
                  value={genderConstraint}
                  onChange={(e) => setGenderConstraint(e.target.value as 'ALL' | 'L' | 'P')}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="ALL">Semua Siswa (Laki-laki & Perempuan)</option>
                  <option value="L">Khusus Siswa Laki-Laki (e.g. Sholat Jumat)</option>
                  <option value="P">Khusus Siswa Perempuan</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 text-xs font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Simpan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
