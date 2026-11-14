import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Plus,
  TrendingUp,
  FileText,
  List,
  User,
  Monitor,
  DollarSign,
  Calendar,
  Layers,
  Trash2,
  Lock,
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

/* Item name options keyed by jenisRO */
const ITEM_NAMES_BY_JENIS = {
  'JASA ANGKUT + MATERIAL': [
    { value: 'JASA ANGKUT', label: 'JASA ANGKUT' },
    { value: 'SIRTU', label: 'SIRTU' },
    { value: 'LIMESTONE', label: 'LIMESTONE' },
    { value: 'TANAH', label: 'TANAH' },
  ],
  'MATERIAL SAJA': [
    { value: 'SIRTU', label: 'SIRTU' },
    { value: 'LIMESTONE', label: 'LIMESTONE' },
    { value: 'TANAH', label: 'TANAH' },
  ],
  'JASA ANGKUT SAJA': [
    { value: 'JASA ANGKUT', label: 'JASA ANGKUT' },
  ],
};

/* Material-only options (for "Tambah Item" on JASA ANGKUT + MATERIAL) */
const MATERIAL_ONLY_OPTIONS = [
  { value: 'SIRTU', label: 'SIRTU' },
  { value: 'LIMESTONE', label: 'LIMESTONE' },
  { value: 'TANAH', label: 'TANAH' },
];

