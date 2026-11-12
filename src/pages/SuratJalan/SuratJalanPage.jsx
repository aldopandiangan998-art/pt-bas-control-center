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
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { calculateKubikasi, formatVolume } from '../../utils/formatters';
import { DEFAULT_MATERIALS } from '../../utils/constants';

export default function SuratJalanPage() {
  const navigate = useNavigate();

  // Form state faithfully replicating Screenshot 1 ("Buat Good Issue")
  const [formData, setFormData] = useState({
    customer: 'PT LION WINGS',
    nomorPoCustomer: 'PO-LW-2026-089',
    nomorRo: 'RO-202611-00042',
    materialId: 'mat-2', // Sirtu Curah
    jenis: 'Jasa Angkut + Material',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:43',
    nomorNota: 'NT-88921',
    nomorPolisi: 'W 9821 UB',
    isPpn: false, // PPN or Non-PPN delivery
    fotoSuratJalan: null,
    // Truck dimensions in cm (from screenshot 1)
    panjangCm: 650,
    lebarCm: 250,
    tinggiCm: 200,
    koreksiTinggiCm: 0,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 relative">
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
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold">Surat Jalan Berhasil Disimpan!</div>
            <div className="text-xs text-emerald-300">
              Volume tercatat: <strong>{formatVolume(kubikasi.volumeAkhir)}</strong>. Nomor Surat Jalan terdaftar ke Pre Order.
            </div>
          </div>
        </div>
      )}

      {/* Main Form container reproducing the dark UI styling from Screenshot 1 */}
      <form onSubmit={handleSubmit} className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
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
            Nomor PO Customer
          </label>
          <select
            value={formData.nomorPoCustomer}
            onChange={(e) => setFormData({ ...formData, nomorPoCustomer: e.target.value })}
            className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
          >
            <option value="PO-LW-2026-089">PO-LW-2026-089 (Sirtu Curah - 500 m³)</option>
            <option value="PO-SI-2026-104">PO-SI-2026-104 (Limestone Padat - 1,200 m³)</option>
          </select>
        </div>

        {/* Field 3: Nomor RO */}
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
            <input
              type="text"
              placeholder="Contoh: W 9821 UB"
              value={formData.nomorPolisi}
              onChange={(e) => setFormData({ ...formData, nomorPolisi: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E] uppercase font-mono"
            />
          </div>
        </div>

        {/* TRUCK DIMENSION & KUBIKASI CALCULATOR (Identical to Screenshot 1) */}
        <div className="pt-2">
          {/* Koreksi Tinggi Stepper */}
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

          {/* Section Indicator: Tinggi Hasil Koreksi (TK) */}
          <div className="text-sm font-semibold text-neutral-200 mt-4 mb-2">
            Tinggi Hasil Koreksi (TK): <span className="text-[#F4511E] font-bold">{kubikasi.tinggiHasilKoreksi} cm</span>
          </div>

          {/* Dimensions: Panjang (P), Lebar (L), Tinggi (T) */}
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

          {/* Results: Kubikasi Default & Kubikasi Akhir */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-[#222] border border-[#333] rounded-xl p-3.5">
              <span className="block text-[11px] text-neutral-400 mb-1">Kubikasi Default</span>
              <div className="text-xl font-bold font-mono text-neutral-300">
                {kubikasi.volumeDefault} <span className="text-xs font-normal text-neutral-500">m³</span>
              </div>
            </div>

            <div className="bg-[#2A1E18] border border-[#F4511E]/40 rounded-xl p-3.5">
              <span className="block text-[11px] text-orange-300/80 mb-1">Kubikasi Akhir</span>
              <div className="text-xl font-bold font-mono text-[#F4511E]">
                {kubikasi.volumeAkhir} <span className="text-xs font-normal text-orange-400">m³</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Foto Surat Jalan (Implementation Plan Section 2, Aturan 12) */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-neutral-400" />
            Foto Bukti Surat Jalan (Disimpan sebagai bukti pengiriman fisik)
          </label>
          <div className="border-2 border-dashed border-[#3C3C3C] hover:border-[#F4511E] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#202020]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="foto-sj-input"
              onChange={(e) => setFormData({ ...formData, fotoSuratJalan: e.target.files[0]?.name })}
            />
            <label htmlFor="foto-sj-input" className="cursor-pointer block">
              <Camera className="w-7 h-7 mx-auto text-neutral-400 mb-1.5" />
              <span className="text-xs font-medium text-neutral-300">
                {formData.fotoSuratJalan ? formData.fotoSuratJalan : 'Klik untuk mengambil foto / unggah berkas surat jalan'}
              </span>
              <span className="block text-[10px] text-neutral-500 mt-0.5">Mendukung format JPG, PNG</span>
            </label>
          </div>
        </div>
      </form>

      {/* Floating Action Button (FAB) matching Screenshot 1 bottom right */}
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
