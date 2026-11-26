import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

import {
  FileText,
  Search,
  Plus,
  RotateCw,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Building2,
  Calendar,
  ShieldCheck,
  Info,
  LayoutList,
  LayoutGrid,
  Filter,
  Sparkles,
  ArrowLeft,
  Layers,
  ChevronDown,
  Receipt,
} from 'lucide-react';
import { Button, Select } from '../../components/ui';
import InvoicePrintModal from '../../components/invoice/InvoicePrintModal';
import InvoiceDetailWorkflowModal from '../../components/invoice/InvoiceDetailWorkflowModal';

// ─────────────────────────────────────────────────────────────────────────────
// Format Currency Helper
// ─────────────────────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Helper (Matching BKK Pill Style)
// ─────────────────────────────────────────────────────────────────────────────
function getInvoiceStatusBadge(item) {
  const isV2 = item.version === 2 || item.isRevision === 1;
  const s = String(item.status || 'draft').toLowerCase();
  const isPaid = s === 'paid' || item.statusBayar === 'Lunas';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isV2 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold shrink-0" title={`Adendum revisi selisih pengiriman final (Parent: ${item.parentDocId || '-'})`}>
          <span>V2 ADENDUM</span>
        </span>
      )}
      {isPaid ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>LUNAS</span>
        </span>
      ) : s === 'pending_verification' ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F4511E]/15 text-orange-400 border border-[#F4511E]/30 text-[10px] font-mono font-bold shrink-0">
          <ShieldCheck className="w-3 h-3 text-orange-400" />
          <span>VERIFIKASI</span>
        </span>
      ) : s === 'revision_required' ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold shrink-0">
          <RotateCw className="w-3 h-3 text-rose-400" />
          <span>REVISI TTD</span>
        </span>
      ) : s === 'approved' ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold shrink-0">
          <Printer className="w-3 h-3 text-blue-400" />
          <span>SIAP CETAK</span>
        </span>
      ) : s === 'rejected' ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold shrink-0">
          <X className="w-3 h-3 text-rose-400" />
          <span>DITOLAK</span>
        </span>
      ) : s === 'pending_approval' || s === 'menunggu_approval' ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold shrink-0">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>APPROVAL</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono font-bold shrink-0">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>DRAFT</span>
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceCard (Balanced, Symmetrical Medium-Sized Layout matching CashOutCard)
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceCard({ inv, onInfo, onPrint, viewMode = 'list' }) {
  const normalizedStatus = (inv.status || 'draft').toLowerCase();
  const isApprovedOrBeyond = ['approved', 'pending_verification', 'revision_required', 'paid'].includes(normalizedStatus);
  const isPaid = normalizedStatus === 'paid' || inv.statusBayar === 'Lunas';
  const statusBadge = getInvoiceStatusBadge(inv);

  const docCode = inv.nomorInvoice || '-';
  const customerName = inv.customerName || inv.customer || '-';
  const volumeNum = Number(inv.volume ?? inv.totalVolume) || 0;
  const formattedVolume = volumeNum.toFixed(2);
  const satuan = 'm³';
  const material = (inv.material || 'SIRTU')
    .replace(/\s*\(Curah\)/i, '')
    .replace(/\s*\(Padat\)/i, '');

  const dateDisplay = inv.createdAt
    ? new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : inv.tanggal || '-';

  const amountNet = Number(inv.totalTagihan || inv.nominal || inv.amount) || 0;
  const amountFormatted = `IDR ${amountNet.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const dppVal = Number(inv.dpp || (volumeNum * (inv.hargaSatuan || 0))) || 0;
  const ppnVal = Number(inv.ppn) || 0;
  const pphVal = Number(inv.pph) || 0;

  // ── GRID VIEW CARD (Symmetrical, Equal-height, Clean proportions)
  if (viewMode === 'grid') {
    return (
      <div
        onClick={onInfo}
        className="rounded-xl border border-[#22262B] hover:border-[#383E48] bg-[#121417] hover:bg-[#15171B] p-4 transition-all duration-200 select-none cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
      >
        {/* Top Header: Code & Status */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#20242A]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="font-mono text-xs font-bold text-neutral-200 bg-[#181B1F] border border-[#282D34] px-2.5 py-1 rounded-md tracking-tight truncate"
              title={docCode}
            >
              {docCode}
            </span>
            {inv.parentDocId && (
              <span className="text-[10px] text-purple-400 font-mono truncate" title={`Adendum selisih dari: ${inv.parentDocId}`}>
                &rarr; Induk: {inv.parentDocId}
              </span>
            )}
            {inv.hasSignedDocument && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#181B1F] text-neutral-300 border border-[#282D34] shrink-0 w-fit"
                title="Berkas TTD Fisik Terunggah"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-[#F4511E]" />
                <span>TTD FISIK</span>
              </span>
            )}
          </div>
          <div className="shrink-0">{statusBadge}</div>
        </div>

        {/* Middle Body: Entity & Order Details */}
        <div className="py-3.5 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              Pelanggan (Customer)
            </span>
            <div
              className="font-bold text-sm text-white truncate group-hover:text-[#F4511E] transition-colors leading-snug mt-0.5"
              title={customerName}
            >
              {customerName}
            </div>
            {inv.customerAddress && (
              <div className="text-[11px] text-neutral-400 truncate mt-0.5" title={inv.customerAddress}>
                {inv.customerAddress}
              </div>
            )}
          </div>

          {/* Symmetrical 2x2 Specs Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
            <div className="bg-[#16191D] p-2 rounded-lg border border-[#22262B]">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Nomor RO</span>
              <span className="text-neutral-200 font-semibold truncate block mt-0.5" title={inv.nomorRO || '-'}>
                {inv.nomorRO || '-'}
              </span>
            </div>

            <div className="bg-[#16191D] p-2 rounded-lg border border-[#22262B]">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Volume</span>
              <span className="text-neutral-200 font-semibold truncate block mt-0.5" title={`${formattedVolume} ${satuan}`}>
                {formattedVolume} {satuan}
              </span>
            </div>

            <div className="bg-[#16191D] p-2 rounded-lg border border-[#22262B]">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Material</span>
              <span className="text-neutral-200 font-semibold truncate block mt-0.5 uppercase" title={material || 'SIRTU'}>
                {material || 'SIRTU'}
              </span>
            </div>

            <div className="bg-[#16191D] p-2 rounded-lg border border-[#22262B]">
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Tanggal</span>
              <span className="text-neutral-200 font-semibold truncate block mt-0.5" title={dateDisplay}>
                {dateDisplay}
              </span>
            </div>
          </div>

          {/* Tax summary chips (clean cohesive neutrals) */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-neutral-400 pt-1">
            <span className="bg-[#16191D] px-2 py-0.5 rounded border border-[#22262B] text-neutral-300">
              <span className="text-neutral-500">DPP:</span> {formatCurrency(dppVal)}
            </span>
            <span className="bg-[#16191D] px-2 py-0.5 rounded border border-[#22262B] text-neutral-300">
              <span className="text-neutral-500">PPN:</span> +{formatCurrency(ppnVal)}
            </span>
            <span className="bg-[#16191D] px-2 py-0.5 rounded border border-[#22262B] text-neutral-300">
              <span className="text-neutral-500">PPh:</span> -{formatCurrency(pphVal)}
            </span>
          </div>
        </div>

        {/* Bottom Footer: Amount & Actions */}
        <div className="pt-3 border-t border-[#20242A] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">
              Total Tagihan Net
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-white tracking-tight leading-none mt-1 truncate">
              {amountFormatted}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isApprovedOrBeyond) onPrint();
              }}
              disabled={!isApprovedOrBeyond}
              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isApprovedOrBeyond
                  ? 'bg-[#181B1E] hover:bg-[#252A30] border-[#2A2E35] hover:border-neutral-500 text-neutral-300 hover:text-white'
                  : 'bg-[#15171A] border-[#202327] text-neutral-600 cursor-not-allowed opacity-50'
              }`}
              title={isApprovedOrBeyond ? 'Cetak Faktur' : 'Perlu Approval Superadmin'}
            >
              <Printer className="w-3.5 h-3.5 text-[#F4511E]" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className="h-8 px-3 rounded-lg bg-[#181B1E] hover:bg-[#252A30] border border-[#2A2E35] hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rincian Faktur Invoice"
            >
              <Info className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Detail</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW CARD (Balanced Architectural 2-Column Layout)
  return (
    <div
      onClick={onInfo}
      className="rounded-xl border border-[#22262B] hover:border-[#383E48] bg-[#121417] hover:bg-[#15171B] p-4 transition-all duration-200 select-none cursor-pointer group shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Information & Specifications */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Row 1: Code + Status Badge + Date + Physical TTD */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-neutral-200 bg-[#181B1F] border border-[#282D34] px-2.5 py-1 rounded-md tracking-tight">
              {docCode}
            </span>
            {inv.parentDocId && (
              <span className="text-[10px] text-purple-400 font-mono" title={`Adendum selisih dari: ${inv.parentDocId}`}>
                (Induk: {inv.parentDocId})
              </span>
            )}
            {statusBadge}
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>{dateDisplay}</span>
            </span>
            {inv.hasSignedDocument && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#181B1F] text-neutral-300 border border-[#282D34]">
                <ShieldCheck className="w-3 h-3 text-[#F4511E]" />
                <span>TTD FISIK</span>
              </span>
            )}
          </div>

          {/* Row 2: Customer Name */}
          <div className="space-y-1">
            <h3
              className="font-bold text-sm sm:text-base text-white truncate max-w-xl group-hover:text-[#F4511E] transition-colors leading-snug"
              title={customerName}
            >
              {customerName}
            </h3>
            {inv.customerAddress && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate" title={inv.customerAddress}>{inv.customerAddress}</span>
              </div>
            )}
          </div>

          {/* Row 3: Standardized Badges for Order Specs (Matching BKK exactly) */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
              <span className="text-neutral-500">RO:</span>
              <strong className="text-white font-semibold">{inv.nomorRO || '-'}</strong>
            </span>

            {inv.poNumber && inv.poNumber !== '-' && (
              <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
                <span className="text-neutral-500">PO:</span>
                <strong className="text-white font-semibold">{inv.poNumber}</strong>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
              <span className="text-neutral-500">Vol:</span>
              <strong className="text-white font-semibold">{formattedVolume} {satuan}</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300 uppercase">
              <span className="text-neutral-500">Mat:</span>
              <strong className="text-white font-semibold">{material || 'SIRTU'}</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
              <span className="text-neutral-500">DPP:</span>
              <strong className="text-white font-semibold">{formatCurrency(dppVal)}</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
              <span className="text-neutral-500">PPN:</span>
              <strong className="text-white font-semibold">+{formatCurrency(ppnVal)}</strong>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-[#16191D] border border-[#24282E] px-2.5 py-0.5 rounded-md text-neutral-300">
              <span className="text-neutral-500">PPh:</span>
              <strong className="text-white font-semibold">-{formatCurrency(pphVal)}</strong>
            </span>
          </div>
        </div>

        {/* Right Section: Amount & Action Buttons (Architectural Separation) */}
        <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#20242A] lg:border-l lg:border-[#20242A] lg:pl-6 shrink-0">
          <div className="text-left lg:text-right">
            <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider block">
              Total Tagihan Net
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-white tracking-tight leading-none mt-1">
              {amountFormatted}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-1">
              Status:{' '}
              <span className="text-neutral-200 font-medium">
                {isPaid ? 'Lunas' : 'Belum Lunas'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isApprovedOrBeyond) onPrint();
              }}
              disabled={!isApprovedOrBeyond}
              className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isApprovedOrBeyond
                  ? 'bg-[#181B1E] hover:bg-[#252A30] border-[#2A2E35] hover:border-neutral-500 text-neutral-300 hover:text-white'
                  : 'bg-[#15171A] border-[#202327] text-neutral-600 cursor-not-allowed opacity-50'
              }`}
              title={isApprovedOrBeyond ? 'Cetak Faktur Invoice Resmi' : 'Perlu Approval Superadmin sebelum cetak'}
            >
              <Printer className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className="h-8 px-3 rounded-lg bg-[#181B1E] hover:bg-[#252A30] border border-[#2A2E35] hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rincian Faktur Invoice"
            >
              <Info className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Detail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoicePage Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function InvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    invoiceList,
    fetchInvoices,
    fetchAvailableOrdersForInvoice,
    createInvoice,
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab === 'create' || location.state?.fromRekapan) {
      return location.state?.activeTab || 'create';
    }
    return 'list';
  }); // 'list' | 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'VERIFIKASI' | 'REVISI' | 'LUNAS'
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('invoice_view_mode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('invoice_view_mode', mode);
    } catch {}
  };

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
    notes: '',
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
        const orders = res.data || [];
        setAvailableOrders(orders);
        const navOrder = location.state?.order;
        setSelectedOrder((prev) => {
          if (prev && orders.some((o) => o.jurnalId === prev.jurnalId && o.nomorRO === prev.nomorRO)) {
            return orders.find((o) => o.jurnalId === prev.jurnalId && o.nomorRO === prev.nomorRO);
          }
          if (navOrder) {
            const matchedNav = orders.find(
              (o) =>
                (navOrder.nomorRO && o.nomorRO === navOrder.nomorRO) ||
                (navOrder.preOrderId && o.preOrderId === navOrder.preOrderId) ||
                (navOrder.id && o.jurnalId === navOrder.id)
            );
            if (matchedNav) return matchedNav;
          }
          return orders[0] || null;
        });
      }
    } catch (err) {
      console.error('Failed to load available orders:', err);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  // Counts by status (matching BkkPage counts structure)
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let verification = 0;
    let revision = 0;
    let paid = 0;

    invoiceList.forEach((inv) => {
      const s = String(inv.status || '').toLowerCase();
      if (s === 'paid' || inv.statusBayar === 'Lunas') paid++;
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
      all: invoiceList.length,
    };
  }, [invoiceList]);

  // Filtered invoices (matching BkkPage filter logic)
  const filteredInvoices = useMemo(() => {
    return invoiceList
      .filter((inv) => {
        // Free text search
        const q = (searchQuery || '').toLowerCase().trim();
        const matchSearch =
          !q ||
          (inv.nomorInvoice && inv.nomorInvoice.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.customer && inv.customer.toLowerCase().includes(q)) ||
          (inv.nomorRO && inv.nomorRO.toLowerCase().includes(q)) ||
          (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
          (inv.id && inv.id.toLowerCase().includes(q)) ||
          (inv.material && inv.material.toLowerCase().includes(q));

        // Status filter
        const s = String(inv.status || '').toLowerCase();
        const isPaid = s === 'paid' || inv.statusBayar === 'Lunas';

        const matchStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'PENDING' && (s === 'pending_approval' || s === 'menunggu_approval')) ||
          (statusFilter === 'APPROVED' && s === 'approved') ||
          (statusFilter === 'VERIFIKASI' && s === 'pending_verification') ||
          (statusFilter === 'REVISI' && s === 'revision_required') ||
          (statusFilter === 'LUNAS' && isPaid);

        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.createdAt || b.tanggal || 0) - new Date(a.createdAt || a.tanggal || 0));
  }, [invoiceList, statusFilter, searchQuery]);

  const handleResetList = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    if (addToast) addToast('Filter daftar faktur berhasil di-reset', 'info');
  };

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
        poNumber: selectedOrder.poNumber || selectedOrder.poNomorPo,
        // Server resolves by 'customer' and 'perusahaan', not 'customerName'
        customer: selectedOrder.customerName,
        perusahaan: selectedOrder.customerName,
        customerName: selectedOrder.customerName,
        customerAddress: selectedOrder.customerAddress,
        customerNpwp: selectedOrder.customerNpwp,
        npwp: selectedOrder.customerNpwp,
        customerId: selectedOrder.customerId,
        material: selectedOrder.material,
        volume: Number(selectedOrder.totalVolume) || 0,
        hargaSatuan: Number(selectedOrder.hargaSatuan) || 0,
        // Tax calculations
        subtotalJasa: formCalculations.dpp,
        dpp: formCalculations.dpp,
        isPpn: formData.ppnPercent > 0,
        tarifPpn: formData.ppnPercent,
        ppnNominal: formCalculations.ppn,
        ppn: formCalculations.ppn,
        tarifPph: formData.pphType === '2%' ? 2 : formData.pphType === '2.65%' ? 2.65 : 0,
        pphNominal: formCalculations.pph,
        pph: formCalculations.pph,
        ppnPercent: formData.ppnPercent,
        pphPercent: formData.pphType === '2%' ? 2 : formData.pphType === '2.65%' ? 2.65 : 0,
        totalTagihan: formCalculations.netTotal,
        amount: formCalculations.netTotal,
        tempoHari: Number(formData.tempoHari) || 14,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        accountName: formData.accountName,
        kirimKeRekening: `${formData.bankName} - ${formData.bankAccount} a/n ${formData.accountName}`,
        rekeningAtasNama: formData.accountName,
        notes: formData.notes,
      };

      const res = await createInvoice(payload);
      if (res.success) {
        setCreateSuccessMsg(
          `Faktur Invoice #${res.data?.nomorInvoice || ''} berhasil dibuat dan otomatis dikunci menunggu Approval Superadmin.`
        );
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
    <div className="space-y-4 w-full pb-32">
      {/* ── TOP HEADER WITH TAB SWITCHER (Identical to BKK Page) ── */}
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
              {activeTab === 'list' ? 'Data Invoice' : 'Buat Invoice Baru'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar tagihan material B2B, verifikasi berkas tanda tangan fisik & pelunasan'
                : 'Formulir penerbitan faktur invoice dari order selesai 100%'}
            </p>
          </div>
        </div>

        {/* Tab switcher: [Daftar Invoice (X)]  [+ Buat Invoice] */}
        <div className="flex items-center gap-1.5 bg-[#131517] p-1 rounded-md border border-[#24282C] self-start sm:self-auto">
          <Button
            size="xs"
            variant={activeTab === 'list' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('list')}
          >
            Daftar Invoice ({invoiceList.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Buat Invoice
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1 — DAFTAR INVOICE (List of Invoices - Visually Identical to BKK)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* ── Toolbar Row 1: count + icon buttons + viewMode ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredInvoices.length} Faktur Invoice
            </span>

            <div className="flex items-center gap-1">
              {/* Status cycle filter */}
              <button
                type="button"
                onClick={() =>
                  setStatusFilter((p) =>
                    p === 'ALL'
                      ? 'PENDING'
                      : p === 'PENDING'
                      ? 'APPROVED'
                      : p === 'APPROVED'
                      ? 'VERIFIKASI'
                      : p === 'VERIFIKASI'
                      ? 'REVISI'
                      : p === 'REVISI'
                      ? 'LUNAS'
                      : 'ALL'
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
                onClick={() => {
                  if (addToast) addToast('Pilih rentang tanggal faktur invoice', 'info');
                }}
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

              {/* View Mode Toggle: List / Grid */}
              <div className="flex items-center bg-[#131518] p-0.5 rounded-xl border border-[#25292E] gap-1 shadow-xs ml-1.5">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                  title="Tampilan List"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                  title="Tampilan Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Search Input (Full width, matching BKK design) ── */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nomor invoice, customer, nomor RO, nomor PO..."
              className="w-full bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
            />
            {searchQuery && (
              <X
                className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          {/* ── Status Chips (Identical to BKK Page) ── */}
          <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
              }`}
            >
              SEMUA ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>APPROVAL ({counts.pending})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'APPROVED'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'VERIFIKASI'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'REVISI'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'LUNAS'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LUNAS ({counts.paid})</span>
            </button>
          </div>

          {/* ── INVOICE CARDS CONTAINER (List or Grid) ── */}
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center bg-[#121417] border border-[#20242A] rounded-2xl space-y-3 font-mono">
              <FileText className="w-10 h-10 text-neutral-500 mx-auto" />
              <div className="text-sm text-neutral-300 font-bold">
                Tidak ada data Invoice yang sesuai filter
              </div>
              <p className="text-xs text-neutral-500">
                Coba reset filter atau buat faktur invoice baru.
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
                  Buat Invoice
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5'
                  : 'space-y-3'
              }
            >
              {filteredInvoices.map((inv) => (
                <InvoiceCard
                  key={inv.id || inv.nomorInvoice}
                  inv={inv}
                  onInfo={() => openDetailModal(inv)}
                  onPrint={() => openPrintModal(inv)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2 — BUAT INVOICE BARU (Clean, Balanced & Symmetrical 2-Column Console)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-4 max-w-5xl mx-auto">
          {/* Status Messages */}
          {createSuccessMsg && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 px-4 py-3 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{createSuccessMsg}</span>
            </div>
          )}
          {createErrorMsg && (
            <div className="bg-rose-950/40 border border-rose-800/60 px-4 py-3 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{createErrorMsg}</span>
            </div>
          )}

          {/* If No Available Orders */}
          {!isLoadingAvailable && availableOrders.length === 0 ? (
            <div className="max-w-md mx-auto py-12 px-6 bg-[#131518] border border-[#24282E] rounded-2xl text-center space-y-4 my-6">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Semua Order Telah Ditagihkan</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Tidak ada order selesai yang menunggu penerbitan invoice saat ini. Faktur baru dapat dibuat ketika ada pesanan yang mencapai 100% pengiriman.
                </p>
              </div>
              <Button size="xs" variant="outline" onClick={() => setActiveTab('list')}>
                Lihat Daftar Invoice
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* ── KOLOM 1: DATA PESANAN & PENGIRIMAN ── */}
                <div className="bg-[#131518] border border-[#24282E] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-4">
                    {/* Header Kolom 1 */}
                    <div className="pb-3 border-b border-[#22262B] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#F4511E]" />
                        <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          Sumber Pesanan (RO)
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          100% Selesai Kirim
                        </span>
                        <button
                          type="button"
                          onClick={loadAvailableOrders}
                          disabled={isLoadingAvailable}
                          className="w-6 h-6 rounded-md bg-[#181B1E] border border-[#2A2E35] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Refresh data order"
                        >
                          <RotateCw className={`w-3 h-3 ${isLoadingAvailable ? 'animate-spin text-[#F4511E]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Order Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-400">
                        Pilih Pesanan Selesai
                      </label>
                      <Select
                        value={selectedOrder ? `${selectedOrder.jurnalId}|${selectedOrder.nomorRO}` : ''}
                        disabled={isLoadingAvailable}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setSelectedOrder(null);
                            return;
                          }
                          const [jId, ro] = val.split('|');
                          const found = availableOrders.find((o) => o.jurnalId === jId && o.nomorRO === ro);
                          if (found) handleSelectOrder(found);
                        }}
                        searchPlaceholder="Cari nomor RO, customer, volume..."
                        className="rounded-xl text-xs font-medium bg-[#181B1E] border-[#2B3037] text-white"
                      >
                        <option value="">-- Pilih Pesanan Selesai --</option>
                        {availableOrders.map((ord) => (
                          <option key={`${ord.jurnalId}-${ord.nomorRO}`} value={`${ord.jurnalId}|${ord.nomorRO}`}>
                            {ord.nomorRO} • {ord.customerName} ({ord.totalVolume} m³)
                          </option>
                        ))}
                      </Select>

                      {/* Quick Pills if multiple orders */}
                      {availableOrders.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                          {availableOrders.map((ord) => {
                            const isSel = selectedOrder?.jurnalId === ord.jurnalId && selectedOrder?.nomorRO === ord.nomorRO;
                            return (
                              <button
                                key={`${ord.jurnalId}-${ord.nomorRO}`}
                                type="button"
                                onClick={() => handleSelectOrder(ord)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                                  isSel
                                    ? 'bg-[#F4511E]/15 border-[#F4511E] text-[#F4511E] font-bold'
                                    : 'bg-[#181B1E] border-[#2A2E35] text-neutral-400 hover:text-white'
                                }`}
                              >
                                {ord.nomorRO} ({ord.totalVolume} m³)
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Order Details Specification Sheet */}
                    {selectedOrder && (
                      <div className="space-y-2.5">
                        {/* Customer Card */}
                        <div className="p-3 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-1">
                          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                            Pelanggan (Customer)
                          </span>
                          <div className="text-xs font-bold text-white">{selectedOrder.customerName}</div>
                          {selectedOrder.customerNpwp && (
                            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 pt-0.5">
                              <span className="text-neutral-500">NPWP:</span>
                              <span>{selectedOrder.customerNpwp}</span>
                            </div>
                          )}
                          {selectedOrder.customerAddress && (
                            <div className="text-[11px] text-neutral-400 truncate">
                              {selectedOrder.customerAddress}
                            </div>
                          )}
                        </div>

                        {/* Specs 2x2 Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-0.5">
                            <span className="text-[10px] text-neutral-400 block">Nomor RO</span>
                            <div className="font-mono text-xs font-bold text-white truncate">
                              {selectedOrder.nomorRO}
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-0.5">
                            <span className="text-[10px] text-neutral-400 block">Nomor PO</span>
                            <div className="font-mono text-xs font-bold text-neutral-200 truncate">
                              {selectedOrder.poNumber || '-'}
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-0.5">
                            <span className="text-[10px] text-neutral-400 block">Material</span>
                            <div className="text-xs font-medium text-neutral-200 truncate">
                              {selectedOrder.material}
                            </div>
                          </div>
                          <div className="p-2.5 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-0.5">
                            <span className="text-[10px] text-neutral-400 block">Volume Terkirim</span>
                            <div className="font-mono text-xs font-bold text-white">
                              {selectedOrder.totalVolume} m³
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtotal DPP Bar at bottom of Left Card */}
                  {selectedOrder && (
                    <div className="p-3 bg-[#181B1E] border border-[#262A30] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-neutral-400">Harga Satuan</div>
                        <div className="font-mono text-xs text-neutral-300 font-semibold">
                          {formatCurrency(selectedOrder.hargaSatuan)} <span className="text-[10px] font-normal text-neutral-500">/ m³</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-400">Subtotal DPP</div>
                        <div className="font-mono text-sm font-bold text-[#F4511E]">
                          {formatCurrency(formCalculations.dpp)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── KOLOM 2: RINCIAN FAKTUR, PAJAK & PERHITUNGAN ── */}
                <div className="bg-[#131518] border border-[#24282E] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-3.5">
                    {/* Header Kolom 2 */}
                    <div className="pb-3 border-b border-[#22262B] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#F4511E]" />
                        <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          Rincian Faktur & Pajak
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">
                        Termin: {formData.tempoHari} Hari
                      </span>
                    </div>

                    {/* Tax Dropdowns (2 Cols) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Tarif PPN</label>
                        <select
                          value={formData.ppnPercent}
                          onChange={(e) => setFormData({ ...formData, ppnPercent: Number(e.target.value) })}
                          className="w-full bg-[#181B1E] border border-[#2B3037] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] cursor-pointer"
                        >
                          <option value={11}>11% (Standar)</option>
                          <option value={12}>12%</option>
                          <option value={0}>0% (Non-PPN)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-neutral-400">Tarif PPh 23</label>
                        <select
                          value={formData.pphType}
                          onChange={(e) => setFormData({ ...formData, pphType: e.target.value })}
                          className="w-full bg-[#181B1E] border border-[#2B3037] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] cursor-pointer"
                        >
                          <option value="2%">2% (Ber-NPWP)</option>
                          <option value="2.65%">2.65% (Khusus)</option>
                          <option value="none">0% (Tanpa PPh)</option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date & Bank Account (2 Cols) */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1 col-span-1">
                        <label className="text-[11px] font-medium text-neutral-400">Tempo (Hari)</label>
                        <input
                          type="number"
                          value={formData.tempoHari}
                          onChange={(e) => setFormData({ ...formData, tempoHari: e.target.value })}
                          min="1"
                          className="w-full bg-[#181B1E] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#F4511E]"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[11px] font-medium text-neutral-400">Rekening Tujuan</label>
                        <input
                          type="text"
                          value={formData.bankAccount}
                          onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                          className="w-full bg-[#181B1E] border border-[#2B3037] rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#F4511E]"
                        />
                      </div>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-400">Catatan Tagihan (Opsional)</label>
                      <input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Contoh: Berita transfer nomor invoice..."
                        className="w-full bg-[#181B1E] border border-[#2B3037] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E]"
                      />
                    </div>

                    {/* Net Calculation Summary */}
                    <div className="p-3.5 bg-[#181B1E] border border-[#262A30] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Dasar Pengenaan Pajak (DPP)</span>
                        <span className="font-mono text-neutral-200 font-semibold">
                          {formatCurrency(formCalculations.dpp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">PPN ({formData.ppnPercent}%)</span>
                        <span className="font-mono text-emerald-400 font-medium">
                          + {formatCurrency(formCalculations.ppn)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">PPh 23 ({formData.pphType})</span>
                        <span className="font-mono text-rose-400 font-medium">
                          - {formatCurrency(formCalculations.pph)}
                        </span>
                      </div>
                      <div className="border-t border-[#262A30] pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Total Tagihan (Net)
                        </span>
                        <span className="text-base font-bold font-mono text-white tracking-tight">
                          {formatCurrency(formCalculations.netTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2.5 rounded-xl bg-[#181B1E] border border-[#2B3037] text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={createSubmitting || !selectedOrder}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#d84315] disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      {createSubmitting ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menerbitkan...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terbitkan Faktur</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
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
