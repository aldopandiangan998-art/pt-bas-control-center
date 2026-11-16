import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Trash2,
  Info,
  RotateCw,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  PlusCircle,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  List,
  LayoutGrid,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { groupCashOut, groupCheckState } from '../../utils/cashOutGrouping';
import { Modal, Button } from '../../components/ui';

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
// IndeterminateCheckbox — sets the indeterminate DOM property
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
// CashOutGroupHeader
// ─────────────────────────────────────────────────────────────────────────────
function CashOutGroupHeader({ group, expanded, onToggle, checkState, onGroupCheckChange }) {
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
          {summary.count} trx
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
// CashOutRow  (compact table row for grouped-table view)
// ─────────────────────────────────────────────────────────────────────────────
function CashOutRow({ item, isSelected, onSelect, onInfo, isEven }) {
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

      {/* No. Dokumen */}
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

      {/* Jumlah IDR */}
      <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-white text-right whitespace-nowrap">
        {formatCurrency(item.amount)}
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <StatusBadge paid={isPaid} small />
      </td>

      {/* PIC */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-300">
        {item.subDetail || '-'}
      </td>

      {/* Periode */}
      <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-400 whitespace-nowrap">
        {item.periode}
      </td>

      {/* Aksi info */}
      <td className="px-3 py-2.5 text-center w-10">
        <button
          type="button"
          onClick={onInfo}
          className="text-[#F4511E] hover:text-[#F4511E]/80 transition-colors cursor-pointer"
          title="Detail Informasi"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CashOutGridCard (compact structured card for grid view)
// ─────────────────────────────────────────────────────────────────────────────
function CashOutGridCard({ item, isSelected, onSelect, onInfo }) {
  const isPaid = item.statusBayar === 'Lunas';
  return (
    <div
      className={`bg-[#15181C] border rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-all hover:border-[#383E47] ${
        isSelected
          ? 'border-[#F4511E]/70 ring-1 ring-[#F4511E]/40 bg-[#1A1817]'
          : 'border-[#24282C]'
      }`}
    >
      {/* Top Header: Checkbox + Dokumen + Status + Info */}
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
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge paid={isPaid} small />
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
          <span className="text-[10px] text-neutral-500 uppercase font-mono block">Nominal</span>
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

      {/* Bottom: Material, PIC & Tanggal */}
      <div className="space-y-1 text-[10px] font-mono">
        <div className="flex items-center justify-between text-neutral-300">
          <span className="font-bold text-neutral-200">{item.material}</span>
          <span className="text-[9px] text-neutral-500 uppercase truncate max-w-[120px]">{item.jenis}</span>
        </div>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="truncate max-w-[140px]">{item.subDetail || '-'}</span>
          <span className="text-neutral-500">{item.timestamp ? item.timestamp.slice(0, 10) : '-'}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CashOutGroupedTable  (full grouped-table view: supports 'list' and 'grid')
// ─────────────────────────────────────────────────────────────────────────────
function CashOutGroupedTable({
  groups,
  expandedGroups,
  onToggleGroup,
  selectedItems,
  onToggleSelect,
  onToggleGroupSelect,
  onInfo,
  displayMode = 'list',
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500 text-xs">
        Tidak ada data Cash Out yang ditemukan.
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
            <CashOutGroupHeader
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
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">No. Dokumen</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Material</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-right whitespace-nowrap">Volume</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-right whitespace-nowrap">Jumlah (IDR)</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">PIC</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">Periode</th>
                        <th className="px-3 py-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide text-center w-10">Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <CashOutRow
                          key={item.id}
                          item={item}
                          isSelected={selectedItems.includes(item.id)}
                          isEven={idx % 2 === 0}
                          onSelect={() => onToggleSelect(item.id)}
                          onInfo={() => onInfo(item)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.items.map((item) => (
                    <CashOutGridCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.includes(item.id)}
                      onSelect={() => onToggleSelect(item.id)}
                      onInfo={() => onInfo(item)}
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
// BkkPage  (main page component)
// ─────────────────────────────────────────────────────────────────────────────
export default function BkkPage() {
  const navigate = useNavigate();
  const { bkkList, markBkkPaid, suppliers, customers, bankAccounts } = useData();
  const { addToast } = useToast();

  // ── Tab: 'list' | 'create'
  const [activeTab, setActiveTab] = useState('list');

  // ── View preferences (persisted to localStorage)
  const [displayMode, setDisplayMode] = useState(() => lsGet('co_displayMode', 'list')); // 'list' | 'grid'
  const [groupBy, setGroupBy] = useState(() => lsGet('co_groupBy', 'company')); // 'company'|'status'|'material'|'month'
  const [sortOrder, setSortOrder] = useState(() => lsGet('co_sortOrder', 'default')); // 'default'|'name'

  // Persist preferences
  useEffect(() => { lsSet('co_displayMode', displayMode); }, [displayMode]);
  useEffect(() => { lsSet('co_groupBy', groupBy); }, [groupBy]);
  useEffect(() => { lsSet('co_sortOrder', sortOrder); }, [sortOrder]);

  // ── Search & Filter
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ── Input Cash Out form state
  const [filterData, setFilterData] = useState({ pelanggan: 'PT LION WINGS', supplier: '' });
  const [keteranganList, setKeteranganList] = useState([{ id: 1, tipe: '', deskripsi: '' }]);
  const [filterHidden, setFilterHidden] = useState(false);

  // ── Selection
  const [selectedItems, setSelectedItems] = useState([]);

  // ── Expanded groups (Set of group keys)
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // ── Modals
  const [infoModalItem, setInfoModalItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
  });

  // ── Filtered list (search + status applied before grouping)
  const filteredBkk = useMemo(() => {
    return bkkList.filter((item) => {
      const q = searchFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.kodeTransaksi.toLowerCase().includes(q) ||
        item.perusahaan.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        (item.subDetail && item.subDetail.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'BELUM_BAYAR' && item.statusBayar !== 'Lunas') ||
        (statusFilter === 'LUNAS' && item.statusBayar === 'Lunas');

      return matchSearch && matchStatus;
    });
  }, [bkkList, searchFilter, statusFilter]);

  // ── Grouped data (memoised)
  const groups = useMemo(
    () => groupCashOut(filteredBkk, groupBy, sortOrder),
    [filteredBkk, groupBy, sortOrder]
  );

  // Auto-expand groups when they change (default: all open if ≤ 10 groups)
  useEffect(() => {
    if (groups.length <= 10) {
      setExpandedGroups(new Set(groups.map((g) => g.key)));
    } else {
      setExpandedGroups(new Set(groups.length > 0 ? [groups[0].key] : []));
    }
  }, [groupBy, sortOrder]); // only reset on groupBy/sort change, not on every filter

  // ── Handlers
  const handleAddKeterangan = () => {
    setKeteranganList((prev) => [...prev, { id: Date.now(), tipe: '', deskripsi: '' }]);
  };
  const handleUpdateKeterangan = (id, field, value) => {
    setKeteranganList((prev) => prev.map((k) => (k.id === id ? { ...k, [field]: value } : k)));
  };
  const handleRemoveKeterangan = (id) => {
    setKeteranganList((prev) => prev.filter((k) => k.id !== id));
  };

  const handleReset = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setFilterData({ pelanggan: '', supplier: '' });
    setKeteranganList([{ id: 1, tipe: '', deskripsi: '' }]);
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
      // Deselect all in group
      setSelectedItems((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      // Select all in group
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

  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleConfirmPayment = () => {
    markBkkPaid(selectedItems, paymentForm);
    setSelectedItems([]);
    setShowPaymentModal(false);
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
              {activeTab === 'list' ? 'Data Cash Out' : 'Buat Cash Out'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar pengeluaran kas operasional & kewajiban supplier'
                : 'Formulir pengajuan kas keluar & penyesuaian biaya'}
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
            Daftar CO ({bkkList.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Input Cash Out
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1 — DAFTAR CO
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">

          {/* ── Toolbar Row 1: count + icon buttons ── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredBkk.length} Transaksi CO
            </span>

            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                type="button"
                onClick={() => setShowSearchInput((p) => !p)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  showSearchInput
                    ? 'bg-[#F4511E]/20 text-[#F4511E]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
                title="Cari Data"
              >
                <Search className="w-4 h-4" />
              </button>

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
                onClick={() => addToast('Pilih rentang tanggal CO', 'info')}
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

          {/* Search input */}
          {showSearchInput && (
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Ketik nomor CO, nama customer, material..."
                className="w-full bg-[#1C1F24] border border-[#2A2E33] focus:border-[#F4511E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          )}

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
          <CashOutGroupedTable
            groups={groups}
            expandedGroups={expandedGroups}
            onToggleGroup={handleToggleGroup}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelect}
            onToggleGroupSelect={handleToggleGroupSelect}
            onInfo={setInfoModalItem}
            displayMode={displayMode}
          />

          {/* FAB */}
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#E04418] text-white flex items-center justify-center shadow-xl shadow-[#F4511E]/40 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Tambah Cash Out"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2 — INPUT CASH OUT
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Formulir Cash Out Baru
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterHidden((p) => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Toggle Form Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reset Form"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!filterHidden && (
            <div className="space-y-3">
              {/* Pilih Pelanggan */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group cursor-pointer">
                <User className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors pointer-events-none" />
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className={`text-xs truncate ${filterData.pelanggan ? 'text-neutral-200' : 'text-neutral-400'}`}>
                    {filterData.pelanggan || 'Pilih Pelanggan'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 pointer-events-none" />
                <select
                  value={filterData.pelanggan}
                  onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="" className="bg-[#1C1F24] text-neutral-400">Pilih Pelanggan</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#1C1F24]">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Pilih Supplier */}
              <div className="relative bg-[#1C1F24] border-t border-l border-r border-[#2A2E33] border-b-2 border-b-[#F4511E] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group cursor-pointer">
                <User className="w-5 h-5 text-neutral-500 shrink-0 pointer-events-none" />
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className="text-xs text-[#F4511E] font-medium truncate">
                    {filterData.supplier || 'Pilih Supplier'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#F4511E] shrink-0 pointer-events-none" />
                <select
                  value={filterData.supplier}
                  onChange={(e) => setFilterData({ ...filterData, supplier: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="" className="bg-[#1C1F24] text-[#F4511E]">Pilih Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} className="bg-[#1C1F24] text-white">
                      {s.name} ({s.bank} - {s.noRekening})
                    </option>
                  ))}
                </select>
              </div>

              {/* Daftar Keterangan */}
              <div className="space-y-2 pt-1">
                <div className="text-xs text-neutral-400 font-medium">Daftar Keterangan</div>

                {keteranganList.map((ket) => (
                  <div key={ket.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveKeterangan(ket.id)}
                      className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#1C1F24] border border-[#2A2E33] hover:border-rose-500/50 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus Keterangan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="relative flex-1">
                      <select
                        value={ket.tipe}
                        onChange={(e) => handleUpdateKeterangan(ket.id, 'tipe', e.target.value)}
                        className="w-full bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-3 py-3 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1C1F24] text-neutral-400">Tipe Keterang...</option>
                        <option value="Kasbon" className="bg-[#1C1F24]">Kasbon</option>
                        <option value="Potongan" className="bg-[#1C1F24]">Potongan</option>
                        <option value="Penyesuaian" className="bg-[#1C1F24]">Penyesuaian</option>
                        <option value="Solar" className="bg-[#1C1F24]">Solar</option>
                        <option value="Biaya Tambahan" className="bg-[#1C1F24]">Biaya Tambahan</option>
                        <option value="Retribusi" className="bg-[#1C1F24]">Retribusi</option>
                        <option value="Lainnya" className="bg-[#1C1F24]">Lainnya</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={ket.deskripsi}
                        onChange={(e) => handleUpdateKeterangan(ket.id, 'deskripsi', e.target.value)}
                        placeholder="Item/Deskripsi"
                        className="w-full bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-3 py-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] transition-colors"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddKeterangan}
                  className="w-full py-2.5 rounded-xl border border-[#F4511E]/40 hover:border-[#F4511E] bg-[#1C1F24]/50 text-[#F4511E] hover:bg-[#F4511E]/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>TAMBAH KETERANGAN</span>
                </button>
              </div>

              {/* TERAPKAN */}
              <button
                type="button"
                onClick={() => {
                  addToast('Keterangan & filter kas keluar berhasil disimpan!', 'success');
                  setActiveTab('list');
                }}
                className="w-full py-3 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:bg-[#C93C15] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F4511E]/20 cursor-pointer"
              >
                TERAPKAN & LIHAT DATA
              </button>
            </div>
          )}

          {/* Sembunyikan / Tampilkan Filter */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setFilterHidden((p) => !p)}
              className="px-4 py-1.5 rounded-lg bg-[#141619] border border-[#2A2E33] hover:border-neutral-600 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <span>{filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}</span>
              {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── STICKY SELECTION BAR ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 px-2">
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

      {/* ── MODAL DETAIL ── */}
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
                <span className="text-white font-bold">{infoModalItem.volume} m³</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Material</span>
                <span className="text-white font-bold">{infoModalItem.material}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-500 block text-[10px] uppercase">Nominal Kas Keluar</span>
                <span className="text-[#F4511E] font-bold text-sm">{formatCurrency(infoModalItem.amount)}</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Customer</span>
                <span className="text-white">{infoModalItem.perusahaan}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">PIC / Driver / Subdetail</span>
                <span className="text-neutral-200">{infoModalItem.subDetail}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Transaksi</span>
                <span className="text-neutral-200">{infoModalItem.timestamp}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Periode</span>
                <span className="text-neutral-200">{infoModalItem.periode}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Status Pembayaran</span>
                <span className={infoModalItem.statusBayar === 'Lunas' ? 'text-emerald-400 font-bold' : 'text-[#F4511E] font-bold'}>
                  {infoModalItem.statusBayar}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setInfoModalItem(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL KONFIRMASI PEMBAYARAN ── */}
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
            <Button variant="primary" icon={CheckCircle2} onClick={handleConfirmPayment}>Simpan Pelunasan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
