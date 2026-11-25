import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Receipt,
  Search,
  Printer,
  FileSpreadsheet,
  Filter,
  List,
  LayoutGrid,
  Building2,
  Package,
  Calendar,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Button, SearchBar, ViewToggle, IndeterminateCheckbox } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import DateRangeFilter from '../../components/laporan/DateRangeFilter';
import ReportFilterCard from '../../components/laporan/ReportFilterCard';
import ReportEmptyState from '../../components/laporan/ReportEmptyState';

// Helper to calculate current month start & end dates in YYYY-MM-DD format
const getDefaultDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

// Card view item component for Grid Mode
function PpnGridCard({ row, idx, isDark, isSelected, onToggleSelect }) {
  return (
    <div
      onClick={onToggleSelect}
      className={`rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between gap-3.5 hover:shadow-md cursor-pointer ${
        isSelected
          ? 'border-[#F4511E] ring-1 ring-[#F4511E] bg-[#F4511E]/5'
          : isDark
            ? 'bg-[#181B1E] border-[#22262A] hover:border-[#383E46]'
            : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div onClick={(e) => e.stopPropagation()} className="shrink-0 pt-0.5">
              <IndeterminateCheckbox
                checked={isSelected}
                onChange={onToggleSelect}
                title={isSelected ? 'Batal pilih faktur' : 'Pilih faktur'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                <span>#{idx + 1}</span>
                <span>•</span>
                <span>Faktur Pajak</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#FF7043] truncate mt-0.5" title={row.nomorFakturPajak}>
                {row.nomorFakturPajak || '-'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {row.statusFaktur || 'APPROVED DJP'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                row.statusBayar === 'Lunas'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {row.statusBayar || 'Belum Dibayar'}
            </span>
          </div>
        </div>

        {/* Invoice & Date */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-2.5 pt-2 border-t border-dashed border-neutral-700/40">
          <span className="truncate max-w-[170px]" title={row.nomorInvoice || row.kodeTransaksi}>
            {row.nomorInvoice || row.kodeTransaksi || '-'}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-[#F4511E]" />
            {row.tanggal}
          </span>
        </div>
      </div>

      {/* Middle: Customer & Material */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`} title={row.customer}>
              {row.customer}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5 truncate">
              NPWP: {row.npwp || '-'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`} title={row.material}>
            {row.material || 'Material Tambang'}
          </div>
        </div>
      </div>

      {/* Financial Breakdown Box */}
      <div
        className={`p-3 rounded-lg border space-y-1.5 font-mono text-xs ${
          isDark ? 'bg-[#141619] border-[#22262A]' : 'bg-slate-50 border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">DPP:</span>
          <span className="font-semibold">{formatCurrency(row.dpp || 0)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">Tarif PPN:</span>
          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-[#FF7043] font-bold text-[10px]">
            {row.tarifPpn || 11}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#FF7043] font-medium">PPN 11%:</span>
          <span className="font-bold text-[#FF7043]">{formatCurrency(row.ppn || 0)}</span>
        </div>
        <div className="pt-1.5 border-t border-neutral-700/30 flex items-center justify-between text-xs font-bold">
          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Total:</span>
          <span className={isDark ? 'text-white' : 'text-slate-900'}>
            {formatCurrency(row.amount || row.total || ((Number(row.dpp) || 0) + (Number(row.ppn) || 0)))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LaporanPpnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();

  // View mode state (List vs Grid), persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ptbas_ppn_viewmode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ptbas_ppn_viewmode', mode);
    } catch (e) {
      console.warn('Failed to save view mode to localStorage', e);
    }
  };

  // Checkbox multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (filteredRows.length > 0 && selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r, i) => r.id || r.nomorFakturPajak || `row-${i}`)));
    }
  };

  // Filters state: auto-populates from URL query params or current month on initial open
  const [startDate, setStartDate] = useState(() => {
    const urlStart = searchParams.get('startDate') || searchParams.get('start_date') || location.state?.startDate;
    if (urlStart) return urlStart;
    return getDefaultDateRange().startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const urlEnd = searchParams.get('endDate') || searchParams.get('end_date') || location.state?.endDate;
    if (urlEnd) return urlEnd;
    return getDefaultDateRange().endDate;
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Keep state synchronized if URL search params or location state change
  useEffect(() => {
    const urlStart = searchParams.get('startDate') || searchParams.get('start_date') || location.state?.startDate;
    const urlEnd = searchParams.get('endDate') || searchParams.get('end_date') || location.state?.endDate;
    const def = getDefaultDateRange();
    if (urlStart && urlStart !== startDate) {
      setStartDate(urlStart);
    } else if (!startDate) {
      setStartDate(def.startDate);
    }
    if (urlEnd && urlEnd !== endDate) {
      setEndDate(urlEnd);
    } else if (!endDate) {
      setEndDate(def.endDate);
    }
  }, [searchParams, location.state]);

  // Execution state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  // Validation
  const isInvalidDateRange = Boolean(startDate && endDate && endDate < startDate);

  // Fetch report from API
  const fetchReport = useCallback(async (start, end) => {
    if (!start || !end) {
      addToast('Tanggal mulai dan tanggal akhir wajib diisi.', 'warning');
      return;
    }
    if (end < start) {
      addToast('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.', 'error');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/reports/ppn?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`, {
        headers: { 'x-user-role': isSuperAdmin ? 'superadmin' : 'admin' },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Gagal memuat laporan PPN (${res.status})`);
      }

      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setReportData(json.data);
      } else {
        setReportData([]);
      }
      setHasApplied(true);
    } catch (err) {
      console.warn('API error loading PPN report:', err.message);
      setReportData([]);
      setHasApplied(true);
    } finally {
      setLoading(false);
    }
  }, [addToast, isSuperAdmin]);

  useEffect(() => {
    const def = getDefaultDateRange();
    const effectiveStart = startDate || def.startDate;
    const effectiveEnd = endDate || def.endDate;
    fetchReport(effectiveStart, effectiveEnd);
  }, []);

  const handleApply = () => {
    if (isInvalidDateRange) {
      addToast('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.', 'error');
      return;
    }
    fetchReport(startDate, endDate);
    addToast(`Filter PPN berhasil diterapkan (${startDate} s/d ${endDate})`, 'success');
  };

  const handleReset = () => {
    const def = getDefaultDateRange();
    setStartDate(def.startDate);
    setEndDate(def.endDate);
    setSearchQuery('');
    setSelectedIds(new Set());
    fetchReport(def.startDate, def.endDate);
    addToast('Filter berhasil direset ke bulan berjalan.', 'info');
  };

  // Filtered rows for client search
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return reportData;
    return reportData.filter((r) =>
      (r.customer && r.customer.toLowerCase().includes(q)) ||
      (r.nomorFakturPajak && r.nomorFakturPajak.toLowerCase().includes(q)) ||
      (r.nomorInvoice && r.nomorInvoice.toLowerCase().includes(q)) ||
      (r.material && r.material.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Aggregate totals
  const totalDpp = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.dpp) || 0), 0), [filteredRows]);
  const totalPpn = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.ppn) || 0), 0), [filteredRows]);
  const totalAmount = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), [filteredRows]);

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const rowsToExport = selectedIds.size > 0
      ? filteredRows.filter((r, i) => selectedIds.has(r.id || r.nomorFakturPajak || `row-${i}`))
      : filteredRows;

    if (rowsToExport.length === 0) {
      addToast('Tidak ada data untuk diekspor.', 'info');
      return;
    }
    const headers = [
      'No',
      'Tanggal',
      'No. Faktur Pajak',
      'No. Invoice',
      'Customer',
      'NPWP',
      'Material / Uraian',
      'DPP (Rp)',
      'Tarif PPN (%)',
      'PPN (Rp)',
      'Total (Rp)',
      'Status Faktur',
      'Status Bayar',
    ];
    const rows = rowsToExport.map((r, i) => [
      i + 1,
      r.tanggal,
      r.nomorFakturPajak,
      r.nomorInvoice,
      `"${r.customer || ''}"`,
      r.npwp,
      `"${r.material || ''}"`,
      r.dpp,
      r.tarifPpn || 11,
      r.ppn,
      r.amount || r.total,
      r.statusFaktur,
      r.statusBayar,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_PPN_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast(
      selectedIds.size > 0
        ? `${selectedIds.size} transaksi PPN terpilih berhasil diekspor.`
        : 'File CSV Laporan PPN berhasil diunduh.',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Laporan Pajak Pertambahan Nilai (PPN)
              </h1>
              <Badge variant="warning" className="text-[10px] font-mono uppercase">
                PPN 11%
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rekapitulasi Faktur Pajak Keluaran & PPN Penjualan Material Proyek
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={!hasApplied || filteredRows.length === 0}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ekspor CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={!hasApplied || filteredRows.length === 0}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cetak</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <ReportFilterCard
        title="Filter Rentang Tanggal PPN"
        onApply={handleApply}
        onReset={handleReset}
        loading={loading}
        applyDisabled={isInvalidDateRange || !startDate || !endDate}
        applyLabel="Terapkan Filter"
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disabled={loading}
          error={isInvalidDateRange ? 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.' : ''}
        />
      </ReportFilterCard>

      {/* Search Bar & Table Card / Belum Terapkan Filter State */}
      {!hasApplied ? (
        <div className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3 ${
          isDark ? 'bg-[#14171A]/60 border-[#22262A] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-[#1D2126] text-[#F4511E]' : 'bg-orange-50 text-[#F4511E]'
          }`}>
            <Filter className="w-7 h-7" />
          </div>
          <div>
            <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
              Filter Belum Diterapkan
            </h4>
            <p className="text-xs mt-1 max-w-md mx-auto leading-relaxed">
              Silakan tentukan rentang tanggal pada panel filter di atas, kemudian klik tombol <strong className="text-[#F4511E]">"Terapkan Filter"</strong> untuk memuat daftar transaksi Faktur Pajak PPN.
            </p>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'border-[#22262A] bg-[#181B1E]' : 'border-slate-100 bg-slate-50/70'
          }`}>
            <div className="flex items-center gap-3">
              {filteredRows.length > 0 && (
                <div className="flex items-center gap-2 pr-2 border-r border-neutral-700/50">
                  <IndeterminateCheckbox
                    checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRows.length}
                    onChange={handleSelectAll}
                    title={selectedIds.size === filteredRows.length ? 'Batal pilih semua' : 'Pilih semua'}
                  />
                </div>
              )}
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-neutral-200' : 'text-slate-800'
                }`}>
                  Daftar Transaksi Faktur Pajak PPN
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menampilkan {filteredRows.length} dari {reportData.length} transaksi {selectedIds.size > 0 && `• ${selectedIds.size} dipilih`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <SearchBar
                containerClassName="w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Cari Customer, Faktur, Invoice..."
                size="sm"
              />
              <ViewToggle viewMode={viewMode} onChange={handleSetViewMode} />
            </div>
          </div>

          {/* Content (Empty / List Table / Grid Cards) */}
          {filteredRows.length === 0 ? (
            <div className="p-6">
              <ReportEmptyState
                title="Tidak ada data transaksi PPN untuk filter yang dipilih"
                message={`Tidak ditemukan faktur pajak penjualan pada rentang ${startDate} s/d ${endDate}. Silakan ubah tanggal atau kata kunci pencarian.`}
                onReset={handleReset}
              />
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="py-3 px-3 w-10 text-center">
                      <IndeterminateCheckbox
                        checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRows.length}
                        onChange={handleSelectAll}
                        title={selectedIds.size === filteredRows.length ? 'Batal pilih semua' : 'Pilih semua'}
                      />
                    </th>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">No. Faktur Pajak</th>
                    <th className="py-3 px-3">No. Invoice</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">NPWP</th>
                    <th className="py-3 px-3">Material / Uraian</th>
                    <th className="py-3 px-3 text-right">DPP (Rp)</th>
                    <th className="py-3 px-3 text-center">Tarif</th>
                    <th className="py-3 px-3 text-right">PPN 11% (Rp)</th>
                    <th className="py-3 px-3 text-right">Total Tagihan (Rp)</th>
                    <th className="py-3 px-3 text-center">Status Faktur</th>
                    <th className="py-3 px-3 text-center">Status Bayar</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${
                  isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                }`}>
                  {filteredRows.map((row, idx) => {
                    const rowId = row.id || row.nomorFakturPajak || `row-${idx}`;
                    const isSelected = selectedIds.has(rowId);
                    return (
                      <tr
                        key={rowId}
                        onClick={() => toggleSelect(rowId)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? isDark ? 'bg-[#F4511E]/10 hover:bg-[#F4511E]/15' : 'bg-orange-50 hover:bg-orange-100/80'
                            : isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <IndeterminateCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(rowId)}
                            title={isSelected ? 'Batal pilih' : 'Pilih'}
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-neutral-400 text-[11px] font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {row.tanggal}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">
                          {row.nomorFakturPajak || '-'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-400">
                          {row.nomorInvoice || row.kodeTransaksi || '-'}
                        </td>
                        <td className="py-3 px-3 font-medium font-sans max-w-[200px] truncate" title={row.customer}>
                          {row.customer}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-neutral-400 whitespace-nowrap">
                          {row.npwp || '-'}
                        </td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate" title={row.material}>
                          {row.material || 'Material Tambang'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                          {formatCurrency(row.dpp || 0)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-[#FF7043] font-bold text-[10px]">
                            {row.tarifPpn || 11}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">
                          {formatCurrency(row.ppn || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                          {formatCurrency(row.amount || row.total || (row.dpp + row.ppn))}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {row.statusFaktur || 'APPROVED DJP'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.statusBayar === 'Lunas'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {row.statusBayar || 'Belum Dibayar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Summary Total Footer Row */}
                <tfoot>
                  <tr className={`border-t-2 font-mono font-bold ${
                    isDark ? 'border-[#2E3339] bg-[#181B1E] text-white' : 'border-slate-300 bg-slate-100 text-slate-900'
                  }`}>
                    <td colSpan={8} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                      Total Keseluruhan ({filteredRows.length} Transaksi):
                    </td>
                    <td className="py-3 px-3 text-right text-xs">
                      {formatCurrency(totalDpp)}
                    </td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-3 text-right text-xs text-[#FF7043]">
                      {formatCurrency(totalPpn)}
                    </td>
                    <td className="py-3 px-3 text-right text-xs">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-neutral-400 font-sans">
                      Rekapitulasi PPN Resmi
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredRows.map((row, idx) => {
                  const rowId = row.id || row.nomorFakturPajak || `row-${idx}`;
                  return (
                    <PpnGridCard
                      key={rowId}
                      row={row}
                      idx={idx}
                      isDark={isDark}
                      isSelected={selectedIds.has(rowId)}
                      onToggleSelect={() => toggleSelect(rowId)}
                    />
                  );
                })}
              </div>

              {/* Grid Summary Footer Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono ${
                  isDark ? 'bg-[#181B1E] border-[#262A30] text-neutral-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#F4511E]" />
                  <span className="font-bold">Total Keseluruhan:</span>
                  <span className="text-neutral-400">({filteredRows.length} Transaksi PPN)</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Total DPP</span>
                    <span className="font-bold">{formatCurrency(totalDpp)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Tarif PPN</span>
                    <span className="font-bold text-[#FF7043]">11%</span>
                  </div>
                  <div>
                    <span className="text-[#FF7043] block text-[10px] uppercase font-bold">Total PPN 11%</span>
                    <span className="font-bold text-[#FF7043]">{formatCurrency(totalPpn)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Total Tagihan</span>
                    <span className="font-bold text-sm text-emerald-400">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#16191D] border border-[#2B313C] rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-4 font-mono text-xs text-white">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse" />
            <span><strong className="text-[#FF7043]">{selectedIds.size}</strong> transaksi dipilih</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            title="Ekspor transaksi terpilih ke CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Terpilih</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-neutral-400 hover:text-white text-[11px] cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
