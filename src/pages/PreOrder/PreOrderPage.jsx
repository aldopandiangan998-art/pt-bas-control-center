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
  ChevronDown,
  FileText,
  Hash,
  List,
  Receipt,
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
    top: '',
    jenis: '',
    mataUang: 'IDR',
    customer: '',
    jenisWajibPajak: '',
    nomorPoCustomer: '',
    nomorRO: `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    jenisRO: '',
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

    // Reset form
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      top: '',
      jenis: '',
      mataUang: 'IDR',
      customer: '',
      jenisWajibPajak: '',
      nomorPoCustomer: '',
      nomorRO: `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      jenisRO: '',
      materialId: 'mat-8',
      satuan: 'm3',
      totalOrder: 500,
      hargaJual: 67233,
      hargaBeli: 50765,
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

      {/* VIEW 2: FORM INPUT PRE ORDER BARU — Desain Mobile-Style */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-bold text-white tracking-tight">
              Buat Received Order (RO)
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-2.5">

            {/* Row 1: Tanggal + T.O.P */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Tanggal */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
                <Calendar className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                    Tanggal <span className="text-[#F4511E]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-neutral-600 font-mono"
                  />
                </div>
              </div>

              {/* T.O.P */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
                <Calendar className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                    T.O.P.
                  </label>
                  <select
                    value={formData.top}
                    onChange={(e) => setFormData({ ...formData, top: e.target.value })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#1C1F24]">Pilih TOP</option>
                    <option value="Cash / Tunai" className="bg-[#1C1F24]">Cash / Tunai</option>
                    <option value="7 Hari" className="bg-[#1C1F24]">7 Hari</option>
                    <option value="14 Hari" className="bg-[#1C1F24]">14 Hari</option>
                    <option value="30 Hari" className="bg-[#1C1F24]">30 Hari</option>
                    <option value="45 Hari" className="bg-[#1C1F24]">45 Hari</option>
                    <option value="60 Hari" className="bg-[#1C1F24]">60 Hari</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
              </div>
            </div>

            {/* Row 2: Jenis + Mata Uang */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Jenis Material */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
                <Monitor className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                    Jenis <span className="text-[#F4511E]">*</span>
                  </label>
                  <select
                    required
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer truncate"
                  >
                    <option value="" className="bg-[#1C1F24]">Pilih Jenis</option>
                    <option value="BORONG" className="bg-[#1C1F24]">BORONG</option>
                    <option value="CURAH" className="bg-[#1C1F24]">CURAH</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
              </div>

              {/* Mata Uang */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
                <DollarSign className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                    Mata Uang <span className="text-[#F4511E]">*</span>
                  </label>
                  <select
                    required
                    value={formData.mataUang}
                    onChange={(e) => setFormData({ ...formData, mataUang: e.target.value })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer font-mono"
                  >
                    <option value="IDR" className="bg-[#1C1F24]">IDR</option>
                    <option value="USD" className="bg-[#1C1F24]">USD</option>
                    <option value="EUR" className="bg-[#1C1F24]">EUR</option>
                  </select>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
              </div>
            </div>

            {/* Row 3: Pilih Customer (full width) */}
            <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
              <User className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                  Pilih Customer <span className="text-[#F4511E]">*</span>
                </label>
                <select
                  required
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1C1F24]">— Pilih Customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#1C1F24]">
                      {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
            </div>

            {/* Row 4: Jenis Wajib Pajak (full width) */}
            <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
              <Monitor className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                  Jenis Pajak
                </label>
                <select
                  value={formData.jenisWajibPajak}
                  onChange={(e) => setFormData({ ...formData, jenisWajibPajak: e.target.value })}
                  className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1C1F24]">— Pilih Jenis Pajak —</option>
                  <option value="PKP" className="bg-[#1C1F24]">PKP (Pengusaha Kena Pajak)</option>
                  <option value="NON PKP" className="bg-[#1C1F24]">NON PKP</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
            </div>

            {/* Row 5: Nomor PO Customer (full width, orange active border) */}
            <div className="relative bg-[#1C1F24] border border-[#F4511E]/60 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors group">
              <FileText className="w-5 h-5 text-[#F4511E] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-[#F4511E] uppercase tracking-widest mb-0.5">
                  Nomor PO Customer
                </label>
                <input
                  type="text"
                  value={formData.nomorPoCustomer}
                  onChange={(e) => setFormData({ ...formData, nomorPoCustomer: e.target.value })}
                  placeholder="Biarkan kosong apabila belum tersedia"
                  className="w-full bg-transparent text-xs text-neutral-200 focus:outline-none placeholder-neutral-500"
                />
              </div>
            </div>

            {/* Row 6: Nomor RO (full width, auto-generated) */}
            <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
              <Hash className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                  Nomor RO (auto) <span className="text-[#F4511E]">*</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.nomorRO}
                  className="w-full bg-transparent text-xs text-neutral-400 focus:outline-none font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 7: Pilih Jenis RO (full width) */}
            <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group">
              <List className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-0.5">
                  Pilih Jenis RO <span className="text-[#F4511E]">*</span>
                </label>
                <select
                  required
                  value={formData.jenisRO}
                  onChange={(e) => setFormData({ ...formData, jenisRO: e.target.value })}
                  className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1C1F24]">— Pilih Jenis RO —</option>
                  <option value="Regular" className="bg-[#1C1F24]">Regular</option>
                  <option value="Prioritas" className="bg-[#1C1F24]">Prioritas</option>
                  <option value="Kontrak Tahunan" className="bg-[#1C1F24]">Kontrak Tahunan</option>
                  <option value="Spot Order" className="bg-[#1C1F24]">Spot Order</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />
            </div>

            {/* ── Harga & Volume (Collapsible Detail) ── */}
            <div className="bg-[#181B1E] border border-[#2A2E33] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-neutral-400 font-semibold uppercase tracking-widest text-[10px]">Detail Harga & Volume</span>
                <strong className="text-emerald-400">{formatCurrency(formData.hargaJual - formData.hargaBeli)}/unit margin</strong>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Satuan */}
                <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-lg px-3 py-2.5 flex items-center gap-2 focus-within:border-[#F4511E]/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-0.5">Satuan</label>
                    <select
                      value={formData.satuan}
                      onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                      className="w-full bg-transparent text-xs text-white focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="m3" className="bg-[#1C1F24]">m³ (Kubik)</option>
                      <option value="ton" className="bg-[#1C1F24]">Ton</option>
                      <option value="rit" className="bg-[#1C1F24]">Rit</option>
                    </select>
                  </div>
                  <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0 pointer-events-none" />
                </div>

                {/* Target Volume */}
                <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-lg px-3 py-2.5 focus-within:border-[#F4511E]/60 transition-colors">
                  <label className="block text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-0.5">Target Volume</label>
                  <input
                    type="number"
                    required
                    value={formData.totalOrder}
                    onChange={(e) => setFormData({ ...formData, totalOrder: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* Harga Jual */}
                <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-lg px-3 py-2.5 focus-within:border-[#F4511E]/60 transition-colors">
                  <label className="block text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-0.5">Harga Jual</label>
                  <input
                    type="number"
                    required
                    value={formData.hargaJual}
                    onChange={(e) => setFormData({ ...formData, hargaJual: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* Harga Beli */}
                <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-lg px-3 py-2.5 focus-within:border-[#F4511E]/60 transition-colors">
                  <label className="block text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mb-0.5">Harga Beli</label>
                  <input
                    type="number"
                    required
                    value={formData.hargaBeli}
                    onChange={(e) => setFormData({ ...formData, hargaBeli: Number(e.target.value) })}
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Total Margin Summary */}
              <div className="text-xs text-neutral-300 pt-2.5 border-t border-[#24282C] flex items-center justify-between font-mono">
                <span className="text-neutral-400">Estimasi Total Gross Margin:</span>
                <strong className="text-white text-sm">{formatCurrency((formData.hargaJual - formData.hargaBeli) * formData.totalOrder)}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-neutral-300 bg-[#1C1F24] border border-[#2A2E33] hover:border-[#3A3E45] hover:text-white transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-[#F4511E] hover:bg-[#E04418] active:bg-[#C93C15] transition-all shadow-lg shadow-[#F4511E]/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Simpan & Ajukan RO
              </button>
            </div>

          </form>
        </div>
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