/* ─────────────────────────── helpers ─────────────────────────── */
function mkNomorRO() {
  return `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

function mkBlankItem(nameOptions = []) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nama: nameOptions[0]?.value || '',
    kuantitas: '',
    hargaJual: '',
    hargaBeli: '',
  };
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
  const [itemsLocked, setItemsLocked] = useState(false);

  const [formData, setFormData] = useState(mkDefaultForm());
  const [items, setItems] = useState([]);
  const firstErrorRef = useRef(null);

  /* Show "Hubungkan Nomor PO Material" only when Jenis RO = JASA ANGKUT SAJA */
  const showHubungkanPo = formData.jenisRO === 'JASA ANGKUT SAJA';

  /* Show Daftar Item section once a Jenis RO is selected */
  const showDaftarItem = !!formData.jenisRO;

  /* Item name options filtered by Jenis RO */
  const itemNameOptions = ITEM_NAMES_BY_JENIS[formData.jenisRO] || [];

  /* Computed totals */
  const totalHargaJual = items.reduce(
    (s, i) => s + (Number(i.kuantitas) || 0) * (Number(i.hargaJual) || 0),
    0
  );
  const totalHargaBeli = items.reduce(
    (s, i) => s + (Number(i.kuantitas) || 0) * (Number(i.hargaBeli) || 0),
    0
  );
  const totalMargin = totalHargaJual - totalHargaBeli;

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
      if (key === 'jenisRO') {
        // Reset conditional field
        if (val !== 'JASA ANGKUT SAJA') next.hubungkanNomorPoMaterial = '';
        // Reset items when Jenis RO changes
        const nameOpts = ITEM_NAMES_BY_JENIS[val] || [];
        setItems(val ? [mkBlankItem(nameOpts)] : []);
        setItemsLocked(false);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  /* ── item management ── */
  const addItem = () => {
    if (itemsLocked) return;
    // For JASA ANGKUT + MATERIAL: extra items (index > 0) default to first material, not JASA ANGKUT
    const defaultOpts =
      formData.jenisRO === 'JASA ANGKUT + MATERIAL'
        ? MATERIAL_ONLY_OPTIONS
        : itemNameOptions;
    setItems((prev) => [...prev, mkBlankItem(defaultOpts)]);
  };

  const removeItem = (idx) => {
    if (itemsLocked) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    if (itemsLocked) return;
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  /* ── validation ── */
  const validate = () => {
    const e = {};
    if (!formData.tanggal) e.tanggal = 'Wajib diisi';
    if (!formData.jenis) e.jenis = 'Wajib diisi';
    if (!formData.mataUang) e.mataUang = 'Wajib diisi';
    if (!formData.customer) e.customer = 'Wajib diisi';
    if (!formData.jenisRO) e.jenisRO = 'Wajib diisi';
    if (items.length === 0) e.items = 'Tambahkan minimal 1 item';
    return e;
  };

  /* ── submit ── */
  const handleCreate = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    // Build payload: use first item's values for backward-compat fields
    const firstItem = items[0] || {};
    createPreOrder({
      ...formData,
      items,
      materialName: firstItem.nama || 'SIRTU',
      materialCategory: 'Curah',
      pphRate: 2.0,
      totalOrder: Number(firstItem.kuantitas) || 0,
      hargaJual: Number(firstItem.hargaJual) || 0,
      hargaBeli: Number(firstItem.hargaBeli) || 0,
      satuan: 'm3',
    });

    setFormData(mkDefaultForm());
    setItems([]);
    setErrors({});
    setItemsLocked(false);
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
          <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/')} title="Kembali ke Dashboard" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pre Order &amp; Kontrak Pengiriman
            </h1>
            <p className="text-[11px] text-neutral-400">
              Pemesanan customer • Nomor PO resmi digenerate otomatis saat Surat Jalan pertama dicetak
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#131517] p-1 rounded-md border border-[#24282C]">
          <Button size="xs" variant={activeTab === 'list' ? 'primary' : 'ghost'} onClick={() => setActiveTab('list')}>
            Daftar PO ({preOrders.length})
          </Button>
          <Button size="xs" variant={activeTab === 'create' ? 'primary' : 'ghost'} icon={Plus} onClick={() => setActiveTab('create')}>
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

                  <div className="bg-[#181B1E] rounded-md p-2.5 border border-[#24282C] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Realisasi Kirim:{' '}
                        <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> / {formatVolume(po.totalOrder, po.satuan)}
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
                              <Button size="xs" variant="danger" icon={XCircle} onClick={() => setRejectModalId(po.id)}>Tolak PO</Button>
                              <Button size="xs" variant="primary" icon={CheckCircle2} onClick={() => approvePreOrder(po.id, `${currentUser.name} (Direktur)`)}>Setujui PO</Button>
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
                          <Button size="xs" variant="secondary" onClick={() => navigate('/surat-jalan')}>Buat Surat Jalan &rarr;</Button>
                        </div>
                      )}
                      {po.status === 'REJECTED' && (
                        <span className="text-[10px] text-rose-400 font-mono">Alasan: {po.rejectionReason}</span>
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
          <FormAppBar title="Buat Received Order (RO)" onBack={() => setActiveTab('list')} />

          <form onSubmit={handleCreate} noValidate className="pb-6">

            {/* ── Row 1: Tanggal | T.O.P. ── */}
            <div className="grid grid-cols-2 gap-px">
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
            <div className="grid grid-cols-2 gap-px">
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

            {/* ── Row 3: Pilih Customer ── */}
            <div ref={errors.customer ? firstErrorRef : null}>
              <SelectField
                icon={User}
                label="Pilih Customer"
                value={formData.customer}
                onChange={(v) => setField('customer', v)}
                options={customerOptions}
                required
                searchable={customerOptions.length > 5}
                error={errors.customer}
              />
            </div>

            {/* ── Row 4: Jenis Wajib Pajak ── */}
            <SelectField
              icon={Monitor}
              label="Jenis Wajib Pajak"
              value={formData.jenisWajibPajak}
              onChange={(v) => setField('jenisWajibPajak', v)}
              options={JENIS_PAJAK_OPTIONS}
            />

            {/* ── Row 5: Nomor PO Customer ── */}
            <TextField
              icon={FileText}
              label="Nomor PO Customer"
              value={formData.nomorPoCustomer}
              onChange={(e) => setField('nomorPoCustomer', e.target.value)}
              helper="Biarkan kosong apabila belum tersedia"
              autoComplete="off"
            />

            {/* ── Row 6: Pilih Jenis RO ── */}
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

            {/* ── Row 7 (Conditional): Hubungkan Nomor PO Material ── */}
            <div
              className="overflow-hidden"
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

            {/* ══════════ DAFTAR ITEM — muncul setelah Jenis RO dipilih ══════════ */}
            <div
              className="overflow-hidden"
              style={
                prefersReduced
                  ? { display: showDaftarItem ? 'block' : 'none' }
                  : {
                      maxHeight: showDaftarItem ? '9999px' : '0px',
                      opacity: showDaftarItem ? 1 : 0,
                      transition: prefersReduced ? 'none' : 'max-height 300ms ease, opacity 250ms ease',
                    }
              }
              aria-hidden={!showDaftarItem}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-1 pt-5 pb-2">
                <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                  Daftar Item
                </span>
                {errors.items && (
                  <span className="text-[11px] text-rose-400">{errors.items}</span>
                )}
              </div>

              {/* Column header (desktop only) */}
              <div className="hidden md:flex items-center gap-2 px-10 pb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                <span className="flex-1 min-w-[140px]">Nama</span>
                <span className="w-28">Kuantitas</span>
                <span className="w-32">Harga Jual</span>
                <span className="w-32">Harga Beli</span>
                <span className="w-32">Total Harga Jual</span>
                <span className="w-32">Total Harga Beli</span>
              </div>

              {/* Item rows */}
              <div className="border-t border-[#2A2E35]">
                {items.map((item, idx) => {
                  const rowTotalJual = (Number(item.kuantitas) || 0) * (Number(item.hargaJual) || 0);
                  const rowTotalBeli = (Number(item.kuantitas) || 0) * (Number(item.hargaBeli) || 0);
                  return (
                    <div
                      key={item.id}
                      className="flex items-stretch border-b border-[#2A2E35] group"
                    >
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={itemsLocked}
                        aria-label={`Hapus item ${idx + 1}`}
                        className={`shrink-0 w-10 flex items-center justify-center transition-colors
                          ${itemsLocked
                            ? 'text-neutral-700 cursor-not-allowed'
                            : 'text-neutral-600 hover:text-rose-400 cursor-pointer'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Scrollable field row */}
                      <div className="flex-1 overflow-x-auto">
                        <div className="flex items-stretch min-w-max md:min-w-0 md:flex-wrap">

                          {/* Nama */}
                          <div className="w-40 md:flex-1 md:min-w-[140px] border-l border-[#2A2E35]">
                            <SelectField
                              label="Nama"
                              value={item.nama}
                              onChange={(v) => updateItem(idx, 'nama', v)}
                              options={itemNameOptions}
                              disabled={itemsLocked}
                            />
                          </div>

                          {/* Kuantitas */}
                          <div className="w-32 border-l border-[#2A2E35]">
                            <NumberField
                              label="Kuantitas"
                              value={item.kuantitas}
                              onChange={(v) => updateItem(idx, 'kuantitas', v)}
                              min={0}
                              disabled={itemsLocked}
                            />
                          </div>

                          {/* Harga Jual */}
                          <div className="w-36 border-l border-[#2A2E35]">
                            <NumberField
                              label="Harga Jual"
                              value={item.hargaJual}
                              onChange={(v) => updateItem(idx, 'hargaJual', v)}
                              min={0}
                              disabled={itemsLocked}
                            />
                          </div>

                          {/* Harga Beli */}
                          <div className="w-36 border-l border-[#2A2E35]">
                            <NumberField
                              label="Harga Beli"
                              value={item.hargaBeli}
                              onChange={(v) => updateItem(idx, 'hargaBeli', v)}
                              min={0}
                              disabled={itemsLocked}
                            />
                          </div>

                          {/* Total Harga Jual (computed, readonly) */}
                          <div className="w-36 border-l border-[#2A2E35] bg-[#181B1E] flex flex-col justify-center px-4 pt-5 pb-1.5 min-h-[56px]">
                            <span className="text-[11px] text-neutral-500 absolute mt-[-20px] text-[10px]">Total Harga Jual</span>
                            <span className="text-[13px] text-neutral-200 font-mono mt-3">
                              {rowTotalJual > 0 ? rowTotalJual.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '0.00'}
                            </span>
                          </div>

                          {/* Total Harga Beli (computed, readonly) */}
                          <div className="w-36 border-l border-[#2A2E35] bg-[#181B1E] flex flex-col justify-center px-4 pt-5 pb-1.5 min-h-[56px]">
                            <span className="text-[11px] text-neutral-500 absolute mt-[-20px] text-[10px]">Total Harga Beli</span>
                            <span className="text-[13px] text-neutral-200 font-mono mt-3">
                              {rowTotalBeli > 0 ? rowTotalBeli.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tambah Item button */}
              {!itemsLocked && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-4 py-3 text-[13px] text-[#F4511E] hover:text-[#E04418] font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Item
                </button>
              )}

              {/* Gross margin summary */}
              {items.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2E35] mt-1">
                  <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Estimasi Total Gross Margin</span>
                  </div>
                  <strong className="text-white text-sm font-mono">{formatCurrency(totalMargin)}</strong>
                </div>
              )}

              {/* KUNCI ITEM button */}
              {items.length > 0 && (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={() => setItemsLocked((v) => !v)}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm text-white
                      transition-all shadow-lg active:scale-95
                      ${itemsLocked
                        ? 'bg-neutral-600 hover:bg-neutral-500 shadow-neutral-800/40'
                        : 'bg-[#F4511E] hover:bg-[#E04418] shadow-[#F4511E]/30'}
                    `}
                  >
                    <Lock className="w-4 h-4" />
                    {itemsLocked ? 'BUKA KUNCI ITEM' : 'KUNCI ITEM'}
                  </button>
                </div>
              )}
            </div>

            {/* FAB Submit */}
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
            <Button variant="ghost" onClick={() => setRejectModalId(null)}>Batal</Button>
            <Button variant="danger" icon={XCircle} onClick={handleConfirmReject}>Konfirmasi Tolak</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
