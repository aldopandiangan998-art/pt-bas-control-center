import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Plus,
  TrendingUp,
  Receipt,
  FileText,
  Hash,
  List,
  User,
  Monitor,
  DollarSign,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Modal } from '../../components/ui';
import {
  DateField,
  SelectField,
  TextField,
  NumberField,
  FormAppBar,
  FabSubmit,
} from '../../components/form';

/* ─────────────────────────── constants ─────────────────────────── */

const TOP_OPTIONS = [
  { value: 'Cash / Tunai', label: 'Cash / Tunai' },
  { value: '7 Hari', label: '7 Hari' },
  { value: '14 Hari', label: '14 Hari' },
  { value: '30 Hari', label: '30 Hari' },
  { value: '45 Hari', label: '45 Hari' },
  { value: '60 Hari', label: '60 Hari' },
];

const JENIS_OPTIONS = [
  { value: 'BORONG', label: 'BORONG' },
  { value: 'CURAH', label: 'CURAH' },
];

const MATA_UANG_OPTIONS = [
  { value: 'IDR', label: 'IDR – Rupiah Indonesia' },
  { value: 'USD', label: 'USD – Dolar AS' },
  { value: 'EUR', label: 'EUR – Euro' },
];

const JENIS_PAJAK_OPTIONS = [
  { value: 'PKP', label: 'PKP (Pengusaha Kena Pajak)' },
  { value: 'NON PKP', label: 'NON PKP' },
];

const JENIS_RO_OPTIONS = [
  { value: 'JASA ANGKUT + MATERIAL', label: 'JASA ANGKUT + MATERIAL' },
  { value: 'MATERIAL SAJA', label: 'MATERIAL SAJA' },
  { value: 'JASA ANGKUT SAJA', label: 'JASA ANGKUT SAJA' },
];

const SATUAN_OPTIONS = [
  { value: 'm3', label: 'm³ (Kubik)' },
  { value: 'ton', label: 'Ton' },
  { value: 'rit', label: 'Rit' },
];

