import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Info,
  RotateCw,
  CheckCircle2,
  Search,
  X,
  FileText,
  BookOpen,
  Receipt,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  ListFilter,
  Filter,
  Calendar,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Check,
  Printer,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Button, Card, Badge } from '../../components/ui';
import BkkPrintModal from '../../components/bkk/BkkPrintModal';
import BkkDetailWorkflowModal from '../../components/bkk/BkkDetailWorkflowModal';

// ─────────────────────────────────────────────────────────────────────────────
// Binary Icon (1011 / 001) matching reference screenshot
// ─────────────────────────────────────────────────────────────────────────────
function BinaryIcon({ className = 'text-neutral-500' }) {
  return (
    <div className={`font-mono text-[9px] font-bold leading-[9px] tracking-tighter select-none ${className}`}>
      <div>1011</div>
      <div>001</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CashOutCard (Faithful replica of user screenshot)
// ─────────────────────────────────────────────────────────────────────────────
function CashOutCard({ item, isSelected, onSelect, onDelete, onInfo, canDelete = true }) {
  const volumeNum = Number(item.volume ?? item.kubikasi) || 0;
  const formattedVolume = volumeNum.toFixed(2);
  const rawSatuan = item.satuan || 'm3';
  const satuan = rawSatuan === 'm3' ? 'm³' : rawSatuan;
  const material = (item.material || 'SIRTU')
    .replace(/\s*\(Curah\)/i, '')
    .replace(/\s*\(Padat\)/i, '');

  const timestamp = item.timestamp || (item.tanggal ? `${item.tanggal} 09:15:42` : '-');
  const amountFormatted = `IDR ${(Number(item.amount) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const docCode = item.kodeTransaksi || item.nomorRO || '-';
  const customerName = item.customer || item.perusahaan || '-';
  const poCode = item.poNumber || item.subDetail || '-';
  const periodeText = item.periode
    ? (item.periode.startsWith('Periode:') ? item.periode : `Periode: ${item.periode}`)
    : (item.tanggal ? `Periode: ${item.tanggal}` : 'Periode: -');

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all select-none ${isSelected
        ? 'bg-[#181615] border-[#F4511E]/70 ring-1 ring-[#F4511E]/40'
        : 'bg-[#121417] border-[#22262B] hover:border-[#323842]'
        }`}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Left Column */}
        <div className="w-28 sm:w-36 shrink-0 flex flex-col justify-start">
          <div className="text-2xl sm:text-[26px] font-black font-mono text-white tracking-tight leading-none">
            {formattedVolume}
          </div>
          <div className="text-sm font-semibold font-mono text-neutral-200 mt-1 leading-tight">
            {satuan}
          </div>
          <div
            className="text-xs font-bold font-mono text-white uppercase tracking-wider mt-2.5 leading-tight truncate"
            title={material}
          >
            {material}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono uppercase leading-tight mt-1 space-y-0.5">
            <div>CURAH | JASA</div>
            <div>ANGKUT +</div>
            <div>MATERIAL</div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center shrink-0 shadow-xs"
                title="Bukti Kas Keluar"
              >
                <FileText className="w-2.5 h-2.5" />
              </div>
              <div
                className="w-5 h-5 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shrink-0 shadow-xs"
                title="Dokumen Terhubung (RO / SJ)"
              >
                <BookOpen className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-mono text-neutral-300 ml-1 truncate">
                {timestamp}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {(() => {
                const s = String(item.status || '').toLowerCase();
                const isPaid = s === 'paid' || item.statusBayar === 'Lunas';
                if (isPaid) {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      LUNAS
                    </span>
                  );
                }
                if (s === 'pending_verification') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40 text-[9px] font-mono font-bold">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      VERIFIKASI
                    </span>
                  );
                }
                if (s === 'revision_required') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                      <RotateCw className="w-2.5 h-2.5" />
                      REVISI TTD
                    </span>
                  );
                }
                if (s === 'approved') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-mono font-bold">
                      <Printer className="w-2.5 h-2.5" />
                      SIAP CETAK
                    </span>
                  );
                }
                if (s === 'rejected') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                      DITOLAK
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                    <Lock className="w-2.5 h-2.5" />
                    TERKUNCI
                  </span>
                );
              })()}
              <input
                type="checkbox"
                checked={isSelected}
                disabled={item.status !== 'paid' && item.statusBayar !== 'Lunas'}
                onChange={(item.status === 'paid' || item.statusBayar === 'Lunas') ? onSelect : undefined}
                className={`w-4 h-4 rounded border-[#3A404A] bg-[#16191D] accent-[#F4511E] ${(item.status === 'paid' || item.statusBayar === 'Lunas') ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  } shrink-0`}
                title={
                  (item.status === 'paid' || item.statusBayar === 'Lunas')
                    ? 'Pilih BKK yang sudah Lunas'
                    : 'BKK harus diverifikasi dokumen fisiknya oleh Super Admin terlebih dahulu'
                }
              />
            </div>
          </div>

          <div className="text-sm sm:text-base font-bold font-mono text-white mt-1.5 leading-tight">
            {amountFormatted}
          </div>
          <div className="text-xs font-mono text-neutral-300 mt-1 leading-tight truncate" title={docCode}>
            {docCode}
          </div>
          <div className="text-xs font-bold font-mono text-neutral-100 uppercase mt-0.5 leading-tight truncate" title={customerName}>
            {customerName}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate" title={poCode}>
            {poCode}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate">
            {periodeText}
          </div>
        </div>
      </div>

      <div className="border-t border-[#22262B] mt-3 pt-2.5">
        <div className={`grid ${canDelete ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="py-2 px-3 rounded-xl bg-[#16191D] hover:bg-rose-500/10 border border-[#262A2F] hover:border-rose-500/40 text-[#F4511E] flex items-center justify-center transition-colors cursor-pointer group"
              title="Hapus Cash Out"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-[#F4511E]" />
            </button>
          )}
          <button
            type="button"
            onClick={onInfo}
            className="py-2 px-3 rounded-xl bg-[#16191D] hover:bg-neutral-800 border border-[#262A2F] hover:border-neutral-600 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer group"
            title="Detail Informasi"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Keterangan Type Options
// ─────────────────────────────────────────────────────────────────────────────
const KETERANGAN_TYPES = [
  'general',
  'Material',
  'Jasa Angkut',
  'Kasbon',
  'Potongan',
  'Penyesuaian',
  'Solar',
  'Biaya Tambahan',
  'Operasional',
  'Administrasi',
  'Lainnya',
];

// ─────────────────────────────────────────────────────────────────────────────
// BkkPage (Main Page matching Invoice placement layout)
// ─────────────────────────────────────────────────────────────────────────────
export default function BkkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const {
    bkkList,
    fetchBkk,
    createBkk,
    deleteBkk,
    markBkkPaid,
    bankAccounts,
    suppliers,
    customers,
    rekapanList,
    preOrders,
    fetchAvailableOrdersForBkk,
  } = useData();
  const { addToast } = useToast();

  // ── Tab: 'list' | 'create' (Like Invoice page placement)
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab === 'create' || location.state?.fromRekapan) {
      return 'create';
    }
    return 'list';
  });

  // ── Form State
  const defaultCustomer = useMemo(() => {
    return customers.find((c) => c.name.includes('ASCO') || c.kodePrefix?.includes('ADM 044')) || customers[0] || null;
  }, [customers]);

  const defaultSupplier = useMemo(() => {
    return suppliers.find((s) => s.name.includes('ADITA') || s.rekeningAtasNama?.includes('ADITA')) || suppliers[0] || null;
  }, [suppliers]);

  const [formCustomerId, setFormCustomerId] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formPoNumber, setFormPoNumber] = useState('');
  const [formRoNumber, setFormRoNumber] = useState('');
  const [formMaterial, setFormMaterial] = useState('SIRTU');
  const [formVolume, setFormVolume] = useState(0);
  const [formHargaBeli, setFormHargaBeli] = useState(0);
  const [formAmount, setFormAmount] = useState(0);
  const [formJurnalId, setFormJurnalId] = useState('');
  const [formPreOrderId, setFormPreOrderId] = useState('');

  const [keteranganList, setKeteranganList] = useState([
    { id: 1, type: 'general', deskripsi: '' },
  ]);

  // ── Available Orders that DO NOT have an existing BKK (Requirement 1 - live from database)
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep a ref of bkkList so loadAvailableOrders does not get recreated on polling
  const bkkListRef = useRef(bkkList);
  useEffect(() => {
    bkkListRef.current = bkkList;
  }, [bkkList]);

  const loadAvailableOrders = useCallback(async (isInitial = false) => {
    if (isInitial || availableOrders.length === 0) {
      setLoadingOrders(true);
    }
    try {
      const orders = await fetchAvailableOrdersForBkk();
      // Double check client-side against bkkList
      const currentBkkList = bkkListRef.current || [];
      const filtered = (orders || []).filter((o) => {
        return !currentBkkList.some(
          (b) =>
            b.status !== 'REJECTED' &&
            ((o.nomorRO && b.nomorRO === o.nomorRO) ||
              (o.poNumber && o.poNumber !== '-' && b.poNumber === o.poNumber) ||
              (o.jurnalId && b.jurnalId === o.jurnalId) ||
              (o.preOrderId && b.preOrderId === o.preOrderId))
        );
      });
      setAvailableOrders((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev;
        return filtered;
      });
    } catch (err) {
      console.error('Failed to load available orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [fetchAvailableOrdersForBkk]);

  // Load available orders ONLY when the user is on the create tab
  useEffect(() => {
    if (activeTab === 'create') {
      loadAvailableOrders(true);
    }
  }, [activeTab, loadAvailableOrders]);

  // Current matched journal based on active form numbers
  const currentMatchedJournal = useMemo(() => {
    if (!formRoNumber && !formPoNumber) return null;
    return (
      availableOrders.find((r) => r.nomorRO === formRoNumber) ||
      (rekapanList || []).find(
        (r) =>
          (formRoNumber && r.nomorRO === formRoNumber) ||
          (formPoNumber && formPoNumber !== '-' && r.poNumber === formPoNumber)
      ) ||
      null
    );
  }, [availableOrders, rekapanList, formRoNumber, formPoNumber]);

  // Business Rule Validation 1: Check if current order is completed 100%
  const isCurrentOrderCompleted = useMemo(() => {
    if (!formRoNumber) return false;
    const inAvailable = availableOrders.find((r) => r.nomorRO === formRoNumber);
    if (inAvailable) return true;

    if (!currentMatchedJournal) return false;
    const tot = Number(currentMatchedJournal.totalVolume || 0);
    const tgt = Number(currentMatchedJournal.targetVolume || 0);
    const status = String(currentMatchedJournal.status || '').toUpperCase();
    if (status === 'SELESAI' || status === 'COMPLETED') return true;
    return tgt > 0 ? tot >= tgt : tot > 0;
  }, [availableOrders, formRoNumber, currentMatchedJournal]);

  // Business Rule Validation 2: Check if duplicate BKK already exists
  const existingOrderBkk = useMemo(() => {
    if (!formRoNumber && !formPoNumber && !formJurnalId) return null;
    return (
      (bkkList || []).find(
        (b) =>
          b.status !== 'REJECTED' &&
          ((formRoNumber && b.nomorRO && b.nomorRO === formRoNumber) ||
            (formPoNumber && formPoNumber !== '-' && b.poNumber === formPoNumber) ||
            (formJurnalId && b.jurnalId === formJurnalId) ||
            (formPreOrderId && b.preOrderId === formPreOrderId))
      ) || null
    );
  }, [bkkList, formRoNumber, formPoNumber, formJurnalId, formPreOrderId]);

  // Select available completed order from dropdown
  const handleSelectCompletedOrder = (roNumber) => {
    if (!roNumber) {
      setFormRoNumber('');
      setFormPoNumber('');
      setFormVolume(0);
      setFormHargaBeli(0);
      setFormAmount(0);
      setFormJurnalId('');
      setFormPreOrderId('');
      return;
    }

    const matched = availableOrders.find((r) => r.nomorRO === roNumber) ||
      (rekapanList || []).find((r) => r.nomorRO === roNumber);
    if (!matched) return;

    setFormRoNumber(matched.nomorRO);
    setFormPoNumber(matched.poNumber || matched.poNomorPo || '-');
    setFormMaterial(matched.material || 'SIRTU');
    const vol = Number(matched.totalVolume) || 0;
    const hBeli = Number(matched.hargaBeli) || 0;
    setFormVolume(vol);
    setFormHargaBeli(hBeli);
    setFormAmount(Number(matched.nominalBeli) || Math.round(vol * hBeli));
    setFormJurnalId(matched.jurnalId || matched.id || '');
    setFormPreOrderId(matched.preOrderId || matched.poId || '');

    // Auto-match Customer
    if (matched.customerId) {
      setFormCustomerId(matched.customerId);
    } else if (matched.customer) {
      const c = customers.find((x) => x.name.toLowerCase().includes(matched.customer.toLowerCase()));
      if (c) setFormCustomerId(c.id);
    }

    // Auto-match Supplier
    if (matched.supplierId) {
      setFormSupplierId(matched.supplierId);
    } else if (matched.defaultSupplierName) {
      const s = suppliers.find((x) => x.name.toLowerCase().includes(matched.defaultSupplierName.toLowerCase()));
      if (s) setFormSupplierId(s.id);
    }
  };

  // Set initial default selections once master data loads
  useEffect(() => {
    if (!formCustomerId && defaultCustomer) {
      setFormCustomerId(defaultCustomer.id);
    }
  }, [defaultCustomer, formCustomerId]);

  useEffect(() => {
    if (!formSupplierId && defaultSupplier) {
      setFormSupplierId(defaultSupplier.id);
    }
  }, [defaultSupplier, formSupplierId]);

  // Handle incoming order state (e.g. from RekapanPage) - Run only once per navigation
  const locationOrderHandledRef = useRef(false);
  useEffect(() => {
    if (location.state?.order && !locationOrderHandledRef.current) {
      locationOrderHandledRef.current = true;
      const o = location.state.order;
      if (o.nomorRO) setFormRoNumber(o.nomorRO);
      if (o.poNumber) setFormPoNumber(o.poNumber);
      if (o.material) setFormMaterial(o.material);
      if (o.totalVolume) setFormVolume(Number(o.totalVolume) || 0);
      if (o.hargaBeli) setFormHargaBeli(Number(o.hargaBeli) || 0);
      if (o.nominalBeli || (o.totalVolume && o.hargaBeli)) {
        setFormAmount(Number(o.nominalBeli) || Math.round((Number(o.totalVolume) || 0) * (Number(o.hargaBeli) || 0)));
      }
      if (o.id) setFormJurnalId(o.id);
      if (o.preOrderId) setFormPreOrderId(o.preOrderId);

      if (o.customer) {
        const c = customers.find((x) => x.name.toLowerCase().includes(o.customer.toLowerCase()));
        if (c) setFormCustomerId(c.id);
      }
      if (location.state?.fromRekapan || location.state?.activeTab === 'create') {
        setActiveTab('create');
      }
    }
  }, [location.state, customers]);

  // Selected entities derived
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === formCustomerId) || null;
  }, [customers, formCustomerId]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === formSupplierId) || null;
  }, [suppliers, formSupplierId]);

  // Auto-filled bank & receiver data from selected supplier
  const nomorRekeningDisplay = selectedSupplier
    ? `${selectedSupplier.bank} - ${selectedSupplier.noRekening}`
    : '';
  const rekeningAtasNamaDisplay = selectedSupplier?.rekeningAtasNama || '';
  const penerimaDisplay = selectedSupplier?.penerima || '';

  // ── List & Search Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Counts by status
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let verification = 0;
    let revision = 0;
    let paid = 0;

    bkkList.forEach((b) => {
      const s = String(b.status || '').toLowerCase();
      if (s === 'paid' || b.statusBayar === 'Lunas') paid++;
      else if (s === 'pending_verification') verification++;
      else if (s === 'revision_required') revision++;
      else if (s === 'approved') approved++;
      else if (s === 'pending_approval' || s === 'menunggu_approval') pending++;
    });

    return {
      pending,
      approved,
      verification,
      revision,
      paid,
      all: bkkList.length,
    };
  }, [bkkList]);

  // ── Modals
  const [workflowModalItem, setWorkflowModalItem] = useState(null);
  const [printModalItem, setPrintModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
  });

  // ── Reset handlers
  const handleResetCustomer = () => {
    setFormCustomerId('');
    addToast('Pilihan pelanggan di-reset', 'info');
  };

  const handleResetSupplier = () => {
    setFormSupplierId('');
    addToast('Pilihan supplier di-reset', 'info');
  };

  const handleResetList = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setSelectedItems([]);
    addToast('Filter daftar berhasil di-reset', 'info');
  };

  // ── Keterangan list handlers
  const handleAddKeterangan = () => {
    setKeteranganList((prev) => [
      ...prev,
      { id: Date.now(), type: 'general', deskripsi: '' },
    ]);
  };

  const handleRemoveKeterangan = (id) => {
    if (keteranganList.length <= 1) {
      setKeteranganList([{ id: Date.now(), type: 'general', deskripsi: '' }]);
      return;
    }
    setKeteranganList((prev) => prev.filter((k) => k.id !== id));
  };

  const handleUpdateKeterangan = (id, field, value) => {
    setKeteranganList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    );
  };

  // ── Submit Buat Cash Out (Strict manual submission after 100% order completion)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formRoNumber) {
      addToast('Silakan pilih Nomor RO yang telah selesai dikirim.', 'error');
      return;
    }

    if (!isCurrentOrderCompleted) {
      addToast(
        'Gagal: Order belum selesai dikirim. Sesuai alur bisnis PT BAS, BKK hanya dapat dibuat setelah kuantitas pengiriman 100% terpenuhi berdasarkan Rekapan Jurnal.',
        'error'
      );
      return;
    }

    if (existingOrderBkk) {
      addToast(
        `Gagal: BKK untuk Order ${formRoNumber} sudah pernah dibuat (${existingOrderBkk.kodeTransaksi || existingOrderBkk.id}). Sistem mencegah duplikasi BKK.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const sup = selectedSupplier;
      const cust = selectedCustomer;
      const keteranganText = keteranganList
        .filter((k) => k.deskripsi)
        .map((k) => `[${k.type}] ${k.deskripsi}`)
        .join(' | ');

      const today = new Date().toISOString().split('T')[0];
      const resolvedVol = formVolume > 0 ? formVolume : Number(currentMatchedJournal?.totalVolume || 0);
      const resolvedHarga = formHargaBeli > 0 ? formHargaBeli : Number(currentMatchedJournal?.hargaBeli || 0);
      const resolvedAmount = formAmount > 0 ? formAmount : Math.round(resolvedVol * resolvedHarga);

      const newBkkData = {
        tanggal: today,
        timestamp: `${today} ${new Date().toTimeString().slice(0, 8)}`,
        supplierId: formSupplierId,
        penerima: sup?.penerima || sup?.name || '-',
        perusahaan: sup?.name || '-',
        rekeningTujuan: nomorRekeningDisplay
          ? `${nomorRekeningDisplay} a/n ${rekeningAtasNamaDisplay}`
          : '-',
        rekeningAtasNama: rekeningAtasNamaDisplay,
        customerId: formCustomerId,
        customer: cust?.name || currentMatchedJournal?.customer || '-',
        poNumber: formPoNumber || currentMatchedJournal?.poNumber || '-',
        nomorRO: formRoNumber || currentMatchedJournal?.nomorRO,
        jurnalId: formJurnalId || currentMatchedJournal?.id || null,
        preOrderId: formPreOrderId || currentMatchedJournal?.preOrderId || null,
        material: formMaterial || currentMatchedJournal?.material || 'SIRTU',
        volume: resolvedVol,
        kubikasi: resolvedVol,
        satuan: currentMatchedJournal?.satuan || 'm³',
        hargaSatuan: resolvedHarga,
        amount: resolvedAmount,
        subDetail: keteranganText || `${cust?.name || currentMatchedJournal?.customer || 'Customer'} (${formRoNumber})`,
        statusBayar: 'Belum Dibayar',
        status: 'MENUNGGU_APPROVAL',
        periode: today.slice(0, 7),
      };

      const res = await createBkk(newBkkData);
      if (res?.success) {
        setFormRoNumber('');
        setFormPoNumber('');
        setFormVolume(0);
        setFormHargaBeli(0);
        setFormAmount(0);
        setFormJurnalId('');
        setFormPreOrderId('');
        await loadAvailableOrders(true);
        setActiveTab('list');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered BKK items
  const filteredBkk = useMemo(() => {
    return bkkList.filter((item) => {
      // Free text search
      const q = (searchFilter || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.kodeTransaksi && item.kodeTransaksi.toLowerCase().includes(q)) ||
        (item.nomorRO && item.nomorRO.toLowerCase().includes(q)) ||
        (item.poNumber && item.poNumber.toLowerCase().includes(q)) ||
        (item.perusahaan && item.perusahaan.toLowerCase().includes(q)) ||
        (item.customer && item.customer.toLowerCase().includes(q)) ||
        (item.material && item.material.toLowerCase().includes(q)) ||
        (item.subDetail && item.subDetail.toLowerCase().includes(q)) ||
        (item.penerima && item.penerima.toLowerCase().includes(q));

      // Status filter
      const s = String(item.status || '').toLowerCase();
      const isPaid = s === 'paid' || item.statusBayar === 'Lunas';

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && (s === 'pending_approval' || s === 'menunggu_approval')) ||
        (statusFilter === 'APPROVED' && s === 'approved') ||
        (statusFilter === 'VERIFIKASI' && s === 'pending_verification') ||
        (statusFilter === 'REVISI' && s === 'revision_required') ||
        (statusFilter === 'LUNAS' && isPaid);

      return matchSearch && matchStatus;
    });
  }, [bkkList, searchFilter, statusFilter]);

  const toggleSelect = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleConfirmPayment = () => {
    markBkkPaid(selectedItems, paymentForm);
    setSelectedItems([]);
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-4 w-full pb-32">
      {/* ── TOP HEADER WITH TAB SWITCHER (Identical placement to Invoice page) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'create') {
                setActiveTab('list');
              } else if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {activeTab === 'list' ? 'Data BKK' : 'Buat Cash Out'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar bukti kas keluar ke supplier & pelunasan kas operasional'
                : 'Formulir pengeluaran kas vendor & operasional tambang'}
            </p>
          </div>
        </div>

        {/* Tab switcher: [Daftar BKK (X)]  [+ Input BKK] */}
        <div className="flex items-center gap-1.5 bg-[#131517] p-1 rounded-md border border-[#24282C] self-start sm:self-auto">
          <Button
            size="xs"
            variant={activeTab === 'list' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('list')}
          >
            Daftar BKK ({bkkList.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Input BKK
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1 — DAFTAR BKK (List of Cash Out transactions)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* ── Toolbar Row 1: count + icon buttons ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredBkk.length} Bukti Kas Keluar (BKK)
            </span>

            <div className="flex items-center gap-1">
              {/* Status cycle filter */}
              <button
                type="button"
                onClick={() =>
                  setStatusFilter((p) =>
                    p === 'ALL' ? 'BELUM_BAYAR' : p === 'BELUM_BAYAR' ? 'LUNAS' : 'ALL'
                  )
                }
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${statusFilter !== 'ALL'
                  ? 'bg-[#F4511E]/20 text-[#F4511E]'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                title={`Filter Status: ${statusFilter}`}
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Date button */}
              <button
                type="button"
                onClick={() => addToast('Pilih rentang tanggal transaksi kas keluar', 'info')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Rentang Tanggal"
              >
                <Calendar className="w-4 h-4" />
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={handleResetList}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Search Input (Full width, matching Invoice design) ── */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Ketik nomor transaksi, customer, supplier, material..."
              className="w-full bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
            />
            {searchFilter && (
              <X
                className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                onClick={() => setSearchFilter('')}
              />
            )}
          </div>

          {/* ── Status Chips ── */}
          <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'ALL'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              SEMUA ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'PENDING'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>APPROVAL ({counts.pending})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'APPROVED'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>SIAP CETAK ({counts.approved})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('VERIFIKASI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'VERIFIKASI'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFIKASI ({counts.verification})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REVISI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'REVISI'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>REVISI ({counts.revision})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'LUNAS'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LUNAS ({counts.paid})</span>
            </button>
          </div>

          {/* ── BKK Items List ── */}
          {filteredBkk.length === 0 ? (
            <div className="p-8 text-center bg-[#121417] border border-[#20242A] rounded-2xl space-y-3 font-mono">
              <Receipt className="w-10 h-10 text-neutral-500 mx-auto" />
              <div className="text-sm text-neutral-300 font-bold">
                Tidak ada data Cash Out yang sesuai filter
              </div>
              <p className="text-xs text-neutral-500">
                Coba reset filter atau buat bukti kas keluar baru.
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button size="xs" variant="outline" onClick={handleResetList}>
                  Reset Filter
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  icon={Plus}
                  onClick={() => setActiveTab('create')}
                >
                  Input BKK Baru
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBkk.map((item) => (
                <CashOutCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={() => toggleSelect(item.id)}
                  onDelete={() => setDeleteConfirmItem(item)}
                  onInfo={() => setWorkflowModalItem(item)}
                  canDelete={isSuperAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2 — BUAT CASH OUT FORM (Slim, Compact, Refined UI)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="max-w-xl mx-auto py-2">
          <Card className="p-4 sm:p-5 bg-[#14171A] border-[#24282C] rounded-2xl shadow-xl space-y-4">

            {/* Header Form */}
            <div className="pb-3 border-b border-[#22262B] flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#F4511E]" />
                  <span>Formulir Pengajuan BKK (Cash Out)</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Pilih pesanan yang telah komplit 100% untuk pengeluaran kas supplier
                </p>
              </div>
              <Badge variant="outline" size="xs" className="font-mono text-[#F4511E] border-[#F4511E]/30">
                Alur Sah PT BAS
              </Badge>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">

              {/* 1. Pilih Nomor RO (Hanya menampilkan RO yang belum pernah dibuatkan BKK) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <span>Nomor RO (Order Selesai Kirim)</span>
                    <span className="text-[#F4511E]">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {loadingOrders && availableOrders.length === 0 ? 'Memuat database...' : `${availableOrders.length} RO Tersedia`}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={formRoNumber}
                    disabled={loadingOrders && availableOrders.length === 0}
                    onChange={(e) => handleSelectCompletedOrder(e.target.value)}
                    className="w-full bg-[#181B1E] text-white text-xs sm:text-sm font-medium rounded-xl px-3 py-2.5 border border-[#2B3037] focus:outline-none focus:border-[#F4511E] appearance-none pr-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" className="text-neutral-500">
                      {loadingOrders && availableOrders.length === 0
                        ? '— Sedang memeriksa database... —'
                        : availableOrders.length === 0
                          ? '— Tidak ada RO yang tersedia (Semua order telah memiliki BKK) —'
                          : '— Pilih Nomor Received Order (RO) —'}
                    </option>
                    {/* Fallback option if formRoNumber is selected but not currently in availableOrders list */}
                    {formRoNumber && !availableOrders.some((o) => o.nomorRO === formRoNumber) && (
                      <option value={formRoNumber} className="bg-[#181B1E]">
                        {formRoNumber} &bull; {currentMatchedJournal?.customer || selectedCustomer?.name || 'Customer'} ({formVolume || 0} m³ - {formMaterial || 'SIRTU'})
                      </option>
                    )}
                    {availableOrders.map((o) => (
                      <option key={o.nomorRO || o.jurnalId} value={o.nomorRO} className="bg-[#181B1E]">
                        {o.nomorRO} &bull; {o.customer} ({o.totalVolume} m³ - {o.material})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {availableOrders.length === 0 && !loadingOrders && (
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Semua pesanan yang telah selesai dikirim saat ini sudah memiliki rekapan BKK.</span>
                  </div>
                )}
              </div>

              {/* 2. Informasi PO & Customer (2 Kolom Slim) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Nomor PO</label>
                  <input
                    type="text"
                    value={formPoNumber}
                    onChange={(e) => setFormPoNumber(e.target.value)}
                    placeholder="PO Number"
                    className="w-full bg-[#181B1E] text-xs font-mono text-white rounded-xl px-3 py-2 border border-[#2B3037] focus:outline-none focus:border-[#F4511E]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Pelanggan (Customer)</label>
                  <div className="relative">
                    <select
                      value={formCustomerId}
                      onChange={(e) => setFormCustomerId(e.target.value)}
                      className="w-full bg-[#181B1E] text-white text-xs font-medium rounded-xl px-3 py-2 border border-[#2B3037] focus:outline-none focus:border-[#F4511E] appearance-none pr-8 cursor-pointer truncate"
                      required
                    >
                      <option value="" className="text-neutral-500">— Pilih Pelanggan —</option>
                      {customers.filter((c) => c.aktif !== false).map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#181B1E]">
                          {c.kodePrefix ? `${c.kodePrefix} - ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. Supplier & Rekening Pembayaran */}
              <div className="space-y-2 pt-1 border-t border-[#22262B]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">Supplier Vendor</label>
                  <div className="relative">
                    <select
                      value={formSupplierId}
                      onChange={(e) => setFormSupplierId(e.target.value)}
                      className="w-full bg-[#181B1E] text-white text-xs font-medium rounded-xl px-3 py-2 border border-[#2B3037] focus:outline-none focus:border-[#F4511E] appearance-none pr-8 cursor-pointer truncate"
                      required
                    >
                      <option value="" className="text-neutral-500">— Pilih Supplier —</option>
                      {suppliers.filter((s) => s.aktif !== false).map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#181B1E]">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Info Rekening Bank & Penerima (Slim Readonly Card) */}
                <div className="bg-[#181B1E] border border-[#262A30] rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase">Rekening Tujuan:</span>
                    <span className="text-white font-medium">{nomorRekeningDisplay || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase">Atas Nama / Penerima:</span>
                    <span className="text-white font-medium truncate block">
                      {rekeningAtasNamaDisplay || penerimaDisplay || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Daftar Keterangan (Slim) */}
              <div className="space-y-2 pt-1 border-t border-[#22262B]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-400">Keterangan Transaksi</label>
                  <button
                    type="button"
                    onClick={handleAddKeterangan}
                    className="text-[11px] text-[#F4511E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {keteranganList.map((ket) => (
                    <div key={ket.id} className="flex items-center gap-1.5">
                      <select
                        value={ket.type}
                        onChange={(e) => handleUpdateKeterangan(ket.id, 'type', e.target.value)}
                        className="w-32 bg-[#181B1E] text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 border border-[#2B3037] focus:outline-none focus:border-[#F4511E] cursor-pointer"
                      >
                        {KETERANGAN_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-[#181B1E]">{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={ket.deskripsi}
                        onChange={(e) => handleUpdateKeterangan(ket.id, 'deskripsi', e.target.value)}
                        placeholder="Deskripsi keterangan..."
                        className="flex-1 bg-[#181B1E] text-white text-xs rounded-lg px-3 py-1.5 border border-[#2B3037] focus:outline-none focus:border-[#F4511E]"
                      />
                      {keteranganList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKeterangan(ket.id)}
                          className="w-7 h-7 rounded-lg bg-[#202428] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Hapus"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Ringkasan Finansial (Slim 3-Column Box) */}
              <div className="p-3 bg-[#181B1E] border border-[#282C33] rounded-xl grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">Volume Kirim</span>
                  <span className="text-white font-bold">{formVolume || 0} m³</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">Harga Beli</span>
                  <span className="text-neutral-300 font-bold">Rp {(formHargaBeli || 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase">Total Nilai BKK</span>
                  <span className="text-[#F4511E] font-black text-sm">
                    {formatCurrency(formAmount || Math.round((formVolume || 0) * (formHargaBeli || 0)))}
                  </span>
                </div>
              </div>

              {/* 6. Tombol Aksi */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={Lock}
                  disabled={!formRoNumber || isSubmitting}
                  className="w-full sm:flex-1 cursor-pointer"
                >
                  {isSubmitting ? 'Mengajukan...' : 'Ajukan BKK (Menunggu Approval)'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setActiveTab('list')}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Kembali ke Daftar
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}

      {/* ── STICKY SELECTION & PAYMENT BAR ── */}
      {selectedItems.length > 0 && activeTab === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse shrink-0" />
              <div className="text-xs font-mono text-neutral-300 truncate">
                <strong className="text-white">{selectedItems.length}</strong> CO Terpilih &bull; Total:{' '}
                <strong className="text-[#F4511E] text-sm">{formatCurrency(totalSelected)}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#1C1F24] border border-[#2A2E33] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F4511E] hover:bg-[#E04418] transition-colors shadow-md shadow-[#F4511E]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bayar CO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL WORKFLOW & DETAIL CASH OUT (BKK) ── */}
      <BkkDetailWorkflowModal
        isOpen={Boolean(workflowModalItem)}
        onClose={() => setWorkflowModalItem(null)}
        bkkItem={workflowModalItem}
        onOpenPrintModal={(item) => setPrintModalItem(item)}
        onBkkUpdated={() => {
          fetchBkk();
          loadAvailableOrders();
        }}
      />

      {/* ── MODAL KONFIRMASI HAPUS BKK ── */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Hapus Bukti Kas Keluar"
        subtitle={deleteConfirmItem?.kodeTransaksi}
      >
        <div className="p-4 space-y-4 font-sans">
          <p className="text-xs text-neutral-300">
            Apakah Anda yakin ingin menghapus data BKK Kas Keluar{' '}
            <strong className="text-white">{deleteConfirmItem?.kodeTransaksi}</strong> (
            {deleteConfirmItem?.customer || deleteConfirmItem?.perusahaan}) senilai{' '}
            <strong className="text-[#F4511E]">{formatCurrency(deleteConfirmItem?.amount)}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmItem(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                deleteBkk(deleteConfirmItem.id);
                setSelectedItems((prev) => prev.filter((id) => id !== deleteConfirmItem.id));
                setDeleteConfirmItem(null);
              }}
            >
              Hapus BKK
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL KONFIRMASI PELUNASAN BKK ── */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Konfirmasi Pelunasan Cash Out (BKK)"
        subtitle="Pencatatan tanggal dan rekening kas PT BAS yang didebit"
      >
        <div className="p-4 space-y-3 font-mono">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tanggal Kas Keluar</label>
            <input
              type="date"
              required
              value={paymentForm.tanggalBayar}
              onChange={(e) => setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })}
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Rekening Sumber PT BAS</label>
            <select
              required
              value={paymentForm.rekeningSumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })}
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}>
                  {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                </option>
              ))}
              <option value="Kas Tunai Kantor Gresik">Kas Tunai Kantor Gresik</option>
            </select>
          </div>

          <div className="p-2.5 rounded bg-[#181B1E] border border-[#262A2F] flex justify-between items-center text-xs">
            <span className="text-neutral-400">Total Pembayaran Vendor:</span>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalSelected)}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282C]">
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Batal</Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleConfirmPayment}>
              Simpan Pelunasan
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL CETAK & EKSPOR PDF CASH-OUT (BKK) ── */}
      <BkkPrintModal
        isOpen={Boolean(printModalItem)}
        onClose={() => setPrintModalItem(null)}
        bkkItem={printModalItem}
      />
    </div>
  );
}
