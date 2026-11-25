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
  X,
  Filter,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input, Select, Modal, SearchBar, Checkbox } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';

function getJournalPendingSjs(rek, suratJalanList = []) {
  if (!rek || rek.statusLock === 'LOCKED') return [];
  return (suratJalanList || []).filter(
    (sj) =>
      sj.jurnalId === rek.id ||
      (((rek.preOrderId && String(sj.preOrderId) === String(rek.preOrderId)) ||
        (rek.nomorRO && sj.nomorRO === rek.nomorRO)) &&
        (sj.tanggalDibuat || sj.tanggal) === rek.tanggal)
  );
}

export default function RekapanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { rekapanList, preOrders, suratJalanList, customers, generateNomorRO, materials, lockJurnal, fetchJurnalAuditLogs } = useData();

  // Active view tab: 'ledger' (Buku Besar Jurnal GI) | 'orders' (Detail Received Order & Realisasi SJ)
  const [activeTab, setActiveTab] = useState('ledger');

  // Unified Filter & Search States across both tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [taxFilter, setTaxFilter] = useState('all'); // 'all' | 'non-ppn' | 'ppn'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Selected Order for Waybills Modal Dialog (Popup Window)
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  // Jurnal Lock & Audit Trail States
  const [lockingId, setLockingId] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedJurnalForAudit, setSelectedJurnalForAudit] = useState(null);

  const handleLockJurnal = async (jurnalId) => {
    if (!window.confirm('Kunci Jurnal ini?\n\nSemua Surat Jalan (GI) pada tanggal input jurnal ini akan disegel/dikunci. Setelah LOCKED, GI baru pada tanggal yang sama ditolak kecuali GI terjadwal masa depan (Bagian D).')) {
      return;
    }
    setLockingId(jurnalId);
    try {
      await lockJurnal(jurnalId);
    } catch (err) {
      // Error toast is already handled by DataContext.lockJurnal
    } finally {
      setLockingId(null);
    }
  };

  const handleOpenAuditTrail = async (jurnalId, jurnalLabel) => {
    setSelectedJurnalForAudit({ id: jurnalId, label: jurnalLabel });
    setAuditModalOpen(true);
    setLoadingAudit(true);
    try {
      const logs = await fetchJurnalAuditLogs(jurnalId);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

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
      // Customer Filter
      if (customerFilter !== 'ALL' && item.customer !== customerFilter) {
        return false;
      }

      // Material Filter
      if (materialFilter !== 'ALL' && item.material !== materialFilter) {
        return false;
      }

      // Tax Filter
      if (taxFilter === 'ppn' && !item.isPpn) return false;
      if (taxFilter === 'non-ppn' && item.isPpn) return false;

      // Status Filter
      if (statusFilter === 'SIAP_KIRIM' && item.status !== 'Siap Kirim') return false;
      if (statusFilter === 'DALAM_PENGIRIMAN' && item.status !== 'Dalam Pengiriman') return false;
      if (statusFilter === 'SELESAI' && item.status !== 'Selesai Kirim') return false;
      if (statusFilter === 'OVER' && Number(item.totalVolume) <= Number(item.targetVolume)) return false;

      // Date Range Filter
      if (startDate && item.tanggal && item.tanggal < startDate) return false;
      if (endDate && item.tanggal && item.tanggal > endDate) return false;

      // Free-text Search (multi-term, deep waybill details)
      const q = (searchQuery || '').toLowerCase().trim();
      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);

        const sjDetails = Array.isArray(item.suratJalanDetails) && item.suratJalanDetails.length > 0
          ? item.suratJalanDetails
          : getJournalPendingSjs(item, suratJalanList);
        const sjText = sjDetails
          .map((d) => [
            String(d.nomorSuratJalan || d.noSJ || d.id || ''),
            String(d.material || ''),
            String(d.nomorPolisi || d.nopol || ''),
            String(d.driver || d.sopir || ''),
            String(d.supplier || d.quarry || ''),
          ].join(' '))
          .join(' ');

        let dateAliases = String(item.tanggal || '');
        if (item.tanggal && item.tanggal.includes('-')) {
          const parts = item.tanggal.split('-');
          if (parts.length === 3) {
            const [y, m, d] = parts;
            dateAliases += ` ${d}-${m}-${y} ${d}/${m}/${y}`;
            const months = [
              'januari', 'februari', 'maret', 'april', 'mei', 'juni',
              'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
            ];
            const mIdx = parseInt(m, 10) - 1;
            if (months[mIdx]) dateAliases += ` ${months[mIdx]} ${months[mIdx].slice(0, 3)}`;
          }
        }

        const isOver = Number(item.targetVolume) > 0 && Number(item.totalVolume) > Number(item.targetVolume);
        const statusAliases = [
          item.status || '',
          item.status === 'Selesai Kirim' ? 'selesai completed finish tuntas lunas' : '',
          item.status === 'Dalam Pengiriman' ? 'dalam pengiriman berjalan aktif proses shipping delivery' : '',
          item.status === 'Siap Kirim' ? 'siap kirim ready antrian belum kirim' : '',
          isOver ? 'over over-delivery kelebihan kuota' : '',
        ].join(' ');

        const searchableText = [
          String(item.id || ''),
          String(item.nomorRO || ''),
          String(item.poNumber || ''),
          String(item.customer || ''),
          String(item.customerAddress || ''),
          String(item.material || ''),
          String(item.satuan || ''),
          dateAliases,
          statusAliases,
          sjText,
        ]
          .join(' ')
          .toLowerCase();

        const matchAllTerms = terms.every((term) => searchableText.includes(term));
        if (!matchAllTerms) return false;
      }

      return true;
    });
  }, [rekapanList, suratJalanList, customerFilter, materialFilter, taxFilter, statusFilter, startDate, endDate, searchQuery]);

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

    // Prioritize approved / closed preOrders and aggregate across all daily journals & SJs
    const activePos = (preOrders || []).filter((p) => ['APPROVED', 'SELESAI_KIRIM', 'SELESAI', 'COMPLETED'].includes(String(p.status || '').toUpperCase()));
    for (const po of activePos) {
      const finalRo = po.nomorRO || (generateNomorRO ? generateNomorRO(po.customer, preOrders, po.tanggal, customers) : '');
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

      const matchedJournals = (rekapanList || []).filter((r) => r.nomorRO === finalRo || r.preOrderId === po.id);
      const firstJurnal = matchedJournals[0] || null;
      const hasLockedJurnal = matchedJournals.some((r) => r.statusLock === 'LOCKED');

      const roSjs = (suratJalanList || []).filter(
        (sj) => (po.id && String(sj.preOrderId) === String(po.id)) || (finalRo && sj.nomorRO === finalRo)
      );
      const lockedDetails = matchedJournals.flatMap((j) =>
        Array.isArray(j.suratJalanDetails) ? j.suratJalanDetails : []
      );
      const details = roSjs.length > 0 ? roSjs : lockedDetails;
      const currentVol = details.length > 0
        ? Number(details.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2))
        : Number(po.terkirim || matchedJournals.reduce((s, j) => s + (Number(j.totalVolume) || 0), 0) || 0);
      const currentSj = details.length > 0 ? details.length : matchedJournals.reduce((s, j) => s + (Number(j.totalSj) || 0), 0);
      const sisaVolume = Math.max(0, Number((targetVol - currentVol).toFixed(2)));
      const isCompleted = po.status === 'SELESAI_KIRIM' || (targetVol > 0 && currentVol >= targetVol);

      list.push({
        id: firstJurnal?.id || `RO-SYNC-${po.id}`,
        nomorRO: finalRo,
        preOrderId: po.id,
        poNumber: po.nomorPo || firstJurnal?.poNumber || 'MENUNGGU SURAT JALAN PERTAMA',
        customer: po.customer,
        customerAddress: po.customerAddress || firstJurnal?.customerAddress || '',
        material: matName,
        satuan: po.satuan || 'm3',
        tanggal: po.tanggal || firstJurnal?.tanggal,
        isPpn: po.jenisWajibPajak === 'PKP',
        targetVolume: targetVol,
        totalSj: currentSj,
        totalVolume: currentVol,
        sisaVolume,
        hasLockedJurnal,
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

  // Complete materials list from data
  const availableMaterialOptions = useMemo(() => {
    const set = new Set();
    (receivedOrders || []).forEach((r) => { if (r.material) set.add(r.material); });
    (rekapanList || []).forEach((r) => { if (r.material) set.add(r.material); });
    if (materials && Array.isArray(materials)) {
      materials.forEach((m) => { if (m.name) set.add(m.name); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [receivedOrders, rekapanList, materials]);

  // Filtered RO list based on unified filters & search query
  const filteredReceivedOrders = useMemo(() => {
    return (receivedOrders || []).filter((ro) => {
      // 1. Customer Filter
      if (customerFilter !== 'ALL' && ro.customer !== customerFilter) {
        return false;
      }

      // 2. Material Filter
      if (materialFilter !== 'ALL' && ro.material !== materialFilter) {
        return false;
      }

      // 3. Tax Filter
      if (taxFilter === 'ppn' && !ro.isPpn) return false;
      if (taxFilter === 'non-ppn' && ro.isPpn) return false;

      // 4. Status Filter
      if (statusFilter === 'SIAP_KIRIM' && ro.status !== 'Siap Kirim') return false;
      if (statusFilter === 'DALAM_PENGIRIMAN' && ro.status !== 'Dalam Pengiriman') return false;
      if (statusFilter === 'SELESAI' && ro.status !== 'Selesai Kirim') return false;
      if (statusFilter === 'OVER' && ro.totalVolume <= ro.targetVolume) return false;

      // 5. Date Filter
      if (startDate && ro.tanggal && ro.tanggal < startDate) return false;
      if (endDate && ro.tanggal && ro.tanggal > endDate) return false;

      // 6. Free text Search (Multi-term, deep SJ details)
      const q = (searchQuery || '').toLowerCase().trim();
      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);

        const sjDetails = Array.isArray(ro.suratJalanDetails) ? ro.suratJalanDetails : [];
        const sjText = sjDetails
          .map((d) => [
            String(d.nomorSuratJalan || d.noSJ || d.id || ''),
            String(d.nomorPolisi || d.nopol || ''),
            String(d.driver || d.sopir || ''),
            String(d.supplier || d.quarry || ''),
          ].join(' '))
          .join(' ');

        let dateAliases = String(ro.tanggal || '');
        if (ro.tanggal && ro.tanggal.includes('-')) {
          const parts = ro.tanggal.split('-');
          if (parts.length === 3) {
            const [y, m, d] = parts;
            dateAliases += ` ${d}-${m}-${y} ${d}/${m}/${y}`;
            const months = [
              'januari', 'februari', 'maret', 'april', 'mei', 'juni',
              'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
            ];
            const mIdx = parseInt(m, 10) - 1;
            if (months[mIdx]) dateAliases += ` ${months[mIdx]} ${months[mIdx].slice(0, 3)}`;
          }
        }

        const isOver = ro.targetVolume > 0 && ro.totalVolume > ro.targetVolume;
        const statusAliases = [
          ro.status || '',
          ro.status === 'Selesai Kirim' ? 'selesai completed finish tuntas lunas' : '',
          ro.status === 'Dalam Pengiriman' ? 'dalam pengiriman berjalan aktif proses shipping delivery' : '',
          ro.status === 'Siap Kirim' ? 'siap kirim ready antrian belum kirim' : '',
          isOver ? 'over over-delivery kelebihan kuota' : '',
          !ro.poNumber || ro.poNumber === 'MENUNGGU SURAT JALAN PERTAMA' ? 'menunggu surat jalan pertama draft po' : '',
        ].join(' ');

        const searchableText = [
          String(ro.id || ''),
          String(ro.nomorRO || ''),
          String(ro.poNumber || ''),
          String(ro.nomorPoCustomer || ''),
          String(ro.customer || ''),
          String(ro.customerAddress || ''),
          String(ro.material || ''),
          String(ro.satuan || ''),
          dateAliases,
          statusAliases,
          sjText,
        ]
          .join(' ')
          .toLowerCase();

        const matchAllTerms = terms.every((term) => searchableText.includes(term));
        if (!matchAllTerms) return false;
      }

      return true;
    });
  }, [receivedOrders, customerFilter, materialFilter, taxFilter, statusFilter, startDate, endDate, searchQuery]);

  // Overall RO Statistics based on filtered data
  const roStats = useMemo(() => {
    const totalRo = filteredReceivedOrders.length;
    const totalTargetVol = Number(filteredReceivedOrders.reduce((sum, r) => sum + (Number(r.targetVolume) || 0), 0).toFixed(2));
    const totalDeliveredVol = Number(filteredReceivedOrders.reduce((sum, r) => sum + (Number(r.totalVolume) || 0), 0).toFixed(2));
    const totalIssuedSj = filteredReceivedOrders.reduce((sum, r) => sum + (Number(r.totalSj) || 0), 0);
    const totalSelesai = filteredReceivedOrders.filter((r) => r.status === 'Selesai Kirim').length;
    const totalBerjalan = filteredReceivedOrders.filter((r) => r.status === 'Dalam Pengiriman').length;
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
  }, [filteredReceivedOrders]);

  const handleMulaiChange = (val) => {
    setStartDate(val);
    if (endDate && val && val > endDate) {
      setEndDate(val);
    }
  };

  const handleAkhirChange = (val) => {
    if (startDate && val && val < startDate) {
      addToast('Tanggal akhir tidak boleh sebelum tanggal mulai', 'warning');
      return;
    }
    setEndDate(val);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    customerFilter !== 'ALL' ||
    materialFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    taxFilter !== 'all' ||
    startDate ||
    endDate
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('ALL');
    setMaterialFilter('ALL');
    setStatusFilter('ALL');
    setTaxFilter('all');
    setStartDate('');
    setEndDate('');
    addToast('Semua filter rekapan berhasil di-reset', 'info');
  };

  const currentCount = activeTab === 'orders' ? filteredReceivedOrders.length : filteredData.length;
  const totalCount = activeTab === 'orders' ? receivedOrders.length : (rekapanList || []).length;

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
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#F4511E] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Buku Besar Jurnal GI ({filteredData.length})</span>
            </button>
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

      {/* ── UNIFIED FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-[#14171A] border border-[#22262A] rounded-2xl p-3 sm:p-4 space-y-3 font-mono">
        {/* Row 1: Search Bar (prominent) + Quick Dropdown Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          {/* Free Text Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Cari nomor RO, PO, customer, material, no. surat jalan, nopol armada, status..."
              className="w-full bg-[#1C1F24] border border-[#2B3037] focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]/30 rounded-xl pl-10 pr-28 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all shadow-inner font-mono"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery.trim() && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F4511E]/10 text-[#F4511E] border border-[#F4511E]/30 hidden sm:inline">
                  {currentCount} ditemukan
                </span>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  title="Hapus pencarian (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Dropdowns & Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Customer Filter */}
            <div className="relative">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="bg-[#1C1F24] border border-[#2B3037] rounded-xl pl-3 pr-7 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#F4511E] appearance-none cursor-pointer hover:border-neutral-500 transition-colors"
              >
                <option value="ALL">Semua Pelanggan</option>
                {(customers || []).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.alias ? `(${c.alias})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Material Filter */}
            <div className="relative">
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="bg-[#1C1F24] border border-[#2B3037] rounded-xl pl-3 pr-7 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#F4511E] appearance-none cursor-pointer hover:border-neutral-500 transition-colors"
              >
                <option value="ALL">Semua Material</option>
                {availableMaterialOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Lanjutan Toggle (Status, PPN, Tanggal) */}
            <button
              type="button"
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
                filterPanelOpen || (hasActiveFilters && (statusFilter !== 'ALL' || taxFilter !== 'all' || startDate || endDate))
                  ? 'border-[#F4511E] text-[#F4511E] bg-[#F4511E]/10'
                  : 'border-[#2B3037] text-neutral-300 hover:border-neutral-500 bg-[#1C1F24]'
              }`}
              title="Filter Status, PPN & Tanggal"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Detail</span>
              {filterPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                addToast('Data rekapan diperbarui', 'info');
              }}
              className="p-2 rounded-xl border border-[#2B3037] text-neutral-400 hover:text-white hover:border-neutral-500 bg-[#1C1F24] transition-colors cursor-pointer"
              title="Perbarui Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Panel for Status, PPN, and Date Range */}
        {filterPanelOpen && (
          <div className="bg-[#101214] border border-[#202429] rounded-xl p-3.5 space-y-3 font-mono text-xs">
            {/* Status Pills */}
            <div>
              <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#F4511E]" />
                <span>Status Pengiriman:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'SIAP_KIRIM', label: 'Siap Kirim (0%)' },
                  { id: 'DALAM_PENGIRIMAN', label: 'Dalam Pengiriman (1-99%)' },
                  { id: 'SELESAI', label: 'Selesai Kirim (100%)' },
                  { id: 'OVER', label: 'Over-Delivery' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      statusFilter === s.id
                        ? 'bg-[#F4511E] text-white font-bold'
                        : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262B33]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PPN & Date Range Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1C2025]">
              {/* PPN Segment */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Kategori Perpajakan
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#181B1E] p-1 rounded-lg border border-[#262B33]">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'non-ppn', label: 'Non-PPN' },
                    { id: 'ppn', label: 'PPN 11%' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTaxFilter(t.id)}
                      className={`py-1 text-[11px] rounded transition-all cursor-pointer ${
                        taxFilter === t.id
                          ? 'bg-[#F4511E] text-white font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal Mulai */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Tanggal Mulai Kirim
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleMulaiChange(e.target.value)}
                  className="w-full bg-[#181B1E] border border-[#262B33] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              {/* Tanggal Akhir */}
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Tanggal Akhir Kirim
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => handleAkhirChange(e.target.value)}
                  className="w-full bg-[#181B1E] border border-[#262B33] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-[#1F2329]">
            <span className="text-[11px] text-neutral-500 font-mono">Filter aktif:</span>
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/30 text-[#F4511E] text-[11px] font-mono">
                <span>Pencarian: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Hapus filter pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {customerFilter !== 'ALL' && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-[#F4511E]/30 bg-[#F4511E]/10 text-[#F4511E] cursor-pointer"
                onClick={() => setCustomerFilter('ALL')}
                title="Hapus filter pelanggan"
              >
                <span>Pelanggan: {customerFilter}</span>
                <X className="w-3 h-3" />
              </span>
            )}
            {materialFilter !== 'ALL' && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 cursor-pointer"
                onClick={() => setMaterialFilter('ALL')}
                title="Hapus filter material"
              >
                <span>Material: {materialFilter}</span>
                <X className="w-3 h-3" />
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 cursor-pointer"
                onClick={() => setStatusFilter('ALL')}
                title="Hapus filter status"
              >
                <span>Status: {statusFilter.replace('_', ' ')}</span>
                <X className="w-3 h-3" />
              </span>
            )}
            {taxFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 cursor-pointer"
                onClick={() => setTaxFilter('all')}
                title="Hapus filter pajak"
              >
                <span>Pajak: {taxFilter === 'ppn' ? 'PPN 11%' : 'Non-PPN'}</span>
                <X className="w-3 h-3" />
              </span>
            )}
            {(startDate || endDate) && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 cursor-pointer"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                title="Hapus filter tanggal"
              >
                <span>Tanggal: {startDate || '...'} s/d {endDate || '...'}</span>
                <X className="w-3 h-3" />
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 underline font-mono ml-auto cursor-pointer"
            >
              Reset semua
            </button>
          </div>
        )}
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

          {/* Section Sub-Header */}
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Daftar Received Order &amp; Realisasi Pengiriman:</span>
            </span>
            <span>Menampilkan <strong className="text-white">{filteredReceivedOrders.length}</strong> dari {receivedOrders.length} order</span>
          </div>

          {/* List of Received Orders (Compact, using Modal Dialog for Waybill list) */}
          {filteredReceivedOrders.length === 0 ? (
            <Card className="p-8 text-center text-neutral-400 space-y-3 border-[#24282C] bg-[#14171A]">
              <PackageCheck className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">
                {hasActiveFilters
                  ? 'Tidak ada data Received Order yang cocok dengan filter pencarian.'
                  : 'Tidak ada data Received Order aktif.'}
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Silakan coba ubah kata kunci atau hapus filter yang sedang aktif.'
                  : 'Belum ada Received Order berstatus APPROVED untuk dimonitor.'}
              </p>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={handleResetFilters} className="mx-auto">
                  Reset Filter
                </Button>
              )}
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
                                  fromPreOrder: true,
                                  preOrderId: ro.preOrderId,
                                  nomorRO: ro.nomorRO,
                                  nomorRo: ro.nomorRO,
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
                            disabled={!ro.hasLockedJurnal}
                            onClick={() => {
                              if (!ro.hasLockedJurnal) {
                                addToast(
                                  `Order ${ro.nomorRO || ro.id} belum memiliki Jurnal berstatus LOCKED. Kunci minimal 1 Jurnal harian sebelum membuat Invoice.`,
                                  'error'
                                );
                                return;
                              }
                              navigate('/invoices', {
                                state: {
                                  order: ro,
                                  fromRekapan: true,
                                  activeTab: 'create',
                                },
                              });
                              addToast(`Membuka form Input Invoice untuk ${ro.nomorRO}`, 'info');
                            }}
                            className={
                              !ro.hasLockedJurnal
                                ? 'opacity-40 cursor-not-allowed border-neutral-800 text-neutral-500'
                                : 'border-[#2D3339] hover:border-[#F4511E] text-white font-medium cursor-pointer'
                            }
                            title={
                              !ro.hasLockedJurnal
                                ? 'Minimal 1 Jurnal harus dikunci (LOCKED) sebelum Invoice dapat dibuat.'
                                : 'Buat Faktur Tagihan Invoice'
                            }
                          >
                            Input Invoice {!ro.hasLockedJurnal && '(Terkunci)'}
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

                    {/* Primary Delivery Volume Progress (m³) & Secondary Good Issue (GI) Info */}
                    <div className="bg-[#111315] p-3.5 rounded-lg border border-[#1F2327] space-y-2.5 font-mono">
                      {/* Row 1: Volume Progress Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                        <div className="flex items-center gap-2 text-neutral-300 font-medium">
                          <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-white font-semibold">Progress Kubikasi Terkirim:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 text-sm sm:text-base">
                            {formatVolume(ro.totalVolume, ro.satuan)}
                          </span>
                          <span className="text-neutral-500 font-normal">/</span>
                          <span className="text-neutral-300 font-medium">
                            {formatVolume(ro.targetVolume, ro.satuan)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                            {fulfillmentVolPct}%
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Prominent Volume Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#1C1F23] overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-amber-500 to-[#F4511E] transition-all duration-300"
                          style={{ width: `${fulfillmentVolPct}%` }}
                        />
                      </div>

                      {/* Row 3: Subline Volume Detail */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>
                          Sisa volume: <strong className="text-neutral-200">{formatVolume(ro.sisaVolume, ro.satuan)}</strong>
                        </span>
                        <span className={ro.status === 'Selesai Kirim' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
                          {ro.status === 'Selesai Kirim' ? '✓ Kuota Volume Terpenuhi' : `${fulfillmentVolPct}% terealisasi`}
                        </span>
                      </div>

                      {/* Row 4: Secondary Informational Element — Total Good Issues (GI) */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-[#1C2024]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="text-neutral-400">Total Good Issue (GI):</span>
                          <strong className="text-neutral-200 font-semibold">{ro.totalSj} dokumen terbit</strong>
                        </div>
                        <span className="text-[10px] text-neutral-500">
                          {ro.totalSj > 0 ? 'Berdasarkan catatan riil pengiriman' : 'Belum ada pengiriman'}
                        </span>
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

          {/* Section Sub-Header */}
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Daftar Rekapan Siap Tagih / BKK:</span>
            </span>
            <span>Menampilkan <strong className="text-white">{filteredData.length}</strong> dari {(rekapanList || []).length} berkas</span>
          </div>

          {/* Rekapan Result List */}
          {filteredData.length === 0 ? (
            <Card className="p-8 text-center text-neutral-400 space-y-3 border-[#24282C] bg-[#14171A]">
              <Layers className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">
                {hasActiveFilters
                  ? 'Tidak ada berkas rekapan yang cocok dengan filter pencarian.'
                  : 'Belum ada data Buku Besar Rekapan.'}
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Silakan coba ubah kata kunci pencarian atau sesuaikan filter pelanggan/tanggal.'
                  : 'Jurnal GI harian otomatis dibuat saat Surat Jalan (GI) pertama pada tanggal tersebut diterbitkan (bukan saat RO disetujui).'}
              </p>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={handleResetFilters} className="mx-auto">
                  Reset Filter
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filteredData.map((rek) => {
                const isExpanded = expandedCardIds.has(rek.id);
                const details = Array.isArray(rek.suratJalanDetails) ? rek.suratJalanDetails : [];
                const pendingSjs = getJournalPendingSjs(rek, suratJalanList);
                const journalSjs = rek.statusLock === 'LOCKED' ? details : pendingSjs;
                const pendingMatSummary = rek.statusLock !== 'LOCKED' && pendingSjs.length > 0
                  ? Object.values(
                      pendingSjs.reduce((acc, sj) => {
                        const mat = sj.material || rek.material || 'MATERIAL';
                        if (!acc[mat]) acc[mat] = { material: mat, ritase: 0, volume: 0 };
                        acc[mat].ritase += 1;
                        acc[mat].volume = Number((acc[mat].volume + (Number(sj.volumeAkhir) || 0)).toFixed(2));
                        return acc;
                      }, {})
                    )
                  : [];
                const targetVol = Number(rek.targetVolume) || 0;
                const currentVol = Number(rek.totalVolume) || 0;
                const fulfillmentPct = targetVol > 0
                  ? Math.min(100, Math.round((currentVol / targetVol) * 100))
                  : (currentVol > 0 ? 100 : 0);
                const isCompleted = targetVol > 0 && currentVol >= targetVol;
                const hasLockedJurnal =
                  rek.statusLock === 'LOCKED' ||
                  (rekapanList || []).some(
                    (r) =>
                      r.statusLock === 'LOCKED' &&
                      ((rek.preOrderId && r.preOrderId === rek.preOrderId) ||
                        (rek.nomorRO && r.nomorRO === rek.nomorRO))
                  );

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
                            {rek.statusLock === 'LOCKED' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                                <Lock className="w-3 h-3" />
                                <span>LOCKED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                                <AlertCircle className="w-3 h-3" />
                                <span>OPEN</span>
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{rek.customer}</span>
                            <span className="text-neutral-600">&bull;</span>
                            <span className="text-amber-400 font-semibold">{rek.material}</span>
                          </div>

                          {(() => {
                            let summaryItems = [];
                            if (typeof rek.itemsSummary === 'string') {
                              try { summaryItems = JSON.parse(rek.itemsSummary); } catch (e) { summaryItems = []; }
                            } else if (Array.isArray(rek.itemsSummary)) {
                              summaryItems = rek.itemsSummary;
                            }
                            const displaySummary = summaryItems.length > 0 ? summaryItems : pendingMatSummary;
                            if (displaySummary.length > 1) {
                              return (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    {rek.statusLock === 'LOCKED' ? 'Katalog Material:' : 'Material (Menunggu Lock):'}
                                  </span>
                                  {displaySummary.map((sm, sIdx) => (
                                    <span key={sIdx} className="text-[10px] bg-neutral-900 border border-neutral-700 text-amber-300 px-2 py-0.5 rounded font-mono">
                                      {sm.material}: {formatVolume(sm.volume, sm.satuan || 'm3')} ({sm.ritase ?? sm.count ?? 0} GI)
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 flex-wrap">
                            <span className="bg-[#1C1F22] px-1.5 py-0.5 rounded text-neutral-300">
                              PO: {rek.poNumber || 'DRAFT (Menunggu SJ 1)'}
                            </span>
                            <span>&bull;</span>
                            <span className="text-white font-medium">
                              {rek.statusLock === 'LOCKED'
                                ? `${details.length || rek.totalSj} Good Issue (Terkunci)`
                                : `${pendingSjs.length} Good Issue (Menunggu Lock)`}
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
                            {rek.statusLock !== 'LOCKED' && (
                              <Button
                                size="xs"
                                variant="warning"
                                icon={Lock}
                                isLoading={lockingId === rek.id}
                                onClick={() => handleLockJurnal(rek.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                title="Kunci Jurnal (Lock) dan segel seluruh Surat Jalan hari ini"
                              >
                                Kunci Jurnal (Lock)
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="outline"
                              icon={Clock}
                              onClick={() => handleOpenAuditTrail(rek.id, rek.nomorRO || rek.id)}
                              className="border-[#2D3339] hover:border-amber-500 text-neutral-300 hover:text-white cursor-pointer"
                              title="Lihat riwayat audit Lock/Unlock jurnal ini"
                            >
                              Audit Log
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              icon={FileText}
                              onClick={() => {
                                const journalTotalVol = rek.statusLock === 'LOCKED'
                                  ? currentVol
                                  : Number(journalSjs.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2));
                                setSelectedOrderForModal({
                                  ...rek,
                                  isJournalScoped: true,
                                  hasLockedJurnal,
                                  suratJalanDetails: journalSjs,
                                  totalSj: journalSjs.length,
                                  totalVolume: journalTotalVol,
                                });
                              }}
                              className="border-[#2D3339] hover:border-[#F4511E] text-white cursor-pointer"
                            >
                              Daftar SJ ({journalSjs.length})
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={!hasLockedJurnal}
                              onClick={() => {
                                if (!hasLockedJurnal) {
                                  addToast(
                                    `Order ${rek.nomorRO || rek.id} belum memiliki Jurnal berstatus LOCKED. Kunci minimal 1 Jurnal harian sebelum membuat BKK.`,
                                    'error'
                                  );
                                  return;
                                }
                                navigate('/bkk', { state: { order: rek, fromRekapan: true, activeTab: 'create' } });
                                addToast(`Beralih ke kas keluar BKK untuk ${rek.nomorRO || rek.id}`, 'info');
                              }}
                              className={
                                !hasLockedJurnal
                                  ? 'opacity-40 cursor-not-allowed border-neutral-800 text-neutral-500 hover:border-neutral-800 hover:text-neutral-500'
                                  : 'cursor-pointer'
                              }
                              title={
                                !hasLockedJurnal
                                  ? 'Minimal 1 Jurnal harus dikunci (LOCKED) sebelum BKK dapat dibuat.'
                                  : 'Proses ke Bukti Kas Keluar'
                              }
                            >
                              Ke BKK {!hasLockedJurnal && '(Terkunci)'}
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              icon={FileText}
                              disabled={!hasLockedJurnal}
                              onClick={() => {
                                if (!hasLockedJurnal) {
                                  addToast(
                                    `Order ${rek.nomorRO || rek.id} belum memiliki Jurnal berstatus LOCKED. Kunci minimal 1 Jurnal harian sebelum membuat Invoice.`,
                                    'error'
                                  );
                                  return;
                                }
                                navigate('/invoices', {
                                  state: {
                                    order: rek,
                                    fromRekapan: true,
                                    activeTab: 'create',
                                  },
                                });
                                addToast(`Membuka form Input Invoice untuk ${rek.nomorRO || rek.id}`, 'info');
                              }}
                              title={
                                !hasLockedJurnal
                                  ? 'Minimal 1 Jurnal harus dikunci (LOCKED) sebelum Invoice dapat dibuat.'
                                  : 'Terbitkan Faktur Tagihan Invoice Customer'
                              }
                              className={
                                !hasLockedJurnal
                                  ? 'opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-500'
                                  : 'bg-[#F4511E] hover:bg-[#ff6b3d] text-white font-semibold cursor-pointer'
                              }
                            >
                              Input Invoice {!hasLockedJurnal && '(Terkunci)'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DIALOG: DAFTAR SURAT JALAN PER ORDER (POP-UP WINDOW)     */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        title={
          selectedOrderForModal?.isJournalScoped
            ? `Daftar Surat Jalan Jurnal — ${selectedOrderForModal?.id || ''}`
            : `Daftar Surat Jalan — ${selectedOrderForModal?.nomorRO || ''}`
        }
        subtitle={
          selectedOrderForModal?.isJournalScoped
            ? `RO: ${selectedOrderForModal?.nomorRO || ''} • Tanggal GI: ${selectedOrderForModal?.tanggal || '-'} • Status: ${selectedOrderForModal?.statusLock || 'OPEN'} • ${selectedOrderForModal?.customer || ''}`
            : `${selectedOrderForModal?.customer || ''} • Material: ${selectedOrderForModal?.material || ''} • No. PO: ${selectedOrderForModal?.poNumber || 'DRAFT'}`
        }
        maxWidth="max-w-5xl"
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
                      <th className="py-2.5 px-3">ID GI (DO)</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Nopol Armada</th>
                      <th className="py-2.5 px-3">Tgl GI (Dibuat) &amp; Waktu</th>
                      <th className="py-2.5 px-3">Jadwal Kirim</th>
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
                          #{sj.id}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 font-semibold">
                          {sj.material || selectedOrderForModal.material || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-300 font-medium">
                          {sj.nopol}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-300">
                          {sj.tanggalDibuat || sj.tanggal} <span className="text-neutral-500">{sj.waktu || ''}</span>
                        </td>
                        <td className="py-2.5 px-3 text-sky-300">
                          {sj.tanggalJadwal || sj.tanggalDibuat || sj.tanggal || '-'}
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

            {/* Footer Actions inside Modal — Clean, Symmetrical & Aligned */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5 border-t border-[#22262A]">
              {/* Left Side: Close button & summary count */}
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrderForModal(null)}
                  className="h-9 px-4 text-xs font-medium border-[#2A2E33] hover:border-neutral-500 text-neutral-300 hover:text-white cursor-pointer"
                >
                  Tutup
                </Button>
                <div className="text-xs text-neutral-400 font-mono hidden md:block">
                  Total: <strong className="text-white">{selectedOrderForModal.suratJalanDetails.length} Good Issue</strong> &bull; Terkirim: <strong className="text-amber-400">{formatVolume(selectedOrderForModal.totalVolume, selectedOrderForModal.satuan)}</strong>
                </div>
              </div>

              {/* Right Side: Symmetrical 3 Action Buttons (Input, Invoice, Buat Surat Jalan Baru) */}
              <div className="flex items-center gap-2 order-1 sm:order-2 flex-wrap sm:flex-nowrap justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  icon={FileText}
                  disabled={!selectedOrderForModal.hasLockedJurnal}
                  onClick={() => {
                    const ro = selectedOrderForModal;
                    if (!ro.hasLockedJurnal) {
                      addToast(
                        `Order ${ro.nomorRO || ro.id} belum memiliki Jurnal berstatus LOCKED. Kunci minimal 1 Jurnal harian sebelum membuat Invoice.`,
                        'error'
                      );
                      return;
                    }
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
                  className={`h-9 px-3.5 text-xs border-[#2D3339] font-medium flex-1 sm:flex-none justify-center whitespace-nowrap ${
                    !selectedOrderForModal.hasLockedJurnal
                      ? 'opacity-40 cursor-not-allowed text-neutral-500'
                      : 'hover:border-[#F4511E] text-neutral-200 hover:text-white cursor-pointer'
                  }`}
                  title={
                    !selectedOrderForModal.hasLockedJurnal
                      ? 'Minimal 1 Jurnal harus dikunci (LOCKED) sebelum Invoice dapat dibuat.'
                      : 'Form Input Invoice untuk order ini'
                  }
                >
                  Input
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  icon={ExternalLink}
                  onClick={() => {
                    const ro = selectedOrderForModal;
                    setSelectedOrderForModal(null);
                    navigate('/invoices', {
                      state: {
                        order: ro,
                        fromRekapan: true,
                        activeTab: 'list',
                      },
                    });
                    addToast(`Membuka daftar Invoice untuk ${ro.nomorRO}`, 'info');
                  }}
                  className="h-9 px-3.5 text-xs border-[#2D3339] hover:border-[#F4511E] text-neutral-200 hover:text-white font-medium cursor-pointer flex-1 sm:flex-none justify-center whitespace-nowrap"
                  title="Lihat modul Invoice terkait order ini"
                >
                  Invoice
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
                  className="h-9 px-4 text-xs bg-[#F4511E] hover:bg-[#D84315] text-white font-semibold cursor-pointer shadow-sm flex-1 sm:flex-none justify-center whitespace-nowrap"
                  title="Terbitkan Surat Jalan (Good Issue) baru"
                >
                  Buat Surat Jalan Baru
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: AUDIT TRAIL JURNAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title={`Audit Trail Jurnal - ${selectedJurnalForAudit?.label || selectedJurnalForAudit?.id}`}
        subtitle="Riwayat aktivitas Kunci (Lock) dan Buka Kunci (Unlock) Jurnal"
      >
        <div className="p-4 space-y-4">
          {loadingAudit ? (
            <div className="py-8 text-center text-neutral-400 font-mono text-xs">
              Memuat log audit Jurnal...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 font-mono text-xs">
              Belum ada catatan aktivitas audit pada Jurnal ini.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2.5 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-[#24282C] bg-[#14171A] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.action === 'LOCK' || log.action === 'AUTO_RELOCK'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="text-neutral-300">
                    Oleh: <strong className="text-white">{log.actorName || log.actor || 'System'}</strong>
                    {log.actorRole && (
                      <span className="ml-1.5 text-[10px] text-neutral-400">({log.actorRole})</span>
                    )}
                  </div>

                  {log.reason && (
                    <div className="text-neutral-400 text-[11px]">
                      Alasan: <span className="italic text-neutral-300">{log.reason}</span>
                    </div>
                  )}

                  {(log.details || log.changesSummary) && (
                    <div className="text-[10px] text-neutral-400 bg-neutral-900/50 p-1.5 rounded break-all">
                      Detail: {typeof (log.details || log.changesSummary) === 'string'
                        ? (log.details || log.changesSummary)
                        : JSON.stringify(log.details || log.changesSummary)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#24282C] flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
