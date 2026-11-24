import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  HardHat,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Badge, Button, SearchBar } from '../../components/ui';
import SelectField from '../../components/form/SelectField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
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

export default function LaporanSupplierPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();
  const { suppliers: contextSuppliers, bkkList } = useData();

  // Filters state: auto-populates from URL query params or current month on initial open
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
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
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);

  // Available suppliers options
  const supplierOptions = useMemo(() => {
    if (!contextSuppliers || !Array.isArray(contextSuppliers)) return [];
    return contextSuppliers.map((s) => ({
      value: s.id,
      label: s.name + (s.penerima && s.penerima !== s.name ? ` (a/n ${s.penerima})` : ''),
    }));
  }, [contextSuppliers]);

  // Set default selected supplier if not set
  useEffect(() => {
    if (!selectedSupplierId && supplierOptions.length > 0) {
      setSelectedSupplierId(supplierOptions[0].value);
    }
  }, [supplierOptions, selectedSupplierId]);

  // Validation
  const isInvalidDateRange = Boolean(startDate && endDate && endDate < startDate);
  const isFormValid = Boolean(selectedSupplierId && startDate && endDate && !isInvalidDateRange);

  // Fetch report from API
  const fetchReport = useCallback(async (supplierId, start, end) => {
    if (!supplierId) {
      addToast('Silakan pilih supplier terlebih dahulu.', 'warning');
      return;
    }
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
      const res = await fetch(
        `/api/reports/supplier?supplier_id=${encodeURIComponent(supplierId)}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`,
        {
          headers: { 'x-user-role': isSuperAdmin ? 'superadmin' : 'admin' },
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Gagal memuat laporan supplier (${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setSupplierInfo(json.data.supplier);
        setTransactions(json.data.transactions || []);
      } else {
        // Fallback filter from DataContext
        fallbackLocalData(supplierId, start, end);
      }
      setHasApplied(true);
    } catch (err) {
      console.warn('API error, falling back to local context data:', err.message);
      fallbackLocalData(supplierId, start, end);
      setHasApplied(true);
    } finally {
      setLoading(false);
    }
  }, [addToast, isSuperAdmin, contextSuppliers, bkkList]);

  // Fallback from local context data
  const fallbackLocalData = (supplierId, start, end) => {
    const s = (contextSuppliers || []).find((item) => item.id === supplierId);
    setSupplierInfo(s || null);

    if (!s) {
      setTransactions([]);
      return;
    }

    const sName = s.name.toLowerCase();
    const sPenerima = (s.penerima || '').toLowerCase();

    const filtered = (bkkList || []).filter((b) => {
      const p = (b.perusahaan || '').toLowerCase();
      const r = (b.penerima || '').toLowerCase();
      const matchSup = p.includes(sName) || r.includes(sName) || (sPenerima && (p.includes(sPenerima) || r.includes(sPenerima)));
      if (!matchSup) return false;
      if (start && b.tanggal && b.tanggal < start) return false;
      if (end && b.tanggal && b.tanggal > end) return false;
      return true;
    });

    setTransactions(filtered);
  };

  // Initial load when supplier is selected
  useEffect(() => {
    if (selectedSupplierId && !hasApplied) {
      fetchReport(selectedSupplierId, startDate, endDate);
    }
  }, [selectedSupplierId]);

  const handleApply = () => {
    if (!isFormValid) {
      if (!selectedSupplierId) {
        addToast('Pilih supplier terlebih dahulu.', 'warning');
      } else if (isInvalidDateRange) {
        addToast('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.', 'error');
      } else {
        addToast('Lengkapi parameter tanggal mulai dan akhir.', 'warning');
      }
      return;
    }
    fetchReport(selectedSupplierId, startDate, endDate);
    const supObj = (contextSuppliers || []).find((s) => s.id === selectedSupplierId);
    addToast(`Filter Supplier diterapkan untuk ${supObj?.name || 'Supplier'} (${startDate} s/d ${endDate})`, 'success');
  };

  const handleReset = () => {
    const def = getDefaultDateRange();
    if (supplierOptions.length > 0) {
      setSelectedSupplierId(supplierOptions[0].value);
    }
    setStartDate(def.startDate);
    setEndDate(def.endDate);
    setSearchQuery('');
    if (supplierOptions.length > 0) {
      fetchReport(supplierOptions[0].value, def.startDate, def.endDate);
    }
    addToast('Filter supplier berhasil direset ke bulan berjalan.', 'info');
  };

  // Filtered rows for client-side search query
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter((r) =>
      (r.kodeTransaksi && r.kodeTransaksi.toLowerCase().includes(q)) ||
      (r.material && r.material.toLowerCase().includes(q)) ||
      (r.rekeningTujuan && r.rekeningTujuan.toLowerCase().includes(q)) ||
      (r.statusBayar && r.statusBayar.toLowerCase().includes(q))
    );
  }, [transactions, searchQuery]);

  // Aggregate totals
  const totalVolume = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.kubikasi || r.volume) || 0), 0), [filteredRows]);
  const totalRitase = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.ritaseCount) || 1), 0), [filteredRows]);
  const totalAmount = useMemo(() => filteredRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), [filteredRows]);
  const totalLunas = useMemo(() => filteredRows
    .filter((r) => r.statusBayar === 'Lunas')
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0), [filteredRows]);
  const sisaBelumDibayar = totalAmount - totalLunas;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      addToast('Tidak ada data untuk diekspor.', 'info');
      return;
    }
    const headers = [
      'No',
      'Tanggal',
      'No. Transaksi (BKK)',
      'Material',
      'Ritase',
      'Volume (m3)',
      'Harga Satuan (Rp)',
      'Total Pembayaran (Rp)',
      'Rekening Tujuan',
      'Status Bayar',
      'Tanggal Bayar',
    ];
    const rows = filteredRows.map((r, i) => [
      i + 1,
      r.tanggal,
      r.kodeTransaksi,
      `"${r.material || ''}"`,
      r.ritaseCount || 1,
      r.kubikasi || r.volume || 0,
      r.hargaSatuan || 0,
      r.amount || 0,
      `"${r.rekeningTujuan || ''}"`,
      r.statusBayar || 'Belum Dibayar',
      r.tanggalBayar || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Supplier_${supplierInfo?.name ? supplierInfo.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Supplier'}_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast('File CSV Laporan Supplier berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold shadow-xs">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Laporan Supplier
              </h1>
              <Badge variant="warning" className="text-[10px] font-mono uppercase">
                Pengadaan & Kas Keluar
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rekapitulasi Pembelian Material Tambang, Ritase Kirim, & Pembayaran Kas Keluar (BKK) Supplier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        title="Parameter Filter Laporan Supplier"
        onApply={handleApply}
        onReset={handleReset}
        loading={loading}
        applyDisabled={!isFormValid}
        applyLabel="Terapkan Filter"
      >
        <div className="space-y-4">
          {/* Supplier Searchable Select */}
          <div>
            <SelectField
              icon={HardHat}
              label="Pilih Supplier / Vendor"
              value={selectedSupplierId}
              onChange={(val) => setSelectedSupplierId(val)}
              options={supplierOptions}
              searchable
              placeholder="Cari nama supplier / vendor..."
              required
              disabled={loading}
              helper="Supplier wajib dipilih untuk menampilkan rincian laporan pengadaan"
            />
          </div>

          {/* Date Range */}
          <div>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              disabled={loading}
              error={isInvalidDateRange ? 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.' : ''}
            />
          </div>
        </div>
      </ReportFilterCard>

      {/* Supplier Profile Info Bar (if supplier selected) */}
      {supplierInfo && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#16191D] border-[#22262A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF7043] flex items-center justify-center font-bold">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {supplierInfo.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#22262A] text-neutral-300">
                  {supplierInfo.idProgram || supplierInfo.id}
                </span>
                {supplierInfo.pkp ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    PKP
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-700 text-neutral-300">
                    NON-PKP
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Penerima: <strong className="text-neutral-300">{supplierInfo.penerima || '-'}</strong> • Telp: {supplierInfo.telepon || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
              isDark ? 'bg-[#111315] border-[#24282D]' : 'bg-white border-slate-200'
            }`}>
              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
              <span>{supplierInfo.bank || 'BCA'}: <strong className="text-[#FF7043]">{supplierInfo.noRekening || '-'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Table Card */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'border-[#22262A] bg-[#181B1E]' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
              isDark ? 'text-neutral-200' : 'text-slate-800'
            }`}>
              Daftar Transaksi Pengadaan & Kas Keluar (BKK)
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Menampilkan {filteredRows.length} dari {transactions.length} transaksi pengadaan supplier
            </p>
          </div>

          <SearchBar
            containerClassName="w-full sm:w-72"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Cari No. BKK, Material, Rekening..."
            size="sm"
          />
        </div>

        {/* Table Content */}
        {filteredRows.length === 0 ? (
          <div className="p-6">
            <ReportEmptyState
              title="Tidak ada data transaksi untuk supplier dan rentang tanggal yang dipilih"
              message={`Tidak ditemukan catatan transaksi kas keluar (BKK) untuk ${supplierInfo?.name || 'supplier'} pada rentang ${startDate} s/d ${endDate}.`}
              onReset={handleReset}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                  isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">No. BKK / Transaksi</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3 text-center">Ritase</th>
                  <th className="py-3 px-3 text-right">Volume (m³)</th>
                  <th className="py-3 px-3 text-right">Harga Satuan (Rp)</th>
                  <th className="py-3 px-3 text-right">Total Pembayaran (Rp)</th>
                  <th className="py-3 px-3">Rekening Tujuan / Bank</th>
                  <th className="py-3 px-3 text-center">Status Bayar</th>
                  <th className="py-3 px-3">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
              }`}>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-neutral-400 text-[11px] font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.tanggal}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">
                      {row.kodeTransaksi || row.id}
                    </td>
                    <td className="py-3 px-3 font-sans max-w-[180px] truncate" title={row.material}>
                      {row.material || 'Material Tambang'}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        {row.ritaseCount || 1} Rit
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                      {formatVolume(row.kubikasi || row.volume || 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-400 whitespace-nowrap">
                      {formatCurrency(row.hargaSatuan || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">
                      {formatCurrency(row.amount || 0)}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-neutral-300 whitespace-nowrap font-sans">
                      {row.rekeningTujuan || supplierInfo?.noRekening || '-'}
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
                    <td className="py-3 px-3 text-[11px] text-neutral-400 whitespace-nowrap">
                      {row.tanggalBayar || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Summary Total Footer Row */}
              <tfoot>
                <tr className={`border-t-2 font-mono font-bold ${
                  isDark ? 'border-[#2E3339] bg-[#181B1E] text-white' : 'border-slate-300 bg-slate-100 text-slate-900'
                }`}>
                  <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                    Total ({filteredRows.length} Transaksi):
                  </td>
                  <td className="py-3 px-3 text-center text-xs">
                    {totalRitase} Rit
                  </td>
                  <td className="py-3 px-3 text-right text-xs">
                    {formatVolume(totalVolume)}
                  </td>
                  <td className="py-3 px-3 text-center">-</td>
                  <td className="py-3 px-3 text-right text-xs text-[#FF7043]">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-[10px] text-neutral-400 font-sans">
                    Lunas: <span className="text-emerald-400 font-bold">{formatCurrency(totalLunas)}</span> | Belum: <span className="text-amber-400 font-bold">{formatCurrency(sisaBelumDibayar)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
