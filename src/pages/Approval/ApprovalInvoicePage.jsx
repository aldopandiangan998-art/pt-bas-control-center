import { useState, useMemo, useEffect } from 'react';
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
  RotateCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatVolume, formatDate } from '../../utils/formatters';
import { Button, Badge, Card, Modal } from '../../components/ui';
import InvoicePrintModal from '../../components/invoice/InvoicePrintModal';
import InvoiceDetailWorkflowModal from '../../components/invoice/InvoiceDetailWorkflowModal';

export default function ApprovalInvoicePage() {
  const navigate = useNavigate();
  const { isDark } = useApp();
  const { currentUser, isSuperAdmin, roleLabel } = useAuth();
  const {
    invoiceList,
    fetchInvoices,
    approveInvoice,
    rejectInvoice,
    approveInvoiceVerification,
    rejectInvoiceVerification,
    rekapanList,
  } = useData();
  const { addToast } = useToast();

  // Navigation & Filter Tabs: 'pending' | 'verification' | 'revision' | 'approved' | 'paid' | 'rejected' | 'all'
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'VALUE_DESC' | 'VOLUME_DESC'

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state for Stage 2 (Invoice Administrative Approval)
  const [approveConfirmData, setApproveConfirmData] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals state for Stage 5 (Signed Physical Document Verification Approval / Rejection)
  const [verifyApproveModalData, setVerifyApproveModalData] = useState(null);
  const [verifyRejectModalData, setVerifyRejectModalData] = useState(null);
  const [verifyRejectReason, setVerifyRejectReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowModalItem, setWorkflowModalItem] = useState(null);
  const [workflowModalTab, setWorkflowModalTab] = useState('summary');
  const [printModalItem, setPrintModalItem] = useState(null);
  const [batchApproveModalOpen, setBatchApproveModalOpen] = useState(false);

  useEffect(() => {
    if (fetchInvoices) {
      fetchInvoices();
    }
  }, [fetchInvoices]);

  // Safe list reference
  const safeInvoiceList = useMemo(() => {
    return Array.isArray(invoiceList) ? invoiceList : [];
  }, [invoiceList]);

  // Status helper functions
  const isPendingStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return s === 'pending_approval' || s === 'menunggu_approval' || s === 'pending';
  };
  const isVerificationStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return (
      s === 'pending_verification' ||
      s === 'menunggu_verifikasi' ||
      (s === 'approved' && inv?.latestDocument?.status === 'SUBMITTED')
    );
  };
  const isRevisionStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return s === 'revision_required' || (inv?.latestDocument?.status === 'REJECTED' && s !== 'paid');
  };
  const isPaidStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return s === 'paid' || inv?.statusBayar === 'Lunas';
  };
  const isApprovedStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return s === 'approved' && !isPaidStatus(inv) && !isVerificationStatus(inv) && !isRevisionStatus(inv);
  };
  const isRejectedStatus = (inv) => {
    const s = String(inv?.status || '').toLowerCase().trim();
    return s === 'rejected' || s === 'ditolak';
  };

  // Distinct customers for filter dropdown
  const customerOptions = useMemo(() => {
    const set = new Set();
    safeInvoiceList.forEach((inv) => {
      const name = inv.customer || inv.perusahaan;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [safeInvoiceList]);

  // Tab counts
  const counts = useMemo(() => {
    let pending = 0;
    let verification = 0;
    let revision = 0;
    let approved = 0;
    let paid = 0;
    let rejected = 0;

    safeInvoiceList.forEach((inv) => {
      if (isPendingStatus(inv)) pending++;
      else if (isVerificationStatus(inv)) verification++;
      else if (isRevisionStatus(inv)) revision++;
      else if (isPaidStatus(inv)) paid++;
      else if (isApprovedStatus(inv)) approved++;
      else if (isRejectedStatus(inv)) rejected++;
    });

    return {
      pending,
      verification,
      revision,
      approved,
      paid,
      rejected,
      all: safeInvoiceList.length,
    };
  }, [safeInvoiceList]);

  // Executive KPI Metrics
  const metrics = useMemo(() => {
    const pendingInvs = safeInvoiceList.filter(isPendingStatus);
    const verificationInvs = safeInvoiceList.filter(isVerificationStatus);

    const totalActionValue = [...pendingInvs, ...verificationInvs].reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalVolume = [...pendingInvs, ...verificationInvs].reduce(
      (sum, item) => sum + (Number(item.volume) || 0),
      0
    );

    return {
      totalActionValue,
      totalVolume,
      pendingCount: pendingInvs.length,
      verificationCount: verificationInvs.length,
    };
  }, [safeInvoiceList]);

  // Filter & Sort
  const filteredInvoices = useMemo(() => {
    let list = safeInvoiceList.filter((inv) => {
      // Tab filter
      if (activeTab === 'pending' && !isPendingStatus(inv)) return false;
      if (activeTab === 'verification' && !isVerificationStatus(inv)) return false;
      if (activeTab === 'revision' && !isRevisionStatus(inv)) return false;
      if (activeTab === 'approved' && !isApprovedStatus(inv)) return false;
      if (activeTab === 'paid' && !isPaidStatus(inv)) return false;
      if (activeTab === 'rejected' && !isRejectedStatus(inv)) return false;

      // Customer filter
      if (customerFilter !== 'ALL') {
        const cName = inv.customer || inv.perusahaan;
        if (cName !== customerFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchable = [
          inv.kodeTransaksi,
          inv.nomorInvoice,
          inv.nomorRO,
          inv.poNumber,
          inv.customer,
          inv.perusahaan,
          inv.material,
          inv.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'VALUE_DESC') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (sortBy === 'VOLUME_DESC') {
        return (Number(b.volume) || 0) - (Number(a.volume) || 0);
      }
      // NEWEST
      const tA = new Date(a.timestamp || a.created_at || 0).getTime();
      const tB = new Date(b.timestamp || b.created_at || 0).getTime();
      return tB - tA;
    });

    return list;
  }, [safeInvoiceList, activeTab, customerFilter, searchQuery, sortBy]);

  // Batch toggle
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map((i) => i.id)));
    }
  };

  // Actions: Stage 2 Initial Approval
  const handleConfirmApprove = async () => {
    if (!approveConfirmData) return;
    setIsSubmitting(true);
    try {
      const res = await approveInvoice(
        approveConfirmData.id,
        `${currentUser?.name || 'David Rusiah'} (Direktur)`
      );
      if (res?.success) {
        setApproveConfirmData(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    if (!rejectionReason.trim()) {
      addToast('Alasan penolakan invoice wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await rejectInvoice(rejectModalData.id, rejectionReason.trim());
      if (res?.success) {
        setRejectModalData(null);
        setRejectionReason('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actions: Stage 5 Document Verification
  const handleConfirmVerifyApprove = async () => {
    if (!verifyApproveModalData) return;
    setIsSubmitting(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await approveInvoiceVerification(verifyApproveModalData.id, { verifier });
      if (res?.success) {
        setVerifyApproveModalData(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVerifyReject = async () => {
    if (!verifyRejectModalData) return;
    if (!verifyRejectReason.trim()) {
      addToast('Alasan penolakan dokumen wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await rejectInvoiceVerification(
        verifyRejectModalData.id,
        { reason: verifyRejectReason.trim(), verifier }
      );
      if (res?.success) {
        setVerifyRejectModalData(null);
        setVerifyRejectReason('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch approve action
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const item = safeInvoiceList.find((i) => i.id === id);
        if (isPendingStatus(item)) {
          const res = await approveInvoice(id, `${currentUser?.name || 'David Rusiah'} (Direktur)`);
          if (res?.success) successCount++;
        } else if (isVerificationStatus(item)) {
          const res = await approveInvoiceVerification(id, {
            verifier: `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`,
          });
          if (res?.success) successCount++;
        }
      }
      addToast(`${successCount} Faktur Invoice berhasil disetujui sekaligus!`, 'success');
      setSelectedIds(new Set());
      setBatchApproveModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 w-full pb-32">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#14171A] border border-[#24282E] text-neutral-300 hover:text-white hover:border-[#F4511E]/40 transition-colors cursor-pointer"
            title="Kembali ke Daftar Invoice"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Persetujuan Faktur Invoice &amp; Verifikasi Fisik
              </h1>
              <Badge variant="primary" size="xs" className="font-mono">
                Super Admin
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Portal otorisasi invoice dua tahap: Approval Cetak &amp; Verifikasi Tanda Tangan Fisik Pelunasan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={() => setBatchApproveModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Setujui Terpilih ({selectedIds.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={RotateCcw}
            onClick={() => {
              fetchInvoices();
              addToast('Data persetujuan invoice berhasil diperbarui', 'info');
            }}
          >
            Segarkan
          </Button>
        </div>
      </div>

      {/* ── EXECUTIVE KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#121417] border border-[#24282E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Total Tagihan Menunggu
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatCurrency(metrics.totalActionValue)}
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
              Persetujuan &amp; Verifikasi
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F4511E]/10 border border-[#F4511E]/30 text-[#F4511E] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121417] border border-[#24282E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Volume Material Tagihan
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {metrics.totalVolume.toFixed(2)} m³
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
              Realisasi Pengiriman Terpenuhi
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121417] border border-[#24282E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Menunggu Approval Cetak
            </span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {metrics.pendingCount} Invoice
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
              Tahap 2: Otorisasi Direksi
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#121417] border border-[#24282E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Menunggu Verifikasi Fisik
            </span>
            <div className="text-lg font-bold font-mono text-[#F4511E] mt-1">
              {metrics.verificationCount} Dokumen
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
              Tahap 5: Menuju LUNAS
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F4511E]/10 border border-[#F4511E]/30 text-[#F4511E] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── WORKFLOW TABS ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#24282C] text-xs font-mono">
        <button
          type="button"
          onClick={() => { setActiveTab('pending'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'pending'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Menunggu Approval ({counts.pending})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('verification'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'verification'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verifikasi Dokumen Fisik ({counts.verification})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('revision'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'revision'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Perlu Revisi TTD ({counts.revision})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('approved'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'approved'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Siap Cetak ({counts.approved})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('paid'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'paid'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Lunas ({counts.paid})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('all'); setSelectedIds(new Set()); }}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/20'
              : 'bg-[#14171A] text-neutral-400 hover:text-white border border-[#24282E]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua ({counts.all})</span>
        </button>
      </div>

      {/* ── TOOLBAR: SEARCH & FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121417] p-3 rounded-2xl border border-[#22262B]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Invoice, Nomor RO, PO, Pelanggan, atau Material..."
              className="w-full bg-[#181B1E] border border-[#282C32] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#F4511E] font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-[#181B1E] border border-[#282C32] text-xs text-neutral-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-[#F4511E] font-mono cursor-pointer"
            >
              <option value="ALL">Semua Pelanggan</option>
              {customerOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#181B1E] border border-[#282C32] text-xs text-neutral-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-[#F4511E] font-mono cursor-pointer"
            >
              <option value="NEWEST">Terbaru</option>
              <option value="VALUE_DESC">Nilai Tertinggi</option>
              <option value="VOLUME_DESC">Volume Terbesar</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 self-end sm:self-auto">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-2.5 py-1 rounded-lg bg-[#181B1E] border border-[#282C32] hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.size === filteredInvoices.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#F4511E]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-neutral-500" />
              )}
              <span>Pilih Semua ({filteredInvoices.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ── CARD LIST ── */}
      {filteredInvoices.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#262A30] rounded-2xl bg-[#101214] space-y-2">
          <Receipt className="w-10 h-10 text-neutral-600 mx-auto" />
          <div className="text-sm font-bold text-neutral-300 font-mono">
            Tidak ada faktur invoice yang memerlukan tindakan pada tab ini.
          </div>
          <p className="text-xs text-neutral-500 font-sans max-w-md mx-auto">
            Semua tagihan sudah diproses atau gunakan filter lain untuk melihat riwayat data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredInvoices.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isPending = isPendingStatus(item);
            const isVerification = isVerificationStatus(item);
            const isRevision = isRevisionStatus(item);
            const isApproved = isApprovedStatus(item);
            const isPaid = isPaidStatus(item);
            const isRejected = isRejectedStatus(item);

            const vol = Number(item.volume || 0).toFixed(2);
            const amt = formatCurrency(item.amount);
            const dpp = formatCurrency(item.dpp || item.subtotalJasa);
            const ppn = formatCurrency(item.ppnNominal || item.ppn);
            const pph = formatCurrency(item.pphNominal || item.pph);

            return (
              <div
                key={item.id}
                className={`bg-[#121417] border rounded-2xl p-4 transition-all flex flex-col justify-between select-none ${
                  isSelected
                    ? 'border-[#F4511E]/70 ring-1 ring-[#F4511E]/40 bg-[#161413]'
                    : 'border-[#22262B] hover:border-[#323842]'
                }`}
              >
                <div>
                  {/* Top Bar: Checkbox + Timestamp + Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#202428]">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] font-mono text-neutral-400">
                        {item.tanggal || item.timestamp?.slice(0, 10) || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          LUNAS
                        </span>
                      )}
                      {isVerification && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40 text-[9px] font-mono font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          VERIFIKASI FISIK
                        </span>
                      )}
                      {isRevision && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                          <RotateCw className="w-2.5 h-2.5" />
                          REVISI TTD
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-mono font-bold">
                          <Printer className="w-2.5 h-2.5" />
                          SIAP CETAK
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                          DITOLAK
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                          <Lock className="w-2.5 h-2.5" />
                          MENUNGGU APPROVAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Grid: Left (Volume & Specs) - Right (Customer, Code, Amount) */}
                  <div className="flex items-start gap-4 py-3">
                    {/* Left Column: Volume & Material */}
                    <div className="w-28 sm:w-32 shrink-0 flex flex-col justify-start">
                      <div className="text-2xl font-black font-mono text-white tracking-tight leading-none">
                        {vol}
                      </div>
                      <div className="text-xs font-semibold font-mono text-neutral-300 mt-1">
                        {item.satuan === 'm3' ? 'm³' : item.satuan || 'm³'}
                      </div>
                      <div className="text-xs font-bold font-mono text-white uppercase tracking-wider mt-2 truncate" title={item.material}>
                        {item.material || 'SIRTU'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5 leading-tight">
                        {item.materialType || 'CURAH'} | JASA
                      </div>
                    </div>

                    {/* Right Column: Key Invoice Info */}
                    <div className="flex-1 min-w-0">
                      {/* Prominent Amount */}
                      <div className="text-base sm:text-lg font-black font-mono text-white tracking-tight leading-tight">
                        {amt}
                      </div>

                      {/* Invoice Code */}
                      <div className="text-xs font-mono font-bold text-neutral-300 mt-1 truncate" title={item.kodeTransaksi || item.nomorInvoice}>
                        {item.kodeTransaksi || item.nomorInvoice || '-'}
                      </div>

                      {/* Customer Name */}
                      <div className="text-xs font-bold font-mono text-neutral-100 uppercase mt-0.5 truncate" title={item.customer || item.perusahaan}>
                        {item.customer || item.perusahaan || '-'}
                      </div>

                      {/* Order Ref & Taxes */}
                      <div className="text-[11px] font-mono text-neutral-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>RO: {item.nomorRO || '-'}</span>
                        <span>PO: {item.poNumber || '-'}</span>
                      </div>

                      <div className="text-[10px] font-mono text-neutral-500 mt-1">
                        DPP: {dpp} &bull; PPN: +{ppn} &bull; PPh: -{pph}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="border-t border-[#202428] pt-3 flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWorkflowModalItem(item);
                        setWorkflowModalTab('summary');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#16191D] hover:bg-[#20242A] border border-[#262A2F] text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title="Lihat Detail & Berkas"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintModalItem(item)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-xl bg-[#16191D] hover:bg-[#20242A] border border-[#262A2F] text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
                      title={isPending ? 'Harus disetujui dahulu sebelum cetak' : 'Buka dialog cetak'}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>

                  {/* Primary Workflow Actions for Superadmin */}
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectModalData(item)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono transition-colors cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => setApproveConfirmData(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer shadow-sm"
                        >
                          Setujui
                        </button>
                      </>
                    )}

                    {isVerification && (
                      <>
                        <button
                          type="button"
                          onClick={() => setVerifyRejectModalData(item)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono transition-colors cursor-pointer"
                        >
                          Minta Revisi
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifyApproveModalData(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F4511E] hover:bg-[#E04418] text-white text-xs font-bold font-mono transition-colors cursor-pointer shadow-sm"
                        >
                          Sahkan Lunas
                        </button>
                      </>
                    )}

                    {isRevision && (
                      <button
                        type="button"
                        onClick={() => {
                          setWorkflowModalItem(item);
                          setWorkflowModalTab('document');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16191D] hover:bg-[#20242A] text-neutral-300 border border-[#262A2F] text-xs font-mono transition-colors cursor-pointer"
                      >
                        Lihat Revisi
                      </button>
                    )}

                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          setWorkflowModalItem(item);
                          setWorkflowModalTab('document');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#16191D] hover:bg-[#20242A] text-blue-300 border border-blue-500/30 text-xs font-mono transition-colors cursor-pointer"
                      >
                        Unggah TTD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS & DIALOGS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal 1: Konfirmasi Setujui Invoice (Stage 2) */}
      <Modal
        isOpen={Boolean(approveConfirmData)}
        onClose={() => setApproveConfirmData(null)}
        title="Otorisasi & Persetujuan Faktur Invoice"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#121417] rounded-xl border border-[#22262B] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Nomor Invoice:</span>
              <span className="font-bold text-white">{approveConfirmData?.kodeTransaksi || approveConfirmData?.nomorInvoice}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Customer:</span>
              <span className="font-bold text-white">{approveConfirmData?.customer || approveConfirmData?.perusahaan}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Total Tagihan:</span>
              <span className="font-bold text-[#F4511E] text-sm">{formatCurrency(approveConfirmData?.amount)}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 font-sans">
            Dengan menyetujui faktur ini, status invoice akan resmi disahkan (APPROVED) dan Admin diperbolehkan untuk mencetak dokumen fisik untuk penandatanganan basah.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282E]">
            <Button size="sm" variant="ghost" onClick={() => setApproveConfirmData(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleConfirmApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Setujui Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Tolak Invoice (Stage 2) */}
      <Modal
        isOpen={Boolean(rejectModalData)}
        onClose={() => { setRejectModalData(null); setRejectionReason(''); }}
        title="Tolak Pengajuan Faktur Invoice"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#121417] rounded-xl border border-[#22262B] text-xs font-mono space-y-1">
            <div className="font-bold text-white">{rejectModalData?.kodeTransaksi}</div>
            <div className="text-neutral-400">{rejectModalData?.customer || rejectModalData?.perusahaan}</div>
          </div>

          <div>
            <label className="text-xs font-bold text-white block mb-1.5 font-mono">
              Alasan Penolakan:
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan invoice ini kepada Admin..."
              rows={3}
              className="w-full bg-[#121417] border border-[#282C32] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-rose-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282E]">
            <Button size="sm" variant="ghost" onClick={() => { setRejectModalData(null); setRejectionReason(''); }}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleConfirmReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              Tolak Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Verifikasi Dokumen Fisik & Sahkan LUNAS (Stage 5) */}
      <Modal
        isOpen={Boolean(verifyApproveModalData)}
        onClose={() => setVerifyApproveModalData(null)}
        title="Verifikasi Dokumen Fisik & Pengesahan LUNAS"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#121417] rounded-xl border border-[#22262B] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Invoice:</span>
              <span className="font-bold text-white">{verifyApproveModalData?.kodeTransaksi}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Customer:</span>
              <span className="font-bold text-white">{verifyApproveModalData?.customer || verifyApproveModalData?.perusahaan}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Nominal Pelunasan:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatCurrency(verifyApproveModalData?.amount)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-sans space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi Keabsahan Fisik Selesai</span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Dokumen fisik bertanda tangan dinyatakan valid. Status faktur akan secara permanen berubah menjadi <strong className="text-white">LUNAS (PAID)</strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282E]">
            <Button size="sm" variant="ghost" onClick={() => setVerifyApproveModalData(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleConfirmVerifyApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Sahkan Menjadi LUNAS
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Minta Revisi Dokumen Fisik (Stage 5) */}
      <Modal
        isOpen={Boolean(verifyRejectModalData)}
        onClose={() => { setVerifyRejectModalData(null); setVerifyRejectReason(''); }}
        title="Minta Revisi Dokumen Bertanda Tangan"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#121417] rounded-xl border border-[#22262B] text-xs font-mono space-y-1">
            <div className="font-bold text-white">{verifyRejectModalData?.kodeTransaksi}</div>
            <div className="text-neutral-400">{verifyRejectModalData?.customer || verifyRejectModalData?.perusahaan}</div>
          </div>

          <div>
            <label className="text-xs font-bold text-white block mb-1.5 font-mono">
              Alasan Penolakan / Permintaan Revisi:
            </label>
            <textarea
              value={verifyRejectReason}
              onChange={(e) => setVerifyRejectReason(e.target.value)}
              placeholder="Contoh: Tanda tangan stempel customer buram / kurang paraf..."
              rows={3}
              className="w-full bg-[#121417] border border-[#282C32] rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-rose-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282E]">
            <Button size="sm" variant="ghost" onClick={() => { setVerifyRejectModalData(null); setVerifyRejectReason(''); }}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleConfirmVerifyReject}
              disabled={isSubmitting || !verifyRejectReason.trim()}
            >
              Minta Revisi ke Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 5: Batch Approve Confirmation */}
      <Modal
        isOpen={batchApproveModalOpen}
        onClose={() => setBatchApproveModalOpen(false)}
        title="Persetujuan Massal (Batch Approval)"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-neutral-300">
            Anda akan menyetujui sekaligus <strong className="text-white font-mono">{selectedIds.size}</strong> invoice yang dipilih.
            Sistem akan secara otomatis menjalankan otorisasi sesuai status masing-masing transaksi (Approval administratif atau Verifikasi berkas fisik).
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282E]">
            <Button size="sm" variant="ghost" onClick={() => setBatchApproveModalOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleBatchApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Eksekusi Setujui Semua
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 6: Print Modal */}
      {printModalItem && (
        <InvoicePrintModal
          isOpen={Boolean(printModalItem)}
          onClose={() => setPrintModalItem(null)}
          invoiceItem={printModalItem}
        />
      )}

      {/* Modal 7: Detail Workflow Modal */}
      {workflowModalItem && (
        <InvoiceDetailWorkflowModal
          isOpen={Boolean(workflowModalItem)}
          onClose={() => setWorkflowModalItem(null)}
          invoiceItem={workflowModalItem}
          initialTab={workflowModalTab}
          onOpenPrintModal={() => {
            const item = workflowModalItem;
            setWorkflowModalItem(null);
            setPrintModalItem(item);
          }}
          onInvoiceUpdated={fetchInvoices}
        />
      )}
    </div>
  );
}
