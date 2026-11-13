import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
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
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Card, Badge } from '../../components/ui';
import {
  ReceivedOrderIcon,
  GoodIssueIcon,
  JurnalGoodIssueIcon,
  CashOutIcon,
  InvoiceIcon,
  LaporanPajakIcon,
  LaporanAllInOneIcon,
  LaporanSupplierIcon,
  PusatStatistikIcon,
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
  const { preOrders, suratJalanList, bkkList } = useData();
  const { currentUser, isSuperAdmin } = useAuth();

  // Perspective switcher: Superadmin vs Admin tailored views
  const [activePerspective, setActivePerspective] = useState(() =>
    isSuperAdmin ? 'superadmin' : 'admin'
  );

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

  // 9 Operational Modules
  const operationalModules = [
    { title: 'Received Order', path: '/pre-orders', icon: ReceivedOrderIcon },
    { title: 'Good Issue', path: '/surat-jalan', icon: GoodIssueIcon },
    { title: 'Jurnal Good Issue', path: '/rekapan', icon: JurnalGoodIssueIcon },
    { title: 'Cash Out', path: '/bkk', icon: CashOutIcon },
    { title: 'Invoice', path: '/invoices', icon: InvoiceIcon },
    { title: 'Laporan Pajak', path: '/laporan', icon: LaporanPajakIcon },
    { title: 'Laporan All-in-One', path: '/laporan', icon: LaporanAllInOneIcon },
    { title: 'Laporan Supplier', path: '/laporan', icon: LaporanSupplierIcon },
    { title: 'Pusat Statistik', path: '/laporan', icon: PusatStatistikIcon },
  ];

  // 8 Master Data Modules
  const masterData = [
    { title: 'Data Pengguna', tab: 'pengguna', icon: DataPenggunaIcon },
    { title: 'Data Material', tab: 'material', icon: DataMaterialIcon },
    { title: 'Data Supplier', tab: 'supplier', icon: DataSupplierIcon },
    { title: 'Data Customer', tab: 'customer', icon: DataCustomerIcon },
    { title: 'Data Armada', tab: 'armada', icon: DataArmadaIcon },
    { title: 'Data Bank', tab: 'bank', icon: DataBankIcon },
    { title: 'Data Rekening Bank', tab: 'rekening', icon: DataRekeningBankIcon },
    { title: 'Data Mata Uang', tab: 'mata-uang', icon: DataMataUangIcon },
  ];

  // Perspective Configuration Data
  const isExecView = activePerspective === 'superadmin';

  // 1. Chart Series Points (8 Days corresponding to the reference image)
  const chartDays = ['05 Nov', '06 Nov', '07 Nov', '08 Nov', '09 Nov', '10 Nov', '11 Nov', '12 Nov'];
  const activityData = isExecView
    ? [
        { day: '05 Nov', created: 1.2, approved: 0.8 },
        { day: '06 Nov', created: 5.0, approved: 4.0 }, // Peak matching screenshot
        { day: '07 Nov', created: 0.8, approved: 1.2 },
        { day: '08 Nov', created: 0.0, approved: 0.0 },
        { day: '09 Nov', created: 0.0, approved: 0.0 },
        { day: '10 Nov', created: 0.0, approved: 0.0 },
        { day: '11 Nov', created: 0.0, approved: 0.0 },
        { day: '12 Nov', created: 0.0, approved: 0.0 },
      ]
    : [
        { day: '05 Nov', created: 1.0, approved: 1.0 },
        { day: '06 Nov', created: 5.0, approved: 4.0 }, // Peak matching screenshot
        { day: '07 Nov', created: 0.3, approved: 1.0 },
        { day: '08 Nov', created: 0.0, approved: 0.0 },
        { day: '09 Nov', created: 0.0, approved: 0.0 },
        { day: '10 Nov', created: 0.0, approved: 0.0 },
        { day: '11 Nov', created: 0.0, approved: 0.0 },
        { day: '12 Nov', created: 0.0, approved: 0.0 },
      ];

  // 2. Donut Breakdown Categories matching Screenshot exactly
  const documentTypes = isExecView
    ? [
        { label: 'Surat Perjanjian Kerjasama Eksternal', percent: '26.7%', count: 8, color: '#0284C7' },
        { label: 'Surat Korespondensi Eksternal', percent: '16.7%', count: 5, color: '#0EA5E9' },
        { label: 'Surat Undangan', percent: '16.7%', count: 5, color: '#38BDF8' },
        { label: 'Surat Kuasa', percent: '10%', count: 3, color: '#7DD3FC' },
        { label: 'Lainnya', percent: '30%', count: 9, color: '#334155' },
      ]
    : [
        { label: 'Surat Perjanjian Kerjasama Eksternal', percent: '26.7%', count: 8, color: '#0284C7' },
        { label: 'Surat Korespondensi Eksternal', percent: '16.7%', count: 5, color: '#0EA5E9' },
        { label: 'Surat Undangan', percent: '16.7%', count: 5, color: '#38BDF8' },
        { label: 'Surat Kuasa', percent: '10%', count: 3, color: '#7DD3FC' },
        { label: 'Lainnya', percent: '30%', count: 9, color: '#334155' },
      ];

  // 3. Compliance and Efficiency stats
  const complianceScore = isExecView ? '86.4%' : '46.7%';
  const complianceArcOffset = isExecView ? 162.8 : 88.0; // strokeDasharray for semi-circle
  const complianceText = isExecView
    ? 'Sebanyak 26 dari 30 dokumen finansial & BKK telah disetujui sesuai otorisasi direksi.'
    : 'Sebanyak 14 dari 30 dokumen telah terbit & disetujui secara tertib sesuai SOP.';
  const statUserCount = isExecView ? 84 : 60;
  const statActiveUnits = isExecView ? 31 : 23;

  // 4. Most active units (Top 4)
  const activeUnits = [
    { name: 'Administrasi Manajemen ...', count: 5, percent: '16.7%', barWidth: '16.7%', color: 'bg-[#0284C7]' },
    { name: 'Administrasi Manajemen ...', count: 5, percent: '16.7%', barWidth: '16.7%', color: 'bg-[#0284C7]' },
    { name: 'Administrasi Manajemen ...', count: 3, percent: '10%', barWidth: '10%', color: 'bg-[#0EA5E9]' },
    { name: 'Tim Manajemen Mutu', count: 1, percent: '3.3%', barWidth: '3.3%', color: 'bg-[#38BDF8]' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Console Strip: Role Identification & Perspective Switcher */}
      <div className="bg-[#111A29] border border-[#1E2B3E] rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Pusat Kendali Operasi PT BAS • Gresik Hub
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-xs text-neutral-300">
            Sesi: <strong className="text-white font-medium">{currentUser?.name || 'Administrator'}</strong>{' '}
            <span className="text-[#38BDF8] font-mono text-[11px] font-semibold">
              ({currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin Operasional'})
            </span>
          </span>
        </div>

        {/* Perspective Mode Switcher & Quick Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-[#0B111E] p-0.5 rounded-lg border border-[#1E2B3E]">
            <button
              type="button"
              onClick={() => setActivePerspective('admin')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activePerspective === 'admin'
                  ? 'bg-[#0284C7] text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Tampilkan Perspektif Admin Operasional"
            >
              Mode Admin
            </button>
            <button
              type="button"
              onClick={() => setActivePerspective('superadmin')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activePerspective === 'superadmin'
                  ? 'bg-[#0284C7] text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Tampilkan Perspektif Super Admin Eksekutif"
            >
              Mode Super Admin
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              variant="primary"
              icon={Plus}
              onClick={() => navigate('/surat-jalan')}
              className="bg-[#0284C7] hover:bg-[#0369A1] font-medium"
            >
              Buat GI
            </Button>
            <Button
              size="xs"
              variant="secondary"
              icon={Plus}
              onClick={() => navigate('/pre-orders')}
              className="bg-[#152033] hover:bg-[#1E2D47] border-[#1E2B3E]"
            >
              Buat RO
            </Button>
          </div>
        </div>
      </div>

      {/* 4 SIGNATURE DASHBOARD WIDGETS MATCHING UPLOADED REFERENCE THEME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ==================================================================== */}
        {/* WIDGET 1: Analisis Aktivitas Dokumen (Curved Spline Area Chart)       */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 bg-[#131D2D] border border-[#1E2B3E] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Card Header with Top Right Pill Button */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isExecView ? 'Analisis Aktivitas Dokumen' : 'Analisis Aktivitas Dokumen'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Perbandingan pembuatan naskah baru dan dokumen yang disetujui.
              </p>
            </div>

            {/* Blue Pill Button matching Screenshot */}
            <button
              type="button"
              onClick={() => setTimeRange(timeRange === '8 Hari Terakhir' ? '30 Hari' : '8 Hari Terakhir')}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {timeRange}
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
                {/* Blue Gradient Area Fill */}
                <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#0284C7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines and Y-axis scale (0 to 5) */}
              {[
                { y: 20, label: '5' },
                { y: 52, label: '4' },
                { y: 84, label: '3' },
                { y: 116, label: '2' },
                { y: 148, label: '1' },
                { y: 180, label: '0' },
              ].map((grid, idx) => (
                <g key={idx}>
                  <text
                    x="14"
                    y={grid.y + 3}
                    fill="#64748B"
                    fontSize="11"
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
                    stroke="#1E2B3E"
                    strokeWidth="1"
                    strokeDasharray={idx === 5 ? 'none' : '3 3'}
                  />
                </g>
              ))}

              {/* Area under the Solid Curve */}
              {/* Spline: (35,148) -> (100,20) -> (170,148) -> (240,180) -> (530,180) */}
              <path
                d="M 35 148 C 65 140, 75 20, 100 20 C 125 20, 140 145, 170 148 C 200 151, 215 180, 240 180 L 530 180 L 530 180 L 35 180 Z"
                fill="url(#areaGradientBlue)"
              />

              {/* Solid Line (Dokumen Dibuat) */}
              <path
                d="M 35 148 C 65 140, 75 20, 100 20 C 125 20, 140 145, 170 148 C 200 151, 215 180, 240 180 L 530 180"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dashed Line (Dokumen Disetujui Aktif) */}
              {/* Spline: (35,148) -> (100,52) -> (170,148) -> (220,165) -> (260,180) -> (530,180) */}
              <path
                d="M 35 148 C 65 140, 75 52, 100 52 C 125 52, 145 130, 170 148 C 190 162, 215 165, 235 174 C 250 180, 260 180, 280 180 L 530 180"
                fill="none"
                stroke="#38BDF8"
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
                        stroke="#38BDF8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}
                    {/* X-axis label */}
                    <text
                      x={xCoord}
                      y="196"
                      fill={isHovered ? '#38BDF8' : '#64748B'}
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
                className="absolute z-10 bg-[#0B111E] border border-[#38BDF8]/60 text-white text-[11px] p-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(hoveredPoint / (chartDays.length - 1)) * 90 + 5}%`,
                  top: '30%',
                }}
              >
                <div className="font-mono font-bold text-neutral-300 border-b border-[#1E2B3E] pb-1 mb-1">
                  {activityData[hoveredPoint].day}
                </div>
                <div className="flex items-center gap-1.5 text-[#0284C7] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                  <span>Dibuat: {activityData[hoveredPoint].created} dok</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#38BDF8] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  <span>Disetujui: {activityData[hoveredPoint].approved} dok</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Legend matching Screenshot */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#1E2B3E]/80 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
              <span className="text-neutral-300">Dokumen Dibuat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              <span className="text-neutral-300">Dokumen Disetujui (Aktif)</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* WIDGET 2: Jenis Dokumen Teratas (Precision Donut Chart & Breakdown)   */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-[#131D2D] border border-[#1E2B3E] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Link to Master Data */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Jenis Dokumen Teratas
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Komposisi berdasarkan tipe arsip
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/master-data')}
              className="text-xs font-medium text-[#38BDF8] hover:text-[#7DD3FC] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Kelola Tipe</span>
              <span className="text-sm">→</span>
            </button>
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
                  stroke="#1E2B3E"
                  strokeWidth="20"
                />

                {/* Slice 1: 26.7% (109 / 408) */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="20"
                  strokeDasharray="94 257.6"
                  strokeDashoffset="0"
                />

                {/* Slice 2: 16.7% (58.7 / 351.6) */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="20"
                  strokeDasharray="58.7 292.9"
                  strokeDashoffset="-94"
                />

                {/* Slice 3: 16.7% (58.7 / 351.6) */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="20"
                  strokeDasharray="58.7 292.9"
                  strokeDashoffset="-152.7"
                />

                {/* Slice 4: 10.0% (35.2 / 351.6) */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#7DD3FC"
                  strokeWidth="20"
                  strokeDasharray="35.2 316.4"
                  strokeDashoffset="-211.4"
                />

                {/* Slice 5: 30.0% (105.5 / 351.6) */}
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="20"
                  strokeDasharray="105.5 246.1"
                  strokeDashoffset="-246.6"
                />
              </svg>

              {/* Center Total Count Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] text-neutral-400 font-medium">Total</span>
                <span className="text-2xl font-bold font-mono text-white leading-none mt-0.5">30</span>
              </div>
            </div>
          </div>

          {/* Breakdown List matching Screenshot */}
          <div className="space-y-2 mt-2 pt-2 border-t border-[#1E2B3E]/60 text-xs">
            {documentTypes.map((item, idx) => (
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

        {/* ==================================================================== */}
        {/* WIDGET 3: Tingkat Kepatuhan & Efisiensi (Gauge Meter & Achievements)  */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 bg-[#131D2D] border border-[#1E2B3E] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Target Pill */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Tingkat Kepatuhan & Efisiensi
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Rasio dokumen aktif terhadap seluruh draf dokumen organisasi.
              </p>
            </div>

            {/* Target Organisasi: 100% Pill */}
            <div className="px-2.5 py-1 text-[11px] font-mono text-neutral-300 bg-[#0B111E] border border-[#1E2B3E] rounded-md shrink-0 shadow-xs">
              Target Organisasi: 100%
            </div>
          </div>

          {/* Content: Left Semi-Circle Speedometer + Right Achievement Box & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto">
            {/* Left: Semi-circular Gauge */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-28 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 100">
                  {/* Gauge Arc Background Track */}
                  <path
                    d="M 20 85 A 60 60 0 0 1 140 85"
                    fill="none"
                    stroke="#1E2B3E"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />

                  {/* Gauge Arc Progress Bar in Bright Cyan/Sky Blue */}
                  <path
                    d="M 20 85 A 60 60 0 0 1 140 85"
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="16"
                    strokeDasharray={`${complianceArcOffset} 188.5`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Percentage Text Center */}
                <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
                  <span className="text-3xl font-extrabold text-[#38BDF8] tracking-tight">
                    {complianceScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Achievement Box & Stats Counters */}
            <div className="sm:col-span-7 space-y-3">
              {/* Highlight Card */}
              <div className="bg-[#0B111E] border border-[#1E2B3E] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] mb-1">
                  <span>🎉</span>
                  <span>Pencapaian Sangat Baik!</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {complianceText}
                </p>
              </div>

              {/* Bottom 2 Key Stats */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-[#0B111E]/70 border border-[#1E2B3E]/60 rounded-lg p-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    TOTAL PENGGUNA
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {statUserCount}
                  </div>
                </div>

                <div className="bg-[#0B111E]/70 border border-[#1E2B3E]/60 rounded-lg p-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    UNIT KERJA AKTIF
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
        {/* WIDGET 4: Unit Kerja Teraktif (Progress Bars List)                    */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-[#131D2D] border border-[#1E2B3E] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          {/* Header with Top 4 Badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Unit Kerja Teraktif
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Berdasarkan volume arsip & ritase
              </p>
            </div>

            <div className="px-2 py-0.5 text-[11px] font-mono text-neutral-300 bg-[#0B111E] border border-[#1E2B3E] rounded shrink-0">
              Top 4
            </div>
          </div>

          {/* Progress Bars Rows matching Screenshot */}
          <div className="space-y-4 my-auto py-2">
            {activeUnits.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-200 truncate pr-2">
                    {item.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#38BDF8] shrink-0 font-medium">
                    {item.count} dok {item.percent}
                  </span>
                </div>
                <div className="w-full bg-[#1E2B3E] h-1.5 rounded-full overflow-hidden">
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

      {/* QUICK OPERATIONAL MODULES (Image 1 Compliance) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            Akses Cepat Modul Operasional
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">9 Alur Kerja Terintegrasi</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="bg-[#131D2D] hover:bg-[#18253A] border border-[#1E2B3E] hover:border-[#0284C7]/60 rounded-xl p-2.5 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs"
                title={item.title}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shrink-0">
                  <Icon className="w-full h-full" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white leading-tight line-clamp-2">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DATA MASTER REPOSITORY (Image 2 Compliance) */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            Pusat Repositori Data Master
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">8 Entitas Tambang & Logistik</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {masterData.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(`/master-data?tab=${item.tab}`)}
                className="bg-[#131D2D] hover:bg-[#18253A] border border-[#1E2B3E] hover:border-[#0284C7]/60 rounded-xl p-2.5 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs"
                title={item.title}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shrink-0">
                  <Icon className="w-full h-full" />
                </div>
                <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white leading-tight line-clamp-2">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
