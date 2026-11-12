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
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateKubikasi, formatVolume } from '../../utils/formatters';
import { DEFAULT_MATERIALS } from '../../utils/constants';
import TruckVisualizer from '../../components/common/TruckVisualizer';

export default function SuratJalanPage() {
  const navigate = useNavigate();
  const { preOrders, createSuratJalan } = useData();

  const approvedPos = preOrders.filter((po) => po.status === 'APPROVED');

  // Form state faithfully matching Screenshot 1 ("Buat Good Issue")
  const [formData, setFormData] = useState({
    nomorSj: `296${Math.floor(70 + Math.random() * 29)}`,
    customer: 'PT LION WINGS',
    poNumber: approvedPos[0]?.nomorPo || 'PO-LW-2026-089',
    nomorRo: 'RO-202611-00042',
    materialId: 'mat-2',
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

  const kubikasi = useMemo(() => {
    return calculateKubikasi(
      formData.panjangCm,
      formData.lebarCm,
      formData.tinggiCm,
      formData.koreksiTinggiCm
    );
  }, [formData.panjangCm, formData.lebarCm, formData.tinggiCm, formData.koreksiTinggiCm]);

  const handleKoreksiChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      koreksiTinggiCm: prev.koreksiTinggiCm + delta,
    }));
  };

  const handleApplyPreset = (p, l, t) => {
    setFormData((prev) => ({
      ...prev,
      panjangCm: p,
      lebarCm: l,
      tinggiCm: t,
      koreksiTinggiCm: 0,
    }));
  };

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
    setFormData((prev) => ({
      ...prev,
      nomorSj: String(Number(prev.nomorSj) + 1),
      nomorNota: `NT-${Math.floor(88000 + Math.random() * 999)}`,
    }));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24 relative">
      {/* Top Header Bar matching Screenshot 1 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Buat Good Issue
            </h2>
            <p className="text-[11px] text-neutral-400">
              Surat Jalan pengiriman material & kalkulator kubikasi armada
            </p>
          </div>
        </div>

        {/* PPN Badge Switcher */}
        <label className="text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer bg-[#181818] px-2.5 py-1 rounded border border-[#2D2D2D]">
          <input
            type="checkbox"
            checked={formData.isPpn}
            onChange={(e) => setFormData({ ...formData, isPpn: e.target.checked })}
            className="w-3.5 h-3.5 rounded text-[#F4511E] focus:ring-0"
          />
          <span className="font-mono text-[11px]">Pengiriman PPN (Awalan PPN)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Form Column (7 cols) - Replicating Screenshot 1 */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-[#141414] border border-[#242424] rounded-lg p-3.5 sm:p-5 space-y-3">
          {/* Field 1: Pilih Customer */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              Pilih Customer
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
            >
              <option value="PT LION WINGS">PT LION WINGS</option>
              <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
              <option value="PT PETROKIMIA GRESIK">PT PETROKIMIA GRESIK</option>
            </select>
          </div>

          {/* Field 2: Nomor PO Customer */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-neutral-500" />
              Nomor PO Customer
            </label>
            <select
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono"
            >
              {approvedPos.map((po) => (
                <option key={po.id} value={po.nomorPo || po.id}>
                  {po.nomorPo || '(Menunggu SJ Pertama)'} - {po.customer} ({po.materialName})
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Nomor Surat Jalan & Nomor RO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                Nomor Surat Jalan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.isPpn ? `PPN${formData.nomorSj}` : formData.nomorSj}
                onChange={(e) => setFormData({ ...formData, nomorSj: e.target.value.replace('PPN', '') })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                Nomor RO <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nomorRo}
                onChange={(e) => setFormData({ ...formData, nomorRo: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono"
                required
              />
            </div>
          </div>

          {/* Row 4: Material & Jenis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Box className="w-3.5 h-3.5 text-neutral-500" />
                Material <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                {DEFAULT_MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-neutral-500" />
                Jenis <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                <option value="Jasa Angkut + Material">Jasa Angkut + Material</option>
                <option value="Material Curah">Material Curah Saja</option>
                <option value="Jasa Angkut Saja">Jasa Angkut Saja</option>
              </select>
            </div>
          </div>

          {/* Row 5: Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                Waktu
              </label>
              <input
                type="time"
                value={formData.waktu}
                onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              />
            </div>
          </div>

          {/* Row 6: Nomor Nota & Nomor Polisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                Nomor Nota
              </label>
              <input
                type="text"
                placeholder="Contoh: NT-88921"
                value={formData.nomorNota}
                onChange={(e) => setFormData({ ...formData, nomorNota: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-neutral-500" />
                Nomor Polisi Armada
              </label>
              <select
                value={formData.nomorPolisi}
                onChange={(e) => setFormData({ ...formData, nomorPolisi: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono font-bold"
              >
                <option value="W 9821 UB">W 9821 UB (Hino 500 - Tronton)</option>
                <option value="W 8812 UA">W 8812 UA (Fuso Fighter - Index 24)</option>
                <option value="L 9021 UT">L 9021 UT (Isuzu Giga)</option>
                <option value="W 7710 UX">W 7710 UX (Colt Diesel)</option>
              </select>
            </div>
          </div>

          {/* TRUCK DIMENSIONS SECTION (Screenshot 1) */}
          <div className="pt-2 border-t border-[#222222] space-y-2.5">
            {/* Koreksi Tinggi Stepper */}
            <div className="flex items-center justify-between p-2.5 rounded bg-[#181818] border border-[#282828]">
              <div className="text-xs text-neutral-300 font-medium">
                Koreksi Tinggi (K): <span className="font-mono font-bold text-white ml-1">{formData.koreksiTinggiCm} cm</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleKoreksiChange(-5)}
                  className="w-7 h-7 rounded bg-[#242424] hover:bg-[#F4511E] text-white flex items-center justify-center transition-colors"
                  title="Kurangi 5 cm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleKoreksiChange(5)}
                  className="w-7 h-7 rounded bg-[#242424] hover:bg-[#F4511E] text-white flex items-center justify-center transition-colors"
                  title="Tambah 5 cm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tinggi Hasil Koreksi (TK) Header from Screenshot 1 */}
            <div className="text-xs font-semibold text-neutral-300">
              Tinggi Hasil Koreksi (TK): <span className="text-[#F4511E] font-mono font-bold">{kubikasi.tinggiHasilKoreksi} cm</span>
            </div>

            {/* 3 Dimension Inputs: P, L, T */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#181818] border border-[#282828] rounded p-2 text-center">
                <span className="block text-[10px] text-neutral-400 mb-0.5">Panjang (P) *</span>
                <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                  <input
                    type="number"
                    value={formData.panjangCm}
                    onChange={(e) => setFormData({ ...formData, panjangCm: Number(e.target.value) })}
                    className="w-14 bg-transparent text-center focus:outline-none border-b border-[#444] focus:border-[#F4511E]"
                  />
                  <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#282828] rounded p-2 text-center">
                <span className="block text-[10px] text-neutral-400 mb-0.5">Lebar (L) *</span>
                <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                  <input
                    type="number"
                    value={formData.lebarCm}
                    onChange={(e) => setFormData({ ...formData, lebarCm: Number(e.target.value) })}
                    className="w-14 bg-transparent text-center focus:outline-none border-b border-[#444] focus:border-[#F4511E]"
                  />
                  <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#282828] rounded p-2 text-center">
                <span className="block text-[10px] text-neutral-400 mb-0.5">Tinggi (T) *</span>
                <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                  <input
                    type="number"
                    value={formData.tinggiCm}
                    onChange={(e) => setFormData({ ...formData, tinggiCm: Number(e.target.value) })}
                    className="w-14 bg-transparent text-center focus:outline-none border-b border-[#444] focus:border-[#F4511E]"
                  />
                  <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                </div>
              </div>
            </div>

            {/* Results: Kubikasi Default & Akhir */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#181818] border border-[#282828] rounded p-2.5">
                <span className="block text-[10px] text-neutral-400 mb-0.5">Kubikasi Default</span>
                <div className="text-base font-bold font-mono text-neutral-300">
                  {kubikasi.volumeDefault} <span className="text-[10px] text-neutral-500 font-normal">m3</span>
                </div>
              </div>

              <div className="bg-[#1C1613] border border-[#F4511E]/40 rounded p-2.5">
                <span className="block text-[10px] text-orange-400/90 mb-0.5 font-medium">Kubikasi Akhir</span>
                <div className="text-base font-bold font-mono text-[#F4511E]">
                  {kubikasi.volumeAkhir} <span className="text-[10px] text-orange-400 font-normal">m3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Foto Surat Jalan */}
          <div className="pt-2">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-neutral-500" />
              Foto Bukti Fisik Surat Jalan
            </label>
            <div className="border border-dashed border-[#333] hover:border-[#F4511E] rounded p-2.5 text-center cursor-pointer transition-colors bg-[#111]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="foto-sj-input"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="foto-sj-input" className="cursor-pointer block text-xs">
                {formData.fotoPreview ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={formData.fotoPreview}
                      alt="Bukti SJ"
                      className="w-12 h-12 object-cover rounded border border-[#333]"
                    />
                    <div className="text-left font-mono text-xs">
                      <span className="text-emerald-400 font-bold block">✓ {formData.fotoSuratJalan}</span>
                      <span className="text-[10px] text-neutral-400">Klik untuk mengganti</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-neutral-400 hover:text-white">
                    Unggah / Ambil Foto Bukti Surat Jalan
                  </span>
                )}
              </label>
            </div>
          </div>
        </form>

        {/* Right Column (5 cols) - Technical Blueprint & Dispatch Summary */}
        <div className="lg:col-span-5 space-y-3">
          <TruckVisualizer
            panjangCm={formData.panjangCm}
            lebarCm={formData.lebarCm}
            tinggiCm={formData.tinggiCm}
            koreksiCm={formData.koreksiTinggiCm}
            onApplyPreset={handleApplyPreset}
          />

          <div className="bg-[#141414] border border-[#242424] rounded-lg p-3 space-y-2.5">
            <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
              Verifikasi Kiriman
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-neutral-500">Nopol:</span>
                <span className="font-mono font-bold text-neutral-200">{formData.nomorPolisi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-neutral-500">Customer:</span>
                <span className="text-neutral-200">{formData.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202020]">
                <span className="text-neutral-500">No. PO:</span>
                <span className="font-mono text-neutral-300">{formData.poNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-[#2A2A2A] items-baseline font-mono">
                <span className="font-semibold text-neutral-300">Volume Riil:</span>
                <span className="text-base font-bold text-[#F4511E]">
                  {formatVolume(kubikasi.volumeAkhir)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 rounded bg-[#F4511E] hover:bg-[#D84315] text-white font-bold text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Good Issue
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) matching Screenshot 1 */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-12 h-12 rounded-full bg-[#F4511E] hover:bg-[#D84315] text-white flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all"
          title="Simpan Good Issue"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
