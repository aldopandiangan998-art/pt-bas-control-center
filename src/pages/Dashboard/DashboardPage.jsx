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
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { preOrders, suratJalanList, bkkList } = useData();
  const { currentUser } = useAuth();

  // Metrics
  const totalVolumeDelivered = suratJalanList.reduce((sum, sj) => sum + sj.volumeAkhir, 0);
  const totalHutang = bkkList
    .filter((b) => b.statusBayar === 'Belum Dibayar')
    .reduce((sum, b) => sum + b.amount, 0);

  // 9 Modules strictly matching Screenshot 3
  const operationalModules = [
    { title: 'Received Order', code: 'RO', desc: 'Pre Order & Approval PO', path: '/pre-orders', icon: ClipboardList },
    { title: 'Good Issue', code: 'GI', desc: 'Surat Jalan & Ukur Kubikasi', path: '/surat-jalan', icon: Truck },
    { title: 'Jurnal Good Issue', code: 'REK', desc: 'Rekapan Harian PO (PPN/Non)', path: '/rekapan', icon: BookOpen },
    { title: 'Cash Out', code: 'BKK', desc: 'Bukti Kas Keluar Supplier', path: '/bkk', icon: Banknote },
    { title: 'Invoice', code: 'INV', desc: 'Faktur Tagihan Customer', path: '/invoices', icon: Receipt },
    { title: 'Laporan Pajak', code: 'TAX', desc: 'Rekapitulasi PPN 11% & PPH', path: '/laporan', icon: FileSpreadsheet },
    { title: 'Laporan All-in-One', code: 'ALL', desc: 'Ringkasan Eksekutif Tonase', path: '/laporan', icon: Network },
    { title: 'Laporan Supplier', code: 'SUP', desc: 'Hutang & Pengiriman Supplier', path: '/laporan', icon: HardHat },
    { title: 'Pusat Statistik', code: 'STAT', desc: 'Grafik Muatan & Ritase', path: '/laporan', icon: PieChart },
  ];

  // 8 Master Data strictly matching Screenshot 3
  const masterData = [
    { title: 'Data Pengguna', desc: '4 Role Akun', tab: 'pengguna', icon: Users },
    { title: 'Data Material', desc: '8 Jenis (Tarif PPH)', tab: 'material', icon: Mountain },
    { title: 'Data Supplier', desc: 'Vendor Tambang', tab: 'supplier', icon: HardHat },
    { title: 'Data Customer', desc: 'Customer Proyek', tab: 'customer', icon: Building2 },
    { title: 'Data Armada', desc: 'Dump Truck', tab: 'armada', icon: Truck },
    { title: 'Data Bank', desc: 'BCA & Mandiri', tab: 'bank', icon: Building2 },
    { title: 'Data Rekening', desc: 'Rekening PT BAS', tab: 'rekening', icon: CreditCard },
    { title: 'Data Mata Uang', desc: 'IDR (Rupiah)', tab: 'mata-uang', icon: Coins },
  ];

  return (
    <div className="space-y-5">
      {/* Top Industrial Status Strip with Quick Action Bar matching Screenshot 4 */}
      <div className="bg-[#141414] border border-[#242424] rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-mono font-semibold text-neutral-300 uppercase tracking-wide">
            Pusat Kendali Operasi Gresik
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-xs text-neutral-400">
            Operator: <strong className="text-neutral-200">{currentUser.name}</strong> ({currentUser.role})
          </span>
        </div>

        {/* Quick Action Buttons matching Screenshot 4 dock */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-500 font-mono uppercase mr-1">Aksi Cepat:</span>
          <button
            type="button"
            onClick={() => navigate('/pre-orders')}
            className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-[#F4511E]" />
            <span>Buat RO</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/surat-jalan')}
            className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-[#F4511E]" />
            <span>Buat GI</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/rekapan')}
            className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-[#F4511E]" />
            <span>Buat Jurnal GI</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/bkk')}
            className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-[#F4511E]" />
            <span>Buat CO</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-200 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3 text-[#F4511E]" />
            <span>Buat Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/pengaturan')}
            className="px-2 py-1 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-300 text-xs font-medium border border-[#333] transition-colors flex items-center gap-1"
            title="Lihat Pengaturan & Konfigurasi"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lainnya</span>
          </button>
        </div>
      </div>

      {/* 3 Real Operational KPI Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => navigate('/rekapan')}
          className="bg-[#141414] border border-[#242424] hover:border-[#F4511E]/60 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Rekapan Belum Di-Invoice</span>
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-xl font-mono font-bold text-white tracking-tight">
            {suratJalanList.length} Pengiriman
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Total Volume: <strong className="text-neutral-300 font-mono">{formatVolume(totalVolumeDelivered)}</strong>
          </div>
        </div>

        <div
          onClick={() => navigate('/laporan')}
          className="bg-[#141414] border border-[#242424] hover:border-[#F4511E]/60 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Piutang Customer Berjalan</span>
            <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-xl font-mono font-bold text-white tracking-tight">
            IDR 84,250,000
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            5 faktur invoice belum dilunasi
          </div>
        </div>

        <div
          onClick={() => navigate('/bkk')}
          className="bg-[#141414] border border-[#242424] hover:border-[#F4511E]/60 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Kewajiban BKK Supplier</span>
            <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-xl font-mono font-bold text-[#F4511E] tracking-tight">
            {formatCurrency(totalHutang)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            BKK siap dicatat bayar ke vendor
          </div>
        </div>
      </div>

      {/* 9 Modules Grid strictly matching Screenshot 3 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Menu Operasional Utama
          </h3>
          <span className="text-[11px] text-neutral-500">9 Modul Transaksi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="bg-[#161616] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#F4511E] rounded-lg p-3.5 text-left transition-colors flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded bg-[#202020] border border-[#2A2A2A] flex items-center justify-center shrink-0 group-hover:border-[#F4511E] transition-colors">
                  <Icon className="w-4 h-4 text-[#F4511E]" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Pre Orders Pipeline Table */}
      <div className="bg-[#141414] border border-[#242424] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#F4511E]" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Status Pemenuhan Pre Order Proyek
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pre-orders')}
            className="text-[11px] text-[#F4511E] hover:underline font-mono"
          >
            Kelola PO &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1A1A] text-neutral-400 font-mono text-[11px] border-b border-[#262626]">
              <tr>
                <th className="py-2 px-3">No. PO</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Material</th>
                <th className="py-2 px-3 text-right">Target</th>
                <th className="py-2 px-3 text-right">Realisasi</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {preOrders.map((po) => {
                const pct = Math.round((po.terkirim / po.totalOrder) * 100);

                return (
                  <tr key={po.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-200">
                      {po.nomorPo || <span className="text-amber-500/80 font-normal italic">Draft</span>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{po.customer}</td>
                    <td className="py-2.5 px-3 text-neutral-400">{po.materialName}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-300">
                      {formatVolume(po.totalOrder, po.satuan)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatVolume(po.terkirim, po.satuan)}
                      <span className="text-[10px] text-neutral-500 block font-normal">({pct}%)</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          po.status === 'APPROVED'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                            : po.status === 'MENUNGGU_APPROVAL'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                            : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8 Master Data Matching Screenshot 3 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Data Master
          </h3>
          <button
            type="button"
            onClick={() => navigate('/master-data')}
            className="text-[11px] text-[#F4511E] hover:underline"
          >
            Buka Katalog Master Data &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {masterData.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(`/master-data?tab=${item.tab}`)}
                className="bg-[#141414] hover:bg-[#1C1C1C] border border-[#222222] hover:border-[#F4511E] rounded p-2.5 text-center transition-colors flex flex-col items-center justify-center group"
                title={`Kelola ${item.title}`}
              >
                <Icon className="w-4 h-4 text-neutral-400 group-hover:text-[#F4511E] transition-colors mb-1.5" />
                <span className="text-[11px] font-semibold text-neutral-300 group-hover:text-white leading-tight block">
                  {item.title}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
