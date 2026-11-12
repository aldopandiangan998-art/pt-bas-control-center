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
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { TAX_RATES } from '../../utils/constants';
import { useData } from '../../context/DataContext';

export default function InvoicePage() {
  const navigate = useNavigate();
  const { customers, bankAccounts } = useData();

  // Form state replicating Screenshot 5: "Buat Invoice"
  const [formData, setFormData] = useState({
    pelanggan: 'PT LION WINGS',
    kirimKeRekening: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    idReceivedOrder: 'RO-202611-00042',
    rekeningAtasNama: 'PT Berkah Alam Semesta',
    nomorPoCustomer: 'PO-LW-2026-089',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    materialType: 'Curah',
    subtotalJasa: 19371600,
    memuatJasaPengangkutan: true,
  });

  const [filterHidden, setFilterHidden] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

  // Exact Tax calculations per Implementation Plan Section 2 (Aturan 28 - 31)
  const calculation = useMemo(() => {
    const subtotal = formData.subtotalJasa;
    const ppnNominal = Math.round((subtotal * TAX_RATES.PPN_PERCENT) / 100);
    const pphRate = formData.materialType === 'Curah' ? TAX_RATES.PPH_CURAH : TAX_RATES.PPH_PADAT;
    const pphNominal = formData.memuatJasaPengangkutan ? Math.round((subtotal * pphRate) / 100) : 0;
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
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar matching Screenshot 5 */}
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
              Buat Invoice
            </h2>
            <p className="text-[11px] text-neutral-400">
              Faktur penagihan customer • Menghitung PPN 11% & PPH otomatis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setInvoiceGenerated(false)}
            className="p-1.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-neutral-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Form Container strictly replicating Screenshot 5 */}
      <form onSubmit={handleApply} className="bg-[#141414] border border-[#242424] rounded-lg p-3.5 sm:p-4 space-y-3">
        {!filterHidden && (
          <>
            {/* Row 1: Pilih Pelanggan & Kirim ke Rekening */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  Pilih Pelanggan
                </label>
                <select
                  value={formData.pelanggan}
                  onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  Kirim ke Rekening
                </label>
                <select
                  value={formData.kirimKeRekening}
                  onChange={(e) => setFormData({ ...formData, kirimKeRekening: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={`${acc.bank} - ${acc.nomorRekening} a/n ${acc.rekeningAtasNama}`}>
                      {acc.bank} - {acc.nomorRekening} a/n {acc.rekeningAtasNama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: ID Received Order & Rekening Atas Nama (auto) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                  ID Received Order
                </label>
                <select
                  value={formData.idReceivedOrder}
                  onChange={(e) => setFormData({ ...formData, idReceivedOrder: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E] font-mono"
                >
                  <option value="RO-202611-00042">RO-202611-00042 (PO-LW-2026-089)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  Rekening Atas Nama (auto)
                </label>
                <input
                  type="text"
                  value={formData.rekeningAtasNama}
                  readOnly
                  className="w-full bg-[#181818] border border-[#242424] text-neutral-300 rounded px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>

            {/* Row 3: ID Nomor PO Customer (auto), Tanggal, Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-neutral-500" />
                  ID Nomor PO Customer (auto)
                </label>
                <input
                  type="text"
                  value={formData.nomorPoCustomer}
                  readOnly
                  className="w-full bg-[#181818] border border-[#242424] text-neutral-300 rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Waktu
                </label>
                <input
                  type="time"
                  value={formData.waktu}
                  onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                  className="w-full bg-[#1C1C1C] border border-[#2C2C2C] text-neutral-100 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#F4511E]"
                />
              </div>
            </div>
          </>
        )}

        {/* Orange Action Button: TERAPKAN (Screenshot 5) */}
        <button
          type="submit"
          className="w-full py-2.5 rounded bg-[#F4511E] hover:bg-[#D84315] text-white font-bold text-xs tracking-wider uppercase shadow transition-colors"
        >
          TERAPKAN
        </button>

        {/* Toggle Collapse: Sembunyikan Filter ^ */}
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
      </form>

      {/* Generated Enterprise Invoice Sheet (Aturan 28 - 32) */}
      {invoiceGenerated && (
        <section className="bg-[#141414] border border-[#242424] rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#222222]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F4511E] block">
                PT BERKAH ALAM SEMESTA • FAKTUR TAGIHAN
              </span>
              <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                INV-202611-00001
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Customer: <strong className="text-white">{formData.pelanggan}</strong> | PO: {formData.nomorPoCustomer}
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded bg-[#1F1F1F] hover:bg-[#282828] text-white text-xs font-semibold flex items-center gap-1.5 border border-[#333] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Faktur
            </button>
          </div>

          {/* Tax Breakdown Table per Section 2 Aturan 29 - 31 */}
          <div className="space-y-2 max-w-sm ml-auto font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-[#1E1E1E]">
              <span className="text-neutral-400">Total Jasa & Material:</span>
              <span className="text-white font-medium">{formatCurrency(calculation.subtotal)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#1E1E1E]">
              <span className="text-neutral-400">PPN 11%:</span>
              <span className="text-neutral-200">+{formatCurrency(calculation.ppnNominal)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#1E1E1E]">
              <span className="text-neutral-400">
                PPH {calculation.pphRate}% ({formData.materialType === 'Curah' ? 'Curah' : 'Padat'}):
              </span>
              <span className="text-[#F4511E]">-{formatCurrency(calculation.pphNominal)}</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline border-t border-[#2A2A2A]">
              <span className="text-xs font-bold text-neutral-300">Total Dibayar:</span>
              <span className="text-base font-bold text-[#F4511E]">
                {formatCurrency(calculation.totalTagihan)}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
