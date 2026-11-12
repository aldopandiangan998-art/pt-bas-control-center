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
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatVolume } from '../../utils/formatters';

export default function BkkPage() {
  const navigate = useNavigate();

  // State replicating Screenshot 2: "Buat Cash Out"
  const [filterData, setFilterData] = useState({
    pelanggan: 'PT LION WINGS',
    supplier: 'CV BERKAH SEJAHTERA (GRESIK)',
  });

  const [filterHidden, setFilterHidden] = useState(false);
  const [selectedItems, setSelectedItems] = useState(['bkk-1', 'bkk-2']);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Data rows directly matching Screenshot 2
  const [bkkList, setBkkList] = useState([
    {
      id: 'bkk-1',
      volume: 81.09,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-07 - RCP - RU4TN',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 459001...',
      timestamp: '2026-11-09 09:43:20',
      periode: 'Periode: 2026-11-07',
      amount: 9730800.0,
      statusBayar: 'Belum Dibayar', // Hutang
    },
    {
      id: 'bkk-2',
      volume: 80.34,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-05 - RCP - XAGXH',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 459002...',
      timestamp: '2026-11-09 09:43:20',
      periode: 'Periode: 2026-11-05',
      amount: 9640800.0,
      statusBayar: 'Belum Dibayar', // Hutang
    },
  ]);

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C]">
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
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-neutral-300 hover:text-white"
            title="Muat Ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Box reproducing Screenshot 2 */}
      <div className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {!filterHidden && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <span>Daftar Transaksi Rekapan:</span>
          <span>
            {selectedItems.length} transaksi dipilih ({formatCurrency(totalSelected)})
          </span>
        </div>

        {bkkList.map((item) => {
          const isSelected = selectedItems.includes(item.id);

          return (
            <div
              key={item.id}
              className={`bg-[#1C1C1C] border rounded-xl p-3.5 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                isSelected ? 'border-[#F4511E]/60 bg-[#211B18]' : 'border-[#2D2D2D] hover:border-[#3E3E3E]'
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
                  <span className="text-[10px] text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 inline-block mt-0.5">
                    {item.statusBayar}
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
          <div className="bg-[#1C1C1C] border border-[#333] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Catat Pembayaran BKK
            </h3>
            <p className="text-xs text-neutral-400">
              Mencatat kas keluar ke supplier PT BAS. Transaksi akan langsung terhitung lunas di laporan hutang.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tanggal Bayar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Rekening Sumber PT BAS <span className="text-rose-500">*</span>
                </label>
                <select className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3 py-2 text-sm">
                  <option>BCA - 0188920199 a/n PT Berkah Alam Semesta</option>
                  <option>Mandiri - 14200192881 a/n PT Berkah Alam Semesta</option>
                  <option>Kas Tunai Kantor Gresik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
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
                onClick={() => {
                  setShowPaymentModal(false);
                  alert('Pembayaran BKK berhasil dicatat!');
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
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
