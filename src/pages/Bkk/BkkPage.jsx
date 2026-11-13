import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Trash2,
  Info,
  RotateCw,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  PlusCircle,
  Plus,
  FileText,
  Monitor,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Button } from '../../components/ui';

export default function BkkPage() {
  const navigate = useNavigate();
  const { bkkList, markBkkPaid, suppliers, customers, bankAccounts } = useData();
  const { addToast } = useToast();

  // Tab State: 'list' (Data Cash Out) | 'create' (Input Cash Out)
  const [activeTab, setActiveTab] = useState('list');

  // Search & Filter state for List view
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BELUM_BAYAR' | 'LUNAS'

  // Input Cash Out Filter Form state
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    supplier: '',
  });

  // Dynamic Daftar Keterangan state for Input Cash Out
  const [keteranganList, setKeteranganList] = useState([
    { id: 1, tipe: '', deskripsi: '' },
  ]);

  const [filterHidden, setFilterHidden] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [infoModalItem, setInfoModalItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
  });

  // Handler for adding a new Keterangan row
  const handleAddKeterangan = () => {
    setKeteranganList((prev) => [
      ...prev,
      { id: Date.now(), tipe: '', deskripsi: '' },
    ]);
  };

  // Handler for updating a Keterangan row
  const handleUpdateKeterangan = (id, field, value) => {
    setKeteranganList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    );
  };

  // Handler for deleting a Keterangan row
  const handleRemoveKeterangan = (id) => {
    setKeteranganList((prev) => prev.filter((k) => k.id !== id));
  };

  // Reset filter and selections
  const handleReset = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setFilterData({
      pelanggan: '',
      supplier: '',
    });
    setKeteranganList([{ id: 1, tipe: '', deskripsi: '' }]);
    setSelectedItems([]);
    addToast('Data filter berhasil di-reset', 'info');
  };

  // Filtered BKK for List View
  const filteredBkk = bkkList.filter((item) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      !q ||
      item.kodeTransaksi.toLowerCase().includes(q) ||
      item.perusahaan.toLowerCase().includes(q) ||
      item.material.toLowerCase().includes(q) ||
      (item.subDetail && item.subDetail.toLowerCase().includes(q));

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
  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleConfirmPayment = () => {
    markBkkPaid(selectedItems, paymentForm);
    setSelectedItems([]);
    setShowPaymentModal(false);
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
              {activeTab === 'list' ? 'Data Cash Out' : 'Buat Cash Out'}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {activeTab === 'list'
                ? 'Daftar pengeluaran kas operasional & kewajiban supplier'
                : 'Formulir pengajuan kas keluar & penyesuaian biaya'}
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
            Daftar CO ({bkkList.length})
          </Button>
          <Button
            size="xs"
            variant={activeTab === 'create' ? 'primary' : 'ghost'}
            icon={Plus}
            onClick={() => setActiveTab('create')}
          >
            Input Cash Out
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: DATA CASH OUT (Strictly Matching Image 1)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Action icon bar right under header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-400 font-mono">
              Total {filteredBkk.length} Transaksi CO
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
                title="Cari Data"
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
                onClick={() => addToast('Pilih rentang tanggal CO', 'info')}
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
                placeholder="Ketik nomor CO, nama customer, material..."
                className="w-full bg-[#1C1F24] border border-[#2A2E33] focus:border-[#F4511E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Cards List matching Image 1 */}
          <div className="space-y-3">
            {filteredBkk.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-xs">
                Tidak ada data Cash Out yang ditemukan.
              </div>
            ) : (
              filteredBkk.map((item) => {
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
                    {/* Main Card Body matching Image 1 */}
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

                      {/* Middle: Status Badge, Details, Amount */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Status Badge */}
                        <div className="mb-1">
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

                        {/* Code */}
                        <div className="text-[11px] text-neutral-300 font-mono">
                          {item.kodeTransaksi}
                        </div>

                        {/* Company */}
                        <div className="text-[11px] text-neutral-200 font-medium truncate">
                          {item.perusahaan}
                        </div>

                        {/* PIC / Subdetail */}
                        <div className="text-[11px] text-neutral-400 font-mono truncate">
                          {item.subDetail}
                        </div>

                        {/* Periode */}
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {item.periode}
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

                    {/* Bottom: Single Full-width Info Button (Matching Image 1) */}
                    <div className="border-t border-[#24282C] bg-[#16191D]/50">
                      <button
                        type="button"
                        onClick={() => setInfoModalItem(item)}
                        className="w-full py-2 flex items-center justify-center text-[#F4511E] hover:bg-[#F4511E]/10 transition-colors cursor-pointer"
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

          {/* Floating Action Button (FAB) at bottom right matching Image 1 */}
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#F4511E] hover:bg-[#E04418] text-white flex items-center justify-center shadow-xl shadow-[#F4511E]/40 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Tambah Cash Out"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: INPUT CASH OUT (Form Filter & Daftar Keterangan)
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Formulir Cash Out Baru
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterHidden((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Toggle Form Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reset Form"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Form Card */}
          {!filterHidden && (
            <div className="space-y-3">
              {/* Field: Pilih Pelanggan */}
              <div className="relative bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#F4511E]/70 transition-colors group cursor-pointer">
                <User className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors pointer-events-none" />
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className={`text-xs truncate ${filterData.pelanggan ? 'text-neutral-200' : 'text-neutral-400'}`}>
                    {filterData.pelanggan || 'Pilih Pelanggan'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 pointer-events-none" />
                <select
                  value={filterData.pelanggan}
                  onChange={(e) =>
                    setFilterData({ ...filterData, pelanggan: e.target.value })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="" className="bg-[#1C1F24] text-neutral-400">
                    Pilih Pelanggan
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#1C1F24]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: Pilih Supplier (with orange accent) */}
              <div className="relative bg-[#1C1F24] border-t border-l border-r border-[#2A2E33] border-b-2 border-b-[#F4511E] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group cursor-pointer">
                <User className="w-5 h-5 text-neutral-500 shrink-0 group-focus-within:text-[#F4511E] transition-colors pointer-events-none" />
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className="text-xs text-[#F4511E] font-medium truncate">
                    {filterData.supplier || 'Pilih Supplier'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#F4511E] shrink-0 pointer-events-none" />
                <select
                  value={filterData.supplier}
                  onChange={(e) =>
                    setFilterData({ ...filterData, supplier: e.target.value })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  <option value="" className="bg-[#1C1F24] text-[#F4511E]">
                    Pilih Supplier
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} className="bg-[#1C1F24] text-white">
                      {s.name} ({s.bank} - {s.noRekening})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section: Daftar Keterangan */}
              <div className="space-y-2 pt-1">
                <div className="text-xs text-neutral-400 font-medium">
                  Daftar Keterangan
                </div>

                {/* Dynamic Keterangan Rows */}
                {keteranganList.map((ket) => (
                  <div key={ket.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveKeterangan(ket.id)}
                      className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#1C1F24] border border-[#2A2E33] hover:border-rose-500/50 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus Keterangan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Dropdown Tipe Keterangan */}
                    <div className="relative flex-1">
                      <select
                        value={ket.tipe}
                        onChange={(e) =>
                          handleUpdateKeterangan(ket.id, 'tipe', e.target.value)
                        }
                        className="w-full bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-3 py-3 text-xs text-neutral-200 focus:outline-none focus:border-[#F4511E] appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1C1F24] text-neutral-400">
                          Tipe Keterang...
                        </option>
                        <option value="Kasbon" className="bg-[#1C1F24]">
                          Kasbon
                        </option>
                        <option value="Potongan" className="bg-[#1C1F24]">
                          Potongan
                        </option>
                        <option value="Penyesuaian" className="bg-[#1C1F24]">
                          Penyesuaian
                        </option>
                        <option value="Solar" className="bg-[#1C1F24]">
                          Solar
                        </option>
                        <option value="Biaya Tambahan" className="bg-[#1C1F24]">
                          Biaya Tambahan
                        </option>
                        <option value="Retribusi" className="bg-[#1C1F24]">
                          Retribusi
                        </option>
                        <option value="Lainnya" className="bg-[#1C1F24]">
                          Lainnya
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Input Item/Deskripsi */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={ket.deskripsi}
                        onChange={(e) =>
                          handleUpdateKeterangan(ket.id, 'deskripsi', e.target.value)
                        }
                        placeholder="Item/Deskripsi"
                        className="w-full bg-[#1C1F24] border border-[#2A2E33] rounded-xl px-3 py-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] transition-colors"
                      />
                    </div>
                  </div>
                ))}

                {/* Button: + TAMBAH KETERANGAN */}
                <button
                  type="button"
                  onClick={handleAddKeterangan}
                  className="w-full py-2.5 rounded-xl border border-[#F4511E]/40 hover:border-[#F4511E] bg-[#1C1F24]/50 text-[#F4511E] hover:bg-[#F4511E]/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>TAMBAH KETERANGAN</span>
                </button>
              </div>

              {/* Button: TERAPKAN */}
              <button
                type="button"
                onClick={() => {
                  addToast('Keterangan & filter kas keluar berhasil disimpan!', 'success');
                  setActiveTab('list');
                }}
                className="w-full py-3 rounded-xl bg-[#F4511E] hover:bg-[#E04418] active:bg-[#C93C15] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#F4511E]/20 cursor-pointer"
              >
                TERAPKAN & LIHAT DATA
              </button>
            </div>
          )}

          {/* Button: Sembunyikan Filter / Tampilkan Filter */}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setFilterHidden((prev) => !prev)}
              className="px-4 py-1.5 rounded-lg bg-[#141619] border border-[#2A2E33] hover:border-neutral-600 text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <span>{filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}</span>
              {filterHidden ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STICKY BATCH PAYMENT BAR (When items are checked) ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse shrink-0" />
              <div className="text-xs font-mono text-neutral-300 truncate">
                <strong className="text-white">{selectedItems.length}</strong> CO Terpilih &bull; Total:{' '}
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
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F4511E] hover:bg-[#E04418] transition-colors shadow-md shadow-[#F4511E]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bayar CO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL INFORMASI ── */}
      <Modal
        isOpen={Boolean(infoModalItem)}
        onClose={() => setInfoModalItem(null)}
        title="Detail Cash Out"
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
                <span className="text-neutral-500 block text-[10px] uppercase">Nominal Kas Keluar</span>
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
                <span className="text-neutral-500 block text-[10px] uppercase">PIC / Driver / Subdetail</span>
                <span className="text-neutral-200">{infoModalItem.subDetail}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Transaksi</span>
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
                  {infoModalItem.statusBayar}
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

      {/* ── MODAL KONFIRMASI PEMBAYARAN ── */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Konfirmasi Pelunasan Cash Out (BKK)"
        subtitle="Pencatatan tanggal dan rekening kas PT BAS yang didebit"
      >
        <div className="p-4 space-y-3 font-mono">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tanggal Kas Keluar</label>
            <input
              type="date"
              required
              value={paymentForm.tanggalBayar}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })
              }
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Rekening Sumber PT BAS</label>
            <select
              required
              value={paymentForm.rekeningSumber}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })
              }
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            >
              {bankAccounts.map((acc) => (
                <option
                  key={acc.id}
                  value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}
                >
                  {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                </option>
              ))}
              <option value="Kas Tunai Kantor Gresik">Kas Tunai Kantor Gresik</option>
            </select>
          </div>

          <div className="p-2.5 rounded bg-[#181B1E] border border-[#262A2F] flex justify-between items-center text-xs">
            <span className="text-neutral-400">Total Pembayaran Vendor:</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(totalSelected)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282C]">
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              icon={CheckCircle2}
              onClick={handleConfirmPayment}
            >
              Simpan Pelunasan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
