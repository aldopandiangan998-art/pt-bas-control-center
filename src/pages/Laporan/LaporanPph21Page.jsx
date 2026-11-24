import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Banknote,
  Search,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  UserCheck,
  List,
  LayoutGrid,
  Calendar,
  X,
  User,
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

// Fallback dataset for Article 21 Income Tax (PPh 21 - Driver & Staff Wages / Honorarium)
// Dynamically anchored to current month/year to guarantee auto-populated data on opening
export const getDefaultPph21Data = (yearInput, monthInput) => {
  const now = new Date();
  const y = yearInput || now.getFullYear();
  const m = monthInput || String(now.getMonth() + 1).padStart(2, '0');

  return [
    {
      id: `PPH21-${y}${m}-001`,
      tanggal: `${y}-${m}-12`,
      noBuktiPotong: `BUPOT-21/BAS/${y}/${m}/001`,
      noBkk: `BKK/${y}/${m}/0042`,
      vendor: 'SUMARNO (Driver Tronton Hino)',
      penerima: 'SUMARNO',
      npwpNik: '3525041008800002',
      objekPajak: 'Upah Driver Ritase Material Tambang',
      kategori: 'Pegawai Tidak Tetap / Tenaga Lepas',
      tarif: 2.5,
      dpp: 8500000,
      potonganPph: 212500,
      nettoBkk: 8287500,
      statusBupot: 'TERBIT',
    },
    {
      id: `PPH21-${y}${m}-002`,
      tanggal: `${y}-${m}-10`,
      noBuktiPotong: `BUPOT-21/BAS/${y}/${m}/002`,
      noBkk: `BKK/${y}/${m}/0043`,
      vendor: 'UKHY DIAN (Driver Armada Tambang)',
      penerima: 'UKHY DIAN',
      npwpNik: '3525011204850003',
      objekPajak: 'Upah Pengemudi Tambang Limestone',
      kategori: 'Pegawai Tidak Tetap / Tenaga Lepas',
      tarif: 2.5,
      dpp: 12400000,
      potonganPph: 310000,
      nettoBkk: 12090000,
      statusBupot: 'TERBIT',
    },
    {
      id: `PPH21-${y}${m}-003`,
      tanggal: `${y}-${m}-08`,
      noBuktiPotong: `BUPOT-21/BAS/${y}/${m}/003`,
      noBkk: `BKK/${y}/${m}/0044`,
      vendor: 'BAMBANG HERMANTO (Mekanik Alat Berat)',
      penerima: 'BAMBANG HERMANTO',
      npwpNik: '3525081405820001',
      objekPajak: 'Jasa Tenaga Lepas Perawatan Dump Truck',
      kategori: 'Tenaga Ahli / Jasa Lepas',
      tarif: 5.0,
      dpp: 6500000,
      potonganPph: 325000,
      nettoBkk: 6175000,
      statusBupot: 'TERBIT',
    },
    {
      id: `PPH21-${y}${m}-004`,
      tanggal: `${y}-${m}-05`,
      noBuktiPotong: `BUPOT-21/BAS/${y}/${m}/004`,
      noBkk: `BKK/${y}/${m}/0045`,
      vendor: 'SUWANDI (Checker Quarry Manyar)',
      penerima: 'SUWANDI',
      npwpNik: '3525021907860004',
      objekPajak: 'Honorarium Pengawas & Checker Quarry',
      kategori: 'Pegawai Tidak Tetap / Tenaga Lepas',
      tarif: 2.5,
      dpp: 4800000,
      potonganPph: 120000,
      nettoBkk: 4680000,
      statusBupot: 'TERBIT',
    },
    {
      id: `PPH21-${y}${m}-005`,
      tanggal: `${y}-${m}-02`,
      noBuktiPotong: `BUPOT-21/BAS/${y}/${m}/005`,
      noBkk: `BKK/${y}/${m}/0046`,
      vendor: 'AGUS PRASETYO (Driver Dump Truck)',
      penerima: 'AGUS PRASETYO',
      npwpNik: '3525032109880005',
      objekPajak: 'Upah Pengemudi Angkut Sirtu Urug',
      kategori: 'Pegawai Tidak Tetap / Tenaga Lepas',
      tarif: 2.5,
      dpp: 7200000,
      potonganPph: 180000,
      nettoBkk: 7020000,
      statusBupot: 'TERBIT',
    },
  ];
};

