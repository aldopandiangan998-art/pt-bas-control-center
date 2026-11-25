import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Banknote,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  CheckCircle2,
  HardHat,
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
export const getDefaultDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

// Card view component for PPh 23 Grid Mode
function Pph23GridCard({ row, idx, isDark, isSelected, onToggleSelect }) {
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
                title={isSelected ? 'Batal pilih bukti potong' : 'Pilih bukti potong'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                <span>#{idx + 1}</span>
                <span>•</span>
                <span>Bukti Potong PPh 23</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#FF7043] truncate mt-0.5" title={row.noBuktiPotong}>
                {row.noBuktiPotong || '-'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {row.statusBupot || 'TERBIT'}
            </span>
          </div>
        </div>

        {/* BKK & Date */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-2.5 pt-2 border-t border-dashed border-neutral-700/40">
          <span className="truncate max-w-[170px]" title={row.noBkk}>
            {row.noBkk || '-'}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-[#F4511E]" />
            {row.tanggal}
          </span>
        </div>
      </div>

      {/* Middle: Vendor & Objek */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`} title={row.vendor}>
              {row.vendor}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5 truncate">
              NPWP/NIK: {row.npwpNik || '-'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Package className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className={`text-[11px] leading-relaxed line-clamp-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`} title={row.objekPajak}>
            {row.objekPajak || 'Jasa Angkut Material'}
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
          <span className="text-neutral-400">DPP Bruto:</span>
          <span className="font-semibold">{formatCurrency(row.dpp || 0)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">Tarif PPh 23:</span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
              row.tarif === 2.65
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-orange-500/10 text-[#FF7043]'
            }`}
          >
            {row.tarif}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#FF7043] font-medium">Potongan PPh 23:</span>
          <span className="font-bold text-[#FF7043]">{formatCurrency(row.potonganPph || 0)}</span>
        </div>
        <div className="pt-1.5 border-t border-neutral-700/30 flex items-center justify-between text-xs font-bold">
          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Netto Kas Keluar:</span>
          <span className="text-emerald-400">
            {formatCurrency(row.nettoBkk || ((Number(row.dpp) || 0) - (Number(row.potonganPph) || 0)))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LaporanPph23Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();

  // View mode state (List vs Grid), persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ptbas_pph23_viewmode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ptbas_pph23_viewmode', mode);
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
      setSelectedIds(new Set(filteredRows.map((r, i) => r.id || r.noBuktiPotong || `row-${i}`)));
    }
  };

  // Filter state: auto-populates from URL query params or current month on initial open
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
    try {
      const res = await fetch(`/api/reports/pph-23?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`, {
        headers: { 'x-user-role': isSuperAdmin ? 'superadmin' : 'admin' },
      });

      if (!res.ok) {
        setReportData([]);
        setHasApplied(true);
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setReportData(json.data);
      } else {
        setReportData([]);
      }
      setHasApplied(true);
    } catch (err) {
      console.warn('API error loading PPh 23 report:', err.message);
      setReportData([]);
      setHasApplied(true);
    } finally {
      setLoading(false);
    }
  }, [addToast, isSuperAdmin]);

  // Automatically populate data whenever date range is valid and available (e.g. on calendar open or date change)
  useEffect(() => {
    if (startDate && endDate && !isInvalidDateRange) {
      fetchReport(startDate, endDate);
    }
  }, [startDate, endDate, isInvalidDateRange, fetchReport]);

  const handleApply = () => {
    if (isInvalidDateRange) {
      addToast('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.', 'error');
      return;
    }
    fetchReport(startDate, endDate);
    addToast(`Filter PPh 23 berhasil diterapkan (${startDate} s/d ${endDate})`, 'success');
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
      (r.vendor && r.vendor.toLowerCase().includes(q)) ||
      (r.noBuktiPotong && r.noBuktiPotong.toLowerCase().includes(q)) ||
      (r.noBkk && r.noBkk.toLowerCase().includes(q)) ||
      (r.objekPajak && r.objekPajak.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  // Aggregate totals
  const totalDpp = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.dpp) || 0), 0), [filteredRows]);
  const totalPotonganPph = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.potonganPph) || 0), 0), [filteredRows]);
  const totalNettoBkk = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.nettoBkk) || 0), 0), [filteredRows]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const rowsToExport = selectedIds.size > 0
      ? filteredRows.filter((r, i) => selectedIds.has(r.id || r.noBuktiPotong || `row-${i}`))
      : filteredRows;

    if (rowsToExport.length === 0) {
      addToast('Tidak ada data untuk diekspor.', 'info');
      return;
    }
    const headers = [
      'No',
      'Tanggal',
      'No. Bukti Potong',
      'No. BKK',
      'Vendor / Supplier',
      'NPWP / NIK',
      'Objek Pemotongan Pajak',
      'Kategori Tarif',
      'Tarif PPh (%)',
      'DPP (Rp)',
      'Potongan PPh 23 (Rp)',
      'Netto Kas Keluar (Rp)',
      'Status Bupot',
    ];
    const rows = rowsToExport.map((r, i) => [
      i + 1,
      r.tanggal,
      r.noBuktiPotong,
      r.noBkk || '-',
      `"${r.vendor || ''}"`,
      r.npwpNik || '-',
      `"${r.objekPajak || ''}"`,
      `"${r.kategori || ''}"`,
      r.tarif || 2.0,
      r.dpp,
      r.potonganPph,
      r.nettoBkk,
      r.statusBupot,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_PPh23_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast(
      selectedIds.size > 0
        ? `${selectedIds.size} bukti potong PPh 23 terpilih berhasil diekspor.`
        : 'File CSV Laporan PPh 23 berhasil diunduh.',
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold shadow-xs">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Laporan Pajak Penghasilan Pasal 23 (PPh 23)
              </h1>
              <Badge variant="info" className="text-[10px] font-mono uppercase">
                PPh 23
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rekapitulasi Bukti Pemotongan PPh 23 atas Jasa Angkut & Tambang Material Vendor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ekspor CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cetak</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <ReportFilterCard
        title="Filter Rentang Tanggal PPh 23"
        onApply={handleApply}
        onReset={handleReset}
        loading={loading}
        applyDisabled={isInvalidDateRange || !startDate || !endDate}
        applyLabel="Terapkan Filter"
        onToggleCollapse={(isOpen) => {
          if (isOpen && (!reportData || reportData.length === 0)) {
            fetchReport(startDate, endDate);
          }
        }}
      >
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(val) => {
            setStartDate(val);
            if (val && endDate && val <= endDate) {
              fetchReport(val, endDate);
            }
          }}
          onEndDateChange={(val) => {
            setEndDate(val);
            if (val && startDate && startDate <= val) {
              fetchReport(startDate, val);
            }
          }}
          disabled={loading}
          error={isInvalidDateRange ? 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.' : ''}
        />
      </ReportFilterCard>

      {/* Search Bar & Table Card */}
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
                Daftar Bukti Potong PPh 23 Vendor / Supplier
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Menampilkan {filteredRows.length} dari {reportData.length} bukti potong {selectedIds.size > 0 && `• ${selectedIds.size} dipilih`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <SearchBar
              containerClassName="w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Cari Vendor, No. Bupot, BKK..."
              size="sm"
            />
            <ViewToggle viewMode={viewMode} onChange={handleSetViewMode} />
          </div>
        </div>

        {/* Content (Empty / List Table / Grid Cards) */}
        {filteredRows.length === 0 ? (
          <div className="p-6">
            <ReportEmptyState
              title="Tidak ada data transaksi PPh 23 untuk filter yang dipilih"
              message={`Tidak ditemukan bukti potong PPh 23 pada rentang ${startDate} s/d ${endDate}. Silakan ubah tanggal atau kriteria pencarian.`}
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
                  <th className="py-3 px-3">No. Bukti Potong</th>
                  <th className="py-3 px-3">No. BKK</th>
                  <th className="py-3 px-3">Vendor / Supplier</th>
                  <th className="py-3 px-3">NPWP / NIK</th>
                  <th className="py-3 px-3">Objek Pemotongan</th>
                  <th className="py-3 px-3 text-center">Tarif</th>
                  <th className="py-3 px-3 text-right">DPP Bruto (Rp)</th>
                  <th className="py-3 px-3 text-right">Potongan PPh 23 (Rp)</th>
                  <th className="py-3 px-3 text-right">Netto Diterima (Rp)</th>
                  <th className="py-3 px-3 text-center">Status Bupot</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
              }`}>
                {filteredRows.map((row, idx) => {
                  const rowId = row.id || row.noBuktiPotong || `row-${idx}`;
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
                        {row.noBuktiPotong || '-'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-400">
                        {row.noBkk || '-'}
                      </td>
                      <td className="py-3 px-3 font-medium font-sans max-w-[180px] truncate" title={row.vendor}>
                        {row.vendor}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-neutral-400 whitespace-nowrap">
                        {row.npwpNik || '-'}
                      </td>
                      <td className="py-3 px-3 font-sans max-w-[200px] truncate" title={row.objekPajak}>
                        {row.objekPajak || 'Jasa Angkut Material'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                          row.tarif === 2.65
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-orange-500/10 text-[#FF7043]'
                        }`}>
                          {row.tarif}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                        {formatCurrency(row.dpp || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">
                        {formatCurrency(row.potonganPph || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold whitespace-nowrap text-emerald-400">
                        {formatCurrency(row.nettoBkk || (row.dpp - row.potonganPph))}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {row.statusBupot || 'TERBIT'}
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
                    Total Keseluruhan ({filteredRows.length} Bukti Potong):
                  </td>
                  <td className="py-3 px-3 text-center">-</td>
                  <td className="py-3 px-3 text-right text-xs">
                    {formatCurrency(totalDpp)}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-[#FF7043]">
                    {formatCurrency(totalPotonganPph)}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-emerald-400">
                    {formatCurrency(totalNettoBkk)}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-neutral-400 font-sans">
                    Rekapitulasi PPh 23
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
                const rowId = row.id || row.noBuktiPotong || `row-${idx}`;
                return (
                  <Pph23GridCard
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
                <span className="text-neutral-400">({filteredRows.length} Bukti Potong PPh 23)</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Total DPP Bruto</span>
                  <span className="font-bold">{formatCurrency(totalDpp)}</span>
                </div>
                <div>
                  <span className="text-[#FF7043] block text-[10px] uppercase font-bold">Total PPh 23</span>
                  <span className="font-bold text-[#FF7043]">{formatCurrency(totalPotonganPph)}</span>
                </div>
                <div>
                  <span className="text-emerald-400 block text-[10px] uppercase font-bold">Total Netto BKK</span>
                  <span className="font-bold text-sm text-emerald-400">{formatCurrency(totalNettoBkk)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#16191D] border border-[#2B313C] rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-4 font-mono text-xs text-white">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse" />
            <span><strong className="text-[#FF7043]">{selectedIds.size}</strong> bukti potong dipilih</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            title="Ekspor bukti potong terpilih ke CSV"
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
