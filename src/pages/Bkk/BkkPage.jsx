import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Info,
  RotateCw,
  CheckCircle2,
  Search,
  X,
  FileText,
  BookOpen,
  Receipt,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  RefreshCw,
  Banknote,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Button } from '../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// CashOutCard
// ─────────────────────────────────────────────────────────────────────────────
function CashOutCard({ item, isSelected, onSelect, onDelete, onInfo, canDelete = true }) {
  const volumeNum = Number(item.volume ?? item.kubikasi) || 0;
  const formattedVolume = volumeNum.toFixed(2);
  const rawSatuan = item.satuan || 'm3';
  const satuan = rawSatuan === 'm3' ? 'm³' : rawSatuan;
  const material = (item.material || 'SIRTU')
    .replace(/\s*\(Curah\)/i, '')
    .replace(/\s*\(Padat\)/i, '');

  const timestamp = item.timestamp || (item.tanggal ? `${item.tanggal} 09:15:42` : '-');
  const amountFormatted = `IDR ${(Number(item.amount) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const docCode = item.kodeTransaksi || item.nomorRO || '-';
  const customerName = item.customer || item.perusahaan || '-';
  const poCode = item.poNumber || item.subDetail || '-';
  const periodeText = item.periode
    ? (item.periode.startsWith('Periode:') ? item.periode : `Periode: ${item.periode}`)
    : (item.tanggal ? `Periode: ${item.tanggal}` : 'Periode: -');

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all select-none ${
        isSelected
          ? 'bg-[#181615] border-[#F4511E]/70 ring-1 ring-[#F4511E]/40'
          : 'bg-[#121417] border-[#22262B] hover:border-[#323842]'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Left Column */}
        <div className="w-28 sm:w-36 shrink-0 flex flex-col justify-start">
          <div className="text-2xl sm:text-[26px] font-black font-mono text-white tracking-tight leading-none">
            {formattedVolume}
          </div>
          <div className="text-sm font-semibold font-mono text-neutral-200 mt-1 leading-tight">
            {satuan}
          </div>
          <div
            className="text-xs font-bold font-mono text-white uppercase tracking-wider mt-2.5 leading-tight truncate"
            title={material}
          >
            {material}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono uppercase leading-tight mt-1 space-y-0.5">
            <div>CURAH | JASA</div>
            <div>ANGKUT +</div>
            <div>MATERIAL</div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center shrink-0 shadow-xs"
                title="Bukti Kas Keluar"
              >
                <FileText className="w-2.5 h-2.5" />
              </div>
              <div
                className="w-5 h-5 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shrink-0 shadow-xs"
                title="Dokumen Terhubung (RO / SJ)"
              >
                <BookOpen className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-mono text-neutral-300 ml-1 truncate">
                {timestamp}
              </span>
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-[#3A404A] bg-[#16191D] accent-[#F4511E] cursor-pointer shrink-0"
            />
          </div>

          <div className="text-sm sm:text-base font-bold font-mono text-white mt-1.5 leading-tight">
            {amountFormatted}
          </div>
          <div className="text-xs font-mono text-neutral-300 mt-1 leading-tight truncate" title={docCode}>
            {docCode}
          </div>
          <div className="text-xs font-bold font-mono text-neutral-100 uppercase mt-0.5 leading-tight truncate" title={customerName}>
            {customerName}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate" title={poCode}>
            {poCode}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate">
            {periodeText}
          </div>
        </div>
      </div>

      <div className="border-t border-[#22262B] mt-3 pt-2.5">
        <div className={`grid ${canDelete ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="py-2 px-3 rounded-xl bg-[#16191D] hover:bg-rose-500/10 border border-[#262A2F] hover:border-rose-500/40 text-[#F4511E] flex items-center justify-center transition-colors cursor-pointer group"
              title="Hapus Cash Out"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-[#F4511E]" />
            </button>
          )}
          <button
            type="button"
            onClick={onInfo}
            className="py-2 px-3 rounded-xl bg-[#16191D] hover:bg-[#F4511E]/10 border border-[#262A2F] hover:border-[#F4511E]/40 text-[#F4511E] flex items-center justify-center transition-colors cursor-pointer group"
            title="Detail Informasi"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform text-[#F4511E]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateBkkForm — Inline create form
// ─────────────────────────────────────────────────────────────────────────────
const KETERANGAN_TYPES = [
  'general',
  'Material',
  'Jasa Angkut',
  'Operasional',
  'Administrasi',
  'Lainnya',
];

const MATERIAL_OPTIONS = [
  'SIRTU (Curah)',
  'BATU SPLIT (Curah)',
  'PASIR (Curah)',
  'TANAH URUG (Curah)',
  'BATU KALI (Curah)',
  'JASA ANGKUT',
  'Lainnya',
];

function CreateBkkForm({ suppliers, customers, bankAccounts, onSubmit, onCancel, isSubmitting }) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    tanggal: today,
    supplierId: '',
    customerId: '',
    nomorPO: '',
    nomorRO: '',
    material: 'SIRTU (Curah)',
    volume: '',
    satuan: 'm³',
    amount: '',
    keterangan: [{ type: 'general', deskripsi: '' }],
    statusBayar: 'Belum Dibayar',
    rekeningTujuan: '',
  });

  const [errors, setErrors] = useState({});

  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId) || null;

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const addKeterangan = () =>
    setForm((prev) => ({
      ...prev,
      keterangan: [...prev.keterangan, { type: 'general', deskripsi: '' }],
    }));

  const removeKeterangan = (idx) =>
    setForm((prev) => ({
      ...prev,
      keterangan: prev.keterangan.filter((_, i) => i !== idx),
    }));

  const updateKeterangan = (idx, key, val) =>
    setForm((prev) => {
      const updated = [...prev.keterangan];
      updated[idx] = { ...updated[idx], [key]: val };
      return { ...prev, keterangan: updated };
    });

  const validate = () => {
    const e = {};
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi';
    if (!form.supplierId) e.supplierId = 'Pilih supplier';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Nominal harus lebih dari 0';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const sup = selectedSupplier;
    const cust = customers.find((c) => c.id === form.customerId) || null;
    const keteranganText = form.keterangan
      .filter((k) => k.deskripsi)
      .map((k) => `[${k.type}] ${k.deskripsi}`)
      .join(' | ');

    onSubmit({
      tanggal: form.tanggal,
      timestamp: `${form.tanggal} ${new Date().toTimeString().slice(0, 8)}`,
      supplierId: form.supplierId,
      penerima: sup?.penerima || sup?.name || '',
      perusahaan: sup?.name || '',
      rekeningTujuan: form.rekeningTujuan ||
        (sup ? `${sup.bank} - ${sup.noRekening} a/n ${sup.rekeningAtasNama}` : ''),
      rekeningAtasNama: sup?.rekeningAtasNama || '',
      customerId: form.customerId,
      customer: cust?.name || '',
      poNumber: form.nomorPO,
      nomorRO: form.nomorRO,
      material: form.material,
      volume: Number(form.volume) || 0,
      kubikasi: Number(form.volume) || 0,
      satuan: form.satuan,
      amount: Number(String(form.amount).replace(/\D/g, '')) || 0,
      subDetail: keteranganText || form.nomorPO || '-',
      keteranganList: form.keterangan,
      statusBayar: form.statusBayar,
      periode: form.tanggal.slice(0, 7),
    });
  };

  const inputCls = (err) =>
    `w-full bg-[#111315] border ${err ? 'border-rose-500' : 'border-[#2B3037]'} text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F4511E] placeholder-neutral-600 transition-colors`;

  const labelCls = 'block text-[11px] text-neutral-400 font-medium mb-1 uppercase tracking-wide';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#111315] border border-[#F4511E]/30 rounded-2xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-[#1E2228]">
        <div className="w-7 h-7 rounded-lg bg-[#F4511E]/20 border border-[#F4511E]/30 flex items-center justify-center shrink-0">
          <Banknote className="w-4 h-4 text-[#F4511E]" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Buat Cash Out Baru</div>
          <div className="text-[11px] text-neutral-500">Isi data transaksi kas keluar ke supplier</div>
        </div>
      </div>

      {/* Row 1: Tanggal & Status Bayar */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tanggal Transaksi</label>
          <input
            type="date"
            value={form.tanggal}
            onChange={(e) => set('tanggal', e.target.value)}
            className={inputCls(errors.tanggal)}
          />
          {errors.tanggal && <p className="text-rose-400 text-[10px] mt-1">{errors.tanggal}</p>}
        </div>
        <div>
          <label className={labelCls}>Status Pembayaran</label>
          <select
            value={form.statusBayar}
            onChange={(e) => set('statusBayar', e.target.value)}
            className={inputCls(false)}
          >
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Lunas">Lunas</option>
          </select>
        </div>
      </div>

      {/* Row 2: Pilih Supplier */}
      <div>
        <label className={labelCls}>
          <User className="w-3 h-3 inline mr-1 mb-0.5" />
          Pilih Supplier
        </label>
        <select
          value={form.supplierId}
          onChange={(e) => {
            const s = suppliers.find((x) => x.id === e.target.value);
            set('supplierId', e.target.value);
            if (s) set('rekeningTujuan', `${s.bank} - ${s.noRekening} a/n ${s.rekeningAtasNama}`);
            else set('rekeningTujuan', '');
            if (errors.supplierId) setErrors((prev) => ({ ...prev, supplierId: '' }));
          }}
          className={inputCls(errors.supplierId)}
        >
          <option value="">— Pilih Supplier —</option>
          {suppliers.filter((s) => s.aktif !== false).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.supplierId && <p className="text-rose-400 text-[10px] mt-1">{errors.supplierId}</p>}
      </div>

      {/* Supplier Info (auto-populated) */}
      {selectedSupplier && (
        <div className="bg-[#0E1012] border border-[#1E2228] rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-neutral-500 text-[10px] uppercase block">Rekening</span>
            <span className="text-neutral-200">{selectedSupplier.bank} – {selectedSupplier.noRekening}</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[10px] uppercase block">A/N</span>
            <span className="text-neutral-200">{selectedSupplier.rekeningAtasNama}</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[10px] uppercase block">Penerima</span>
            <span className="text-neutral-200">{selectedSupplier.penerima}</span>
          </div>
          <div>
            <span className="text-neutral-500 text-[10px] uppercase block">PKP</span>
            <span className={selectedSupplier.pkp ? 'text-emerald-400' : 'text-neutral-400'}>
              {selectedSupplier.pkp ? 'PKP' : 'Non-PKP'}
            </span>
          </div>
        </div>
      )}

      {/* Row 3: Pilih Customer (optional) */}
      <div>
        <label className={labelCls}>Pilih Customer (Opsional)</label>
        <select
          value={form.customerId}
          onChange={(e) => set('customerId', e.target.value)}
          className={inputCls(false)}
        >
          <option value="">— Customer (Opsional) —</option>
          {customers.filter((c) => c.aktif !== false).map((c) => (
            <option key={c.id} value={c.id}>
              {c.idProgram ? `${c.idProgram} - ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Row 4: ID PO & ID RO */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>ID Nomor Purchase Order</label>
          <input
            type="text"
            value={form.nomorPO}
            onChange={(e) => set('nomorPO', e.target.value)}
            placeholder="Nomor PO..."
            className={inputCls(false)}
          />
        </div>
        <div>
          <label className={labelCls}>ID Nomor Received Order</label>
          <input
            type="text"
            value={form.nomorRO}
            onChange={(e) => set('nomorRO', e.target.value)}
            placeholder="Nomor RO (auto)..."
            className={inputCls(false)}
          />
        </div>
      </div>

      {/* Row 5: Material & Volume */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Material</label>
          <select
            value={form.material}
            onChange={(e) => set('material', e.target.value)}
            className={inputCls(false)}
          >
            {MATERIAL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Volume / Kuantitas</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.volume}
              onChange={(e) => set('volume', e.target.value)}
              placeholder="0.00"
              className={`flex-1 ${inputCls(false)}`}
            />
            <select
              value={form.satuan}
              onChange={(e) => set('satuan', e.target.value)}
              className="bg-[#111315] border border-[#2B3037] text-white rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-[#F4511E] w-16"
            >
              <option value="m³">m³</option>
              <option value="rit">rit</option>
              <option value="ton">ton</option>
              <option value="trip">trip</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 6: Nominal Kas Keluar */}
      <div>
        <label className={labelCls}>Nominal Kas Keluar (IDR)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono pointer-events-none">
            Rp
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.amount}
            onChange={(e) => {
              set('amount', e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
            }}
            placeholder="0"
            className={`${inputCls(errors.amount)} pl-9`}
          />
        </div>
        {errors.amount && <p className="text-rose-400 text-[10px] mt-1">{errors.amount}</p>}
        {form.amount && Number(form.amount) > 0 && (
          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
            = {formatCurrency(Number(form.amount))}
          </p>
        )}
      </div>

      {/* Row 7: Rekening Tujuan */}
      <div>
        <label className={labelCls}>Rekening Tujuan Pembayaran</label>
        <input
          type="text"
          value={form.rekeningTujuan}
          onChange={(e) => set('rekeningTujuan', e.target.value)}
          placeholder="Bank - No. Rekening a/n Nama (auto dari supplier)"
          className={inputCls(false)}
        />
      </div>

      {/* Row 8: Daftar Keterangan */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}>Daftar Keterangan</label>
          <button
            type="button"
            onClick={addKeterangan}
            className="text-[10px] text-[#F4511E] hover:text-white bg-[#F4511E]/10 hover:bg-[#F4511E]/20 border border-[#F4511E]/30 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            Tambah Keterangan
          </button>
        </div>
        <div className="space-y-2">
          {form.keterangan.map((k, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={k.type}
                onChange={(e) => updateKeterangan(idx, 'type', e.target.value)}
                className="bg-[#111315] border border-[#2B3037] text-white rounded-xl px-2 py-2.5 text-xs focus:outline-none focus:border-[#F4511E] w-32 shrink-0"
              >
                {KETERANGAN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                value={k.deskripsi}
                onChange={(e) => updateKeterangan(idx, 'deskripsi', e.target.value)}
                placeholder="Item / Deskripsi..."
                className="flex-1 bg-[#111315] border border-[#2B3037] text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F4511E] placeholder-neutral-600"
              />
              {form.keterangan.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKeterangan(idx)}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 cursor-pointer transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E2228]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#1C1F24] border border-[#2A2E33] transition-colors cursor-pointer disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#F4511E] hover:bg-[#E04418] transition-colors shadow-md shadow-[#F4511E]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              TERAPKAN
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BkkPage (Main Page)
// ─────────────────────────────────────────────────────────────────────────────
export default function BkkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const {
    bkkList,
    createBkk,
    markBkkPaid,
    deleteBkk,
    bankAccounts,
    suppliers,
    customers,
  } = useData();
  const { addToast } = useToast();

  // ── UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedItems, setSelectedItems] = useState([]);

  // ── Modals
  const [infoModalItem, setInfoModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
  });

  // Handle incoming navigation
  useEffect(() => {
    if (location.state?.order) {
      const o = location.state.order;
      if (o.nomorRO) setSearchFilter(o.nomorRO);
    }
  }, [location.state]);

  // ── Filtered list
  const filteredBkk = useMemo(() => {
    return bkkList.filter((item) => {
      const q = (searchFilter || '').toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.kodeTransaksi && item.kodeTransaksi.toLowerCase().includes(q)) ||
        (item.nomorRO && item.nomorRO.toLowerCase().includes(q)) ||
        (item.poNumber && item.poNumber.toLowerCase().includes(q)) ||
        (item.perusahaan && item.perusahaan.toLowerCase().includes(q)) ||
        (item.customer && item.customer.toLowerCase().includes(q)) ||
        (item.material && item.material.toLowerCase().includes(q)) ||
        (item.subDetail && item.subDetail.toLowerCase().includes(q)) ||
        (item.penerima && item.penerima.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'BELUM_BAYAR' && item.statusBayar !== 'Lunas') ||
        (statusFilter === 'LUNAS' && item.statusBayar === 'Lunas');

      return matchSearch && matchStatus;
    });
  }, [bkkList, searchFilter, statusFilter]);

  const handleResetAll = () => {
    setSearchFilter('');
    setStatusFilter('ALL');
    setSelectedItems([]);
    addToast('Filter data berhasil di-reset', 'info');
  };

  const toggleSelect = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const totalSelected = bkkList
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleConfirmPayment = () => {
    markBkkPaid(selectedItems, paymentForm);
    setSelectedItems([]);
    setShowPaymentModal(false);
  };

  const handleCreateSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await createBkk(data);
      setShowCreateForm(false);
    } catch (err) {
      addToast('Gagal membuat BKK. Coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white flex flex-col font-sans select-none relative pb-32">
      {/* ── TOP APP BAR ── */}
      <header className="sticky top-0 z-30 bg-[#0A0C0E] border-b border-[#1A1D21] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/');
            }}
            className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
              BKK (Cash Out)
            </h1>
            <p className="text-[11px] text-neutral-400">
              Bukti Kas Keluar ke supplier & pelunasan kas operasional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari transaksi..."
              className="bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] w-36 sm:w-52"
            />
            {searchFilter && (
              <X
                className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                onClick={() => setSearchFilter('')}
              />
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleResetAll}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>

          {/* Add BKK button */}
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              showCreateForm
                ? 'bg-[#F4511E]/20 border border-[#F4511E]/50 text-[#F4511E]'
                : 'bg-[#F4511E] hover:bg-[#E04418] text-white shadow-md shadow-[#F4511E]/20'
            }`}
            title={showCreateForm ? 'Tutup Form' : 'Buat Cash Out Baru'}
          >
            {showCreateForm ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tutup</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat BKK</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* ── CREATE FORM (collapsible) ── */}
        {showCreateForm && (
          <CreateBkkForm
            suppliers={suppliers}
            customers={customers}
            bankAccounts={bankAccounts}
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isSubmitting}
          />
        )}

        {/* ── TOOLBAR & STATUS FILTER ── */}
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-neutral-300">
              Total {filteredBkk.length} Transaksi Cash Out
            </span>
            {searchFilter && (
              <span className="text-[11px] font-mono text-[#F4511E] bg-[#F4511E]/10 border border-[#F4511E]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>Filter: &quot;{searchFilter}&quot;</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-white"
                  onClick={() => setSearchFilter('')}
                />
              </span>
            )}
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#F4511E] text-white'
                  : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
              }`}
            >
              SEMUA ({bkkList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('BELUM_BAYAR')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                statusFilter === 'BELUM_BAYAR'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#181B1E] text-rose-400 hover:text-rose-300 border border-[#262A30]'
              }`}
            >
              BELUM LUNAS
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                statusFilter === 'LUNAS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#181B1E] text-emerald-400 hover:text-emerald-300 border border-[#262A30]'
              }`}
            >
              LUNAS
            </button>
          </div>
        </div>

        {/* ── BKK LIST ── */}
        {filteredBkk.length === 0 ? (
          <div className="p-8 text-center bg-[#121417] border border-[#20242A] rounded-2xl space-y-3 font-mono">
            <Receipt className="w-10 h-10 text-neutral-500 mx-auto" />
            <div className="text-sm text-neutral-300 font-bold">
              Tidak ada data Cash Out yang sesuai filter
            </div>
            <p className="text-xs text-neutral-500">
              Coba reset filter atau buat transaksi Cash Out baru.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button size="xs" variant="outline" onClick={handleResetAll}>
                Reset Filter
              </Button>
              <Button
                size="xs"
                variant="primary"
                icon={Plus}
                onClick={() => setShowCreateForm(true)}
              >
                Buat BKK
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBkk.map((item) => (
              <CashOutCard
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onSelect={() => toggleSelect(item.id)}
                onDelete={() => setDeleteConfirmItem(item)}
                onInfo={() => setInfoModalItem(item)}
                canDelete={isSuperAdmin}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── STICKY SELECTION & PAYMENT BAR ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111315]/95 backdrop-blur-md border-t border-[#262A2F] p-3 shadow-2xl">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F4511E] animate-pulse shrink-0" />
              <div className="text-xs font-mono text-neutral-300 truncate">
                <strong className="text-white">{selectedItems.length}</strong> CO Terpilih &bull; Total:{' '}
                <strong className="text-[#F4511E] text-sm">{formatCurrency(totalSelected)}</strong>
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

      {/* ── MODAL DETAIL CASH OUT ── */}
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
                <span className="text-white font-bold">
                  {(Number(infoModalItem.volume ?? infoModalItem.kubikasi) || 0).toFixed(2)} m³
                </span>
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
                <span className="text-neutral-500 block text-[10px] uppercase">Customer / Perusahaan</span>
                <span className="text-white">{infoModalItem.customer || infoModalItem.perusahaan}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">No. PO & Subdetail</span>
                <span className="text-neutral-200">{infoModalItem.subDetail || infoModalItem.poNumber || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Waktu Transaksi</span>
                <span className="text-neutral-200">{infoModalItem.timestamp || infoModalItem.tanggal || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">Periode</span>
                <span className="text-neutral-200">{infoModalItem.periode || '-'}</span>
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
              {infoModalItem.rekeningTujuan && (
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Rekening Tujuan</span>
                  <span className="text-neutral-300 font-mono">{infoModalItem.rekeningTujuan}</span>
                </div>
              )}
            </div>

            <div className={`flex ${isSuperAdmin ? 'justify-between' : 'justify-end'} items-center pt-2 border-t border-[#262A2F]`}>
              {isSuperAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setDeleteConfirmItem(infoModalItem);
                    setInfoModalItem(null);
                  }}
                >
                  Hapus BKK
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setInfoModalItem(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL KONFIRMASI HAPUS BKK ── */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Hapus Bukti Kas Keluar"
        subtitle={deleteConfirmItem?.kodeTransaksi}
      >
        <div className="p-4 space-y-4 font-sans">
          <p className="text-xs text-neutral-300">
            Apakah Anda yakin ingin menghapus data BKK Kas Keluar{' '}
            <strong className="text-white">{deleteConfirmItem?.kodeTransaksi}</strong> (
            {deleteConfirmItem?.customer || deleteConfirmItem?.perusahaan}) senilai{' '}
            <strong className="text-[#F4511E]">{formatCurrency(deleteConfirmItem?.amount)}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#262A2F]">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmItem(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                deleteBkk(deleteConfirmItem.id);
                setSelectedItems((prev) => prev.filter((id) => id !== deleteConfirmItem.id));
                setDeleteConfirmItem(null);
              }}
            >
              Hapus BKK
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL KONFIRMASI PELUNASAN BKK ── */}
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
              onChange={(e) => setPaymentForm({ ...paymentForm, tanggalBayar: e.target.value })}
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Rekening Sumber PT BAS</label>
            <select
              required
              value={paymentForm.rekeningSumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, rekeningSumber: e.target.value })}
              className="w-full bg-[#181B1E] border border-[#262A2F] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}>
                  {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                </option>
              ))}
              <option value="Kas Tunai Kantor Gresik">Kas Tunai Kantor Gresik</option>
            </select>
          </div>

          <div className="p-2.5 rounded bg-[#181B1E] border border-[#262A2F] flex justify-between items-center text-xs">
            <span className="text-neutral-400">Total Pembayaran Vendor:</span>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalSelected)}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24282C]">
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Batal</Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleConfirmPayment}>
              Simpan Pelunasan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
