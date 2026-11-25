import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { terbilangRupiah } from '../../utils/formatters';

function buildInitialPrintData(bkkItem) {
  if (!bkkItem) return null;
  return {
    bkkId: bkkItem.id,
    coNumber: bkkItem.kodeTransaksi || bkkItem.id,
    tanggal: bkkItem.tanggal,
    timestamp: bkkItem.timestamp || bkkItem.created_at,
    customer: bkkItem.customer || bkkItem.perusahaan || '-',
    poNumber: bkkItem.poNumber || '-',
    nomorRO: bkkItem.nomorRO || '-',
    poType: bkkItem.jenis || 'MATERIAL + JASA ANGKUT',
    supplier: {
      name: bkkItem.perusahaan || 'PAK TEGUH (BARU)',
      bank: bkkItem.supplierBank || 'BCA',
      noRekening: bkkItem.supplierNoRekening || '7415250533',
      atasNama: bkkItem.supplierRekeningAtasNama || bkkItem.penerima || 'EKO WAHYUDI PRAYOGO',
      penerima: bkkItem.penerima || 'EKO WAHYUDI PRAYOGO',
    },
    transactions: [
      {
        tanggal: bkkItem.tanggal || '-',
        material: bkkItem.material || 'LIMESTONE',
        ritaseCount: bkkItem.ritaseCount || 1,
        volume: Number(bkkItem.volume ?? bkkItem.kubikasi ?? 0),
        hargaSatuan: Number(bkkItem.hargaSatuan) || 0,
        subtotal: Number(bkkItem.amount) || 0,
      },
    ],
    totalVolume: Number(bkkItem.volume ?? bkkItem.kubikasi ?? 0),
    totalAmount: Number(bkkItem.amount) || 0,
    status: bkkItem.status,
    approvedBy: bkkItem.approvedBy,
    approvedAt: bkkItem.approvedAt,
    createdBy: bkkItem.createdBy || 'Admin',
  };
}

