import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Ticket,
  Calendar,
  Clock,
  RotateCcw,
  Receipt,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { TAX_RATES } from '../../utils/constants';

export default function InvoicePage() {
  const navigate = useNavigate();

  // State replicating Screenshot 5: "Buat Invoice"
  const [formData, setFormData] = useState({
    pelanggan: 'PT LION WINGS',
    kirimKeRekening: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    idReceivedOrder: 'RO-202611-00042',
    rekeningAtasNama: 'PT Berkah Alam Semesta',
    nomorPoCustomer: 'PO-LW-2026-089',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    materialType: 'Curah', // 'Curah' (2%) or 'Padat' (2.65%)
    subtotalJasa: 19371600, // Total jasa dari rekapan
    memuatJasaPengangkutan: true,
  });

  const [filterHidden, setFilterHidden] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

  // Exact Tax calculations per Implementation Plan Section 2 (Aturan 28 - 31)
  const calculation = useMemo(() => {
    const subtotal = formData.subtotalJasa;
    const ppnNominal = Math.round((subtotal * TAX_RATES.PPN_PERCENT) / 100);
    const pphRate = formData.materialType === 'Curah' ? TAX_RATES.PPH_CURAH : TAX_RATES.PPH_PADAT;
    
    // PPH applies if invoice contains transportation services (Aturan 30)
    const pphNominal = formData.memuatJasaPengangkutan ? Math.round((subtotal * pphRate) / 100) : 0;
    
    // Formula per Aturan 31: Subtotal + PPN - PPH
    const totalTagihan = subtotal + ppnNominal - pphNominal;

    return {
      subtotal,
      ppnNominal,
      pphRate,
      pphNominal,
      totalTagihan,
    };
  }, [formData.subtotalJasa, formData.materialType, formData.memuatJasaPengangkutan]);

  const handleApply = (e) => {
    e.preventDefault();
    setInvoiceGenerated(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar matching Screenshot 5 */}
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
              Buat Invoice
            </h2>
            <p className="text-xs text-neutral-400">
              Faktur penagihan customer • Menghitung PPN 11% & PPH otomatis sesuai jenis material
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInvoiceGenerated(false)}
            className="p-2 rounded-lg bg-[#242424] hover:bg-[#333] text-neutral-300 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Form Container reproducing Screenshot 5 */}
      <form onSubmit={handleApply} className="bg-[#1C1C1C] border border-[#2D2D2D] rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {!filterHidden && (
          <>
            {/* Row 1: Pilih Pelanggan & Kirim ke Rekening */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" />
                  Pilih Pelanggan
                </label>
                <select
                  value={formData.pelanggan}
                  onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="PT LION WINGS">PT LION WINGS</option>
                  <option value="PT SEMEN INDONESIA">PT SEMEN INDONESIA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  Kirim ke Rekening
                </label>
                <select
                  value={formData.kirimKeRekening}
                  onChange={(e) => setFormData({ ...formData, kirimKeRekening: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="BCA - 0188920199 a/n PT Berkah Alam Semesta">
                    BCA - 0188920199 a/n PT Berkah Alam Semesta
                  </option>
                  <option value="Mandiri - 14200192881 a/n PT Berkah Alam Semesta">
                    Mandiri - 14200192881 a/n PT Berkah Alam Semesta
                  </option>
                </select>
              </div>
            </div>

            {/* Row 2: ID Received Order & Rekening Atas Nama (auto) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-neutral-400" />
                  ID Received Order
                </label>
                <select
                  value={formData.idReceivedOrder}
                  onChange={(e) => setFormData({ ...formData, idReceivedOrder: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="RO-202611-00042">RO-202611-00042 (PO-LW-2026-089)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-400" />
                  Rekening Atas Nama (auto)
                </label>
                <input
                  type="text"
                  value={formData.rekeningAtasNama}
                  readOnly
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-neutral-300 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Row 3: ID Nomor PO Customer (auto), Tanggal, Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-neutral-400" />
                  ID Nomor PO Customer (auto)
                </label>
                <input
                  type="text"
                  value={formData.nomorPoCustomer}
                  readOnly
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-neutral-300 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  Waktu
                </label>
                <input
                  type="time"
                  value={formData.waktu}
                  onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                  className="w-full bg-[#272727] border border-[#3C3C3C] text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F4511E]"
                />
              </div>
            </div>
          </>
        )}

        {/* Orange Action Button: TERAPKAN */}
        <button
          type="submit"
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
      </form>

      {/* Generated Invoice Sheet Preview (Aturan 28 - 32) */}
      {invoiceGenerated && (
        <section className="bg-[#1C1C1C] border border-[#333] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#2C2C2C]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4511E]">
                Faktur Penjualan Material
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                INV-202611-00001
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Ditujukan ke: <strong className="text-white">{formData.pelanggan}</strong> • PO: {formData.nomorPoCustomer}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold flex items-center gap-2 border border-[#3C3C3C] transition-colors"
            >
              <Printer className="w-4 h-4 text-neutral-300" />
              Cetak / Unduh PDF
            </button>
          </div>

          {/* Tax & Pricing Breakdown */}
          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Total Jasa Pengangkutan & Material:</span>
              <span className="font-mono font-medium text-white">{formatCurrency(calculation.subtotal)}</span>
            </div>

            <div className="flex justify-between text-xs text-neutral-300">
              <span>PPN 11%:</span>
              <span className="font-mono font-medium text-emerald-400">+{formatCurrency(calculation.ppnNominal)}</span>
            </div>

            <div className="flex justify-between text-xs text-neutral-300">
              <span>
                PPH {calculation.pphRate}% ({formData.materialType === 'Curah' ? 'Material Curah' : 'Material Padat'}):
              </span>
              <span className="font-mono font-medium text-rose-400">-{formatCurrency(calculation.pphNominal)}</span>
            </div>

            <div className="pt-3 border-t border-[#333] flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Jumlah Yang Harus Dibayar:</span>
              <span className="text-xl font-bold font-mono text-[#F4511E]">
                {formatCurrency(calculation.totalTagihan)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 pt-4 border-t border-[#292929] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Status Invoice: <strong className="text-amber-400 font-semibold">TERBIT (Piutang)</strong></span>
            <span>Transfer ke: {formData.kirimKeRekening}</span>
          </div>
        </section>
      )}
    </div>
  );
}
