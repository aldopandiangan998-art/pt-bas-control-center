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
  Filter,
  X,
  Lock,
  Layers,
  Banknote,
  Truck,
  RotateCcw,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatVolume, formatDate } from '../../utils/formatters';
import { Button, Badge, Card, Modal, Select } from '../../components/ui';
import BkkPrintModal from '../../components/bkk/BkkPrintModal';
import BkkDetailWorkflowModal from '../../components/bkk/BkkDetailWorkflowModal';

export default function ApprovalBkkPage() {
  const navigate = useNavigate();
  const { isDark } = useApp();
  const { currentUser, isSuperAdmin, roleLabel } = useAuth();
  const {
    bkkList,
    fetchBkk,
    approveBkk,
    rejectBkk,
    approveBkkVerification,
    rejectBkkVerification,
    rekapanList,
  } = useData();
  const { addToast } = useToast();

  // Navigation & Filter Tabs: 'pending' | 'verification' | 'revision' | 'approved' | 'paid' | 'rejected' | 'all'
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'VALUE_DESC' | 'VOLUME_DESC'

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state for Stage 2 (BKK Administrative Approval)
  const [approveConfirmData, setApproveConfirmData] = useState(null); // bkk item
  const [rejectModalData, setRejectModalData] = useState(null); // bkk item
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals state for Stage 5 (Signed Physical Document Verification Approval / Rejection)
  const [verifyApproveModalData, setVerifyApproveModalData] = useState(null); // bkk item
  const [verifyRejectModalData, setVerifyRejectModalData] = useState(null); // bkk item
  const [verifyRejectReason, setVerifyRejectReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowModalItem, setWorkflowModalItem] = useState(null);
  const [workflowModalTab, setWorkflowModalTab] = useState('summary');
  const [printModalItem, setPrintModalItem] = useState(null);
  const [batchApproveModalOpen, setBatchApproveModalOpen] = useState(false);

  // Status helper functions
  const isPendingStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'pending_approval' || s === 'menunggu_approval' || s === 'pending';
  };
  const isVerificationStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return (
      s === 'pending_verification' ||
      s === 'menunggu_verifikasi' ||
      (s === 'approved' && b?.latestDocument?.status === 'SUBMITTED')
    );
  };
  const isRevisionStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'revision_required' || (b?.latestDocument?.status === 'REJECTED' && s !== 'paid');
  };
  const isPaidStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'paid' || b?.statusBayar === 'Lunas';
  };
  const isApprovedStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'approved' && !isPaidStatus(b) && !isVerificationStatus(b) && !isRevisionStatus(b);
  };
  const isRejectedStatus = (b) => {
    const s = String(b?.status || '').toLowerCase().trim();
    return s === 'rejected' || s === 'ditolak';
  };

  // Distinct suppliers for filter dropdown
  const supplierOptions = useMemo(() => {
    const set = new Set();
    bkkList.forEach((b) => {
      if (b.perusahaan) set.add(b.perusahaan);
    });
    return Array.from(set).sort();
  }, [bkkList]);

  // Tab counts
  const counts = useMemo(() => {
    let pending = 0;
    let verification = 0;
    let revision = 0;
    let approved = 0;
    let paid = 0;
    let rejected = 0;

    bkkList.forEach((b) => {
      if (isPendingStatus(b)) pending++;
      else if (isVerificationStatus(b)) verification++;
      else if (isRevisionStatus(b)) revision++;
      else if (isPaidStatus(b)) paid++;
      else if (isApprovedStatus(b)) approved++;
      else if (isRejectedStatus(b)) rejected++;
    });

    return {
      pending,
      verification,
      revision,
      approved,
      paid,
      rejected,
      all: bkkList.length,
    };
  }, [bkkList]);

  // Executive KPI Metrics for Pending BKKs
  const pendingMetrics = useMemo(() => {
    const pendingList = bkkList.filter(isPendingStatus);
    const totalVolume = pendingList.reduce((acc, b) => acc + (Number(b.volume ?? b.kubikasi) || 0), 0);
    const totalNominal = pendingList.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
    const uniqueSuppliers = new Set(pendingList.map((b) => b.perusahaan || b.penerima).filter(Boolean)).size;

    return {
      count: pendingList.length,
      totalVolume,
      totalNominal,
      uniqueSuppliers,
    };
  }, [bkkList]);

  // Filtered and Sorted list
  const filteredList = useMemo(() => {
    const list = bkkList.filter((b) => {
      // 1. Status Filter
      if (activeTab === 'pending' && !isPendingStatus(b)) return false;
      if (activeTab === 'verification' && !isVerificationStatus(b)) return false;
      if (activeTab === 'revision' && !isRevisionStatus(b)) return false;
      if (activeTab === 'approved' && !isApprovedStatus(b)) return false;
      if (activeTab === 'paid' && !isPaidStatus(b)) return false;
      if (activeTab === 'rejected' && !isRejectedStatus(b)) return false;

      // 2. Supplier Filter
      if (supplierFilter !== 'ALL' && b.perusahaan !== supplierFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (b.kodeTransaksi || b.id || '').toLowerCase();
        const ro = (b.nomorRO || '').toLowerCase();
        const po = (b.poNumber || '').toLowerCase();
        const sup = (b.perusahaan || '').toLowerCase();
        const cust = (b.customer || b.subDetail || '').toLowerCase();
        const pen = (b.penerima || '').toLowerCase();
        const mat = (b.material || '').toLowerCase();

        if (
          !code.includes(q) &&
          !ro.includes(q) &&
          !po.includes(q) &&
          !sup.includes(q) &&
          !cust.includes(q) &&
          !pen.includes(q) &&
          !mat.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort logic
    return list.sort((a, b) => {
      if (sortBy === 'VALUE_DESC') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'VOLUME_DESC') {
        return (Number(b.volume ?? b.kubikasi) || 0) - (Number(a.volume ?? a.kubikasi) || 0);
      }
      // 'NEWEST' default
      const dateA = new Date(a.tanggal || a.created_at || 0).getTime();
      const dateB = new Date(b.tanggal || b.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [bkkList, activeTab, supplierFilter, searchQuery, sortBy]);

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPending = () => {
    const pendingInView = filteredList.filter(isPendingStatus).map((b) => b.id);
    if (selectedIds.size === pendingInView.length && pendingInView.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingInView));
    }
  };

  // Single Approve Action
  const handleApprove = async (bkk) => {
    setIsSubmitting(true);
    try {
      const approver = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await approveBkk(bkk.id, approver);
      if (res?.success) {
        setApproveConfirmData(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(bkk.id);
          return next;
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single Reject Action
  const handleReject = async () => {
    if (!rejectModalData) return;
    if (!rejectionReason.trim()) {
      addToast('Alasan penolakan BKK wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const rejecter = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await rejectBkk(rejectModalData.id, rejectionReason.trim(), rejecter);
      if (res?.success) {
        setRejectModalData(null);
        setRejectionReason('');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(rejectModalData.id);
          return next;
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch Approve Action
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsSubmitting(true);
    let successCount = 0;
    const approver = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;

    try {
      for (const id of ids) {
        const res = await approveBkk(id, approver);
        if (res?.success) successCount++;
      }
      setSelectedIds(new Set());
      setBatchApproveModalOpen(false);
      addToast(`${successCount} BKK (Cash Out) berhasil disetujui dan difinalisasi sekaligus!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Superadmin Verification Approval Action (Stage 5-A -> Final LUNAS)
  const handleDirectVerifyApprove = async (item) => {
    if (!item?.id) return;
    setIsSubmitting(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await approveBkkVerification(item.id, { verifier });
      if (res?.success) {
        setVerifyApproveModalData(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Superadmin Verification Rejection Action (Stage 5-B -> Revision Required)
  const handleDirectVerifyReject = async () => {
    if (!verifyRejectModalData?.id) return;
    if (!verifyRejectReason.trim()) {
      addToast('Alasan penolakan / revisi dokumen fisik wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await rejectBkkVerification(
        verifyRejectModalData.id,
        { reason: verifyRejectReason.trim(), verifier }
      );
      if (res?.success) {
        setVerifyRejectModalData(null);
        setVerifyRejectReason('');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(verifyRejectModalData.id);
          return next;
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find linked journal recap for detailed preview
  const getLinkedJournal = (bkk) => {
    return (rekapanList || []).find(
      (r) => r.id === bkk.jurnalId || r.nomorRO === bkk.nomorRO || r.preOrderId === bkk.preOrderId
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#252A30]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-[#1A1D21] hover:bg-[#252A30] border border-[#2E353D] flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/30 text-[#F4511E]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Approval BKK (Cash Out)
              </h1>
              <Badge variant="warning" size="xs" className="font-mono">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Otorisasi dan finalisasi Bukti Kas Keluar ke supplier & vendor setelah order selesai 100%
            </p>
          </div>
        </div>

        {/* Action shortcut to View BKK List */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={Banknote}
            onClick={() => navigate('/bkk')}
          >
            Daftar Data BKK
          </Button>
        </div>
      </div>

      {/* ── KPI EXECUTIVE SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#14171A] border border-[#24282E] relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Menunggu Approval BKK</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {counts.pending}
            </span>
            <span className="text-xs text-neutral-400 font-medium">berkas</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Pengajuan BKK baru dari Admin menunggu persetujuan
          </p>
        </div>

        <div
          onClick={() => setActiveTab('verification')}
          className={`p-4 rounded-2xl bg-[#14171A] border relative overflow-hidden transition-all cursor-pointer ${
            counts.verification > 0
              ? 'border-[#F4511E]/60 shadow-lg shadow-[#F4511E]/10 ring-1 ring-[#F4511E]/30'
              : 'border-[#24282E]'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Verifikasi Dokumen Fisik</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              counts.verification > 0 ? 'bg-[#F4511E] text-white animate-pulse' : 'bg-[#F4511E]/10 text-[#F4511E]'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#F4511E] font-mono">
              {counts.verification}
            </span>
            <span className="text-xs text-neutral-400 font-medium">dokumen fisik</span>
          </div>
          {counts.verification > 0 ? (
            <p className="text-[11px] text-amber-300 font-semibold mt-1 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 animate-bounce" />
              Menunggu verifikasi Direksi untuk pelunasan
            </p>
          ) : (
            <p className="text-[11px] text-neutral-500 mt-1">
              Scan 5 tanda tangan fisik siap diverifikasi Direksi
            </p>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#14171A] border border-[#24282E] relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Dokumen Perlu Revisi</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {counts.revision}
            </span>
            <span className="text-xs text-neutral-400 font-medium">berkas</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Dokumen tanda tangan fisik yang dikembalikan ke Admin
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#14171A] border border-[#24282E] relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Kas Keluar LUNAS</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {counts.paid}
            </span>
            <span className="text-xs text-neutral-400 font-medium">berkas final</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            BKK telah diverifikasi sah & selesai dibayarkan
          </p>
        </div>
      </div>

      {/* ── TABS & FILTER BAR ── */}
      <div className="bg-[#14171A] border border-[#24282E] rounded-2xl p-3.5 space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#202428]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Approval BKK ({counts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'verification'
                ? 'bg-[#F4511E] text-white shadow-sm ring-1 ring-[#F4511E]'
                : counts.verification > 0
                ? 'text-[#F4511E] bg-[#F4511E]/10 border border-[#F4511E]/30 hover:bg-[#F4511E]/20'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Dokumen Fisik ({counts.verification})</span>
            {counts.verification > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-black animate-pulse">
                Action
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'revision'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Perlu Revisi ({counts.revision})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Siap Cetak & TTD ({counts.approved})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'paid'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai / LUNAS ({counts.paid})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({counts.rejected})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1D2126]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Riwayat ({counts.all})</span>
          </button>
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-col md:flex-row items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, No. RO, No. PO, customer, supplier, penerima..."
              className="w-full bg-[#181B1E] border border-[#282D34] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
            />
            {searchQuery && (
              <X
                className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          {/* Supplier dropdown with search */}
          <Select
            containerClassName="w-full md:w-56 shrink-0"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            searchPlaceholder="Cari supplier..."
            className="rounded-xl text-xs bg-[#181B1E] border-[#282D34] text-white"
          >
            <option value="ALL">Semua Supplier</option>
            {supplierOptions.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </Select>

          {/* Sort dropdown */}
          <Select
            containerClassName="w-full md:w-48 shrink-0"
            align="right"
            searchable={false}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl text-xs bg-[#181B1E] border-[#282D34] text-white"
          >
            <option value="NEWEST">Terbaru</option>
            <option value="VALUE_DESC">Nominal Tertinggi</option>
            <option value="VOLUME_DESC">Volume Terbesar</option>
          </Select>
        </div>

        {/* Batch Action Bar if items selected */}
        {activeTab === 'pending' && filteredList.some(isPendingStatus) && (
          <div className="pt-2 border-t border-[#202428] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllPending}
                className="text-neutral-300 hover:text-white flex items-center gap-1.5 font-medium cursor-pointer"
              >
                {selectedIds.size > 0 && selectedIds.size === filteredList.filter(isPendingStatus).length ? (
                  <CheckSquare className="w-4 h-4 text-[#F4511E]" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-500" />
                )}
                <span>Pilih Semua Pending ({filteredList.filter(isPendingStatus).length})</span>
              </button>

              {selectedIds.size > 0 && (
                <span className="text-amber-400 font-bold ml-2">
                  {selectedIds.size} BKK dipilih
                </span>
              )}
            </div>

            {selectedIds.size > 0 && (
              <Button
                size="xs"
                variant="primary"
                icon={CheckCircle2}
                onClick={() => setBatchApproveModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Setujui {selectedIds.size} BKK Sekaligus
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── BKK LIST ── */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-[#14171A] border border-[#24282E] rounded-2xl space-y-3 font-mono">
          <Banknote className="w-12 h-12 text-neutral-500 mx-auto" />
          <div className="text-base text-neutral-300 font-bold">
            Tidak ada data BKK pada filter ini
          </div>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'Seluruh BKK dari order komplit telah selesai ditinjau dan disetujui.'
              : 'Silakan ubah filter status atau kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const isPending = isPendingStatus(item);
            const isVerification = isVerificationStatus(item);
            const isRevision = isRevisionStatus(item);
            const isApproved = isApprovedStatus(item);
            const isPaid = isPaidStatus(item);
            const isRejected = isRejectedStatus(item);
            const isSelected = selectedIds.has(item.id);
            const volumeNum = Number(item.volume ?? item.kubikasi) || 0;
            const amountNum = Number(item.amount) || 0;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? 'bg-[#16181B] border-amber-500/30 hover:border-amber-500/60'
                    : isVerification
                    ? 'bg-[#181512] border-[#F4511E]/40 hover:border-[#F4511E]/70 ring-1 ring-[#F4511E]/20'
                    : isRevision
                    ? 'bg-[#1A1414] border-rose-500/40 hover:border-rose-500/60'
                    : isPaid
                    ? 'bg-[#121614] border-emerald-500/30 hover:border-emerald-500/60'
                    : isRejected
                    ? 'bg-[#161414] border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-[#121417] border-[#22262B] hover:border-[#323842]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Select box + Identification */}
                  <div className="flex items-start gap-3 min-w-0">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="mt-1 w-4 h-4 rounded border-[#3A404A] bg-[#16191D] accent-[#F4511E] cursor-pointer shrink-0"
                      />
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            TERKUNCI • MENUNGGU APPROVAL
                          </span>
                        )}
                        {isVerification && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#F4511E]" />
                            MENUNGGU VERIFIKASI DOKUMEN FISIK
                          </span>
                        )}
                        {isRevision && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            PERLU REVISI TTD FISIK
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <Printer className="w-3 h-3" />
                            DISETUJUI (SIAP CETAK & TTD)
                          </span>
                        )}
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            LUNAS (TERVERIFIKASI SAH)
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            DITOLAK
                          </span>
                        )}

                        <span className="text-xs font-mono font-bold text-white">
                          {item.kodeTransaksi || item.id}
                        </span>

                        <span className="text-[11px] font-mono text-neutral-400">
                          &bull; Dibuat oleh: <strong className="text-neutral-200">{item.createdBy || 'Admin'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-300 font-mono flex-wrap">
                        <div>
                          RO:{' '}
                          <span className="text-white font-bold">{item.nomorRO || '-'}</span>
                        </div>
                        <div>
                          PO:{' '}
                          <span className="text-white font-bold">{item.poNumber || '-'}</span>
                        </div>
                        <div>
                          Customer:{' '}
                          <span className="text-neutral-200">{item.customer || item.subDetail || '-'}</span>
                        </div>
                        <div>
                          Tanggal:{' '}
                          <span className="text-neutral-400">{item.tanggal || item.timestamp?.slice(0, 10)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-400 font-sans">
                        Penerima: <strong className="text-white">{item.penerima || item.perusahaan}</strong> &bull; Rekening: <span className="font-mono text-neutral-300">{item.rekeningTujuan || '-'}</span>
                      </div>

                      {item.rejectionReason && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                          <strong>Catatan Penolakan/Revisi:</strong> {item.rejectionReason}
                        </div>
                      )}

                      {isApproved && item.approvedBy && (
                        <div className="text-[11px] text-blue-400 font-mono">
                          ✓ Disetujui administratif: {item.approvedBy} ({item.approvedAt ? formatDate(item.approvedAt) : '-'})
                        </div>
                      )}

                      {isPaid && (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          ✓ Terverifikasi sah & Lunas
                        </div>
                      )}

                      {/* Prominent Signed Physical Document Alert Banner */}
                      {(isVerification || item.latestDocument) && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#1C1613] border border-[#F4511E]/40 shadow-sm space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F4511E]/20 text-[#F4511E] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                <FileText className="w-4 h-4 text-[#F4511E]" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-bold text-white truncate max-w-[280px]">
                                    {item.latestDocument?.originalName || item.latestDocument?.fileName || 'Dokumen Bertanda Tangan Fisik'}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#F4511E]/20 text-orange-200 border border-[#F4511E]/40">
                                    v{item.latestDocument?.version || 1}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                    item.latestDocument?.status === 'VERIFIED'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : item.latestDocument?.status === 'REJECTED'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40 animate-pulse'
                                  }`}>
                                    {item.latestDocument?.status === 'VERIFIED'
                                      ? 'TERVERIFIKASI'
                                      : item.latestDocument?.status === 'REJECTED'
                                      ? 'DITOLAK'
                                      : 'MENUNGGU VERIFIKASI'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                                  Diunggah oleh <strong className="text-neutral-200">{item.latestDocument?.uploadedBy || 'Admin'}</strong>
                                  {item.latestDocument?.uploadedAt ? ` • ${formatDate(item.latestDocument.uploadedAt)}` : ''}
                                  {item.latestDocument?.fileSize ? ` (${(item.latestDocument.fileSize / 1024).toFixed(1)} KB)` : ''}
                                </p>
                              </div>
                            </div>

                            {/* View / Download Link */}
                            {item.latestDocument?.id && (
                              <a
                                href={`/api/bkk/documents/file/${item.latestDocument.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#F4511E]/20 hover:bg-[#F4511E]/30 text-orange-200 hover:text-white border border-[#F4511E]/40 transition-colors w-fit shrink-0 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Lihat Berkas PDF</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Values & Decision Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#22262B]">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-white font-mono">
                        {formatCurrency(amountNum)}
                      </div>
                      <div className="text-xs font-mono text-neutral-400">
                        {volumeNum.toFixed(2)} {item.satuan || 'm³'} &bull; Rp {(Number(item.hargaSatuan) || 0).toLocaleString('id-ID')}/m³
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => {
                          setWorkflowModalTab(isVerification ? 'document' : 'summary');
                          setWorkflowModalItem(item);
                        }}
                      >
                        Rincian
                      </Button>

                      {isVerification && (
                        <>
                          <Button
                            size="xs"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => {
                              setVerifyRejectModalData(item);
                              setVerifyRejectReason('');
                            }}
                          >
                            Tolak Revisi
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => setVerifyApproveModalData(item)}
                            className="bg-[#F4511E] hover:bg-[#D84315] text-white font-bold shadow-md shadow-orange-950/40"
                          >
                            Setujui Verifikasi & Lunasi
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={ShieldCheck}
                            onClick={() => {
                              setWorkflowModalTab('document');
                              setWorkflowModalItem(item);
                            }}
                            className="text-[#F4511E] border-[#F4511E]/50 hover:bg-[#F4511E]/10"
                          >
                            Tinjau Berkas & Rincian
                          </Button>
                        </>
                      )}

                      {isPending && (
                        <>
                          <Button
                            size="xs"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => {
                              setRejectModalData(item);
                              setRejectionReason('');
                            }}
                          >
                            Tolak
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => setApproveConfirmData(item)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Setujui BKK
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL KONFIRMASI PERSETUJUAN (SINGLE) ── */}
      <Modal
        isOpen={Boolean(approveConfirmData)}
        onClose={() => setApproveConfirmData(null)}
        title="Konfirmasi Persetujuan BKK"
        subtitle={approveConfirmData?.kodeTransaksi}
      >
        {approveConfirmData && (
          <div className="p-4 space-y-4 font-sans text-xs text-neutral-300">
            <div className="p-3.5 rounded-xl bg-[#181B1E] border border-[#262A2F] space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Nomor BKK:</span>
                <span className="text-white font-bold">{approveConfirmData.kodeTransaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Order Terhubung:</span>
                <span className="text-white">{approveConfirmData.nomorRO} / {approveConfirmData.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Supplier Vendor:</span>
                <span className="text-white font-bold">{approveConfirmData.perusahaan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Volume Pengiriman:</span>
                <span className="text-cyan-400 font-bold">{(Number(approveConfirmData.volume) || 0).toFixed(2)} m³</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-400">Total Kas Keluar:</span>
                <span className="text-[#F4511E] font-black text-sm">{formatCurrency(approveConfirmData.amount)}</span>
              </div>
            </div>

            <p className="text-neutral-400">
              Dengan menyetujui, BKK ini akan berstatus <strong className="text-emerald-400">APPROVED (Final)</strong> dan dapat diproses untuk pelunasan kas keluar ke supplier.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
              <Button variant="ghost" size="sm" onClick={() => setApproveConfirmData(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                disabled={isSubmitting}
                onClick={() => handleApprove(approveConfirmData)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {isSubmitting ? 'Memproses...' : 'Ya, Setujui & Finalisasi BKK'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL PENOLAKAN BKK ── */}
      <Modal
        isOpen={Boolean(rejectModalData)}
        onClose={() => setRejectModalData(null)}
        title="Penolakan Pengajuan BKK"
        subtitle={rejectModalData?.kodeTransaksi}
      >
        {rejectModalData && (
          <div className="p-4 space-y-3 font-sans text-xs">
            <p className="text-neutral-300">
              Silakan tuliskan alasan penolakan BKK <strong className="text-white">{rejectModalData.kodeTransaksi}</strong> agar Admin dapat meninjau dan memperbaikinya:
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Nominal tidak sesuai dengan kesepakatan harga beli, mohon periksa kembali rincian nota..."
              className="w-full bg-[#181B1E] border border-[#282D34] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalData(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                disabled={isSubmitting || !rejectionReason.trim()}
                onClick={handleReject}
              >
                {isSubmitting ? 'Memproses...' : 'Tolak BKK'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL BATCH APPROVAL ── */}
      <Modal
        isOpen={batchApproveModalOpen}
        onClose={() => setBatchApproveModalOpen(false)}
        title="Persetujuan Massal BKK (Batch Approve)"
        subtitle={`${selectedIds.size} BKK Terpilih`}
      >
        <div className="p-4 space-y-4 font-sans text-xs text-neutral-300">
          <p>
            Anda akan menyetujui sekaligus <strong className="text-white font-bold">{selectedIds.size} berkas BKK</strong> yang sedang pending.
          </p>

          <div className="p-3 rounded-xl bg-[#181B1E] border border-[#262A2F] space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Berkas:</span>
              <span className="text-white font-bold">{selectedIds.size} BKK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Nominal Kas Keluar:</span>
              <span className="text-[#F4511E] font-bold">
                {formatCurrency(
                  bkkList
                    .filter((b) => selectedIds.has(b.id))
                    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
            <Button variant="ghost" size="sm" onClick={() => setBatchApproveModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              disabled={isSubmitting}
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {isSubmitting ? 'Memproses...' : `Setujui ${selectedIds.size} BKK`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL KONFIRMASI VERIFIKASI DOKUMEN FISIK & PELUNASAN (SUPERADMIN) ── */}
      <Modal
        isOpen={Boolean(verifyApproveModalData)}
        onClose={() => setVerifyApproveModalData(null)}
        title="Verifikasi Dokumen Fisik & Pelunasan BKK"
        subtitle={verifyApproveModalData?.kodeTransaksi}
      >
        {verifyApproveModalData && (
          <div className="p-4 space-y-4 font-sans text-xs text-neutral-300">
            <div className="p-3.5 rounded-xl bg-[#181B1E] border border-[#262A2F] space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Nomor BKK:</span>
                <span className="text-white font-bold">{verifyApproveModalData.kodeTransaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Order Terhubung:</span>
                <span className="text-white">{verifyApproveModalData.nomorRO} / {verifyApproveModalData.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Supplier Vendor:</span>
                <span className="text-white font-bold">{verifyApproveModalData.perusahaan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Berkas Fisik:</span>
                <span className="text-[#F4511E] font-bold truncate max-w-[220px]">
                  {verifyApproveModalData.latestDocument?.originalName || 'Dokumen Bertanda Tangan'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-400">Total Kas Keluar (LUNAS):</span>
                <span className="text-emerald-400 font-black text-sm">{formatCurrency(verifyApproveModalData.amount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F4511E]/10 border border-[#F4511E]/30 text-orange-200 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-[#F4511E]">
                <ShieldCheck className="w-4 h-4 text-[#F4511E] shrink-0" />
                Konfirmasi Keabsahan Dokumen Fisik 5 Tanda Tangan:
              </p>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Dengan menyetujui verifikasi ini, dokumen fisik bertanda tangan dinyatakan sah secara hukum perusahaan, status transaksi difinalisasi menjadi <strong className="text-emerald-400">PAID (LUNAS)</strong>, dan seluruh rekaman tersimpan permanen dalam Audit Trail.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
              <Button variant="ghost" size="sm" onClick={() => setVerifyApproveModalData(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                disabled={isSubmitting}
                onClick={() => handleDirectVerifyApprove(verifyApproveModalData)}
                className="bg-[#F4511E] hover:bg-[#D84315] text-white font-bold"
              >
                {isSubmitting ? 'Memverifikasi...' : 'Ya, Setujui Verifikasi & Tandai LUNAS'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL PENOLAKAN VERIFIKASI DOKUMEN FISIK (SUPERADMIN) ── */}
      <Modal
        isOpen={Boolean(verifyRejectModalData)}
        onClose={() => setVerifyRejectModalData(null)}
        title="Tolak Verifikasi & Minta Revisi Dokumen Fisik"
        subtitle={verifyRejectModalData?.kodeTransaksi}
      >
        {verifyRejectModalData && (
          <div className="p-4 space-y-3 font-sans text-xs">
            <p className="text-neutral-300">
              Silakan tuliskan alasan penolakan berkas fisik BKK <strong className="text-white">{verifyRejectModalData.kodeTransaksi}</strong> agar Admin dapat memperbaiki tanda tangan atau mengunggah ulang berkas fisik:
            </p>

            <textarea
              rows={3}
              required
              value={verifyRejectReason}
              onChange={(e) => setVerifyRejectReason(e.target.value)}
              placeholder="Contoh: Tanda tangan bagian Mengetahui belum dibubuhkan, scan dokumen buram, atau lembar bukti tidak lengkap..."
              className="w-full bg-[#181B1E] border border-[#282D34] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
              <Button variant="ghost" size="sm" onClick={() => setVerifyRejectModalData(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                disabled={isSubmitting || !verifyRejectReason.trim()}
                onClick={handleDirectVerifyReject}
              >
                {isSubmitting ? 'Memproses...' : 'Tolak & Minta Revisi Admin'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL WORKFLOW & VERIFIKASI DOKUMEN BKK ── */}
      <BkkDetailWorkflowModal
        isOpen={Boolean(workflowModalItem)}
        onClose={() => setWorkflowModalItem(null)}
        bkkItem={workflowModalItem}
        initialTab={workflowModalTab}
        onOpenPrintModal={(item) => setPrintModalItem(item)}
        onBkkUpdated={() => fetchBkk()}
      />

      {/* ── MODAL CETAK & EKSPOR PDF CASH-OUT (BKK) ── */}
      <BkkPrintModal
        isOpen={Boolean(printModalItem)}
        onClose={() => setPrintModalItem(null)}
        bkkItem={printModalItem}
      />
    </div>
  );
}