/* ─────────────────────────── helpers ─────────────────────────── */
function mkNomorRO() {
  return `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

function mkDefaultForm() {
  return {
    tanggal: new Date().toISOString().split('T')[0],
    top: '',
    jenis: '',
    mataUang: 'IDR',
    customer: '',
    jenisWajibPajak: '',
    nomorPoCustomer: '',
    nomorRO: mkNomorRO(),
    jenisRO: '',
    hubungkanNomorPoMaterial: '',
    materialId: 'mat-8',
    satuan: 'm3',
    totalOrder: 500,
    hargaJual: 67233,
    hargaBeli: 50765,
  };
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function PreOrderPage() {
  const navigate = useNavigate();
  const { currentUser, roleLabel, permissions } = useAuth();
  const { preOrders, createPreOrder, approvePreOrder, rejectPreOrder, materials, customers } = useData();

  const [activeTab, setActiveTab] = useState('list');
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState(mkDefaultForm());
  const firstErrorRef = useRef(null);

  /* derived */
  const marginPerUnit = formData.hargaJual - formData.hargaBeli;
  const totalMargin = marginPerUnit * formData.totalOrder;

  /* Show "Hubungkan Nomor PO Material" only when Jenis RO = JASA ANGKUT SAJA */
  const showHubungkanPo = formData.jenisRO === 'JASA ANGKUT SAJA';

  /* Customer dropdown options */
  const customerOptions = customers.map((c) => ({
    value: c.name,
    label: c.kodePrefix ? `${c.kodePrefix} – ${c.name}` : c.name,
  }));

  /* Materials for PO Material dropdown */
  const materialPoOptions = materials.map((m) => ({
    value: m.id,
    label: m.name || m.nama || m.id,
  }));

  /* ── field setter ── */
  const setField = (key, val) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      // Clear conditional field when hidden
      if (key === 'jenisRO' && val !== 'JASA ANGKUT SAJA') {
        next.hubungkanNomorPoMaterial = '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  /* ── validation ── */
  const validate = () => {
    const e = {};
    if (!formData.tanggal) e.tanggal = 'Wajib diisi';
    if (!formData.jenis) e.jenis = 'Wajib diisi';
    if (!formData.mataUang) e.mataUang = 'Wajib diisi';
    if (!formData.customer) e.customer = 'Wajib diisi';
    if (!formData.nomorRO) e.nomorRO = 'Wajib diisi';
    if (!formData.jenisRO) e.jenisRO = 'Wajib diisi';
    if (!formData.totalOrder || formData.totalOrder <= 0) e.totalOrder = 'Harus lebih dari 0';
    if (!formData.hargaJual || formData.hargaJual <= 0) e.hargaJual = 'Harus lebih dari 0';
    if (!formData.hargaBeli || formData.hargaBeli <= 0) e.hargaBeli = 'Harus lebih dari 0';
    return e;
  };

  /* ── submit ── */
  const handleCreate = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // scroll to first error
      setTimeout(() => {
        firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    const selectedMat = materials.find((m) => m.id === formData.materialId);

    createPreOrder({
      ...formData,
      materialName: selectedMat?.name || 'SIRTU',
      materialCategory: selectedMat?.category || 'Curah',
      pphRate: selectedMat?.pphRate || 2.0,
    });

    setFormData(mkDefaultForm());
    setErrors({});
    setSubmitting(false);
    setActiveTab('list');
  };

  const handleConfirmReject = () => {
    if (rejectModalId) {
      rejectPreOrder(rejectModalId, rejectionReason);
      setRejectModalId(null);
      setRejectionReason('');
    }
  };

  /* ── reduced motion ── */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24">

      {/* ── Top Header Bar ── */}
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
              Pre Order &amp; Kontrak Pengiriman
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

      {/* ══════════ VIEW 1: DAFTAR PRE ORDER AKTIF ══════════ */}
      {activeTab === 'list' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
            <span>Daftar Pre Order di Sistem Gresik:</span>
            <span>
              Role aktif:{' '}
              <strong className="text-white font-medium">
                {roleLabel || (currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin')}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {preOrders.map((po) => {
              const fulfillmentPct = Math.min(120, Math.round((po.terkirim / po.totalOrder) * 100));
              const isOverDelivered = fulfillmentPct > 100;

              return (
                <Card key={po.id} hover className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1C1F22] text-neutral-200 border border-[#2C3136]">
                          {po.nomorPo || 'DRAFT (MENUNGGU SURAT JALAN PERTAMA)'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">{po.tanggal}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {po.customer}{' '}
                        <span className="text-neutral-500 font-normal">•</span>{' '}
                        <span className="text-amber-400 font-medium">{po.materialName}</span>
                      </div>
                    </div>

                    <div>
                      {po.status === 'APPROVED' && <Badge variant="success" dot>APPROVED</Badge>}
                      {po.status === 'MENUNGGU_APPROVAL' && <Badge variant="warning" dot>MENUNGGU APPROVAL</Badge>}
                      {po.status === 'REJECTED' && <Badge variant="error" dot>DITOLAK</Badge>}
                    </div>
                  </div>

                  {/* Progress & Fulfillment Bar */}
                  <div className="bg-[#181B1E] rounded-md p-2.5 border border-[#24282C] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Realisasi Kirim:{' '}
                        <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> /{' '}
                        {formatVolume(po.totalOrder, po.satuan)}
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

                    <div className="flex items-center gap-2">
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <>
                          {permissions.canApprovePreOrder ? (
                            <>
                              <Button size="xs" variant="danger" icon={XCircle} onClick={() => setRejectModalId(po.id)}>
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
                          <Button size="xs" variant="secondary" onClick={() => navigate('/surat-jalan')}>
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

      {/* ══════════ VIEW 2: FORM BUAT RO — Material-style ══════════ */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          {/* App Bar */}
          <FormAppBar
            title="Buat Received Order (RO)"
            onBack={() => setActiveTab('list')}
          />

          <form onSubmit={handleCreate} noValidate className="space-y-0 pb-6">

            {/* ── Row 1: Tanggal | T.O.P. ── */}
            <div className="grid grid-cols-2 min-[360px]:grid-cols-2 gap-px">
              <div ref={errors.tanggal ? firstErrorRef : null}>
                <DateField
                  label="Tanggal"
                  value={formData.tanggal}
                  onChange={(v) => setField('tanggal', v)}
                  required
                  error={errors.tanggal}
                />
              </div>
              <SelectField
                icon={Calendar}
                label="T.O.P."
                value={formData.top}
                onChange={(v) => setField('top', v)}
                options={TOP_OPTIONS}
              />
            </div>

            {/* ── Row 2: Jenis | Mata Uang ── */}
            <div className="grid grid-cols-2 min-[360px]:grid-cols-2 gap-px">
              <div ref={errors.jenis ? firstErrorRef : null}>
                <SelectField
                  icon={Monitor}
                  label="Jenis"
                  value={formData.jenis}
                  onChange={(v) => setField('jenis', v)}
                  options={JENIS_OPTIONS}
                  required
                  error={errors.jenis}
                />
              </div>
              <div ref={errors.mataUang ? firstErrorRef : null}>
                <SelectField
                  icon={DollarSign}
                  label="Mata Uang"
                  value={formData.mataUang}
                  onChange={(v) => setField('mataUang', v)}
                  options={MATA_UANG_OPTIONS}
                  required
                  error={errors.mataUang}
                />
              </div>
            </div>

            {/* ── Row 3: Pilih Customer (full width, searchable) ── */}
            <div ref={errors.customer ? firstErrorRef : null}>
              <SelectField
                icon={User}
                label="Pilih Customer"
                value={formData.customer}
                onChange={(v) => setField('customer', v)}
                options={customerOptions}
                required
                searchable={customerOptions.length > 8}
                error={errors.customer}
              />
            </div>

            {/* ── Row 4: Jenis Wajib Pajak (full width) ── */}
            <SelectField
              icon={Monitor}
              label="Jenis Wajib Pajak"
              value={formData.jenisWajibPajak}
              onChange={(v) => setField('jenisWajibPajak', v)}
              options={JENIS_PAJAK_OPTIONS}
            />

            {/* ── Row 5: Nomor PO Customer (full width) ── */}
            <TextField
              icon={FileText}
              label="Nomor PO Customer"
              value={formData.nomorPoCustomer}
              onChange={(e) => setField('nomorPoCustomer', e.target.value)}
              helper="Biarkan kosong apabila belum tersedia"
              autoComplete="off"
            />

            {/* ── Row 6: Nomor RO (auto, readonly) ── */}
            <TextField
              icon={Hash}
              label="Nomor RO (auto)"
              value={formData.nomorRO}
              readOnly
              required
              error={errors.nomorRO}
            />

            {/* ── Row 7: Pilih Jenis RO (full width) ── */}
            <div ref={errors.jenisRO ? firstErrorRef : null}>
              <SelectField
                icon={List}
                label="Pilih Jenis RO"
                value={formData.jenisRO}
                onChange={(v) => setField('jenisRO', v)}
                options={JENIS_RO_OPTIONS}
                required
                error={errors.jenisRO}
              />
            </div>

            {/* ── Row 8 (Conditional): Hubungkan Nomor PO Material ── */}
            <div
              className="overflow-hidden transition-all"
              style={
                prefersReduced
                  ? { display: showHubungkanPo ? 'block' : 'none' }
                  : {
                      maxHeight: showHubungkanPo ? '120px' : '0px',
                      opacity: showHubungkanPo ? 1 : 0,
                      transition: 'max-height 200ms ease, opacity 200ms ease',
                    }
              }
              aria-hidden={!showHubungkanPo}
            >
              <SelectField
                icon={Layers}
                label="Hubungkan Nomor PO Material"
                value={formData.hubungkanNomorPoMaterial}
                onChange={(v) => setField('hubungkanNomorPoMaterial', v)}
                options={materialPoOptions}
                searchable={materialPoOptions.length > 8}
              />
            </div>

            {/* ── Divider + Daftar Item heading ── */}
            <div className="flex items-center gap-3 pt-5 pb-2 px-4">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                Detail Harga &amp; Volume
              </span>
              <div className="flex-1 h-px bg-[#2A2E35]" />
            </div>

            {/* ── Detail Harga & Volume ── */}
            <div className="bg-[#181B1E] border-t border-b border-[#2A2E35]">
              {/* Satuan + Target Volume */}
              <div className="grid grid-cols-2 gap-px">
                <SelectField
                  label="Satuan"
                  value={formData.satuan}
                  onChange={(v) => setField('satuan', v)}
                  options={SATUAN_OPTIONS}
                />
                <div ref={errors.totalOrder ? firstErrorRef : null}>
                  <NumberField
                    label="Target Volume"
                    value={formData.totalOrder}
                    onChange={(v) => setField('totalOrder', v)}
                    required
                    min={0}
                    error={errors.totalOrder}
                  />
                </div>
              </div>

              {/* Harga Jual + Harga Beli */}
              <div className="grid grid-cols-2 gap-px">
                <div ref={errors.hargaJual ? firstErrorRef : null}>
                  <NumberField
                    label="Harga Jual"
                    value={formData.hargaJual}
                    onChange={(v) => setField('hargaJual', v)}
                    required
                    min={0}
                    error={errors.hargaJual}
                  />
                </div>
                <div ref={errors.hargaBeli ? firstErrorRef : null}>
                  <NumberField
                    label="Harga Beli"
                    value={formData.hargaBeli}
                    onChange={(v) => setField('hargaBeli', v)}
                    required
                    min={0}
                    error={errors.hargaBeli}
                  />
                </div>
              </div>

              {/* Margin per unit chip */}
              <div className="px-4 py-2 flex items-center justify-end">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                  {formatCurrency(marginPerUnit)}/unit margin
                </span>
              </div>
            </div>

            {/* ── Estimasi Total Gross Margin ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2E35]">
              <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                <TrendingUp className="w-4 h-4" />
                <span>Estimasi Total Gross Margin</span>
              </div>
              <strong className="text-white text-sm font-mono">
                {formatCurrency(totalMargin)}
              </strong>
            </div>

            {/* ── FAB Submit (sticky bottom) ── */}
            <FabSubmit loading={submitting} />

          </form>
        </div>
      )}

      {/* ── Reject Modal ── */}
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
            <Button variant="ghost" onClick={() => setRejectModalId(null)}>
              Batal
            </Button>
            <Button variant="danger" icon={XCircle} onClick={handleConfirmReject}>
              Konfirmasi Tolak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
