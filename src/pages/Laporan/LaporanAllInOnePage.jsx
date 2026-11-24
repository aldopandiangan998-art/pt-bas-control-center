import { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Truck,
  Receipt,
  Banknote,
  CheckCircle2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, SearchBar } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';
import ReportEmptyState from '../../components/laporan/ReportEmptyState';
import ReportStatCard from '../../components/laporan/ReportStatCard';

export default function LaporanAllInOnePage() {
  const { addToast } = useToast();
  const { isDark, language } = useApp();
  const { preOrders, suratJalanList, invoiceList, bkkList } = useData();

  // Active tab state: 'surat_jalan' | 'invoices' | 'ro' | 'bkk'
  const [activeTab, setActiveTab] = useState('surat_jalan');
  const [searchTable, setSearchTable] = useState('');

  // Aggregate All Company Data directly without parameter filters
  const reportData = useMemo(() => {
    const allSj = suratJalanList || [];
    const allInv = invoiceList || [];
    const allPo = preOrders || [];
    const allBkk = bkkList || [];

    const totalVolumeKirim = allSj.reduce((sum, sj) => sum + (Number(sj.volumeAkhir) || 0), 0);
    const totalTagihan = allInv.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalTerbayar = allInv
      .filter((inv) => inv.statusBayar === 'Lunas')
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const sisaPiutang = totalTagihan - totalTerbayar;

    return {
      suratJalan: allSj,
      invoices: allInv,
      preOrders: allPo,
      bkk: allBkk,
      totalVolumeKirim,
      totalTagihan,
      totalTerbayar,
      sisaPiutang,
      hasRecords: allSj.length > 0 || allInv.length > 0 || allPo.length > 0 || allBkk.length > 0,
    };
  }, [suratJalanList, invoiceList, preOrders, bkkList]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.hasRecords) {
      addToast(language === 'en' ? 'No report data available to export.' : 'Tidak ada data laporan untuk diekspor.', 'info');
      return;
    }

    const headers = ['Kategori Dokumen', 'No/Kode Dokumen', 'Tanggal', 'Customer / Rekanan', 'Material', 'Volume (m3)', 'Nominal (Rp)', 'Status'];
    const rows = [];

    (reportData.suratJalan || []).forEach((sj) => {
      rows.push(['Surat Jalan', sj.nomorSj, sj.tanggal, `"${sj.customer || ''}"`, `"${sj.material || ''}"`, sj.volumeAkhir || 0, '-', sj.status || 'Terkirim']);
    });

    (reportData.invoices || []).forEach((inv) => {
      rows.push(['Invoice', inv.kodeTransaksi, inv.timestamp?.slice(0, 10) || inv.tanggal || '-', `"${inv.perusahaan || inv.customer || ''}"`, `"${inv.material || ''}"`, inv.volume || 0, inv.amount || 0, inv.statusBayar || 'Belum Lunas']);
    });

    (reportData.preOrders || []).forEach((po) => {
      rows.push(['Kontrak RO', po.nomorRO || po.id, po.tanggal || '-', `"${po.customer || ''}"`, `"${po.materialName || 'Material'}"`, po.totalOrder || 0, (po.totalOrder || 0) * (po.hargaJual || 0), po.status || 'APPROVED']);
    });

    (reportData.bkk || []).forEach((b) => {
      rows.push(['BKK (Kas Keluar)', b.kodeTransaksi || b.id, b.tanggal || '-', `"${b.perusahaan || b.penerima || ''}"`, `"${b.material || ''}"`, b.kubikasi || b.volume || 0, b.amount || 0, b.statusBayar || 'Belum Dibayar']);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Laporan_AllInOne_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast(language === 'en' ? 'All-in-One CSV report successfully downloaded.' : 'File CSV Laporan All in One berhasil diunduh.', 'success');
  };

  // Filtered lists for table display matching search query
  const filteredSuratJalan = useMemo(() => {
    const q = searchTable.toLowerCase().trim();
    if (!q) return reportData.suratJalan;
    return reportData.suratJalan.filter((sj) => (
      (sj.nomorSj && sj.nomorSj.toLowerCase().includes(q)) ||
      (sj.customer && sj.customer.toLowerCase().includes(q)) ||
      (sj.nomorRO && sj.nomorRO.toLowerCase().includes(q)) ||
      (sj.poNumber && sj.poNumber.toLowerCase().includes(q)) ||
      (sj.material && sj.material.toLowerCase().includes(q)) ||
      (sj.driver && sj.driver.toLowerCase().includes(q)) ||
      (sj.nopol && sj.nopol.toLowerCase().includes(q))
    ));
  }, [reportData.suratJalan, searchTable]);

  const filteredInvoices = useMemo(() => {
    const q = searchTable.toLowerCase().trim();
    if (!q) return reportData.invoices;
    return reportData.invoices.filter((inv) => (
      (inv.kodeTransaksi && inv.kodeTransaksi.toLowerCase().includes(q)) ||
      (inv.perusahaan && inv.perusahaan.toLowerCase().includes(q)) ||
      (inv.customer && inv.customer.toLowerCase().includes(q)) ||
      (inv.nomorRO && inv.nomorRO.toLowerCase().includes(q)) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
      (inv.material && inv.material.toLowerCase().includes(q))
    ));
  }, [reportData.invoices, searchTable]);

  const filteredPreOrders = useMemo(() => {
    const q = searchTable.toLowerCase().trim();
    if (!q) return reportData.preOrders;
    return reportData.preOrders.filter((po) => (
      (po.nomorRO && po.nomorRO.toLowerCase().includes(q)) ||
      (po.nomorPoCustomer && po.nomorPoCustomer.toLowerCase().includes(q)) ||
      (po.nomorPo && po.nomorPo.toLowerCase().includes(q)) ||
      (po.customer && po.customer.toLowerCase().includes(q)) ||
      (po.materialName && po.materialName.toLowerCase().includes(q))
    ));
  }, [reportData.preOrders, searchTable]);

  const filteredBkk = useMemo(() => {
    const q = searchTable.toLowerCase().trim();
    if (!q) return reportData.bkk;
    return reportData.bkk.filter((b) => (
      (b.kodeTransaksi && b.kodeTransaksi.toLowerCase().includes(q)) ||
      (b.perusahaan && b.perusahaan.toLowerCase().includes(q)) ||
      (b.penerima && b.penerima.toLowerCase().includes(q)) ||
      (b.material && b.material.toLowerCase().includes(q))
    ));
  }, [reportData.bkk, searchTable]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'en' ? 'All in One Report' : 'Laporan All in One'}
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {language === 'en'
                ? 'Centralized overview of Customer Orders, Delivery Orders, and Invoices'
                : 'Pusat Rekapitulasi Menyeluruh Order Customer, Pengiriman Surat Jalan, & Tagihan Faktur'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={!reportData.hasRecords}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'en' ? 'Export CSV' : 'Ekspor CSV'}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-400" />
            <span>{language === 'en' ? 'Print' : 'Cetak'}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportStatCard
          title={language === 'en' ? 'Total Volume (GI)' : 'Total Volume Pengiriman'}
          value={`${formatVolume(reportData.totalVolumeKirim || 0)} m³`}
          icon={Truck}
          variant="orange"
        />
        <ReportStatCard
          title={language === 'en' ? 'Total Invoiced' : 'Total Tagihan Faktur'}
          value={formatCurrency(reportData.totalTagihan || 0)}
          icon={Receipt}
          variant="blue"
        />
        <ReportStatCard
          title={language === 'en' ? 'Total Paid' : 'Total Terbayar'}
          value={formatCurrency(reportData.totalTerbayar || 0)}
          icon={CheckCircle2}
          variant="emerald"
        />
        <ReportStatCard
          title={language === 'en' ? 'Outstanding Receivables' : 'Sisa Piutang'}
          value={formatCurrency(reportData.sisaPiutang || 0)}
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Main Tabbed Report Content */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
      }`}>
        {/* Tab Navigation Header */}
        <div className={`px-4 pt-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-[#22262A] bg-[#181B1E]' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('surat_jalan')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'surat_jalan'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Delivery Order' : 'Surat Jalan'} ({reportData.suratJalan.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice ({reportData.invoices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ro')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ro'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'RO Contract' : 'Kontrak RO'} ({reportData.preOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bkk')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bkk'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Cash Out / BKK' : 'Kas Keluar / BKK'} ({reportData.bkk.length})</span>
            </button>
          </div>

          <SearchBar
            containerClassName="w-full sm:w-64 pb-2 sm:pb-0"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            onClear={() => setSearchTable('')}
            placeholder={language === 'en' ? 'Search in table...' : 'Cari dalam tabel...'}
            size="sm"
          />
        </div>

        {/* Tab 1: Surat Jalan */}
        {activeTab === 'surat_jalan' && (
          <div className="p-0">
            {filteredSuratJalan.length === 0 ? (
              <div className="p-8">
                <ReportEmptyState
                  title={language === 'en' ? 'No Delivery Order Data' : 'Tidak ada data Surat Jalan'}
                  message={language === 'en' ? 'No delivery order records found.' : 'Belum ada riwayat pengiriman surat jalan.'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Date' : 'Tanggal'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'DO Number' : 'No. Surat Jalan'}</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">{language === 'en' ? 'RO No.' : 'No. RO'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Customer PO No.' : 'No. PO Customer'}</th>
                      <th className="py-3 px-3">Material</th>
                      <th className="py-3 px-3 text-right">Volume (m³)</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Driver / License Plate' : 'Driver / Nopol'}</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${
                    isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredSuratJalan.map((sj, idx) => (
                      <tr key={sj.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{sj.tanggal}</td>
                        <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{sj.nomorSj}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{sj.customer || '-'}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-300">{sj.nomorRO || '-'}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-400">{sj.poNumber || '-'}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{sj.material}</td>
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{formatVolume(sj.volumeAkhir || 0)}</td>
                        <td className="py-3 px-3 font-sans text-neutral-300">{sj.driver || sj.nopol || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {sj.status || (language === 'en' ? 'Delivered' : 'Terkirim')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div className="p-0">
            {filteredInvoices.length === 0 ? (
              <div className="p-8">
                <ReportEmptyState
                  title={language === 'en' ? 'No Invoice Data' : 'Tidak ada data Faktur Tagihan (Invoice)'}
                  message={language === 'en' ? 'No invoice records found.' : 'Belum ada catatan tagihan faktur invoice.'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Date / Period' : 'Tanggal / Periode'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Invoice Code' : 'Kode Invoice'}</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Material</th>
                      <th className="py-3 px-3 text-right">Volume (m³)</th>
                      <th className="py-3 px-3 text-right">{language === 'en' ? 'Total Amount (Rp)' : 'Total Tagihan (Rp)'}</th>
                      <th className="py-3 px-3 text-center">{language === 'en' ? 'Payment Status' : 'Status Bayar'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${
                    isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredInvoices.map((inv, idx) => (
                      <tr key={inv.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-300">
                          {inv.tanggal || inv.timestamp?.slice(0, 10) || inv.periode || '-'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{inv.kodeTransaksi}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{inv.perusahaan || inv.customer || '-'}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{inv.material || '-'}</td>
                        <td className="py-3 px-3 text-right font-medium">{formatVolume(inv.volume || 0)}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">{formatCurrency(inv.amount || 0)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.statusBayar === 'Lunas'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {inv.statusBayar === 'Lunas'
                              ? (language === 'en' ? 'Paid' : 'Lunas')
                              : (language === 'en' ? 'Unpaid' : (inv.statusBayar || 'Belum Lunas'))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Kontrak RO */}
        {activeTab === 'ro' && (
          <div className="p-0">
            {filteredPreOrders.length === 0 ? (
              <div className="p-8">
                <ReportEmptyState
                  title={language === 'en' ? 'No RO Contract Data' : 'Tidak ada data Kontrak RO'}
                  message={language === 'en' ? 'No Received Order (RO) records found.' : 'Belum ada data Received Order (RO).'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">{language === 'en' ? 'RO Date' : 'Tanggal RO'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'RO No.' : 'No. RO'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Customer PO No.' : 'No. PO Customer'}</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Material</th>
                      <th className="py-3 px-3 text-right">{language === 'en' ? 'Contract Vol' : 'Volume Kontrak'}</th>
                      <th className="py-3 px-3 text-right">{language === 'en' ? 'Selling Price (Rp)' : 'Harga Jual (Rp)'}</th>
                      <th className="py-3 px-3 text-center">{language === 'en' ? 'Approval Status' : 'Status Persetujuan'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${
                    isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredPreOrders.map((po, idx) => (
                      <tr key={po.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{po.tanggal}</td>
                        <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{po.nomorRO || po.id}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-neutral-400">{po.nomorPoCustomer || po.nomorPo || '-'}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{po.customer}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{po.materialName || 'Material'}</td>
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{formatVolume(po.totalOrder || 0)}</td>
                        <td className="py-3 px-3 text-right text-neutral-300 whitespace-nowrap">{formatCurrency(po.hargaJual || 0)}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            po.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : po.status === 'MENUNGGU_APPROVAL' || po.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30'
                          }`}>
                            {po.status === 'APPROVED'
                              ? (language === 'en' ? 'APPROVED' : 'DISETUJUI')
                              : (po.status === 'MENUNGGU_APPROVAL' || po.status === 'PENDING')
                              ? (language === 'en' ? 'PENDING APPROVAL' : 'MENUNGGU PERSETUJUAN')
                              : (po.status || 'APPROVED')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: BKK */}
        {activeTab === 'bkk' && (
          <div className="p-0">
            {filteredBkk.length === 0 ? (
              <div className="p-8">
                <ReportEmptyState
                  title={language === 'en' ? 'No Cash Out (BKK) Data' : 'Tidak ada data Kas Keluar (BKK)'}
                  message={language === 'en' ? 'No BKK transaction records found.' : 'Belum ada catatan transaksi kas keluar (BKK).'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark ? 'border-[#22262A] bg-[#16191D] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Date' : 'Tanggal'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'BKK No.' : 'No. BKK'}</th>
                      <th className="py-3 px-3">{language === 'en' ? 'Recipient / Vendor' : 'Penerima / Vendor'}</th>
                      <th className="py-3 px-3">Material</th>
                      <th className="py-3 px-3 text-right">{language === 'en' ? 'Volume (m³)' : 'Kubikasi (m³)'}</th>
                      <th className="py-3 px-3 text-right">{language === 'en' ? 'Amount (Rp)' : 'Jumlah (Rp)'}</th>
                      <th className="py-3 px-3 text-center">{language === 'en' ? 'Payment Status' : 'Status Bayar'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${
                    isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {filteredBkk.map((b, idx) => (
                      <tr key={b.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{b.tanggal}</td>
                        <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{b.kodeTransaksi || b.id}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{b.perusahaan || b.penerima || '-'}</td>
                        <td className="py-3 px-3 font-sans max-w-[180px] truncate">{b.material || '-'}</td>
                        <td className="py-3 px-3 text-right font-medium">{formatVolume(b.kubikasi || b.volume || 0)}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">{formatCurrency(b.amount || 0)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            b.statusBayar === 'Lunas'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {b.statusBayar === 'Lunas'
                              ? (language === 'en' ? 'Paid' : 'Lunas')
                              : (language === 'en' ? 'Unpaid' : (b.statusBayar || 'Belum Dibayar'))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
