import { useState } from 'react';
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
  const { preOrders, createPreOrder, approvePreOrder, rejectPreOrder, materials, customers } = useData();

  const [activeTab, setActiveTab] = useState('list');
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#242424]">
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
              Pre Order & Kontrak Pengiriman
            </h2>
            <p className="text-[11px] text-neutral-400">
              Pemesanan customer • Nomor PO terbit otomatis pada Surat Jalan pertama
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded border border-[#262626]">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'list' ? 'bg-[#222] text-[#F4511E]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Daftar PO ({preOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              activeTab === 'create' ? 'bg-[#222] text-[#F4511E]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Input Pre Order
          </button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR PRE ORDER AKTIF */}
      {activeTab === 'list' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-1">
            <span>Daftar Pre Order di Sistem Gresik:</span>
            <span>Role saat ini: <strong className="text-neutral-300">{currentUser.role}</strong></span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {preOrders.map((po) => {
              const fulfillmentPct = Math.min(120, Math.round((po.terkirim / po.totalOrder) * 100));
              const isOverDelivered = fulfillmentPct > 100;

              return (
                <div
                  key={po.id}
                  className="bg-[#141414] border border-[#242424] hover:border-[#333333] rounded-lg p-3.5 space-y-2.5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-200 border border-[#2E2E2E]">
                          {po.nomorPo || 'DRAFT (MENUNGGU SURAT JALAN PERTAMA)'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">{po.tanggal}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {po.customer} <span className="text-neutral-500 font-normal">•</span> <span className="text-neutral-300 font-medium">{po.materialName}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {po.status === 'APPROVED' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
                          APPROVED
                        </span>
                      )}
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-950/50 text-amber-400 border border-amber-800/60">
                          MENUNGGU APPROVAL
                        </span>
                      )}
                      {po.status === 'REJECTED' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-rose-950/50 text-rose-400 border border-rose-800/60">
                          DITOLAK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress & Fulfillment Bar */}
                  <div className="bg-[#181818] rounded p-2 border border-[#222] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Realisasi Kirim: <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> / {formatVolume(po.totalOrder, po.satuan)}
                      </span>
                      <span className={`font-bold ${isOverDelivered ? 'text-amber-400' : 'text-neutral-300'}`}>
                        {fulfillmentPct}% {isOverDelivered && '(Peringatan Toleransi 20%)'}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#111] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isOverDelivered ? 'bg-amber-400' : 'bg-[#F4511E]'}`}
                        style={{ width: `${Math.min(100, fulfillmentPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing and Action Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs border-t border-[#1C1C1C]">
                    <div className="flex items-center gap-4 text-neutral-400 font-mono">
                      <span>Jual: <strong className="text-white">{formatCurrency(po.hargaJual)}</strong>/{po.satuan}</span>
                      <span>Beli: <strong className="text-neutral-300">{formatCurrency(po.hargaBeli)}</strong>/{po.satuan}</span>
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
                                className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-rose-950/50 text-rose-400 text-xs font-semibold border border-[#333]"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={() => approvePreOrder(po.id, `${currentUser.name} (${currentUser.role})`)}
                                className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                              >
                                Approve PO
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-neutral-500 italic font-mono">
                              (Menunggu Persetujuan Direktur)
                            </span>
                          )}
                        </>
                      )}

                      {po.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => navigate('/surat-jalan')}
                          className="px-3 py-1 rounded bg-[#1C1C1C] hover:bg-[#F4511E] text-neutral-200 hover:text-white text-xs font-medium border border-[#2E2E2E] hover:border-[#F4511E] transition-colors flex items-center gap-1"
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
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#242424] rounded-lg p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Tanggal Pre Order <span className="text-rose-500">*</span>
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
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                T.O.P. (Terms of Payment)
              </label>
              <select
                value={formData.top}
                onChange={(e) => setFormData({ ...formData, top: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                <option value="Cash / Tunai">Cash / Tunai</option>
                <option value="7 Hari">7 Hari</option>
                <option value="14 Hari">14 Hari</option>
                <option value="30 Hari">30 Hari</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-neutral-500" />
                Jenis Material <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => {
                  const val = e.target.value;
                  const mat = materials.find((m) => m.id === val);
                  if (mat) {
                    setFormData({
                      ...formData,
                      materialId: val,
                      hargaBeli: mat.beli || formData.hargaBeli,
                      hargaJual: mat.jual || formData.hargaJual,
                      satuan: mat.satuan || formData.satuan,
                    });
                  } else {
                    setFormData({ ...formData, materialId: val });
                  }
                }}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} (PPH {mat.pphRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Real-Time Margin Calculator */}
          <div className="p-3 rounded bg-[#181818] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Margin Satuan:</span>
              <strong className="text-emerald-400">{formatCurrency(marginPerUnit)} ({marginPercentage}%)</strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Satuan</label>
                <select
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] text-white rounded p-1.5 text-xs"
                >
                  <option value="m3">m³</option>
                  <option value="ton">Ton</option>
                  <option value="rit">Rit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Total Order</label>
                <input
                  type="number"
                  value={formData.totalOrder}
                  onChange={(e) => setFormData({ ...formData, totalOrder: Number(e.target.value) })}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] text-white rounded p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Harga Jual (Customer)</label>
                <input
                  type="number"
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: Number(e.target.value) })}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] text-white rounded p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Harga Beli (Supplier)</label>
                <input
                  type="number"
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: Number(e.target.value) })}
                  className="w-full bg-[#1F1F1F] border border-[#2E2E2E] text-white rounded p-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 pt-1.5 border-t border-[#222] flex justify-between font-mono">
              <span>Estimasi Gross Profit PO:</span>
              <strong className="text-white">{formatCurrency(totalMargin)}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#D84315] text-white font-bold text-xs uppercase tracking-wide"
            >
              Simpan & Ajukan Pre Order
            </button>
          </div>
        </form>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2C2C2C] rounded-lg max-w-sm w-full p-4 space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
              Tolak Pre Order
            </h3>
            <textarea
              rows={3}
              placeholder="Alasan penolakan untuk revisi admin..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-white rounded p-2 text-xs focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-3 py-1 text-xs text-neutral-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
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
