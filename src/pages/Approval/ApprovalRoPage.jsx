import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Clock,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Eye,
  Sparkles,
  ExternalLink,
  Layers,
  Percent,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Filter,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatVolume, formatDate } from '../../utils/formatters';
import { Button, Badge, Card, Modal } from '../../components/ui';

export default function ApprovalRoPage() {
  const navigate = useNavigate();
  const { isDark } = useApp();
  const { currentUser, isSuperAdmin, roleLabel } = useAuth();
  const { preOrders, approvePreOrder, rejectPreOrder } = useData();
  const { addToast } = useToast();

  // Navigation & Filter Tabs: 'pending' | 'approved' | 'rejected' | 'all'
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'MARGIN_ASC' | 'MARGIN_DESC' | 'VALUE_DESC' | 'VOLUME_DESC'

  // Expanded items for multi-item breakdown
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state
  const [rejectModalData, setRejectModalData] = useState(null); // { id, nomorRO, customer }
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveConfirmData, setApproveConfirmData] = useState(null); // { id, ... }
  const [detailModalData, setDetailModalData] = useState(null); // PO object for full preview

  // Helper to calculate financial summary for a PO
  const calculateFinancials = (po) => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalQty = 0;

    if (po.items && Array.isArray(po.items) && po.items.length > 0) {
      po.items.forEach((it) => {
        const qty = Number(it.kuantitas) || 0;
        const jual = Number(it.hargaJual) || 0;
        const beli = Number(it.hargaBeli) || 0;
        totalRevenue += jual * qty;
        totalCost += beli * qty;
        totalQty += qty;
      });
    } else {
      totalQty = Number(po.totalOrder) || 0;
      const jual = Number(po.hargaJual) || 0;
      const beli = Number(po.hargaBeli) || 0;
      totalRevenue = jual * totalQty;
      totalCost = beli * totalQty;
    }

    const grossMargin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalQty,
      grossMargin,
      marginPct,
    };
  };

  // Distinct Customers for filter
  const customerOptions = useMemo(() => {
    const set = new Set();
    preOrders.forEach((po) => {
      if (po.customer) set.add(po.customer);
    });
    return Array.from(set).sort();
  }, [preOrders]);

  // Counts for tabs
  const counts = useMemo(() => {
    const pending = preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL').length;
    const approved = preOrders.filter((po) => po.status === 'APPROVED').length;
    const rejected = preOrders.filter((po) => po.status === 'REJECTED').length;
    return {
      pending,
      approved,
      rejected,
      all: preOrders.length,
    };
  }, [preOrders]);

  // Executive KPI Metrics (Specifically for Pending ROs)
  const pendingMetrics = useMemo(() => {
    const pendingList = preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL');
    let totalVolume = 0;
    let totalNilaiPesanan = 0;
    let totalEstimasiMargin = 0;

    pendingList.forEach((po) => {
      const fin = calculateFinancials(po);
      totalVolume += fin.totalQty;
      totalNilaiPesanan += fin.totalRevenue;
      totalEstimasiMargin += fin.grossMargin;
    });

    const averageMarginPct =
      totalNilaiPesanan > 0 ? (totalEstimasiMargin / totalNilaiPesanan) * 100 : 0;

    return {
      count: pendingList.length,
      totalVolume,
      totalNilaiPesanan,
      totalEstimasiMargin,
      averageMarginPct,
    };
  }, [preOrders]);

  // Filtered and Sorted List
  const filteredList = useMemo(() => {
    const list = preOrders.filter((po) => {
      // 1. Status Filter
      if (activeTab === 'pending' && po.status !== 'MENUNGGU_APPROVAL') return false;
      if (activeTab === 'approved' && po.status !== 'APPROVED') return false;
      if (activeTab === 'rejected' && po.status !== 'REJECTED') return false;

      // 2. Customer Filter
      if (customerFilter !== 'ALL' && po.customer !== customerFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noRo = (po.nomorRO || po.nomorRo || po.id || '').toLowerCase();
        const noPo = (po.nomorPo || '').toLowerCase();
        const cust = (po.customer || '').toLowerCase();
        const mat = (po.materialName || '').toLowerCase();
        if (!noRo.includes(q) && !noPo.includes(q) && !cust.includes(q) && !mat.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // 4. Sorting logic for Executive Decision Making
    return list.sort((a, b) => {
      const finA = calculateFinancials(a);
      const finB = calculateFinancials(b);

      if (sortBy === 'MARGIN_ASC') {
        return finA.marginPct - finB.marginPct;
      }
      if (sortBy === 'MARGIN_DESC') {
        return finB.marginPct - finA.marginPct;
      }
      if (sortBy === 'VALUE_DESC') {
        return finB.totalRevenue - finA.totalRevenue;
      }
      if (sortBy === 'VOLUME_DESC') {
        return finB.totalQty - finA.totalQty;
      }
      // 'NEWEST' default (by date descending)
      const dateA = new Date(a.tanggal || 0).getTime();
      const dateB = new Date(b.tanggal || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [preOrders, activeTab, customerFilter, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || customerFilter !== 'ALL' || sortBy !== 'NEWEST';

  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('ALL');
    setSortBy('NEWEST');
  };

  // Toggle multi-item expand
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle batch selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredList
      .filter((po) => po.status === 'MENUNGGU_APPROVAL')
      .map((po) => po.id);
    if (selectedIds.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  // Actions
  const handleApprove = (po) => {
    const approver = `${currentUser?.name || 'David Rusiah'} (Direktur)`;
    approvePreOrder(po.id, approver);
    setApproveConfirmData(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(po.id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    const approver = `${currentUser?.name || 'David Rusiah'} (Direktur)`;
    let approvedCount = 0;
    selectedIds.forEach((id) => {
      approvePreOrder(id, approver);
      approvedCount += 1;
    });
    setSelectedIds(new Set());
    addToast(`${approvedCount} Received Order berhasil disetujui sekaligus.`, 'success');
  };

  const handleOpenRejectModal = (po) => {
    setRejectModalData(po);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalData) return;
    if (!rejectionReason.trim()) {
      addToast('Harap masukkan alasan penolakan agar tim operasional dapat menindaklanjuti.', 'warning');
      return;
    }
    rejectPreOrder(rejectModalData.id, rejectionReason.trim());
    setRejectModalData(null);
    setRejectionReason('');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(rejectModalData.id);
      return next;
    });
  };

  // Pre-filled rejection reason chips
  const quickReasons = [
    'Margin keuntungan di bawah ambang batas minimum',
    'TOP/Jangka waktu pembayaran customer melebihi toleransi risiko',
    'Harga beli dari supplier tidak sesuai dengan kesepakatan terbaru',
    'Kapasitas armada logistik saat ini sudah penuh untuk jadwal tersebut',
    'Perlu revisi nomor PO atau surat perjanjian kontrak dari customer',
  ];

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ══════════ TOP HEADER BAR ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#22262A]">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/pre-orders')}
            title="Kembali ke Daftar Pre Order"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Pusat Persetujuan RO (Received Order)
              </h1>
              <Badge variant="warning" dot>
                Direksi Approval
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Otorisasi pesanan customer, evaluasi margin profit, dan syarat pembayaran sebelum diterbitkan Surat Jalan (GI).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={FileText}
            onClick={() => navigate('/pre-orders')}
          >
            Lihat Modul RO Operasional &rarr;
          </Button>
        </div>
      </div>

      {/* ══════════ EXECUTIVE KPI METRIC CARDS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Menunggu Persetujuan */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Menunggu Keputusan
            </span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {pendingMetrics.count}
            </span>
            <span className="text-xs text-amber-400 font-medium">kontrak tertahan</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Total volume: <strong className="text-neutral-200">{formatVolume(pendingMetrics.totalVolume)}</strong>
          </p>
        </Card>

        {/* KPI 2: Total Nilai Pesanan Pending */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Nilai Kontrak Pending
            </span>
            <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-mono truncate">
              {formatCurrency(pendingMetrics.totalNilaiPesanan, false)}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Potensi omset bruto penjualan
          </p>
        </Card>

        {/* KPI 3: Estimasi Laba Kotor Pending */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Estimasi Gross Profit
            </span>
            <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400 font-mono truncate">
              {formatCurrency(pendingMetrics.totalEstimasiMargin, false)}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Rata-rata margin:{' '}
            <strong className={pendingMetrics.averageMarginPct >= 10 ? 'text-emerald-400' : 'text-amber-400'}>
              {pendingMetrics.averageMarginPct.toFixed(1)}%
            </strong>
          </p>
        </Card>

        {/* KPI 4: Total Disetujui */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Disetujui / Selesai
            </span>
            <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {counts.approved}
            </span>
            <span className="text-xs text-neutral-400">telah aktif</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Ditolak:{' '}
            <strong className="text-rose-400">{counts.rejected}</strong> berkas
          </p>
        </Card>
      </div>

      {/* ══════════ TABS & DEDICATED SEARCH/FILTER TOOLBAR ══════════ */}
      <div className="bg-[#14171A] rounded-xl border border-[#22262A] shadow-sm overflow-hidden divide-y divide-[#22262A]">
        {/* ROW 1: STATUS SEGMENTED TABS & CONTEXT SUMMARY */}
        <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Control for Status Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[#0E1012] border border-[#22262A] flex-wrap sm:flex-nowrap gap-1">
            {/* 1. Perlu Persetujuan (The Primary Executive Action Tab) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent font-medium'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Perlu Persetujuan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                  activeTab === 'pending'
                    ? 'bg-amber-400 text-black shadow-2xs'
                    : 'bg-[#1C1F23] text-amber-400/90 border border-amber-900/30'
                }`}
              >
                {counts.pending}
              </span>
            </button>

            {/* 2. Disetujui */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('approved');
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent font-medium'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Disetujui</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                  activeTab === 'approved'
                    ? 'bg-emerald-400 text-black shadow-2xs'
                    : 'bg-[#1C1F23] text-neutral-400 border border-[#2B3037]'
                }`}
              >
                {counts.approved}
              </span>
            </button>

            {/* 3. Ditolak */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('rejected');
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent font-medium'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Ditolak</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                  activeTab === 'rejected'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-[#1C1F23] text-neutral-400 border border-[#2B3037]'
                }`}
              >
                {counts.rejected}
              </span>
            </button>

            {/* 4. Semua Kontrak */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40 shadow-xs font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent font-medium'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Semua Kontrak</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                  activeTab === 'all'
                    ? 'bg-[#F4511E] text-white shadow-2xs'
                    : 'bg-[#1C1F23] text-neutral-400 border border-[#2B3037]'
                }`}
              >
                {counts.all}
              </span>
            </button>
          </div>

          {/* Right: Real-time Count & Reset Filter Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span>
              Menampilkan <strong className="text-white">{filteredList.length}</strong> kontrak
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-[#FF7043] hover:text-[#FFA726] flex items-center gap-1 cursor-pointer transition-colors ml-1 font-semibold"
                title="Reset semua filter pencarian"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: DEDICATED SEARCH & RELEVANT FILTERS TOOLBAR */}
        <div className="p-3 sm:p-4 bg-[#111315]/70 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Search Box with Clear Button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor RO, nomor PO, nama customer, atau jenis material..."
              className="w-full bg-[#0E1012] border border-[#22262A] rounded-lg pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] font-mono transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Filter Customer Dropdown */}
            <div className="relative min-w-[170px] sm:min-w-[190px] flex-1 sm:flex-initial">
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-[#0E1012] border border-[#22262A] rounded-lg pl-8 pr-7 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] font-mono appearance-none cursor-pointer"
              >
                <option value="ALL">Semua Customer</option>
                {customerOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            </div>

            {/* Sort Dropdown (Opsi Analisis Direksi) */}
            <div className="relative min-w-[170px] sm:min-w-[200px] flex-1 sm:flex-initial">
              <SlidersHorizontal className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#0E1012] border border-[#22262A] rounded-lg pl-8 pr-7 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] font-mono appearance-none cursor-pointer"
              >
                <option value="NEWEST">Urutkan: Tanggal Terbaru</option>
                <option value="MARGIN_ASC">Margin Terendah (Risiko)</option>
                <option value="MARGIN_DESC">Margin Tertinggi</option>
                <option value="VALUE_DESC">Nilai Kontrak Terbesar</option>
                <option value="VOLUME_DESC">Volume Order Terbesar</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ROW 3: BATCH ACTION TOOLBAR (KHUSUS TAB PERLU PERSETUJUAN & JIKA ADA ITEM) */}
        {activeTab === 'pending' && filteredList.length > 0 && (
          <div className="px-3 sm:px-4 py-2.5 bg-[#14171A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSelectAllPending}
                className="flex items-center gap-2 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#1C1F23] border border-[#2B3037] hover:border-neutral-500 transition-colors cursor-pointer"
              >
                {selectedIds.size === filteredList.length && filteredList.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#F4511E]" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400" />
                )}
                <span>
                  {selectedIds.size === filteredList.length
                    ? 'Batal Pilih Semua'
                    : `Pilih Semua Pending (${filteredList.length})`}
                </span>
              </button>

              {selectedIds.size > 0 && (
                <span className="text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                  {selectedIds.size} dokumen terpilih
                </span>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-neutral-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <Button
                  size="xs"
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={handleBatchApprove}
                >
                  Setujui {selectedIds.size} RO Terpilih Sekaligus
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ APPROVAL QUEUE LIST ══════════ */}
      {filteredList.length === 0 ? (
        <Card className="p-12 text-center bg-[#14171A] border border-[#22262A] space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {hasActiveFilters ? 'Tidak Ditemukan Kontrak yang Cocok' : 'Semua Berkas Telah Ditinjau'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
              {hasActiveFilters
                ? 'Tidak ada data kontrak yang cocok dengan kata kunci pencarian atau filter yang Anda pilih.'
                : activeTab === 'pending'
                ? 'Tidak ada Received Order yang menunggu persetujuan Direktur saat ini. Seluruh pesanan telah diproses.'
                : 'Belum ada data kontrak pada kategori ini.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            {hasActiveFilters ? (
              <Button
                size="xs"
                variant="outline"
                icon={RotateCcw}
                onClick={handleResetFilters}
              >
                Reset Filter Pencarian
              </Button>
            ) : (
              <Button
                size="xs"
                variant="outline"
                icon={RotateCcw}
                onClick={() => {
                  setActiveTab('all');
                  handleResetFilters();
                }}
              >
                Tampilkan Semua Kontrak
              </Button>
            )}
            <Button
              size="xs"
              variant="primary"
              icon={ExternalLink}
              onClick={() => navigate('/pre-orders')}
            >
              Buka Modul Pre Order
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredList.map((po) => {
            const fin = calculateFinancials(po);
            const isPending = po.status === 'MENUNGGU_APPROVAL';
            const isApproved = po.status === 'APPROVED';
            const isRejected = po.status === 'REJECTED';
            const isSelected = selectedIds.has(po.id);
            const isExpanded = expandedIds.has(po.id);
            const hasMultipleItems = po.items && Array.isArray(po.items) && po.items.length > 1;

            return (
              <Card
                key={po.id}
                className={`p-4 transition-all bg-[#14171A] border ${
                  isSelected
                    ? 'border-[#F4511E] ring-1 ring-[#F4511E]/40'
                    : isPending
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-[#22262A]'
                }`}
              >
                {/* ── CARD TOP BAR ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#22262A]">
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox for batch approval if pending */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => toggleSelect(po.id)}
                        className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                        title={isSelected ? 'Batalkan pilihan' : 'Pilih pesanan ini'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#F4511E]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1C1F23] text-neutral-200 border border-[#2B3037]">
                          {po.nomorRO || po.nomorRo || po.id}
                        </span>
                        {po.nomorPo && (
                          <span className="font-mono text-[11px] text-blue-400 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-900/40">
                            PO: {po.nomorPo}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {po.customer}
                        </h3>
                        {po.jenisWajibPajak && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              po.jenisWajibPajak === 'PKP'
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {po.jenisWajibPajak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {formatDate(po.tanggal)}
                        </span>
                        <span>•</span>
                        <span>Diajukan: {po.createdBy || 'Admin Operasional'}</span>
                        {po.top && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">TOP: {po.top}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && <Badge variant="warning" dot>MENUNGGU APPROVAL</Badge>}
                    {isApproved && <Badge variant="success" dot>APPROVED</Badge>}
                    {isRejected && <Badge variant="error" dot>DITOLAK</Badge>}
                  </div>
                </div>

                {/* ── COMMERCIAL & FINANCIAL DECISION GRID ── */}
                <div className="py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-mono text-xs">
                  {/* Material & Volume */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Material &amp; Volume
                    </span>
                    <span className="text-white font-bold block truncate">
                      {hasMultipleItems
                        ? `${po.materialName || 'Multi-Item'} (+${po.items.length - 1} item)`
                        : po.materialName || 'Material Curah'}
                    </span>
                    <span className="text-[11px] text-amber-400">
                      Total: {formatVolume(fin.totalQty, po.satuan || 'm3')}
                    </span>
                  </div>

                  {/* Harga Beli Supplier */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Harga Beli (Modal)
                    </span>
                    <span className="text-neutral-300 font-semibold block">
                      {formatCurrency(po.hargaBeli || (po.items && po.items[0]?.hargaBeli) || 0)}
                      <span className="text-[10px] text-neutral-500">/{po.satuan || 'm3'}</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Modal: {formatCurrency(fin.totalCost, false)}
                    </span>
                  </div>

                  {/* Harga Jual Customer */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Harga Jual Customer
                    </span>
                    <span className="text-white font-bold block">
                      {formatCurrency(po.hargaJual || (po.items && po.items[0]?.hargaJual) || 0)}
                      <span className="text-[10px] text-neutral-500">/{po.satuan || 'm3'}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Omset: {formatCurrency(fin.totalRevenue, false)}
                    </span>
                  </div>

                  {/* Gross Margin Evaluator */}
                  <div className="space-y-0.5 bg-[#0E1012] p-2 rounded-lg border border-[#22262A]">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Gross Margin</span>
                      <Percent className="w-3 h-3 text-emerald-400" />
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-sm font-bold ${
                          fin.marginPct >= 15
                            ? 'text-emerald-400'
                            : fin.marginPct >= 7
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        +{fin.marginPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        ({formatCurrency(fin.grossMargin, false)})
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-semibold uppercase block ${
                        fin.marginPct >= 15
                          ? 'text-emerald-500'
                          : fin.marginPct >= 7
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {fin.marginPct >= 15
                        ? 'Margin Sehat'
                        : fin.marginPct >= 7
                        ? 'Margin Standar'
                        : 'Margin Tipis / Berisiko'}
                    </span>
                  </div>

                  {/* Pajak & Jenis RO */}
                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Ketentuan &amp; Pajak
                    </span>
                    <span className="text-neutral-300 block text-[11px] truncate">
                      {po.jenisRO || 'JASA ANGKUT + MATERIAL'}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      PPh: {po.pphRate || 2.0}% • {po.jenis || 'CURAH'}
                    </span>
                  </div>
                </div>

                {/* ── EXPANDABLE MULTI-ITEM TABLE IF ANY ── */}
                {hasMultipleItems && (
                  <div className="pt-1 pb-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(po.id)}
                      className="text-xs text-[#F4511E] hover:text-[#FF7043] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>
                        {isExpanded ? 'Sembunyikan' : 'Lihat'} rincian {po.items.length} item material
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 overflow-x-auto rounded-lg border border-[#22262A] bg-[#0E1012]">
                        <table className="w-full text-left font-mono text-xs">
                          <thead className="bg-[#14171A] border-b border-[#22262A] text-[10px] text-neutral-400 uppercase">
                            <tr>
                              <th className="px-3 py-2">Material</th>
                              <th className="px-3 py-2 text-right">Kuantitas</th>
                              <th className="px-3 py-2 text-right">Harga Beli</th>
                              <th className="px-3 py-2 text-right">Harga Jual</th>
                              <th className="px-3 py-2 text-right">Margin / Satuan</th>
                              <th className="px-3 py-2 text-right">Subtotal Omset</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1C1F23]">
                            {po.items.map((it, idx) => {
                              const qty = Number(it.kuantitas) || 0;
                              const beli = Number(it.hargaBeli) || 0;
                              const jual = Number(it.hargaJual) || 0;
                              const marginSatuan = jual - beli;
                              const subtotal = jual * qty;

                              return (
                                <tr key={it.id || idx} className="hover:bg-[#181B1E]">
                                  <td className="px-3 py-1.5 text-white font-medium">
                                    {it.nama || it.name}
                                    <span className="text-[10px] text-neutral-500 ml-1">
                                      ({it.satuan || 'm3'})
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-neutral-200">
                                    {formatVolume(qty, it.satuan || 'm3')}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-neutral-400">
                                    {formatCurrency(beli)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-white font-semibold">
                                    {formatCurrency(jual)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-emerald-400">
                                    +{formatCurrency(marginSatuan)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-white font-bold">
                                    {formatCurrency(subtotal, false)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CARD BOTTOM ACTIONS & AUDIT FOOTER ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#22262A] text-xs font-mono">
                  {/* Left: Audit Info */}
                  <div className="text-neutral-400">
                    {isApproved && (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Disetujui oleh: <strong className="text-white">{po.approvedBy}</strong> ({po.approvedAt || 'Telah disetujui'})
                        </span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Alasan penolakan: &quot;{po.rejectionReason || 'Tidak sesuai'}&quot;</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="flex items-center gap-1.5 text-amber-400/90">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Membutuhkan otorisasi resmi Direktur untuk membuka pembuatan Surat Jalan.</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Memo Button */}
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Eye}
                      onClick={() => setDetailModalData(po)}
                      title="Lihat rincian lengkap kontrak"
                    >
                      Detail Kontrak
                    </Button>

                    {/* Pending Actions */}
                    {isPending && (
                      <>
                        <Button
                          size="xs"
                          variant="danger"
                          icon={XCircle}
                          onClick={() => handleOpenRejectModal(po)}
                        >
                          Tolak RO
                        </Button>

                        <Button
                          size="xs"
                          variant="primary"
                          icon={CheckCircle2}
                          onClick={() => setApproveConfirmData(po)}
                        >
                          Setujui RO
                        </Button>
                      </>
                    )}

                    {/* Approved Action Shortcut */}
                    {isApproved && (
                      <Button
                        size="xs"
                        variant="primary"
                        icon={Truck}
                        onClick={() =>
                          navigate('/surat-jalan', {
                            state: {
                              fromPreOrder: true,
                              preOrderId: po.id,
                              customer: po.customer,
                              nomorPo: po.nomorPo || po.id,
                              materialId: po.materialId,
                              materialName: po.materialName,
                              jenis: po.jenis || 'Jasa Angkut + Material',
                              nomorRo: po.nomorRo || po.nomorRO || `RO-${po.id}`,
                            },
                          })
                        }
                      >
                        Buat Surat Jalan (GI) &rarr;
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════ MODAL 1: TOLAK RO ══════════ */}
      <Modal
        isOpen={Boolean(rejectModalData)}
        onClose={() => setRejectModalData(null)}
        title="Konfirmasi Penolakan Received Order"
        subtitle={`RO: ${rejectModalData?.nomorRO || rejectModalData?.id} • Customer: ${rejectModalData?.customer}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Pesanan akan dikembalikan ke status DITOLAK.</p>
              <p className="mt-0.5 text-neutral-300">
                Surat Jalan tidak dapat dibuat untuk pesanan ini sampai admin operasional melakukan revisi dan mengajukan kembali.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-mono">
              Alasan Penolakan Direksi (Wajib Diisi):
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Margin harga terlalu tipis, sesuaikan harga jual menjadi min Rp 45.000/m3..."
              className="w-full bg-[#0E1012] border border-[#22262A] rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div>
            <span className="text-[11px] text-neutral-400 block mb-1.5">Template Alasan Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className="text-[10px] bg-[#16181B] hover:bg-neutral-800 text-neutral-300 hover:text-white px-2 py-1 rounded border border-[#2B3037] text-left transition-colors cursor-pointer"
                >
                  + {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#22262A]">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRejectModalData(null)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={XCircle}
              onClick={handleConfirmReject}
            >
              Tolak RO Ini
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══════════ MODAL 2: KONFIRMASI SETUJUI RO ══════════ */}
      <Modal
        isOpen={Boolean(approveConfirmData)}
        onClose={() => setApproveConfirmData(null)}
        title="Otorisasi & Persetujuan RO"
        subtitle={`RO: ${approveConfirmData?.nomorRO || approveConfirmData?.id}`}
        maxWidth="max-w-md"
      >
        {approveConfirmData && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">
                  Persetujuan Kontrak oleh Direktur
                </p>
                <p className="mt-0.5 text-neutral-300">
                  Dengan menyetujui RO ini, tim operasional resmi diizinkan mencetak Surat Jalan (GI) dan armada logistik dapat diberangkatkan.
                </p>
              </div>
            </div>

            <div className="bg-[#0E1012] rounded-lg p-3 border border-[#22262A] space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Customer:</span>
                <span className="text-white font-bold">{approveConfirmData.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Volume:</span>
                <span className="text-amber-400 font-semibold">
                  {formatVolume(approveConfirmData.totalOrder, approveConfirmData.satuan || 'm3')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Syarat Pembayaran:</span>
                <span className="text-white">{approveConfirmData.top || '30 Hari'}</span>
              </div>
              <div className="flex justify-between border-t border-[#22262A] pt-2">
                <span className="text-neutral-400">Approver Terdaftar:</span>
                <span className="text-emerald-400 font-bold">
                  {currentUser?.name || 'David Rusiah'} (Direktur)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#22262A]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setApproveConfirmData(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle2}
                onClick={() => handleApprove(approveConfirmData)}
              >
                Konfirmasi Setujui
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════ MODAL 3: DETAIL LENGKAP KONTRAK RO ══════════ */}
      <Modal
        isOpen={Boolean(detailModalData)}
        onClose={() => setDetailModalData(null)}
        title="Lembar Ringkasan Kontrak Received Order"
        subtitle={`Nomor Berkas: ${detailModalData?.nomorRO || detailModalData?.id}`}
        maxWidth="max-w-2xl"
      >
        {detailModalData && (
          <div className="space-y-4 font-mono text-xs">
            {/* Header Identity */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[#0E1012] border border-[#22262A]">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Customer</span>
                <span className="text-white font-bold">{detailModalData.customer}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Status Pajak</span>
                <span className="text-neutral-200">{detailModalData.jenisWajibPajak || 'PKP'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Term of Payment</span>
                <span className="text-amber-400 font-semibold">{detailModalData.top || '30 Hari'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Tanggal Kontrak</span>
                <span className="text-neutral-200">{formatDate(detailModalData.tanggal)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Jenis RO</span>
                <span className="text-neutral-200">{detailModalData.jenisRO || 'Jasa Angkut + Material'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Mata Uang</span>
                <span className="text-neutral-200">{detailModalData.mataUang || 'IDR'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <span className="text-xs font-bold text-white block mb-1.5 uppercase tracking-wider">
                Rincian Item Material Kontrak
              </span>
              <div className="overflow-x-auto rounded-lg border border-[#22262A]">
                <table className="w-full text-left">
                  <thead className="bg-[#14171A] border-b border-[#22262A] text-[10px] text-neutral-400 uppercase">
                    <tr>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2 text-right">Kuantitas</th>
                      <th className="px-3 py-2 text-right">Harga Beli</th>
                      <th className="px-3 py-2 text-right">Harga Jual</th>
                      <th className="px-3 py-2 text-right">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1F23] bg-[#0E1012]">
                    {detailModalData.items && detailModalData.items.length > 0 ? (
                      detailModalData.items.map((it, idx) => {
                        const qty = Number(it.kuantitas) || 0;
                        const beli = Number(it.hargaBeli) || 0;
                        const jual = Number(it.hargaJual) || 0;
                        const profit = (jual - beli) * qty;
                        return (
                          <tr key={it.id || idx}>
                            <td className="px-3 py-2 text-white font-medium">{it.nama || it.name}</td>
                            <td className="px-3 py-2 text-right text-neutral-200">{formatVolume(qty, it.satuan || 'm3')}</td>
                            <td className="px-3 py-2 text-right text-neutral-400">{formatCurrency(beli)}</td>
                            <td className="px-3 py-2 text-right text-white font-semibold">{formatCurrency(jual)}</td>
                            <td className="px-3 py-2 text-right text-emerald-400 font-bold">+{formatCurrency(profit, false)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-3 py-2 text-white font-medium">{detailModalData.materialName}</td>
                        <td className="px-3 py-2 text-right text-neutral-200">
                          {formatVolume(detailModalData.totalOrder, detailModalData.satuan || 'm3')}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-400">{formatCurrency(detailModalData.hargaBeli)}</td>
                        <td className="px-3 py-2 text-right text-white font-semibold">{formatCurrency(detailModalData.hargaJual)}</td>
                        <td className="px-3 py-2 text-right text-emerald-400 font-bold">
                          +{formatCurrency(
                            ((Number(detailModalData.hargaJual) || 0) - (Number(detailModalData.hargaBeli) || 0)) *
                              (Number(detailModalData.totalOrder) || 0),
                            false
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Status Info */}
            <div className="p-3 rounded-lg bg-[#0E1012] border border-[#22262A] space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Status Saat Ini:</span>
                <span className="font-bold text-white">{detailModalData.status}</span>
              </div>
              {detailModalData.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Disetujui Oleh:</span>
                  <span className="text-emerald-400 font-semibold">{detailModalData.approvedBy} ({detailModalData.approvedAt})</span>
                </div>
              )}
              {detailModalData.rejectionReason && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Catatan Penolakan:</span>
                  <span className="text-rose-400">{detailModalData.rejectionReason}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setDetailModalData(null)}>
                Tutup Ringkasan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
