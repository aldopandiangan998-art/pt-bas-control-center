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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal, Button } from '../../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// CashOutCard (Faithful replica of user screenshot)
// ─────────────────────────────────────────────────────────────────────────────
function CashOutCard({
  item,
  isSelected,
  onSelect,
  onDelete,
  onInfo,
  canDelete = true,
}) {
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
        {/* Left Column: Volume, Unit, Material, Jenis */}
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

        {/* Right Column: Badges, Timestamp, Checkbox, Amount, Codes, Periode */}
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          {/* Top Line: Badges + Timestamp + Checkbox */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Red Badge */}
              <div
                className="w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center shrink-0 shadow-xs"
                title="Bukti Kas Keluar"
              >
                <FileText className="w-2.5 h-2.5" />
              </div>
              {/* Green Badge */}
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

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-[#3A404A] bg-[#16191D] accent-[#F4511E] cursor-pointer shrink-0"
            />
          </div>

          {/* Amount */}
          <div className="text-sm sm:text-base font-bold font-mono text-white mt-1.5 leading-tight">
            {amountFormatted}
          </div>

          {/* Document / RO Code */}
          <div className="text-xs font-mono text-neutral-300 mt-1 leading-tight truncate" title={docCode}>
            {docCode}
          </div>

          {/* Customer / Perusahaan Name */}
          <div className="text-xs font-bold font-mono text-neutral-100 uppercase mt-0.5 leading-tight truncate" title={customerName}>
            {customerName}
          </div>

          {/* PO / Sub detail */}
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate" title={poCode}>
            {poCode}
          </div>

          {/* Periode */}
          <div className="text-xs font-mono text-neutral-400 mt-0.5 leading-tight truncate">
            {periodeText}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#22262B] mt-3 pt-2.5">
        {/* Bottom Actions: Trash & Info */}
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
// BkkPage (Main Page)
// ─────────────────────────────────────────────────────────────────────────────
export default function BkkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const {
    bkkList,
    markBkkPaid,
    deleteBkk,
    bankAccounts,
  } = useData();
  const { addToast } = useToast();

  // ── Search & Filter State
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BELUM_BAYAR' | 'LUNAS'

  // Selection for bulk payment
  const [selectedItems, setSelectedItems] = useState([]);

  // Modals state
  const [infoModalItem, setInfoModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
  });

  // Handle incoming navigation from other pages (e.g. Rekapan)
  useEffect(() => {
    if (location.state?.order) {
      const o = location.state.order;
      if (o.nomorRO) {
        setSearchFilter(o.nomorRO);
      }
    }
  }, [location.state]);

  // ── Filtered Cash Out List (Pre-filtered with criteria & search)
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

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white flex flex-col font-sans select-none relative pb-32">
      {/* ── TOP APP BAR ── */}
      <header className="sticky top-0 z-30 bg-[#0A0C0E] border-b border-[#1A1D21] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Kembali"
            aria-label="Kembali"
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
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari transaksi..."
              className="bg-[#14171A] border border-[#24282E] rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] w-36 sm:w-56"
            />
            {searchFilter && (
              <X
                className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                onClick={() => setSearchFilter('')}
              />
            )}
          </div>

          {/* Reload / Refresh icon */}
          <button
            type="button"
            onClick={handleResetAll}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Refresh Data"
            aria-label="Refresh"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* ── DATA SECTION TOOLBAR & STATUS FILTER ── */}
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

        {/* ── BKK CASH OUT DATA DISPLAY LIST ── */}
        {filteredBkk.length === 0 ? (
          <div className="p-8 text-center bg-[#121417] border border-[#20242A] rounded-2xl space-y-3 font-mono">
            <Receipt className="w-10 h-10 text-neutral-500 mx-auto" />
            <div className="text-sm text-neutral-300 font-bold">
              Tidak ada data Cash Out yang sesuai filter
            </div>
            <p className="text-xs text-neutral-500">
              Coba reset filter atau gunakan kata kunci pencarian lain.
            </p>
            <Button size="xs" variant="outline" onClick={handleResetAll} className="mt-2">
              Reset Semua Filter
            </Button>
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
                <span className="text-neutral-500 block text-[10px] uppercase">No. PO &amp; Subdetail</span>
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
            <Button variant="primary" icon={CheckCircle2} onClick={handleConfirmPayment}>Simpan Pelunasan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
