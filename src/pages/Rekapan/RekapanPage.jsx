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
import { useData } from '../../context/DataContext';

export default function RekapanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { rekapanList, customers } = useData();

  // Filter state replicating PT BAS Jurnal GI / Rekapan format
  const [filterData, setFilterData] = useState({
    pelanggan: 'ALL',
    mulai: '',
    akhir: '',
    taxFilter: 'all', // 'all' | 'non-ppn' | 'ppn'
  });

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    return (rekapanList || []).filter((item) => {
      if (filterData.pelanggan && filterData.pelanggan !== 'ALL' && item.customer !== filterData.pelanggan) {
        return false;
      }
      if (filterData.taxFilter === 'ppn' && !item.isPpn) return false;
      if (filterData.taxFilter === 'non-ppn' && item.isPpn) return false;
      if (filterData.mulai && item.tanggal && item.tanggal < filterData.mulai) return false;
      if (filterData.akhir && item.tanggal && item.tanggal > filterData.akhir) return false;
      return true;
    });
  }, [rekapanList, filterData]);

  // Aggregated calculations
  const stats = useMemo(() => {
    const totalSj = filteredData.reduce((acc, curr) => acc + (Number(curr.totalSj) || 0), 0);
    const totalVol = filteredData.reduce((acc, curr) => acc + (Number(curr.totalVolume) || 0), 0);
    const totalBeli = filteredData.reduce((acc, curr) => acc + (Number(curr.nominalBeli) || 0), 0);
    const totalJual = filteredData.reduce((acc, curr) => acc + (Number(curr.nominalJual) || 0), 0);
    const totalMargin = totalJual - totalBeli;
    return { totalSj, totalVol, totalBeli, totalJual, totalMargin };
  }, [filteredData]);

  const handleMulaiChange = (val) => {
    setFilterData((prev) => ({
      ...prev,
      mulai: val,
      akhir: prev.akhir && val && val > prev.akhir ? val : prev.akhir,
    }));
  };

  const handleAkhirChange = (val) => {
    if (filterData.mulai && val && val < filterData.mulai) {
      addToast('Tanggal akhir tidak boleh sebelum tanggal mulai', 'warning');
      return;
    }
    setFilterData((prev) => ({ ...prev, akhir: val }));
  };

  const handleApplyFilter = () => {
    if (filterData.mulai && filterData.akhir && filterData.akhir < filterData.mulai) {
      addToast('Tanggal akhir tidak boleh sebelum tanggal mulai', 'error');
      return;
    }
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      addToast(
        `Filter diterapkan: ${filteredData.length} rekapan ditemukan untuk ${filterData.pelanggan === 'ALL' ? 'Semua Pelanggan' : filterData.pelanggan}`,
        'success'
      );
    }, 250);
  };

  const handleResetFilter = () => {
    setFilterData({
      pelanggan: 'ALL',
      mulai: '',
      akhir: '',
      taxFilter: 'all',
    });
    addToast('Filter rekapan dikembalikan ke default', 'info');
  };

  return (
    <div className="w-full space-y-6 pb-20 select-none">
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
            <p className="text-xs text-neutral-400">
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
              <option value="ALL">-- SEMUA PELANGGAN AKTIF --</option>
              {(customers || []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.alias ? `(${c.alias})` : ''}
                </option>
              ))}
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
                onChange={(e) => handleMulaiChange(e.target.value)}
              />

              <Input
                label="Tanggal Akhir Kirim"
                type="date"
                icon={Calendar}
                value={filterData.akhir}
                min={filterData.mulai || undefined}
                onChange={(e) => handleAkhirChange(e.target.value)}
                error={
                  filterData.mulai && filterData.akhir && filterData.akhir < filterData.mulai
                    ? 'Tanggal akhir tidak boleh sebelum tanggal mulai'
                    : undefined
                }
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
          {filteredData.map((rek) => {
            const isExpanded = expandedCardIds.has(rek.id);
            const details = Array.isArray(rek.suratJalanDetails) ? rek.suratJalanDetails : [];
            const targetVol = Number(rek.targetVolume) || 0;
            const currentVol = Number(rek.totalVolume) || 0;
            const fulfillmentPct = targetVol > 0
              ? Math.min(100, Math.round((currentVol / targetVol) * 100))
              : (currentVol > 0 ? 100 : 0);

            return (
              <motion.div
                key={rek.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className="p-3.5 sm:p-4 space-y-3 border-[#24282C] bg-[#14171A]"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                        <span className="font-bold text-white bg-[#181B1E] px-2 py-0.5 rounded border border-[#2D3339]">
                          {rek.id}
                        </span>
                        {rek.nomorRO && (
                          <span className="font-bold text-[#F4511E] bg-[#F4511E]/10 px-2 py-0.5 rounded border border-[#F4511E]/30">
                            RO: {rek.nomorRO}
                          </span>
                        )}
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {rek.tanggal}
                        </span>
                        <Badge size="xs" variant={rek.isPpn ? 'primary' : 'neutral'}>
                          {rek.isPpn ? 'PPN 11%' : 'Non-PPN'}
                        </Badge>
                        <Badge size="xs" variant="success" dot>
                          {rek.status || 'Siap Kirim'}
                        </Badge>
                      </div>

                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{rek.customer}</span>
                        <span className="text-neutral-600">&bull;</span>
                        <span className="text-amber-400 font-semibold">{rek.material}</span>
                      </div>

                      <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 flex-wrap">
                        <span className="bg-[#1C1F22] px-1.5 py-0.5 rounded text-neutral-300">
                          PO: {rek.poNumber || 'DRAFT (Menunggu SJ 1)'}
                        </span>
                        <span>&bull;</span>
                        <span className="text-white font-medium">
                          {rek.totalSj} Surat Jalan {rek.targetRitase ? `(Target: ${rek.targetRitase} rit)` : ''}
                        </span>
                        <span>&bull;</span>
                        <span>
                          Realisasi: <strong className="text-amber-400 font-bold">{formatVolume(currentVol, rek.satuan || 'm3')}</strong>
                          {targetVol > 0 && (
                            <span className="text-neutral-400 font-normal"> / {formatVolume(targetVol, rek.satuan || 'm3')} ({fulfillmentPct}%)</span>
                          )}
                        </span>
                      </div>

                      {/* Delivery Progress Bar */}
                      {targetVol > 0 && (
                        <div className="w-full max-w-md h-1.5 rounded-full bg-[#1C1F23] overflow-hidden mt-1">
                          <div
                            className="h-full bg-[#F4511E] transition-all duration-300"
                            style={{ width: `${fulfillmentPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between sm:justify-end gap-2 font-mono text-xs border-t md:border-t-0 pt-2.5 md:pt-0 border-[#202326]">
                      <div className="space-y-0.5 text-right w-full sm:w-auto">
                        <div className="flex justify-between sm:justify-end gap-3">
                          <span className="text-neutral-400">Dasar Invoice (AR):</span>
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

                      {/* Operational Shortcuts & Expand Button */}
                      <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[#22262A] w-full sm:w-auto justify-end flex-wrap">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => toggleExpand(rek.id)}
                          className="text-[#F4511E] hover:text-[#ff6b3d] hover:bg-[#F4511E]/10"
                        >
                          {isExpanded ? (
                            <span className="flex items-center gap-1">
                              Tutup Rincian <ChevronUp className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Rincian SJ ({details.length}) <ChevronDown className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            navigate('/bkk');
                            addToast(`Beralih ke kas keluar BKK untuk ${rek.nomorRO || rek.id}`, 'info');
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
                            addToast(`Beralih ke generator invoice untuk ${rek.nomorRO || rek.id}`, 'info');
                          }}
                          title="Terbitkan Faktur Invoice Customer"
                        >
                          Ke Invoice
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Section: Detail Rincian Surat Jalan Terhubung */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="pt-3 border-t border-[#22262A] overflow-hidden"
                      >
                        <div className="flex items-center justify-between pb-2 text-xs font-mono text-neutral-400">
                          <span className="font-semibold text-neutral-200">
                            Rincian Surat Jalan Terlampir dalam Jurnal Summary Ini:
                          </span>
                          <span>Total: {details.length} Surat Jalan</span>
                        </div>

                        {details.length === 0 ? (
                          <div className="p-4 rounded-lg bg-[#111315] border border-dashed border-[#2B3037] text-center text-xs text-neutral-400 font-mono">
                            Belum ada Surat Jalan yang dicatat untuk nomor RO ini. Ketika admin menerbitkan Surat Jalan, rincian waybill akan otomatis masuk dan terakumulasi ke jurnal summary ini sampai kuota terpenuhi.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-[#22262A] bg-[#111315]">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead>
                                <tr className="bg-[#181B1E] text-[11px] text-neutral-400 uppercase tracking-wider border-b border-[#22262A]">
                                  <th className="py-2 px-3 text-center w-10">#</th>
                                  <th className="py-2 px-3">No. Surat Jalan</th>
                                  <th className="py-2 px-3">Nopol Armada</th>
                                  <th className="py-2 px-3">Sopir / Driver</th>
                                  <th className="py-2 px-3">Tanggal &amp; Jam</th>
                                  <th className="py-2 px-3">No. Nota</th>
                                  <th className="py-2 px-3">Dimensi Bak (P&times;L&times;T cm)</th>
                                  <th className="py-2 px-3 text-right">Volume Riil</th>
                                  <th className="py-2 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#22262A]">
                                {details.map((sj, idx) => (
                                  <tr key={sj.id || idx} className="hover:bg-[#16181B] transition-colors">
                                    <td className="py-2 px-3 text-center text-neutral-500">{idx + 1}</td>
                                    <td className="py-2 px-3 font-bold text-white">{sj.nomorSj}</td>
                                    <td className="py-2 px-3 text-neutral-300">{sj.nopol}</td>
                                    <td className="py-2 px-3 text-neutral-400">{sj.driver}</td>
                                    <td className="py-2 px-3 text-neutral-400">{sj.tanggal} {sj.waktu || ''}</td>
                                    <td className="py-2 px-3 text-neutral-400">{sj.nomorNota || '-'}</td>
                                    <td className="py-2 px-3 text-neutral-400">
                                      {sj.panjangCm || '-'} &times; {sj.lebarCm || '-'} &times; {sj.tinggiCm || '-'}
                                      {sj.koreksiTinggiCm ? ` (K: ${sj.koreksiTinggiCm})` : ''}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-amber-400">
                                      {formatVolume(sj.volumeAkhir)}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                                        {sj.status || 'Selesai'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
