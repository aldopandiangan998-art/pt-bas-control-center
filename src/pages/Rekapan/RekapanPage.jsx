import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  Calendar,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Printer,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input, Select } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function RekapanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Filter state replicating PT BAS Jurnal GI / Rekapan format
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    mulai: '2026-11-01',
    akhir: '2026-11-07',
    taxFilter: 'all', // 'all' | 'non-ppn' | 'ppn'
  });

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Sample production rekapan records
  const initialRekapanData = [
    {
      id: 'REK-202611-0001',
      tanggal: '2026-11-07',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      isPpn: false,
      totalSj: 6,
      totalVolume: 81.09,
      nominalBeli: 7703550,
      nominalJual: 9730800,
      status: 'Siap Tagih',
    },
    {
      id: 'REK-202611-0002',
      tanggal: '2026-11-05',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'Sirtu Curah',
      isPpn: false,
      totalSj: 6,
      totalVolume: 80.34,
      nominalBeli: 7632300,
      nominalJual: 9640800,
      status: 'Siap Tagih',
    },
    {
      id: 'REK-202611-0003',
      tanggal: '2026-11-03',
      poNumber: 'PO-SI-2026-014',
      customer: 'PT SEMEN INDONESIA',
      material: 'Limestone Super',
      isPpn: true,
      totalSj: 8,
      totalVolume: 124.5,
      nominalBeli: 11827500,
      nominalJual: 16185000,
      status: 'Terverifikasi',
    },
  ];

  const filteredData = useMemo(() => {
    return initialRekapanData.filter((item) => {
      if (filterData.pelanggan && filterData.pelanggan !== 'ALL' && item.customer !== filterData.pelanggan) {
        return false;
      }
      if (filterData.taxFilter === 'ppn' && !item.isPpn) return false;
      if (filterData.taxFilter === 'non-ppn' && item.isPpn) return false;
      return true;
    });
  }, [filterData]);

  // Aggregated calculations
  const stats = useMemo(() => {
    const totalSj = filteredData.reduce((acc, curr) => acc + curr.totalSj, 0);
    const totalVol = filteredData.reduce((acc, curr) => acc + curr.totalVolume, 0);
    const totalBeli = filteredData.reduce((acc, curr) => acc + curr.nominalBeli, 0);
    const totalJual = filteredData.reduce((acc, curr) => acc + curr.nominalJual, 0);
    const totalMargin = totalJual - totalBeli;
    return { totalSj, totalVol, totalBeli, totalJual, totalMargin };
  }, [filteredData]);

  const handleApplyFilter = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      addToast(
        `Filter diterapkan: ${filteredData.length} rekapan ditemukan untuk ${filterData.pelanggan}`,
        'success'
      );
    }, 250);
  };

  const handleResetFilter = () => {
    setFilterData({
      pelanggan: 'PT LION WINGS',
      mulai: '2026-11-01',
      akhir: '2026-11-07',
      taxFilter: 'all',
    });
    addToast('Filter rekapan dikembalikan ke default', 'info');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20 select-none">
      {/* Top Header Bar strictly matching PT BAS Jurnal GI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            title="Kembali ke Dashboard"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Buat Jurnal GI (Rekapan)</span>
              <Badge size="xs" variant="primary">Dispatch Ledger</Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Rekap surat jalan harian per PO pelanggan, periode pengiriman, dan pemisahan PPN/Non-PPN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="xs"
            variant="outline"
            icon={RotateCcw}
            onClick={handleResetFilter}
            title="Reset Parameter Filter"
          >
            Reset
          </Button>
          <Button
            size="xs"
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
            title="Cetak Rekapan Harian"
          >
            Cetak
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-3.5 sm:p-4 space-y-3.5 border-[#24282C]">
        {/* Row 1: Pilih Pelanggan & Tax Segment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Select
              label="Pilih Pelanggan"
              icon={User}
              value={filterData.pelanggan}
              onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
            >
              <option value="PT LION WINGS">PT LION WINGS (Surabaya)</option>
              <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA (Tuban)</option>
              <option value="ALL">-- SEMUA PELANGGAN AKTIF --</option>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Kategori Perpajakan
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#181B1E] p-1 rounded-md border border-[#2D3339]">
              <button
                type="button"
                onClick={() => setFilterData({ ...filterData, taxFilter: 'all' })}
                className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  filterData.taxFilter === 'all'
                    ? 'bg-[#F4511E] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterData({ ...filterData, taxFilter: 'non-ppn' })}
                className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  filterData.taxFilter === 'non-ppn'
                    ? 'bg-[#F4511E] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Non-PPN
              </button>
              <button
                type="button"
                onClick={() => setFilterData({ ...filterData, taxFilter: 'ppn' })}
                className={`py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                  filterData.taxFilter === 'ppn'
                    ? 'bg-[#F4511E] text-white font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                PPN 11%
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Mulai & Akhir Date Range */}
        <AnimatePresence>
          {!filterCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
            >
              <Input
                label="Tanggal Mulai Kirim"
                type="date"
                icon={Calendar}
                value={filterData.mulai}
                onChange={(e) => setFilterData({ ...filterData, mulai: e.target.value })}
              />

              <Input
                label="Tanggal Akhir Kirim"
                type="date"
                icon={Calendar}
                value={filterData.akhir}
                onChange={(e) => setFilterData({ ...filterData, akhir: e.target.value })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orange Primary Action: TERAPKAN */}
        <Button
          variant="primary"
          onClick={handleApplyFilter}
          loading={isApplying}
          className="w-full tracking-wider uppercase font-bold py-2.5"
        >
          TERAPKAN FILTER
        </Button>

        {/* Toggle Collapse */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setFilterCollapsed(!filterCollapsed)}
            className="text-[11px] text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            {filterCollapsed ? 'Tampilkan Rentang Tanggal' : 'Sembunyikan Rentang Tanggal'}
            {filterCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </Card>

      {/* Aggregate KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Total Surat Jalan
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
            {stats.totalSj} <span className="text-xs font-normal text-neutral-400">rit</span>
          </div>
        </div>

        <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Total Kubikasi
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-400 font-mono mt-0.5">
            {formatVolume(stats.totalVol)}
          </div>
        </div>

        <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Dasar Invoice (AR)
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
            {formatCurrency(stats.totalJual)}
          </div>
        </div>

        <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Estimasi Laba Kotor
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {formatCurrency(stats.totalMargin)}
          </div>
        </div>
      </div>

      {/* Rekapan Result List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#F4511E]" />
            Daftar Rekapan Siap Tagih / BKK:
          </span>
          <span>{filteredData.length} berkas</span>
        </div>

        <div className="space-y-2.5">
          {filteredData.map((rek) => (
            <motion.div
              key={rek.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                hover
                className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-[#24282C]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                    <span className="font-bold text-white bg-[#181B1E] px-2 py-0.5 rounded border border-[#2D3339]">
                      {rek.id}
                    </span>
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {rek.tanggal}
                    </span>
                    <Badge size="xs" variant={rek.isPpn ? 'primary' : 'neutral'}>
                      {rek.isPpn ? 'PPN 11%' : 'Non-PPN'}
                    </Badge>
                    <Badge size="xs" variant="success" dot>
                      {rek.status}
                    </Badge>
                  </div>

                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{rek.customer}</span>
                    <span className="text-neutral-600">&bull;</span>
                    <span className="text-neutral-300 font-normal">{rek.material}</span>
                  </div>

                  <div className="text-xs text-neutral-400 font-mono flex items-center gap-2">
                    <span className="bg-[#1C1F22] px-1.5 py-0.5 rounded text-neutral-300">
                      PO: {rek.poNumber}
                    </span>
                    <span>&bull;</span>
                    <span>{rek.totalSj} Surat Jalan</span>
                    <span>&bull;</span>
                    <span>
                      Total:{' '}
                      <strong className="text-amber-400 font-bold">
                        {formatVolume(rek.totalVolume)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between sm:justify-end gap-2 font-mono text-xs border-t md:border-t-0 pt-2.5 md:pt-0 border-[#202326]">
                  <div className="space-y-0.5 text-right w-full sm:w-auto">
                    <div className="flex justify-between sm:justify-end gap-3">
                      <span className="text-neutral-400">Dasar Invoice:</span>
                      <strong className="text-white font-bold">
                        {formatCurrency(rek.nominalJual)}
                      </strong>
                    </div>
                    <div className="flex justify-between sm:justify-end gap-3">
                      <span className="text-neutral-500">Dasar BKK Vendor:</span>
                      <strong className="text-neutral-300">
                        {formatCurrency(rek.nominalBeli)}
                      </strong>
                    </div>
                  </div>

                  {/* Operational Shortcuts */}
                  <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[#22262A] w-full sm:w-auto justify-end">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        navigate('/bkk');
                        addToast(`Beralih ke kas keluar BKK untuk ${rek.id}`, 'info');
                      }}
                      title="Proses ke Bukti Kas Keluar"
                    >
                      Ke BKK
                    </Button>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => {
                        navigate('/invoices');
                        addToast(`Beralih ke generator invoice untuk ${rek.id}`, 'info');
                      }}
                      title="Terbitkan Faktur Invoice Customer"
                    >
                      Ke Invoice
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
