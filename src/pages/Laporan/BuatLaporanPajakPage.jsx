import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  ChevronUp,
  ChevronDown,
  FilterX,
  FileSpreadsheet,
  Printer,
  Receipt,
  Banknote,
  CheckCircle2,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Button } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

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

export default function BuatLaporanPajakPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();

  // Determine report type: 'pph21', 'pph23' or 'ppn'
  const taxType = (params.type || searchParams.get('type') || 'pph23').toLowerCase();
  const isPph21 = taxType === 'pph21' || taxType === 'pph-21' || taxType === 'pasal21' || taxType === 'pasal-21' || taxType === '21';
  const isPph23 = !isPph21 && (taxType === 'pph23' || taxType === 'pph-23' || taxType.includes('pph'));

  // Redirect to official submenus with search params preserved
  useEffect(() => {
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    if (taxType === 'all-in-one' || taxType === 'all') {
      navigate(`/laporan/all-in-one${search}`, { replace: true });
    } else if (taxType === 'ppn') {
      navigate(`/laporan/ppn${search}`, { replace: true });
    } else if (isPph21) {
      navigate(`/laporan/pph-21${search}`, { replace: true });
    } else if (isPph23) {
      navigate(`/laporan/pph-23${search}`, { replace: true });
    }
  }, [taxType, isPph21, isPph23, navigate, searchParams]);

  // Title matching screenshot: "Buat Laporan PPH 21", "Buat Laporan PPH 23", or "Buat Laporan PPN"
  const pageTitle = isPph21 ? 'Buat Laporan PPH 21' : isPph23 ? 'Buat Laporan PPH 23' : 'Buat Laporan PPN';

  // Filter State matching screenshot: auto-populates from URL searchParams or current month
  const [startDate, setStartDate] = useState(() => {
    const urlStart = searchParams.get('startDate') || searchParams.get('start_date');
    if (urlStart) return urlStart;
    return getDefaultDateRange().startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const urlEnd = searchParams.get('endDate') || searchParams.get('end_date');
    if (urlEnd) return urlEnd;
    return getDefaultDateRange().endDate;
  });
  const [filterHidden, setFilterHidden] = useState(false);
  const [hasApplied, setHasApplied] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Guard: Hanya untuk Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center font-mono space-y-4">
        <div className={`p-6 rounded-2xl border max-w-md mx-auto ${
          isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h2 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Akses Dibatasi
          </h2>
          <p className="text-xs">
            Halaman {pageTitle} hanya dapat diakses oleh Super Admin / Pimpinan Direksi PT BAS.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-lg bg-[#F4511E] text-white text-xs font-bold cursor-pointer hover:bg-[#D84315] transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 1. DATA TRANSAKSI PPN 11% (Faktur Penjualan Customer)
  const rawPpnData = [
    {
      id: 'PPN-202611-001',
      tanggal: '2026-11-12',
      tanggalFormatted: '12 Nov 2026',
      noFakturPajak: '010.002-26.00000089',
      noInvoice: 'INV/BAS/2026/11/001',
      customer: 'PT CHIYODA INTERNATIONAL INDONESIA',
      npwp: '01.345.678.9-054.000',
      material: 'Batu Split 1-2 (Proyek Smelter Freeport)',
      dpp: 42500000,
      tarif: 11,
      ppn: 4675000,
      total: 47175000,
      statusFaktur: 'APPROVED DJP',
      statusBayar: 'Lunas',
    },
    {
      id: 'PPN-202611-002',
      tanggal: '2026-11-10',
      tanggalFormatted: '10 Nov 2026',
      noFakturPajak: '010.002-26.00000090',
      noInvoice: 'INV/BAS/2026/11/002',
      customer: 'PT WASKITA BETON PRECAST TBK',
      npwp: '01.889.123.4-051.000',
      material: 'Sirtu Urug Pilihan (Tol KLBM Ruas Bunder)',
      dpp: 38000000,
      tarif: 11,
      ppn: 4180000,
      total: 42180000,
      statusFaktur: 'APPROVED DJP',
      statusBayar: 'Belum Lunas',
    },
    {
      id: 'PPN-202611-003',
      tanggal: '2026-11-08',
      tanggalFormatted: '08 Nov 2026',
      noFakturPajak: '010.002-26.00000091',
      noInvoice: 'INV/BAS/2026/11/003',
      customer: 'PT SEMEN INDONESIA (PERSERO) TBK',
      npwp: '01.001.654.2-052.000',
      material: 'Limestone Super Cor (Tuban Hub)',
      dpp: 24500000,
      tarif: 11,
      ppn: 2695000,
      total: 27195000,
      statusFaktur: 'APPROVED DJP',
      statusBayar: 'Lunas',
    },
    {
      id: 'PPN-202611-004',
      tanggal: '2026-11-05',
      tanggalFormatted: '05 Nov 2026',
      noFakturPajak: '010.002-26.00000092',
      noInvoice: 'INV/BAS/2026/11/004',
      customer: 'PT LION WINGS',
      npwp: '01.222.333.4-053.000',
      material: 'Sirtu Curah Cuci (Pondasi KIG)',
      dpp: 19371600,
      tarif: 11,
      ppn: 2130876,
      total: 21502476,
      statusFaktur: 'APPROVED DJP',
      statusBayar: 'Belum Lunas',
    },
    {
      id: 'PPN-202611-005',
      tanggal: '2026-11-03',
      tanggalFormatted: '03 Nov 2026',
      noFakturPajak: '010.002-26.00000093',
      noInvoice: 'INV/BAS/2026/11/005',
      customer: 'PT MASPION INDUSTRIAL ESTATE',
      npwp: '01.777.888.9-055.000',
      material: 'Base Course A (Dermaga Pelabuhan Manyar)',
      dpp: 8200000,
      tarif: 11,
      ppn: 902000,
      total: 9102000,
      statusFaktur: 'APPROVED DJP',
      statusBayar: 'Lunas',
    },
  ];

  // 2. DATA TRANSAKSI PPH 23 (Potongan BKK Vendor / Armada)
  const rawPph23Data = [
    {
      id: 'PPH-202611-001',
      tanggal: '2026-11-11',
      tanggalFormatted: '11 Nov 2026',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/001',
      noBkk: 'BKK/2026/11/0042',
      vendor: 'UKHY DIAN (Armada Dump Truck Tronton)',
      npwpNik: '3525011204850003',
      objekPajak: 'Jasa Angkut Material Tambang',
      kategori: 'Jasa Angkut (2.0%)',
      tarif: 2.0,
      dpp: 15407100,
      potonganPph: 308142,
      nettoBkk: 15098958,
      statusBupot: 'TERBIT',
    },
    {
      id: 'PPH-202611-002',
      tanggal: '2026-11-09',
      tanggalFormatted: '09 Nov 2026',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/002',
      noBkk: 'BKK/2026/11/0043',
      vendor: 'PT TENANG JAYA SEJAHTERA',
      npwpNik: '02.451.980.1-604.000',
      objekPajak: 'Bahan Galian Non-Logam (Limestone Padat)',
      kategori: 'Galian Tambang Padat (2.65%)',
      tarif: 2.65,
      dpp: 22800000,
      potonganPph: 604200,
      nettoBkk: 22195800,
      statusBupot: 'TERBIT',
    },
    {
      id: 'PPH-202611-003',
      tanggal: '2026-11-07',
      tanggalFormatted: '07 Nov 2026',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/003',
      noBkk: 'BKK/2026/11/0044',
      vendor: 'PT SOYO APIK (Logistik & Angkutan Curah)',
      npwpNik: '03.112.445.6-601.000',
      objekPajak: 'Jasa Angkut Sirtu Gresik-Manyar',
      kategori: 'Jasa Angkut (2.0%)',
      tarif: 2.0,
      dpp: 18416450,
      potonganPph: 368329,
      nettoBkk: 18048121,
      statusBupot: 'TERBIT',
    },
    {
      id: 'PPH-202611-004',
      tanggal: '2026-11-05',
      tanggalFormatted: '05 Nov 2026',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/004',
      noBkk: 'BKK/2026/11/0045',
      vendor: 'CV BUMI MAKMUR SENTOSA',
      npwpNik: '01.992.331.0-602.000',
      objekPajak: 'Batu Boulder Pondasi (Tambang Padat)',
      kategori: 'Galian Tambang Padat (2.65%)',
      tarif: 2.65,
      dpp: 12500000,
      potonganPph: 331250,
      nettoBkk: 12168750,
      statusBupot: 'TERBIT',
    },
    {
      id: 'PPH-202611-005',
      tanggal: '2026-11-02',
      tanggalFormatted: '02 Nov 2026',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/005',
      noBkk: 'BKK/2026/11/0046',
      vendor: 'SUMARNO (Driver Tronton Hino)',
      npwpNik: '3525041008800002',
      objekPajak: 'Jasa Angkut Abu Batu Tuban-Gresik',
      kategori: 'Jasa Angkut (2.0%)',
      tarif: 2.0,
      dpp: 7800000,
      potonganPph: 156000,
      nettoBkk: 7644000,
      statusBupot: 'TERBIT',
    },
  ];

  // Filtering based on date and search query
  const filteredData = useMemo(() => {
    const list = isPph23 ? rawPph23Data : rawPpnData;
    return list.filter((item) => {
      // Date filter
      if (startDate && item.tanggal < startDate) return false;
      if (endDate && item.tanggal > endDate) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (isPph23) {
          const match =
            item.vendor.toLowerCase().includes(q) ||
            item.noBuktiPotong.toLowerCase().includes(q) ||
            item.noBkk.toLowerCase().includes(q) ||
            item.objekPajak.toLowerCase().includes(q);
          if (!match) return false;
        } else {
          const match =
            item.customer.toLowerCase().includes(q) ||
            item.noFakturPajak.toLowerCase().includes(q) ||
            item.noInvoice.toLowerCase().includes(q) ||
            item.material.toLowerCase().includes(q);
          if (!match) return false;
        }
      }
      return true;
    });
  }, [isPph23, startDate, endDate, searchQuery]);

  // Aggregate metrics
  const totalDpp = filteredData.reduce((acc, row) => acc + row.dpp, 0);
  const totalPajak = filteredData.reduce((acc, row) => {
    return acc + (isPph23 ? row.potonganPph : row.ppn);
  }, 0);

  const handleStartDateChange = (val) => {
    setStartDate(val);
    // Jika tanggal akhir sudah diisi dan tanggal mulai baru melebihi tanggal akhir,
    // otomatis sesuaikan tanggal akhir agar tidak sebelum tanggal mulai
    if (endDate && val && val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val) => {
    if (startDate && val && val < startDate) {
      addToast('Tanggal akhir tidak boleh sebelum tanggal mulai', 'warning');
      return;
    }
    setEndDate(val);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate && endDate < startDate) {
      addToast('Tanggal akhir tidak boleh sebelum tanggal mulai', 'error');
      return;
    }
    setHasApplied(true);
    addToast(`Filter berhasil diterapkan untuk periode ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`, 'success');
  };

  const handleResetFilter = () => {
    const def = getDefaultDateRange();
    setStartDate(def.startDate);
    setEndDate(def.endDate);
    setSearchQuery('');
    addToast('Filter tanggal dan pencarian berhasil direset ke bulan berjalan.', 'info');
  };

  const handleExportCsv = () => {
    const fileName = isPph23 ? 'Laporan-PPh23' : 'Laporan-PPN-11';
    addToast(`Menyiapkan berkas ekspor CSV ${fileName}...`, 'info');
    setTimeout(() => {
      addToast(`Unduhan CSV siap: ${fileName}.csv tersimpan`, 'success');
    }, 400);
  };

  return (
    <div className={`min-h-screen select-none transition-colors ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* ── TOP APP BAR MATCHING SCREENSHOT ── */}
      <div className={`sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b transition-colors ${
        isDark ? 'bg-[#111315] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-white hover:bg-white/10 active:bg-white/20'
                : 'text-slate-800 hover:bg-slate-100 active:bg-slate-200'
            }`}
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className={`text-sm sm:text-base font-semibold tracking-tight truncate ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {pageTitle}
          </h1>
        </div>

        {/* Top Right Action: Reset / Toggle Filter Icon */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetFilter}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Reset Filter"
            aria-label="Reset Filter"
          >
            <FilterX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-4xl mx-auto p-4 sm:p-5 space-y-4">
        {/* ── FILTER CARD CONTAINER EXACTLY MATCHING SCREENSHOT ── */}
        <div className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-colors shadow-lg ${
          isDark
            ? 'bg-[#1A1D21] border-[#282C32] shadow-black/60'
            : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
          {/* Collapsible Inputs & Terapkan Button */}
          <AnimatePresence initial={false}>
            {!filterHidden && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3 overflow-hidden"
              >
                {/* 2 Date Inputs: Mulai & Akhir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Input Mulai */}
                  <div className={`flex items-center rounded-xl border px-3.5 py-3 transition-colors ${
                    isDark
                      ? 'bg-[#22262B] border-[#2E333B] text-neutral-200 focus-within:border-[#F4511E]'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus-within:border-[#F4511E]'
                  }`}>
                    <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block leading-tight">
                        Mulai
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        placeholder="Mulai"
                        className="w-full bg-transparent text-xs font-mono font-medium focus:outline-none cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Input Akhir */}
                  <div className={`flex items-center rounded-xl border px-3.5 py-3 transition-colors ${
                    startDate && endDate && endDate < startDate
                      ? 'border-rose-500 focus-within:border-rose-500 text-rose-300'
                      : isDark
                        ? 'bg-[#22262B] border-[#2E333B] text-neutral-200 focus-within:border-[#F4511E]'
                        : 'bg-slate-50 border-slate-300 text-slate-800 focus-within:border-[#F4511E]'
                  }`}>
                    <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block leading-tight">
                        Akhir
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        placeholder="Akhir"
                        className="w-full bg-transparent text-xs font-mono font-medium focus:outline-none cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {startDate && endDate && endDate < startDate && (
                  <p className="text-[11px] text-rose-500 font-medium font-mono px-1">
                    Tanggal akhir tidak boleh sebelum tanggal mulai
                  </p>
                )}

                {/* Full-Width Orange Button: TERAPKAN */}
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:bg-[#C93C15] text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F4511E]/25 cursor-pointer text-center"
                >
                  TERAPKAN
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button: Sembunyikan Filter ^ / Tampilkan Filter v */}
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                const nextHidden = !filterHidden;
                setFilterHidden(nextHidden);
                if (!nextHidden) {
                  if (!startDate || !endDate) {
                    const def = getDefaultDateRange();
                    if (!startDate) setStartDate(def.startDate);
                    if (!endDate) setEndDate(def.endDate);
                  }
                  setHasApplied(true);
                }
              }}
              className={`px-4 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#181B1F] border-[#2C3138] hover:border-neutral-500 text-neutral-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>{filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}</span>
              {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── GENERATED TAX REPORT VIEW (BELOW FILTER CARD) ── */}
        {hasApplied && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 pt-1"
          >
            {/* Header Strip with Summary & Quick Export Actions */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isPph23 ? 'text-emerald-400' : 'text-[#FF7043]'
                  }`}>
                    {isPph23 ? 'Bukti Pemotongan PPh 23' : 'Faktur Pajak Keluaran PPN 11%'}
                  </span>
                  <Badge size="xs" variant={isPph23 ? 'success' : 'primary'}>
                    {filteredData.length} Transaksi
                  </Badge>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                  Periode: <strong>{startDate || 'Awal'}</strong> s/d <strong>{endDate || 'Akhir'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <Button
                  size="xs"
                  variant="outline"
                  icon={FileSpreadsheet}
                  onClick={handleExportCsv}
                  title="Ekspor CSV"
                >
                  Ekspor CSV
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  icon={Printer}
                  onClick={() => window.print()}
                  title="Cetak Berkas Laporan"
                >
                  Cetak Laporan
                </Button>
              </div>
            </div>

            {/* Quick Search Within Filtered Results */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isPph23 ? 'Cari Vendor, Driver, No BKK, atau Bukti Potong...' : 'Cari Customer, No Faktur Pajak, atau Invoice...'}
                className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs transition-colors border ${
                  isDark
                    ? 'bg-[#16181B] border-[#24282C] text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4511E]'
                }`}
              />
            </div>

            {/* Table of Filtered Tax Transactions */}
            <div className={`rounded-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#14171A] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-mono uppercase text-[11px] ${
                      isDark ? 'bg-[#181B1E] border-[#24282C] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-3 px-3.5">No</th>
                      <th className="py-3 px-3.5">
                        {isPph23 ? 'Bukti Potong & No. BKK' : 'Faktur Pajak & Tanggal'}
                      </th>
                      <th className="py-3 px-3.5">
                        {isPph23 ? 'Vendor / Sopir & NIK/NPWP' : 'Customer & NPWP'}
                      </th>
                      <th className="py-3 px-3.5">
                        {isPph23 ? 'Objek Pajak' : 'Material / Pekerjaan'}
                      </th>
                      <th className="py-3 px-3.5 text-right">DPP (Rp)</th>
                      <th className="py-3 px-3.5 text-center">Tarif</th>
                      <th className="py-3 px-3.5 text-right">
                        {isPph23 ? 'Potongan PPh (Rp)' : 'PPN 11% (Rp)'}
                      </th>
                      <th className="py-3 px-3.5 text-right">
                        {isPph23 ? 'Net Kas Keluar (Rp)' : 'Total Tagihan (Rp)'}
                      </th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-neutral-500">
                          Tidak ada transaksi yang cocok untuk periode tanggal yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>

                          {/* PPh 23 or PPN identifier */}
                          <td className="py-3 px-3.5">
                            <div className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {isPph23 ? row.noBuktiPotong : row.noFakturPajak}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{row.tanggalFormatted}</span>
                              <span>•</span>
                              <span className={isPph23 ? 'text-emerald-400' : 'text-[#FF7043]'}>
                                {isPph23 ? row.noBkk : row.noInvoice}
                              </span>
                            </div>
                          </td>

                          {/* Party */}
                          <td className="py-3 px-3.5">
                            <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                              {isPph23 ? row.vendor : row.customer}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500">
                              {isPph23 ? `ID: ${row.npwpNik}` : `NPWP: ${row.npwp}`}
                            </div>
                          </td>

                          {/* Item / Objek */}
                          <td className="py-3 px-3.5">
                            <div className={`text-[11px] ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                              {isPph23 ? row.objekPajak : row.material}
                            </div>
                            {isPph23 && (
                              <div className="text-[10px] text-neutral-500">{row.kategori}</div>
                            )}
                          </td>

                          {/* DPP */}
                          <td className={`py-3 px-3.5 text-right font-mono font-medium ${
                            isDark ? 'text-neutral-200' : 'text-slate-800'
                          }`}>
                            {formatCurrency(row.dpp)}
                          </td>

                          {/* Tarif */}
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                isPph23
                                  ? row.tarif === 2.0
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-orange-500/10 text-[#FF7043] border-orange-500/20'
                              }`}
                            >
                              {row.tarif}%
                            </span>
                          </td>

                          {/* Pajak */}
                          <td className={`py-3 px-3.5 text-right font-mono font-bold ${
                            isPph23 ? 'text-emerald-400' : 'text-[#F4511E]'
                          }`}>
                            {formatCurrency(isPph23 ? row.potonganPph : row.ppn)}
                          </td>

                          {/* Total / Netto */}
                          <td className={`py-3 px-3.5 text-right font-mono font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {formatCurrency(isPph23 ? row.nettoBkk : row.total)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center">
                            <Badge
                              size="xs"
                              variant={isPph23 ? 'success' : row.statusBayar === 'Lunas' ? 'success' : 'warning'}
                              dot
                            >
                              {isPph23 ? row.statusBupot : row.statusBayar}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className={`p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t font-mono text-xs ${
                isDark ? 'bg-[#101215] border-[#24282C] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div>
                  Total <strong>{filteredData.length}</strong> transaksi terpilih
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    Total Pajak:{' '}
                    <strong className={isPph23 ? 'text-emerald-400' : 'text-[#F4511E]'}>
                      {formatCurrency(totalPajak)}
                    </strong>
                  </span>
                  <span>
                    Total DPP:{' '}
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                      {formatCurrency(totalDpp)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}