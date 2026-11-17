import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle2,
  Download,
  Search,
  ExternalLink,
  ChevronRight,
  Landmark,
  Building2,
  HardHat,
  ArrowUpRight,
  Filter,
  Receipt,
  Banknote,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import JenisLaporanPajakModal from '../../components/laporan/JenisLaporanPajakModal';

export default function LaporanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { isDark } = useApp();

  // Dialog modal Jenis Laporan Pajak
  const [taxModalOpen, setTaxModalOpen] = useState(false);

  // Active tab synchronized with URL (?tab=...)
  const tabFromUrl = searchParams.get('tab') || 'pajak-ppn';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPphCategory, setFilterPphCategory] = useState('ALL');
  const [filterPpnStatus, setFilterPpnStatus] = useState('ALL');
  const [filterRekapanStatus, setFilterRekapanStatus] = useState('ALL');
  const [filterRekapanCustomer, setFilterRekapanCustomer] = useState('ALL');
  const [filterPiutangStatus, setFilterPiutangStatus] = useState('ALL');
  const [filterHutangStatus, setFilterHutangStatus] = useState('ALL');

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('laporan_viewMode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('laporan_viewMode', mode);
    } catch {}
  };

  useEffect(() => {
    const currentParam = searchParams.get('tab');
    if (currentParam && currentParam !== activeTab) {
      setActiveTab(currentParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setSearchQuery('');
  };

  // Guard: Pusat Laporan hanya untuk Super Admin
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
            Fitur Pusat Laporan hanya dapat diakses oleh Super Admin / Pimpinan Direksi.
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

  // 1. DATASET LAPORAN PAJAK PERTAMBAHAN NILAI (PPN 11%)
  const ppnData = [
    {
      id: 'PPN-202611-001',
      noFakturPajak: '010.002-26.00000089',
      noInvoice: 'INV/BAS/2026/11/001',
      tanggal: '12 Nov 2026',
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
      noFakturPajak: '010.002-26.00000090',
      noInvoice: 'INV/BAS/2026/11/002',
      tanggal: '10 Nov 2026',
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
      noFakturPajak: '010.002-26.00000091',
      noInvoice: 'INV/BAS/2026/11/003',
      tanggal: '08 Nov 2026',
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
      noFakturPajak: '010.002-26.00000092',
      noInvoice: 'INV/BAS/2026/11/004',
      tanggal: '05 Nov 2026',
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
      noFakturPajak: '010.002-26.00000093',
      noInvoice: 'INV/BAS/2026/11/005',
      tanggal: '03 Nov 2026',
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

  // 2. DATASET LAPORAN PAJAK PENGHASILAN PASAL 23 (PPh 23)
  const pph23Data = [
    {
      id: 'PPH-202611-001',
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/001',
      noBkk: 'BKK/2026/11/0042',
      tanggal: '11 Nov 2026',
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
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/002',
      noBkk: 'BKK/2026/11/0043',
      tanggal: '09 Nov 2026',
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
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/003',
      noBkk: 'BKK/2026/11/0044',
      tanggal: '07 Nov 2026',
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
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/004',
      noBkk: 'BKK/2026/11/0045',
      tanggal: '05 Nov 2026',
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
      noBuktiPotong: 'BUPOT-23/BAS/2026/11/005',
      noBkk: 'BKK/2026/11/0046',
      tanggal: '02 Nov 2026',
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

  // 3. DATASET REKAPAN BELUM INVOICE
  const pendingRekapanList = [
    {
      id: 'REK-202611-0001',
      tanggal: '07 Nov 2026',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      totalSj: 6,
      volume: 81.09,
      estimasiTagihan: 9730800,
      daysPending: 5,
    },
    {
      id: 'REK-202611-0002',
      tanggal: '05 Nov 2026',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      totalSj: 6,
      volume: 80.34,
      estimasiTagihan: 9640800,
      daysPending: 7,
    },
    {
      id: 'REK-202611-0003',
      tanggal: '03 Nov 2026',
      poNumber: 'PO-SI-2026-014',
      customer: 'PT SEMEN INDONESIA',
      material: 'Limestone Super',
      totalSj: 8,
      volume: 124.5,
      estimasiTagihan: 16185000,
      daysPending: 9,
    },
    {
      id: 'REK-202611-0004',
      tanggal: '01 Nov 2026',
      poNumber: 'PO-SBI-2026-002',
      customer: 'PT SOLUSI BANGUN INDONESIA',
      material: 'Batu Boulder',
      totalSj: 5,
      volume: 72.15,
      estimasiTagihan: 8658000,
      daysPending: 11,
    },
  ];

  // 4. DATASET PIUTANG CUSTOMER (AR)
  const piutangCustomerList = [
    {
      id: 'CUST-001',
      customer: 'PT LION WINGS',
      badanUsaha: 'PT',
      totalInvoice: 48250000,
      terbayar: 25000000,
      sisaPiutang: 23250000,
      jatuhTempo: '15 Nov 2026',
      aging: 'Lancar (< 30 hari)',
      status: 'Lancar',
      invNumbers: ['INV-202611-001', 'INV-202611-003'],
    },
    {
      id: 'CUST-002',
      customer: 'PT SEMEN INDONESIA',
      badanUsaha: 'PT',
      totalInvoice: 36000000,
      terbayar: 0,
      sisaPiutang: 36000000,
      jatuhTempo: '08 Nov 2026',
      aging: 'Lewat Jatuh Tempo (4 hari)',
      status: 'Jatuh Tempo',
      invNumbers: ['INV-202610-098'],
    },
    {
      id: 'CUST-003',
      customer: 'PT SOLUSI BANGUN INDONESIA',
      badanUsaha: 'PT',
      totalInvoice: 25000000,
      terbayar: 0,
      sisaPiutang: 25000000,
      jatuhTempo: '20 Nov 2026',
      aging: 'Lancar (< 30 hari)',
      status: 'Lancar',
      invNumbers: ['INV-202611-002'],
    },
  ];

  // 5. DATASET HUTANG BKK SUPPLIER (AP)
  const hutangSupplierList = [
    {
      id: 'SUP-001',
      supplier: 'UKHY DIAN',
      bank: 'BCA - 6150832452',
      atasNama: 'UKHY DIAN',
      totalBkk: 15407100,
      terbayar: 7703550,
      sisaHutang: 7703550,
      ritaseCount: 6,
      status: 'Siap Cair',
    },
    {
      id: 'SUP-002',
      supplier: 'PT TENANG JAYA SEJAHTERA',
      bank: 'BCA - 0503800800',
      atasNama: 'ARIF NURCAHYADI',
      totalBkk: 22800000,
      terbayar: 10000000,
      sisaHutang: 12800000,
      ritaseCount: 10,
      status: 'Jadwal Mingguan',
    },
    {
      id: 'SUP-003',
      supplier: 'PT SOYO APIK',
      bank: 'BCA - 829-189-1888',
      atasNama: 'PT SOYO APIK',
      totalBkk: 18416450,
      terbayar: 0,
      sisaHutang: 18416450,
      ritaseCount: 14,
      status: 'Siap Cair',
    },
  ];

  // Calculated KPI Aggregates for PPN
  const totalDppPpn = ppnData.reduce((acc, row) => acc + row.dpp, 0);
  const totalPpnDipungut = ppnData.reduce((acc, row) => acc + row.ppn, 0);
  const totalPpnLunas = ppnData.filter(r => r.statusBayar === 'Lunas').reduce((acc, r) => acc + r.ppn, 0);

  // Calculated KPI Aggregates for PPh 23
  const totalBrutoPph = pph23Data.reduce((acc, row) => acc + row.dpp, 0);
  const totalPotonganPph = pph23Data.reduce((acc, row) => acc + row.potonganPph, 0);
  const totalPphJasa = pph23Data.filter(r => r.tarif === 2.0).reduce((acc, r) => acc + r.potonganPph, 0);
  const totalPphPadat = pph23Data.filter(r => r.tarif === 2.65).reduce((acc, r) => acc + r.potonganPph, 0);

  // Filtered PPN data
  const filteredPpn = useMemo(() => {
    return ppnData.filter((row) => {
      const matchSearch =
        row.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.noInvoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.noFakturPajak.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.material.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        filterPpnStatus === 'ALL' || row.statusBayar === filterPpnStatus;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, filterPpnStatus]);

  // Filtered PPh 23 data
  const filteredPph = useMemo(() => {
    return pph23Data.filter((row) => {
      const matchSearch =
        row.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.noBkk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.noBuktiPotong.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.objekPajak.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        filterPphCategory === 'ALL' ||
        (filterPphCategory === '2.0' && row.tarif === 2.0) ||
        (filterPphCategory === '2.65' && row.tarif === 2.65);
      return matchSearch && matchCat;
    });
  }, [searchQuery, filterPphCategory]);

  // Unique customers for Rekapan filter dropdown
  const rekapanCustomers = useMemo(() => {
    return ['ALL', ...new Set(pendingRekapanList.map((r) => r.customer))];
  }, []);

  // Filtered Rekapan data
  const filteredRekapan = useMemo(() => {
    return pendingRekapanList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.poNumber.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        item.tanggal.toLowerCase().includes(q);

      const matchStatus =
        filterRekapanStatus === 'ALL' ||
        (filterRekapanStatus === '<=7' && item.daysPending <= 7) ||
        (filterRekapanStatus === '>7' && item.daysPending > 7);

      const matchCustomer =
        filterRekapanCustomer === 'ALL' || item.customer === filterRekapanCustomer;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [searchQuery, filterRekapanStatus, filterRekapanCustomer]);

  // Filtered Piutang data
  const filteredPiutang = useMemo(() => {
    return piutangCustomerList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.jatuhTempo.toLowerCase().includes(q) ||
        item.aging.toLowerCase().includes(q) ||
        item.invNumbers.some((inv) => inv.toLowerCase().includes(q));

      const matchStatus =
        filterPiutangStatus === 'ALL' || item.status === filterPiutangStatus;

      return matchSearch && matchStatus;
    });
  }, [searchQuery, filterPiutangStatus]);

  // Filtered Hutang data
  const filteredHutang = useMemo(() => {
    return hutangSupplierList.filter((sup) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sup.id.toLowerCase().includes(q) ||
        sup.supplier.toLowerCase().includes(q) ||
        sup.bank.toLowerCase().includes(q) ||
        sup.atasNama.toLowerCase().includes(q);

      const matchStatus =
        filterHutangStatus === 'ALL' || sup.status === filterHutangStatus;

      return matchSearch && matchStatus;
    });
  }, [searchQuery, filterHutangStatus]);

  // Dynamic totals for summary cards
  const totalEstimasiRekapan = useMemo(() => {
    return filteredRekapan.reduce((acc, r) => acc + r.estimasiTagihan, 0);
  }, [filteredRekapan]);

  const totalSisaPiutang = useMemo(() => {
    return filteredPiutang.reduce((acc, c) => acc + c.sisaPiutang, 0);
  }, [filteredPiutang]);

  const totalSisaHutang = useMemo(() => {
    return filteredHutang.reduce((acc, s) => acc + s.sisaHutang, 0);
  }, [filteredHutang]);

  const handleExportCsv = (title) => {
    addToast(`Menyiapkan berkas ekspor CSV: ${title}...`, 'info');
    setTimeout(() => {
      addToast(`Unduhan CSV siap: ${title}.csv berhasil disimpan`, 'success');
    }, 400);
  };

  return (
    <div className="w-full space-y-6 pb-20 select-none">
      {/* Top Header Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b transition-colors ${
        isDark ? 'border-[#24282C]' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-base sm:text-lg font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Pusat Laporan Keuangan & Pajak PT BAS
            </h1>
            <Badge size="xs" variant="primary">Audit Ready</Badge>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Faktur Pajak PPN (11%), e-Bupot PPh 23 (2.0% - 2.65%), Rekapan Belum Ditagih, dan Kas Keluar BKK
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Direct Link to Buat Laporan All-In-One */}
          <button
            type="button"
            onClick={() => navigate('/laporan/all-in-one')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F4511E] hover:bg-[#E04418] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Buka Form Buat Laporan All-In-One"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan All-In-One</span>
          </button>

          {/* Button to Reopen Jenis Laporan Pajak Modal matching screenshot */}
          <button
            type="button"
            onClick={() => setTaxModalOpen(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isDark
                ? 'bg-[#1F242C] border-[#2F3744] hover:border-[#F4511E] text-neutral-200 hover:text-white'
                : 'bg-white border-slate-300 hover:border-[#F4511E] text-slate-700 hover:text-[#F4511E]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#F4511E]" />
            <span>Pilih Jenis Pajak</span>
          </button>

          <Button
            size="xs"
            variant="outline"
            icon={FileSpreadsheet}
            onClick={() => handleExportCsv(`laporan-${activeTab}`)}
            title="Ekspor Laporan ke CSV"
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
            Cetak Rekap
          </Button>
        </div>
      </div>

      {/* 5 Executive Tabs */}
      <div
        className={`flex border-b gap-1.5 overflow-x-auto pb-1 transition-colors ${
          isDark ? 'border-[#24282C]' : 'border-slate-200'
        }`}
        role="tablist"
      >
        {/* Tab 1: PPN 11% */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pajak-ppn'}
          onClick={() => handleTabChange('pajak-ppn')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-md ${
            activeTab === 'pajak-ppn'
              ? isDark
                ? 'border-[#F4511E] text-white bg-[#1A1D20]/80 shadow-xs'
                : 'border-[#F4511E] text-[#F4511E] bg-orange-50/80 font-bold'
              : isDark
                ? 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-[#F4511E]" />
          <span>Pajak PPN (11%)</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-orange-500/20 text-[#FF7043]' : 'bg-orange-100 text-[#F4511E]'
          }`}>
            {ppnData.length}
          </span>
        </button>

        {/* Tab 2: PPh 23 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pajak-pph23'}
          onClick={() => handleTabChange('pajak-pph23')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-md ${
            activeTab === 'pajak-pph23'
              ? isDark
                ? 'border-emerald-500 text-white bg-[#1A1D20]/80 shadow-xs'
                : 'border-emerald-600 text-emerald-700 bg-emerald-50/80 font-bold'
              : isDark
                ? 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pajak PPh 23</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {pph23Data.length}
          </span>
        </button>

        {/* Tab 3: Rekapan */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rekapan'}
          onClick={() => handleTabChange('rekapan')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-md ${
            activeTab === 'rekapan'
              ? isDark
                ? 'border-[#F4511E] text-white bg-[#1A1D20]/80 shadow-xs'
                : 'border-[#F4511E] text-[#F4511E] bg-orange-50/80 font-bold'
              : isDark
                ? 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Rekapan Belum Di-Invoice</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
          }`}>
            {pendingRekapanList.length}
          </span>
        </button>

        {/* Tab 4: Piutang (AR) */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'piutang'}
          onClick={() => handleTabChange('piutang')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-md ${
            activeTab === 'piutang'
              ? isDark
                ? 'border-[#F4511E] text-white bg-[#1A1D20]/80 shadow-xs'
                : 'border-[#F4511E] text-[#F4511E] bg-orange-50/80 font-bold'
              : isDark
                ? 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          <span>Piutang Customer (AR)</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
          }`}>
            IDR 84.2M
          </span>
        </button>

        {/* Tab 5: Hutang (AP) */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hutang'}
          onClick={() => handleTabChange('hutang')}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-md ${
            activeTab === 'hutang'
              ? isDark
                ? 'border-[#F4511E] text-white bg-[#1A1D20]/80 shadow-xs'
                : 'border-[#F4511E] text-[#F4511E] bg-orange-50/80 font-bold'
              : isDark
                ? 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hutang BKK Supplier (AP)</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
          }`}>
            IDR 38.9M
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LAPORAN PAJAK PERTAMBAHAN NILAI (PPN 11%)         */}
      {/* ======================================================== */}
      {activeTab === 'pajak-ppn' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-neutral-400">Total DPP Penjualan</span>
                <Receipt className="w-4 h-4 text-orange-400" />
              </div>
              <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalDppPpn)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                5 Faktur penjualan material
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-[#FF7043]">PPN Dipungut (11%)</span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-orange-500/20 text-[#FF7043]">11%</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#F4511E] mt-1">
                {formatCurrency(totalPpnDipungut)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Pajak Keluaran terbit
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-emerald-400">PPN Terbayar / Setor</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-500 mt-1">
                {formatCurrency(totalPpnLunas)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                3 Faktur customer telah lunas
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-neutral-400">Validasi e-Faktur</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                100% DJP
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Semua faktur lolos QR Code DJP
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari No. Faktur Pajak, Invoice, atau Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/laporan-pajak/ppn')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#F4511E] hover:bg-[#D84315] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Form Buat Laporan PPN</span>
              </button>

              <span className={`text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Status:</span>
              {['ALL', 'Lunas', 'Belum Lunas'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterPpnStatus(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    filterPpnStatus === st
                      ? 'bg-[#F4511E] text-white border-[#F4511E]'
                      : isDark
                        ? 'bg-[#16181B] border-[#24282C] text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}

              {/* Count Indicator */}
              <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                Menampilkan <span className="text-[#FF7043] font-bold">{filteredPpn.length}</span> dari {ppnData.length} data
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan Grid (Kartu)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan List (Tabel)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards or Data Table */}
          {filteredPpn.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border font-mono ${
              isDark ? 'bg-[#14171A] border-[#24282C] text-neutral-500' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-400">Tidak ada data faktur PPN yang cocok dengan pencarian dan filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPpnStatus('ALL');
                }}
                className="mt-3 px-3 py-1 text-xs text-[#F4511E] hover:underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPpn.map((row) => (
                <Card key={row.id} hover className={`p-4 space-y-3 ${isDark ? 'border-[#24282C]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#F4511E] font-bold">{row.noFakturPajak}</span>
                    <Badge size="xs" variant={row.statusBayar === 'Lunas' ? 'success' : 'warning'} dot>
                      {row.statusBayar}
                    </Badge>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.customer}</h3>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{row.noInvoice} • {row.material}</p>
                  </div>
                  <div className={`p-2.5 border rounded space-y-1 font-mono text-xs ${isDark ? 'bg-[#181B1E] border-[#24282C]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>DPP:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{formatCurrency(row.dpp)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>PPN (11%):</span>
                      <span className="text-emerald-400">{formatCurrency(row.ppn)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${isDark ? 'text-white border-[#24282C]' : 'text-slate-900 border-slate-200'}`}>
                      <span>Total Tagihan:</span>
                      <span className="text-[#F4511E]">{formatCurrency(row.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">Tgl: {row.tanggal}</span>
                    <Badge size="xs" variant="primary">DJP Valid</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                      <th className="py-3 px-3.5">Faktur Pajak & Tanggal</th>
                      <th className="py-3 px-3.5">Customer & NPWP</th>
                      <th className="py-3 px-3.5">Material / Objek</th>
                      <th className="py-3 px-3.5 text-right">DPP (Rp)</th>
                      <th className="py-3 px-3.5 text-center">Tarif</th>
                      <th className="py-3 px-3.5 text-right">PPN 11% (Rp)</th>
                      <th className="py-3 px-3.5 text-right">Total Tagihan (Rp)</th>
                      <th className="py-3 px-3.5 text-center">Status Bayar</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                    {filteredPpn.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {row.noFakturPajak}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{row.tanggal}</span>
                            <span>•</span>
                            <span className="text-[#FF7043]">{row.noInvoice}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                            {row.customer}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-500">
                            NPWP: {row.npwp}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`text-[11px] ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                            {row.material}
                          </span>
                        </td>
                        <td className={`py-3 px-3.5 text-right font-mono font-medium ${
                          isDark ? 'text-neutral-200' : 'text-slate-800'
                        }`}>
                          {formatCurrency(row.dpp)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-[#FF7043] border border-orange-500/20">
                            {row.tarif}%
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-[#F4511E]">
                          {formatCurrency(row.ppn)}
                        </td>
                        <td className={`py-3 px-3.5 text-right font-mono font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {formatCurrency(row.total)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge
                            size="xs"
                            variant={row.statusBayar === 'Lunas' ? 'success' : 'warning'}
                            dot
                          >
                            {row.statusBayar}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className={`p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t font-mono text-xs ${
                isDark ? 'bg-[#101215] border-[#24282C] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div>
                  Menampilkan <strong>{filteredPpn.length}</strong> dari <strong>{ppnData.length}</strong> Faktur PPN 11%
                </div>
                <div className="flex items-center gap-4">
                  <span>Total PPN: <strong className="text-[#F4511E]">{formatCurrency(totalPpnDipungut)}</strong></span>
                  <span>DPP: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(totalDppPpn)}</strong></span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LAPORAN PAJAK PENGHASILAN PASAL 23 (PPh 23)       */}
      {/* ======================================================== */}
      {activeTab === 'pajak-pph23' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-neutral-400">Total Bruto BKK Kas Keluar</span>
                <Banknote className="w-4 h-4 text-emerald-400" />
              </div>
              <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalBrutoPph)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                5 Transaksi kas keluar vendor
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-emerald-400">Total Potongan PPh 23</span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-400">e-Bupot</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(totalPotonganPph)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Kewajiban setor PPh Pasal 23
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-sky-400">PPh Jasa Angkut (2.0%)</span>
                <span className="text-[10px] font-mono text-sky-400">3 BKK</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-sky-400 mt-1">
                {formatCurrency(totalPphJasa)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Tarif 2.0% armada ritase curah
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${
              isDark ? 'bg-[#16181B] border-[#24282C]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-mono uppercase text-[10px] tracking-wider text-amber-400">PPh Galian Padat (2.65%)</span>
                <span className="text-[10px] font-mono text-amber-400">2 BKK</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
                {formatCurrency(totalPphPadat)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Tarif 2.65% galian non-logam
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari Vendor, Driver, No. BKK, atau Bukti Potong..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/laporan-pajak/pph23')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Form Buat Laporan PPH 23</span>
              </button>

              <span className={`text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Tarif:</span>
              {[
                { label: 'Semua', val: 'ALL' },
                { label: 'Jasa Angkut (2.0%)', val: '2.0' },
                { label: 'Galian Padat (2.65%)', val: '2.65' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setFilterPphCategory(opt.val)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    filterPphCategory === opt.val
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : isDark
                        ? 'bg-[#16181B] border-[#24282C] text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {/* Count Indicator */}
              <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                Menampilkan <span className="text-[#FF7043] font-bold">{filteredPph.length}</span> dari {pph23Data.length} data
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan Grid (Kartu)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan List (Tabel)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards or Data Table */}
          {filteredPph.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border font-mono ${
              isDark ? 'bg-[#14171A] border-[#24282C] text-neutral-500' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-400">Tidak ada data bukti potong PPh 23 yang cocok dengan filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPphCategory('ALL');
                }}
                className="mt-3 px-3 py-1 text-xs text-[#F4511E] hover:underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPph.map((row) => (
                <Card key={row.id} hover className={`p-4 space-y-3 ${isDark ? 'border-[#24282C]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 font-bold">{row.noBuktiPotong}</span>
                    <Badge size="xs" variant="success" dot>
                      {row.statusBupot}
                    </Badge>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.vendor}</h3>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{row.noBkk} • ID: {row.npwpNik}</p>
                  </div>
                  <div className={`p-2.5 border rounded space-y-1 font-mono text-xs ${isDark ? 'bg-[#181B1E] border-[#24282C]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Objek:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{row.objekPajak}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Tarif PPh:</span>
                      <span className="text-amber-400">{row.tarif}%</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Potongan PPh:</span>
                      <span className="text-emerald-400">{formatCurrency(row.potonganPph)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${isDark ? 'text-white border-[#24282C]' : 'text-slate-900 border-slate-200'}`}>
                      <span>Net Kas Keluar:</span>
                      <span className="text-white">{formatCurrency(row.nettoBkk)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">Tgl: {row.tanggal}</span>
                    <Badge size="xs" variant="primary">{row.kategori}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                    <th className="py-3 px-3.5">Bukti Potong & No. BKK</th>
                    <th className="py-3 px-3.5">Vendor / Sopir & NPWP/NIK</th>
                    <th className="py-3 px-3.5">Objek Pajak</th>
                    <th className="py-3 px-3.5 text-right">Bruto DPP (Rp)</th>
                    <th className="py-3 px-3.5 text-center">Tarif PPh</th>
                    <th className="py-3 px-3.5 text-right">Potongan PPh 23 (Rp)</th>
                    <th className="py-3 px-3.5 text-right">Net Kas Keluar (Rp)</th>
                    <th className="py-3 px-3.5 text-center">Status Bupot</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                  {filteredPph.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-neutral-500">
                        Tidak ada data bukti potong PPh 23 yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPph.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {row.noBuktiPotong}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{row.tanggal}</span>
                            <span>•</span>
                            <span className="text-emerald-400">{row.noBkk}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                            {row.vendor}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-500">
                            ID: {row.npwpNik}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className={`text-[11px] ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                            {row.objekPajak}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {row.kategori}
                          </div>
                        </td>
                        <td className={`py-3 px-3.5 text-right font-mono font-medium ${
                          isDark ? 'text-neutral-200' : 'text-slate-800'
                        }`}>
                          {formatCurrency(row.dpp)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              row.tarif === 2.0
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {row.tarif}%
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(row.potonganPph)}
                        </td>
                        <td className={`py-3 px-3.5 text-right font-mono font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {formatCurrency(row.nettoBkk)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge size="xs" variant="success" dot>
                            {row.statusBupot}
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
                Menampilkan <strong>{filteredPph.length}</strong> dari <strong>{pph23Data.length}</strong> Bukti Potong PPh 23
              </div>
              <div className="flex items-center gap-4">
                <span>Total Potongan PPh: <strong className="text-emerald-400">{formatCurrency(totalPotonganPph)}</strong></span>
                <span>Total Bruto: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(totalBrutoPph)}</strong></span>
              </div>
            </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REKAPAN BELUM DI-INVOICE                           */}
      {/* ======================================================== */}
      {activeTab === 'rekapan' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
          }`}>
            <div>
              <div className="text-xs text-amber-500 font-semibold uppercase tracking-wider font-mono">
                Total Estimasi Penagihan Tertunda
              </div>
              <div className={`text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalEstimasiRekapan)}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                {filteredRekapan.length} Rekapan kiriman belum dikonversi menjadi Invoice resmi
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                navigate('/invoices');
                addToast('Beralih ke form penerbitan invoice baru', 'info');
              }}
              className="self-start sm:self-auto"
            >
              Terbitkan Invoice Sekarang
            </Button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari No. Rekapan, PO, Customer, atau Material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <span className={`text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Status:</span>
              {[
                { key: 'ALL', label: 'Semua' },
                { key: '<=7', label: '≤ 7 Hari' },
                { key: '>7', label: '> 7 Hari' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setFilterRekapanStatus(st.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    filterRekapanStatus === st.key
                      ? 'bg-[#F4511E] text-white border-[#F4511E]'
                      : isDark
                        ? 'bg-[#16181B] border-[#24282C] text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              {/* Customer Selector */}
              <select
                value={filterRekapanCustomer}
                onChange={(e) => setFilterRekapanCustomer(e.target.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:border-[#F4511E] cursor-pointer ${
                  isDark ? 'bg-[#16181B] border-[#24282C] text-neutral-300' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <option value="ALL">Semua Customer</option>
                {rekapanCustomers
                  .filter((c) => c !== 'ALL')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>

              {/* Count Indicator */}
              <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                Menampilkan <span className="text-[#FF7043] font-bold">{filteredRekapan.length}</span> dari {pendingRekapanList.length} data
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan Grid (Kartu)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan List (Tabel)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards or Table */}
          {filteredRekapan.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border font-mono ${
              isDark ? 'bg-[#14171A] border-[#24282C] text-neutral-500' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-400">Tidak ada rekapan yang sesuai kriteria pencarian</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRekapanStatus('ALL');
                  setFilterRekapanCustomer('ALL');
                }}
                className="mt-3 px-3 py-1 text-xs text-[#F4511E] hover:underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRekapan.map((item) => (
                <Card key={item.id} hover className={`p-4 space-y-3 ${isDark ? 'border-[#24282C]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#F4511E] font-bold">{item.id}</span>
                    <Badge size="xs" variant="warning" dot>
                      Pending {item.daysPending} hari
                    </Badge>
                  </div>

                  <div>
                    <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.customer}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {item.poNumber} • {item.material}
                    </p>
                  </div>

                  <div className={`p-2.5 border rounded space-y-1 font-mono text-xs ${
                    isDark ? 'bg-[#181B1E] border-[#24282C]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Surat Jalan:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{item.totalSj} lembar</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Total Volume:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{formatVolume(item.volume)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${
                      isDark ? 'text-white border-[#24282C]' : 'text-slate-900 border-slate-200'
                    }`}>
                      <span>Estimasi Tagihan:</span>
                      <span className="text-[#F4511E]">{formatCurrency(item.estimasiTagihan)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Tanggal: {item.tanggal}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      icon={ArrowUpRight}
                      onClick={() => {
                        navigate('/invoices');
                        addToast(`Beralih ke form penagihan ${item.id}`, 'info');
                      }}
                    >
                      Buat Faktur
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                      <th className="py-3 px-3.5">Kode Rekapan & Tanggal</th>
                      <th className="py-3 px-3.5">Customer & PO</th>
                      <th className="py-3 px-3.5">Material</th>
                      <th className="py-3 px-3.5 text-center">Surat Jalan</th>
                      <th className="py-3 px-3.5 text-right">Total Volume</th>
                      <th className="py-3 px-3.5 text-right">Estimasi Tagihan</th>
                      <th className="py-3 px-3.5 text-center">Status Pending</th>
                      <th className="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                    {filteredRekapan.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-[#F4511E]">{item.id}</div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{item.tanggal}</div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.customer}</div>
                          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">{item.poNumber}</div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.material}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          <span className="font-bold">{item.totalSj}</span> <span className="text-neutral-500 text-[11px]">lbr</span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-neutral-200">
                          {formatVolume(item.volume)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-[#F4511E]">
                          {formatCurrency(item.estimasiTagihan)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge size="xs" variant="warning" dot>
                            Pending {item.daysPending} hari
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            icon={ArrowUpRight}
                            onClick={() => {
                              navigate('/invoices');
                              addToast(`Beralih ke form penagihan ${item.id}`, 'info');
                            }}
                          >
                            Buat Faktur
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PIUTANG CUSTOMER (AR)                             */}
      {/* ======================================================== */}
      {activeTab === 'piutang' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-rose-500/10 border-rose-500/25' : 'bg-rose-50 border-rose-200'
          }`}>
            <div>
              <div className="text-xs text-rose-500 font-semibold uppercase tracking-wider font-mono">
                Total Piutang Usaha Belum Tertagih
              </div>
              <div className={`text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalSisaPiutang)}
              </div>
              <div className="text-xs text-rose-600 mt-1">
                {filteredPiutang.length} Customer prioritas dengan faktur aktif
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="border-rose-500/30 text-rose-500 hover:bg-rose-500/20 self-start sm:self-auto"
            >
              Cetak Rekap Piutang
            </Button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari Customer, ID, atau No. Invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <span className={`text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Status:</span>
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'Lancar', label: 'Lancar' },
                { key: 'Jatuh Tempo', label: 'Jatuh Tempo' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setFilterPiutangStatus(st.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    filterPiutangStatus === st.key
                      ? 'bg-[#F4511E] text-white border-[#F4511E]'
                      : isDark
                        ? 'bg-[#16181B] border-[#24282C] text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              {/* Count Indicator */}
              <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                Menampilkan <span className="text-[#FF7043] font-bold">{filteredPiutang.length}</span> dari {piutangCustomerList.length} data
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan Grid (Kartu)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan List (Tabel)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards or Table */}
          {filteredPiutang.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border font-mono ${
              isDark ? 'bg-[#14171A] border-[#24282C] text-neutral-500' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-400">Tidak ada piutang customer yang sesuai kriteria pencarian</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPiutangStatus('ALL');
                }}
                className="mt-3 px-3 py-1 text-xs text-[#F4511E] hover:underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filteredPiutang.map((item) => (
                <Card key={item.id} hover className={`p-4 space-y-3 ${isDark ? 'border-[#24282C]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#F4511E]" />
                      <span className="text-xs font-mono text-neutral-400">{item.id}</span>
                    </div>
                    <Badge
                      size="xs"
                      variant={item.status === 'Lancar' ? 'success' : 'error'}
                      dot
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.customer}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      Tempo: {item.jatuhTempo}
                    </p>
                  </div>

                  <div className={`p-2.5 border rounded space-y-1 font-mono text-xs ${
                    isDark ? 'bg-[#181B1E] border-[#24282C]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Total Invoice:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{formatCurrency(item.totalInvoice)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Telah Dibayar:</span>
                      <span className="text-emerald-500">{formatCurrency(item.terbayar)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${
                      isDark ? 'text-white border-[#24282C]' : 'text-slate-900 border-slate-200'
                    }`}>
                      <span>Sisa Piutang:</span>
                      <span className="text-rose-500">{formatCurrency(item.sisaPiutang)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {item.invNumbers.join(', ')}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={ArrowUpRight}
                      onClick={() => {
                        navigate('/invoices');
                        addToast(`Beralih ke riwayat faktur ${item.customer}`, 'info');
                      }}
                    >
                      Faktur
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                      <th className="py-3 px-3.5">ID & Customer</th>
                      <th className="py-3 px-3.5">Jatuh Tempo & Aging</th>
                      <th className="py-3 px-3.5 text-right">Total Invoice</th>
                      <th className="py-3 px-3.5 text-right">Telah Dibayar</th>
                      <th className="py-3 px-3.5 text-right">Sisa Piutang</th>
                      <th className="py-3 px-3.5">No. Invoice Terkait</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                    {filteredPiutang.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#F4511E] shrink-0" />
                            <div>
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.customer}</div>
                              <div className="text-[11px] font-mono text-neutral-500">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-mono text-neutral-200">Tempo: {item.jatuhTempo}</div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{item.aging}</div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-neutral-300">
                          {formatCurrency(item.totalInvoice)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-emerald-400">
                          {formatCurrency(item.terbayar)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-500">
                          {formatCurrency(item.sisaPiutang)}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-neutral-400">
                          {item.invNumbers.join(', ')}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge
                            size="xs"
                            variant={item.status === 'Lancar' ? 'success' : 'error'}
                            dot
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={ArrowUpRight}
                            onClick={() => {
                              navigate('/invoices');
                              addToast(`Beralih ke riwayat faktur ${item.customer}`, 'info');
                            }}
                          >
                            Faktur
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: HUTANG BKK SUPPLIER (AP)                          */}
      {/* ======================================================== */}
      {activeTab === 'hutang' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <div className="text-xs text-emerald-500 font-semibold uppercase tracking-wider font-mono">
                Total Kewajiban Kas Keluar (Hutang Vendor Tambang)
              </div>
              <div className={`text-2xl font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalSisaHutang)}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                {filteredHutang.length} Vendor tambang menanti pencairan batch transfer BCA
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20 self-start sm:self-auto"
            >
              Cetak Rekap Hutang
            </Button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Cari Supplier, ID, Bank, atau No. Rekening..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <span className={`text-xs ml-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Status:</span>
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'Siap Cair', label: 'Siap Cair' },
                { key: 'Jadwal Mingguan', label: 'Jadwal Mingguan' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setFilterHutangStatus(st.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    filterHutangStatus === st.key
                      ? 'bg-[#F4511E] text-white border-[#F4511E]'
                      : isDark
                        ? 'bg-[#16181B] border-[#24282C] text-neutral-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              {/* Count Indicator */}
              <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
                Menampilkan <span className="text-[#FF7043] font-bold">{filteredHutang.length}</span> dari {hutangSupplierList.length} data
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'grid'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan Grid (Kartu)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-[#F4511E] text-white shadow-xs font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                  }`}
                  title="Tampilan List (Tabel)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards or Table */}
          {filteredHutang.length === 0 ? (
            <div className={`p-12 text-center rounded-xl border font-mono ${
              isDark ? 'bg-[#14171A] border-[#24282C] text-neutral-500' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-neutral-400">Tidak ada hutang supplier yang sesuai kriteria pencarian</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterHutangStatus('ALL');
                }}
                className="mt-3 px-3 py-1 text-xs text-[#F4511E] hover:underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filteredHutang.map((sup) => (
                <Card key={sup.id} hover className={`p-4 space-y-3 ${isDark ? 'border-[#24282C]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-[#F4511E]" />
                      <span className="text-xs font-mono text-neutral-400">{sup.id}</span>
                    </div>
                    <Badge size="xs" variant="success" dot>
                      {sup.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className={`text-sm font-bold uppercase line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {sup.supplier}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {sup.bank}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      a/n {sup.atasNama}
                    </p>
                  </div>

                  <div className={`p-2.5 border rounded space-y-1 font-mono text-xs ${
                    isDark ? 'bg-[#181B1E] border-[#24282C]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Ritase Surat Jalan:</span>
                      <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>{sup.ritaseCount} rit</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Telah Dibayarkan:</span>
                      <span className={isDark ? 'text-neutral-300' : 'text-slate-600'}>{formatCurrency(sup.terbayar)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t ${
                      isDark ? 'text-white border-[#24282C]' : 'text-slate-900 border-slate-200'
                    }`}>
                      <span>Sisa Kewajiban:</span>
                      <span className="text-emerald-500">{formatCurrency(sup.sisaHutang)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => {
                        navigate('/bkk');
                        addToast(`Beralih ke kasir BKK untuk ${sup.supplier}`, 'info');
                      }}
                    >
                      Proses BKK
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
                      <th className="py-3 px-3.5">ID & Supplier</th>
                      <th className="py-3 px-3.5">Rekening Bank</th>
                      <th className="py-3 px-3.5 text-center">Ritase SJ</th>
                      <th className="py-3 px-3.5 text-right">Total Kas Keluar</th>
                      <th className="py-3 px-3.5 text-right">Telah Dibayarkan</th>
                      <th className="py-3 px-3.5 text-right">Sisa Kewajiban</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#202428]' : 'divide-slate-100'}`}>
                    {filteredHutang.map((sup, idx) => (
                      <tr
                        key={sup.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <HardHat className="w-4 h-4 text-[#F4511E] shrink-0" />
                            <div>
                              <div className={`font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{sup.supplier}</div>
                              <div className="text-[11px] font-mono text-neutral-500">{sup.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 font-mono">
                          <div className="text-neutral-200">{sup.bank}</div>
                          <div className="text-[11px] text-neutral-500">a/n {sup.atasNama}</div>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          <span className="font-bold">{sup.ritaseCount}</span> <span className="text-neutral-500 text-[11px]">rit</span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-neutral-300">
                          {formatCurrency(sup.totalBkk)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-neutral-400">
                          {formatCurrency(sup.terbayar)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(sup.sisaHutang)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Badge
                            size="xs"
                            variant={sup.status === 'Siap Cair' ? 'success' : 'warning'}
                            dot
                          >
                            {sup.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => {
                              navigate('/bkk');
                              addToast(`Beralih ke kasir BKK untuk ${sup.supplier}`, 'info');
                            }}
                          >
                            Proses BKK
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal Dialog: Jenis Laporan Pajak */}
      <JenisLaporanPajakModal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        onSelect={(type) => {
          setTaxModalOpen(false);
          if (type === 'all-in-one') {
            navigate('/laporan/all-in-one');
          } else {
            navigate(`/laporan-pajak/${type}`);
          }
        }}
      />
    </div>
  );
}