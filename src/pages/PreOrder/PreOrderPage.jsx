import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Monitor,
  User,
  Ticket,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  TrendingUp,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { DEFAULT_MATERIALS } from '../../utils/constants';

export default function PreOrderPage() {
  const navigate = useNavigate();
  const { currentUser, permissions } = useAuth();
  const { preOrders, createPreOrder, approvePreOrder, rejectPreOrder } = useData();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    top: '30 Hari',
    customer: 'PT LION WINGS',
    jenisWajibPajak: 'Wajib Pajak Badan (WAPU)',
    nomorPoCustomer: 'PO-LW-2026-089',
    materialId: 'mat-2',
    satuan: 'm3',
    totalOrder: 500,
    hargaJual: 120000,
    hargaBeli: 95000,
  });

  // Calculate margin
  const marginPerUnit = formData.hargaJual - formData.hargaBeli;
  const totalMargin = marginPerUnit * formData.totalOrder;
  const marginPercentage = formData.hargaJual > 0 ? ((marginPerUnit / formData.hargaJual) * 100).toFixed(1) : 0;

  const handleCreate = (e) => {
    e.preventDefault();
    const selectedMat = DEFAULT_MATERIALS.find((m) => m.id === formData.materialId);

    createPreOrder({
      ...formData,
      materialName: selectedMat?.name || 'Material Curah',
      materialCategory: selectedMat?.category || 'Curah',
      pphRate: selectedMat?.pphRate || 2.0,
    });

    setActiveTab('list');
  };

  const handleConfirmReject = () => {
    if (rejectModalId) {
      rejectPreOrder(rejectModalId, rejectionReason);
      setRejectModalId(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2C2C2C]">
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
              Pre Order & PO Management
            </h2>
            <p className="text-xs text-neutral-400">
              Pemesanan customer • Nomor PO terbit otomatis pada Surat Jalan pertama
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-[#1E1E1E] p-1 rounded-xl border border-[#333]">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list' ? 'bg-[#F4511E] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Daftar PO ({preOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'create' ? 'bg-[#F4511E] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Pre Order
          </button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR PRE ORDER AKTIF */}
      {activeTab === 'list' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Daftar Pre Order di Sistem Gresik:</span>
            <span>Login sebagai: <strong className="text-amber-400">{currentUser.role}</strong></span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {preOrders.map((po) => {
              const fulfillmentPct = Math.min(120, Math.round((po.terkirim / po.totalOrder) * 100));
              const isOverDelivered = fulfillmentPct > 100;

              return (
                <div
                  key={po.id}
                  className="bg-[#1C1C1C] border border-[#2D2D2D] hover:border-[#3E3E3E] rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#2A2A2A] text-amber-400 border border-[#3A3A3A]">
                          {po.nomorPo || 'MENUNGGU SURAT JALAN PERTAMA'}
                        </span>
                        <span className="text-xs text-neutral-400">{po.tanggal}</span>
                      </div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{po.customer}</span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-neutral-300 font-medium text-sm">{po.materialName}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {po.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          APPROVED
                        </span>
                      )}
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          MENUNGGU APPROVAL
                        </span>
                      )}
                      {po.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          DITOLAK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress & Fulfillment */}
                  <div className="bg-[#242424] rounded-xl p-3 border border-[#333] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Pengiriman: <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> / {formatVolume(po.totalOrder, po.satuan)}
                      </span>
                      <span className={`font-mono font-bold ${isOverDelivered ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {fulfillmentPct}% {isOverDelivered && '(Toleransi Kirim)'}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isOverDelivered ? 'bg-amber-400' : 'bg-[#F4511E]'}`}
                        style={{ width: `${Math.min(100, fulfillmentPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing and Action Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-[#292929]">
                    <div className="flex items-center gap-4 text-neutral-300">
                      <span>Harga Jual: <strong className="text-white font-mono">{formatCurrency(po.hargaJual)}</strong>/{po.satuan}</span>
                      <span>Harga Beli: <strong className="text-neutral-400 font-mono">{formatCurrency(po.hargaBeli)}</strong>/{po.satuan}</span>
                    </div>

                    {/* Super Admin Approval Controls */}
                    <div className="flex items-center gap-2">
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <>
                          {permissions.canApprovePreOrder ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setRejectModalId(po.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={() => approvePreOrder(po.id, `${currentUser.name} (${currentUser.role})`)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve PO
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">
                              Approval oleh Superadmin (Direktur)
                            </span>
                          )}
                        </>
                      )}

                      {po.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => navigate('/surat-jalan')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#272727] hover:bg-[#F4511E] text-white text-xs font-medium border border-[#3E3E3E] hover:border-[#F4511E] transition-all flex items-center gap-1.5"
                        >
                          <span>Input Surat Jalan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW 2: FORM BUAT PRE ORDER BARU */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                Tanggal Pre Order <span className="text-rose-500">*</span>
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
                <User className="w-4 h-4 text-neutral-400" />
                Customer <span className="text-rose-500">*</span>
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
          </div>

          {/* Pricing & Real-Time Margin Calculator */}
          <div className="p-4 rounded-xl bg-[#222] border border-[#333] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#F4511E]" />
                Kalkulasi Margin & Harga PO
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                Margin: {formatCurrency(marginPerUnit)} ({marginPercentage}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Satuan</label>
                <select
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs"
                >
                  <option value="m3">m³</option>
                  <option value="ton">Ton</option>
                  <option value="rit">Rit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Total Order</label>
                <input
                  type="number"
                  value={formData.totalOrder}
                  onChange={(e) => setFormData({ ...formData, totalOrder: Number(e.target.value) })}
                  className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Harga Jual (Customer)</label>
                <input
                  type="number"
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: Number(e.target.value) })}
                  className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Harga Beli (Supplier)</label>
                <input
                  type="number"
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: Number(e.target.value) })}
                  className="w-full bg-[#2C2C2C] border border-[#3C3C3C] text-white rounded-lg px-2.5 py-2 text-xs"
                />
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 pt-2 border-t border-[#2C2C2C] flex justify-between">
              <span>Estimasi Gross Profit PO:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(totalMargin)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-semibold text-xs shadow-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Ajukan ke Direktur
            </button>
          </div>
        </form>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-[#333] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              Tolak Pre Order
            </h3>
            <p className="text-xs text-neutral-400">
              Berikan catatan alasan penolakan agar tim Admin Gresik dapat melakukan revisi harga atau kuota PO.
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Harga beli supplier terlalu tinggi, negosiasi ulang..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
