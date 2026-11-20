import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Truck,
  Receipt,
  Banknote,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Clock,
  Loader2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Badge, Button, Modal } from '../../components/ui';
import SelectField from '../../components/form/SelectField';
import TextField from '../../components/form/TextField';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ReportFilterCard from '../../components/laporan/ReportFilterCard';
import ReportEmptyState from '../../components/laporan/ReportEmptyState';

export default function LaporanAllInOnePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark, language } = useApp();
  const { isSuperAdmin } = useAuth();
  const { customers, preOrders, suratJalanList, invoiceList, bkkList } = useData();

  // Filters state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRoId, setSelectedRoId] = useState('');
  const [selectedPoNumber, setSelectedPoNumber] = useState('');

  // Execution state
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [activeTab, setActiveTab] = useState('surat_jalan'); // 'surat_jalan' | 'invoices' | 'bkk' | 'ro'
  const [searchTable, setSearchTable] = useState('');

  // Modals for selection
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || !customers) return null;
    return customers.find((c) => c.id === selectedCustomerId || c.name === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Customer dropdown options
  const customerOptions = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    return customers.map((c) => ({
      value: c.id,
      label: c.name + (c.kodePrefix ? ` (${c.kodePrefix})` : ''),
    }));
  }, [customers]);

  // Filtered customer list for modal
  const filteredCustomerModalList = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.kodePrefix && c.kodePrefix.toLowerCase().includes(q)) ||
      (c.alamat && c.alamat.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Available ROs based on customer or general list
  const roOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (preOrders || []).forEach((po) => {
      if (selectedCustomer) {
        const custName = selectedCustomer.name.toLowerCase();
        if (!po.customer || !po.customer.toLowerCase().includes(custName)) return;
      }
      const roLabel = po.nomorRO || `RO-${po.id}`;
      if (!seen.has(roLabel)) {
        seen.add(roLabel);
        list.push({
          value: po.nomorRO || po.id,
          label: `${roLabel} - ${po.materialName || 'Material'} (${po.customer || ''})`,
        });
      }
    });

    (suratJalanList || []).forEach((sj) => {
      if (selectedCustomer) {
        const custName = selectedCustomer.name.toLowerCase();
        if (!sj.customer || !sj.customer.toLowerCase().includes(custName)) return;
      }
      if (sj.nomorRO && !seen.has(sj.nomorRO)) {
        seen.add(sj.nomorRO);
        list.push({
          value: sj.nomorRO,
          label: `${sj.nomorRO} - ${sj.material || 'Material'} (${sj.customer || ''})`,
        });
      }
    });

    return list;
  }, [preOrders, suratJalanList, selectedCustomer]);

  // Check if at least one filter is filled
  const hasAtLeastOneFilter = Boolean(selectedCustomerId || selectedRoId || selectedPoNumber.trim());

  // Aggregate Data matching the combined filters
  const reportData = useMemo(() => {
    if (!hasApplied && !hasAtLeastOneFilter) return null;

    const custName = selectedCustomer?.name?.toLowerCase() || '';
    const roVal = selectedRoId.toLowerCase().trim();
    const poVal = selectedPoNumber.toLowerCase().trim();

    // 1. Filter Surat Jalan
    const filteredSj = (suratJalanList || []).filter((sj) => {
      if (custName && (!sj.customer || !sj.customer.toLowerCase().includes(custName))) return false;
      if (roVal && (!sj.nomorRO || !sj.nomorRO.toLowerCase().includes(roVal))) return false;
      if (poVal && (!sj.poNumber || !sj.poNumber.toLowerCase().includes(poVal))) return false;
      return true;
    });

    // 2. Filter Invoices
    const filteredInv = (invoiceList || []).filter((inv) => {
      if (custName && (!inv.perusahaan && !inv.customer)) return false;
      const cStr = (inv.perusahaan || inv.customer || '').toLowerCase();
      if (custName && !cStr.includes(custName)) return false;
      if (roVal && (!inv.nomorRO || !inv.nomorRO.toLowerCase().includes(roVal))) return false;
      if (poVal && (!inv.poNumber && !inv.kodeTransaksi)) return false;
      if (poVal) {
        const pStr = (inv.poNumber || inv.kodeTransaksi || '').toLowerCase();
        if (!pStr.includes(poVal)) return false;
      }
      return true;
    });

    // 3. Filter Pre Orders
    const filteredPo = (preOrders || []).filter((po) => {
      if (custName && (!po.customer || !po.customer.toLowerCase().includes(custName))) return false;
      if (roVal && (!po.nomorRO || !po.nomorRO.toLowerCase().includes(roVal))) return false;
      if (poVal && (!po.nomorPo || !po.nomorPo.toLowerCase().includes(poVal)) && (!po.nomorPoCustomer || !po.nomorPoCustomer.toLowerCase().includes(poVal))) return false;
      return true;
    });

    // 4. Filter BKK
    const filteredBkk = (bkkList || []).filter((bkk) => {
      if (custName) {
        const p = (bkk.perusahaan || '').toLowerCase();
        const r = (bkk.penerima || '').toLowerCase();
        if (!p.includes(custName) && !r.includes(custName)) return false;
      }
      if (poVal) {
        const k = (bkk.kodeTransaksi || '').toLowerCase();
        if (!k.includes(poVal)) return false;
      }
      return true;
    });

    // Metrics
    const totalVolumeKirim = filteredSj.reduce((sum, sj) => sum + (Number(sj.volumeAkhir) || 0), 0);
    const totalTagihan = filteredInv.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalTerbayar = filteredInv
      .filter((inv) => inv.statusBayar === 'Lunas')
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const sisaPiutang = totalTagihan - totalTerbayar;

    return {
      suratJalan: filteredSj,
      invoices: filteredInv,
      preOrders: filteredPo,
      bkk: filteredBkk,
      totalVolumeKirim,
      totalTagihan,
      totalTerbayar,
      sisaPiutang,
      hasRecords: filteredSj.length > 0 || filteredInv.length > 0 || filteredPo.length > 0 || filteredBkk.length > 0,
    };
  }, [hasApplied, hasAtLeastOneFilter, selectedCustomer, selectedRoId, selectedPoNumber, suratJalanList, invoiceList, preOrders, bkkList]);

  // Apply Action
  const handleApply = async () => {
    if (!hasAtLeastOneFilter) {
      addToast('Minimal salah satu filter (Customer, RO, atau PO) harus diisi terlebih dahulu.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (selectedCustomerId) qParams.set('customer_id', selectedCustomerId);
      if (selectedRoId) qParams.set('ro_id', selectedRoId);
      if (selectedPoNumber.trim()) qParams.set('po_customer_no', selectedPoNumber.trim());

      const res = await fetch(`/api/reports/all-in-one?${qParams.toString()}`, {
        headers: { 'x-user-role': isSuperAdmin ? 'superadmin' : 'admin' },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Gagal memuat laporan All in One (${res.status})`);
      }

      setHasApplied(true);
      addToast('Laporan All in One berhasil diterapkan.', 'success');
    } catch (err) {
      console.warn('Backend API request error, utilizing synchronized store data:', err.message);
      setHasApplied(true);
      addToast('Filter Laporan All in One diterapkan.', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCustomerId('');
    setSelectedRoId('');
    setSelectedPoNumber('');
    setHasApplied(false);
    setSearchTable('');
    addToast('Filter All in One berhasil direset.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.hasRecords) {
      addToast('Tidak ada data laporan untuk diekspor.', 'info');
      return;
    }

    const headers = ['Kategori Dokumen', 'No/Kode Dokumen', 'Tanggal', 'Material', 'Volume (m3)', 'Nominal (Rp)', 'Status'];
    const rows = [];

    (reportData.suratJalan || []).forEach((sj) => {
      rows.push(['Surat Jalan', sj.nomorSj, sj.tanggal, `"${sj.material || ''}"`, sj.volumeAkhir || 0, '-', sj.status || 'Terkirim']);
    });

    (reportData.invoices || []).forEach((inv) => {
      rows.push(['Invoice', inv.kodeTransaksi, inv.timestamp?.slice(0, 10) || inv.tanggal || '-', `"${inv.material || ''}"`, inv.volume || 0, inv.amount || 0, inv.statusBayar || 'Belum Lunas']);
    });

    (reportData.bkk || []).forEach((b) => {
      rows.push(['BKK (Kas Keluar)', b.kodeTransaksi, b.tanggal || '-', `"${b.material || ''}"`, b.kubikasi || 0, b.amount || 0, b.statusBayar || 'Belum Dibayar']);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const custLabel = selectedCustomer?.name ? selectedCustomer.name.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
    link.setAttribute('download', `Laporan_AllInOne_${custLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    addToast('File CSV Laporan All in One berhasil diunduh.', 'success');
  };

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
                Laporan All in One
              </h1>
              <Badge variant="neutral" className="text-[10px] font-mono uppercase">
                Konsolidasi RO, GI & Invoice
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pusat Rekapitulasi Menyeluruh Order Customer, Pengiriman Surat Jalan, & Tagihan Faktur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={!hasApplied || !reportData?.hasRecords}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ekspor CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cetak</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <ReportFilterCard
        title="Parameter Filter Laporan All in One"
        onApply={handleApply}
        onReset={handleReset}
        loading={loading}
        applyDisabled={!hasAtLeastOneFilter}
        applyLabel="Terapkan Filter"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Customer Select with Modal Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase tracking-wider">
                1. Pelanggan (Customer)
              </label>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="text-[10px] text-[#F4511E] hover:underline cursor-pointer font-medium"
              >
                Cari via Modal
              </button>
            </div>
            <SelectField
              icon={Building2}
              value={selectedCustomerId}
              onChange={(val) => {
                setSelectedCustomerId(val);
                setSelectedRoId(''); // Reset RO on customer change
              }}
              options={[{ value: '', label: '-- Semua / Pilih Customer --' }, ...customerOptions]}
              searchable
              placeholder="Pilih Customer..."
              disabled={loading}
            />
          </div>

          {/* 2. Receive Order ID */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              2. ID Received Order (RO)
            </label>
            <SelectField
              icon={Hash}
              value={selectedRoId}
              onChange={(val) => setSelectedRoId(val)}
              options={[{ value: '', label: '-- Semua / Pilih RO --' }, ...roOptions]}
              searchable
              placeholder="Pilih atau cari No. RO..."
              disabled={loading}
            />
          </div>

          {/* 3. Customer PO Number ID */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              3. Nomor PO Customer
            </label>
            <TextField
              value={selectedPoNumber}
              onChange={(val) => setSelectedPoNumber(val)}
              placeholder="Contoh: 4590011130 atau PO-..."
              disabled={loading}
            />
          </div>
        </div>

        <p className="text-[11px] text-neutral-400 mt-2 font-mono">
          * Catatan: Anda dapat mengisi salah satu atau kombinasi filter di atas. Sistem menggabungkan filter dengan logika AND.
        </p>
      </ReportFilterCard>

      {/* Selected Customer & Status Bar */}
      {selectedCustomer && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#16191D] border-[#22262A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF7043] flex items-center justify-center font-bold">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.kodePrefix && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#22262A] text-neutral-300">
                    {selectedCustomer.kodePrefix}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                NPWP: {selectedCustomer.npwp || '-'} • Alamat: {selectedCustomer.alamat || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabbed Report Content */}
      {hasApplied ? (
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
                <span>Surat Jalan ({reportData?.suratJalan?.length || 0})</span>
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
                <span>Invoice ({reportData?.invoices?.length || 0})</span>
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
                <span>Kontrak RO ({reportData?.preOrders?.length || 0})</span>
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
                <span>Kas Keluar / BKK ({reportData?.bkk?.length || 0})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari dalam tabel..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1A1D21] border-[#2E3339] text-white focus:border-[#F4511E]'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-[#F4511E]'
                }`}
              />
            </div>
          </div>

          {/* Tab 1: Surat Jalan */}
          {activeTab === 'surat_jalan' && (
            <div className="p-0">
              {(reportData.suratJalan || []).length === 0 ? (
                <div className="p-8">
                  <ReportEmptyState
                    title="Tidak ada data Surat Jalan untuk filter yang dipilih"
                    message="Belum ada riwayat pengiriman surat jalan yang cocok dengan kombinasi filter yang Anda terapkan."
                    onReset={handleReset}
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
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3">No. Surat Jalan</th>
                        <th className="py-3 px-3">No. RO</th>
                        <th className="py-3 px-3">No. PO Customer</th>
                        <th className="py-3 px-3">Material</th>
                        <th className="py-3 px-3 text-right">Volume (m³)</th>
                        <th className="py-3 px-3">Driver / Nopol</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                    }`}>
                      {reportData.suratJalan
                        .filter((sj) => {
                          const q = searchTable.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            (sj.nomorSj && sj.nomorSj.toLowerCase().includes(q)) ||
                            (sj.nomorRO && sj.nomorRO.toLowerCase().includes(q)) ||
                            (sj.poNumber && sj.poNumber.toLowerCase().includes(q)) ||
                            (sj.material && sj.material.toLowerCase().includes(q))
                          );
                        })
                        .map((sj, idx) => (
                          <tr key={sj.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                            <td className="py-3 px-3 whitespace-nowrap">{sj.tanggal}</td>
                            <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{sj.nomorSj}</td>
                            <td className="py-3 px-3 whitespace-nowrap text-neutral-300">{sj.nomorRO || '-'}</td>
                            <td className="py-3 px-3 whitespace-nowrap text-neutral-400">{sj.poNumber || '-'}</td>
                            <td className="py-3 px-3 font-sans max-w-[180px] truncate">{sj.material}</td>
                            <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{formatVolume(sj.volumeAkhir || 0)}</td>
                            <td className="py-3 px-3 font-sans text-neutral-300">{sj.driver || sj.nopol || '-'}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {sj.status || 'Terkirim'}
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
              {(reportData.invoices || []).length === 0 ? (
                <div className="p-8">
                  <ReportEmptyState
                    title="Tidak ada data Faktur Tagihan (Invoice)"
                    message="Belum ada catatan tagihan faktur yang cocok dengan kombinasi filter yang Anda terapkan."
                    onReset={handleReset}
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
                        <th className="py-3 px-3">Tanggal / Periode</th>
                        <th className="py-3 px-3">Kode Invoice</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Material</th>
                        <th className="py-3 px-3 text-right">Volume (m³)</th>
                        <th className="py-3 px-3 text-right">Total Tagihan (Rp)</th>
                        <th className="py-3 px-3 text-center">Status Bayar</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                    }`}>
                      {reportData.invoices
                        .filter((inv) => {
                          const q = searchTable.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            (inv.kodeTransaksi && inv.kodeTransaksi.toLowerCase().includes(q)) ||
                            (inv.material && inv.material.toLowerCase().includes(q))
                          );
                        })
                        .map((inv, idx) => (
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
          )}

          {/* Tab 3: Kontrak RO */}
          {activeTab === 'ro' && (
            <div className="p-0">
              {(reportData.preOrders || []).length === 0 ? (
                <div className="p-8">
                  <ReportEmptyState
                    title="Tidak ada data Kontrak RO"
                    message="Belum ada Received Order (RO) yang cocok dengan filter yang diterapkan."
                    onReset={handleReset}
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
                        <th className="py-3 px-3">Tanggal RO</th>
                        <th className="py-3 px-3">No. RO</th>
                        <th className="py-3 px-3">No. PO Customer</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Material</th>
                        <th className="py-3 px-3 text-right">Volume Kontrak</th>
                        <th className="py-3 px-3 text-right">Harga Jual (Rp)</th>
                        <th className="py-3 px-3 text-center">{language === 'en' ? 'Approval Status' : 'Status Persetujuan'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                    }`}>
                      {reportData.preOrders.map((po, idx) => (
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {po.status || 'APPROVED'}
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
              {(reportData.bkk || []).length === 0 ? (
                <div className="p-8">
                  <ReportEmptyState
                    title="Tidak ada data Kas Keluar (BKK) terkait"
                    message="Belum ada transaksi BKK yang tercatat untuk filter ini."
                    onReset={handleReset}
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
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3">No. BKK</th>
                        <th className="py-3 px-3">Penerima / Vendor</th>
                        <th className="py-3 px-3">Material</th>
                        <th className="py-3 px-3 text-right">Kubikasi (m³)</th>
                        <th className="py-3 px-3 text-right">Jumlah (Rp)</th>
                        <th className="py-3 px-3 text-center">Status Bayar</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#202428] text-neutral-200' : 'divide-slate-100 text-slate-700'
                    }`}>
                      {reportData.bkk.map((b, idx) => (
                        <tr key={b.id || idx} className={isDark ? 'hover:bg-[#1A1D21]' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-3 text-center text-neutral-400">{idx + 1}</td>
                          <td className="py-3 px-3 whitespace-nowrap">{b.tanggal}</td>
                          <td className="py-3 px-3 font-semibold text-[#FF7043] whitespace-nowrap">{b.kodeTransaksi || b.id}</td>
                          <td className="py-3 px-3 font-sans max-w-[180px] truncate">{b.perusahaan || b.penerima}</td>
                          <td className="py-3 px-3 font-sans max-w-[180px] truncate">{b.material}</td>
                          <td className="py-3 px-3 text-right font-medium">{formatVolume(b.kubikasi || b.volume || 0)}</td>
                          <td className="py-3 px-3 text-right font-bold text-[#FF7043] whitespace-nowrap">{formatCurrency(b.amount || 0)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              b.statusBayar === 'Lunas'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}>
                              {b.statusBayar || 'Belum Dibayar'}
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
      ) : (
        <div className="p-8">
          <ReportEmptyState
            title="Laporan All in One Siap Dijalankan"
            message="Silakan pilih Customer, ID Received Order, atau Nomor PO Customer pada kartu filter di atas, kemudian klik tombol 'Terapkan Filter'."
          />
        </div>
      )}

      {/* Customer Modal Selector */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Pilih Pelanggan (Customer)"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Ketik nama pelanggan, kode, atau alamat..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#1A1D21] border-[#2E3339] text-white focus:border-[#F4511E]'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#F4511E]'
              }`}
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {filteredCustomerModalList.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setCustomerModalOpen(false);
                  addToast(`Customer ${c.name} dipilih.`, 'info');
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedCustomerId === c.id
                    ? isDark ? 'bg-[#F4511E]/15 border-[#F4511E] text-white' : 'bg-orange-50 border-[#F4511E] text-[#F4511E]'
                    : isDark ? 'border-[#22262A] hover:bg-[#1A1D21]' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{c.name}</span>
                    {c.kodePrefix && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#24282D] text-neutral-300">
                        {c.kodePrefix}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-md">
                    {c.alamat || 'Alamat tidak terdata'}
                  </p>
                </div>
                {selectedCustomerId === c.id && (
                  <CheckCircle2 className="w-4 h-4 text-[#F4511E]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