export default function BkkPrintModal({ isOpen, onClose, bkkItem }) {
  const { currentUser } = useAuth();
  const { fetchBkkPrintData, recordBkkPrint } = useData();
  const [printData, setPrintData] = useState(() => buildInitialPrintData(bkkItem));

  // Business Rule: Printing only allowed after Superadmin approval
  const statusStr = String(bkkItem?.status || printData?.status || '').toLowerCase();
  const isApprovedForPrint = ['approved', 'pending_verification', 'revision_required', 'paid'].includes(statusStr) || bkkItem?.statusBayar === 'Lunas';
  const [loading, setLoading] = useState(false);
  const printAreaRef = useRef(null);
  const lastFetchedIdRef = useRef(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const bkkItemId = bkkItem?.id;

  // Fetch verified print data with daily GI breakdown stably without flickering
  useEffect(() => {
    if (!isOpen || !bkkItemId) {
      lastFetchedIdRef.current = null;
      return;
    }

    // If already fetched for this exact ID, do not refetch or trigger loading state
    if (lastFetchedIdRef.current === bkkItemId) return;
    lastFetchedIdRef.current = bkkItemId;

    let isMounted = true;

    // Immediately provide initial printData so preview never flickers or goes blank
    setPrintData((prev) => (prev?.bkkId === bkkItemId ? prev : buildInitialPrintData(bkkItem)));

    (async () => {
      try {
        const data = await fetchBkkPrintData(bkkItemId);
        if (isMounted && data) {
          setPrintData(data);
        }
      } catch (err) {
        console.error('Error fetching print data:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, bkkItemId, fetchBkkPrintData, bkkItem]);

  if (!isOpen || !bkkItem) return null;

  // Actual authenticated user full name (for printing statement)
  const printerName = currentUser?.name || currentUser?.email || 'David Rusiah Yunus';
  const creatorName = printData?.createdBy || bkkItem.createdBy || 'Rana Puspita A.';

  // Format creation timestamp to: DD/MM/YYYY HH:mm:ss
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

  const createdTimestampFormatted = formatTimestamp(printData?.timestamp || bkkItem.timestamp || bkkItem.created_at);

  const handlePrint = () => {
    if (!isApprovedForPrint) {
      return;
    }
    if (bkkItem?.id && recordBkkPrint) {
      recordBkkPrint(bkkItem.id);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const grandTotalAmount = Number(printData?.totalAmount || bkkItem.amount || 0);
  const amountInWords = terbilangRupiah(grandTotalAmount);

  // Helper format currency to match reference screenshot: IDR 67,000.00
  const formatIdr = (val) => {
    return `IDR ${(Number(val) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Resolve Material Name for table sub-header
  const rawMaterial = printData?.transactions?.[0]?.material || bkkItem.material || 'LIMESTONE';
  const cleanMaterial = rawMaterial
    .replace(/\s*\(Curah\)/i, '')
    .replace(/\s*\(Padat\)/i, '')
    .trim()
    .toUpperCase();
  const materialTitle = `${cleanMaterial} | CURAH`;

  // Supplier details
  const supplierName = printData?.supplier?.name || bkkItem.perusahaan || 'PAK TEGUH (BARU)';
  const supplierBank = printData?.supplier?.bank || 'BCA';
  const supplierNoRek = printData?.supplier?.noRekening || '7415250533';
  const atasNama = printData?.supplier?.atasNama || 'EKO WAHYUDI PRAYOGO';
  const penerima = printData?.supplier?.penerima || atasNama;
  const rekCombined = atasNama === penerima ? `${atasNama} - ${penerima}` : `${atasNama} - ${penerima}`;

  // Cash-Out details
  const coNumber = printData?.coNumber || bkkItem.kodeTransaksi || bkkItem.id;
  const customerName = printData?.customer || bkkItem.customer || bkkItem.perusahaan || 'NUTRIPRO PRIMA ASIA, PT';
  const poNumber = printData?.poNumber || bkkItem.poNumber || '-';
  const poType = printData?.poType || 'MATERIAL + JASA ANGKUT';

  const modalContent = (
    <div className="bkk-print-modal-overlay fixed inset-0 z-[70] overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* ── MODAL CONTAINER (max-w-5xl ensures comfortable viewport framing for 210mm A4 sheet) ── */}
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
                  Dokumen Cash-Out (Keperluan Internal)
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[#202428] text-neutral-300 border border-[#2E3339]">
                  A4 &bull; 210 &times; 297 mm
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                {coNumber} &bull; {customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isApprovedForPrint && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Menunggu Approval Superadmin</span>
              </div>
            )}
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !isApprovedForPrint}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                isApprovedForPrint
                  ? 'bg-[#F4511E] hover:bg-[#E04418] shadow-[#F4511E]/20 cursor-pointer'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700 opacity-50 cursor-not-allowed shadow-none'
              }`}
              title={isApprovedForPrint ? 'Cetak Dokumen' : 'Pencetakan tidak diizinkan sebelum BKK disetujui Superadmin'}
            >
              {isApprovedForPrint ? (
                <Printer className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isApprovedForPrint ? 'Cetak Dokumen' : 'Pencetakan Terkunci'}</span>
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
              <div>Memuat data transaksi dan rincian Cash-Out...</div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               PRINTABLE DOCUMENT CANVAS (Exact 1:1 Replica of Standard A4)
               - Paper size: 210mm × 297mm (Standard A4 Portrait)
               - Balanced, symmetrical print margins: exactly 15mm on all 4 sides
               - Inner printable width: 180mm (210mm - 30mm)
               ══════════════════════════════════════════════════════════════════ */
            <div
              id="printable-bkk-document"
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
              {/* 1. DOCUMENT TITLE (Left-aligned, Heavy Bold Sans-Serif) */}
              <h1 className="text-xl sm:text-[22px] font-black tracking-tight text-black uppercase mb-6 leading-none">
                CASH-OUT (KEPERLUAN INTERNAL)
              </h1>

              {/* 2. TOP INFORMATION SECTION (Two Columns with Slanted Badges) */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                
                {/* Left Column: PEMBAYARAN */}
                <div>
                  <div
                    className="inline-block bg-[#545A64] text-white font-extrabold text-[11px] px-4 py-0.5 tracking-wider uppercase mb-2"
                    style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)' }}
                  >
                    PEMBAYARAN
                  </div>

                  <table className="w-full text-xs text-black border-collapse mt-1">
                    <tbody>
                      <tr>
                        <td className="w-24 py-0.5 text-black font-semibold whitespace-nowrap">Supplier</td>
                        <td className="w-3 text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold uppercase">{supplierName}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-black font-semibold whitespace-nowrap">Ke Rekening</td>
                        <td className="text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold font-mono">{supplierBank} - {supplierNoRek}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-black font-semibold align-top leading-tight whitespace-nowrap">
                          <div>Rek. A/N -</div>
                          <div>Dibayar ke</div>
                        </td>
                        <td className="text-center py-0.5 font-semibold align-top">:</td>
                        <td className="py-0.5 text-black font-semibold uppercase align-top leading-tight">
                          {rekCombined}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column: DETAIL CO */}
                <div>
                  <div
                    className="inline-block bg-[#545A64] text-white font-extrabold text-[11px] px-4 py-0.5 tracking-wider uppercase mb-2"
                    style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)' }}
                  >
                    DETAIL CO
                  </div>

                  <table className="w-full text-xs text-black border-collapse mt-1">
                    <tbody>
                      <tr>
                        <td className="w-20 py-0.5 text-black font-semibold whitespace-nowrap">No. CO</td>
                        <td className="w-3 text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold font-mono">{coNumber}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-black font-semibold whitespace-nowrap">Customer</td>
                        <td className="text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold uppercase">{customerName}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-black font-semibold whitespace-nowrap">No. PO</td>
                        <td className="text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold font-mono">{poNumber}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 text-black font-semibold whitespace-nowrap">Jenis PO</td>
                        <td className="text-center py-0.5 font-semibold">:</td>
                        <td className="py-0.5 text-black font-semibold uppercase">{poType}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* 3. TRANSACTION DETAILS TABLE */}
              <div className="mb-6">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-black font-black text-black">
                      <th className="py-1.5 px-1 text-left w-[36%] font-extrabold">Item# / Deskripsi</th>
                      <th className="py-1.5 px-1 text-right w-[22%] font-extrabold">Harga Satuan</th>
                      <th className="py-1.5 px-1 text-right w-[18%] font-extrabold">Jumlah (CBM)</th>
                      <th className="py-1.5 px-1 text-right w-[24%] font-extrabold">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Material Item Row */}
                    <tr>
                      <td colSpan={4} className="pt-2 pb-1 px-1 font-bold text-black uppercase tracking-tight text-xs">
                        {materialTitle}
                      </td>
                    </tr>

                    {/* Distinct Delivery Date Rows (Requirement 4) */}
                    {printData?.transactions?.map((item, idx) => (
                      <tr key={item.tanggal || idx}>
                        <td className="py-1 px-1 text-left font-mono font-medium text-black">
                          {item.tanggal}
                        </td>
                        <td className="py-1 px-1 text-right font-mono font-bold text-black">
                          {formatIdr(item.hargaSatuan)}
                        </td>
                        <td className="py-1 px-1 text-right font-mono font-bold text-black">
                          {(Number(item.volume) || 0).toFixed(2)}
                        </td>
                        <td className="py-1 px-1 text-right font-mono font-bold text-black">
                          {formatIdr(item.subtotal)}
                        </td>
                      </tr>
                    ))}

                    {/* Total Summary Row with Gray Shading */}
                    <tr className="bg-[#EAECEF] border-t border-neutral-300 font-extrabold text-black">
                      <td colSpan={3} className="py-2 px-2 text-right uppercase text-[11px] leading-tight">
                        <div>JUMLAH PEMBAYARAN</div>
                        <div>(PEMBULATAN)</div>
                      </td>
                      <td className="py-2 px-1 text-right font-mono font-black text-xs text-black">
                        {formatIdr(grandTotalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. TERBILANG SECTION */}
              <div className="mb-6">
                <div
                  className="inline-block bg-[#545A64] text-white font-extrabold text-[11px] px-4 py-0.5 tracking-wider uppercase mb-1.5"
                  style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)' }}
                >
                  TERBILANG
                </div>
                <div className="font-bold text-xs sm:text-[13px] text-black mt-1">
                  {amountInWords}
                </div>
              </div>

              {/* 5. APPROVAL & SIGNATURE SECTION (5 Columns) */}
              <div className="mb-3">
                <table className="w-full border border-black border-collapse text-center">
                  <thead>
                    <tr className="border-b border-black font-extrabold text-[11px] uppercase">
                      <th className="py-1 border-r border-black font-black w-[20%] text-center">PEMBUKUAN</th>
                      <th className="py-1 border-r border-black font-black w-[20%] text-center">MENGETAHUI</th>
                      <th className="py-1 border-r border-black font-black w-[20%] text-center">MENYETUJUI</th>
                      <th className="py-1 border-r border-black font-black w-[20%] text-center">KASIR</th>
                      <th className="py-1 font-black w-[20%] text-center">PENERIMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="h-12 border-r border-black"></td>
                      <td className="h-12 border-r border-black"></td>
                      <td className="h-12 border-r border-black"></td>
                      <td className="h-12 border-r border-black"></td>
                      <td className="h-12"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 6. AUDIT PRINTING METADATA */}
              <div className="text-right text-[10px] text-neutral-800 italic pt-1 font-sans">
                Dicetak oleh: {printerName}. Dibuat tanggal: {createdTimestampFormatted} WIB, oleh {creatorName}.
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── CSS PRINT STYLESHEET: 100% A4 ALIGNMENT, SYMMETRICAL 15mm MARGINS, ZERO OVERFLOW ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: #ffffff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide application root completely to avoid layout collision or sidebar offset */
          #root {
            display: none !important;
          }

          /* Hide action bar, buttons, and app elements */
          .bkk-modal-action-bar,
          .print\\:hidden {
            display: none !important;
          }

          /* Neutralize modal wrapper hierarchy */
          .bkk-print-modal-overlay {
            position: static !important;
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            overflow: visible !important;
          }

          .bkk-print-modal-container {
            position: static !important;
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .bkk-print-modal-body {
            position: static !important;
            display: block !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }

          /* Printable document: exact A4 dimensions with symmetrical 15mm margins */
          #printable-bkk-document {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 15mm 15mm 15mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: visible !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
