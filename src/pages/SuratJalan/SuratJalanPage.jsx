import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Ticket,
  Box,
  Monitor,
  Calendar,
  Clock,
  FileText,
  Truck,
  Plus,
  Minus,
  Save,
  Camera,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateKubikasi, formatVolume } from '../../utils/formatters';
import { DEFAULT_MATERIALS } from '../../utils/constants';
import TruckVisualizer from '../../components/common/TruckVisualizer';

export default function SuratJalanPage() {
  const navigate = useNavigate();
  const { preOrders, createSuratJalan } = useData();

  // Active approved POs list
  const approvedPos = preOrders.filter((po) => po.status === 'APPROVED');

  // Form state faithfully replicating Screenshot 1 ("Buat Good Issue")
  const [formData, setFormData] = useState({
    nomorSj: `296${Math.floor(70 + Math.random() * 29)}`,
    customer: 'PT LION WINGS',
    poNumber: approvedPos[0]?.nomorPo || 'PO-LW-2026-089',
    nomorRo: 'RO-202611-00042',
    materialId: 'mat-2', // Sirtu Curah
    jenis: 'Jasa Angkut + Material',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:43',
    nomorNota: 'NT-88921',
    nomorPolisi: 'W 9821 UB',
    isPpn: false,
    fotoSuratJalan: null,
    fotoPreview: null,
    // Truck dimensions in cm (from screenshot 1)
    panjangCm: 650,
    lebarCm: 250,
    tinggiCm: 200,
    koreksiTinggiCm: 0,
  });

  // Dynamic Kubikasi calculation
  const kubikasi = useMemo(() => {
    return calculateKubikasi(
      formData.panjangCm,
      formData.lebarCm,
      formData.tinggiCm,
      formData.koreksiTinggiCm
    );
  }, [formData.panjangCm, formData.lebarCm, formData.tinggiCm, formData.koreksiTinggiCm]);

  // Stepper handlers for Koreksi Tinggi (K)
  const handleKoreksiChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      koreksiTinggiCm: prev.koreksiTinggiCm + delta,
    }));
  };

  // Preset armada handler
  const handleApplyPreset = (p, l, t) => {
    setFormData((prev) => ({
      ...prev,
      panjangCm: p,
      lebarCm: l,
      tinggiCm: t,
      koreksiTinggiCm: 0,
    }));
  };

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        fotoSuratJalan: file.name,
        fotoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createSuratJalan(formData);
    // Reset to a new SJ number
    setFormData((prev) => ({
      ...prev,
      nomorSj: String(Number(prev.nomorSj) + 1),
      nomorNota: `NT-${Math.floor(88000 + Math.random() * 999)}`,
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 relative">
      {/* Top Header Bar matching Screenshot 1 */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-white transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Buat Good Issue
            </h2>
            <p className="text-xs text-neutral-400">
              Surat Jalan pengiriman harian material & kalkulator kubikasi armada
            </p>
          </div>
        </div>

        {/* PPN / Non-PPN delivery tag per Aturan 8 */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer bg-[#242424] px-3 py-1.5 rounded-lg border border-[#3C3C3C]">
            <input
              type="checkbox"
              checked={formData.isPpn}
              onChange={(e) => setFormData({ ...formData, isPpn: e.target.checked })}
              className="w-4 h-4 rounded text-[#F4511E] focus:ring-0"
            />
            <span>Pengiriman PPN (Awalan PPN)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column (7 cols) - Replicating Screenshot 1 */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          {/* Field 1: Pilih Customer */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-neutral-400" />
              Pilih Customer
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              <option value="PT LION WINGS">PT LION WINGS</option>
              <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
              <option value="PT PETROKIMIA GRESIK">PT PETROKIMIA GRESIK</option>
            </select>
          </div>

          {/* Field 2: Nomor PO Customer */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-neutral-400" />
              Nomor PO Terkait
            </label>
            <select
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              {approvedPos.map((po) => (
                <option key={po.id} value={po.nomorPo || po.id}>
                  {po.nomorPo || '(Menunggu SJ Pertama)'} - {po.customer} ({po.materialName})
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Nomor Surat Jalan & Nomor RO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-neutral-400" />
                Nomor Surat Jalan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.isPpn ? `PPN${formData.nomorSj}` : formData.nomorSj}
                onChange={(e) => setFormData({ ...formData, nomorSj: e.target.value.replace('PPN', '') })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E] font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-neutral-400" />
                Nomor RO <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nomorRo}
                onChange={(e) => setFormData({ ...formData, nomorRo: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E] font-mono"
                required
              />
            </div>
          </div>

          {/* Row 4: Material & Jenis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-neutral-400" />
                Material <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              >
                {DEFAULT_MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-neutral-400" />
                Jenis <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              >
                <option value="Jasa Angkut + Material">Jasa Angkut + Material</option>
                <option value="Material Curah">Material Curah Saja</option>
                <option value="Jasa Angkut Saja">Jasa Angkut Saja</option>
              </select>
            </div>
          </div>

          {/* Row 5: Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                Waktu
              </label>
              <input
                type="time"
                value={formData.waktu}
                onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              />
            </div>
          </div>

          {/* Row 6: Nomor Nota & Nomor Polisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-neutral-400" />
                Nomor Nota
              </label>
              <input
                type="text"
                placeholder="Contoh: NT-88921"
                value={formData.nomorNota}
                onChange={(e) => setFormData({ ...formData, nomorNota: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-neutral-400" />
                Nomor Polisi Armada
              </label>
              <select
                value={formData.nomorPolisi}
                onChange={(e) => setFormData({ ...formData, nomorPolisi: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E] uppercase font-mono font-bold"
              >
                <option value="W 9821 UB">W 9821 UB (Hino 500 - Tronton)</option>
                <option value="W 8812 UA">W 8812 UA (Fuso Fighter - Index 24)</option>
                <option value="L 9021 UT">L 9021 UT (Isuzu Giga)</option>
                <option value="W 7710 UX">W 7710 UX (Colt Diesel)</option>
              </select>
            </div>
          </div>

          {/* Stepper Koreksi Tinggi (K) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-3.5 rounded-xl bg-[#222] border border-[#333]">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span>Koreksi Tinggi (K)</span>
              <span className="font-mono font-semibold text-white">{formData.koreksiTinggiCm} cm</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleKoreksiChange(-5)}
                className="w-9 h-9 rounded-lg bg-[#2D2D2D] hover:bg-[#F4511E] text-white flex items-center justify-center font-bold text-base transition-colors"
                title="Kurangi 5 cm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleKoreksiChange(5)}
                className="w-9 h-9 rounded-lg bg-[#2D2D2D] hover:bg-[#F4511E] text-white flex items-center justify-center font-bold text-base transition-colors"
                title="Tambah 5 cm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#242424] border border-[#3A3A3A] rounded-xl p-3 text-center">
              <span className="block text-[11px] text-neutral-400 mb-1">Panjang (P) *</span>
              <div className="flex items-center justify-center gap-1 font-mono font-bold text-white text-base">
                <input
                  type="number"
                  value={formData.panjangCm}
                  onChange={(e) => setFormData({ ...formData, panjangCm: Number(e.target.value) })}
                  className="w-16 bg-transparent text-center focus:outline-none text-white border-b border-[#555] focus:border-[#F4511E]"
                />
                <span className="text-xs text-neutral-400 font-normal">cm</span>
              </div>
            </div>

            <div className="bg-[#242424] border border-[#3A3A3A] rounded-xl p-3 text-center">
              <span className="block text-[11px] text-neutral-400 mb-1">Lebar (L) *</span>
              <div className="flex items-center justify-center gap-1 font-mono font-bold text-white text-base">
                <input
                  type="number"
                  value={formData.lebarCm}
                  onChange={(e) => setFormData({ ...formData, lebarCm: Number(e.target.value) })}
                  className="w-16 bg-transparent text-center focus:outline-none text-white border-b border-[#555] focus:border-[#F4511E]"
                />
                <span className="text-xs text-neutral-400 font-normal">cm</span>
              </div>
            </div>

            <div className="bg-[#242424] border border-[#3A3A3A] rounded-xl p-3 text-center">
              <span className="block text-[11px] text-neutral-400 mb-1">Tinggi (T) *</span>
              <div className="flex items-center justify-center gap-1 font-mono font-bold text-white text-base">
                <input
                  type="number"
                  value={formData.tinggiCm}
                  onChange={(e) => setFormData({ ...formData, tinggiCm: Number(e.target.value) })}
                  className="w-16 bg-transparent text-center focus:outline-none text-white border-b border-[#555] focus:border-[#F4511E]"
                />
                <span className="text-xs text-neutral-400 font-normal">cm</span>
              </div>
            </div>
          </div>

          {/* Upload Foto Surat Jalan with live preview thumbnail */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-neutral-400" />
              Foto Bukti Surat Jalan Fisik (Disimpan di arsip dokumen)
            </label>
            <div className="border-2 border-dashed border-[#3C3C3C] hover:border-[#F4511E] rounded-xl p-3 text-center cursor-pointer transition-colors bg-[#202020]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="foto-sj-input"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="foto-sj-input" className="cursor-pointer block">
                {formData.fotoPreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={formData.fotoPreview}
                      alt="Preview Bukti SJ"
                      className="w-16 h-16 object-cover rounded-lg border border-[#444]"
                    />
                    <div className="text-left">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Foto Bukti Terunggah
                      </span>
                      <span className="text-[11px] text-neutral-400 block">{formData.fotoSuratJalan}</span>
                      <span className="text-[10px] text-orange-400">Klik untuk mengganti foto</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 mx-auto text-neutral-400 mb-1" />
                    <span className="text-xs font-medium text-neutral-300">
                      Ambil Foto / Unggah Berkas Bukti Surat Jalan
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>
        </form>

        {/* Right Column (5 cols) - Interactive Visualizer & Metrics */}
        <div className="lg:col-span-5 space-y-4">
          <TruckVisualizer
            panjangCm={formData.panjangCm}
            lebarCm={formData.lebarCm}
            tinggiCm={formData.tinggiCm}
            koreksiCm={formData.koreksiTinggiCm}
            onApplyPreset={handleApplyPreset}
          />

          {/* Quick Summary Card */}
          <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Ringkasan Kiriman Armada
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#282828]">
                <span className="text-neutral-400">Armada / Nopol:</span>
                <span className="font-mono font-bold text-white">{formData.nomorPolisi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#282828]">
                <span className="text-neutral-400">Customer:</span>
                <span className="font-medium text-white">{formData.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#282828]">
                <span className="text-neutral-400">Material:</span>
                <span className="text-neutral-200">Sirtu Curah</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-[#333] items-baseline">
                <span className="font-semibold text-white">Kubikasi Akhir:</span>
                <span className="text-lg font-bold font-mono text-[#F4511E]">
                  {formatVolume(kubikasi.volumeAkhir)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Simpan Good Issue (Surat Jalan)
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) matching Screenshot 1 */}
      <div className="fixed bottom-8 right-8 z-30">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#E64A19] text-white flex items-center justify-center shadow-2xl shadow-orange-950/70 transform hover:scale-110 active:scale-95 transition-all"
          title="Simpan Good Issue (Surat Jalan)"
        >
          <Save className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
