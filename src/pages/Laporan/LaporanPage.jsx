import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  FileText,
  Truck,
  Receipt,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';

export default function LaporanPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark } = useApp();
  const { customers, suratJalanList, bkkList, invoiceList, preOrders } = useData();

  // ── States strictly matching Screenshot media_1794964617296_7cac7e57.jpg ──
  const [filterHidden, setFilterHidden] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRo, setSelectedRo] = useState(null);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [hasApplied, setHasApplied] = useState(true);

  // Modals
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [roModalOpen, setRoModalOpen] = useState(false);
  const [roSearch, setRoSearch] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Filtered customer list for modal selection
  const customerOptions = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    return customers.filter((c) => {
      const q = customerSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.kodePrefix && c.kodePrefix.toLowerCase().includes(q)) ||
        (c.kota && c.kota.toLowerCase().includes(q))
      );
    });
  }, [customers, customerSearch]);

  // Available Received Orders (RO) for the selected customer
  const availableRos = useMemo(() => {
    if (!selectedCustomer) return [];
    const custName = selectedCustomer.name.toLowerCase();

    const list = [];
    const seen = new Set();

    // 1. From preOrders
    (preOrders || []).forEach((po) => {
      if (po.customer && po.customer.toLowerCase().includes(custName)) {
        const roLabel = po.nomorRO || po.nomorRo || `RO-${po.id}`;
        const poNum = po.nomorPo || po.id;
        if (!seen.has(roLabel)) {
          seen.add(roLabel);
          list.push({
            id: po.id,
            nomorRoLabel: roLabel,
            nomorPo: poNum,
            material: po.materialName || po.material || 'Material Curah',
            tanggal: po.tanggal || '-',
            volume: po.totalOrder || 0,
            satuan: po.satuan || 'm3',
          });
        }
      }
    });

    // 2. From suratJalanList
    (suratJalanList || []).forEach((sj) => {
      if (sj.customer && sj.customer.toLowerCase().includes(custName) && sj.poNumber) {
        const roLabel = sj.nomorRo || `RO-${sj.poNumber}`;
        if (!seen.has(roLabel)) {
          seen.add(roLabel);
          list.push({
            id: sj.poNumber,
            nomorRoLabel: roLabel,
            nomorPo: sj.poNumber,
            material: sj.material || 'Material Tambang',
            tanggal: sj.tanggal || '-',
            volume: sj.volumeAkhir || 0,
            satuan: 'm3',
          });
        }
      }
    });

    // If empty in mock data, provide default reference for testing
    if (list.length === 0) {
      list.push({
        id: `RO-${selectedCustomer.id || '01'}`,
        nomorRoLabel: `RO-2026-${(selectedCustomer.kodePrefix || 'BAS').replace(/\s+/g, '')}-01`,
        nomorPo: `PO-CUST-${(selectedCustomer.kodePrefix || 'BAS').replace(/\s+/g, '')}-2026`,
        material: 'BASE COURSE / LIMESTONE',
        tanggal: new Date().toISOString().slice(0, 10),
        volume: 250,
        satuan: 'm3',
      });
    }

    return list;
  }, [selectedCustomer, preOrders, suratJalanList]);

  // Filtered RO options for modal
  const roOptions = useMemo(() => {
    return availableRos.filter((ro) => {
      const q = roSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        ro.nomorRoLabel.toLowerCase().includes(q) ||
        ro.nomorPo.toLowerCase().includes(q) ||
        ro.material.toLowerCase().includes(q)
      );
    });
  }, [availableRos, roSearch]);

  // Aggregate Data for Selected Customer & RO
  const customerReports = useMemo(() => {
    if (!selectedCustomer) return null;

    const custName = selectedCustomer.name;

    // 1. Surat Jalan (filtered by customer, and optionally by selected RO/PO)
    const relatedSj = (suratJalanList || []).filter((sj) => {
      const matchCust = sj.customer && sj.customer.toLowerCase().includes(custName.toLowerCase());
      if (!matchCust) return false;
      if (selectedPoNumber && sj.poNumber) {
        return sj.poNumber.toLowerCase().includes(selectedPoNumber.toLowerCase());
      }
      return true;
    });

    // 2. Invoices (filtered by customer, and optionally by selected PO)
    const relatedInvoices = (invoiceList || []).filter((inv) => {
      const matchCust = inv.perusahaan && inv.perusahaan.toLowerCase().includes(custName.toLowerCase());
      if (!matchCust) return false;
      if (selectedPoNumber && inv.poNumber) {
        return inv.poNumber.toLowerCase().includes(selectedPoNumber.toLowerCase());
      }
      return true;
    });

    // 3. BKK
    const relatedBkk = (bkkList || []).filter(
      (bkk) => bkk.perusahaan && bkk.perusahaan.toLowerCase().includes(custName.toLowerCase())
    );

    // Totals
    const totalVolumeKirim = relatedSj.reduce((sum, sj) => sum + (Number(sj.volumeAkhir) || 0), 0);
    const totalTagihan = relatedInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalTerbayar = relatedInvoices
      .filter((inv) => inv.statusBayar === 'Lunas')
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const sisaPiutang = totalTagihan - totalTerbayar;

    return {
      relatedSj,
      relatedInvoices,
      relatedBkk,
      totalVolumeKirim,
      totalTagihan,
      totalTerbayar,
      sisaPiutang,
    };
  }, [selectedCustomer, selectedPoNumber, suratJalanList, invoiceList, bkkList]);

  // Reset all filter states to initial pristine state
  const handleResetFilter = () => {
    setSelectedCustomer(null);
    setSelectedRo(null);
    setSelectedPoNumber('');
    setHasApplied(false);
    addToast('Filter berhasil direset.', 'info');
  };

  const handleApplyFilter = () => {
    if (!selectedCustomer) {
      addToast('Pilih pelanggan terlebih dahulu sebelum menerapkan filter.', 'warning');
      setCustomerModalOpen(true);
      return;
    }
    setHasApplied(true);
    const roInfo = selectedRo ? ` (${selectedRo.nomorRoLabel})` : '';
    addToast(`Filter diterapkan untuk ${selectedCustomer.name}${roInfo}`, 'success');
  };

  const handleBuatLaporan = () => {
    if (!selectedCustomer) {
      addToast('Silakan pilih pelanggan terlebih dahulu untuk membuat laporan All-In-One.', 'info');
      setCustomerModalOpen(true);
      return;
    }
    if (!selectedRo) {
      addToast('ID Received Order wajib dipilih terlebih dahulu.', 'warning');
      setRoModalOpen(true);
      return;
    }
    setExportModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!selectedCustomer || !customerReports) return;
    const headers = ['Tipe', 'Kode/No Dokumen', 'Tanggal', 'Material', 'Volume (m3)', 'Nominal (IDR)', 'Status'];
    const rows = [];

    customerReports.relatedSj.forEach((sj) => {
      rows.push(['Surat Jalan', sj.nomorSj, sj.tanggal, sj.material, sj.volumeAkhir, '-', sj.status || 'Selesai']);
    });
    customerReports.relatedInvoices.forEach((inv) => {
      rows.push(['Invoice', inv.kodeTransaksi, inv.timestamp?.slice(0, 10), inv.material, inv.volume, inv.amount, inv.statusBayar]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_AllInOne_${selectedCustomer.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Laporan All-In-One berhasil diekspor ke CSV!', 'success');
    setExportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white flex flex-col font-sans select-none relative pb-28">
      {/* ── TOP APP BAR (matching screenshot) ── */}
      <header className="sticky top-0 z-30 bg-[#0A0C0E] border-b border-[#1A1D21] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
            Buat Laporan All-In-One
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setFilterHidden(!filterHidden)}
          className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Filter"
          aria-label="Filter"
        >
          <Filter className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-3 space-y-4">
        {/* ── FILTER CARD CONTAINER (Faithful to Screenshot media_1794964617296_7cac7e57.jpg) ── */}
        <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
          {/* Animated Collapsible Filter Inputs */}
          <AnimatePresence initial={false}>
            {!filterHidden && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {/* ── ROW 1: Customer Selector + Reset Button ── */}
                <div className="flex items-stretch gap-2.5">
                  {/* Customer Input Box */}
                  <div
                    onClick={() => setCustomerModalOpen(true)}
                    className="flex-1 bg-[#1E2228] hover:bg-[#252A32] border-b-2 border-[#F4511E] rounded-t-xl px-4 py-2.5 cursor-pointer transition-colors group flex flex-col justify-center min-w-0"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setCustomerModalOpen(true)}
                    title="Klik untuk memilih pelanggan"
                  >
                    <span className="text-[10px] text-[#F4511E] font-medium tracking-wide">
                      Pilih Pelanggan
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <User className="w-4 h-4 text-neutral-400 group-hover:text-[#F4511E] transition-colors shrink-0" />
                        <span
                          className={`text-xs sm:text-sm font-medium truncate ${
                            selectedCustomer ? 'text-white font-semibold' : 'text-[#F4511E]'
                          }`}
                        >
                          {selectedCustomer
                            ? `${selectedCustomer.kodePrefix ? `${selectedCustomer.kodePrefix} - ` : ''}${selectedCustomer.name}`
                            : 'Pilih Pelanggan'}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                    </div>
                  </div>

                  {/* Orange Reset Button with RotateCcw (matches screenshot) */}
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="w-13 h-13 sm:w-14 sm:h-14 bg-[#F4511E] hover:bg-[#E04418] active:scale-95 text-white rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md shadow-[#F4511E]/25 cursor-pointer"
                    title="Reset Filter"
                    aria-label="Reset Filter"
                  >
                    <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" />
                  </button>
                </div>

                {/* ── ROW 2: ID Received Order ── */}
                <div
                  onClick={() => {
                    if (!selectedCustomer) {
                      addToast('Pilih pelanggan terlebih dahulu.', 'warning');
                      setCustomerModalOpen(true);
                      return;
                    }
                    setRoModalOpen(true);
                  }}
                  className="bg-[#1E2228] hover:bg-[#252A32] rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-[#333842] group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!selectedCustomer) {
                        setCustomerModalOpen(true);
                      } else {
                        setRoModalOpen(true);
                      }
                    }
                  }}
                  title="Pilih ID Received Order (Wajib)"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Receipt className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors shrink-0" />
                    <span
                      className={`text-xs sm:text-sm font-medium truncate ${
                        selectedRo ? 'text-white font-semibold' : 'text-neutral-400'
                      }`}
                    >
                      {selectedRo ? selectedRo.nomorRoLabel : 'ID Received Order'}
                    </span>
                  </div>
                </div>

                {/* ── ROW 3: ID Nomor PO Customer (auto) ── */}
                <div
                  onClick={() => {
                    if (!selectedCustomer) {
                      addToast('Pilih pelanggan terlebih dahulu.', 'warning');
                      setCustomerModalOpen(true);
                      return;
                    }
                    if (!selectedRo) {
                      addToast('Pilih ID Received Order terlebih dahulu agar Nomor PO Customer terisi otomatis.', 'info');
                      setRoModalOpen(true);
                      return;
                    }
                  }}
                  className="bg-[#1E2228] rounded-xl px-4 py-3.5 flex items-center justify-between transition-colors border border-transparent group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  title="ID Nomor PO Customer terisi otomatis saat Received Order dipilih"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Receipt className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span
                      className={`text-xs sm:text-sm font-medium truncate ${
                        selectedPoNumber ? 'text-white font-semibold' : 'text-neutral-400'
                      }`}
                    >
                      {selectedPoNumber ? selectedPoNumber : 'ID Nomor PO Customer (auto)'}
                    </span>
                  </div>
                </div>

                {/* ── ROW 4: Button TERAPKAN ── */}
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="w-full py-3.5 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:scale-[0.99] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F4511E]/25 cursor-pointer text-center"
                >
                  TERAPKAN
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ROW 5: Toggle Sembunyikan Filter ^ / Tampilkan Filter v ── */}
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={() => setFilterHidden(!filterHidden)}
              className="px-4 py-1.5 rounded-lg border border-[#383E46] hover:border-[#F4511E] text-[#F4511E] hover:text-[#FF7043] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent"
            >
              <span>{filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}</span>
              {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA WHEN APPLIED (Report Data) ── */}
        {selectedCustomer && customerReports && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2"
          >
            {/* Customer Summary Card */}
            <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20242A]">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#F4511E] block">
                    Pelanggan Terpilih
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {selectedCustomer.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400 font-mono">
                    <span>{selectedCustomer.alamat || 'Gresik, Jawa Timur'}</span>
                    {selectedRo && (
                      <span className="px-2 py-0.5 rounded bg-[#1F2228] text-white border border-[#2C313A]">
                        RO: {selectedRo.nomorRoLabel}
                      </span>
                    )}
                    {selectedPoNumber && (
                      <span className="px-2 py-0.5 rounded bg-[#1F2228] text-[#F4511E] border border-[#2C313A]">
                        PO: {selectedPoNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Printer}
                    onClick={handlePrint}
                    title="Cetak Laporan"
                  >
                    Cetak
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Download}
                    onClick={() => setExportModalOpen(true)}
                    title="Ekspor Laporan"
                  >
                    Ekspor
                  </Button>
                </div>
              </div>

              {/* KPI Mini-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#171A1E] p-3 rounded-xl border border-[#262B32]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Total Kirim</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {formatVolume(customerReports.totalVolumeKirim, 'm3')}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    {customerReports.relatedSj.length} Surat Jalan
                  </span>
                </div>

                <div className="bg-[#171A1E] p-3 rounded-xl border border-[#262B32]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Total Tagihan</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {formatCurrency(customerReports.totalTagihan)}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    {customerReports.relatedInvoices.length} Faktur
                  </span>
                </div>

                <div className="bg-[#171A1E] p-3 rounded-xl border border-[#262B32]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Terbayar</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">
                    {formatCurrency(customerReports.totalTerbayar)}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Lunas</span>
                </div>

                <div className="bg-[#171A1E] p-3 rounded-xl border border-[#262B32]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Sisa Piutang</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">
                    {formatCurrency(customerReports.sisaPiutang)}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Outstanding</span>
                </div>
              </div>
            </div>

            {/* Riwayat Surat Jalan */}
            <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#F4511E]" />
                <span>Riwayat Surat Jalan ({customerReports.relatedSj.length})</span>
              </h3>

              {customerReports.relatedSj.length === 0 ? (
                <p className="text-xs text-neutral-500 py-3 text-center">
                  Belum ada transaksi Surat Jalan untuk filter ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#171A1E] text-neutral-400 border-b border-[#24282F]">
                      <tr>
                        <th className="py-2.5 px-3">No. SJ</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">No. PO Customer</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Armada / Driver</th>
                        <th className="py-2.5 px-3 text-right">Volume</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20242A]">
                      {customerReports.relatedSj.map((sj) => (
                        <tr key={sj.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{sj.nomorSj}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{sj.tanggal}</td>
                          <td className="py-2.5 px-3 text-[#F4511E] font-medium">{sj.poNumber || '-'}</td>
                          <td className="py-2.5 px-3 text-neutral-200">{sj.material}</td>
                          <td className="py-2.5 px-3 text-neutral-300">{sj.nopol} • {sj.driver}</td>
                          <td className="py-2.5 px-3 text-right text-white font-bold">{sj.volumeAkhir} m³</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {sj.status || 'Selesai'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Riwayat Faktur Invoice */}
            <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#F4511E]" />
                <span>Riwayat Tagihan Invoice ({customerReports.relatedInvoices.length})</span>
              </h3>

              {customerReports.relatedInvoices.length === 0 ? (
                <p className="text-xs text-neutral-500 py-3 text-center">
                  Belum ada faktur invoice untuk filter ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#171A1E] text-neutral-400 border-b border-[#24282F]">
                      <tr>
                        <th className="py-2.5 px-3">Kode Invoice</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">No. PO Customer</th>
                        <th className="py-2.5 px-3">Deskripsi / Material</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20242A]">
                      {customerReports.relatedInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{inv.kodeTransaksi}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{inv.timestamp?.slice(0, 10)}</td>
                          <td className="py-2.5 px-3 text-[#F4511E] font-medium">{inv.poNumber || '-'}</td>
                          <td className="py-2.5 px-3 text-neutral-200">{inv.material || 'Material Tambang'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${
                                inv.statusBayar === 'Lunas'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {inv.statusBayar || 'Belum Lunas'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* ── FLOATING ACTION BUTTON (+ BUAT) matching Screenshot ── */}
      <button
        type="button"
        onClick={handleBuatLaporan}
        className="fixed bottom-6 right-6 z-40 bg-[#F4511E] hover:bg-[#E04418] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full flex items-center gap-2 shadow-xl shadow-[#F4511E]/40 transition-all cursor-pointer font-sans"
        title="Buat Laporan All-In-One"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>BUAT</span>
      </button>

      {/* ── MODAL PILIH PELANGGAN ── */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Pilih Pelanggan"
        subtitle="Pilih salah satu customer untuk menyusun laporan All-In-One"
      >
        <div className="p-4 space-y-3 font-sans">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Cari nama atau kode pelanggan..."
              className="w-full bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
              autoFocus
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => setCustomerSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customer List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {customerOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Tidak ada pelanggan yang cocok dengan pencarian.
              </div>
            ) : (
              customerOptions.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setSelectedRo(null);
                      setSelectedPoNumber('');
                      setCustomerModalOpen(false);
                      setHasApplied(false);
                      addToast(`Pelanggan "${c.name}" dipilih`, 'info');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#F4511E]/15 border-[#F4511E] text-white'
                        : 'bg-[#16191D] border-[#24282F] hover:border-[#383E46] text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#20242B] flex items-center justify-center text-[#F4511E] font-bold text-xs shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {c.kodePrefix ? `${c.kodePrefix} - ` : ''}{c.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {c.alamat || 'Gresik, Jawa Timur'}
                        </div>
                      </div>
                    </div>

                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#F4511E] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setCustomerModalOpen(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL PILIH ID RECEIVED ORDER ── */}
      <Modal
        isOpen={roModalOpen}
        onClose={() => setRoModalOpen(false)}
        title="Pilih ID Received Order (RO)"
        subtitle={selectedCustomer ? `Pelanggan: ${selectedCustomer.name}` : ''}
      >
        <div className="p-4 space-y-3 font-sans">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={roSearch}
              onChange={(e) => setRoSearch(e.target.value)}
              placeholder="Cari ID RO atau Nomor PO Customer..."
              className="w-full bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
              autoFocus
            />
            {roSearch && (
              <button
                type="button"
                onClick={() => setRoSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RO List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {roOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Tidak ada Received Order ditemukan untuk pelanggan ini.
              </div>
            ) : (
              roOptions.map((ro) => {
                const isSelected = selectedRo?.id === ro.id;
                return (
                  <div
                    key={ro.id}
                    onClick={() => {
                      setSelectedRo(ro);
                      setSelectedPoNumber(ro.nomorPo);
                      setRoModalOpen(false);
                      setHasApplied(false);
                      addToast(`RO "${ro.nomorRoLabel}" dipilih (Nomor PO terisi otomatis)`, 'success');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#F4511E]/15 border-[#F4511E] text-white'
                        : 'bg-[#16191D] border-[#24282F] hover:border-[#383E46] text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-white">
                          {ro.nomorRoLabel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#F4511E]/15 text-[#F4511E] font-mono border border-[#F4511E]/30">
                          PO: {ro.nomorPo}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {ro.material} • {ro.volume} {ro.satuan} • {ro.tanggal}
                      </div>
                    </div>

                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#F4511E] shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedRo(null);
                setSelectedPoNumber('');
                setRoModalOpen(false);
                addToast('RO diatur ke Semua', 'info');
              }}
              className="text-xs text-neutral-400 hover:text-white font-mono underline"
            >
              Reset ke Semua RO
            </button>
            <Button size="sm" variant="outline" onClick={() => setRoModalOpen(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL EXPORT & CETAK LAPORAN ALL-IN-ONE ── */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Buat Laporan All-In-One"
        subtitle={selectedCustomer ? `Pelanggan: ${selectedCustomer.name}` : ''}
      >
        <div className="p-4 space-y-4 font-sans text-xs">
          <p className="text-neutral-300 leading-relaxed">
            Laporan All-In-One merangkum seluruh pergerakan operasional, pengiriman Surat Jalan, tagihan Invoice, serta saldo piutang customer secara komprehensif.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full p-3 rounded-xl bg-[#171A1E] hover:bg-[#20242A] border border-[#282E37] text-white flex items-center gap-3 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F4511E]/15 text-[#F4511E] flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Cetak / Simpan PDF Laporan</span>
                <span className="text-[11px] text-neutral-400 block">Kirim langsung ke printer atau simpan sebagai dokumen PDF resmi</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full p-3 rounded-xl bg-[#171A1E] hover:bg-[#20242A] border border-[#282E37] text-white flex items-center gap-3 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Ekspor ke Spreadsheet (.CSV)</span>
                <span className="text-[11px] text-neutral-400 block">Format CSV lengkap kompatibel dengan Microsoft Excel dan Google Sheets</span>
              </div>
            </button>
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setExportModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
