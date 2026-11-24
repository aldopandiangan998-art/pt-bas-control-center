import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { terbilangRupiah } from '../../utils/formatters';

function buildInitialPrintData(invoiceItem) {
  if (!invoiceItem) return null;
  const vol = Number(invoiceItem.volume) || 0;
  const harga = Number(invoiceItem.hargaSatuan) || 0;
  const subtotal = Number(invoiceItem.subtotalJasa || invoiceItem.dpp) || Math.round(vol * harga);
  const ppn = Number(invoiceItem.ppnNominal || invoiceItem.ppn) || 0;
  const pph = Number(invoiceItem.pphNominal || invoiceItem.pph) || 0;
  const total = Number(invoiceItem.amount) || (subtotal + ppn - pph);

  return {
    invoiceId: invoiceItem.id,
    invoiceNumber: invoiceItem.nomorInvoice || invoiceItem.kodeTransaksi || invoiceItem.id,
    kodeTransaksi: invoiceItem.kodeTransaksi || invoiceItem.id,
    nomorFakturPajak: invoiceItem.nomorFakturPajak || '-',
    tanggal: invoiceItem.tanggal || new Date().toISOString().split('T')[0],
    timestamp: invoiceItem.timestamp || invoiceItem.created_at,
    periode: invoiceItem.periode || (invoiceItem.tanggal ? `Periode: [${invoiceItem.tanggal}]` : '-'),
    customer: {
      id: invoiceItem.customerId,
      name: invoiceItem.customer || invoiceItem.perusahaan || 'PT CUSTOMER',
      address: invoiceItem.customerAddress || '-',
      npwp: invoiceItem.npwp || '-',
      phone: invoiceItem.customerTelepon || '-',
    },
    poNumber: invoiceItem.poNumber || '-',
    nomorRO: invoiceItem.nomorRO || '-',
    material: invoiceItem.material || 'SIRTU',
    materialType: invoiceItem.materialType || 'Curah',
    jenis: invoiceItem.jenis || 'JASA ANGKUT + MATERIAL',
    volume: vol,
    satuan: invoiceItem.satuan || 'm3',
    hargaSatuan: harga,
    subtotalJasa: subtotal,
    dpp: subtotal,
    tarifPpn: Number(invoiceItem.tarifPpn ?? 11),
    ppnNominal: ppn,
    tarifPph: Number(invoiceItem.tarifPph ?? 0),
    pphNominal: pph,
    amount: total,
    status: invoiceItem.status,
    statusBayar: invoiceItem.statusBayar,
    rekeningTujuan: invoiceItem.kirimKeRekening || 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    rekeningAtasNama: invoiceItem.rekeningAtasNama || 'PT Berkah Alam Semesta',
    createdBy: invoiceItem.createdBy || 'Admin',
    approvedBy: invoiceItem.approvedBy,
    approvedAt: invoiceItem.approvedAt,
    verifiedBy: invoiceItem.verifiedBy,
    verifiedAt: invoiceItem.verifiedAt,
    suratJalanList: [
      {
        id: 'SJ-1',
        nomorSuratJalan: invoiceItem.nomorRO || 'SJ-001',
        tanggal: invoiceItem.tanggal || '-',
        waktu: '10:00',
        nopol: '-',
        driver: '-',
        material: invoiceItem.material || 'SIRTU',
        volume: vol,
        satuan: invoiceItem.satuan || 'm3',
      },
    ],
  };
}

