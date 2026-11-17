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
            </div>
          </div>

          {/* Data Table */}
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
                  {filteredPpn.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-neutral-500">
                        Tidak ada data faktur PPN yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredPpn.map((row, idx) => (
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
                Menampilkan <strong>{filteredPpn.length}</strong> dari <strong>{ppnData.length}</strong> Faktur PPN 11%
              </div>
              <div className="flex items-center gap-4">
                <span>Total PPN: <strong className="text-[#F4511E]">{formatCurrency(totalPpnDipungut)}</strong></span>
                <span>DPP: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(totalDppPpn)}</strong></span>
              </div>
            </div>
          </div>
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
            </div>
          </div>

          {/* Data Table */}
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
                {formatCurrency(43614600)}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                4 Rekapan kiriman belum dikonversi menjadi Invoice resmi
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

          {/* Cards for each pending rekapan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRekapanList
              .filter(
                (r) =>
                  r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.material.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item) => (
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
                {formatCurrency(84250000)}
              </div>
              <div className="text-xs text-rose-600 mt-1">
                3 Customer prioritas dengan faktur aktif
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

          {/* Cards for each customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {piutangCustomerList
              .filter((c) => c.customer.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
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
                {formatCurrency(38920000)}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                3 Vendor tambang menanti pencairan batch transfer BCA
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

          {/* Cards for each supplier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hutangSupplierList
              .filter(
                (s) =>
                  s.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.bank.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((sup) => (
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
        </motion.div>
      )}

      {/* Modal Dialog: Jenis Laporan Pajak */}
      <JenisLaporanPajakModal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        onSelect={(type) => {
          setTaxModalOpen(false);
          navigate(`/laporan-pajak/${type}`);
        }}
      />
    </div>
  );
}