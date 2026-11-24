import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  Printer,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import InvoicePrintModal from '../../components/invoice/InvoicePrintModal';
import InvoiceDetailWorkflowModal from '../../components/invoice/InvoiceDetailWorkflowModal';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    icon: Clock
  },
  pending_approval: {
    label: 'Menunggu Approval',
    bg: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    icon: Clock
  },
  approved: {
    label: 'Disetujui (Siap Cetak)',
    bg: 'bg-blue-950/40 text-blue-400 border-blue-800/50',
    icon: FileCheck
  },
  rejected: {
    label: 'Ditolak',
    bg: 'bg-rose-950/40 text-rose-400 border-rose-800/50',
    icon: XCircle
  },
  pending_verification: {
    label: 'Verifikasi TTD',
    bg: 'bg-purple-950/40 text-purple-400 border-purple-800/50',
    icon: ShieldCheck
  },
  revision_required: {
    label: 'Revisi Berkas',
    bg: 'bg-orange-950/40 text-orange-400 border-orange-800/50',
    icon: AlertTriangle
  },
  paid: {
    label: 'LUNAS',
    bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    icon: CheckCircle2
  }
};

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function InvoicePage() {
  const { user } = useAuth();
  const {
    invoiceList,
    fetchInvoices,
    fetchAvailableOrdersForInvoice,
    createInvoice
  } = useData();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Available completed orders for Invoice creation
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');
  const [createErrorMsg, setCreateErrorMsg] = useState('');

  // Invoice creation form state
  const [formData, setFormData] = useState({
    ppnPercent: 11,
    pphType: '2%', // '2%' or '2.65%' or 'none'
    bankName: 'BCA (Bank Central Asia)',
    bankAccount: '822-091-8888',
    accountName: 'PT BINTANG ANUGERAH SEJAHTERA',
    tempoHari: 14,
    notes: ''
  });

  // Reload data
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (activeTab === 'create') {
      loadAvailableOrders();
    }
  }, [activeTab]);

  const loadAvailableOrders = async () => {
    setIsLoadingAvailable(true);
    try {
      const res = await fetchAvailableOrdersForInvoice();
      if (res.success) {
        setAvailableOrders(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load available orders:', err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const list = invoiceList || [];
    const totalCount = list.length;
    const pendingApprovalCount = list.filter(i => (i.status || '').toLowerCase() === 'pending_approval' || (i.status || '').toLowerCase() === 'menunggu_approval').length;
    const pendingVerifCount = list.filter(i => (i.status || '').toLowerCase() === 'pending_verification').length;
    const paidCount = list.filter(i => (i.status || '').toLowerCase() === 'paid' || i.statusBayar === 'Lunas').length;

    const totalNominal = list.reduce((sum, item) => sum + (Number(item.totalTagihan) || Number(item.nominal) || 0), 0);
    const paidNominal = list
      .filter(i => (i.status || '').toLowerCase() === 'paid' || i.statusBayar === 'Lunas')
      .reduce((sum, item) => sum + (Number(item.totalTagihan) || Number(item.nominal) || 0), 0);
    const outstandingNominal = totalNominal - paidNominal;

    return {
      totalCount,
      pendingApprovalCount,
      pendingVerifCount,
      paidCount,
      totalNominal,
      paidNominal,
      outstandingNominal
    };
  }, [invoiceList]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let result = invoiceList || [];

    if (statusFilter !== 'all') {
      result = result.filter(inv => {
        const s = (inv.status || 'draft').toLowerCase();
        if (statusFilter === 'pending_approval') {
          return s === 'pending_approval' || s === 'menunggu_approval';
        }
        if (statusFilter === 'paid') {
          return s === 'paid' || inv.statusBayar === 'Lunas';
        }
        return s === statusFilter.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inv => {
        return (
          (inv.nomorInvoice || '').toLowerCase().includes(q) ||
          (inv.customerName || inv.customer || '').toLowerCase().includes(q) ||
          (inv.nomorRO || '').toLowerCase().includes(q) ||
          (inv.poNumber || '').toLowerCase().includes(q) ||
          (inv.id || '').toLowerCase().includes(q)
        );
      });
    }

    // Sort newest first
    return [...result].sort((a, b) => new Date(b.createdAt || b.tanggal || 0) - new Date(a.createdAt || a.tanggal || 0));
  }, [invoiceList, statusFilter, searchQuery]);

  // Handle select order to invoice
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setCreateErrorMsg('');
    setCreateSuccessMsg('');
  };

  // Calculations for create form
  const formCalculations = useMemo(() => {
    if (!selectedOrder) return { dpp: 0, ppn: 0, pph: 0, netTotal: 0 };
    const vol = Number(selectedOrder.totalVolume) || 0;
    const price = Number(selectedOrder.hargaSatuan) || 0;
    const dpp = vol * price;
    const ppnRate = formData.ppnPercent / 100;
    const ppn = Math.round(dpp * ppnRate);

    let pphRate = 0;
    if (formData.pphType === '2%') pphRate = 0.02;
    if (formData.pphType === '2.65%') pphRate = 0.0265;
    const pph = Math.round(dpp * pphRate);

    const netTotal = dpp + ppn - pph;

    return { dpp, ppn, pph, netTotal };
  }, [selectedOrder, formData]);

  // Handle submit create invoice
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      setCreateErrorMsg('Pilih Order/Jurnal yang telah selesai terlebih dahulu.');
      return;
    }

    setCreateSubmitting(true);
    setCreateErrorMsg('');
    setCreateSuccessMsg('');

    try {
      const payload = {
        jurnalId: selectedOrder.jurnalId,
        preOrderId: selectedOrder.preOrderId,
        nomorRO: selectedOrder.nomorRO,
        poNumber: selectedOrder.poNumber,
        customerName: selectedOrder.customerName,
        customerAddress: selectedOrder.customerAddress,
        customerNpwp: selectedOrder.customerNpwp,
        material: selectedOrder.material,
        volume: Number(selectedOrder.totalVolume) || 0,
        hargaSatuan: Number(selectedOrder.hargaSatuan) || 0,
        dpp: formCalculations.dpp,
        ppn: formCalculations.ppn,
        pph: formCalculations.pph,
        ppnPercent: formData.ppnPercent,
        pphPercent: formData.pphType === '2%' ? 2 : formData.pphType === '2.65%' ? 2.65 : 0,
        totalTagihan: formCalculations.netTotal,
        tempoHari: Number(formData.tempoHari) || 14,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        accountName: formData.accountName,
        notes: formData.notes
      };

      const res = await createInvoice(payload);
      if (res.success) {
        setCreateSuccessMsg(`Faktur Invoice #${res.data?.nomorInvoice || ''} berhasil dibuat dan otomatis dikunci menunggu Approval Superadmin.`);
        setSelectedOrder(null);
        await fetchInvoices();
        setTimeout(() => {
          setActiveTab('list');
          setCreateSuccessMsg('');
        }, 1800);
      } else {
        setCreateErrorMsg(res.message || 'Gagal membuat invoice.');
      }
    } catch (err) {
      setCreateErrorMsg(err.message || 'Terjadi kesalahan sistem saat membuat invoice.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openDetailModal = (invoice) => {
    setSelectedInvoiceForModal(invoice);
    setIsDetailModalOpen(true);
  };

  const openPrintModal = (invoice) => {
    setSelectedInvoiceForPrint(invoice);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22262B] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F4511E]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Faktur Invoice Pelanggan
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1D21] border border-[#2A2E35] text-zinc-400 font-mono">
                  B2B Billing Workflow
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Penerbitan tagihan penagihan material, persetujuan bertingkat, verifikasi berkas tanda tangan fisik & pelunasan.
              </p>
            </div>
          </div>
        </div>

        {/* TOP CONTROLS & TABS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchInvoices();
              if (activeTab === 'create') loadAvailableOrders();
            }}
            className="p-2.5 rounded-lg bg-[#14171A] border border-[#22262B] text-zinc-400 hover:text-white hover:border-[#33383F] transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex bg-[#121417] p-1 rounded-xl border border-[#22262B]">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-[#F4511E] text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Daftar Invoice
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[11px] font-mono">
                {invoiceList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-[#F4511E] text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              Buat Invoice Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS - Visual style matching BKK Page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#121417] border border-[#22262B] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span>Total Tagihan Diterbitkan</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatRupiah(stats.totalNominal)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Total: {stats.totalCount} Faktur</span>
            <span className="text-emerald-400/90 font-mono">Lunas: {stats.paidCount}</span>
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262B] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span>Outstanding (Piutang)</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4511E] tracking-tight">
            {formatRupiah(stats.outstandingNominal)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Terbayar: {formatRupiah(stats.paidNominal)}</span>
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262B] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span>Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {stats.pendingApprovalCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Perlu persetujuan Superadmin sebelum cetak
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262B] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span>Verifikasi Dokumen Fisik</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {stats.pendingVerifCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Berkas TTD fisik terunggah menunggu cek
          </div>
        </div>
      </div>

      {/* TAB CONTENT: DAFTAR INVOICE */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-[#121417] border border-[#22262B] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor invoice, nama pelanggan, nomor RO, nomor PO..."
                className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#F4511E] transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-zinc-500 whitespace-nowrap pl-1">Status:</span>
              {[
                { key: 'all', label: 'Semua' },
                { key: 'pending_approval', label: 'Menunggu Approval' },
                { key: 'approved', label: 'Siap Cetak' },
                { key: 'pending_verification', label: 'Verifikasi TTD' },
                { key: 'revision_required', label: 'Perlu Revisi' },
                { key: 'paid', label: 'Lunas' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === f.key
                      ? 'bg-[#F4511E]/15 border border-[#F4511E] text-white'
                      : 'bg-[#181B1F] border border-[#2A2E35] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* INVOICE CARDS LIST - Matching BkkCard styling with high emphasis on amount, code, customer */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-[#121417] border border-[#22262B] rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-zinc-300">Tidak ada faktur invoice ditemukan</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.'
                  : 'Belum ada faktur yang diterbitkan. Anda dapat membuat invoice dari Order / Jurnal yang telah selesai 100%.'}
              </p>
              {statusFilter === 'all' && !searchQuery && (
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-medium transition-all"
                >
                  <Plus className="w-4 h-4" /> Buat Invoice Baru
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredInvoices.map((inv) => {
                const normalizedStatus = (inv.status || 'draft').toLowerCase();
                const statusMeta = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
                const StatusIcon = statusMeta.icon;
                const isApprovedOrBeyond = ['approved', 'pending_verification', 'revision_required', 'paid'].includes(normalizedStatus);
                const isPaid = normalizedStatus === 'paid' || inv.statusBayar === 'Lunas';

                return (
                  <div
                    key={inv.id || inv.nomorInvoice}
                    className="bg-[#121417] border border-[#22262B] hover:border-[#32373E] rounded-xl p-4 sm:p-5 transition-all relative overflow-hidden group"
                  >
                    {/* Left Accent indicator */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isPaid
                          ? 'bg-emerald-500'
                          : normalizedStatus === 'pending_approval' || normalizedStatus === 'menunggu_approval'
                          ? 'bg-amber-500'
                          : normalizedStatus === 'pending_verification'
                          ? 'bg-purple-500'
                          : normalizedStatus === 'revision_required'
                          ? 'bg-rose-500'
                          : normalizedStatus === 'approved'
                          ? 'bg-blue-500'
                          : 'bg-zinc-600'
                      }`}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Invoice Identity & Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-mono text-sm sm:text-base font-bold text-white bg-[#1A1D21] px-2.5 py-0.5 rounded border border-[#2A2E35]">
                            {inv.nomorInvoice}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.bg}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusMeta.label}
                          </span>
                          {inv.hasSignedDocument && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40">
                              <ShieldCheck className="w-3 h-3" /> TTD Fisik Ada
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-300">
                          <div className="flex items-center gap-1.5 font-medium text-white">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-zinc-100">{inv.customerName || inv.customer || 'Pelanggan'}</span>
                          </div>
                          <div className="text-zinc-500">•</div>
                          <div className="text-zinc-400">
                            RO: <span className="font-mono text-zinc-300">{inv.nomorRO || '-'}</span>
                          </div>
                          {inv.poNumber && (
                            <>
                              <div className="text-zinc-500">•</div>
                              <div className="text-zinc-400">
                                PO: <span className="font-mono text-zinc-300">{inv.poNumber}</span>
                              </div>
                            </>
                          )}
                          <div className="text-zinc-500">•</div>
                          <div className="text-zinc-400">
                            Vol: <span className="font-mono text-zinc-300">{inv.volume || inv.totalVolume || 0} m³</span>
                          </div>
                        </div>

                        {/* Tax breakdown chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
                          <span className="bg-[#181B1F] px-2 py-0.5 rounded border border-[#262A30] font-mono">
                            DPP: {formatRupiah(inv.dpp || (inv.volume * inv.hargaSatuan) || 0)}
                          </span>
                          <span className="bg-[#181B1F] px-2 py-0.5 rounded border border-[#262A30] font-mono">
                            PPN 11%: {formatRupiah(inv.ppn || 0)}
                          </span>
                          <span className="bg-[#181B1F] px-2 py-0.5 rounded border border-[#262A30] font-mono">
                            PPh: {formatRupiah(inv.pph || 0)}
                          </span>
                          <span className="text-zinc-500 text-[10px] ml-1">
                            Tgl: {new Date(inv.createdAt || inv.tanggal || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Net Amount (Major visual emphasis) & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 border-[#22262B] pt-3 lg:pt-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                            Nilai Bersih Tagihan (Net)
                          </div>
                          <div className="text-lg sm:text-2xl font-extrabold font-mono text-[#10B981] tracking-tight">
                            {formatRupiah(inv.totalTagihan || inv.nominal || 0)}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Status Bayar:{' '}
                            <span className={isPaid ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                              {isPaid ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Print Button (Only if approved by Superadmin) */}
                          <button
                            onClick={() => openPrintModal(inv)}
                            disabled={!isApprovedOrBeyond}
                            title={
                              isApprovedOrBeyond
                                ? 'Cetak Faktur Invoice Resmi'
                                : 'Faktur harus disetujui Superadmin terlebih dahulu sebelum dapat dicetak'
                            }
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isApprovedOrBeyond
                                ? 'bg-[#181B1F] hover:bg-[#20242A] border border-[#2E333B] text-zinc-200 hover:text-white'
                                : 'bg-[#15171A] border border-[#202327] text-zinc-600 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400" />
                            <span>Cetak</span>
                          </button>

                          {/* Workflow / Detail / Upload Modal */}
                          <button
                            type="button"
                            onClick={() => openDetailModal(inv)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-semibold shadow-md shadow-orange-500/10 transition-all cursor-pointer"
                            title="Buka rincian lengkap invoice & unggah berkas tanda tangan fisik"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BUAT INVOICE BARU (Manual Creation strictly after 100% completion) */}
      {activeTab === 'create' && (
        <div className="space-y-6 max-w-5xl">
          {/* Information Banner */}
          <div className="bg-[#121417] border border-[#22262B] p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-zinc-300">
              <span className="font-semibold text-white">Aturan Workflow Penerbitan Faktur Invoice:</span>
              <p className="text-zinc-400 text-xs mt-0.5">
                Sesuai SOP PT Bintang Anugerah Sejahtera, faktur tagihan hanya dapat diterbitkan apabila seluruh volume pengiriman pada Order / Jurnal telah tercapai 100% (Completed). Setelah invoice dibuat, status terkunci otomatis ke <span className="text-amber-400 font-mono">Menunggu Approval Superadmin</span> sebelum dapat dicetak dan ditandatangani.
              </p>
            </div>
          </div>

          {/* Messages */}
          {createSuccessMsg && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{createSuccessMsg}</span>
            </div>
          )}
          {createErrorMsg && (
            <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{createErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Step 1: Select Available Completed Order */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-[#F4511E] text-white flex items-center justify-center text-[10px]">1</span>
                  Pilih Order Selesai 100%
                </label>
                <button
                  type="button"
                  onClick={loadAvailableOrders}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {isLoadingAvailable ? (
                <div className="bg-[#121417] border border-[#22262B] p-8 rounded-xl text-center text-zinc-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-400" />
                  Memeriksa order & jurnal pengiriman yang telah selesai...
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="bg-[#121417] border border-[#22262B] p-6 rounded-xl text-center text-zinc-400 text-xs">
                  <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <div className="font-medium text-zinc-300">Tidak ada order yang siap ditagihkan</div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Semua order selesai sudah memiliki faktur invoice, atau belum ada order yang mencapai 100% pengiriman trip.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {availableOrders.map((ord) => {
                    const isSelected = selectedOrder?.jurnalId === ord.jurnalId && selectedOrder?.nomorRO === ord.nomorRO;
                    return (
                      <div
                        key={`${ord.jurnalId}-${ord.nomorRO}`}
                        onClick={() => handleSelectOrder(ord)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#F4511E]/10 border-[#F4511E] shadow-md shadow-orange-500/10'
                            : 'bg-[#121417] border-[#22262B] hover:border-[#333840]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-white bg-[#1A1D21] px-2 py-0.5 rounded border border-[#2A2E35]">
                            RO: {ord.nomorRO}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            100% Completed
                          </span>
                        </div>
                        <div className="font-medium text-xs text-zinc-200 truncate">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-1">
                          <span>{ord.material}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-300">{ord.totalVolume} m³</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-300">{formatRupiah(ord.hargaSatuan)}/m³</span>
                        </div>
                        {ord.poNumber && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-1">
                            PO: {ord.poNumber}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Invoice Creation Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleCreateSubmit} className="bg-[#121417] border border-[#22262B] rounded-xl p-5 space-y-4">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-[#F4511E] text-white flex items-center justify-center text-[10px]">2</span>
                  Rincian Penagihan & Pajak
                </label>

                {!selectedOrder ? (
                  <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-[#2A2E35] rounded-xl">
                    Silakan pilih salah satu Order yang siap ditagihkan di panel sebelah kiri.
                  </div>
                ) : (
                  <>
                    {/* Selected Order Summary Card */}
                    <div className="bg-[#181B1F] border border-[#2A2E35] p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Pelanggan:</span>
                        <span className="font-semibold text-white">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Nomor RO / PO:</span>
                        <span className="font-mono text-zinc-200">{selectedOrder.nomorRO} {selectedOrder.poNumber ? `(${selectedOrder.poNumber})` : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Material & Volume:</span>
                        <span className="font-medium text-zinc-200">{selectedOrder.material} — {selectedOrder.totalVolume} m³</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Harga Satuan:</span>
                        <span className="font-mono text-zinc-200">{formatRupiah(selectedOrder.hargaSatuan)} / m³</span>
                      </div>
                    </div>

                    {/* Tax Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tarif PPN (%)</label>
                        <select
                          value={formData.ppnPercent}
                          onChange={(e) => setFormData({ ...formData, ppnPercent: Number(e.target.value) })}
                          className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#F4511E]"
                        >
                          <option value={11}>PPN 11% (Standar UU HPP)</option>
                          <option value={12}>PPN 12%</option>
                          <option value={0}>0% (Bebas PPN / Non-PKP)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tarif PPh 23 (%)</label>
                        <select
                          value={formData.pphType}
                          onChange={(e) => setFormData({ ...formData, pphType: e.target.value })}
                          className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#F4511E]"
                        >
                          <option value="2%">PPh 23 (2% - Ber-NPWP)</option>
                          <option value="2.65%">PPh 23 (2.65% - Khusus)</option>
                          <option value="none">0% (Tanpa Potongan PPh)</option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date & Bank Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Jatuh Tempo (Hari)</label>
                        <input
                          type="number"
                          value={formData.tempoHari}
                          onChange={(e) => setFormData({ ...formData, tempoHari: e.target.value })}
                          className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#F4511E]"
                          min="1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1">Rekening Pembayaran PT BAS</label>
                        <input
                          type="text"
                          value={formData.bankAccount}
                          onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                          className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#F4511E]"
                        />
                      </div>
                    </div>

                    {/* Calculated Amounts Breakdown */}
                    <div className="bg-[#16181C] border border-[#262A30] p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Dasar Pengenaan Pajak (DPP):</span>
                        <span className="font-mono text-zinc-200 font-semibold">{formatRupiah(formCalculations.dpp)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>PPN ({formData.ppnPercent}%):</span>
                        <span className="font-mono text-emerald-400">+ {formatRupiah(formCalculations.ppn)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>PPh ({formData.pphType}):</span>
                        <span className="font-mono text-rose-400">- {formatRupiah(formCalculations.pph)}</span>
                      </div>
                      <div className="border-t border-[#262A30] pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Total Bersih Ditagihkan (Net):</span>
                        <span className="text-lg font-bold font-mono text-[#10B981]">{formatRupiah(formCalculations.netTotal)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Catatan Tagihan (Opsional)</label>
                      <textarea
                        rows="2"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Contoh: Pembayaran mohon mencantumkan nomor invoice pada berita transfer..."
                        className="w-full bg-[#181B1F] border border-[#2A2E35] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#F4511E]"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 rounded-lg bg-[#181B1F] border border-[#2A2E35] text-xs font-medium text-zinc-400 hover:text-white"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={createSubmitting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F4511E] hover:bg-[#d84315] disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
                      >
                        {createSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menerbitkan Faktur...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Terbitkan Faktur & Kunci Approval</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & WORKFLOW STEPPER */}
      {isDetailModalOpen && selectedInvoiceForModal && (
        <InvoiceDetailWorkflowModal
          isOpen={isDetailModalOpen}
          invoiceItem={selectedInvoiceForModal}
          invoice={selectedInvoiceForModal}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInvoiceForModal(null);
          }}
          onUpdated={() => {
            fetchInvoices();
          }}
          onInvoiceUpdated={() => {
            fetchInvoices();
          }}
          onOpenPrintModal={(inv) => {
            const target = inv || selectedInvoiceForModal;
            setIsDetailModalOpen(false);
            setSelectedInvoiceForPrint(target);
            setIsPrintModalOpen(true);
          }}
        />
      )}

      {/* MODAL: PRINT INVOICE A4 TEMPLATE */}
      {isPrintModalOpen && selectedInvoiceForPrint && (
        <InvoicePrintModal
          isOpen={isPrintModalOpen}
          invoiceItem={selectedInvoiceForPrint}
          invoice={selectedInvoiceForPrint}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedInvoiceForPrint(null);
          }}
        />
      )}
    </div>
  );
}