export default function InvoicePrintModal({
  isOpen = true,
  open,
  onClose,
  invoiceItem: propInvoiceItem,
  invoice: propInvoice,
}) {
  const effectiveIsOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : true);
  const invoiceItem = propInvoiceItem || propInvoice;
  const { currentUser } = useAuth();
  const { fetchInvoicePrintData, recordInvoicePrint } = useData();
  const [printData, setPrintData] = useState(() => buildInitialPrintData(invoiceItem));
  const [loading, setLoading] = useState(false);
  const printAreaRef = useRef(null);
  const lastFetchedIdRef = useRef(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (effectiveIsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [effectiveIsOpen]);

  const invoiceItemId = invoiceItem?.id;

  // Fetch verified print data with daily SJ delivery breakdown
  useEffect(() => {
    if (!effectiveIsOpen || !invoiceItemId) {
      lastFetchedIdRef.current = null;
      return;
    }

    if (lastFetchedIdRef.current === invoiceItemId) return;
    lastFetchedIdRef.current = invoiceItemId;

    let isMounted = true;
    setPrintData((prev) => (prev?.invoiceId === invoiceItemId ? prev : buildInitialPrintData(invoiceItem)));

    (async () => {
      try {
        setLoading(true);
        const data = await fetchInvoicePrintData(invoiceItemId);
        if (isMounted && data) {
          setPrintData(data);
        }
      } catch (err) {
        console.error('Error fetching Invoice print data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [effectiveIsOpen, invoiceItemId, fetchInvoicePrintData, invoiceItem]);

  if (!effectiveIsOpen || !invoiceItem) return null;

  const creatorName = printData?.createdBy || invoiceItem.createdBy || 'Admin Penjualan';
  const approverName = printData?.approvedBy || invoiceItem.approvedBy || 'David Rusiah (Direktur)';

  const formatTimestamp = (rawTs) => {
    if (!rawTs) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    const d = new Date(rawTs.includes('T') ? rawTs : rawTs.replace(' ', 'T'));
    if (!isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    return rawTs;
  };

  const createdTimestampFormatted = formatTimestamp(printData?.timestamp || invoiceItem.timestamp || invoiceItem.created_at);

  const handlePrint = () => {
    if (invoiceItem?.id && recordInvoicePrint) {
      recordInvoicePrint(invoiceItem.id);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const grandTotalAmount = Number(printData?.amount || invoiceItem.amount || 0);
  const amountInWords = terbilangRupiah(grandTotalAmount);

  const formatIdr = (val) => {
    return `IDR ${(Number(val) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const invNumber = printData?.invoiceNumber || invoiceItem.nomorInvoice || invoiceItem.kodeTransaksi || '-';
  const customerName = printData?.customer?.name || invoiceItem.customer || invoiceItem.perusahaan || 'PT CUSTOMER';
  const poNumber = printData?.poNumber || invoiceItem.poNumber || '-';
  const roNumber = printData?.nomorRO || invoiceItem.nomorRO || '-';
  const subtotalDpp = Number(printData?.dpp || printData?.subtotalJasa || invoiceItem.subtotalJasa || 0);
  const ppnVal = Number(printData?.ppnNominal || invoiceItem.ppnNominal || 0);
  const pphVal = Number(printData?.pphNominal || invoiceItem.pphNominal || 0);

  const modalContent = (
    <div className="bkk-print-modal-overlay fixed inset-0 z-[70] overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* ── MODAL CONTAINER ── */}
      <div className="bkk-print-modal-container bg-[#14171A] border border-[#2A2E33] rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bkk-modal-action-bar p-3 sm:p-4 bg-[#181B1E] border-b border-[#24282C] flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4511E]/15 text-[#F4511E] flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Template Cetak Faktur Invoice Penjualan
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#202428] text-neutral-300 border border-[#2E3339]">
                  A4 &bull; 210 &times; 297 mm
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                {invNumber} &bull; {customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#F4511E] hover:bg-[#E04418] text-white text-xs font-bold transition-all shadow-md shadow-[#F4511E]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Cetak Dokumen"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#202428] hover:bg-[#2A2E34] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="bkk-print-modal-body flex-1 overflow-auto p-4 sm:p-8 bg-[#0B0D0F] flex justify-center items-start">
          {loading && !printData ? (
            <div className="py-24 text-center font-mono text-xs text-neutral-400 space-y-2">
              <div className="w-6 h-6 border-2 border-[#F4511E] border-t-transparent rounded-full animate-spin mx-auto" />
              <div>Memuat data rincian Faktur Invoice...</div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               PRINTABLE DOCUMENT CANVAS (Standard A4 Portrait)
               ══════════════════════════════════════════════════════════════════ */
            <div
              id="printable-invoice-document"
              ref={printAreaRef}
              className="bg-white text-black shadow-2xl font-sans leading-normal select-text shrink-0 print:shadow-none print:rounded-none"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '15mm',
                boxSizing: 'border-box',
                color: '#000000',
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {/* 1. KOP SURAT PT BAS */}
              <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none uppercase">
                      PT. BERKAH ALAM SEMESTA
                    </h1>
                    <p className="text-xs text-neutral-700 mt-1">
                      General Trading, Supplier Pasir, Sirtu, Limestone, & Material Tambang
                    </p>
                    <p className="text-[11px] text-neutral-600">
                      Office: Kawasan Industri & Pergudangan Tambak Langon Indah, Surabaya | Telp: (031) 7490001
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-black text-white font-mono font-bold text-xs uppercase tracking-widest rounded-sm">
                      FAKTUR INVOICE
                    </span>
                    <div className="text-xs font-mono font-bold mt-2 text-neutral-900">
                      NO: {invNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. INVOICE META & BILL TO SECTION */}
              <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
                {/* Left: Pelanggan (Bill To) */}
                <div className="border border-neutral-300 rounded p-3">
                  <div className="font-bold uppercase tracking-wider text-neutral-500 text-[10px] mb-1.5 border-b pb-1">
                    TAGIHAN KEPADA (CUSTOMER)
                  </div>
                  <div className="font-bold text-sm text-black mb-1">{customerName}</div>
                  <div className="text-neutral-700 text-[11px] space-y-0.5">
                    <div><span className="font-semibold">Alamat:</span> {printData?.customer?.address || '-'}</div>
                    <div><span className="font-semibold">NPWP:</span> {printData?.customer?.npwp || '-'}</div>
                    <div><span className="font-semibold">Telepon:</span> {printData?.customer?.phone || '-'}</div>
                  </div>
                </div>

                {/* Right: Order & Invoice Reference */}
                <div className="border border-neutral-300 rounded p-3">
                  <div className="font-bold uppercase tracking-wider text-neutral-500 text-[10px] mb-1.5 border-b pb-1">
                    DETAIL PESANAN & TRANSAKSI
                  </div>
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="text-neutral-600 py-0.5 w-32 font-medium">Tanggal Invoice</td>
                        <td className="font-bold font-mono text-black">: {printData?.tanggal || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-neutral-600 py-0.5 font-medium">Nomor Purchase Order</td>
                        <td className="font-bold font-mono text-black">: {poNumber}</td>
                      </tr>
                      <tr>
                        <td className="text-neutral-600 py-0.5 font-medium">Nomor Received Order</td>
                        <td className="font-bold font-mono text-black">: {roNumber}</td>
                      </tr>
                      <tr>
                        <td className="text-neutral-600 py-0.5 font-medium">Faktur Pajak DJP</td>
                        <td className="font-bold font-mono text-black">: {printData?.nomorFakturPajak || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-neutral-600 py-0.5 font-medium">Periode Pengiriman</td>
                        <td className="font-medium text-black">: {printData?.periode || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. TABLE OF DELIVERIES & LINE ITEMS */}
              <div className="mb-6">
                <div className="text-xs font-bold text-black uppercase mb-2">
                  Rincian Penjualan Material & Jasa Angkut
                </div>
                <table className="w-full border-collapse border border-black text-xs font-mono">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black text-black">
                      <th className="border-r border-black p-2 text-center w-10">NO</th>
                      <th className="border-r border-black p-2 text-left">DESKRIPSI MATERIAL / LAYANAN</th>
                      <th className="border-r border-black p-2 text-center w-24">VOLUME</th>
                      <th className="border-r border-black p-2 text-center w-16">SATUAN</th>
                      <th className="border-r border-black p-2 text-right w-32">HARGA SATUAN</th>
                      <th className="p-2 text-right w-36">SUBTOTAL (DPP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-300">
                      <td className="border-r border-neutral-300 p-2 text-center">1</td>
                      <td className="border-r border-neutral-300 p-2">
                        <div className="font-bold text-black">{printData?.material || 'SIRTU'} ({printData?.materialType || 'Curah'})</div>
                        <div className="text-[10px] text-neutral-600 font-sans mt-0.5">{printData?.jenis || 'JASA ANGKUT + MATERIAL'}</div>
                        <div className="text-[10px] text-neutral-500 font-sans">RO: {roNumber} | PO: {poNumber}</div>
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-center font-bold">
                        {Number(printData?.volume || 0).toFixed(2)}
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-center uppercase">
                        {printData?.satuan === 'm3' ? 'm³' : printData?.satuan || 'm³'}
                      </td>
                      <td className="border-r border-neutral-300 p-2 text-right font-medium">
                        {formatIdr(printData?.hargaSatuan || 0)}
                      </td>
                      <td className="p-2 text-right font-bold text-black">
                        {formatIdr(subtotalDpp)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. TOTALS & TAX BREAKDOWN */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Left: Terbilang & Catatan Pembayaran */}
                <div className="border border-neutral-300 rounded p-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-neutral-500 uppercase text-[10px] mb-1">
                      TERBILANG NILAI TOTAL:
                    </div>
                    <div className="italic font-serif font-bold text-neutral-800 text-xs bg-neutral-50 p-2 rounded border border-neutral-200">
                      "{amountInWords} Rupiah"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200">
                    <div className="font-bold uppercase text-[10px] text-neutral-500 mb-1">
                      INSTRUKSI PEMBAYARAN TRANSFER:
                    </div>
                    <div className="text-[11px] text-neutral-800 space-y-0.5 font-mono">
                      <div><span className="font-semibold font-sans">Bank Tujuan:</span> BCA (Bank Central Asia)</div>
                      <div><span className="font-semibold font-sans">No. Rekening:</span> 0188920199</div>
                      <div><span className="font-semibold font-sans">Atas Nama:</span> PT Berkah Alam Semesta</div>
                    </div>
                  </div>
                </div>

                {/* Right: Financial Summary Box */}
                <div className="border border-black rounded p-3 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-neutral-700">
                    <span>Subtotal Jasa (DPP):</span>
                    <span className="font-bold text-black">{formatIdr(subtotalDpp)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>PPN (11%):</span>
                    <span className="font-medium text-black">{ppnVal > 0 ? `+ ${formatIdr(ppnVal)}` : 'IDR 0.00'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>PPh 23 ({printData?.tarifPph || (printData?.materialType === 'Curah' ? '2.0' : '2.65')}%):</span>
                    <span className="font-medium text-neutral-600">{pphVal > 0 ? `- ${formatIdr(pphVal)}` : 'IDR 0.00'}</span>
                  </div>
                  <div className="border-t-2 border-black pt-2 mt-2 flex justify-between text-sm font-black text-black">
                    <span className="uppercase">TOTAL TAGIHAN:</span>
                    <span className="text-base">{formatIdr(grandTotalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* 5. SIGNATURE SECTION (3 Column Corporate Standard) */}
              <div className="pt-6 border-t border-neutral-300">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  {/* Kolom 1: Disiapkan Admin */}
                  <div>
                    <div className="text-[11px] text-neutral-600 mb-1">Disiapkan Oleh,</div>
                    <div className="font-semibold text-black uppercase">Admin Penjualan</div>
                    <div className="h-20 border-b border-black mx-4 mt-2 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-400 italic font-mono">[Tanda Tangan Fisik]</span>
                    </div>
                    <div className="font-bold text-black mt-2 font-mono text-[11px] truncate">
                      {creatorName}
                    </div>
                    <div className="text-[10px] text-neutral-500">PT Berkah Alam Semesta</div>
                  </div>

                  {/* Kolom 2: Disetujui Direktur */}
                  <div>
                    <div className="text-[11px] text-neutral-600 mb-1">Disetujui Oleh,</div>
                    <div className="font-semibold text-black uppercase">Direktur Operasional</div>
                    <div className="h-20 border-b border-black mx-4 mt-2 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-400 italic font-mono">[Tanda Tangan & Cap]</span>
                    </div>
                    <div className="font-bold text-black mt-2 font-mono text-[11px] truncate">
                      {approverName}
                    </div>
                    <div className="text-[10px] text-neutral-500">PT Berkah Alam Semesta</div>
                  </div>

                  {/* Kolom 3: Diterima Customer */}
                  <div>
                    <div className="text-[11px] text-neutral-600 mb-1">Diterima & Disetujui,</div>
                    <div className="font-semibold text-black uppercase">Pelanggan / Customer</div>
                    <div className="h-20 border-b border-black mx-4 mt-2 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-400 italic font-mono">[Tanda Tangan & Cap PT]</span>
                    </div>
                    <div className="font-bold text-black mt-2 font-mono text-[11px] truncate">
                      {customerName}
                    </div>
                    <div className="text-[10px] text-neutral-500">Penerima Tagihan</div>
                  </div>
                </div>
              </div>

              {/* 6. FOOTER AUDIT METADATA */}
              <div className="mt-8 pt-3 border-t border-neutral-200 flex justify-between items-center text-[9px] text-neutral-400 font-mono">
                <div>
                  Dicetak pada: {createdTimestampFormatted} &bull; Dicetak oleh: {currentUser?.name || 'Admin'}
                </div>
                <div>
                  PT Berkah Alam Semesta Control Center &bull; Halaman 1 dari 1
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