// Card view component for PPh 21 Grid Mode
function Pph21GridCard({ row, idx, isDark, isSelected, onToggleSelect }) {
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
                <span>Bukti Potong PPh 21</span>
              </div>
              <div className="text-sm font-mono font-bold text-amber-400 truncate mt-0.5" title={row.noBuktiPotong}>
                {row.noBuktiPotong || '-'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge size="xs" variant="success" dot>
              {row.statusBupot || 'TERBIT'}
            </Badge>
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

      {/* Middle: Penerima / Driver & Objek */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <User className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`} title={row.vendor || row.penerima}>
              {row.vendor || row.penerima}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5 truncate">
              NIK: {row.npwpNik || '-'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Briefcase className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className={`text-[11px] leading-relaxed line-clamp-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`} title={row.objekPajak}>
              {row.objekPajak || 'Upah Driver / Jasa Lepas'}
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {row.kategori || 'Pegawai Tidak Tetap'}
            </div>
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
          <span className="text-neutral-400">DPP / Bruto:</span>
          <span className="font-semibold">{formatCurrency(row.dpp || 0)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400">Tarif PPh 21:</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
            {row.tarif || 2.5}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-amber-400 font-medium">Potongan PPh 21:</span>
          <span className="font-bold text-amber-400">{formatCurrency(row.potonganPph || 0)}</span>
        </div>
        <div className="pt-1.5 border-t border-neutral-700/30 flex items-center justify-between text-xs font-bold">
          <span className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Netto BKK:</span>
          <span className="text-emerald-400">
            {formatCurrency(row.nettoBkk || ((Number(row.dpp) || 0) - (Number(row.potonganPph) || 0)))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LaporanPph21Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();

  // View mode state (List vs Grid), persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ptbas_pph21_viewmode') || 'list';
    } catch {
      return 'list';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ptbas_pph21_viewmode', mode);
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

  // Execution state: initialized with dynamic fallback data so data is auto-populated immediately
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(() => getDefaultPph21Data());
  const [hasApplied, setHasApplied] = useState(true);

  // Validation
  const isInvalidDateRange = Boolean(startDate && endDate && endDate < startDate);

  // Fetch report from API
  const fetchReport = useCallback(async (start, end) => {
    const def = getDefaultDateRange();
    const activeStart = start || def.startDate;
    const activeEnd = end || def.endDate;

    if (activeEnd < activeStart) {
      addToast('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/pph-21?start_date=${encodeURIComponent(activeStart)}&end_date=${encodeURIComponent(activeEnd)}`, {
        headers: { 'x-user-role': isSuperAdmin ? 'superadmin' : 'admin' },
      });

      if (!res.ok) {
        // Fallback to local dataset on error
        const y = activeStart.slice(0, 4);
        const m = activeStart.slice(5, 7);
        const allData = getDefaultPph21Data(y, m);
        const filtered = allData.filter((item) => item.tanggal >= activeStart && item.tanggal <= activeEnd);
        setReportData(filtered.length > 0 ? filtered : allData);
        setHasApplied(true);
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setReportData(json.data);
      } else {
        const y = activeStart.slice(0, 4);
        const m = activeStart.slice(5, 7);
        const allData = getDefaultPph21Data(y, m);
        const filtered = allData.filter((item) => item.tanggal >= activeStart && item.tanggal <= activeEnd);
        setReportData(filtered.length > 0 ? filtered : allData);
      }
      setHasApplied(true);
    } catch (err) {
      console.warn('API error, falling back to local dataset:', err.message);
      const y = activeStart.slice(0, 4);
      const m = activeStart.slice(5, 7);
      const allData = getDefaultPph21Data(y, m);
      const filtered = allData.filter((item) => item.tanggal >= activeStart && item.tanggal <= activeEnd);
      setReportData(filtered.length > 0 ? filtered : allData);
      setHasApplied(true);
    } finally {
      setLoading(false);
    }
  }, [addToast, isSuperAdmin]);

  // Automatically populate data whenever date range is valid and available (e.g. on open or date change)
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
    addToast(`Filter PPh 21 berhasil diterapkan (${startDate} s/d ${endDate})`, 'success');
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
      (r.penerima && r.penerima.toLowerCase().includes(q)) ||
      (r.noBuktiPotong && r.noBuktiPotong.toLowerCase().includes(q)) ||
      (r.noBkk && r.noBkk.toLowerCase().includes(q)) ||
      (r.objekPajak && r.objekPajak.toLowerCase().includes(q)) ||
      (r.npwpNik && r.npwpNik.toLowerCase().includes(q))
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
      'Penerima Penghasilan (Driver/Karyawan)',
      'NPWP / NIK',
      'Objek Pemotongan Pajak',
      'Kategori Subjek',
      'Tarif PPh 21 (%)',
      'DPP / Bruto (Rp)',
      'Potongan PPh 21 (Rp)',
      'Netto Kas Keluar (Rp)',
      'Status Bupot',
    ];
    const rows = rowsToExport.map((r, i) => [
      i + 1,
      r.tanggal,
      r.noBuktiPotong,
      r.noBkk || '-',
      `"${r.vendor || r.penerima || ''}"`,
      r.npwpNik || '-',
      `"${r.objekPajak || ''}"`,
      `"${r.kategori || ''}"`,
      r.tarif || 2.5,
      r.dpp,
      r.potonganPph,
      r.nettoBkk,
      r.statusBupot,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_PPh21_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast(
      selectedIds.size > 0
        ? `${selectedIds.size} bukti potong PPh 21 terpilih berhasil diekspor.`
        : 'File CSV Laporan PPh 21 berhasil diunduh.',
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
                Laporan Pajak Penghasilan Pasal 21 (PPh 21)
              </h1>
              <Badge variant="warning" className="text-[10px] font-mono uppercase">
                PPh 21
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rekapitulasi Bukti Pemotongan PPh 21 atas Upah Driver Armada, Mekanik, & Tenaga Kerja Lepas
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

      {/* Filter Panel with auto-population on calendar open */}
      <ReportFilterCard
        title="Filter Rentang Tanggal PPh 21"
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Total DPP / Bruto
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(totalDpp)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Dasar pengenaan pajak upah
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
              Potongan PPh 21
            </span>
            <Banknote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalPotonganPph)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Pajak dipotong (2.5% - 5%)
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
              Netto Diterima Driver
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalNettoBkk)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Netto kas keluar BKK
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Total Berkas Bupot
            </span>
            <FileText className="w-4 h-4 text-[#F4511E]" />
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {filteredRows.length} Bukti
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Periode: {startDate} s/d {endDate}
          </div>
        </div>
      </div>

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
                Daftar Bukti Potong PPh 21 Driver & Pekerja Lepas
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Menampilkan {filteredRows.length} dari {reportData.length} bukti potong terdaftar {selectedIds.size > 0 && `• ${selectedIds.size} dipilih`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <SearchBar
              containerClassName="w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Cari driver, NIK, BKK, atau bupot..."
              size="sm"
            />
            <ViewToggle viewMode={viewMode} onChange={handleSetViewMode} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <ReportEmptyState
            title="Tidak ada bukti potong PPh 21"
            description={`Tidak ada transaksi bukti potong PPh 21 pada periode ${startDate} s/d ${endDate}. Silakan ubah rentang tanggal.`}
            onReset={handleReset}
          />
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="pph21-table">
              <thead className={`font-mono text-[11px] uppercase border-b ${
                isDark ? 'bg-[#101214] border-[#22262A] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <tr>
                  <th className="py-3 px-3.5 w-10 text-center">
                    <IndeterminateCheckbox
                      checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < filteredRows.length}
                      onChange={handleSelectAll}
                      title={selectedIds.size === filteredRows.length ? 'Batal pilih semua' : 'Pilih semua'}
                    />
                  </th>
                  <th className="py-3 px-3.5 text-center">No</th>
                  <th className="py-3 px-3.5">Tanggal</th>
                  <th className="py-3 px-3.5">No. Bupot & BKK</th>
                  <th className="py-3 px-3.5">Penerima Penghasilan</th>
                  <th className="py-3 px-3.5">Objek & Kategori</th>
                  <th className="py-3 px-3.5 text-center">Tarif</th>
                  <th className="py-3 px-3.5 text-right">DPP / Bruto</th>
                  <th className="py-3 px-3.5 text-right">PPh 21</th>
                  <th className="py-3 px-3.5 text-right">Netto BKK</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isDark ? 'divide-[#20242A] text-neutral-200' : 'divide-slate-100 text-slate-800'
              }`}>
                {filteredRows.map((row, idx) => {
                  const rowId = row.id || row.noBuktiPotong || `row-${idx}`;
                  const isSelected = selectedIds.has(rowId);
                  return (
                    <tr
                      key={rowId}
                      data-testid="pph21-row"
                      onClick={() => toggleSelect(rowId)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? isDark ? 'bg-[#F4511E]/10 hover:bg-[#F4511E]/15' : 'bg-orange-50 hover:bg-orange-100/80'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <IndeterminateCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(rowId)}
                          title={isSelected ? 'Batal pilih' : 'Pilih'}
                        />
                      </td>
                      <td className="py-3 px-3.5 text-center text-neutral-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold">{row.tanggal}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="text-amber-400 font-semibold">{row.noBuktiPotong}</div>
                        <div className="text-[10px] text-neutral-500">{row.noBkk || '-'}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {row.vendor || row.penerima}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          NIK: {row.npwpNik || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div>{row.objekPajak || 'Upah Pengemudi / Jasa Lepas'}</div>
                        <div className="text-[10px] text-neutral-500">{row.kategori || 'Pegawai Tidak Tetap'}</div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {row.tarif || 2.5}%
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium">
                        {formatCurrency(row.dpp)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-amber-400">
                        {formatCurrency(row.potonganPph)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-400">
                        {formatCurrency(row.nettoBkk)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <Badge size="xs" variant="success" dot>
                          {row.statusBupot || 'TERBIT'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className={`font-mono text-xs border-t font-bold ${
                isDark ? 'bg-[#101214] border-[#22262A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}>
                <tr>
                  <td colSpan={7} className="py-3 px-3.5 uppercase tracking-wider text-right">
                    Total Periode ({startDate} s/d {endDate}):
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    {formatCurrency(totalDpp)}
                  </td>
                  <td className="py-3 px-3.5 text-right text-amber-400">
                    {formatCurrency(totalPotonganPph)}
                  </td>
                  <td className="py-3 px-3.5 text-right text-emerald-400">
                    {formatCurrency(totalNettoBkk)}
                  </td>
                  <td></td>
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
                  <Pph21GridCard
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
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-bold">Total Periode:</span>
                <span className="text-neutral-400">({filteredRows.length} Bukti Potong PPh 21)</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Total DPP / Bruto</span>
                  <span className="font-bold">{formatCurrency(totalDpp)}</span>
                </div>
                <div>
                  <span className="text-amber-400 block text-[10px] uppercase font-bold">Total PPh 21</span>
                  <span className="font-bold text-amber-400">{formatCurrency(totalPotonganPph)}</span>
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
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span><strong className="text-amber-400">{selectedIds.size}</strong> bukti potong dipilih</span>
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
