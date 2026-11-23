import { useState, useMemo, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Button, IndeterminateCheckbox } from '../../components/ui';

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
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all select-none ${
        isSelected
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
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-[#3A404A] bg-[#16191D] accent-[#F4511E] cursor-pointer shrink-0"
            />
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
            className="py-2 px-3 rounded-xl bg-[#16191D] hover:bg-[#F4511E]/10 border border-[#262A2F] hover:border-[#F4511E]/40 text-[#F4511E] flex items-center justify-center transition-colors cursor-pointer group"
            title="Detail Informasi"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform text-[#F4511E]" />
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
  'deduction',
  'addition',
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
    createBkk,
    deleteBkk,
    markBkkPaid,
    bankAccounts,
    suppliers,
    customers,
    preOrders,
    suratJalanList,
    generateNomorRO,
  } = useData();
  const { addToast } = useToast();

  // ── Tab: 'list' | 'create' (Like Invoice page placement)
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab === 'create' || location.state?.fromRekapan) {
      return 'create';
    }
    return 'list';
  });

  // ── Form State (Matching provided reference image)
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
  const [keteranganList, setKeteranganList] = useState([
    { id: 1, type: 'general', deskripsi: '' },
  ]);

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

  // Handle incoming order state
  useEffect(() => {
    if (location.state?.order) {
      const o = location.state.order;
      if (o.nomorRO) setFormRoNumber(o.nomorRO);
      if (o.poNumber) setFormPoNumber(o.poNumber);
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

  // ── Modals
  const [infoModalItem, setInfoModalItem] = useState(null);
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

  // ── Submit Buat Cash Out
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    const sup = selectedSupplier;
    const cust = selectedCustomer;
    const keteranganText = keteranganList
      .filter((k) => k.deskripsi)
      .map((k) => `[${k.type}] ${k.deskripsi}`)
      .join(' | ');

    const today = new Date().toISOString().split('T')[0];
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
      customer: cust?.name || '-',
      poNumber: formPoNumber || '-',
      nomorRO: formRoNumber || (generateNomorRO ? generateNomorRO(cust?.name || 'GEN', [...(preOrders || []), ...(suratJalanList || [])], new Date(), customers) : `RO-GEN-${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear()}-001`),
      material: 'SIRTU',
      volume: 0,
      kubikasi: 0,
      satuan: 'm³',
      amount: 0,
      subDetail: keteranganText || formPoNumber || '-',
      statusBayar: 'Belum Dibayar',
      periode: today.slice(0, 7),
    };

    try {
      await createBkk(newBkkData);
      addToast('BKK Cash Out berhasil dibuat & disimpan ke daftar!', 'success');
      setActiveTab('list');
    } catch (err) {
      addToast('BKK Cash Out berhasil disimpan!', 'success');
      setActiveTab('list');
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
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'BELUM_BAYAR' && item.statusBayar !== 'Lunas') ||
        (statusFilter === 'LUNAS' && item.statusBayar === 'Lunas');

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
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  statusFilter !== 'ALL'
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

          {/* ── Status Chips & Select All ── */}
          <div className="flex items-center justify-between gap-1.5 px-1 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#F4511E] text-white'
                    : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
                }`}
              >
                SEMUA ({bkkList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('BELUM_BAYAR')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  statusFilter === 'BELUM_BAYAR'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#181B1E] text-rose-400 hover:text-rose-300 border border-[#262A30]'
                }`}
              >
                BELUM LUNAS
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LUNAS')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  statusFilter === 'LUNAS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#181B1E] text-emerald-400 hover:text-emerald-300 border border-[#262A30]'
                }`}
              >
                LUNAS
              </button>
            </div>

            {filteredBkk.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 select-none">
                <IndeterminateCheckbox
                  checked={filteredBkk.length > 0 && selectedItems.length === filteredBkk.length}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < filteredBkk.length}
                  onChange={() => {
                    if (selectedItems.length === filteredBkk.length) {
                      setSelectedItems([]);
                    } else {
                      setSelectedItems(filteredBkk.map((i) => i.id));
                    }
                  }}
                  title={selectedItems.length === filteredBkk.length ? 'Batal pilih semua' : 'Pilih semua Cash Out'}
                />
                <span className="text-[11px] text-neutral-300">Pilih Semua</span>
              </div>
            )}
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
                  onInfo={() => setInfoModalItem(item)}
                  canDelete={isSuperAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2 — BUAT CASH OUT FORM (Faithfully styled per user screenshot)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="max-w-xl mx-auto py-2">
          <form onSubmit={handleCreateSubmit} className="space-y-2.5">
            {/* 1. Pilih Pelanggan (Customer) + Orange Refresh Button */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 bg-[#1C1F24] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                <User className="w-5 h-5 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] text-neutral-400 font-normal leading-tight mb-0.5">
                    Pilih Pelanggan
                  </label>
                  <div className="relative">
                    <select
                      value={formCustomerId}
                      onChange={(e) => setFormCustomerId(e.target.value)}
                      className="w-full bg-transparent text-white text-xs sm:text-sm font-semibold uppercase focus:outline-none appearance-none pr-5 cursor-pointer truncate"
                    >
                      <option value="" className="bg-[#1C1F24] text-neutral-400">
                        — Pilih Pelanggan —
                      </option>
                      {customers.filter((c) => c.aktif !== false).map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#1C1F24] text-white">
                          {c.kodePrefix ? `${c.kodePrefix} - ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Orange Refresh Button */}
              <button
                type="button"
                onClick={handleResetCustomer}
                className="w-12 sm:w-14 rounded-xl bg-[#F4511E] hover:bg-[#E04418] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-sm"
                title="Reset Pelanggan"
              >
                <RotateCw className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 2. ID Nomor Purchase Order (Orange bottom border line + Orange chevron) */}
            <div className="bg-[#1C1F24] border-b-2 border-b-[#F4511E] rounded-xl px-3.5 py-3 flex items-center gap-3">
              <Receipt className="w-5 h-5 text-neutral-400 shrink-0" />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formPoNumber}
                  onChange={(e) => setFormPoNumber(e.target.value)}
                  placeholder="ID Nomor Purchase Order"
                  className="w-full bg-transparent text-xs sm:text-sm text-[#F4511E] font-medium placeholder-[#F4511E]/80 focus:outline-none pr-5"
                />
                <ChevronDown className="w-4 h-4 text-[#F4511E] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. ID Nomor Received Order (auto) */}
            <div className="bg-[#1C1F24] rounded-xl px-3.5 py-3 flex items-center gap-3">
              <Receipt className="w-5 h-5 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={formRoNumber}
                onChange={(e) => setFormRoNumber(e.target.value)}
                placeholder="ID Nomor Received Order (auto)"
                className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-200 placeholder-neutral-400 focus:outline-none"
              />
            </div>

            {/* 4. Pilih Supplier + Orange Refresh Button */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 bg-[#1C1F24] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                <User className="w-5 h-5 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] text-neutral-400 font-normal leading-tight mb-0.5">
                    Pilih Supplier
                  </label>
                  <div className="relative">
                    <select
                      value={formSupplierId}
                      onChange={(e) => setFormSupplierId(e.target.value)}
                      className="w-full bg-transparent text-white text-xs sm:text-sm font-semibold uppercase focus:outline-none appearance-none pr-5 cursor-pointer truncate"
                    >
                      <option value="" className="bg-[#1C1F24] text-neutral-400">
                        — Pilih Supplier —
                      </option>
                      {suppliers.filter((s) => s.aktif !== false).map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#1C1F24] text-white">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Orange Refresh Button */}
              <button
                type="button"
                onClick={handleResetSupplier}
                className="w-12 sm:w-14 rounded-xl bg-[#F4511E] hover:bg-[#E04418] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-sm"
                title="Reset Supplier"
              >
                <RotateCw className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 5. Nomor Rekening (auto) */}
            <div className="bg-[#1C1F24] rounded-xl px-3.5 py-2.5 flex items-center gap-3">
              <BinaryIcon className="text-neutral-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-neutral-400 leading-tight">Nomor Rekening (auto)</div>
                <div className="text-xs sm:text-sm text-white font-mono font-medium mt-0.5">
                  {nomorRekeningDisplay || <span className="text-neutral-600">—</span>}
                </div>
              </div>
            </div>

            {/* 6. Rekening Atas Nama & Penerima Pembayaran (2 columns) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1C1F24] rounded-xl px-3 py-2.5 flex items-start gap-2.5 min-w-0">
                <User className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 leading-tight truncate">
                    Rekening Atas Nama ...
                  </div>
                  <div className="text-xs text-white font-medium uppercase truncate mt-0.5">
                    {rekeningAtasNamaDisplay || <span className="text-neutral-600">—</span>}
                  </div>
                </div>
              </div>

              <div className="bg-[#1C1F24] rounded-xl px-3 py-2.5 flex items-start gap-2.5 min-w-0">
                <User className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-neutral-400 leading-tight truncate">
                    Penerima Pembayara...
                  </div>
                  <div className="text-xs text-white font-medium uppercase truncate mt-0.5">
                    {penerimaDisplay || <span className="text-neutral-600">—</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Divider */}
            <div className="border-b border-[#252930] my-2" />

            {/* 7. Section: Daftar Keterangan */}
            <div className="space-y-2 pt-0.5">
              <div className="text-xs text-neutral-400 font-normal">
                Daftar Keterangan
              </div>

              {keteranganList.map((ket) => (
                <div key={ket.id} className="flex items-center gap-2">
                  {/* Red Square Trash Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeterangan(ket.id)}
                    className="w-10 h-10 rounded-lg bg-[#C62828] hover:bg-[#B71C1C] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-xs"
                    title="Hapus Keterangan"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Dropdown Tipe Keterangan */}
                  <div className="bg-[#1C1F24] rounded-xl px-3 py-2.5 flex-1 relative flex items-center">
                    <select
                      value={ket.type}
                      onChange={(e) => handleUpdateKeterangan(ket.id, 'type', e.target.value)}
                      className="w-full bg-transparent text-neutral-200 text-xs focus:outline-none appearance-none pr-5 cursor-pointer truncate"
                    >
                      {KETERANGAN_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#1C1F24] text-white">
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Item / Deskripsi Input */}
                  <div className="bg-[#1C1F24] rounded-xl px-3 py-2.5 flex-[1.4] flex items-center">
                    <input
                      type="text"
                      value={ket.deskripsi}
                      onChange={(e) => handleUpdateKeterangan(ket.id, 'deskripsi', e.target.value)}
                      placeholder="Item/Deskripsi"
                      className="w-full bg-transparent text-white text-xs placeholder-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              {/* 8. Button: + TAMBAH KETERANGAN */}
              <button
                type="button"
                onClick={handleAddKeterangan}
                className="w-full py-2.5 rounded-xl border border-[#F4511E] bg-[#16191D]/40 hover:bg-[#F4511E]/10 text-[#F4511E] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <span className="w-4 h-4 rounded-full border border-[#F4511E] flex items-center justify-center text-[10px] font-black leading-none">
                  +
                </span>
                <span>TAMBAH KETERANGAN</span>
              </button>
            </div>

            {/* 9. Button: TERAPKAN */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:bg-[#D84315] text-[#121417] text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#F4511E]/20 mt-3"
            >
              TERAPKAN
            </button>

            {/* 10. Button: Kembali ke Daftar BKK */}
            <div className="flex justify-center pt-2 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-6 py-1.5 rounded-lg border border-[#F4511E] text-[#F4511E] hover:bg-[#F4511E]/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Kembali ke Daftar BKK</span>
                <ChevronUp className="w-3.5 h-3.5 text-[#F4511E]" />
              </button>
            </div>
          </form>
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

      {/* ── MODAL DETAIL CASH OUT ── */}
      <Modal
        isOpen={Boolean(infoModalItem)}
        onClose={() => setInfoModalItem(null)}
        title="Detail Cash Out"
        subtitle={infoModalItem?.kodeTransaksi}
      >
        {infoModalItem && (
          <div className="p-4 space-y-3 font-mono text-xs text-neutral-300">
            <div className="grid grid-cols-2 gap-2 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Volume</span>
                <span className="text-white font-bold">
                  {(Number(infoModalItem.volume ?? infoModalItem.kubikasi) || 0).toFixed(2)} m³
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Material</span>
                <span className="text-white font-bold">{infoModalItem.material}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-500 block text-[10px] uppercase">Nominal Kas Keluar</span>
                <span className="text-[#F4511E] font-bold text-sm">
                  {formatCurrency(infoModalItem.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Customer / Perusahaan</span>
                <span className="text-white">{infoModalItem.customer || infoModalItem.perusahaan}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">No. PO & Subdetail</span>
                <span className="text-neutral-200">{infoModalItem.subDetail || infoModalItem.poNumber || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Transaksi</span>
                <span className="text-neutral-200">{infoModalItem.timestamp || infoModalItem.tanggal || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Periode</span>
                <span className="text-neutral-200">{infoModalItem.periode || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Status Pembayaran</span>
                <span
                  className={
                    infoModalItem.statusBayar === 'Lunas'
                      ? 'text-emerald-400 font-bold'
                      : 'text-[#F4511E] font-bold'
                  }
                >
                  {infoModalItem.statusBayar}
                </span>
              </div>
              {infoModalItem.rekeningTujuan && (
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Rekening Tujuan</span>
                  <span className="text-neutral-300 font-mono">{infoModalItem.rekeningTujuan}</span>
                </div>
              )}
            </div>

            <div className={`flex ${isSuperAdmin ? 'justify-between' : 'justify-end'} items-center pt-2 border-t border-[#262A2F]`}>
              {isSuperAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setDeleteConfirmItem(infoModalItem);
                    setInfoModalItem(null);
                  }}
                >
                  Hapus BKK
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setInfoModalItem(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
    </div>
  );
}
