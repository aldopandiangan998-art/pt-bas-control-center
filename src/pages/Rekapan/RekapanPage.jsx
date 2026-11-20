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
  Printer,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Layers,
  Truck,
  Plus,
  Clock,
  ArrowUpRight,
  PackageCheck,
  Search,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input, Select, Modal } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';

export default function RekapanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { rekapanList, preOrders, customers } = useData();

  // Active view tab: 'orders' (Detail Received Order & Realisasi SJ) | 'ledger' (Buku Besar Jurnal GI)
  const [activeTab, setActiveTab] = useState('orders');

  // Search filter for Received Order tab
  const [roSearchQuery, setRoSearchQuery] = useState('');

  // Selected Order for Waybills Modal Dialog (Popup Window)
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

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

  // 1. FILTERED DATA UNTUK BUKU BESAR JURNAL GI
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

  // Aggregated calculations for Jurnal GI
  const stats = useMemo(() => {
    const totalSj = filteredData.reduce((acc, curr) => acc + (Number(curr.totalSj) || 0), 0);
    const totalVol = filteredData.reduce((acc, curr) => acc + (Number(curr.totalVolume) || 0), 0);
    const totalBeli = filteredData.reduce((acc, curr) => acc + (Number(curr.nominalBeli) || 0), 0);
    const totalJual = filteredData.reduce((acc, curr) => acc + (Number(curr.nominalJual) || 0), 0);
    const totalMargin = totalJual - totalBeli;
    return { totalSj, totalVol, totalBeli, totalJual, totalMargin };
  }, [filteredData]);

  // 2. RECEIVED ORDERS SUMMARY & REALISASI SURAT JALAN
  const receivedOrders = useMemo(() => {
    const list = [];
    const seenRos = new Set();

    // Prioritize approved preOrders and match with live journals
    const approvedPos = (preOrders || []).filter((p) => p.status === 'APPROVED');
    for (const po of approvedPos) {
      const finalRo = po.nomorRO || `RO-${po.tanggal ? String(po.tanggal).slice(0, 4) : '2026'}-${String(po.id).slice(-4)}`;
      seenRos.add(finalRo);

      let parsedItems = [];
      try {
        parsedItems = typeof po.items === 'string' ? JSON.parse(po.items) : (po.items || []);
      } catch (e) {
        parsedItems = [];
      }
      const firstItem = parsedItems[0] || {};
      const matName = po.materialName || firstItem.nama || 'SIRTU';
      const targetVol = Number(po.totalOrder || firstItem.kuantitas || 0);

      // Match journal
      const matchedJurnal = (rekapanList || []).find((r) => r.nomorRO === finalRo || r.preOrderId === po.id);
      const details = Array.isArray(matchedJurnal?.suratJalanDetails) ? matchedJurnal.suratJalanDetails : [];
      const currentVol = details.length > 0
        ? Number(details.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2))
        : Number(po.terkirim || matchedJurnal?.totalVolume || 0);
      const currentSj = details.length > 0 ? details.length : Number(matchedJurnal?.totalSj || 0);
      const sisaVolume = Math.max(0, Number((targetVol - currentVol).toFixed(2)));
      // Delivery progress measured EXCLUSIVELY by total delivered cubic volume (m³)
      const isCompleted = targetVol > 0 && currentVol >= targetVol;

      list.push({
        id: matchedJurnal?.id || `RO-SYNC-${po.id}`,
        nomorRO: finalRo,
        preOrderId: po.id,
        poNumber: po.nomorPo || matchedJurnal?.poNumber || 'MENUNGGU SURAT JALAN PERTAMA',
        customer: po.customer,
        customerAddress: po.customerAddress || matchedJurnal?.customerAddress || '',
        material: matName,
        satuan: po.satuan || 'm3',
        tanggal: po.tanggal || matchedJurnal?.tanggal,
        isPpn: po.jenisWajibPajak === 'PKP',
        targetVolume: targetVol,
        totalSj: currentSj,
        totalVolume: currentVol,
        sisaVolume,
        status: isCompleted ? 'Selesai Kirim' : (currentVol > 0 || currentSj > 0 ? 'Dalam Pengiriman' : 'Siap Kirim'),
        suratJalanDetails: details,
        hargaBeli: Number(po.hargaBeli || firstItem.hargaBeli || 0),
        hargaJual: Number(po.hargaJual || firstItem.hargaJual || 0),
        nominalBeli: Math.round(currentVol * Number(po.hargaBeli || firstItem.hargaBeli || 0)),
        nominalJual: Math.round(currentVol * Number(po.hargaJual || firstItem.hargaJual || 0)),
      });
    }

    // Also include any journals that have an existing preOrderId in preOrders
    (rekapanList || []).forEach((rek) => {
      const roKey = rek.nomorRO || rek.id;
      if (seenRos.has(roKey)) return;
      // Only include if linked to a preOrder that exists or not orphan
      const poExists = (preOrders || []).some((p) => p.id === rek.preOrderId || p.nomorRO === rek.nomorRO);
      if (!poExists) return;

      seenRos.add(roKey);
      const targetVol = Number(rek.targetVolume) || 0;
      const details = Array.isArray(rek.suratJalanDetails) ? rek.suratJalanDetails : [];
      const currentVol = details.length > 0
        ? Number(details.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2))
        : Number(rek.totalVolume || 0);
      const currentSj = details.length > 0 ? details.length : Number(rek.totalSj || 0);
      const sisaVolume = Math.max(0, Number((targetVol - currentVol).toFixed(2)));
      const isCompleted = targetVol > 0 && currentVol >= targetVol;

      list.push({
        id: rek.id,
        nomorRO: rek.nomorRO || roKey,
        preOrderId: rek.preOrderId,
        poNumber: rek.poNumber,
        customer: rek.customer,
        customerAddress: rek.customerAddress,
        material: rek.material,
        satuan: rek.satuan || 'm3',
        tanggal: rek.tanggal,
        isPpn: rek.isPpn,
        targetVolume: targetVol,
        totalSj: currentSj,
        totalVolume: currentVol,
        sisaVolume,
        status: isCompleted ? 'Selesai Kirim' : (currentVol > 0 || currentSj > 0 ? 'Dalam Pengiriman' : 'Siap Kirim'),
        suratJalanDetails: details,
        hargaBeli: rek.hargaBeli,
        hargaJual: rek.hargaJual,
        nominalBeli: rek.nominalBeli,
        nominalJual: rek.nominalJual,
      });
    });

    return list;
  }, [rekapanList, preOrders]);

  // Filtered RO list based on search query
  const filteredReceivedOrders = useMemo(() => {
    if (!roSearchQuery.trim()) return receivedOrders;
    const q = roSearchQuery.toLowerCase();
    return receivedOrders.filter(
      (ro) =>
        ro.nomorRO.toLowerCase().includes(q) ||
        ro.customer.toLowerCase().includes(q) ||
        ro.material.toLowerCase().includes(q) ||
        (ro.poNumber && ro.poNumber.toLowerCase().includes(q))
    );
  }, [receivedOrders, roSearchQuery]);

  // Overall RO Statistics
  const roStats = useMemo(() => {
    const totalRo = receivedOrders.length;
    const totalTargetVol = Number(receivedOrders.reduce((sum, r) => sum + (Number(r.targetVolume) || 0), 0).toFixed(2));
    const totalDeliveredVol = Number(receivedOrders.reduce((sum, r) => sum + (Number(r.totalVolume) || 0), 0).toFixed(2));
    const totalIssuedSj = receivedOrders.reduce((sum, r) => sum + (Number(r.totalSj) || 0), 0);
    const totalSelesai = receivedOrders.filter((r) => r.status === 'Selesai Kirim').length;
    const totalBerjalan = receivedOrders.filter((r) => r.status === 'Dalam Pengiriman').length;
    const progressPct = totalTargetVol > 0
      ? Math.min(100, Math.round((totalDeliveredVol / totalTargetVol) * 100))
      : 0;
    return {
      totalRo,
      totalTargetVol,
      totalDeliveredVol,
      totalIssuedSj,
      totalSelesai,
      totalBerjalan,
      progressPct,
    };
  }, [receivedOrders]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
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
              <span>Jurnal GI &amp; Realisasi Pengiriman</span>
              <Badge size="xs" variant="primary">Dispatch Ledger</Badge>
            </h1>
            <p className="text-xs text-neutral-400">
              Monitoring Received Order (RO), realisasi volume pengiriman Good Issue (GI), dan buku besar rekapan tagihan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* View Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#16181B] p-1 rounded-lg border border-[#24282C]">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Detail Received Order ({receivedOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Buku Besar Rekapan ({filteredData.length})</span>
            </button>
          </div>

          <Button
            size="xs"
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
            title="Cetak Laporan"
          >
            Cetak
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DETAIL RECEIVED ORDER & REALISASI DOKUMEN PENGIRIMAN */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Executive KPI Summary for Received Orders */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Received Order Aktif</span>
                <PackageCheck className="w-3.5 h-3.5 text-[#F4511E]" />
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                {roStats.totalRo} <span className="text-xs font-normal text-neutral-400">Order</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {roStats.totalBerjalan} Pengiriman &bull; {roStats.totalSelesai} Selesai
              </div>
            </div>

            <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Surat Jalan Diterbitkan</span>
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                {roStats.totalIssuedSj} <span className="text-xs font-normal text-neutral-400">Dokumen</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Total Good Issue (GI) terbit
              </div>
            </div>

            <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Total Kubikasi Terkirim</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-400 font-mono mt-0.5">
                {formatVolume(roStats.totalDeliveredVol)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Target: {formatVolume(roStats.totalTargetVol)} ({roStats.progressPct}%)
              </div>
            </div>

            <div className="bg-[#131517] border border-[#24282C] rounded-lg p-3">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Sisa Kuota Volume</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {formatVolume(Math.max(0, Number((roStats.totalTargetVol - roStats.totalDeliveredVol).toFixed(2))))}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Belum terealisasi dari target
              </div>
            </div>
          </div>

          {/* Search Bar for RO */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#14171A] p-3 rounded-lg border border-[#24282C]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari No. RO, Customer, PO, atau Material..."
                value={roSearchQuery}
                onChange={(e) => setRoSearchQuery(e.target.value)}
                className="w-full bg-[#181B1E] border border-[#2D3339] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
              />
            </div>
            <div className="text-xs text-neutral-400 font-mono self-end sm:self-auto">
              Menampilkan {filteredReceivedOrders.length} dari {receivedOrders.length} Received Order
            </div>
          </div>

          {/* List of Received Orders (Compact, using Modal Dialog for Waybill list) */}
          {filteredReceivedOrders.length === 0 ? (
            <Card className="p-8 text-center text-neutral-400 space-y-2 border-[#24282C]">
              <PackageCheck className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">Tidak ada data Received Order yang cocok.</p>
              <p className="text-xs text-neutral-500">
                Pastikan Pre-Order telah disetujui (APPROVED) oleh Super Admin agar nomor RO dan ringkasan jurnal otomatis diterbitkan.
              </p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {filteredReceivedOrders.map((ro) => {
                const fulfillmentVolPct = ro.targetVolume > 0
                  ? Math.min(100, Math.round((ro.totalVolume / ro.targetVolume) * 100))
                  : (ro.totalVolume > 0 ? 100 : 0);

                return (
                  <Card
                    key={ro.id}
                    className="p-4 sm:p-5 border-[#24282C] bg-[#14171A] space-y-3.5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#202428]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                          <span className="font-bold text-[#F4511E] bg-[#F4511E]/10 px-2.5 py-1 rounded border border-[#F4511E]/30 text-xs">
                            {ro.nomorRO}
                          </span>
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            {ro.tanggal}
                          </span>
                          <Badge
                            size="xs"
                            variant={
                              ro.status === 'Selesai Kirim'
                                ? 'success'
                                : ro.status === 'Dalam Pengiriman'
                                ? 'primary'
                                : 'neutral'
                            }
                            dot
                          >
                            {ro.status}
                          </Badge>
                          <Badge size="xs" variant={ro.isPpn ? 'primary' : 'neutral'}>
                            {ro.isPpn ? 'PKP (PPN 11%)' : 'Non-PPN'}
                          </Badge>
                        </div>

                        <div className="text-base font-bold text-white flex items-center gap-2 pt-0.5">
                          <span>{ro.customer}</span>
                          <span className="text-neutral-600">&bull;</span>
                          <span className="text-amber-400 font-semibold">{ro.material}</span>
                        </div>

                        {ro.customerAddress && (
                          <p className="text-xs text-neutral-400 font-sans line-clamp-1">
                            {ro.customerAddress}
                          </p>
                        )}
                      </div>

                      {/* Right Action: Create New Waybill Button & PO Info */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2">
                        <div className="font-mono text-xs text-neutral-400">
                          <span>No. PO: </span>
                          <strong className="text-white font-semibold">
                            {ro.poNumber || 'DRAFT (Menunggu SJ 1)'}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="xs"
                            variant="primary"
                            icon={Plus}
                            onClick={() => {
                              navigate('/surat-jalan', {
                                state: {
                                  preOrderId: ro.preOrderId,
                                  nomorRO: ro.nomorRO,
                                  nomorPo: ro.poNumber,
                                  customer: ro.customer,
                                  materialName: ro.material,
                                },
                              });
                              addToast(`Membuka form Surat Jalan untuk ${ro.nomorRO}`, 'info');
                            }}
                            className="bg-[#F4511E] hover:bg-[#ff6b3d] text-white font-semibold shadow-sm cursor-pointer"
                          >
                            Buat Surat Jalan
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={FileText}
                            onClick={() => {
                              navigate('/invoices', {
                                state: {
                                  order: ro,
                                  fromRekapan: true,
                                  activeTab: 'create',
                                },
                              });
                              addToast(`Membuka form Input Invoice untuk ${ro.nomorRO}`, 'info');
                            }}
                            className="border-[#2D3339] hover:border-[#F4511E] text-white font-medium cursor-pointer"
                            title="Buat Faktur Tagihan Invoice"
                          >
                            Input Invoice
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setActiveTab('ledger');
                              toggleExpand(ro.id);
                            }}
                            className="cursor-pointer"
                          >
                            Buku Jurnal
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Progress & Information Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111315] p-3 rounded-lg border border-[#1F2327]">
                      {/* Surat Jalan Terbit (Informational Data: Actual Good Issues) */}
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between items-center text-neutral-300">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#F4511E]" />
                            <span>Surat Jalan Terbit:</span>
                          </span>
                          <span className="font-bold text-white">
                            {ro.totalSj} Good Issue (GI)
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 bg-[#171A1D] px-2.5 py-1.5 rounded border border-[#22262B]">
                          {ro.totalSj > 0 ? (
                            <span>
                              Tercatat <strong className="text-white">{ro.totalSj} Good Issue (GI)</strong> riil pengiriman armada
                            </span>
                          ) : (
                            <span className="text-neutral-500">Belum ada Good Issue yang diterbitkan</span>
                          )}
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500">
                          <span>Data riil Good Issue tercatat</span>
                          <span>{ro.isPpn ? 'PKP (PPN 11%)' : 'Non-PPN'}</span>
                        </div>
                      </div>

                      {/* Primary Delivery Progress Measurement: Total Kubikasi Terkirim (m³) */}
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between items-center text-neutral-300">
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                            <span>Progress Kubikasi Terkirim:</span>
                          </span>
                          <span className="font-bold text-amber-400">
                            {formatVolume(ro.totalVolume, ro.satuan)} / {formatVolume(ro.targetVolume, ro.satuan)} ({fulfillmentVolPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#1C1F23] overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${fulfillmentVolPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500">
                          <span>Sisa volume: {formatVolume(ro.sisaVolume, ro.satuan)}</span>
                          <span className={ro.status === 'Selesai Kirim' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
                            {ro.status === 'Selesai Kirim' ? '✓ Kuota Volume Terpenuhi' : `${fulfillmentVolPct}% terealisasi`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Waybill Modal Trigger Bar (Clean, replaces tall inline table) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-[#202428]">
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <FileText className="w-3.5 h-3.5 text-[#F4511E]" />
                        <span>Dokumen Pengiriman: </span>
                        <strong className="text-white font-bold">{ro.suratJalanDetails.length} Good Issue (GI) Terbit</strong>
                        <span className="text-neutral-500">&bull; Realisasi: {formatVolume(ro.totalVolume, ro.satuan)}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Eye}
                          onClick={() => setSelectedOrderForModal(ro)}
                          className="border-[#2D3339] hover:border-[#F4511E] text-white font-medium cursor-pointer"
                        >
                          Lihat Daftar Surat Jalan ({ro.suratJalanDetails.length})
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: BUKU BESAR JURNAL GI (REKAPAN INVOICE & BKK VENDOR) */}
      {/* ============================================================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
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
              className="w-full tracking-wider uppercase font-bold py-2.5 cursor-pointer"
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
                {stats.totalSj} <span className="text-xs font-normal text-neutral-400">Dokumen</span>
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
                            <Badge
                              size="xs"
                              variant={
                                rek.status === 'Selesai Kirim'
                                  ? 'success'
                                  : rek.status === 'Dalam Pengiriman'
                                  ? 'primary'
                                  : 'neutral'
                              }
                              dot
                            >
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
                              {details.length || rek.totalSj} Good Issue (Surat Jalan)
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

                          {/* Operational Shortcuts & Modal Button */}
                          <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[#22262A] w-full sm:w-auto justify-end flex-wrap">
                            <Button
                              size="xs"
                              variant="outline"
                              icon={FileText}
                              onClick={() => {
                                const matched = receivedOrders.find((r) => r.id === rek.id || r.nomorRO === rek.nomorRO) || rek;
                                setSelectedOrderForModal(matched);
                              }}
                              className="border-[#2D3339] hover:border-[#F4511E] text-white cursor-pointer"
                            >
                              Daftar SJ ({details.length})
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                navigate('/bkk', { state: { order: rek, fromRekapan: true } });
                                addToast(`Beralih ke kas keluar BKK untuk ${rek.nomorRO || rek.id}`, 'info');
                              }}
                              title="Proses ke Bukti Kas Keluar"
                            >
                              Ke BKK
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              icon={FileText}
                              onClick={() => {
                                navigate('/invoices', {
                                  state: {
                                    order: rek,
                                    fromRekapan: true,
                                    activeTab: 'create',
                                  },
                                });
                                addToast(`Membuka form Input Invoice untuk ${rek.nomorRO || rek.id}`, 'info');
                              }}
                              title="Terbitkan Faktur Tagihan Invoice Customer"
                              className="bg-[#F4511E] hover:bg-[#ff6b3d] text-white font-semibold cursor-pointer"
                            >
                              Input Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DIALOG: DAFTAR SURAT JALAN PER ORDER (POP-UP WINDOW)     */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        title={`Daftar Surat Jalan — ${selectedOrderForModal?.nomorRO || ''}`}
        subtitle={`${selectedOrderForModal?.customer || ''} • Material: ${selectedOrderForModal?.material || ''} • No. PO: ${selectedOrderForModal?.poNumber || 'DRAFT'}`}
        maxWidth="max-w-4xl"
      >
        {selectedOrderForModal && (
          <div className="space-y-4 p-4 text-xs font-sans">
            {/* Quick Metrics Bar inside Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#181B1E] p-3 rounded-lg border border-[#262A2E] font-mono">
              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Target Order</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatVolume(selectedOrderForModal.targetVolume, selectedOrderForModal.satuan)}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Total kuota volume order
                </div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Realisasi Terkirim</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  {formatVolume(selectedOrderForModal.totalVolume, selectedOrderForModal.satuan)}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {selectedOrderForModal.targetVolume > 0
                    ? `${Math.min(100, Math.round((selectedOrderForModal.totalVolume / selectedOrderForModal.targetVolume) * 100))}% target terpenuhi`
                    : '-'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Surat Jalan Terbit</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {selectedOrderForModal.suratJalanDetails.length} <span className="text-xs font-normal text-neutral-400">Good Issue (GI)</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {selectedOrderForModal.suratJalanDetails.length > 0
                    ? `${selectedOrderForModal.suratJalanDetails.length} dokumen riil tercatat`
                    : 'Belum ada GI terbit'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Status Pengiriman</div>
                <div className="mt-1">
                  <Badge
                    size="xs"
                    variant={
                      selectedOrderForModal.status === 'Selesai Kirim'
                        ? 'success'
                        : selectedOrderForModal.status === 'Dalam Pengiriman'
                        ? 'primary'
                        : 'neutral'
                    }
                    dot
                  >
                    {selectedOrderForModal.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {selectedOrderForModal.isPpn ? 'PKP (PPN 11%)' : 'Non-PPN'}
                </div>
              </div>
            </div>

            {/* Table of Waybills */}
            {selectedOrderForModal.suratJalanDetails.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#111315] border border-dashed border-[#2B3037] text-center text-xs text-neutral-400 font-mono space-y-2">
                <Truck className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="font-semibold text-neutral-300">Belum ada Surat Jalan (Good Issue) yang diterbitkan untuk order ini.</p>
                <p className="text-neutral-500">
                  Klik tombol <strong>"+ Buat Surat Jalan Baru"</strong> di bawah untuk menerbitkan dokumen pengiriman armada pertama.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#22262A] bg-[#111315]">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[#181B1E] text-[11px] text-neutral-400 uppercase tracking-wider border-b border-[#22262A]">
                      <th className="py-2.5 px-3 text-center w-14">No. GI</th>
                      <th className="py-2.5 px-3">No. Surat Jalan</th>
                      <th className="py-2.5 px-3">Nopol Armada</th>
                      <th className="py-2.5 px-3">Sopir / Driver</th>
                      <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                      <th className="py-2.5 px-3">No. Nota Timbangan</th>
                      <th className="py-2.5 px-3">Dimensi Bak (P&times;L&times;T)</th>
                      <th className="py-2.5 px-3 text-right">Volume Riil</th>
                      <th className="py-2.5 px-3 text-center">Status Kirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22262A]">
                    {selectedOrderForModal.suratJalanDetails.map((sj, idx) => (
                      <tr key={sj.id || idx} className="hover:bg-[#16181B] transition-colors">
                        <td className="py-2.5 px-3 text-center text-[#F4511E] font-bold">
                          GI #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {sj.nomorSj}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-300 font-medium">
                          {sj.nopol}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {sj.driver}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {sj.tanggal} <span className="text-neutral-500">{sj.waktu || ''}</span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {sj.nomorNota || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {sj.panjangCm || '-'} &times; {sj.lebarCm || '-'} &times; {sj.tinggiCm || '-'}
                          {sj.koreksiTinggiCm ? (
                            <span className="text-amber-400 text-[10px]"> (K: {sj.koreksiTinggiCm}cm)</span>
                          ) : ''}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                          {formatVolume(sj.volumeAkhir)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-semibold">
                            {sj.status || 'Selesai'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Actions inside Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#22262A]">
              <div className="text-xs text-neutral-400 font-mono">
                Total: <strong className="text-white">{selectedOrderForModal.suratJalanDetails.length} Good Issue (Surat Jalan)</strong> terbit &bull; Volume Terkirim: <strong className="text-amber-400">{formatVolume(selectedOrderForModal.totalVolume, selectedOrderForModal.satuan)}</strong>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrderForModal(null)}
                >
                  Tutup
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={FileText}
                  onClick={() => {
                    const ro = selectedOrderForModal;
                    setSelectedOrderForModal(null);
                    navigate('/invoices', {
                      state: {
                        order: ro,
                        fromRekapan: true,
                        activeTab: 'create',
                      },
                    });
                    addToast(`Membuka form Input Invoice untuk ${ro.nomorRO}`, 'info');
                  }}
                  className="border-[#2D3339] hover:border-[#F4511E] text-white cursor-pointer"
                >
                  Input Invoice
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    const ro = selectedOrderForModal;
                    setSelectedOrderForModal(null);
                    navigate('/surat-jalan', {
                      state: {
                        preOrderId: ro.preOrderId,
                        nomorRO: ro.nomorRO,
                        nomorPo: ro.poNumber,
                        customer: ro.customer,
                        materialName: ro.material,
                      },
                    });
                    addToast(`Membuka form Surat Jalan untuk ${ro.nomorRO}`, 'info');
                  }}
                  className="bg-[#F4511E] hover:bg-[#ff6b3d] text-white font-semibold cursor-pointer"
                >
                  + Buat Surat Jalan Baru
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
