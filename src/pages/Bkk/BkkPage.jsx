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
  Building2,
  Banknote,
  Search,
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
  });

  const filteredBkk = bkkList.filter((item) => {
    const q = filterData.searchQuery.toLowerCase();
    return (
      item.kodeTransaksi.toLowerCase().includes(q) ||
      item.perusahaan.toLowerCase().includes(q) ||
      item.material.toLowerCase().includes(q)
    );
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
    <div className="space-y-4 max-w-5xl mx-auto pb-24">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 transition-colors"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Buat Cash Out (BKK)
            </h2>
            <p className="text-[11px] text-neutral-400">
              Bukti Kas Keluar ke supplier • Pembayaran rekapan pengiriman non-PPN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedItems(['bkk-1', 'bkk-2'])}
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Box strictly reproducing Screenshot 2 */}
      <div className="bg-[#141414] border border-[#242424] rounded-lg p-3.5 sm:p-4 space-y-3">
        {!filterHidden && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                Pilih Pelanggan
              </label>
              <select
                value={filterData.pelanggan}
                onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                <option value="PT LION WINGS">PT LION WINGS</option>
                <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                Pilih Supplier
              </label>
              <select
                value={filterData.supplier}
                onChange={(e) => setFilterData({ ...filterData, supplier: e.target.value })}
                className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
              >
                <option value="CV BERKAH SEJAHTERA (GRESIK)">CV BERKAH SEJAHTERA (GRESIK)</option>
                <option value="UD PASIR JAYA GRESIK">UD PASIR JAYA GRESIK</option>
              </select>
            </div>
          </div>
        )}

        {/* Button: + TAMBAH KETERANGAN (Screenshot 2) */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            className="px-4 py-1.5 rounded border border-[#F4511E] text-[#F4511E] hover:bg-[#F4511E]/10 font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            TAMBAH KETERANGAN
          </button>
        </div>

        {/* Orange Action Button: TERAPKAN (Screenshot 2) */}
        <button
          type="button"
          className="w-full py-2.5 rounded bg-[#F4511E] hover:bg-[#D84315] text-white font-bold text-xs tracking-wider uppercase shadow transition-colors"
        >
          TERAPKAN
        </button>

        {/* Toggle Collapse: Sembunyikan Filter ^ (Screenshot 2) */}
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setFilterHidden(!filterHidden)}
            className="text-[11px] text-neutral-400 hover:text-white inline-flex items-center gap-1"
          >
            {filterHidden ? 'Tampilkan Filter' : 'Sembunyikan Filter'}
            {filterHidden ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Transaction List Rows strictly matching Screenshot 2 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input
              type="checkbox"
              checked={selectedItems.length === filteredBkk.length && filteredBkk.length > 0}
              onChange={toggleSelectAll}
              className="w-3.5 h-3.5 rounded text-[#F4511E] focus:ring-0"
            />
            <span>Pilih Semua ({filteredBkk.length})</span>
          </label>

          <span>
            {selectedItems.length} dipilih: <strong className="text-white">{formatCurrency(totalSelected)}</strong>
          </span>
        </div>

        {filteredBkk.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isPaid = item.statusBayar === 'Lunas';

          return (
            <div
              key={item.id}
              className={`bg-[#141414] border rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                isSelected ? 'border-[#F4511E]/70 bg-[#181310]' : 'border-[#242424] hover:border-[#333333]'
              }`}
            >
              {/* Left Column: Checkbox, Volume, and Details */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 mt-1 rounded bg-[#222] border-[#444] text-[#F4511E] focus:ring-0 cursor-pointer shrink-0"
                />

                <div className="space-y-0.5">
                  {/* Volume box & Material */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                      {formatVolume(item.volume)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-mono">
                      {item.material}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">{item.timestamp}</span>
                  </div>

                  {/* Transaction metadata */}
                  <div className="text-xs font-semibold text-neutral-200">
                    {item.kodeTransaksi} • {item.jenis}
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    <span className="text-white font-medium">{item.perusahaan}</span> • {item.subDetail}
                  </div>

                  <div className="text-[10px] text-neutral-500 font-mono">{item.periode}</div>
                </div>
              </div>

              {/* Right Column: Amount & Action Buttons (Trash & Info) per Screenshot 2 */}
              <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-[#1F1F1F]">
                <div className="text-right font-mono">
                  <div className="text-sm sm:text-base font-bold text-white">
                    {formatCurrency(item.amount)}
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      isPaid
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950/50 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {isPaid ? 'Lunas' : 'Belum Dibayar'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1.5 rounded bg-[#1C1C1C] hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors border border-[#2C2C2C]"
                    title="Hapus BKK"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded bg-[#1C1C1C] hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-[#2C2C2C]"
                    title="Rincian"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Payment Bar (Poin 22) */}
      {selectedItems.length > 0 && (
        <div className="sticky bottom-4 z-20 bg-[#161616] border border-[#333333] p-3 rounded shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-mono text-xs">
            <span className="text-neutral-400 mr-2">Total Terpilih:</span>
            <strong className="text-base font-bold text-white">{formatCurrency(totalSelected)}</strong>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors"
          >
            <Banknote className="w-3.5 h-3.5" />
            Catat Pembayaran BKK (Lunas)
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2C2C2C] rounded-lg max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
              Konfirmasi Pelunasan BKK
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">Tanggal Kas Keluar:</label>
                <input
                  type="date"
                  value={paymentForm.tanggalBayar}
                  onChange={(e) => setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-white rounded p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Rekening Sumber PT BAS:</label>
                <select
                  value={paymentForm.rekeningSumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-white rounded p-1.5 text-xs"
                >
                  <option value="BCA - 0188920199 a/n PT Berkah Alam Semesta">BCA - 0188920199 a/n PT Berkah Alam Semesta</option>
                  <option value="Mandiri - 14200192881 a/n PT Berkah Alam Semesta">Mandiri - 14200192881 a/n PT Berkah Alam Semesta</option>
                  <option value="Kas Tunai Kantor Gresik">Kas Tunai Kantor Gresik</option>
                </select>
              </div>

              <div className="pt-1">
                <span className="text-neutral-400 block">Nominal:</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalSelected)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Simpan Pelunasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
