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
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input, Select, Modal } from '../../components/ui';

export default function PreOrderPage() {
  const navigate = useNavigate();
  const { currentUser, roleLabel, permissions } = useAuth();
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
    materialId: 'mat-8',
    satuan: 'm3',
    totalOrder: 500,
    hargaJual: 67233,
    hargaBeli: 50765,
  });

  const marginPerUnit = formData.hargaJual - formData.hargaBeli;
  const totalMargin = marginPerUnit * formData.totalOrder;
  const marginPercentage = formData.hargaJual > 0 ? ((marginPerUnit / formData.hargaJual) * 100).toFixed(1) : 0;

  const handleCreate = (e) => {
    e.preventDefault();
    const selectedMat = materials.find((m) => m.id === formData.materialId);

    createPreOrder({
      ...formData,
      materialName: selectedMat?.name || 'SIRTU',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            title="Kembali ke Dashboard"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pre Order & Kontrak Pengiriman
            </h1>
            <p className="text-[11px] text-neutral-400">
              Pemesanan customer • Nomor PO resmi digenerate otomatis saat Surat Jalan pertama dicetak
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-[#131517] p-1 rounded-md border border-[#24282C]">
          <Button
            size="xs"
            variant={activeTab === 'list' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('list')}
          >
            Daftar PO ({preOrders.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Input Pre Order
          </Button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR PRE ORDER AKTIF */}
      {activeTab === 'list' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
            <span>Daftar Pre Order di Sistem Gresik:</span>
            <span>Role aktif: <strong className="text-white font-medium">{roleLabel || (currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin')}</strong></span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {preOrders.map((po) => {
              const fulfillmentPct = Math.min(120, Math.round((po.terkirim / po.totalOrder) * 100));
              const isOverDelivered = fulfillmentPct > 100;

              return (
                <Card
                  key={po.id}
                  hover
                  className="p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1C1F22] text-neutral-200 border border-[#2C3136]">
                          {po.nomorPo || 'DRAFT (MENUNGGU SURAT JALAN PERTAMA)'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">{po.tanggal}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {po.customer} <span className="text-neutral-500 font-normal">•</span> <span className="text-amber-400 font-medium">{po.materialName}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {po.status === 'APPROVED' && (
                        <Badge variant="success" dot>
                          APPROVED
                        </Badge>
                      )}
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <Badge variant="warning" dot>
                          MENUNGGU APPROVAL
                        </Badge>
                      )}
                      {po.status === 'REJECTED' && (
                        <Badge variant="error" dot>
                          DITOLAK
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress & Fulfillment Bar */}
                  <div className="bg-[#181B1E] rounded-md p-2.5 border border-[#24282C] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Realisasi Kirim: <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> / {formatVolume(po.totalOrder, po.satuan)}
                      </span>
                      <span className={`font-bold ${isOverDelivered ? 'text-amber-400' : 'text-neutral-300'}`}>
                        {fulfillmentPct}% {isOverDelivered && '(Peringatan Toleransi 20%)'}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#0C0D0E] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isOverDelivered ? 'bg-amber-400' : 'bg-[#F4511E]'}`}
                        style={{ width: `${Math.min(100, fulfillmentPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing and Action Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs border-t border-[#202326]">
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
                              <Button
                                size="xs"
                                variant="danger"
                                icon={XCircle}
                                onClick={() => setRejectModalId(po.id)}
                              >
                                Tolak PO
                              </Button>
                              <Button
                                size="xs"
                                variant="primary"
                                icon={CheckCircle2}
                                onClick={() => approvePreOrder(po.id, `${currentUser.name} (Direktur)`)}
                              >
                                Setujui PO
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-amber-500/90 font-mono bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                              Memerlukan persetujuan Super Admin (Direktur)
                            </span>
                          )}
                        </>
                      )}

                      {po.status === 'APPROVED' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Disetujui: <strong className="text-emerald-400">{po.approvedBy}</strong>
                          </span>
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => navigate('/surat-jalan')}
                          >
                            Buat Surat Jalan &rarr;
                          </Button>
                        </div>
                      )}

                      {po.status === 'REJECTED' && (
                        <span className="text-[10px] text-rose-400 font-mono">
                          Alasan: {po.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW 2: FORM INPUT PRE ORDER BARU */}
      {activeTab === 'create' && (
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="border-b border-[#24282C] pb-2">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Formulir Permintaan Pre Order Material
            </h2>
            <p className="text-[11px] text-neutral-400">
              Isi kontrak pemesanan awal material tambang. PO akan diajukan ke Direktur untuk diverifikasi harganya.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Tanggal Kontrak"
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />

              <Select
                label="Term of Payment (TOP)"
                value={formData.top}
                onChange={(e) => setFormData({ ...formData, top: e.target.value })}
              >
                <option value="Cash / Tunai">Cash / Tunai</option>
                <option value="7 Hari">7 Hari</option>
                <option value="14 Hari">14 Hari</option>
                <option value="30 Hari">30 Hari</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Jenis Material"
                required
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
              >
                {materials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} (PPH {mat.pphRate}%)
                  </option>
                ))}
              </Select>

              <Select
                label="Customer Proyek"
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
            </div>

            {/* Pricing & Real-Time Margin Calculator */}
            <div className="p-3.5 rounded-lg bg-[#181B1E] border border-[#2A2E33] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Margin Profit per Satuan:</span>
                <strong className="text-emerald-400">{formatCurrency(marginPerUnit)} ({marginPercentage}%)</strong>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <Select
                  label="Satuan"
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                >
                  <option value="m3">m³ (Kubik)</option>
                  <option value="ton">Ton</option>
                  <option value="rit">Rit</option>
                </Select>

                <Input
                  label="Target Volume"
                  type="number"
                  required
                  value={formData.totalOrder}
                  onChange={(e) => setFormData({ ...formData, totalOrder: Number(e.target.value) })}
                  className="font-mono"
                />

                <Input
                  label="Harga Jual (Customer)"
                  type="number"
                  required
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: Number(e.target.value) })}
                  className="font-mono"
                />

                <Input
                  label="Harga Beli (Supplier)"
                  type="number"
                  required
                  value={formData.hargaBeli}
                  onChange={(e) => setFormData({ ...formData, hargaBeli: Number(e.target.value) })}
                  className="font-mono"
                />
              </div>

              <div className="text-xs text-neutral-300 pt-2 border-t border-[#24282C] flex items-center justify-between font-mono">
                <span className="text-neutral-400">Estimasi Total Gross Margin Kontrak:</span>
                <strong className="text-white text-sm">{formatCurrency(totalMargin)}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('list')}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Plus}
              >
                Simpan & Ajukan Pre Order
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reject Modal using Motion Modal Primitive */}
      <Modal
        isOpen={Boolean(rejectModalId)}
        onClose={() => setRejectModalId(null)}
        title="Tolak Pre Order"
        subtitle="Berikan alasan penolakan untuk dikembalikan dan direvisi admin lapangan"
      >
        <div className="p-4 space-y-3">
          <textarea
            rows={3}
            placeholder="Tuliskan catatan revisi (misal: harga beli vendor melebihi plafon target margin)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full bg-[#181B1E] border border-[#2D3339] text-white rounded-md p-2.5 text-xs focus:outline-none focus:border-[#F4511E] placeholder-neutral-500"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282C]">
            <Button
              variant="ghost"
              onClick={() => setRejectModalId(null)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              onClick={handleConfirmReject}
            >
              Konfirmasi Tolak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
