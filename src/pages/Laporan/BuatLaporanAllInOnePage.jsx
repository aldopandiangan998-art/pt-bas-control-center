import { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';

export default function BuatLaporanAllInOnePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark } = useApp();
  const { customers, suratJalanList, bkkList, invoiceList, preOrders } = useData();

  // ── States matching Screenshot media_1794904357777_e633af37.jpg ──
  const [filterHidden, setFilterHidden] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
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

  // Aggregate Data for Selected Customer
  const customerReports = useMemo(() => {
    if (!selectedCustomer) return null;

    const custName = selectedCustomer.name;

    // 1. Pre Orders
    const relatedPos = (preOrders || []).filter(
      (po) => po.customer && po.customer.toLowerCase().includes(custName.toLowerCase())
    );

    // 2. Surat Jalan
    const relatedSj = (suratJalanList || []).filter(
      (sj) => sj.customer && sj.customer.toLowerCase().includes(custName.toLowerCase())
    );

    // 3. Invoices
    const relatedInvoices = (invoiceList || []).filter(
      (inv) => inv.perusahaan && inv.perusahaan.toLowerCase().includes(custName.toLowerCase())
    );

    // 4. BKK
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
      relatedPos,
      relatedSj,
      relatedInvoices,
      relatedBkk,
      totalVolumeKirim,
      totalTagihan,
      totalTerbayar,
      sisaPiutang,
    };
  }, [selectedCustomer, preOrders, suratJalanList, invoiceList, bkkList]);

  const handleApplyFilter = () => {
    if (!selectedCustomer) {
      addToast('Pilih pelanggan terlebih dahulu sebelum menerapkan filter.', 'warning');
      setCustomerModalOpen(true);
      return;
    }
    setHasApplied(true);
    addToast(`Filter diterapkan untuk ${selectedCustomer.name}`, 'success');
  };

  const handleBuatLaporan = () => {
    if (!selectedCustomer) {
      addToast('Silakan pilih pelanggan terlebih dahulu untuk membuat laporan All-In-One.', 'info');
      setCustomerModalOpen(true);
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
            onClick={() => navigate('/laporan')}
            className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kembali ke Pusat Laporan"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-mono">
            Buat Laporan All-In-One
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setFilterHidden(!filterHidden)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Toggle Filter"
          aria-label="Filter"
        >
          <Filter className="w-5 h-5" />
        </button>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-3 space-y-4">
        {/* ── FILTER CARD CONTAINER (Faithful to Screenshot) ── */}
        <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
          {/* Animated Collapsible Filter Inputs */}
          <AnimatePresence initial={false}>
            {!filterHidden && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5 overflow-hidden"
              >
                {/* 1. Input: Pilih Pelanggan with User icon & Orange Underline */}
                <div
                  onClick={() => setCustomerModalOpen(true)}
                  className="bg-[#171A1E] hover:bg-[#1C2025] border-b-2 border-[#F4511E] rounded-t-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setCustomerModalOpen(true)}
                  title="Klik untuk memilih pelanggan"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-4 h-4 text-neutral-400 group-hover:text-[#F4511E] transition-colors shrink-0" />
                    <span
                      className={`text-xs font-mono font-medium truncate ${
                        selectedCustomer ? 'text-white font-semibold' : 'text-[#E06D44]'
                      }`}
                    >
                      {selectedCustomer ? selectedCustomer.name : 'Pilih Pelanggan'}
                    </span>
                  </div>

                  <ChevronDown className="w-4 h-4 text-[#F4511E] shrink-0 ml-2" />
                </div>

                {/* 2. Full-Width Orange Button: TERAPKAN */}
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="w-full py-3.5 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:scale-[0.99] text-[#0A0C0E] font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-md shadow-[#F4511E]/25 cursor-pointer text-center"
                >
                  TERAPKAN
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Toggle Button: Sembunyikan Filter ^ / Tampilkan Filter v */}
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={() => setFilterHidden(!filterHidden)}
              className="px-4 py-1.5 rounded-lg border border-[#383E46] hover:border-[#F4511E] text-[#E06D44] hover:text-[#FF7043] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent"
            >
              <span>{filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}</span>
              {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA WHEN APPLIED ── */}
        {hasApplied && selectedCustomer && customerReports && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2"
          >
            {/* Customer Summary Card */}
            <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#20242A]">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#F4511E] block">
                    Pelanggan Terpilih
                  </span>
                  <h2 className="text-base font-bold text-white font-mono mt-0.5">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    {selectedCustomer.alamat || 'Gresik, Jawa Timur'} • NPWP: {selectedCustomer.npwp || '-'}
                  </p>
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

            {/* Breakdown Lists */}
            <div className="bg-[#121417] border border-[#20242A] rounded-2xl p-4 sm:p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#F4511E]" />
                <span>Riwayat Surat Jalan Terakhir ({customerReports.relatedSj.length})</span>
              </h3>

              {customerReports.relatedSj.length === 0 ? (
                <p className="text-xs text-neutral-500 font-mono py-2">
                  Belum ada transaksi Surat Jalan untuk pelanggan ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#171A1E] text-neutral-400 border-b border-[#24282F]">
                      <tr>
                        <th className="py-2 px-3">No. SJ</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Material</th>
                        <th className="py-2 px-3">Armada / Driver</th>
                        <th className="py-2 px-3 text-right">Volume</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20242A]">
                      {customerReports.relatedSj.map((sj) => (
                        <tr key={sj.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{sj.nomorSj}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{sj.tanggal}</td>
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
          </motion.div>
        )}
      </main>

      {/* ── FLOATING ACTION BUTTON (+ BUAT) matching Screenshot ── */}
      <button
        type="button"
        onClick={handleBuatLaporan}
        className="fixed bottom-6 right-6 z-40 bg-[#F4511E] hover:bg-[#E04418] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full flex items-center gap-2 shadow-xl shadow-[#F4511E]/40 transition-all cursor-pointer font-mono"
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
        <div className="p-4 space-y-3 font-mono">
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
                      setCustomerModalOpen(false);
                      setHasApplied(false); // Reset to allow explicit TERAPKAN click or ready state
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
                        <div className="text-xs font-bold truncate">{c.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {c.kodePrefix ? `[${c.kodePrefix}] ` : ''}{c.kota || 'Gresik'}
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

      {/* ── MODAL EXPORT & CETAK LAPORAN ALL-IN-ONE ── */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Buat Laporan All-In-One"
        subtitle={selectedCustomer ? `Pelanggan: ${selectedCustomer.name}` : ''}
      >
        <div className="p-4 space-y-4 font-mono text-xs">
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
