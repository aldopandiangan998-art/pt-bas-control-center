import { useState, useRef, useMemo, useEffect } from 'react';
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
  Unlock,
  Package,
  Building2,
  HelpCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_MATERIALS } from '../../utils/constants';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card } from '../../components/ui';
import {
  DateField,
  SelectField,
  TextField,
  FormAppBar,
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

const JENIS_PAJAK_OPTIONS = [
  { value: 'PKP', label: 'PKP (Pengusaha Kena Pajak)' },
  { value: 'NON PKP', label: 'NON PKP' },
];

const JENIS_RO_OPTIONS = [
  { value: 'JASA ANGKUT + MATERIAL', label: 'JASA ANGKUT + MATERIAL' },
  { value: 'MATERIAL SAJA', label: 'MATERIAL SAJA' },
  { value: 'JASA ANGKUT SAJA', label: 'JASA ANGKUT SAJA' },
];

/* ─────────────────────────── helpers ─────────────────────────── */
function mkNomorRO() {
  return `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
}

function createItemFromMaterial(mat, existingId = null) {
  if (!mat) {
    return {
      id: existingId || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      materialId: '',
      nama: '',
      category: 'Curah',
      satuan: 'm3',
      kuantitas: '',
      hargaBeli: 0,
      hargaJual: 0,
      pphRate: 2.0,
    };
  }
  return {
    id: existingId || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialId: mat.id || '',
    nama: mat.name || mat.nama || '',
    category: mat.category || 'Curah',
    satuan: mat.satuan || mat.defaultUnit || 'm3',
    kuantitas: '', // User only enters quantity!
    hargaBeli: Number(mat.beli) || 0, // Auto-populated from database
    hargaJual: Number(mat.jual) || 0, // Auto-populated from database
    pphRate: Number(mat.pphRate) || 2.0,
  };
}

function mkDefaultForm() {
  return {
    tanggal: new Date().toISOString().split('T')[0],
    top: '30 Hari',
    jenis: 'CURAH',
    mataUang: 'IDR',
    customer: '',
    jenisWajibPajak: 'PKP',
    nomorPoCustomer: '',
    nomorRO: mkNomorRO(),
    jenisRO: '',
    hubungkanNomorPoMaterial: '',
  };
}

/* ─────────────────────────── main component ─────────────────────────── */
export default function PreOrderPage() {
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin, roleLabel, permissions } = useAuth();
  const { preOrders, createPreOrder, approvePreOrder, rejectPreOrder, materials, customers, currencies } = useData();
  const { addToast } = useToast();

  const safePreOrders = Array.isArray(preOrders) ? preOrders : [];

  const [activeTab, setActiveTab] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [itemsLocked, setItemsLocked] = useState(false);

  const [formData, setFormData] = useState(mkDefaultForm());
  const [items, setItems] = useState([]);
  const firstErrorRef = useRef(null);

  // Dynamic currency options mapped from active currencies in DataContext
  const mataUangOptions = useMemo(() => {
    if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
      return [{ value: 'IDR', label: 'IDR – Rupiah Indonesia' }];
    }
    const active = currencies.filter((c) => c.aktif === true || c.aktif === 1);
    if (active.length === 0) {
      return [{ value: 'IDR', label: 'IDR – Rupiah Indonesia' }];
    }
    return active.map((c) => ({
      value: c.code,
      label: `${c.code} – ${c.name || c.englishName || c.code}`,
    }));
  }, [currencies]);

  // Keep formData.mataUang in sync if currently selected currency gets disabled
  useEffect(() => {
    if (mataUangOptions.length > 0 && !mataUangOptions.some((o) => o.value === formData.mataUang)) {
      const fallback = mataUangOptions.find((o) => o.value === 'IDR')?.value || mataUangOptions[0].value;
      setFormData((prev) => ({ ...prev, mataUang: fallback }));
    }
  }, [mataUangOptions, formData.mataUang]);

  // Complete materials list from Database (DataContext), falling back to DEFAULT_MATERIALS
  const allMaterials = useMemo(() => {
    return materials && materials.length > 0 ? materials : DEFAULT_MATERIALS;
  }, [materials]);

  // Filter materials based on selected jenisRO
  const availableMaterials = useMemo(() => {
    if (!formData.jenisRO) return allMaterials;
    if (formData.jenisRO === 'JASA ANGKUT SAJA') {
      const j = allMaterials.filter(
        (m) =>
          m.category === 'Jasa' ||
          (m.name || m.nama || '').toUpperCase().includes('JASA ANGKUT') ||
          (m.name || m.nama || '').toUpperCase().includes('ANGKUT')
      );
      return j.length > 0 ? j : allMaterials;
    }
    if (formData.jenisRO === 'MATERIAL SAJA') {
      return allMaterials.filter(
        (m) =>
          m.category !== 'Jasa' &&
          !(m.name || m.nama || '').toUpperCase().includes('JASA ANGKUT') &&
          !(m.name || m.nama || '').toUpperCase().includes('ANGKUT')
      );
    }
    // 'JASA ANGKUT + MATERIAL' -> Semua material di database tersedia
    return allMaterials;
  }, [allMaterials, formData.jenisRO]);

  const showHubungkanPo = formData.jenisRO === 'JASA ANGKUT SAJA';
  const showDaftarItem = !!formData.jenisRO;

  // Computed summary totals
  const totalKuantitas = useMemo(() => {
    return items.reduce((s, i) => s + (Number(i.kuantitas) || 0), 0);
  }, [items]);

  const totalHargaBeli = useMemo(() => {
    return items.reduce((s, i) => s + (Number(i.kuantitas) || 0) * (Number(i.hargaBeli) || 0), 0);
  }, [items]);

  const totalHargaJual = useMemo(() => {
    return items.reduce((s, i) => s + (Number(i.kuantitas) || 0) * (Number(i.hargaJual) || 0), 0);
  }, [items]);

  const totalMargin = totalHargaJual - totalHargaBeli;
  const marginPercentage = totalHargaJual > 0 ? (totalMargin / totalHargaJual) * 100 : 0;

  // Customer dropdown options
  const customerOptions = useMemo(() => {
    return (customers || []).map((c) => ({
      value: c.name,
      label: c.kodePrefix ? `${c.kodePrefix} – ${c.name}` : c.name,
    }));
  }, [customers]);

  // Materials for Hubungkan PO Material dropdown
  const materialPoOptions = useMemo(() => {
    return allMaterials.map((m) => ({
      value: m.name || m.nama || m.id,
      label: `${m.name || m.nama} (${m.satuan || m.defaultUnit || 'm3'})`,
    }));
  }, [allMaterials]);

  /* ── field setter ── */
  const setField = (key, val) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'jenisRO') {
        if (val !== 'JASA ANGKUT SAJA') next.hubungkanNomorPoMaterial = '';

        // Auto-initialize first item from database with auto-filled prices
        let pool = allMaterials;
        if (val === 'JASA ANGKUT SAJA') {
          const j = allMaterials.filter(
            (m) =>
              m.category === 'Jasa' ||
              (m.name || m.nama || '').toUpperCase().includes('JASA ANGKUT') ||
              (m.name || m.nama || '').toUpperCase().includes('ANGKUT')
          );
          pool = j.length > 0 ? j : allMaterials;
        } else if (val === 'MATERIAL SAJA') {
          pool = allMaterials.filter(
            (m) =>
              m.category !== 'Jasa' &&
              !(m.name || m.nama || '').toUpperCase().includes('JASA ANGKUT') &&
              !(m.name || m.nama || '').toUpperCase().includes('ANGKUT')
          );
        }

        const firstMat = pool[0];
        setItems(val && firstMat ? [createItemFromMaterial(firstMat)] : []);
        setItemsLocked(false);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  /* ── material selection change in item row ── */
  const handleMaterialChange = (idx, selectedName) => {
    if (itemsLocked) return;
    const mat =
      availableMaterials.find((m) => (m.name || m.nama) === selectedName) ||
      allMaterials.find((m) => (m.name || m.nama) === selectedName);
    if (!mat) return;

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          materialId: mat.id || '',
          nama: mat.name || mat.nama || '',
          satuan: mat.satuan || mat.defaultUnit || 'm3',
          category: mat.category || 'Curah',
          pphRate: Number(mat.pphRate) || 2.0,
          hargaBeli: Number(mat.beli) || 0, // Auto-populated!
          hargaJual: Number(mat.jual) || 0, // Auto-populated!
        };
      })
    );
  };

  /* ── item management ── */
  const addItem = () => {
    if (itemsLocked) return;
    const usedNames = new Set(items.map((i) => i.nama));
    const nextMat =
      availableMaterials.find((m) => !usedNames.has(m.name || m.nama)) ||
      availableMaterials[0] ||
      allMaterials[0];
    setItems((prev) => [...prev, createItemFromMaterial(nextMat)]);
  };

  const removeItem = (idx) => {
    if (itemsLocked || items.length <= 1) return;
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
    if (!formData.tanggal) e.tanggal = 'Tanggal kontrak wajib diisi';
    if (!formData.jenis) e.jenis = 'Jenis pengiriman wajib dipilih';
    if (!formData.mataUang) e.mataUang = 'Mata uang wajib dipilih';
    if (!formData.customer) e.customer = 'Customer wajib dipilih';
    if (!formData.jenisRO) e.jenisRO = 'Pilih jenis RO terlebih dahulu';
    if (items.length === 0) {
      e.items = 'Tambahkan minimal 1 item material';
    } else {
      const invalidQty = items.some((it) => !it.kuantitas || Number(it.kuantitas) <= 0);
      if (invalidQty) {
        e.items = 'Harap isi kuantitas untuk semua item material (harus lebih dari 0)';
      }
    }
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
    const firstItem = items[0] || {};
    createPreOrder({
      ...formData,
      items,
      materialId: firstItem.materialId || 'mat-1',
      materialName: firstItem.nama || 'SIRTU',
      materialCategory: firstItem.category || 'Curah',
      pphRate: Number(firstItem.pphRate) || 2.0,
      totalOrder: totalKuantitas || Number(firstItem.kuantitas) || 0,
      hargaJual: Number(firstItem.hargaJual) || 0,
      hargaBeli: Number(firstItem.hargaBeli) || 0,
      satuan: firstItem.satuan || 'm3',
    });

    setFormData(mkDefaultForm());
    setItems([]);
    setErrors({});
    setItemsLocked(false);
    setSubmitting(false);
    setActiveTab('list');
  };

  /* ── reset / cancel form ── */
  const handleResetForm = () => {
    setFormData(mkDefaultForm());
    setItems([]);
    setErrors({});
    setItemsLocked(false);
  };

  const handleCancel = () => {
    handleResetForm();
    setActiveTab('list');
  };

  const handleBuatSuratJalan = (po) => {
    if (po.status !== 'APPROVED') {
      addToast(
        'Surat Jalan belum dapat dibuat. Pre Order harus disetujui oleh Super Admin terlebih dahulu.',
        'warning'
      );
      return;
    }
    navigate('/surat-jalan', {
      state: {
        fromPreOrder: true,
        preOrderId: po.id,
        customer: po.customer,
        nomorPo: po.nomorPo || po.id,
        materialId: po.materialId,
        materialName: po.materialName,
        jenis: po.jenis || 'Jasa Angkut + Material',
        nomorRo: po.nomorRo || `RO-${po.id}`,
      },
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="w-full space-y-6 pb-20">

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22262A]">
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/')} title="Kembali ke Dashboard" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pre Order &amp; Kontrak Pengiriman
            </h1>
            <p className="text-xs text-neutral-400">
              Pemesanan customer • Nomor PO resmi digenerate otomatis saat Surat Jalan pertama dicetak
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#14171A] p-1 rounded-lg border border-[#22262A]">
          <Button size="sm" variant={activeTab === 'list' ? 'primary' : 'ghost'} onClick={handleCancel}>
            Daftar PO ({safePreOrders.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => {
              if (activeTab !== 'create') {
                handleResetForm();
                setActiveTab('create');
              }
            }}
          >
            Input Pre Order
          </Button>
        </div>
      </div>

      {/* ══════════ VIEW 1: DAFTAR PRE ORDER AKTIF ══════════ */}
      {activeTab === 'list' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono px-1">
            <span>Daftar Pre Order di Sistem Gresik:</span>
            <span>
              Role aktif:{' '}
              <strong className="text-white font-medium">
                {roleLabel || (currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin')}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {safePreOrders.map((po) => {
              const fulfillmentPct = Math.min(120, Math.round((po.terkirim / (po.totalOrder || 1)) * 100));
              const isOverDelivered = fulfillmentPct > 100;
              return (
                <Card key={po.id} hover className="p-4.5 sm:p-5 space-y-3.5 bg-[#14171A] border border-[#22262A]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#1C1F23] text-neutral-200 border border-[#2B3037]">
                          {po.nomorPo || 'DRAFT (MENUNGGU SURAT JALAN PERTAMA)'}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">{po.tanggal}</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {po.customer}{' '}
                        <span className="text-neutral-500 font-normal">•</span>{' '}
                        <span className="text-amber-400 font-medium">
                          {po.items && po.items.length > 1
                            ? `${po.materialName} (+${po.items.length - 1} item lainnya)`
                            : po.materialName}
                        </span>
                      </div>
                    </div>
                    <div>
                      {po.status === 'APPROVED' && <Badge variant="success" dot>APPROVED</Badge>}
                      {po.status === 'MENUNGGU_APPROVAL' && <Badge variant="warning" dot>MENUNGGU APPROVAL</Badge>}
                      {po.status === 'REJECTED' && <Badge variant="error" dot>DITOLAK</Badge>}
                    </div>
                  </div>

                  <div className="bg-[#111315] rounded-md p-2.5 border border-[#22262A] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">
                        Realisasi Kirim:{' '}
                        <strong className="text-white">{formatVolume(po.terkirim, po.satuan)}</strong> / {formatVolume(po.totalOrder, po.satuan)}
                      </span>
                      <span className={`font-bold ${isOverDelivered ? 'text-amber-400' : 'text-neutral-300'}`}>
                        {fulfillmentPct}% {isOverDelivered && '(Peringatan Toleransi 20%)'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1C1F23] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isOverDelivered ? 'bg-amber-400' : 'bg-[#F4511E]'}`}
                        style={{ width: `${Math.min(100, fulfillmentPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs border-t border-[#22262A]">
                    <div className="flex items-center gap-4 text-neutral-400 font-mono">
                      <span>Jual: <strong className="text-white">{formatCurrency(po.hargaJual)}</strong>/{po.satuan}</span>
                      <span>Beli: <strong className="text-neutral-300">{formatCurrency(po.hargaBeli)}</strong>/{po.satuan}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <span className="text-xs text-amber-500/90 font-mono bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/40 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Menunggu Persetujuan Direktur</span>
                        </span>
                      )}
                      {po.status === 'APPROVED' && (
                        <span className="text-xs text-neutral-400 font-mono">
                          Disetujui: <strong className="text-emerald-400">{po.approvedBy}</strong>
                        </span>
                      )}
                      {po.status === 'REJECTED' && (
                        <span className="text-xs text-rose-400 font-mono">Alasan: {po.rejectionReason}</span>
                      )}

                      {/* Super Admin Quick Approval Actions */}
                      {isSuperAdmin && po.status === 'MENUNGGU_APPROVAL' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => approvePreOrder(po.id, `${currentUser?.name || 'David Rusiah'} (Direktur)`)}
                            title="Setujui Pre Order ini (Direktur Approval)"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Setujui RO
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => {
                              const reason = prompt('Masukkan alasan penolakan Pre Order:') || 'Harga atau kuota tidak sesuai';
                              rejectPreOrder(po.id, reason);
                            }}
                            title="Tolak Pre Order"
                          >
                            Tolak
                          </Button>
                        </div>
                      )}

                      {/* Fitur Buat Surat Jalan GI untuk Pre Order (Hanya jika APPROVED) */}
                      <Button
                        size="sm"
                        variant={po.status === 'APPROVED' ? 'primary' : 'ghost'}
                        icon={po.status === 'APPROVED' ? FileText : Lock}
                        disabled={po.status !== 'APPROVED'}
                        onClick={() => handleBuatSuratJalan(po)}
                        title={
                          po.status === 'APPROVED'
                            ? `Buat Surat Jalan GI untuk ${po.customer}`
                            : 'Pre Order belum disetujui Super Admin. Surat Jalan terkunci.'
                        }
                        className={
                          po.status !== 'APPROVED'
                            ? 'opacity-50 cursor-not-allowed border border-[#2B3037] text-neutral-500 hover:bg-transparent'
                            : ''
                        }
                      >
                        {po.status === 'APPROVED' ? 'Buat Surat Jalan GI \u2192' : 'Surat Jalan (Terkunci)'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════ VIEW 2: FORM BUAT RO (TERSTRUKTUR & RAPI) ══════════ */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <FormAppBar title="Buat Received Order (RO) Baru" onBack={handleCancel} />

          <form onSubmit={handleCreate} noValidate className="space-y-6 pb-6">

            {/* ── CARD 1: INFORMASI PEMESANAN & CUSTOMER ── */}
            <div className="bg-[#14171A] border border-[#22262A] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#22262A]">
                <div className="w-8 h-8 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#F4511E]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Informasi Pre Order &amp; Pelanggan
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Detail kontrak pemesanan, data pelanggan, dan termin pembayaran
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tanggal */}
                <div ref={errors.tanggal ? firstErrorRef : null}>
                  <DateField
                    label="Tanggal Kontrak"
                    value={formData.tanggal}
                    onChange={(v) => setField('tanggal', v)}
                    required
                    error={errors.tanggal}
                  />
                </div>

                {/* T.O.P. */}
                <SelectField
                  icon={Calendar}
                  label="T.O.P. (Term of Payment)"
                  value={formData.top}
                  onChange={(v) => setField('top', v)}
                  options={TOP_OPTIONS}
                />

                {/* Jenis Pengiriman */}
                <div ref={errors.jenis ? firstErrorRef : null}>
                  <SelectField
                    icon={Monitor}
                    label="Jenis Pengiriman"
                    value={formData.jenis}
                    onChange={(v) => setField('jenis', v)}
                    options={JENIS_OPTIONS}
                    required
                    error={errors.jenis}
                  />
                </div>

                {/* Pilih Customer */}
                <div className="md:col-span-2 lg:col-span-2" ref={errors.customer ? firstErrorRef : null}>
                  <SelectField
                    icon={User}
                    label="Pilih Customer / Pelanggan"
                    value={formData.customer}
                    onChange={(v) => setField('customer', v)}
                    options={customerOptions}
                    searchable={customerOptions.length > 4}
                    required
                    error={errors.customer}
                  />
                </div>

                {/* Jenis Wajib Pajak */}
                <SelectField
                  icon={Building2}
                  label="Jenis Wajib Pajak"
                  value={formData.jenisWajibPajak}
                  onChange={(v) => setField('jenisWajibPajak', v)}
                  options={JENIS_PAJAK_OPTIONS}
                />

                {/* Mata Uang */}
                <div ref={errors.mataUang ? firstErrorRef : null}>
                  <SelectField
                    icon={DollarSign}
                    label="Mata Uang"
                    value={formData.mataUang}
                    onChange={(v) => setField('mataUang', v)}
                    options={mataUangOptions}
                    required
                    error={errors.mataUang}
                  />
                </div>

                {/* Nomor PO Customer */}
                <TextField
                  icon={FileText}
                  label="Nomor PO Customer"
                  value={formData.nomorPoCustomer}
                  onChange={(e) => setField('nomorPoCustomer', e.target.value)}
                  helper="Opsional (biarkan kosong jika belum terbit)"
                  autoComplete="off"
                />

                {/* Pilih Jenis RO (Trigger Pembuka Item Material) */}
                <div ref={errors.jenisRO ? firstErrorRef : null}>
                  <SelectField
                    icon={List}
                    label="Pilih Jenis RO"
                    value={formData.jenisRO}
                    onChange={(v) => setField('jenisRO', v)}
                    options={JENIS_RO_OPTIONS}
                    required
                    error={errors.jenisRO}
                    helper="Menentukan filter jenis material &amp; layanan"
                  />
                </div>

                {/* Conditional: Hubungkan Nomor PO Material (jika JASA ANGKUT SAJA) */}
                {showHubungkanPo && (
                  <div className="col-span-full pt-1">
                    <SelectField
                      icon={Layers}
                      label="Hubungkan Nomor PO Material"
                      value={formData.hubungkanNomorPoMaterial}
                      onChange={(v) => setField('hubungkanNomorPoMaterial', v)}
                      options={materialPoOptions}
                      searchable={materialPoOptions.length > 5}
                      helper="Kaitkan pengiriman jasa angkut ini dengan PO material yang bersangkutan"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── CARD 2: DAFTAR ITEM MATERIAL & KUANTITAS ── */}
            {!showDaftarItem ? (
              <div className="rounded-xl border border-dashed border-[#2B3037] bg-[#14171A]/60 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#1C1F23] text-neutral-400 mx-auto flex items-center justify-center mb-3">
                  <List className="w-6 h-6 text-[#F4511E]" />
                </div>
                <h4 className="text-sm font-semibold text-white">Pilih Jenis RO Terlebih Dahulu</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Silakan pilih <strong className="text-amber-400">Jenis RO</strong> pada form di atas untuk memuat daftar item lengkap beserta harga beli dan harga jual dari database secara otomatis.
                </p>
              </div>
            ) : (
              <div className="bg-[#14171A] border border-[#22262A] rounded-xl p-5 space-y-4 shadow-sm" ref={errors.items ? firstErrorRef : null}>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22262A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/30 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#F4511E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          Daftar Item Material
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#1C1F23] text-amber-400 border border-amber-500/20">
                          {formData.jenisRO}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Harga beli &amp; harga jual otomatis terisi dari Database Master. Anda hanya perlu mengisi kuantitas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {items.length > 0 && (
                      <Button
                        type="button"
                        size="xs"
                        variant={itemsLocked ? 'secondary' : 'ghost'}
                        icon={itemsLocked ? Lock : Unlock}
                        onClick={() => setItemsLocked((v) => !v)}
                      >
                        {itemsLocked ? 'Buka Kunci' : 'Kunci Item'}
                      </Button>
                    )}
                    {!itemsLocked && (
                      <Button
                        type="button"
                        size="xs"
                        variant="primary"
                        icon={Plus}
                        onClick={addItem}
                      >
                        Tambah Item
                      </Button>
                    )}
                  </div>
                </div>

                {/* Error Banner if items invalid */}
                {errors.items && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.items}</span>
                  </div>
                )}

                {/* ── DESKTOP/TABLET TABLE ── */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-[#22262A] bg-[#111315]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#181B1E] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#22262A]">
                        <th className="py-2.5 px-3 text-center w-12 font-mono">#</th>
                        <th className="py-2.5 px-4 min-w-[220px]">Material / Layanan (Database)</th>
                        <th className="py-2.5 px-3 w-20 text-center font-mono">Satuan</th>
                        <th className="py-2.5 px-3 w-36 font-mono text-amber-400">
                          Kuantitas *
                        </th>
                        <th className="py-2.5 px-3 w-36 font-mono">Harga Beli (HPP)</th>
                        <th className="py-2.5 px-3 w-36 font-mono">Harga Jual</th>
                        <th className="py-2.5 px-3 w-36 font-mono text-right">Subtotal Beli</th>
                        <th className="py-2.5 px-3 w-36 font-mono text-right">Subtotal Jual</th>
                        <th className="py-2.5 px-3 w-14 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22262A] text-xs">
                      {items.map((item, idx) => {
                        const rowTotalBeli = (Number(item.kuantitas) || 0) * (Number(item.hargaBeli) || 0);
                        const rowTotalJual = (Number(item.kuantitas) || 0) * (Number(item.hargaJual) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-[#16181B] transition-colors">
                            {/* Index */}
                            <td className="py-2.5 px-3 text-center font-mono text-neutral-400 text-xs">
                              {idx + 1}
                            </td>

                            {/* Material Selector with full database items */}
                            <td className="py-2 px-3">
                              <select
                                value={item.nama}
                                onChange={(e) => handleMaterialChange(idx, e.target.value)}
                                disabled={itemsLocked}
                                className="w-full bg-[#181B1E] border border-[#2B3037] text-white rounded-md px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#F4511E] disabled:opacity-60 cursor-pointer"
                              >
                                {availableMaterials.map((m) => (
                                  <option key={m.id} value={m.name || m.nama} className="bg-[#181B1E] text-white">
                                    {m.name || m.nama} ({m.satuan || m.defaultUnit || 'm3'})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Satuan */}
                            <td className="py-2 px-3 text-center">
                              <span className="inline-block px-2 py-1 rounded bg-[#1C1F23] border border-[#2B3037] text-neutral-300 font-mono text-[11px]">
                                {item.satuan || 'm3'}
                              </span>
                            </td>

                            {/* Kuantitas (User's primary input) */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Isi kuantitas"
                                value={item.kuantitas}
                                onChange={(e) => updateItem(idx, 'kuantitas', e.target.value)}
                                disabled={itemsLocked}
                                className="w-full bg-[#181B1E] border-2 border-amber-500/60 focus:border-[#F4511E] text-white rounded-md px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#F4511E] disabled:opacity-60"
                              />
                            </td>

                            {/* Harga Beli (Auto-filled from database, editable) */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.hargaBeli}
                                onChange={(e) => updateItem(idx, 'hargaBeli', e.target.value)}
                                disabled={itemsLocked}
                                className="w-full bg-[#181B1E] border border-[#2B3037] text-neutral-300 rounded-md px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#F4511E] disabled:opacity-60"
                                title="Harga beli otomatis terisi dari Database Master (dapat disesuaikan jika perlu)"
                              />
                            </td>

                            {/* Harga Jual (Auto-filled from database, editable) */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.hargaJual}
                                onChange={(e) => updateItem(idx, 'hargaJual', e.target.value)}
                                disabled={itemsLocked}
                                className="w-full bg-[#181B1E] border border-[#2B3037] text-white rounded-md px-2.5 py-1.5 text-xs font-mono font-semibold focus:outline-none focus:border-[#F4511E] disabled:opacity-60"
                                title="Harga jual otomatis terisi dari Database Master (dapat disesuaikan jika perlu)"
                              />
                            </td>

                            {/* Subtotal Beli (Read-only) */}
                            <td className="py-2 px-3 text-right font-mono text-neutral-400 text-xs">
                              {formatCurrency(rowTotalBeli)}
                            </td>

                            {/* Subtotal Jual (Read-only) */}
                            <td className="py-2 px-3 text-right font-mono text-emerald-400 font-semibold text-xs">
                              {formatCurrency(rowTotalJual)}
                            </td>

                            {/* Action */}
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                disabled={itemsLocked || items.length <= 1}
                                className="p-1.5 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Hapus baris item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── MOBILE CARD VIEW (< md) ── */}
                <div className="md:hidden space-y-3">
                  {items.map((item, idx) => {
                    const rowTotalBeli = (Number(item.kuantitas) || 0) * (Number(item.hargaBeli) || 0);
                    const rowTotalJual = (Number(item.kuantitas) || 0) * (Number(item.hargaJual) || 0);
                    return (
                      <div key={item.id} className="bg-[#181B1E] border border-[#24282C] rounded-lg p-3.5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#22262A]">
                          <span className="font-mono text-xs font-bold text-neutral-300">
                            Item #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={itemsLocked || items.length <= 1}
                            className="text-neutral-500 hover:text-rose-400 disabled:opacity-30 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400 font-medium block mb-1">
                            Material / Layanan (Database)
                          </label>
                          <select
                            value={item.nama}
                            onChange={(e) => handleMaterialChange(idx, e.target.value)}
                            disabled={itemsLocked}
                            className="w-full bg-[#111315] border border-[#2B3037] text-white rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#F4511E]"
                          >
                            {availableMaterials.map((m) => (
                              <option key={m.id} value={m.name || m.nama}>
                                {m.name || m.nama} ({m.satuan || m.defaultUnit || 'm3'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-amber-400 font-bold block mb-1">
                              Kuantitas ({item.satuan || 'm3'}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={item.kuantitas}
                              onChange={(e) => updateItem(idx, 'kuantitas', e.target.value)}
                              disabled={itemsLocked}
                              className="w-full bg-[#111315] border-2 border-amber-500/60 focus:border-[#F4511E] text-white rounded-md px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">
                              Satuan
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={item.satuan || 'm3'}
                              className="w-full bg-[#111315]/50 border border-[#2B3037] text-neutral-400 rounded-md px-3 py-2 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">
                              Harga Beli (HPP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.hargaBeli}
                              onChange={(e) => updateItem(idx, 'hargaBeli', e.target.value)}
                              disabled={itemsLocked}
                              className="w-full bg-[#111315] border border-[#2B3037] text-neutral-300 rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#F4511E]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-neutral-400 block mb-1">
                              Harga Jual
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.hargaJual}
                              onChange={(e) => updateItem(idx, 'hargaJual', e.target.value)}
                              disabled={itemsLocked}
                              className="w-full bg-[#111315] border border-[#2B3037] text-white rounded-md px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#F4511E]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#22262A] text-xs font-mono">
                          <span className="text-neutral-400">Total Jual:</span>
                          <span className="text-emerald-400 font-bold">{formatCurrency(rowTotalJual)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── SUMMARY STATS BAR ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[#181B1E] border border-[#24282C] rounded-lg p-3">
                    <div className="text-[11px] text-neutral-400 font-medium">Total Volume / Kuantitas</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {totalKuantitas.toLocaleString('id-ID')} <span className="text-xs font-normal text-neutral-400">{items[0]?.satuan || 'm3'}</span>
                    </div>
                  </div>

                  <div className="bg-[#181B1E] border border-[#24282C] rounded-lg p-3">
                    <div className="text-[11px] text-neutral-400 font-medium">Total Biaya Beli (HPP)</div>
                    <div className="text-base font-bold font-mono text-neutral-300 mt-1">
                      {formatCurrency(totalHargaBeli)}
                    </div>
                  </div>

                  <div className="bg-[#181B1E] border border-[#24282C] rounded-lg p-3">
                    <div className="text-[11px] text-neutral-400 font-medium">Total Nilai Penjualan</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {formatCurrency(totalHargaJual)}
                    </div>
                  </div>

                  <div className="bg-[#181B1E] border border-[#24282C] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400 font-medium">Estimasi Gross Margin</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${marginPercentage >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'}`}>
                        {marginPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`text-base font-bold font-mono mt-1 ${totalMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(totalMargin)}
                    </div>
                  </div>
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#22262A]">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={submitting}
                    title="Batalkan dan bersihkan seluruh isian form"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 font-bold"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan & Ajukan Pre Order'}
                  </Button>
                </div>
              </div>
            )}

          </form>
        </div>
      )}
    </div>
  );
}