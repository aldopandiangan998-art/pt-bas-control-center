import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Truck,
  BookOpen,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Network,
  Users,
  Coins,
  CreditCard,
  Building2,
  PieChart,
  HardHat,
  Mountain,
  PlusCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { preOrders, suratJalanList, bkkList } = useData();
  const { currentUser } = useAuth();

  // Dynamic calculations from central data
  const totalVolumeDelivered = suratJalanList.reduce((sum, sj) => sum + sj.volumeAkhir, 0);
  const totalHutang = bkkList
    .filter((b) => b.statusBayar === 'Belum Dibayar')
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingApprovals = preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL').length;

  // Quick action shortcut pills from Screenshot 4
  const quickActions = [
    { label: 'Buat RO', path: '/pre-orders', icon: ClipboardList },
    { label: 'Buat GI', path: '/surat-jalan', icon: Truck },
    { label: 'Buat Jurnal GI', path: '/rekapan', icon: BookOpen },
    { label: 'Buat CO', path: '/bkk', icon: Banknote },
    { label: 'Buat Invoice', path: '/invoices', icon: Receipt },
  ];

  // 9 Operational menus from Screenshot 3
  const operationalMenus = [
    { title: 'Received Order', subtitle: `${preOrders.length} Pre Order Aktif`, icon: ClipboardList, color: 'bg-blue-500/15 text-blue-400', path: '/pre-orders' },
    { title: 'Good Issue', subtitle: `${suratJalanList.length} Surat Jalan`, icon: Truck, color: 'bg-amber-500/15 text-amber-400', path: '/surat-jalan' },
    { title: 'Jurnal Good Issue', subtitle: 'Rekapan Harian PO', icon: BookOpen, color: 'bg-emerald-500/15 text-emerald-400', path: '/rekapan' },
    { title: 'Cash Out', subtitle: 'BKK ke Supplier', icon: Banknote, color: 'bg-green-500/15 text-green-400', path: '/bkk' },
    { title: 'Invoice', subtitle: 'Faktur Tagihan', icon: Receipt, color: 'bg-cyan-500/15 text-cyan-400', path: '/invoices' },
    { title: 'Laporan Pajak', subtitle: 'PPN 11% & PPH', icon: FileSpreadsheet, color: 'bg-purple-500/15 text-purple-400', path: '/laporan' },
    { title: 'Laporan All-in-One', subtitle: 'Rekap Eksekutif', icon: Network, color: 'bg-indigo-500/15 text-indigo-400', path: '/laporan' },
    { title: 'Laporan Supplier', subtitle: 'Hutang & Pengiriman', icon: HardHat, color: 'bg-rose-500/15 text-rose-400', path: '/laporan' },
    { title: 'Pusat Statistik', subtitle: 'Grafik Tonase/Kubikasi', icon: PieChart, color: 'bg-teal-500/15 text-teal-400', path: '/laporan' },
  ];

  // 8 Master data cards from Screenshot 3
  const masterDataMenus = [
    { title: 'Data Pengguna', icon: Users, count: '4 Role' },
    { title: 'Data Material', icon: Mountain, count: '8 Jenis (PPH)' },
    { title: 'Data Supplier', icon: HardHat, count: 'Gresik' },
    { title: 'Data Customer', icon: Building2, count: 'Aktif' },
    { title: 'Data Armada', icon: Truck, count: 'Dump Truck' },
    { title: 'Data Bank', icon: Building2, count: 'BCA / Mandiri' },
    { title: 'Data Rekening Bank', icon: CreditCard, count: 'PT BAS' },
    { title: 'Data Mata Uang', icon: Coins, count: 'IDR' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Welcome & Quick Actions Bar (Screenshot 4) */}
      <section className="bg-[#1C1C1C] border border-[#2F2F2F] rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                Pusat Kontrol Operasional Gresik
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Selamat Bertugas, {currentUser.name}!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Alur: Pre Order &rarr; Approve &rarr; Surat Jalan &rarr; Rekapan &rarr; BKK &rarr; Invoice &rarr; Bayar
            </p>
          </div>

          {pendingApprovals > 0 && (
            <button
              type="button"
              onClick={() => navigate('/pre-orders')}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{pendingApprovals} Pre Order Butuh Approval Direktur</span>
            </button>
          )}
        </div>

        {/* Quick Action Dock */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#2C2C2C]">
          <span className="text-xs font-semibold text-neutral-400 mr-2 flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5 text-[#F4511E]" />
            Aksi Cepat:
          </span>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#282828] hover:bg-[#F4511E] text-white text-xs font-medium border border-[#3A3A3A] hover:border-[#F4511E] transition-all transform hover:-translate-y-0.5 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-[#F4511E] group-hover:text-white" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3 Executive KPI Cards per Implementation Plan Section 0 (Poin 19) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div
          onClick={() => navigate('/rekapan')}
          className="bg-[#1C1C1C] border border-amber-500/30 hover:border-amber-500 rounded-2xl p-4.5 shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Rekapan Belum Di-Invoice</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {suratJalanList.length} Pengiriman
          </div>
          <p className="text-xs text-neutral-400">
            Total volume: <strong className="text-amber-400">{formatVolume(totalVolumeDelivered)}</strong>
          </p>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => navigate('/laporan')}
          className="bg-[#1C1C1C] border border-rose-500/30 hover:border-rose-500 rounded-2xl p-4.5 shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Piutang (Invoice Belum Lunas)</span>
            <TrendingUp className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mb-1">
            IDR 84,250,000
          </div>
          <p className="text-xs text-neutral-400">5 invoice menanti pelunasan customer</p>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => navigate('/bkk')}
          className="bg-[#1C1C1C] border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-4.5 shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium">Hutang (BKK Belum Dibayar)</span>
            <AlertCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {formatCurrency(totalHutang)}
          </div>
          <p className="text-xs text-neutral-400">
            {bkkList.filter((b) => b.statusBayar === 'Belum Dibayar').length} BKK siap dicatat bayar
          </p>
        </div>
      </section>

      {/* Menu Operasional Grid (Screenshot 3) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Menu Operasional</h3>
          <span className="text-xs text-neutral-400">Pilih modul untuk transaksi harian</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {operationalMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.title}
                type="button"
                onClick={() => navigate(menu.path)}
                className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] hover:border-[#F4511E] text-center transition-all duration-200 transform hover:-translate-y-1 shadow-md"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-inner ${menu.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#F4511E] transition-colors leading-tight">
                  {menu.title}
                </span>
                <span className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                  {menu.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Data Master Section (Screenshot 3) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Data Master</h3>
          <button
            type="button"
            onClick={() => navigate('/master-data')}
            className="text-xs text-[#F4511E] hover:underline font-medium"
          >
            Kelola Master Data &rarr;
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {masterDataMenus.map((master) => {
            const Icon = master.icon;
            return (
              <button
                key={master.title}
                type="button"
                onClick={() => navigate('/master-data')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2C2C2C] text-center hover:border-neutral-500 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-[11px] font-medium text-neutral-200 leading-tight">
                  {master.title}
                </span>
                <span className="text-[9px] text-neutral-500 mt-0.5">{master.count}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
