import { useNavigate } from 'react-router-dom';
import {
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Card } from '../../components/ui';
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
  const { currentUser } = useAuth();

  // Metrics
  const totalVolumeDelivered = suratJalanList.reduce((sum, sj) => sum + sj.volumeAkhir, 0);
  const totalHutang = bkkList
    .filter((b) => b.statusBayar === 'Belum Dibayar')
    .reduce((sum, b) => sum + b.amount, 0);
  const activePreOrders = preOrders.filter((po) => po.status === 'APPROVED');
  const pendingPreOrders = preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL');

  // 9 Modules matching Image 1
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

  // 8 Master Data matching Image 2
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

  return (
    <div className="space-y-5">
      {/* Top Status Strip & Quick Action Bar */}
      <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
            Pusat Kendali Operasi Gresik
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-xs text-neutral-400">
            Operator: <strong className="text-neutral-200 font-medium">{currentUser.name}</strong>{' '}
            <span className="text-neutral-500 font-mono">({currentUser.role})</span>
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-500 font-mono uppercase mr-1">Aksi Cepat:</span>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/pre-orders')}
          >
            Buat RO
          </Button>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/surat-jalan')}
          >
            Buat GI
          </Button>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/rekapan')}
          >
            Buat Jurnal GI
          </Button>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/bkk')}
          >
            Buat CO
          </Button>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={() => navigate('/invoices')}
          >
            Buat Invoice
          </Button>
          <Button
            size="xs"
            variant="ghost"
            icon={MoreHorizontal}
            onClick={() => navigate('/pengaturan')}
            title="Lihat Pengaturan & Konfigurasi"
          >
            Lainnya
          </Button>
        </div>
      </div>

      {/* 4 Core Operational & Financial Statistics Panels (Space-Saving & Visual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: RO Metric */}
        <Card
          hover
          onClick={() => navigate('/pre-orders')}
          className="p-3 cursor-pointer group bg-[#131517] border-[#24282C] hover:border-emerald-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                Pre Order Proyek
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1C1F22] text-neutral-400 border border-[#2A2E33] group-hover:text-emerald-400 transition-colors">
              RO
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl font-mono font-bold text-white tracking-tight">
              {preOrders.length} <span className="text-xs font-normal text-neutral-400 font-sans">Proyek Aktif</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              67% Disetujui
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full bg-[#1F2226] h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: '67%' }} title="2 Disetujui" />
            <div className="bg-amber-500 h-full" style={{ width: '33%' }} title="1 Menunggu" />
          </div>

          <div className="text-[10px] text-neutral-400 mt-1.5 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400" /> {activePreOrders.length} Disetujui
            </span>
            <span className="flex items-center gap-1 text-amber-400/90">
              <span className="w-1 h-1 rounded-full bg-amber-400" /> {pendingPreOrders.length} Menunggu
            </span>
          </div>
        </Card>

        {/* Stat 2: GI Metric with Mini Sparkline */}
        <Card
          hover
          onClick={() => navigate('/rekapan')}
          className="p-3 cursor-pointer group bg-[#131517] border-[#24282C] hover:border-amber-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                Pengiriman & Jurnal
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1C1F22] text-neutral-400 border border-[#2A2E33] group-hover:text-amber-400 transition-colors">
              GI
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl font-mono font-bold text-white tracking-tight">
              {formatVolume(totalVolumeDelivered)}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +14.8%
            </span>
          </div>

          {/* 7-Day Mini Sparkline Bars */}
          <div className="flex items-end gap-1 h-2 mt-2">
            {[45, 60, 85, 55, 95, 70, 60].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-xs transition-all ${
                  i === 6 ? 'bg-amber-400' : 'bg-[#2A2E33] group-hover:bg-amber-400/50'
                }`}
                style={{ height: `${h}%` }}
                title={`Hari ${i + 1}: ${h}% volume`}
              />
            ))}
          </div>

          <div className="text-[10px] text-neutral-400 mt-1.5 font-mono flex items-center justify-between">
            <span className="text-neutral-300">{suratJalanList.length} Surat Jalan</span>
            <span className="text-neutral-500">Target 100 m³</span>
          </div>
        </Card>

        {/* Stat 3: INV Metric with Aging Meter */}
        <Card
          hover
          onClick={() => navigate('/invoices')}
          className="p-3 cursor-pointer group bg-[#131517] border-[#24282C] hover:border-emerald-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                Piutang Customer
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1C1F22] text-neutral-400 border border-[#2A2E33] group-hover:text-emerald-400 transition-colors">
              INV
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl font-mono font-bold text-white tracking-tight">
              IDR 84,250,000
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              70% Lancar
            </span>
          </div>

          {/* Aging Health Bar */}
          <div className="w-full bg-[#1F2226] h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: '70%' }} title="Lancar" />
            <div className="bg-amber-500 h-full" style={{ width: '30%' }} title="Lewat Tempo" />
          </div>

          <div className="text-[10px] text-neutral-400 mt-1.5 font-mono flex items-center justify-between">
            <span className="text-emerald-400 font-medium">5 Invoice Aktif</span>
            <span className="text-neutral-500">Kredit Lancar</span>
          </div>
        </Card>

        {/* Stat 4: CO/BKK Metric with Disbursement Meter */}
        <Card
          hover
          onClick={() => navigate('/bkk')}
          className="p-3 cursor-pointer group bg-[#131517] border-[#24282C] hover:border-[#F4511E]/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4511E]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                Kewajiban Supplier
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1C1F22] text-neutral-400 border border-[#2A2E33] group-hover:text-[#F4511E] transition-colors">
              CO
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl font-mono font-bold text-[#F4511E] tracking-tight">
              {formatCurrency(totalHutang)}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 bg-black/40 px-1.5 py-0.2 rounded border border-[#272B30]">
              Siap Cair
            </span>
          </div>

          {/* Disbursement Meter */}
          <div className="w-full bg-[#1F2226] h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div className="bg-[#F4511E] h-full" style={{ width: '60%' }} title="Belum Dibayar" />
            <div className="bg-neutral-600 h-full" style={{ width: '40%' }} title="Terbayar" />
          </div>

          <div className="text-[10px] text-neutral-400 mt-1.5 font-mono flex items-center justify-between">
            <span className="text-neutral-300 font-medium">Siap Dicatat Lunas</span>
            <span className="text-neutral-500">Kas Keluar</span>
          </div>
        </Card>
      </div>

      {/* Menu Utama matching Image 1 */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 tracking-tight">
          Menu Utama
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="bg-[#242629] hover:bg-[#2C3035] border border-[#2F3236] hover:border-[#F4511E]/40 rounded-xl p-2.5 sm:p-3 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs"
                title={item.title}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shrink-0">
                  <Icon className="w-full h-full" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-200 group-hover:text-white leading-tight line-clamp-2">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Master matching Image 2 */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 tracking-tight">
          Data Master
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {masterData.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(`/master-data?tab=${item.tab}`)}
                className="bg-[#242629] hover:bg-[#2C3035] border border-[#2F3236] hover:border-[#F4511E]/40 rounded-xl p-2.5 sm:p-3 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-150 shadow-xs"
                title={item.title}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shrink-0">
                  <Icon className="w-full h-full" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-200 group-hover:text-white leading-tight line-clamp-2">
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
