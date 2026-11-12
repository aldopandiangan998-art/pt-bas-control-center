import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Monitor,
  User,
  Ticket,
  Menu as MenuIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_MATERIALS } from '../../utils/constants';

export default function PreOrderPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  // Form state reproducing Screenshot 6: "Buat Received Order (RO)"
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    top: '30 Hari', // Terms of payment
    jenis: 'Material Curah',
    mataUang: 'IDR',
    customer: 'PT LION WINGS',
    jenisWajibPajak: 'Wajib Pajak Badan (WAPU)',
    nomorPoCustomer: 'PO-LW-2026-089',
    nomorRoAuto: 'RO-202611-00042', // Generated draft internal number
    jenisRo: 'Pengiriman Bertahap',
    materialId: 'mat-2', // Sirtu Curah
    satuan: 'm3',
    totalOrder: 500,
    hargaJual: 120000,
    hargaBeli: 95000,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Bar matching Screenshot 6 */}
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
              Buat Received Order (RO)
            </h2>
            <p className="text-xs text-neutral-400">
              Pre Order material dari customer • Butuh approval Superadmin sebelum Surat Jalan dibuat
            </p>
          </div>
        </div>
      </div>

      {submitted && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>
            Pre Order berhasil disimpan! Menunggu approval dari Superadmin (Direktur).
          </span>
        </div>
      )}

      {/* Main Form container reproducing the dark UI styling from Screenshot 6 */}
      <form onSubmit={handleSubmit} className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
        {/* Row 1: Tanggal & T.O.P. */}
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
              <Calendar className="w-4 h-4 text-neutral-400" />
              T.O.P. (Terms of Payment)
            </label>
            <select
              value={formData.top}
              onChange={(e) => setFormData({ ...formData, top: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              <option value="Cash / Tunai">Cash / Tunai</option>
              <option value="7 Hari">7 Hari</option>
              <option value="14 Hari">14 Hari</option>
              <option value="30 Hari">30 Hari</option>
            </select>
          </div>
        </div>

        {/* Row 2: Jenis & Mata Uang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-neutral-400" />
              Jenis Material <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              {DEFAULT_MATERIALS.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} (PPH {mat.pphRate}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-neutral-400" />
              Mata Uang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.mataUang}
              readOnly
              className="w-full bg-[#272727] border border-[#3C3C3C] text-neutral-300 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* Row 3: Customer & Wajib Pajak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-neutral-400" />
              Pilih Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              <option value="PT LION WINGS">PT LION WINGS</option>
              <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
              <option value="PT PETROKIMIA GRESIK">PT PETROKIMIA GRESIK</option>
              <option value="PROYEK JALAN TOL GRESIK">PROYEK JALAN TOL GRESIK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-neutral-400" />
              Jenis Wajib Pajak
            </label>
            <select
              value={formData.jenisWajibPajak}
              onChange={(e) => setFormData({ ...formData, jenisWajibPajak: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            >
              <option value="Wajib Pajak Badan (WAPU)">Wajib Pajak Badan (WAPU)</option>
              <option value="Wajib Pajak Non WAPU">Wajib Pajak Non WAPU</option>
              <option value="Non PKP">Non PKP</option>
            </select>
          </div>
        </div>

        {/* Row 4: Nomor PO Customer & Nomor RO (auto) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-neutral-400" />
              Nomor PO Customer
            </label>
            <input
              type="text"
              placeholder="Contoh: PO-LW-2026-089"
              value={formData.nomorPoCustomer}
              onChange={(e) => setFormData({ ...formData, nomorPoCustomer: e.target.value })}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-neutral-400" />
              Nomor RO (auto) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nomorRoAuto}
              readOnly
              className="w-full bg-[#272727] border border-[#3C3C3C] text-amber-400 font-mono font-medium rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              Nomor PO resmi PT BAS akan terbit otomatis pada Surat Jalan pertama.
            </p>
          </div>
        </div>

        {/* Row 5: Pricing & Volume per Implementation Plan Section 0 (Poin 6) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#222] border border-[#333]">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Satuan Material
            </label>
            <select
              value={formData.satuan}
              onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
              className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
            >
              <option value="m3">m³ (Kubik)</option>
              <option value="ton">Ton</option>
              <option value="rit">Rit</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Total Order
            </label>
            <input
              type="number"
              value={formData.totalOrder}
              onChange={(e) => setFormData({ ...formData, totalOrder: Number(e.target.value) })}
              className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Harga Jual (Customer)
            </label>
            <input
              type="number"
              value={formData.hargaJual}
              onChange={(e) => setFormData({ ...formData, hargaJual: Number(e.target.value) })}
              className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Harga Beli (Supplier)
            </label>
            <input
              type="number"
              value={formData.hargaBeli}
              onChange={(e) => setFormData({ ...formData, hargaBeli: Number(e.target.value) })}
              className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#3E3E3E] text-neutral-300 hover:text-white hover:bg-[#2B2B2B] text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-semibold text-sm shadow-lg shadow-orange-950/40 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Simpan & Ajukan Pre Order
          </button>
        </div>
      </form>
    </div>
  );
}
