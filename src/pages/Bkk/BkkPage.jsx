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
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input, Select, Modal } from '../../components/ui';

export default function BkkPage() {
  const navigate = useNavigate();
  const { bkkList, markBkkPaid, suppliers, customers, bankAccounts } = useData();

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
    <div className="space-y-4 max-w-5xl mx-auto pb-28">
      {/* Top Header Bar matching Screenshot 2 */}
      <div className="flex items-center justify-between pb-3 border-b border-[#24282C]">
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
              <span>Buat Cash Out (BKK)</span>
              <Badge size="xs" variant="primary">Disbursement</Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Bukti Kas Keluar ke supplier • Pembayaran rekapan ritase pengiriman non-PPN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => setSelectedItems(['bkk-1', 'bkk-2'])}
            title="Reset Pilihan"
          />
        </div>
      </div>

      {/* Filter Box strictly reproducing Screenshot 2 */}
      <Card className="p-4 space-y-3">
        {!filterHidden && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Pilih Pelanggan"
              icon={User}
              value={filterData.pelanggan}
              onChange={(e) => setFilterData({ ...filterData, pelanggan: e.target.value })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Pilih Supplier"
              icon={Building2}
              value={filterData.supplier}
              onChange={(e) => setFilterData({ ...filterData, supplier: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.bank} - {s.noRekening})
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-[#202326]">
          <Button
            size="xs"
            variant="ghost"
            icon={Plus}
            className="text-neutral-400 hover:text-white"
          >
            Tambah Keterangan
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto uppercase tracking-wide font-bold"
          >
            Terapkan Filter
          </Button>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setFilterHidden(!filterHidden)}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
          >
            {filterHidden ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Tampilkan Filter</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Sembunyikan Filter</span>
              </>
            )}
          </button>
        </div>
      </Card>

      {/* List Header & Quick Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedItems.length === filteredBkk.length && filteredBkk.length > 0}
              onChange={toggleSelectAll}
              className="accent-[#F4511E] w-4 h-4 rounded cursor-pointer"
            />
            <span>Pilih Semua ({filteredBkk.length})</span>
          </label>
        </div>

        <div className="w-full sm:w-64">
          <Input
            icon={Search}
            value={filterData.searchQuery}
            onChange={(e) => setFilterData({ ...filterData, searchQuery: e.target.value })}
            placeholder="Cari nomor bukti / PT..."
          />
        </div>
      </div>

      {/* Transaction Cards List strictly reproducing Screenshot 2 */}
      <div className="space-y-2.5">
        {filteredBkk.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          const isPaid = item.statusBayar === 'Lunas';

          return (
            <Card
              key={item.id}
              hover
              className={`p-3.5 transition-all select-none ${
                isSelected ? 'border-[#F4511E]/70 bg-[#171413]' : 'bg-[#131517]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left check & volume column */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    disabled={isPaid}
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="accent-[#F4511E] w-4 h-4 rounded mt-1 cursor-pointer disabled:opacity-40"
                  />

                  <div>
                    <div className="text-base font-bold font-mono text-white leading-tight">
                      {item.volume} m³
                    </div>
                    <Badge size="xs" variant="primary" className="mt-1">
                      {item.material}
                    </Badge>
                    <div className="text-[10px] text-neutral-500 font-mono mt-1">
                      {item.timestamp}
                    </div>
                  </div>
                </div>

                {/* Center details */}
                <div className="flex-1 min-w-0 px-2 space-y-0.5">
                  <div className="text-xs font-mono font-semibold text-neutral-200">
                    {item.kodeTransaksi}
                  </div>
                  <div className="text-xs text-neutral-400 font-medium">
                    {item.jenis}
                  </div>
                  <div className="text-xs text-white font-bold truncate">
                    {item.perusahaan}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate font-mono">
                    {item.subDetail}
                  </div>
                </div>

                {/* Right nominal & status column */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-[11px] text-neutral-500 font-mono">
                    {item.periode}
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {formatCurrency(item.amount)}
                  </div>

                  <div>
                    {isPaid ? (
                      <Badge size="xs" variant="success" dot>
                        LUNAS
                      </Badge>
                    ) : (
                      <Badge size="xs" variant="warning" dot>
                        BELUM BAYAR
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sticky Batch Payment Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315] border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse" />
              <span className="text-xs font-mono text-neutral-300">
                <strong className="text-white">{selectedItems.length}</strong> BKK Terpilih &bull; Total Kas Keluar:{' '}
                <strong className="text-[#F4511E] text-sm">{formatCurrency(totalSelected)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Batal
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={CheckCircle2}
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto"
              >
                Bayar & Lunasi BKK
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal with Motion */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Konfirmasi Pelunasan Kas Keluar (BKK)"
        subtitle="Pencatatan tanggal dan rekening kas PT BAS yang didebit"
      >
        <div className="p-4 space-y-3 font-mono">
          <Input
            label="Tanggal Kas Keluar"
            type="date"
            required
            value={paymentForm.tanggalBayar}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })
            }
          />

          <Select
            label="Rekening Sumber PT BAS"
            required
            value={paymentForm.rekeningSumber}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })
            }
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
          </Select>

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
