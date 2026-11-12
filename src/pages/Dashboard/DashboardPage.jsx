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
  MoreHorizontal,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '../../components/ui';

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
    { title: 'Data Material', desc: '9 Jenis (Tarif PPH)', tab: 'material', icon: Mountain },
    { title: 'Data Supplier', desc: 'Vendor Tambang', tab: 'supplier', icon: HardHat },
    { title: 'Data Customer', desc: 'Customer Proyek', tab: 'customer', icon: Building2 },
    { title: 'Data Armada', desc: 'Dump Truck', tab: 'armada', icon: Truck },
    { title: 'Data Bank', desc: 'BCA & Mandiri', tab: 'bank', icon: Building2 },
    { title: 'Data Rekening', desc: 'Rekening PT BAS', tab: 'rekening', icon: CreditCard },
    { title: 'Data Mata Uang', desc: 'IDR (Rupiah)', tab: 'mata-uang', icon: Coins },
  ];

  return (
    <div className="space-y-6">
      {/* Top Status Strip & Quick Action Bar matching Screenshot 4 */}
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

        {/* Quick Action Buttons matching Screenshot 4 dock */}
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

      {/* 3 Real Operational KPI Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          hover
          onClick={() => navigate('/rekapan')}
          className="p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Rekapan Belum Di-Invoice
            </span>
            <Clock className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight mt-1">
            {suratJalanList.length} <span className="text-xs font-normal text-neutral-400 font-sans">Pengiriman</span>
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono flex items-center justify-between border-t border-[#202326] pt-2">
            <span>Total Volume:</span>
            <strong className="text-neutral-200">{formatVolume(totalVolumeDelivered)}</strong>
          </div>
        </Card>

        <Card
          hover
          onClick={() => navigate('/laporan')}
          className="p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Piutang Customer Berjalan
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight mt-1">
            IDR 84,250,000
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono flex items-center justify-between border-t border-[#202326] pt-2">
            <span>Status Penagihan:</span>
            <span className="text-amber-400 font-semibold">5 Invoice Aktif</span>
          </div>
        </Card>

        <Card
          hover
          onClick={() => navigate('/bkk')}
          className="p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Kewajiban BKK Supplier
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#F4511E] transition-colors" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#F4511E] tracking-tight mt-1">
            {formatCurrency(totalHutang)}
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono flex items-center justify-between border-t border-[#202326] pt-2">
            <span>Disbursement Status:</span>
            <span className="text-neutral-300">Siap Dicatat Lunas</span>
          </div>
        </Card>
      </div>

      {/* 9 Modules Grid strictly matching Screenshot 3 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
              Menu Operasional Utama
            </h3>
            <Badge size="xs" variant="neutral">9 Modul</Badge>
          </div>
          <span className="text-[11px] text-neutral-500">PT Berkah Alam Semesta Logistics ERP</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="bg-[#131517] hover:bg-[#181B1E] border border-[#24282C] hover:border-[#F4511E] rounded-lg p-3.5 text-left transition-all duration-150 flex items-start gap-3 group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded bg-[#1C1F22] border border-[#2A2E33] flex items-center justify-center shrink-0 group-hover:border-[#F4511E] group-hover:bg-[#F4511E]/10 transition-colors">
                  <Icon className="w-4 h-4 text-[#F4511E]" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors truncate">
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#F4511E]" />
            <CardTitle>Status Pemenuhan Pre Order Proyek</CardTitle>
          </div>
          <Button
            size="xs"
            variant="ghost"
            rightIcon={ArrowUpRight}
            onClick={() => navigate('/pre-orders')}
          >
            Kelola Pre Order
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#101214] text-neutral-400 font-mono text-[11px] border-b border-[#24282C]">
              <tr>
                <th className="py-2.5 px-3">No. PO</th>
                <th className="py-2.5 px-3">Customer Proyek</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-right">Target Kuota</th>
                <th className="py-2.5 px-3 text-right">Realisasi Kirim</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2023]">
              {preOrders.map((po) => {
                const pct = Math.round((po.terkirim / po.totalOrder) * 100);

                return (
                  <tr key={po.id} className="hover:bg-[#181B1E] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-200">
                      {po.nomorPo || <span className="text-amber-500/80 font-normal italic">Draft (Menunggu SJ)</span>}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{po.customer}</td>
                    <td className="py-2.5 px-3 text-neutral-300">{po.materialName}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-400">
                      {formatVolume(po.totalOrder, po.satuan)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatVolume(po.terkirim, po.satuan)}
                      <span className="text-[10px] text-neutral-500 block font-normal">({pct}%)</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {po.status === 'APPROVED' && (
                        <Badge size="xs" variant="success" dot>
                          APPROVED
                        </Badge>
                      )}
                      {po.status === 'MENUNGGU_APPROVAL' && (
                        <Badge size="xs" variant="warning" dot>
                          MENUNGGU
                        </Badge>
                      )}
                      {po.status === 'REJECTED' && (
                        <Badge size="xs" variant="error" dot>
                          DITOLAK
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 8 Master Data Matching Screenshot 3 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Katalog Data Master
            </h3>
            <Badge size="xs" variant="neutral">8 Entitas</Badge>
          </div>
          <Button
            size="xs"
            variant="ghost"
            rightIcon={ChevronRight}
            onClick={() => navigate('/master-data')}
          >
            Lihat Semua Master
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {masterData.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(`/master-data?tab=${item.tab}`)}
                className="bg-[#131517] hover:bg-[#181B1E] border border-[#24282C] hover:border-[#F4511E] rounded-md p-2.5 text-center transition-all duration-150 flex flex-col items-center justify-center group cursor-pointer shadow-xs"
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
