import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Ticket,
  Calendar,
  Clock,
  RotateCw,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { TAX_RATES } from '../../utils/constants';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Button, Modal, Card, Input, Select } from '../../components/ui';

export default function InvoicePage() {
  const navigate = useNavigate();
  const { customers, bankAccounts, invoiceList, createInvoice, markInvoicePaid, deleteInvoice } = useData();
  const { addToast } = useToast();

  // Tab State: 'list' (Data Invoice) | 'create' (Input Invoice)
  const [activeTab, setActiveTab] = useState('list');

  // Search & Filter state for List view
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BELUM_BAYAR' | 'LUNAS'
  const [selectedItems, setSelectedItems] = useState([]);
  const [infoModalItem, setInfoModalItem] = useState(null);

  // Form state for creating invoice
  const [formData, setFormData] = useState({
    pelanggan: 'PT LION WINGS',
    kirimKeRekening: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    idReceivedOrder: 'RO-202611-00042',
    rekeningAtasNama: 'PT Berkah Alam Semesta',
    nomorPoCustomer: 'PO-LW-2026-089',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    materialType: 'Curah',
    materialName: 'SIRTU',
    volume: 100,
    subtotalJasa: 19371600,
  });

  const [filterHidden, setFilterHidden] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

  // Exact Tax calculations per Implementation Plan Section 2 (Aturan 28 - 31)
  // Aturan 30: PPH selalu dihitung atas semua jenis jasa tanpa syarat
  const calculation = useMemo(() => {
    const subtotal = formData.subtotalJasa;
    const ppnNominal = Math.round((subtotal * TAX_RATES.PPN_PERCENT) / 100);
    const pphRate = formData.materialType === 'Curah' ? TAX_RATES.PPH_CURAH : TAX_RATES.PPH_PADAT;
    const pphNominal = Math.round((subtotal * pphRate) / 100);
    const totalTagihan = subtotal + ppnNominal - pphNominal;

    return {
      subtotal,
      ppnNominal,
      pphRate,
      pphNominal,
      totalTagihan,
    };
  }, [formData.subtotalJasa, formData.materialType]);

  // Handle Generate Invoice
  const handleApply = (e) => {
    e.preventDefault();
    setInvoiceGenerated(true);
    createInvoice({
      volume: formData.volume,
      material: formData.materialName,
      jenis: 'JASA ANGKUT + MATERIAL',
      pelanggan: formData.pelanggan,
      totalTagihan: calculation.totalTagihan,
      nomorInvoice: `${formData.nomorPoCustomer} - INV - ${String(Date.now()).slice(-5)}`,
      periode: `Periode: [${formData.tanggal}]`,
    });
  };

  // Filtered Invoices for List View
  const filteredInvoices = invoiceList.filter((item) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      !q ||
      item.kodeTransaksi.toLowerCase().includes(q) ||
      item.perusahaan.toLowerCase().includes(q) ||
      item.material.toLowerCase().includes(q) ||
      (item.periode && item.periode.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'BELUM_BAYAR' && item.statusBayar === 'Belum Dibayar') ||
      (statusFilter === 'LUNAS' && item.statusBayar === 'Lunas');

    return matchSearch && matchStatus;
  });

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate total selected amount
  const totalSelected = invoiceList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  // Reset filter
  const handleReset = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setSelectedItems([]);
    addToast('Data filter berhasil di-reset', 'info');
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-32">
      {/* ── TOP HEADER WITH TAB SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24282C]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'create') {
                setActiveTab('list');
              } else {
                navigate('/');
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {activeTab === 'list' ? 'Data Invoice' : 'Buat Invoice'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar faktur tagihan customer & piutang aktif'
                : 'Formulir pembuatan faktur pajak & tagihan resmi'}
            </p>
          </div>
        </div>

        {/* Tab switcher matching Image 2 */}
        <div className="flex items-center gap-1.5 bg-[#131517] p-1 rounded-md border border-[#24282C] self-start sm:self-auto">
          <Button
            size="xs"
            variant={activeTab === 'list' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('list')}
          >
            Daftar Invoice ({invoiceList.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Input Invoice
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: DATA INVOICE (Strictly Matching Screenshot media_1794538112384_ea2f3289.jpg)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Action icon bar right under header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredInvoices.length} Faktur Tagihan
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSearchInput((prev) => !prev)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  showSearchInput
                    ? 'bg-[#F4511E]/20 text-[#F4511E]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
                title="Cari Invoice"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev === 'ALL'
                      ? 'BELUM_BAYAR'
                      : prev === 'BELUM_BAYAR'
                      ? 'LUNAS'
                      : 'ALL'
                  )
                }
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  statusFilter !== 'ALL'
                    ? 'bg-[#F4511E]/20 text-[#F4511E]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
                title={`Filter Status: ${statusFilter}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => addToast('Pilih rentang tanggal Invoice', 'info')}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Rentang Tanggal"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Search Input */}
          {showSearchInput && (
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Ketik nomor invoice, customer, material..."
                className="w-full bg-[#1C1F24] border border-[#2A2E33] focus:border-[#F4511E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Invoices List matching Screenshot media_1794538112384_ea2f3289.jpg */}
          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-xs">
                Tidak ada data Invoice yang ditemukan.
              </div>
            ) : (
              filteredInvoices.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                const isPaid = item.statusBayar === 'Lunas';

                return (
                  <div
                    key={item.id}
                    className={`bg-[#131517] border rounded-xl overflow-hidden transition-all ${
                      isSelected
                        ? 'border-[#F4511E]/60 ring-1 ring-[#F4511E]/40'
                        : 'border-[#24282C]'
                    }`}
                  >
                    {/* Main Card Body */}
                    <div className="p-3.5 flex items-start justify-between gap-3">
                      {/* Left: Volume & Material */}
                      <div className="w-28 shrink-0">
                        <div className="text-xl font-black font-mono text-white leading-none">
                          {item.volume.toFixed(2)}
                        </div>
                        <div className="text-sm font-black font-mono text-white leading-tight mt-0.5">
                          m³
                        </div>
                        <div className="text-xs font-bold text-white mt-2">
                          {item.material}
                        </div>
                        <div className="text-[9px] text-neutral-400 font-medium leading-snug mt-0.5 uppercase">
                          {item.jenis}
                        </div>
                      </div>

                      {/* Middle: Details, Amount, Status Badge */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Timestamp */}
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {item.timestamp}
                        </div>

                        {/* Amount */}
                        <div className="text-xs font-bold font-mono text-white">
                          IDR{' '}
                          {item.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>

                        {/* Invoice Code */}
                        <div className="text-[11px] text-neutral-300 font-mono">
                          {item.kodeTransaksi}
                        </div>

                        {/* Customer */}
                        <div className="text-[11px] text-neutral-200 font-medium truncate">
                          {item.perusahaan}
                        </div>

                        {/* Periode */}
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {item.periode}
                        </div>

                        {/* Status Badge */}
                        <div className="pt-0.5">
                          {isPaid ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              LUNAS
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide bg-[#F4511E]/20 text-[#F4511E] border border-[#F4511E]/30">
                              BELUM LUNAS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Checkbox */}
                      <div className="shrink-0 pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded accent-[#F4511E] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Bottom: 2 Buttons split 50/50 (Trash & Info) matching Screenshot */}
                    <div className="grid grid-cols-2 border-t border-[#24282C] bg-[#16191D]/50">
                      <button
                        type="button"
                        onClick={() => deleteInvoice(item.id)}
                        className="py-2.5 flex items-center justify-center border-r border-[#24282C] text-[#E53935] hover:bg-[#E53935]/10 transition-colors cursor-pointer"
                        title="Hapus Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInfoModalItem(item)}
                        className="py-2.5 flex items-center justify-center text-[#F4511E] hover:bg-[#F4511E]/10 transition-colors cursor-pointer"
                        title="Detail Informasi"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Action Button (FAB) at bottom right matching Screenshot */}
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#E04418] text-white flex items-center justify-center shadow-xl shadow-[#F4511E]/40 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Tambah Invoice Baru"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: INPUT INVOICE (Formulir Buat Invoice)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <form onSubmit={handleApply} className="space-y-3.5">
              {!filterHidden && (
                <>
                  {/* Row 1: Pilih Pelanggan & Kirim ke Rekening */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Pilih Pelanggan"
                      icon={User}
                      value={formData.pelanggan}
                      onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Kirim ke Rekening PT BAS"
                      icon={Building2}
                      value={formData.kirimKeRekening}
                      onChange={(e) => setFormData({ ...formData, kirimKeRekening: e.target.value })}
                    >
                      {bankAccounts.map((acc) => (
                        <option
                          key={acc.id}
                          value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}
                        >
                          {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Row 2: ID Received Order & Rekening Atas Nama */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="ID Received Order"
                      icon={Ticket}
                      value={formData.idReceivedOrder}
                      onChange={(e) => setFormData({ ...formData, idReceivedOrder: e.target.value })}
                      className="font-mono"
                    />

                    <Input
                      label="Rekening Atas Nama (auto)"
                      icon={User}
                      readOnly
                      value={formData.rekeningAtasNama}
                      className="text-neutral-400 bg-[#141618]"
                    />
                  </div>

                  {/* Row 3: ID Nomor PO Customer & Tanggal/Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="ID Nomor PO Customer (auto)"
                      icon={Ticket}
                      readOnly
                      value={formData.nomorPoCustomer}
                      className="font-mono font-bold text-neutral-300 bg-[#141618]"
                    />

                    <Input
                      label="Tanggal Invoice"
                      icon={Calendar}
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    />

                    <Input
                      label="Waktu"
                      icon={Clock}
                      type="time"
                      value={formData.waktu}
                      onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    />
                  </div>

                  {/* Row 4: Material & Volume */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Nama Material"
                      value={formData.materialName}
                      onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                    />

                    <Input
                      label="Volume Total (m³)"
                      type="number"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })}
                      className="font-mono"
                    />

                    <Input
                      label="Subtotal Tagihan (IDR)"
                      type="number"
                      value={formData.subtotalJasa}
                      onChange={(e) => setFormData({ ...formData, subtotalJasa: Number(e.target.value) })}
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              {/* Orange Action Button: TERAPKAN */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full uppercase font-bold tracking-wider"
              >
                TERAPKAN & SIMPAN INVOICE
              </Button>

              {/* Toggle Collapse: Sembunyikan Filter */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setFilterHidden(!filterHidden)}
                  className="text-[11px] text-neutral-400 hover:text-white inline-flex items-center gap-1 font-mono transition-colors cursor-pointer"
                >
                  {filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}
                  {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </Card>

          {/* Generated Enterprise Invoice Sheet */}
          {invoiceGenerated && (
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#24282C]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F4511E] block">
                    PT BERKAH ALAM SEMESTA • FAKTUR TAGIHAN
                  </span>
                  <h2 className="text-lg font-bold text-white font-mono mt-0.5">
                    INV-202611-00001
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Customer: <strong className="text-white">{formData.pelanggan}</strong> | PO:{' '}
                    {formData.nomorPoCustomer}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('list')}
                  >
                    Lihat Data Invoice &rarr;
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Printer}
                    onClick={() => window.print()}
                  >
                    Cetak Faktur Penjualan
                  </Button>
                </div>
              </div>

              {/* Tax Breakdown Table */}
              <div className="space-y-2 max-w-sm ml-auto font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">Total Jasa & Material:</span>
                  <span className="text-white font-medium">{formatCurrency(calculation.subtotal)}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">PPN 11% (Pasal 22):</span>
                  <span className="text-emerald-400 font-medium">+{formatCurrency(calculation.ppnNominal)}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#202326]">
                  <span className="text-neutral-400">
                    PPH {calculation.pphRate}% ({formData.materialType === 'Curah' ? 'Curah' : 'Padat'}):
                  </span>
                  <span className="text-[#F4511E] font-medium">-{formatCurrency(calculation.pphNominal)}</span>
                </div>

                <div className="pt-2 flex justify-between items-baseline border-t border-[#2A2E33]">
                  <span className="text-xs font-bold text-neutral-300">Total Bersih Tagihan:</span>
                  <span className="text-lg font-bold text-[#F4511E]">
                    {formatCurrency(calculation.totalTagihan)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── STICKY BATCH ACTIONS BAR (When items are checked) ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse shrink-0" />
              <div className="text-xs font-mono text-neutral-300 truncate">
                <strong className="text-white">{selectedItems.length}</strong> Invoice Terpilih &bull; Total:{' '}
                <strong className="text-[#F4511E] text-sm">
                  {formatCurrency(totalSelected)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#1C1F24] border border-[#2A2E33] transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  markInvoicePaid(selectedItems);
                  setSelectedItems([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Catat Lunas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL INFORMASI INVOICE ── */}
      <Modal
        isOpen={Boolean(infoModalItem)}
        onClose={() => setInfoModalItem(null)}
        title="Detail Faktur Invoice"
        subtitle={infoModalItem?.kodeTransaksi}
      >
        {infoModalItem && (
          <div className="p-4 space-y-3 font-mono text-xs text-neutral-300">
            <div className="grid grid-cols-2 gap-2 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Volume</span>
                <span className="text-white font-bold">{infoModalItem.volume} m³</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Material</span>
                <span className="text-white font-bold">{infoModalItem.material}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#262A2F]">
                <span className="text-neutral-500 block text-[10px] uppercase">Total Tagihan</span>
                <span className="text-[#F4511E] font-bold text-sm">
                  {formatCurrency(infoModalItem.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 bg-[#181B1E] p-3 rounded-lg border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Customer</span>
                <span className="text-white">{infoModalItem.perusahaan}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Layanan</span>
                <span className="text-neutral-200">{infoModalItem.jenis}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Invoice</span>
                <span className="text-neutral-200">{infoModalItem.timestamp}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Periode</span>
                <span className="text-neutral-200">{infoModalItem.periode}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Status Pembayaran</span>
                <span
                  className={
                    infoModalItem.statusBayar === 'Lunas'
                      ? 'text-emerald-400 font-bold'
                      : 'text-[#F4511E] font-bold'
                  }
                >
                  {infoModalItem.statusBayar === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInfoModalItem(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
