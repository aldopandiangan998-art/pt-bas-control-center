import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronRight,
  SlidersHorizontal,
  FileCheck2,
  Layers,
  Sparkles,
  Users2,
  Building,
  Truck,
  RotateCcw,
  ClipboardList,
  PackageCheck,
  BookOpen,
  FileText,
  Receipt,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Card, Badge } from '../../components/ui';
import JenisLaporanPajakModal from '../../components/laporan/JenisLaporanPajakModal';
import {
  ReceivedOrderIcon,
  GoodIssueIcon,
  JurnalGoodIssueIcon,
  CashOutIcon,
  InvoiceIcon,
  LaporanPajakIcon,
  LaporanAllInOneIcon,
  LaporanSupplierIcon,
  DataPenggunaIcon,
  DataMaterialIcon,
  DataSupplierIcon,
  DataCustomerIcon,
  DataArmadaIcon,
  DataBankIcon,
  DataRekeningBankIcon,
  DataMataUangIcon,
} from '../../components/common/AppIcons';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDark, language } = useApp();
  const { preOrders, suratJalanList, bkkList } = useData();
  const { currentUser, isSuperAdmin } = useAuth();

  // State dialog modal Jenis Laporan Pajak (PPN & PPh 23)
  const [taxModalOpen, setTaxModalOpen] = useState(false);

  // Role-based view: automatically follows logged-in user role (superadmin vs admin)
  const isExecView = Boolean(isSuperAdmin);

  // Time range filter for Activity chart
  const [timeRange, setTimeRange] = useState('8 Hari Terakhir');

  // Chart hover interaction
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Core Metrics
  const totalVolumeDelivered = suratJalanList.reduce((sum, sj) => sum + sj.volumeAkhir, 0);
  const totalHutang = bkkList
    .filter((b) => b.statusBayar === 'Belum Dibayar')
    .reduce((sum, b) => sum + b.amount, 0);
  const activePreOrders = preOrders.filter((po) => po.status === 'APPROVED');
  const pendingPreOrders = preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL');

  // Operational Modules (Fitur Laporan hanya untuk Super Admin)
  const operationalModules = [
    { title: 'Received Order', path: '/pre-orders', icon: ReceivedOrderIcon },
    { title: 'Good Issue', path: '/surat-jalan', icon: GoodIssueIcon },
    { title: language === 'en' ? 'GI Journal' : 'Jurnal Good Issue', path: '/rekapan', icon: JurnalGoodIssueIcon },
    { title: 'Cash Out', path: '/bkk', icon: CashOutIcon },
    { title: 'Invoice', path: '/invoices', icon: InvoiceIcon },
    ...(isSuperAdmin
      ? [
        { title: language === 'en' ? 'Tax Report' : 'Laporan Pajak', path: '/laporan', icon: LaporanPajakIcon },
        { title: language === 'en' ? 'All-in-One Report' : 'Laporan All-in-One', path: '/laporan', icon: LaporanAllInOneIcon },
        { title: language === 'en' ? 'Supplier Report' : 'Laporan Supplier', path: '/laporan', icon: LaporanSupplierIcon },
      ]
      : []),
  ];

  // 8 Master Data Modules
  const masterData = [
    { title: language === 'en' ? 'User Data' : 'Data Pengguna', tab: 'pengguna', icon: DataPenggunaIcon },
    { title: language === 'en' ? 'Material Data' : 'Data Material', tab: 'material', icon: DataMaterialIcon },
    { title: language === 'en' ? 'Supplier Data' : 'Data Supplier', tab: 'supplier', icon: DataSupplierIcon },
    { title: language === 'en' ? 'Customer Data' : 'Data Customer', tab: 'customer', icon: DataCustomerIcon },
    { title: language === 'en' ? 'Fleet Data' : 'Data Armada', tab: 'armada', icon: DataArmadaIcon },
    { title: language === 'en' ? 'Bank Data' : 'Data Bank', tab: 'bank', icon: DataBankIcon },
    { title: language === 'en' ? 'Bank Account Data' : 'Data Rekening Bank', tab: 'rekening', icon: DataRekeningBankIcon },
    { title: language === 'en' ? 'Currency Data' : 'Data Mata Uang', tab: 'mata-uang', icon: DataMataUangIcon },
  ];

  // 1. Chart Series Points (8 Days corresponding to the reference image)
  const chartDays = ['05 Nov', '06 Nov', '07 Nov', '08 Nov', '09 Nov', '10 Nov', '11 Nov', '12 Nov'];
  const activityData = isExecView
    ? [
      { day: '05 Nov', created: 18.5, approved: 12.0 }, // Juta IDR
      { day: '06 Nov', created: 48.0, approved: 42.5 }, // Peak matching screenshot
      { day: '07 Nov', created: 8.5, approved: 15.0 },
      { day: '08 Nov', created: 0.0, approved: 0.0 },
      { day: '09 Nov', created: 0.0, approved: 0.0 },
      { day: '10 Nov', created: 0.0, approved: 0.0 },
      { day: '11 Nov', created: 0.0, approved: 0.0 },
      { day: '12 Nov', created: 0.0, approved: 0.0 },
    ]
    : [
      { day: '05 Nov', created: 1.0, approved: 1.0 }, // Ritase armada
      { day: '06 Nov', created: 5.0, approved: 4.0 }, // Peak matching screenshot
      { day: '07 Nov', created: 0.3, approved: 1.0 },
      { day: '08 Nov', created: 0.0, approved: 0.0 },
      { day: '09 Nov', created: 0.0, approved: 0.0 },
      { day: '10 Nov', created: 0.0, approved: 0.0 },
      { day: '11 Nov', created: 0.0, approved: 0.0 },
      { day: '12 Nov', created: 0.0, approved: 0.0 },
    ];

  // 2. Donut Breakdown Categories matching PT BAS Logistics & Mining Domain
  const materialAndCustomerTypes = isExecView
    ? [
      { label: 'PT Chiyoda International (Smelter Freeport)', percent: '26.7%', count: '8 faktur', color: '#F4511E' },
      { label: 'PT Waskita Beton Precast (Tol KLBM)', percent: '16.7%', count: '5 faktur', color: '#FB8C00' },
      { label: 'PT Semen Indonesia Logistik (Tuban Hub)', percent: '16.7%', count: '5 faktur', color: '#F59E0B' },
      { label: 'PT Varia Usaha Fabrikasi Gresik', percent: '10%', count: '3 faktur', color: '#FCD34D' },
      { label: 'Rekanan Kontraktor Tambang Lainnya', percent: '30%', count: '9 faktur', color: '#374151' },
    ]
    : [
      { label: 'Batu Split 1-2 (Cor & Konstruksi Beton)', percent: '26.7%', count: '8 rit', color: '#F4511E' },
      { label: 'Abu Batu Super (Batching Plant & Aspal)', percent: '16.7%', count: '5 rit', color: '#FB8C00' },
      { label: 'Sirtu Urugan Pilihan (Proyek Smelter)', percent: '16.7%', count: '5 rit', color: '#F59E0B' },
      { label: 'Base Course A / Makadam Lapis Pondasi', percent: '10%', count: '3 rit', color: '#FCD34D' },
      { label: 'Batu Belah Pondasi & Urugan Biasa', percent: '30%', count: '9 rit', color: '#374151' },
    ];

  // 3. Compliance and Efficiency stats
  const complianceScore = isExecView ? '86.4%' : '46.7%';
  const complianceArcOffset = isExecView ? 162.8 : 88.0; // strokeDasharray for semi-circle
  const complianceText = isExecView
    ? 'Sebanyak 26 dari 30 transaksi BKK kas keluar sopir & PO telah disetujui direksi secara tertib keuangan.'
    : 'Sebanyak 14 dari 30 ritase armada dump truck telah tervalidasi timbangan Gresik & terbit BKK sesuai SOP.';
  const statUserCount = isExecView ? '84 Transaksi' : '60 Armada';
  const statActiveUnits = isExecView ? '31 Rekanan' : '23 Rute';

  // 4. Most active units (Top 4) with PT BAS Projects & Contractors
  const activeUnits = isExecView
    ? [
      { name: 'PT Chiyoda International (Smelter Freeport)', count: 'Rp 42.5 Jt', percent: '16.7%', barWidth: '16.7%', color: 'bg-[#F4511E]' },
      { name: 'PT Waskita Beton Precast (Tol KLBM)', count: 'Rp 38.0 Jt', percent: '16.7%', barWidth: '16.7%', color: 'bg-[#F4511E]' },
      { name: 'PT Semen Indonesia (Tuban Hub)', count: 'Rp 24.5 Jt', percent: '10%', barWidth: '10%', color: 'bg-[#FB8C00]' },
      { name: 'PT Maspion Industrial Estate Manyar', count: 'Rp 8.2 Jt', percent: '3.3%', barWidth: '3.3%', color: 'bg-[#F59E0B]' },
    ]
    : [
      { name: 'Proyek Smelter Freeport Manyar (Split 1-2)', count: '5 rit', percent: '16.7%', barWidth: '16.7%', color: 'bg-[#F4511E]' },
      { name: 'Proyek Tol KLBM Ruas Bunder (Sirtu Urug)', count: '5 rit', percent: '16.7%', barWidth: '16.7%', color: 'bg-[#F4511E]' },
      { name: 'Batching Plant Semen Indonesia Tuban (Abu Batu)', count: '3 rit', percent: '10%', barWidth: '10%', color: 'bg-[#FB8C00]' },
      { name: 'Dermaga Pelabuhan Maspion Manyar (Base Course)', count: '1 rit', percent: '3.3%', barWidth: '3.3%', color: 'bg-[#F59E0B]' },
    ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Console Strip: Role Identification & Perspective Switcher */}
      <div className="bg-[#14171A] border border-[#22262A] rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            {language === 'en' ? 'PT BAS Operations Control Center • Gresik Hub' : 'Pusat Kendali Operasi PT BAS • Gresik Hub'}
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-xs text-neutral-300">
            {language === 'en' ? 'Session:' : 'Sesi:'} <strong className="text-white font-medium">{currentUser?.name || (language === 'en' ? 'Administrator' : 'Administrator')}</strong>{' '}
            <span className="text-[#FF7043] font-mono text-[11px] font-semibold">
              ({currentUser?.role === 'superadmin' ? 'Super Admin' : (language === 'en' ? 'Operational Admin' : 'Admin Operasional')})
            </span>
          </span>
        </div>
      </div>

      {/* 4 SIGNATURE DASHBOARD WIDGETS WITH PT BAS OPERATIONAL CONTEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ==================================================================== */}
        {/* WIDGET 1: Analisis Ritase / Arus Kas                                 */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 bg-[#16181B] border border-[#22262A] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Card Header with Top Right Orange Pill Button */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isExecView
                  ? (language === 'en' ? 'Cash Flow Analysis & Transaction Authorization' : 'Analisis Arus Kas & Otorisasi Transaksi')
                  : (language === 'en' ? 'Fleet Dispatch & Volume Analysis' : 'Analisis Ritase & Dispatch Armada')}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isExecView
                  ? (language === 'en' ? 'Comparison of invoice receivables vs approved BKK cash disbursement.' : 'Perbandingan nilai Invoice tagihan (Piutang) vs realisasi pencairan BKK kas keluar disetujui.')
                  : (language === 'en' ? 'Comparison of Delivery Orders (GI) issued vs fleet trips validated at Gresik scale.' : 'Perbandingan Surat Jalan (GI) diterbitkan vs ritase armada tervalidasi timbangan Gresik.')}
              </p>
            </div>

            {/* Primary Orange Pill Button */}
            <button
              type="button"
              onClick={() => setTimeRange(timeRange === '8 Hari Terakhir' ? '30 Hari' : '8 Hari Terakhir')}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-[#F4511E] hover:bg-[#D84315] text-white transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {timeRange === '8 Hari Terakhir' ? (language === 'en' ? 'Last 8 Days' : '8 Hari Terakhir') : (language === 'en' ? '30 Days' : '30 Hari')}
            </button>
          </div>

          {/* SVG Smooth Curved Spline Area Chart */}
          <div className="relative w-full h-52 sm:h-56 mt-2 select-none">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 540 200"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Primary Orange Gradient Area Fill */}
                <linearGradient id="areaGradientOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4511E" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#F4511E" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F4511E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines and Y-axis scale */}
              {[
                { y: 20, label: isExecView ? '50Jt' : '5 rit' },
                { y: 52, label: isExecView ? '40Jt' : '4 rit' },
                { y: 84, label: isExecView ? '30Jt' : '3 rit' },
                { y: 116, label: isExecView ? '20Jt' : '2 rit' },
                { y: 148, label: isExecView ? '10Jt' : '1 rit' },
                { y: 180, label: isExecView ? '0' : '0' },
              ].map((grid, idx) => (
                <g key={idx}>
                  <text
                    x="22"
                    y={grid.y + 3}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="end"
                  >
                    {grid.label}
                  </text>
                  <line
                    x1="28"
                    y1={grid.y}
                    x2="530"
                    y2={grid.y}
                    stroke={isDark ? '#22262A' : '#E2E8F0'}
                    strokeWidth="1"
                    strokeDasharray={idx === 5 ? 'none' : '3 3'}
                  />
                </g>
              ))}

              {/* Area under the Solid Curve */}
              <path
                d="M 35 148 C 65 140, 75 20, 100 20 C 125 20, 140 145, 170 148 C 200 151, 215 180, 240 180 L 530 180 L 530 180 L 35 180 Z"
                fill="url(#areaGradientOrange)"
              />

              {/* Solid Line (Surat Jalan Dibuat / Tagihan - Primary Orange) */}
              <path
                d="M 35 148 C 65 140, 75 20, 100 20 C 125 20, 140 145, 170 148 C 200 151, 215 180, 240 180 L 530 180"
                fill="none"
                stroke="#F4511E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dashed Line (Ritase Tervalidasi / BKK Disetujui - Amber Gold) */}
              <path
                d="M 35 148 C 65 140, 75 52, 100 52 C 125 52, 145 130, 170 148 C 190 162, 215 165, 235 174 C 250 180, 260 180, 280 180 L 530 180"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Interactive Anchor Points */}
              {chartDays.map((d, i) => {
                const xCoord = 35 + i * 70;
                const isHovered = hoveredPoint === i;
                return (
                  <g
                    key={d}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover vertical guideline */}
                    {isHovered && (
                      <line
                        x1={xCoord}
                        y1="20"
                        x2={xCoord}
                        y2="180"
                        stroke="#FF7043"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}
                    {/* X-axis label */}
                    <text
                      x={xCoord}
                      y="196"
                      fill={isHovered ? '#FF7043' : '#64748B'}
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {d}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint !== null && (
              <div
                className="absolute z-10 bg-[#0E1012] border border-[#FF7043]/60 text-white text-[11px] p-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(hoveredPoint / (chartDays.length - 1)) * 90 + 5}%`,
                  top: '30%',
                }}
              >
                <div className="font-mono font-bold text-neutral-300 border-b border-[#22262A] pb-1 mb-1">
                  {activityData[hoveredPoint].day}
                </div>
                <div className="flex items-center gap-1.5 text-[#F4511E] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4511E]" />
                  <span>
                    {isExecView
                      ? (language === 'en' ? 'Invoice Issued' : 'Tagihan Diterbitkan')
                      : (language === 'en' ? 'Delivery Order Issued' : 'Surat Jalan Dibuat')}:{' '}
                    {activityData[hoveredPoint].created} {isExecView ? (language === 'en' ? 'M' : 'Jt') : (language === 'en' ? 'trips' : 'rit')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span>
                    {isExecView
                      ? (language === 'en' ? 'Cash Out Approved' : 'Kas Keluar Disetujui')
                      : (language === 'en' ? 'Validated Trips' : 'Ritase Tervalidasi')}:{' '}
                    {activityData[hoveredPoint].approved} {isExecView ? (language === 'en' ? 'M' : 'Jt') : (language === 'en' ? 'trips' : 'rit')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Legend matching PT BAS Domain */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#22262A]/80 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4511E]" />
              <span className="text-neutral-300">
                {isExecView
                  ? (language === 'en' ? 'Invoice Issued (Receivables)' : 'Invoice Diterbitkan (Piutang)')
                  : (language === 'en' ? 'Delivery Order Issued (GI)' : 'Surat Jalan Diterbitkan (GI)')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="text-neutral-300">
                {isExecView
                  ? (language === 'en' ? 'BKK Approved (Cash Out)' : 'BKK Disetujui (Kas Keluar)')
                  : (language === 'en' ? 'Completed & Validated Trips' : 'Ritase Selesai & Tervalidasi')}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* WIDGET 2: Distribusi Material Tambang / Kontrak Customer             */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-[#16181B] border border-[#22262A] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Link to Master Data */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isExecView
                  ? (language === 'en' ? 'Contract Composition & Receivables' : 'Komposisi Kontrak & Piutang')
                  : (language === 'en' ? 'Mining Material Distribution' : 'Distribusi Material Tambang')}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isExecView
                  ? (language === 'en' ? 'Distribution of receivables by PT BAS key project customers' : 'Distribusi nilai piutang per customer proyek utama PT BAS')
                  : (language === 'en' ? 'Mining material shipment composition at Gresik Hub' : 'Komposisi pengiriman material tambang Gresik Hub')}
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate(isExecView ? '/master-data?tab=customer' : '/master-data?tab=material')}
                className="text-xs font-medium text-[#FF7043] hover:text-[#FFA726] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>{isExecView ? (language === 'en' ? 'Manage Customers' : 'Kelola Customer') : (language === 'en' ? 'Manage Materials' : 'Kelola Material')}</span>
                <span className="text-sm">→</span>
              </button>
            )}
          </div>

          {/* Donut Chart with Centered Total */}
          <div className="flex justify-center items-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Track Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke={isDark ? '#22262A' : '#E2E8F0'}
                  strokeWidth="20"
                />

                {/* Slice 1: 26.7% (94 / 351.6) - Primary Orange #F4511E */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#F4511E"
                  strokeWidth="20"
                  strokeDasharray="94 257.6"
                  strokeDashoffset="0"
                />

                {/* Slice 2: 16.7% (58.7 / 351.6) - Flame Orange #FB8C00 */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#FB8C00"
                  strokeWidth="20"
                  strokeDasharray="58.7 292.9"
                  strokeDashoffset="-94"
                />

                {/* Slice 3: 16.7% (58.7 / 351.6) - Amber Gold #F59E0B */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray="58.7 292.9"
                  strokeDashoffset="-152.7"
                />

                {/* Slice 4: 10.0% (35.2 / 351.6) - Warm Gold #FCD34D */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="20"
                  strokeDasharray="35.2 316.4"
                  strokeDashoffset="-211.4"
                />

                {/* Slice 5: 30.0% (105.5 / 351.6) - Dark Charcoal / Slate */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke={isDark ? '#374151' : '#94A3B8'}
                  strokeWidth="20"
                  strokeDasharray="105.5 246.1"
                  strokeDashoffset="-246.6"
                />
              </svg>

              {/* Center Total Count Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {isExecView ? (language === 'en' ? 'Total Invoices' : 'Total Faktur') : (language === 'en' ? 'Total Trips' : 'Total Rit')}
                </span>
                <span className="text-2xl font-bold font-mono text-white leading-none mt-0.5">30</span>
              </div>
            </div>
          </div>

          {/* Breakdown List matching PT BAS Material & Contract Types */}
          <div className="space-y-2 mt-2 pt-2 border-t border-[#22262A]/60 text-xs">
            {materialAndCustomerTypes.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-neutral-300">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-neutral-200">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400 shrink-0">
                  <span className="text-neutral-400">{item.percent}</span>
                  <span className="font-semibold text-neutral-200">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* SUPERADMIN FEATURE CARDS — Di antara 2 baris grafik                  */}
      {/* ==================================================================== */}
      {isExecView && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                {language === 'en' ? 'Core Operational Features' : 'Fitur Utama Operasional'}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {language === 'en' ? 'Direct access to PT BAS core workflows' : 'Akses langsung ke alur kerja inti PT BAS'}
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#F4511E]/10 text-[#F4511E] border border-[#F4511E]/30 uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Received Order */}
            <button
              type="button"
              onClick={() => navigate('/pre-orders')}
              className="group bg-[#16181B] hover:bg-[#1D2125] border border-[#22262A] hover:border-[#F4511E]/50 rounded-xl p-4 text-left transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/20 flex items-center justify-center group-hover:bg-[#F4511E]/20 transition-colors">
                  <ClipboardList className="w-5 h-5 text-[#F4511E]" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#F4511E] transition-colors mt-1" />
              </div>
              <div className="text-sm font-bold text-white leading-tight mb-1">Received Order</div>
              <div className="text-[11px] text-neutral-400 leading-snug mb-3">
                {language === 'en' ? 'Manage incoming orders & customer PO approvals' : 'Kelola pesanan masuk & persetujuan PO dari customer'}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#22262A]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">
                  {language === 'en' ? 'Active / Pending PO' : 'PO Aktif / Pending'}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-bold text-[#F4511E]">{activePreOrders.length}</span>
                  {pendingPreOrders.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                      +{pendingPreOrders.length} {language === 'en' ? 'pending' : 'pending'}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Card 2: Good Issue */}
            <button
              type="button"
              onClick={() => navigate('/surat-jalan')}
              className="group bg-[#16181B] hover:bg-[#1D2125] border border-[#22262A] hover:border-[#FB8C00]/50 rounded-xl p-4 text-left transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#FB8C00]/10 border border-[#FB8C00]/20 flex items-center justify-center group-hover:bg-[#FB8C00]/20 transition-colors">
                  <PackageCheck className="w-5 h-5 text-[#FB8C00]" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#FB8C00] transition-colors mt-1" />
              </div>
              <div className="text-sm font-bold text-white leading-tight mb-1">Good Issue</div>
              <div className="text-[11px] text-neutral-400 leading-snug mb-3">
                {language === 'en' ? 'Issue delivery orders & monitor fleet dispatch' : 'Penerbitan surat jalan & monitoring pengiriman armada'}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#22262A]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">Total GI</span>
                <span className="text-sm font-bold font-mono text-[#FB8C00]">{suratJalanList.length}</span>
              </div>
            </button>

            {/* Card 3: Jurnal Good Issue / Cash Out */}
            <button
              type="button"
              onClick={() => navigate('/bkk')}
              className="group bg-[#16181B] hover:bg-[#1D2125] border border-[#22262A] hover:border-[#F59E0B]/50 rounded-xl p-4 text-left transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#F59E0B] transition-colors mt-1" />
              </div>
              <div className="text-sm font-bold text-white leading-tight mb-1">
                {language === 'en' ? 'GI Journal Cash Out' : 'Jurnal GI Cash Out'}
              </div>
              <div className="text-[11px] text-neutral-400 leading-snug mb-3">
                {language === 'en' ? 'Recording & authorization of BKK operational cash out' : 'Pencatatan & otorisasi kas keluar BKK operasional'}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#22262A]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">
                  {language === 'en' ? 'Unpaid' : 'Belum Bayar'}
                </span>
                <span className="text-sm font-bold font-mono text-[#F59E0B]">
                  {bkkList.filter((b) => b.statusBayar === 'Belum Dibayar').length}
                </span>
              </div>
            </button>

            {/* Card 4: Invoice */}
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="group bg-[#16181B] hover:bg-[#1D2125] border border-[#22262A] hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors mt-1" />
              </div>
              <div className="text-sm font-bold text-white leading-tight mb-1">Invoice</div>
              <div className="text-[11px] text-neutral-400 leading-snug mb-3">
                {language === 'en' ? 'Invoice issuance & monitoring of customer receivables' : 'Penerbitan tagihan & monitoring piutang customer'}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#22262A]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wide">
                  {language === 'en' ? 'Total Invoices' : 'Total Tagihan'}
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">{suratJalanList.length}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 4 SIGNATURE DASHBOARD WIDGETS — Baris Grafik ke-2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ==================================================================== */}
        {/* WIDGET 3: Tingkat Kepatuhan SOP Timbangan / Otorisasi Finansial       */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 bg-[#16181B] border border-[#22262A] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Target Pill */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isExecView
                  ? (language === 'en' ? 'Authorization Compliance & Financial Liquidity' : 'Kepatuhan Otorisasi & Likuiditas Finansial')
                  : (language === 'en' ? 'Scale SOP & Dispatch Compliance' : 'Kepatuhan SOP Timbangan & Ritase')}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isExecView
                  ? (language === 'en' ? 'Ratio of approved cash disbursements & POs to total cost proposals.' : 'Rasio pencairan kas keluar & PO disetujui terhadap seluruh draf pengajuan biaya.')
                  : (language === 'en' ? 'Ratio of scale-validated delivery orders to daily fleet targets.' : 'Rasio Surat Jalan tervalidasi timbangan terhadap target ritase armada harian.')}
              </p>
            </div>

            {/* Target SOP Pill */}
            <div className="px-2.5 py-1 text-[11px] font-mono text-neutral-300 bg-[#0E1012] border border-[#22262A] rounded-md shrink-0 shadow-xs">
              {isExecView ? (language === 'en' ? 'Auth Target: 100%' : 'Target Otorisasi: 100%') : (language === 'en' ? 'SOP Target: 100%' : 'Target SOP: 100%')}
            </div>
          </div>

          {/* Content: Left Semi-Circle Speedometer + Right Achievement Box & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto">
            {/* Left: Semi-circular Gauge in Primary Orange */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-28 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 100">
                  {/* Gauge Arc Background Track */}
                  <path
                    d="M 20 85 A 60 60 0 0 1 140 85"
                    fill="none"
                    stroke={isDark ? '#22262A' : '#E2E8F0'}
                    strokeWidth="16"
                    strokeLinecap="round"
                  />

                  {/* Gauge Arc Progress Bar in Primary Orange #F4511E */}
                  <path
                    d="M 20 85 A 60 60 0 0 1 140 85"
                    fill="none"
                    stroke="#F4511E"
                    strokeWidth="16"
                    strokeDasharray={`${complianceArcOffset} 188.5`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Percentage Text Center in Bright Flame Orange */}
                <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
                  <span className="text-3xl font-extrabold text-[#FF7043] tracking-tight">
                    {complianceScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Achievement Box & Stats Counters */}
            <div className="sm:col-span-7 space-y-3">
              {/* Highlight Card */}
              <div className="bg-[#0E1012] border border-[#22262A] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF7043] mb-1">
                  <span>{isExecView ? '💼' : '🚚'}</span>
                  <span>{isExecView ? (language === 'en' ? 'Healthy Liquidity & Authorization!' : 'Likuiditas & Otorisasi Sehat!') : (language === 'en' ? 'Field Dispatch Running Smoothly!' : 'Ritase Lapangan Berjalan Tertib!')}</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {complianceText}
                </p>
              </div>

              {/* Bottom 2 Key Stats */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-[#0E1012]/70 border border-[#22262A]/60 rounded-lg p-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    {isExecView ? (language === 'en' ? 'ORDERLY DOCS' : 'DOKUMEN TERTIB') : (language === 'en' ? 'TOTAL FLEET READY' : 'TOTAL ARMADA SIAP')}
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {statUserCount}
                  </div>
                </div>

                <div className="bg-[#0E1012]/70 border border-[#22262A]/60 rounded-lg p-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    {isExecView ? (language === 'en' ? 'ACTIVE PARTNERS' : 'REKANAN KONTRAK AKTIF') : (language === 'en' ? 'ACTIVE PROJECT ROUTES' : 'RUTE PROYEK AKTIF')}
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {statActiveUnits}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* WIDGET 4: Proyek & Rute Teraktif / Rekanan Finansial Terbesar         */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-[#16181B] border border-[#22262A] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Top 4 Badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isExecView
                  ? (language === 'en' ? 'Top Partners by Transaction Value' : 'Rekanan Nilai Transaksi Terbesar')
                  : (language === 'en' ? 'Most Active Projects & Routes' : 'Proyek & Rute Tujuan Teraktif')}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isExecView
                  ? (language === 'en' ? 'Top 4 revenue contributors this month' : 'Top 4 kontributor omzet pengiriman bulan berjalan')
                  : (language === 'en' ? 'Based on dump truck dispatch frequency' : 'Berdasarkan frekuensi ritase armada dump truck')}
              </p>
            </div>

            <div className="px-2 py-0.5 text-[11px] font-mono text-neutral-300 bg-[#0E1012] border border-[#22262A] rounded shrink-0">
              {isExecView ? (language === 'en' ? 'Top 4 Partners' : 'Top 4 Rekanan') : (language === 'en' ? 'Top 4 Projects' : 'Top 4 Proyek')}
            </div>
          </div>

          {/* Progress Bars Rows matching PT BAS Projects & Contractors */}
          <div className="space-y-4 my-auto py-2">
            {activeUnits.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-200 truncate pr-2">
                    {item.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#FF7043] shrink-0 font-medium">
                    {item.count} ({item.percent})
                  </span>
                </div>
                <div className="w-full bg-[#22262A] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: item.barWidth }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK OPERATIONAL MODULES */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            {language === 'en' ? 'Quick Access Operational Modules' : 'Akses Cepat Modul Operasional'}
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">
            {language === 'en' ? `${operationalModules.length} Integrated Workflows` : `${operationalModules.length} Alur Kerja Terintegrasi`}
          </span>
        </div>

        <div className={`grid grid-cols-2 ${isSuperAdmin ? 'sm:grid-cols-4 md:grid-cols-8' : 'sm:grid-cols-5 md:grid-cols-5'} gap-2`}>
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  if (item.title === 'Laporan Pajak' || item.title === 'Tax Report') {
                    setTaxModalOpen(true);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`border rounded-xl p-2.5 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs ${isDark
                  ? 'bg-[#16181B] hover:bg-[#1D2125] border-[#22262A] hover:border-[#F4511E]/60'
                  : 'bg-white hover:bg-orange-50/50 border-slate-200 hover:border-[#F4511E]/60 shadow-2xs'
                  }`}
                title={item.title}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shrink-0">
                  <Icon className="w-full h-full" />
                </div>
                <span className={`text-[10px] font-medium leading-tight line-clamp-2 transition-colors ${isDark ? 'text-neutral-300 group-hover:text-white' : 'text-slate-700 group-hover:text-[#F4511E]'
                  }`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DATA MASTER REPOSITORY - Hanya untuk Super Admin */}
      {isSuperAdmin && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-slate-600'
              }`}>
              {language === 'en' ? 'Master Data Repository Center' : 'Pusat Repositori Data Master'}
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              {language === 'en' ? '8 Mining & Logistics Entities' : '8 Entitas Tambang & Logistik'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {masterData.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(`/master-data?tab=${item.tab}`)}
                  className={`border rounded-xl p-2.5 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs ${isDark
                    ? 'bg-[#16181B] hover:bg-[#1D2125] border-[#22262A] hover:border-[#F4511E]/60'
                    : 'bg-white hover:bg-orange-50/50 border-slate-200 hover:border-[#F4511E]/60 shadow-2xs'
                    }`}
                  title={item.title}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="w-full h-full" />
                  </div>
                  <span className={`text-[10px] font-medium leading-tight line-clamp-2 transition-colors ${isDark ? 'text-neutral-300 group-hover:text-white' : 'text-slate-700 group-hover:text-[#F4511E]'
                    }`}>
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Modal: Jenis Laporan Pajak (PPN & PPh 23) matching screenshot */}
      <JenisLaporanPajakModal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        onSelect={(type) => {
          setTaxModalOpen(false);
          if (type === 'ppn') navigate('/laporan/ppn');
          else if (type === 'pph23' || type === 'pph-23') navigate('/laporan/pph-23');
          else if (type === 'all-in-one') navigate('/laporan/all-in-one');
          else if (type === 'supplier') navigate('/laporan/supplier');
          else navigate(`/laporan/${type}`);
        }}
      />
    </div>
  );
}
