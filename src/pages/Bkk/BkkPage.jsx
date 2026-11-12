import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Plus,
  Trash2,
  Info,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Banknote,
  Building2,
  Calendar,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function BkkPage() {
  const navigate = useNavigate();
  const { bkkList, markBkkPaid } = useData();

  // Filter state replicating Screenshot 2: "Buat Cash Out"
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    supplier: 'CV BERKAH SEJAHTERA (GRESIK)',
    searchQuery: '',
  });

  const [filterHidden, setFilterHidden] = useState(false);
  const [selectedItems, setSelectedItems] = useState(['bkk-1', 'bkk-2']);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    keterangan: 'Pembayaran jasa angkut & material sirtu curah',
  });

  // Filtered rows
  const filteredBkk = bkkList.filter((item) => {
    const matchQuery =
      item.kodeTransaksi.toLowerCase().includes(filterData.searchQuery.toLowerCase()) ||
      item.perusahaan.toLowerCase().includes(filterData.searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(filterData.searchQuery.toLowerCase());
    return matchQuery;
  });

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredBkk.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredBkk.map((i) => i.id));
    }
  };

  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleConfirmPayment = () => {
    markBkkPaid(selectedItems, paymentForm);
    setSelectedItems([]);
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2C2C2C]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-white transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Buat Cash Out (BKK)
            </h2>
            <p className="text-xs text-neutral-400">
              Bukti Kas Keluar ke supplier • Menggabungkan rekapan dari PO yang sama
            </p>
          </div>
        </div>

        {/* Action icons from top right of Screenshot 2 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterData({ pelanggan: 'PT LION WINGS', supplier: '', searchQuery: '' });
              setSelectedItems(['bkk-1', 'bkk-2']);
            }}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-neutral-300 hover:text-white"
            title="Muat Ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PPN Supplier Notice Banner (Implementation Plan Section 2, Aturan 23) */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Aturan BKK PT BAS:</strong> Transaksi di bawah ini adalah rekapan <strong>Non-PPN</strong>. BKK untuk supplier PPN sementara dikelola via rekonsiliasi tagihan (Fase 8).
          </span>
        </div>
      </div>

      {/* Filter Box reproducing Screenshot 2 */}
      <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {!filterHidden && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-400" />
                Pilih Pelanggan
              </label>
              <select
                value={filterData.pelanggan}
                onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              >
                <option value="PT LION WINGS">PT LION WINGS</option>
                <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
                <option value="PT PETROKIMIA GRESIK">PT PETROKIMIA GRESIK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-neutral-400" />
                Pilih Supplier
              </label>
              <select
                value={filterData.supplier}
                onChange={(e) => setFilterData({ ...filterData, supplier: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              >
                <option value="CV BERKAH SEJAHTERA (GRESIK)">CV BERKAH SEJAHTERA (GRESIK)</option>
                <option value="UD PASIR JAYA GRESIK">UD PASIR JAYA GRESIK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-neutral-400" />
                Cari Transaksi / Nota
              </label>
              <input
                type="text"
                placeholder="Cari kode RCP, material..."
                value={filterData.searchQuery}
                onChange={(e) => setFilterData({ ...filterData, searchQuery: e.target.value })}
                className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
              />
            </div>
          </div>
        )}

        {/* Button: + TAMBAH KETERANGAN */}
        <div className="flex justify-center">
          <button
            type="button"
            className="px-5 py-2 rounded-xl border border-[#F4511E] text-[#F4511E] hover:bg-[#F4511E]/10 font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            TAMBAH KETERANGAN
          </button>
        </div>

        {/* Orange Action Button: TERAPKAN */}
        <button
          type="button"
          className="w-full py-3 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-orange-950/40 transition-colors"
        >
          TERAPKAN
        </button>

        {/* Toggle Collapse: Sembunyikan Filter ^ */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setFilterHidden(!filterHidden)}
            className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            {filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}
            {filterHidden ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Transaction List Cards matching Screenshot 2 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredBkk.length && filteredBkk.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-[#F4511E] focus:ring-0"
              />
              <span>Pilih Semua ({filteredBkk.length})</span>
            </label>
          </div>

          <span>
            {selectedItems.length} transaksi dipilih ({formatCurrency(totalSelected)})
          </span>
        </div>

        {filteredBkk.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isPaid = item.statusBayar === 'Lunas';

          return (
            <div
              key={item.id}
              className={`bg-[#1C1C1C] border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                isSelected ? 'border-[#F4511E]/70 bg-[#221A16]' : 'border-[#2D2D2D] hover:border-[#3E3E3E]'
              }`}
            >
              {/* Left Column: Checkbox, Volume, and Transaction Details */}
              <div className="flex items-start gap-3 sm:gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 mt-1 rounded bg-[#2D2D2D] border-[#444] text-[#F4511E] focus:ring-0 cursor-pointer"
                />

                <div className="space-y-1">
                  {/* Volume & Material badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold font-mono text-white">
                      {formatVolume(item.volume)}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {item.material}
                    </span>
                    <span className="text-[10px] text-neutral-400">{item.timestamp}</span>
                  </div>

                  {/* Transaksi Code & Delivery info */}
                  <div className="text-xs font-semibold text-neutral-200">
                    {item.kodeTransaksi} • {item.jenis}
                  </div>

                  {/* Company & sub-detail */}
                  <div className="text-[11px] text-neutral-400">
                    <span className="text-white font-medium">{item.perusahaan}</span> • {item.subDetail}
                  </div>

                  {/* Periode */}
                  <div className="text-[11px] text-neutral-500">{item.periode}</div>
                </div>
              </div>

              {/* Right Column: Amount & Action Icons (Trash & Info) */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2.5 md:pt-0 border-[#2D2D2D]">
                <div className="text-right">
                  <div className="text-sm sm:text-base font-bold font-mono text-white">
                    {formatCurrency(item.amount)}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                      isPaid
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isPaid ? `Lunas (${item.tanggalBayar})` : 'Belum Dibayar (Hutang)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-[#262626] hover:bg-rose-900/40 text-neutral-400 hover:text-rose-400 transition-colors border border-[#353535]"
                    title="Hapus BKK"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-[#262626] hover:bg-cyan-900/40 text-neutral-400 hover:text-cyan-400 transition-colors border border-[#353535]"
                    title="Detail Transaksi"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Floating Bottom Bar: Catat Pembayaran BKK (Poin 22) */}
      {selectedItems.length > 0 && (
        <div className="sticky bottom-6 z-20 bg-[#1F1F1F] border border-[#3A3A3A] p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-400 block">Total BKK Terpilih:</span>
            <span className="text-xl font-bold font-mono text-white">
              {formatCurrency(totalSelected)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-colors"
          >
            <Banknote className="w-4 h-4" />
            Catat Pembayaran BKK (Lunas)
          </button>
        </div>
      )}

      {/* Payment Modal per Section 2 Aturan 22: Tanggal Bayar & Rekening Sumber */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-[#333] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-emerald-400">
              <Banknote className="w-5 h-5" />
              Catat Pembayaran BKK ke Supplier
            </h3>
            <p className="text-xs text-neutral-400">
              Mencatat kas keluar ke supplier PT BAS. Transaksi akan langsung terhitung lunas di laporan hutang.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">
                  Tanggal Bayar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.tanggalBayar}
                  onChange={(e) => setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">
                  Rekening Sumber PT BAS <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentForm.rekeningSumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="BCA - 0188920199 a/n PT Berkah Alam Semesta">BCA - 0188920199 a/n PT Berkah Alam Semesta</option>
                  <option value="Mandiri - 14200192881 a/n PT Berkah Alam Semesta">Mandiri - 14200192881 a/n PT Berkah Alam Semesta</option>
                  <option value="Kas Tunai Kantor Gresik">Kas Tunai Kantor Gresik</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">
                  Total Nominal Dibayar
                </label>
                <input
                  type="text"
                  value={formatCurrency(totalSelected)}
                  readOnly
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-emerald-400 font-mono font-bold rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2C2C]">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
