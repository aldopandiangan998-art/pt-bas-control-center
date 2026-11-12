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
import TruckVisualizer from '../../components/common/TruckVisualizer';
import { Button, Badge, Card, CardHeader, CardTitle, Input, Select } from '../../components/ui';

export default function SuratJalanPage() {
  const navigate = useNavigate();
  const { preOrders, createSuratJalan, materials, armadaList, customers } = useData();

  const approvedPos = preOrders.filter((po) => po.status === 'APPROVED');

  // Form state faithfully matching Screenshot 1 ("Buat Good Issue")
  const [formData, setFormData] = useState({
    nomorSj: `296${Math.floor(70 + Math.random() * 29)}`,
    customer: 'PT LION WINGS',
    poNumber: approvedPos[0]?.nomorPo || 'PO-LW-2026-089',
    nomorRo: 'RO-202611-00042',
    materialId: 'mat-8',
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

    const selectedMat = materials.find((m) => m.id === formData.materialId);

    createSuratJalan({
      ...formData,
      material: selectedMat?.name || 'SIRTU',
      volumeAkhir: kubikasi.volumeAkhir,
      driver: 'Supir Armada Terjadwal',
    });

    // Reset form with new SJ number
    setFormData((prev) => ({
      ...prev,
      nomorSj: `296${Math.floor(70 + Math.random() * 29)}`,
      fotoSuratJalan: null,
      fotoPreview: null,
      koreksiTinggiCm: 0,
    }));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            title="Kembali ke Dashboard"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Buat Good Issue (Surat Jalan)</span>
              <Badge size="xs" variant="primary">Pencatatan Ritase</Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Kalkulator kubikasi bak dump truck otomatis P &times; L &times; (T + K) / 1.000.000
            </p>
          </div>
        </div>

        {/* PPN Toggle Switch matching screenshot */}
        <div className="flex items-center gap-2 bg-[#131517] border border-[#24282C] px-3 py-1.5 rounded-md">
          <span className="text-[11px] text-neutral-300 font-mono font-medium">Format PPN:</span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPpn: !formData.isPpn })}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              formData.isPpn ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                formData.isPpn ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form Column (7 cols) - Replicating Screenshot 1 */}
        <Card className="lg:col-span-7 p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Field 1: Pilih Customer */}
            <Select
              label="Pilih Customer"
              icon={User}
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                </option>
              ))}
            </Select>

            {/* Field 2: Nomor PO Customer */}
            <Select
              label="Nomor PO Customer"
              icon={Ticket}
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            >
              {approvedPos.map((po) => (
                <option key={po.id} value={po.nomorPo || po.id}>
                  {po.nomorPo || '(Menunggu SJ Pertama)'} - {po.customer} ({po.materialName})
                </option>
              ))}
            </Select>

            {/* Field 3: Nomor Surat Jalan & Nomor RO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor Surat Jalan"
                icon={Ticket}
                required
                value={formData.isPpn ? `PPN${formData.nomorSj}` : formData.nomorSj}
                onChange={(e) =>
                  setFormData({ ...formData, nomorSj: e.target.value.replace('PPN', '') })
                }
                className="font-mono font-bold"
              />

              <Input
                label="Nomor RO"
                icon={Ticket}
                required
                value={formData.nomorRo}
                onChange={(e) => setFormData({ ...formData, nomorRo: e.target.value })}
                className="font-mono"
              />
            </div>

            {/* Row 4: Material & Jenis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Material"
                icon={Box}
                required
                value={formData.materialId}
                onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.satuan}) - PPH {m.pphRate}%
                  </option>
                ))}
              </Select>

              <Select
                label="Jenis Layanan"
                icon={Monitor}
                required
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
              >
                <option value="Jasa Angkut + Material">Jasa Angkut + Material</option>
                <option value="Material Curah Saja">Material Curah Saja</option>
                <option value="Jasa Angkut Saja">Jasa Angkut Saja</option>
              </Select>
            </div>

            {/* Row 5: Tanggal & Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Tanggal Good Issue"
                icon={Calendar}
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />

              <Input
                label="Waktu Muat"
                icon={Clock}
                type="time"
                value={formData.waktu}
                onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
              />
            </div>

            {/* Row 6: Nomor Nota & Nomor Polisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor Nota Pengambilan"
                icon={FileText}
                placeholder="Contoh: NT-88921"
                value={formData.nomorNota}
                onChange={(e) => setFormData({ ...formData, nomorNota: e.target.value })}
                className="font-mono"
              />

              <Select
                label="Nomor Polisi Armada"
                icon={Truck}
                value={formData.nomorPolisi}
                onChange={(e) => {
                  const val = e.target.value;
                  const arm = armadaList.find((a) => a.nopol === val);
                  if (arm) {
                    setFormData({
                      ...formData,
                      nomorPolisi: val,
                      panjangCm: arm.panjangCm,
                      lebarCm: arm.lebarCm,
                      tinggiCm: arm.tinggiCm,
                      koreksiTinggiCm: 0,
                    });
                  } else {
                    setFormData({ ...formData, nomorPolisi: val });
                  }
                }}
                className="font-mono font-bold"
              >
                {armadaList.map((a) => (
                  <option key={a.id} value={a.nopol}>
                    {a.nopol} ({a.merk} - {a.kapasitas} m³)
                  </option>
                ))}
              </Select>
            </div>

            {/* TRUCK DIMENSIONS SECTION (Screenshot 1) */}
            <div className="pt-3 border-t border-[#24282C] space-y-3">
              {/* Koreksi Tinggi Stepper */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#181B1E] border border-[#2B3036]">
                <div className="text-xs text-neutral-300 font-medium">
                  Koreksi Tinggi (K):{' '}
                  <span className="font-mono font-bold text-white ml-1">
                    {formData.koreksiTinggiCm} cm
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Minus}
                    onClick={() => handleKoreksiChange(-5)}
                    title="Kurangi 5 cm"
                  />
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => handleKoreksiChange(5)}
                    title="Tambah 5 cm"
                  />
                </div>
              </div>

              {/* Tinggi Hasil Koreksi (TK) Header from Screenshot 1 */}
              <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Tinggi Hasil Koreksi (TK):</span>
                <span className="text-[#F4511E] font-mono font-bold text-sm">
                  {kubikasi.tinggiHasilKoreksi} cm
                </span>
              </div>

              {/* 3 Dimension Inputs: P, L, T */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Panjang (P) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      value={formData.panjangCm}
                      onChange={(e) =>
                        setFormData({ ...formData, panjangCm: Number(e.target.value) })
                      }
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>

                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Lebar (L) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      value={formData.lebarCm}
                      onChange={(e) =>
                        setFormData({ ...formData, lebarCm: Number(e.target.value) })
                      }
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>

                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2 text-center">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Tinggi (T) *</span>
                  <div className="flex items-center justify-center gap-1 font-mono font-bold text-neutral-100 text-sm">
                    <input
                      type="number"
                      value={formData.tinggiCm}
                      onChange={(e) =>
                        setFormData({ ...formData, tinggiCm: Number(e.target.value) })
                      }
                      className="w-16 bg-transparent text-center focus:outline-none border-b border-[#3E454D] focus:border-[#F4511E]"
                    />
                    <span className="text-[10px] text-neutral-500 font-normal">cm</span>
                  </div>
                </div>
              </div>

              {/* Results: Kubikasi Default & Akhir */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#181B1E] border border-[#2B3036] rounded-md p-2.5">
                  <span className="block text-[10px] text-neutral-400 mb-0.5">Kubikasi Default</span>
                  <div className="text-base font-bold font-mono text-neutral-300">
                    {kubikasi.volumeDefault} <span className="text-[10px] text-neutral-500 font-normal">m³</span>
                  </div>
                </div>

                <div className="bg-[#1C1511] border border-[#F4511E]/40 rounded-md p-2.5">
                  <span className="block text-[10px] text-orange-400 mb-0.5 font-medium">Kubikasi Akhir</span>
                  <div className="text-base font-bold font-mono text-[#F4511E]">
                    {kubikasi.volumeAkhir} <span className="text-[10px] text-orange-400 font-normal">m³</span>
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
              <div className="border border-dashed border-[#333940] hover:border-[#F4511E] rounded-md p-3 text-center cursor-pointer transition-colors bg-[#101214]">
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
                        <span className="text-[10px] text-neutral-400">Klik untuk mengganti berkas</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-400 hover:text-white">
                      Ambil Foto / Unggah Bukti Fisik Surat Jalan
                    </span>
                  )}
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              className="w-full mt-2"
            >
              Simpan Surat Jalan (Good Issue)
            </Button>
          </form>
        </Card>

        {/* Right Column (5 cols) - Technical Blueprint & Dispatch Summary */}
        <div className="lg:col-span-5 space-y-3">
          <TruckVisualizer
            panjangCm={formData.panjangCm}
            lebarCm={formData.lebarCm}
            tinggiCm={formData.tinggiCm}
            koreksiCm={formData.koreksiTinggiCm}
            onApplyPreset={handleApplyPreset}
          />

          <Card className="p-4 space-y-3">
            <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
              Verifikasi Kiriman Harian
            </h2>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">Nopol Armada:</span>
                <span className="font-mono font-bold text-neutral-200">{formData.nomorPolisi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">Customer:</span>
                <span className="text-neutral-200">{formData.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202326]">
                <span className="text-neutral-500">No. PO:</span>
                <span className="font-mono text-neutral-300">{formData.poNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-[#262A2F] items-baseline font-mono">
                <span className="font-semibold text-neutral-300">Volume Riil Diterima:</span>
                <span className="text-lg font-bold text-[#F4511E]">
                  {formatVolume(kubikasi.volumeAkhir)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Save}
              onClick={handleSubmit}
              className="w-full"
            >
              Simpan Good Issue
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
