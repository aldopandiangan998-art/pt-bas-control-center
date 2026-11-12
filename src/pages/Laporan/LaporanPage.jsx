import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function LaporanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('rekapan'); // 'rekapan' | 'piutang' | 'hutang'
  const [searchQuery, setSearchQuery] = useState('');

  // Sample production datasets
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

  const handleExportCsv = (title) => {
    addToast(`Menyiapkan berkas ekspor CSV: ${title}...`, 'info');
    setTimeout(() => {
      addToast(`Unduhan CSV siap: ${title}.csv tersimpan`, 'success');
    }, 400);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20 select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Pusat Laporan Keuangan & Operasional</span>
            <Badge size="xs" variant="primary">Audit Ready</Badge>
          </h1>
          <p className="text-[11px] text-neutral-400">
            Laporan prioritas PT BAS: Rekapan siap tagih, Piutang dagang (AR), dan Kas keluar vendor (AP)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* 3 Executive Tabs */}
      <div className="flex border-b border-[#24282C] gap-2 overflow-x-auto pb-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rekapan'}
          onClick={() => {
            setActiveTab('rekapan');
            setSearchQuery('');
          }}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'rekapan'
              ? 'border-[#F4511E] text-white bg-[#1A1D20]/60'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Rekapan Belum Di-Invoice</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400">
            {pendingRekapanList.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'piutang'}
          onClick={() => {
            setActiveTab('piutang');
            setSearchQuery('');
          }}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'piutang'
              ? 'border-[#F4511E] text-white bg-[#1A1D20]/60'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          <span>Piutang Customer (AR)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400">
            IDR 84.2M
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hutang'}
          onClick={() => {
            setActiveTab('hutang');
            setSearchQuery('');
          }}
          className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'hutang'
              ? 'border-[#F4511E] text-white bg-[#1A1D20]/60'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hutang BKK Supplier (AP)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
            IDR 38.9M
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131517] p-2.5 rounded-lg border border-[#24282C]">
        <div className="w-full sm:w-72">
          <Input
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari dalam laporan ${activeTab}...`}
          />
        </div>
        <div className="text-[11px] font-mono text-neutral-400 self-end sm:self-auto">
          Basis Akrual Gresik Hub &bull; Cutoff 12 Nov 2026
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: REKAPAN BELUM DI-INVOICE */}
      {/* ======================================================== */}
      {activeTab === 'rekapan' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-3.5 border-[#24282C]">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Total Rekapan Tertahan
              </div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {pendingRekapanList.length} <span className="text-xs font-normal text-neutral-400">berkas</span>
              </div>
              <p className="text-[11px] text-amber-400 mt-1">Siap dikonversi menjadi invoice</p>
            </Card>

            <Card className="p-3.5 border-[#24282C]">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Total Kubikasi Terkirim
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                {formatVolume(
                  pendingRekapanList.reduce((acc, c) => acc + c.volume, 0)
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Total {pendingRekapanList.reduce((acc, c) => acc + c.totalSj, 0)} rit dump truck
              </p>
            </Card>

            <Card className="p-3.5 border-[#24282C]">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Estimasi Nilai Tagihan
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {formatCurrency(
                  pendingRekapanList.reduce((acc, c) => acc + c.estimasiTagihan, 0)
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Belum termasuk PPN 11%</p>
            </Card>
          </div>

          {/* Table */}
          <div className="bg-[#131517] border border-[#24282C] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                  <tr>
                    <th className="p-3">ID Rekapan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">No. PO Pelanggan</th>
                    <th className="p-3">Customer & Material</th>
                    <th className="p-3 text-right">Volume (m³)</th>
                    <th className="p-3 text-right">Estimasi Tagihan</th>
                    <th className="p-3 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202326]">
                  {pendingRekapanList
                    .filter(
                      (r) =>
                        r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-[#181B1E] transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {item.id}
                        </td>
                        <td className="p-3 text-neutral-300 font-mono text-[11px]">
                          {item.tanggal}
                        </td>
                        <td className="p-3 font-mono text-neutral-300">
                          {item.poNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{item.customer}</div>
                          <div className="text-[11px] text-neutral-400">{item.material}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {formatVolume(item.volume)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(item.estimasiTagihan)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => {
                              navigate('/invoices');
                              addToast(`Memuat data ${item.id} ke lembar faktur...`, 'info');
                            }}
                          >
                            Buat Invoice
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PIUTANG CUSTOMER (AR) */}
      {/* ======================================================== */}
      {activeTab === 'piutang' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-rose-300 font-semibold uppercase tracking-wider font-mono">
                Total Piutang Belum Terbayar (Aging AR)
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(84250000)}
              </div>
              <div className="text-xs text-rose-400 mt-1">
                1 Pelanggan telah melewati masa tenggang tempo (PT Semen Indonesia)
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="border-rose-500/30 text-rose-200 hover:bg-rose-500/20 self-start sm:self-auto"
            >
              Cetak Rekap Piutang
            </Button>
          </div>

          {/* Cards for each customer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {piutangCustomerList
              .filter((c) => c.customer.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
                <Card key={item.id} hover className="p-4 space-y-3 border-[#24282C]">
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
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.customer}</h3>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      Tempo: {item.jatuhTempo}
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#181B1E] border border-[#24282C] rounded space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Total Invoice:</span>
                      <span className="text-neutral-200">{formatCurrency(item.totalInvoice)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Telah Dibayar:</span>
                      <span className="text-emerald-400">{formatCurrency(item.terbayar)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-[#24282C]">
                      <span>Sisa Piutang:</span>
                      <span className="text-rose-400">{formatCurrency(item.sisaPiutang)}</span>
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
      {/* TAB 3: HUTANG BKK SUPPLIER (AP) */}
      {/* ======================================================== */}
      {activeTab === 'hutang' && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* Summary card */}
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider font-mono">
                Total Kewajiban Kas Keluar (Hutang Vendor Tambang)
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(38920000)}
              </div>
              <div className="text-xs text-emerald-400 mt-1">
                3 Vendor tambang menanti pencairan batch transfer BCA
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 self-start sm:self-auto"
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
                <Card key={sup.id} hover className="p-4 space-y-3 border-[#24282C]">
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
                    <h3 className="text-sm font-bold text-white uppercase line-clamp-1">
                      {sup.supplier}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {sup.bank}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      a/n {sup.atasNama}
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#181B1E] border border-[#24282C] rounded space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Ritase Surat Jalan:</span>
                      <span className="text-neutral-200">{sup.ritaseCount} rit</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Telah Dibayarkan:</span>
                      <span className="text-neutral-300">{formatCurrency(sup.terbayar)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-[#24282C]">
                      <span>Sisa Kewajiban:</span>
                      <span className="text-emerald-400">{formatCurrency(sup.sisaHutang)}</span>
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
    </div>
  );
}
