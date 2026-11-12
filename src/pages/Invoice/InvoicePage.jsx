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
import { Button, Badge, Card, Input, Select } from '../../components/ui';

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
    <div className="space-y-4 max-w-5xl mx-auto pb-20">
      {/* Top Header Bar matching Screenshot 5 */}
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
              <span>Buat Invoice Penjualan</span>
              <Badge size="xs" variant="primary">Faktur Pajak</Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Faktur tagihan customer resmi • Menghitung PPN 11% & PPH 2.0% / 2.65% otomatis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => setInvoiceGenerated(false)}
            title="Reset Faktur"
          />
        </div>
      </div>

      {/* Filter / Form Container strictly replicating Screenshot 5 */}
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

              {/* Row 2: ID Received Order & Rekening Atas Nama (auto) */}
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

              {/* Row 3: ID Nomor PO Customer (auto) & Tanggal/Waktu */}
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
            </>
          )}

          {/* Orange Action Button: TERAPKAN (Screenshot 5) */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full uppercase font-bold tracking-wider"
          >
            TERAPKAN & GENERATE INVOICE
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

      {/* Generated Enterprise Invoice Sheet (Aturan 28 - 32) */}
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

            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
            >
              Cetak Faktur Penjualan
            </Button>
          </div>

          {/* Tax Breakdown Table per Section 2 Aturan 29 - 31 */}
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
  );
}
