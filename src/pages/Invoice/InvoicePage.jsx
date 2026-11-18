import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Ticket,
  Calendar,
  Clock,
  RotateCw,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  X,
  Filter,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  ArrowUpDown,
  List,
  LayoutGrid,
  AlertTriangle,
  Receipt,
  FileText,
  TrendingUp,
  ShieldCheck,
  Check,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { TAX_RATES } from '../../utils/constants';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { groupInvoices, groupCheckState } from '../../utils/cashOutGrouping';
import { Button, Modal, Card, Input, Select, Badge } from '../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// LocalStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// IndeterminateCheckbox
// ─────────────────────────────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`w-4 h-4 rounded accent-[#F4511E] cursor-pointer ${className}`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ paid, small = false }) {
  const size = small ? 'px-1.5 py-px text-[9px]' : 'px-2.5 py-0.5 text-[10px]';
  if (paid) {
    return (
      <span className={`inline-block rounded-full font-bold font-mono tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ${size}`}>
        LUNAS
      </span>
    );
  }
  return (
    <span className={`inline-block rounded-full font-bold font-mono tracking-wide bg-[#F4511E]/20 text-[#F4511E] border border-[#F4511E]/30 ${size}`}>
      BELUM LUNAS
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceGroupHeader
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceGroupHeader({ group, expanded, onToggle, checkState, onGroupCheckChange }) {
  const { label, summary } = group;
  const isAll = checkState === 'all';
  const isSome = checkState === 'some';

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-[#1A1D22] border border-[#2A2E33] rounded-xl cursor-pointer select-none hover:bg-[#1E2228] transition-colors"
      onClick={onToggle}
    >
      {/* Checkbox pilih semua grup */}
      <div onClick={(e) => e.stopPropagation()}>
        <IndeterminateCheckbox
          checked={isAll}
          indeterminate={isSome}
          onChange={onGroupCheckChange}
        />
      </div>

      {/* Chevron */}
      <div className="shrink-0 text-neutral-500">
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>

      {/* Group label */}
      <span className="text-xs font-bold text-neutral-100 uppercase tracking-wide flex-1 truncate">
        {label}
      </span>

      {/* Summary badges */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        <span className="text-[10px] font-mono text-neutral-500 bg-[#131517] border border-[#2A2E33] rounded px-1.5 py-0.5">
          {summary.count} inv
        </span>
        {summary.unpaidCount > 0 && (
          <span className="text-[10px] font-mono text-[#F4511E] bg-[#F4511E]/10 border border-[#F4511E]/30 rounded px-1.5 py-0.5">
            {summary.unpaidCount} blm lunas
          </span>
        )}
        {summary.paidCount > 0 && (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5">
            {summary.paidCount} lunas
          </span>
        )}
        <span className="text-[10px] font-mono text-neutral-300 font-bold">
          {formatCurrency(summary.totalAmount)}
        </span>
        {summary.totalVolume !== null && (
          <span className="text-[10px] font-mono text-neutral-500">
            {summary.totalVolume.toFixed(2)} m³
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceRow (tabular row for list view)
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceRow({ item, isSelected, onSelect, onInfo, onDelete, isEven }) {
  const isPaid = item.statusBayar === 'Lunas';
  return (
    <tr
      className={`border-b border-[#24282C] transition-colors ${
        isEven ? 'bg-[#131517]' : 'bg-[#15181C]'
      } hover:bg-[#1C1F24] ${isSelected ? 'ring-1 ring-inset ring-[#F4511E]/40' : ''}`}
    >
      {/* Checkbox */}
      <td className="pl-3 pr-1 py-2.5 w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded accent-[#F4511E] cursor-pointer"
        />
      </td>

      {/* Tanggal */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-400 whitespace-nowrap">
        {item.timestamp ? item.timestamp.slice(0, 16) : '-'}
      </td>

      {/* No. Invoice */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-300 whitespace-nowrap">
        {item.kodeTransaksi}
      </td>

      {/* Material + Jenis */}
      <td className="px-3 py-2.5 text-[11px]">
        <div className="font-bold text-white">{item.material}</div>
        <div className="text-[9px] text-neutral-500 uppercase leading-tight">{item.jenis}</div>
      </td>

      {/* Volume */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-white text-right whitespace-nowrap">
        {item.volume.toFixed(2)} m³
      </td>

      {/* Total Tagihan (IDR) */}
      <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-white text-right whitespace-nowrap">
        {formatCurrency(item.amount)}
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <StatusBadge paid={isPaid} small />
      </td>

      {/* Periode */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-400 whitespace-nowrap">
        {item.periode}
      </td>

      {/* Aksi (Trash & Info) */}
      <td className="px-3 py-2.5 text-center whitespace-nowrap w-16">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDelete}
            className="text-rose-500/80 hover:text-rose-400 transition-colors cursor-pointer p-1"
            title="Hapus Invoice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onInfo}
            className="text-[#F4511E] hover:text-[#F4511E]/80 transition-colors cursor-pointer p-1"
            title="Detail Informasi"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceGridCard (compact card for grid view)
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceGridCard({ item, isSelected, onSelect, onInfo, onDelete }) {
  const isPaid = item.statusBayar === 'Lunas';
  return (
    <div
      className={`bg-[#15181C] border rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all hover:border-[#383E47] ${
        isSelected
          ? 'border-[#F4511E]/70 ring-1 ring-[#F4511E]/40 bg-[#1A1817]'
          : 'border-[#24282C]'
      }`}
    >
      {/* Top Header: Checkbox + Dokumen + Status + Aksi */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 rounded accent-[#F4511E] cursor-pointer shrink-0"
          />
          <span className="text-[11px] font-mono font-bold text-neutral-200 truncate" title={item.kodeTransaksi}>
            {item.kodeTransaksi}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge paid={isPaid} small />
          <button
            type="button"
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-[#1E2228] transition-colors cursor-pointer"
            title="Hapus Invoice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onInfo}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#F4511E] hover:bg-[#1E2228] transition-colors cursor-pointer"
            title="Detail Informasi"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle: Nominal & Volume */}
      <div className="flex items-baseline justify-between gap-2 py-1 border-y border-[#24282C]/70">
        <div>
          <span className="text-[10px] text-neutral-500 uppercase font-mono block">Tagihan</span>
          <span className="text-sm font-bold font-mono text-white">
            {formatCurrency(item.amount)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-neutral-500 uppercase font-mono block">Volume</span>
          <span className="text-xs font-bold font-mono text-white">
            {item.volume.toFixed(2)} m³
          </span>
        </div>
      </div>

      {/* Bottom: Material & Customer, Periode */}
      <div className="space-y-1 text-[10px] font-mono">
        <div className="flex items-center justify-between text-neutral-300">
          <span className="font-bold text-neutral-200">{item.material}</span>
          <span className="text-[9px] text-neutral-500 uppercase truncate max-w-[120px]">{item.jenis}</span>
        </div>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="truncate max-w-[150px]">{item.perusahaan}</span>
          <span className="text-neutral-500">{item.timestamp ? item.timestamp.slice(0, 10) : '-'}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceGroupedTable (full grouped-table view: supports 'list' and 'grid')
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceGroupedTable({
  groups,
  expandedGroups,
  onToggleGroup,
  selectedItems,
  onToggleSelect,
  onToggleGroupSelect,
  onInfo,
  onDelete,
  displayMode = 'list',
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500 text-xs">
        Tidak ada data Invoice yang ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const groupIds = group.items.map((i) => i.id);
        const checkState = groupCheckState(groupIds, selectedItems);

        return (
          <div key={group.key}>
            <InvoiceGroupHeader
              group={group}
              expanded={isExpanded}
              onToggle={() => onToggleGroup(group.key)}
              checkState={checkState}
              onGroupCheckChange={() => onToggleGroupSelect(group)}
            />

            {isExpanded && (
              displayMode === 'list' ? (
                <div className="mt-1 w-full overflow-hidden rounded-xl border border-[#24282C]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1A1D22] border-b border-[#2A2E33]">
                        <th className="pl-3 pr-1 py-2 w-8" />
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">Tanggal</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">No. Invoice</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Material</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-right whitespace-nowrap">Volume</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-right whitespace-nowrap">Total Tagihan (IDR)</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">Periode</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-center w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <InvoiceRow
                          key={item.id}
                          item={item}
                          isSelected={selectedItems.includes(item.id)}
                          isEven={idx % 2 === 0}
                          onSelect={() => onToggleSelect(item.id)}
                          onInfo={() => onInfo(item)}
                          onDelete={() => onDelete(item)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.items.map((item) => (
                    <InvoiceGridCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.includes(item.id)}
                      onSelect={() => onToggleSelect(item.id)}
                      onInfo={() => onInfo(item)}
                      onDelete={() => onDelete(item)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InvoicePage (main page component)
// ─────────────────────────────────────────────────────────────────────────────
export default function InvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    customers,
    bankAccounts,
    invoiceList,
    createInvoice,
    markInvoicePaid,
    deleteInvoice,
    preOrders,
    rekapanList,
    fetchMasterData,
  } = useData();
  const { addToast } = useToast();

  // ── Tab: 'list' | 'create'
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.fromRekapan || location.state?.activeTab === 'create') {
      return 'create';
    }
    return 'list';
  });

  // ── View preferences (persisted to localStorage)
  const [displayMode, setDisplayMode] = useState(() => lsGet('inv_displayMode', 'list')); // 'list' | 'grid'
  const [groupBy, setGroupBy] = useState(() => lsGet('inv_groupBy', 'company')); // 'company'|'status'|'material'|'month'
  const [sortOrder, setSortOrder] = useState(() => lsGet('inv_sortOrder', 'default')); // 'default'|'name'

  // Persist preferences
  useEffect(() => { lsSet('inv_displayMode', displayMode); }, [displayMode]);
  useEffect(() => { lsSet('inv_groupBy', groupBy); }, [groupBy]);
  useEffect(() => { lsSet('inv_sortOrder', sortOrder); }, [sortOrder]);

  // ── Search & Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ── Selection & Modals
  const [selectedItems, setSelectedItems] = useState([]);
  const [infoModalItem, setInfoModalItem] = useState(null);

  // ── Expanded groups (Set of group keys)
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // ── Form state for creating invoice (Integrated with Master Data & Orders)
  const [formCustomerId, setFormCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [formNomorRo, setFormNomorRo] = useState('');
  const [formPoNumber, setFormPoNumber] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formMaterialType, setFormMaterialType] = useState('Curah');
  const [formVolume, setFormVolume] = useState('');
  const [formHargaSatuan, setFormHargaSatuan] = useState('');
  const [formIsPpn, setFormIsPpn] = useState(true);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formWaktu, setFormWaktu] = useState('10:00');
  const [formKirimKeRekening, setFormKirimKeRekening] = useState('');
  const [filterHidden, setFilterHidden] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState(null);

  // Delete confirmation state (merged from user commit)
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState({ open: false, id: null, label: '', item: null });

  const handleAskDeleteInvoice = (id, label, item = null) => {
    setDeleteConfirmInvoice({ open: true, id, label, item });
  };

  const handleConfirmDeleteInvoice = () => {
    if (deleteConfirmInvoice.id) {
      deleteInvoice(deleteConfirmInvoice.id);
      setSelectedItems((prev) => prev.filter((i) => i !== deleteConfirmInvoice.id));
      setDeleteConfirmInvoice({ open: false, id: null, label: '', item: null });
      addToast('Faktur invoice berhasil dihapus', 'info');
    }
  };

  // Pre-fill from navigation state if coming from Rekapan / Orders
  useEffect(() => {
    if (location.state?.order) {
      const o = location.state.order;
      if (o.nomorRO) {
        setSearchFilter(o.nomorRO);
      }
      if (location.state.fromRekapan || location.state.activeTab === 'create') {
        setActiveTab('create');
        if (o.customer) {
          const cust = customers.find(
            (c) => c.name === o.customer || c.id === o.customerId
          );
          if (cust) setFormCustomerId(cust.id);
        }
        setSelectedOrderId(o.nomorRO || o.id || '');
        setFormNomorRo(o.nomorRO || o.id || '');
        setFormPoNumber(o.poNumber || '');
        setFormMaterial(o.material || '');
        const isCurah =
          !String(o.material || '').toUpperCase().includes('BOULDER') &&
          !String(o.material || '').toUpperCase().includes('BATU');
        setFormMaterialType(isCurah ? 'Curah' : 'Padat');
        const vol = Number(o.totalVolume || o.terkirim || o.targetVolume || o.totalOrder || 0);
        setFormVolume(vol > 0 ? vol : (Number(o.targetVolume || o.totalOrder) || ''));
        const price = Number(o.hargaJual || 50000);
        setFormHargaSatuan(price);
        setFormIsPpn(o.isPpn !== undefined ? Boolean(o.isPpn) : true);
      }
    }
  }, [location.state, customers]);

  // Ensure fresh master data and initial defaults on Create Tab
  useEffect(() => {
    if (activeTab === 'create') {
      if (customers.length === 0 || bankAccounts.length === 0) {
        fetchMasterData?.();
      }
      if (!formCustomerId && customers.length > 0) {
        setFormCustomerId(customers[0].id);
      }
      if (!formKirimKeRekening && bankAccounts.length > 0) {
        const firstAcc = bankAccounts[0];
        setFormKirimKeRekening(`${firstAcc.bank} - ${firstAcc.nomorRekening} a/n ${firstAcc.rekeningAtasNama}`);
      }
    }
  }, [activeTab, customers, bankAccounts, formCustomerId, formKirimKeRekening, fetchMasterData]);

  // Available orders for the selected customer / all approved orders
  const availableOrders = useMemo(() => {
    const list = [];
    const seen = new Set();

    (preOrders || [])
      .filter((p) => p.status === 'APPROVED' || p.status === 'DISETUJUI' || p.status === 'AKTIF')
      .forEach((p) => {
        const ro = p.nomorRO || p.id;
        if (!seen.has(ro)) {
          seen.add(ro);
          list.push({
            id: p.id,
            nomorRO: p.nomorRO,
            poNumber: p.nomorPo || p.nomorPoCustomer || p.poNumber || 'PO Pending',
            customer: p.customer,
            customerId: p.customerId,
            material: p.materialName || p.material,
            volume: Number(p.terkirim || p.totalOrder || 0),
            targetVolume: Number(p.totalOrder || 0),
            hargaJual: Number(p.hargaJual || 50000),
            satuan: p.satuan || 'm3',
            isPpn: p.jenisWajibPajak === 'PKP',
          });
        }
      });

    (rekapanList || []).forEach((r) => {
      const ro = r.nomorRO || r.id;
      if (!seen.has(ro)) {
        seen.add(ro);
        list.push({
          id: r.id,
          nomorRO: r.nomorRO,
          poNumber: r.poNumber,
          customer: r.customer,
          customerId: r.customerId,
          material: r.material,
          volume: Number(r.totalVolume || 0),
          targetVolume: Number(r.targetVolume || 0),
          hargaJual: Number(r.hargaJual || 50000),
          satuan: r.satuan || 'm3',
          isPpn: r.isPpn,
        });
      }
    });

    if (formCustomerId) {
      const targetCust = customers.find((c) => c.id === formCustomerId || c.name === formCustomerId);
      if (targetCust) {
        return list.filter(
          (o) =>
            o.customerId === targetCust.id ||
            o.customer?.toLowerCase() === targetCust.name?.toLowerCase()
        );
      }
    }

    return list;
  }, [preOrders, rekapanList, customers, formCustomerId]);

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setFormNomorRo('');
      setFormPoNumber('');
      setFormMaterial('');
      setFormVolume('');
      setFormHargaSatuan('');
      return;
    }
    const ord = availableOrders.find((o) => o.id === orderId || o.nomorRO === orderId);
    if (ord) {
      setFormNomorRo(ord.nomorRO || ord.id);
      setFormPoNumber(ord.poNumber || '');
      setFormMaterial(ord.material || 'SIRTU');
      const isCurah =
        !String(ord.material || '').toUpperCase().includes('BOULDER') &&
        !String(ord.material || '').toUpperCase().includes('BATU');
      setFormMaterialType(isCurah ? 'Curah' : 'Padat');
      const vol = Number(ord.volume > 0 ? ord.volume : (ord.targetVolume || 0));
      setFormVolume(vol > 0 ? vol : '');
      setFormHargaSatuan(Number(ord.hargaJual || 50000));
      setFormIsPpn(ord.isPpn !== undefined ? Boolean(ord.isPpn) : true);
      if (ord.customerId && !formCustomerId) {
        setFormCustomerId(ord.customerId);
      }
    }
  };

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === formCustomerId || c.name === formCustomerId),
    [customers, formCustomerId]
  );

  // Exact Tax calculations per Implementation Plan Section 2 (Aturan 28 - 31)
  const calculation = useMemo(() => {
    const vol = Number(formVolume) || 0;
    const unitPrice = Number(formHargaSatuan) || 0;
    const subtotal = Math.round(vol * unitPrice);
    const ppnNominal = formIsPpn ? Math.round((subtotal * TAX_RATES.PPN_PERCENT) / 100) : 0;
    const pphRate = formMaterialType === 'Curah' ? TAX_RATES.PPH_CURAH : TAX_RATES.PPH_PADAT;
    const pphNominal = Math.round((subtotal * pphRate) / 100);
    const totalTagihan = subtotal + ppnNominal - pphNominal;

    return {
      subtotal,
      ppnNominal,
      pphRate,
      pphNominal,
      totalTagihan,
    };
  }, [formVolume, formHargaSatuan, formIsPpn, formMaterialType]);

  // Handle Generate & Save Invoice
  const handleApply = async (e) => {
    e.preventDefault();
    const targetCust = selectedCustomer;
    const custName = targetCust?.name || 'PT CUSTOMER';

    if (!targetCust && !custName) {
      addToast('Pilih pelanggan terlebih dahulu', 'warning');
      return;
    }
    if (!formVolume || Number(formVolume) <= 0) {
      addToast('Volume tagihan harus lebih dari 0 m³', 'warning');
      return;
    }
    if (!formHargaSatuan || Number(formHargaSatuan) <= 0) {
      addToast('Harga satuan jual harus lebih dari Rp 0', 'warning');
      return;
    }

    const cleanPo = formPoNumber ? formPoNumber.trim() : 'PO';
    const cleanRo = formNomorRo ? formNomorRo.replace('RO-', '').replace(/[^a-zA-Z0-9]/g, '') : String(Date.now()).slice(-4);
    const invCode = `${cleanPo} - INV - ${cleanRo}`;

    const newInvData = {
      nomorInvoice: invCode,
      kodeTransaksi: invCode,
      nomorRO: formNomorRo || null,
      idReceivedOrder: formNomorRo || null,
      poNumber: formPoNumber || null,
      nomorPoCustomer: formPoNumber || null,
      customerId: targetCust?.id || null,
      pelanggan: custName,
      perusahaan: custName,
      customerAddress: targetCust?.address || '',
      material: formMaterial || 'SIRTU',
      materialName: formMaterial || 'SIRTU',
      materialType: formMaterialType,
      jenis: 'JASA ANGKUT + MATERIAL',
      volume: Number(formVolume),
      satuan: 'm3',
      hargaSatuan: Number(formHargaSatuan),
      subtotalJasa: calculation.subtotal,
      ppnNominal: calculation.ppnNominal,
      pphNominal: calculation.pphNominal,
      totalTagihan: calculation.totalTagihan,
      amount: calculation.totalTagihan,
      kirimKeRekening: formKirimKeRekening,
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      tanggal: formTanggal,
      waktu: formWaktu,
      periode: `Periode: [${formTanggal}]`,
      statusBayar: 'Belum Dibayar',
    };

    const saved = await createInvoice(newInvData);
    setLastCreatedInvoice(saved || newInvData);
    setInvoiceGenerated(true);
    addToast(`Faktur Invoice ${invCode} berhasil dibuat & disimpan ke database!`, 'success');
  };

  // Filtered Invoices for List View
  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((item) => {
      const q = searchFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.kodeTransaksi.toLowerCase().includes(q) ||
        item.perusahaan.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        (item.periode && item.periode.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'BELUM_BAYAR' && item.statusBayar !== 'Lunas') ||
        (statusFilter === 'LUNAS' && item.statusBayar === 'Lunas');

      return matchSearch && matchStatus;
    });
  }, [invoiceList, searchFilter, statusFilter]);

  // Grouped data (memoised)
  const groups = useMemo(
    () => groupInvoices(filteredInvoices, groupBy, sortOrder),
    [filteredInvoices, groupBy, sortOrder]
  );

  // Auto-expand groups when they change
  useEffect(() => {
    if (groups.length <= 10) {
      setExpandedGroups(new Set(groups.map((g) => g.key)));
    } else {
      setExpandedGroups(new Set(groups.length > 0 ? [groups[0].key] : []));
    }
  }, [groupBy, sortOrder]);

  // Handlers
  const handleReset = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setSelectedItems([]);
    addToast('Data filter berhasil di-reset', 'info');
  };

  const toggleSelect = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleToggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleToggleGroupSelect = useCallback((group) => {
    const ids = group.items.map((i) => i.id);
    const state = groupCheckState(ids, selectedItems);
    if (state === 'all') {
      setSelectedItems((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedItems((prev) => {
        const set = new Set(prev);
        ids.forEach((id) => set.add(id));
        return [...set];
      });
    }
  }, [selectedItems]);

  const handleExpandAll = () => {
    setExpandedGroups(new Set(groups.map((g) => g.key)));
  };
  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
  };

  const totalSelected = invoiceList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleBatchMarkPaid = () => {
    markInvoicePaid(selectedItems);
    setSelectedItems([]);
    addToast(`${selectedItems.length} Invoice berhasil dicatat LUNAS!`, 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 w-full pb-32">

      {/* ── TOP HEADER WITH TAB SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'create') {
                setActiveTab('list');
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
              {activeTab === 'list' ? 'Data Invoice' : 'Buat Invoice'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar faktur tagihan customer & piutang aktif'
                : 'Formulir pembuatan faktur pajak & tagihan resmi'}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
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
            Input Invoice
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1 — DAFTAR INVOICE (Matching Cash Out layout)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">

          {/* ── Toolbar Row 1: count + icon buttons ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredInvoices.length} Faktur Tagihan
            </span>

            <div className="flex items-center gap-1">
              {/* Status filter cycle */}
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

              {/* Date range */}
              <button
                type="button"
                onClick={() => addToast('Pilih rentang tanggal Invoice', 'info')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Rentang Tanggal"
              >
                <Calendar className="w-4 h-4" />
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Toolbar Row 2: grid/list toggle + group-by + sort + expand/collapse ── */}
          <div className="flex items-center gap-2 px-1 flex-wrap">
            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-[#1C1F24] border border-[#2A2E33] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  displayMode === 'list'
                    ? 'bg-[#F4511E] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Tampilan Tabel (List)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  displayMode === 'grid'
                    ? 'bg-[#F4511E] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Group By dropdown */}
            <div className="relative">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="bg-[#1C1F24] border border-[#2A2E33] rounded-lg pl-2.5 pr-7 py-1.5 text-[11px] text-neutral-300 focus:outline-none focus:border-[#F4511E] appearance-none cursor-pointer"
                title="Kelompokkan Berdasarkan"
              >
                <option value="company">Perusahaan</option>
                <option value="status">Status</option>
                <option value="material">Material</option>
                <option value="month">Bulan</option>
              </select>
              <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort order */}
            <button
              type="button"
              onClick={() => setSortOrder((p) => (p === 'default' ? 'name' : 'default'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                sortOrder === 'name'
                  ? 'bg-[#F4511E]/10 text-[#F4511E] border-[#F4511E]/30'
                  : 'bg-[#1C1F24] text-neutral-400 border-[#2A2E33] hover:text-white'
              }`}
              title={sortOrder === 'name' ? 'Urut: A–Z' : 'Urut: Prioritas'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'name' ? 'A–Z' : 'Prioritas'}</span>
            </button>

            {/* Expand / Collapse all */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer px-1.5"
                title="Buka Semua"
              >
                Buka semua
              </button>
              <span className="text-neutral-700 text-xs">|</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer px-1.5"
                title="Tutup Semua"
              >
                Tutup semua
              </button>
            </div>
          </div>

          {/* Search input — always visible */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Ketik nomor invoice, customer, material..."
              className="w-full bg-[#1C1F24] border border-[#2A2E33] focus:border-[#F4511E] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter chip */}
          {statusFilter !== 'ALL' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500">Filter aktif:</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border cursor-pointer ${
                  statusFilter === 'LUNAS'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-[#F4511E] bg-[#F4511E]/10 border-[#F4511E]/30'
                }`}
                onClick={() => setStatusFilter('ALL')}
                title="Klik untuk hapus filter"
              >
                {statusFilter === 'LUNAS' ? 'LUNAS' : 'BELUM LUNAS'} ✕
              </span>
            </div>
          )}

          {/* ── Main Grouped Table List ── */}
          <InvoiceGroupedTable
            groups={groups}
            expandedGroups={expandedGroups}
            onToggleGroup={handleToggleGroup}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelect}
            onToggleGroupSelect={handleToggleGroupSelect}
            onInfo={setInfoModalItem}
            onDelete={(item) => handleAskDeleteInvoice(item.id, item.kodeTransaksi, item)}
            displayMode={displayMode}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2 — INPUT INVOICE (Formulir Buat Invoice Terintegrasi)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <Card className="p-4 sm:p-6 border-[#24282C] bg-[#14171A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#202428]">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#F4511E]" />
                  Formulir Faktur Tagihan Invoice (Piutang Usaha)
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Pilih pelanggan dan tarik data pesanan RO resmi untuk mengkalkulasi tagihan dan pajak secara otomatis.
                </p>
              </div>

              {selectedOrderId && (
                <Badge variant="primary" size="xs">
                  <Check className="w-3 h-3 mr-1" />
                  Pesanan Terhubung ({selectedOrderId})
                </Badge>
              )}
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              {!filterHidden && (
                <>
                  {/* Step 1: Pilih Pelanggan & Rekening Tujuan PT BAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Select
                        label="Pilih Pelanggan (Customer)"
                        icon={User}
                        value={formCustomerId}
                        onChange={(e) => {
                          const newCustId = e.target.value;
                          setFormCustomerId(newCustId);
                          setSelectedOrderId('');
                          setFormNomorRo('');
                          setFormPoNumber('');
                          setFormMaterial('');
                          setFormVolume('');
                          setFormHargaSatuan('');
                        }}
                      >
                        <option value="">-- Pilih Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.alias ? `(${c.alias})` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Select
                        label="Kirim ke Rekening PT BAS"
                        icon={Building2}
                        value={formKirimKeRekening}
                        onChange={(e) => setFormKirimKeRekening(e.target.value)}
                      >
                        {bankAccounts.map((acc) => (
                          <option
                            key={acc.id}
                            value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}
                          >
                            {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  {selectedCustomer && (
                    <div className="p-3 bg-[#111315] rounded-lg border border-[#202428] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 font-mono text-xs">
                      <div className="space-y-0.5">
                        <div className="text-white font-bold flex items-center gap-2">
                          <span>{selectedCustomer.name}</span>
                          {selectedCustomer.alias && (
                            <span className="text-[10px] text-neutral-400 font-normal">
                              ({selectedCustomer.alias})
                            </span>
                          )}
                          <Badge size="xs" variant={selectedCustomer.isPpn ? 'primary' : 'neutral'}>
                            {selectedCustomer.isPpn ? 'PKP (PPN 11%)' : 'Non-PKP'}
                          </Badge>
                        </div>
                        <div className="text-neutral-400 text-[11px] flex items-center gap-3 flex-wrap">
                          {selectedCustomer.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-500" />
                              {selectedCustomer.address}
                            </span>
                          )}
                          {selectedCustomer.telepon && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-neutral-500" />
                              {selectedCustomer.telepon}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-400 text-right sm:self-center">
                        <div>NPWP: <strong className="text-white">{selectedCustomer.npwp || '-'}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Auto-Retrieve dari Pesanan / Nomor RO */}
                  <div>
                    <Select
                      label="Tarik Data dari Pesanan / Nomor RO (Auto-Retrieve)"
                      icon={Ticket}
                      value={selectedOrderId}
                      onChange={(e) => handleSelectOrder(e.target.value)}
                    >
                      <option value="">-- Pilih Pesanan / RO untuk Mengisi Otomatis --</option>
                      {availableOrders.map((ord) => (
                        <option key={ord.id || ord.nomorRO} value={ord.nomorRO || ord.id}>
                          [{ord.nomorRO || ord.id}] {ord.material} • PO: {ord.poNumber || 'DRAFT'} ({ord.volume || ord.targetVolume} m³)
                        </option>
                      ))}
                    </Select>
                    <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                      * Memilih pesanan akan otomatis mengisi nomor RO, nomor PO, material, volume realisasi, dan harga jual customer.
                    </p>
                  </div>

                  {/* Step 3: Nomor Referensi Dokumen & Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Input
                      label="Nomor RO Resmi"
                      icon={Ticket}
                      value={formNomorRo}
                      onChange={(e) => setFormNomorRo(e.target.value)}
                      placeholder="RO-202611-0001"
                      className="font-mono text-white"
                    />

                    <Input
                      label="Nomor PO Customer"
                      icon={Ticket}
                      value={formPoNumber}
                      onChange={(e) => setFormPoNumber(e.target.value)}
                      placeholder="PO-LW-2026-089"
                      className="font-mono text-white"
                    />

                    <Input
                      label="Tanggal Invoice"
                      icon={Calendar}
                      type="date"
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                    />

                    <Input
                      label="Waktu"
                      icon={Clock}
                      type="time"
                      value={formWaktu}
                      onChange={(e) => setFormWaktu(e.target.value)}
                    />
                  </div>

                  {/* Step 4: Spesifikasi Material & Perpajakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Nama Material"
                      icon={Package}
                      value={formMaterial}
                      onChange={(e) => setFormMaterial(e.target.value)}
                      placeholder="SIRTU / BASE COURSE"
                    />

                    <Select
                      label="Kategori Material"
                      value={formMaterialType}
                      onChange={(e) => setFormMaterialType(e.target.value)}
                    >
                      <option value="Curah">Curah (PPh 23: 2.0%)</option>
                      <option value="Padat">Padat (PPh 23: 2.65%)</option>
                    </Select>

                    <Select
                      label="Perpajakan PPN"
                      value={formIsPpn ? 'ppn' : 'non-ppn'}
                      onChange={(e) => setFormIsPpn(e.target.value === 'ppn')}
                    >
                      <option value="ppn">PKP (PPN 11%)</option>
                      <option value="non-ppn">Non-PPN (0%)</option>
                    </Select>
                  </div>

                  {/* Step 5: Volume & Harga Satuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#111315] rounded-lg border border-[#202428]">
                    <Input
                      label="Volume Tagihan (m³)"
                      type="number"
                      placeholder="0"
                      value={formVolume}
                      onChange={(e) => setFormVolume(e.target.value)}
                      className="font-mono text-amber-400 font-bold"
                    />

                    <Input
                      label="Harga Satuan Jual (IDR/m³)"
                      type="number"
                      placeholder="0"
                      value={formHargaSatuan}
                      onChange={(e) => setFormHargaSatuan(e.target.value)}
                      className="font-mono text-white font-bold"
                    />

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Subtotal Dasar
                      </label>
                      <div className="w-full bg-[#181B1E] border border-[#262A2E] rounded-md px-3 py-2 text-sm font-mono font-bold text-white">
                        {formatCurrency(calculation.subtotal)}
                      </div>
                    </div>
                  </div>

                  {/* Kotak Ringkasan Perhitungan Resmi PT BAS */}
                  <div className="bg-[#111315] p-4 rounded-lg border border-[#262A2E] space-y-2.5 font-mono text-xs max-w-md ml-auto">
                    <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider pb-1 border-b border-[#202428] flex justify-between">
                      <span>Rincian Tagihan &amp; Pajak</span>
                      <span className="text-[#F4511E]">PT BAS Official</span>
                    </div>

                    <div className="flex justify-between py-1 text-neutral-300">
                      <span>Subtotal Jasa &amp; Material:</span>
                      <strong className="text-white">{formatCurrency(calculation.subtotal)}</strong>
                    </div>

                    <div className="flex justify-between py-1 text-neutral-300">
                      <span>PPN 11% (Pasal 22):</span>
                      <strong className={formIsPpn ? 'text-emerald-400' : 'text-neutral-500'}>
                        +{formatCurrency(calculation.ppnNominal)}
                      </strong>
                    </div>

                    <div className="flex justify-between py-1 text-neutral-300">
                      <span>PPh 23 ({calculation.pphRate}%):</span>
                      <strong className="text-[#F4511E]">
                        -{formatCurrency(calculation.pphNominal)}
                      </strong>
                    </div>

                    <div className="pt-2.5 border-t border-[#262A2E] flex justify-between items-baseline">
                      <span className="font-bold text-white text-xs">Total Bersih Tagihan:</span>
                      <span className="text-base sm:text-lg font-bold text-[#F4511E]">
                        {formatCurrency(calculation.totalTagihan)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 bg-[#F4511E] hover:bg-[#ff6b3d] text-white uppercase font-bold tracking-wider py-2.5 cursor-pointer"
                >
                  TERAPKAN &amp; SIMPAN INVOICE
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setSelectedOrderId('');
                    setFormNomorRo('');
                    setFormPoNumber('');
                    setFormMaterial('');
                    setFormVolume('');
                    setFormHargaSatuan('');
                    setInvoiceGenerated(false);
                    addToast('Formulir di-reset', 'info');
                  }}
                  className="cursor-pointer"
                >
                  Reset Form
                </Button>
              </div>

              {/* Toggle Collapse */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setFilterHidden(!filterHidden)}
                  className="text-[11px] text-neutral-400 hover:text-white inline-flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  {filterHidden ? 'Tampilkan Formulir' : 'Sembunyikan Formulir'}
                  {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </Card>

          {/* Generated Enterprise Invoice Sheet Preview */}
          {invoiceGenerated && (
            <Card className="p-5 sm:p-6 space-y-4 border-[#24282C] bg-[#14171A]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#24282C]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F4511E] block">
                    PT BERKAH ALAM SEMESTA • FAKTUR TAGIHAN RESMI
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                    {lastCreatedInvoice?.kodeTransaksi || `${formPoNumber || 'PO'} - INV - ${formNomorRo || '0001'}`}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Customer: <strong className="text-white">{selectedCustomer?.name || 'Customer'}</strong> | PO:{' '}
                    {formPoNumber || '-'} | RO: {formNomorRo || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('list')}
                    className="cursor-pointer"
                  >
                    Lihat Data Invoice &rarr;
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Printer}
                    onClick={() => window.print()}
                    className="cursor-pointer"
                  >
                    Cetak Faktur Penjualan
                  </Button>
                </div>
              </div>

              {/* Tax Breakdown Table */}
              <div className="space-y-2 max-w-sm ml-auto font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">Total Jasa &amp; Material:</span>
                  <span className="text-white font-medium">{formatCurrency(calculation.subtotal)}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">PPN 11% (Pasal 22):</span>
                  <span className="text-emerald-400 font-medium">+{formatCurrency(calculation.ppnNominal)}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">
                    PPH {calculation.pphRate}% ({formMaterialType}):
                  </span>
                  <span className="text-[#F4511E] font-medium">-{formatCurrency(calculation.pphNominal)}</span>
                </div>

                <div className="pt-2 flex justify-between items-baseline border-t border-[#2A2E33]">
                  <span className="text-xs font-bold text-neutral-300">Total Bersih Tagihan:</span>
                  <span className="text-lg font-bold text-[#F4511E]">
                    {formatCurrency(calculation.totalTagihan)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── STICKY BATCH ACTIONS BAR (When items are checked) ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse shrink-0" />
              <div className="text-xs font-mono text-neutral-300 truncate">
                <strong className="text-white">{selectedItems.length}</strong> Invoice Terpilih &bull; Total:{' '}
                <strong className="text-[#F4511E] text-sm">
                  {formatCurrency(totalSelected)}
                </strong>
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
                onClick={handleBatchMarkPaid}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Catat Lunas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL INFORMASI INVOICE ── */}
      <Modal
        isOpen={Boolean(infoModalItem)}
        onClose={() => setInfoModalItem(null)}
        title="Detail Faktur Invoice"
        subtitle={infoModalItem?.kodeTransaksi}
      >
        {infoModalItem && (
          <div className="p-4 space-y-3 font-mono text-xs text-neutral-300">
            <div className="grid grid-cols-2 gap-2 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Volume</span>
                <span className="text-white font-bold">{infoModalItem.volume} m³</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Material</span>
                <span className="text-white font-bold">{infoModalItem.material}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-500 block text-[10px] uppercase">Total Tagihan</span>
                <span className="text-[#F4511E] font-bold text-sm">
                  {formatCurrency(infoModalItem.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Customer</span>
                <span className="text-white">{infoModalItem.perusahaan}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Layanan</span>
                <span className="text-neutral-200">{infoModalItem.jenis}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Invoice</span>
                <span className="text-neutral-200">{infoModalItem.timestamp}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Periode</span>
                <span className="text-neutral-200">{infoModalItem.periode}</span>
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
                  {infoModalItem.statusBayar === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInfoModalItem(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: KONFIRMASI HAPUS INVOICE */}
      <Modal
        isOpen={deleteConfirmInvoice.open}
        onClose={() => setDeleteConfirmInvoice({ open: false, id: null, label: '', item: null })}
        title="Konfirmasi Hapus Invoice"
        subtitle="Tindakan ini tidak dapat dibatalkan"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-neutral-200">
                Apakah Anda yakin ingin menghapus invoice{' '}
                <span className="font-bold text-white font-mono">{deleteConfirmInvoice.label}</span>?
              </p>
              {deleteConfirmInvoice.item && (
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Customer: <strong className="text-white">{deleteConfirmInvoice.item.perusahaan}</strong> &bull; Total:{' '}
                  <strong className="text-[#F4511E]">{formatCurrency(deleteConfirmInvoice.item.amount)}</strong>
                </p>
              )}
              <p className="text-xs text-rose-400 mt-1.5 font-medium">
                Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmInvoice({ open: false, id: null, label: '', item: null })}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleConfirmDeleteInvoice}
              className="bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
