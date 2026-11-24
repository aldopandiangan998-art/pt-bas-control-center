import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Printer,
  RotateCw,
  History,
  FileCheck,
  XCircle,
  ExternalLink,
  Info,
  Building2,
  Receipt,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal, Button, Badge } from '../../components/ui';

export default function InvoiceDetailWorkflowModal({
  isOpen = true,
  open,
  onClose,
  invoiceItem: propInvoiceItem,
  invoice: propInvoice,
  onOpenPrintModal,
  onInvoiceUpdated,
  onUpdated,
  initialTab,
}) {
  const effectiveIsOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : true);
  const invoiceItem = propInvoiceItem || propInvoice;
  const notifyUpdated = () => {
    if (onInvoiceUpdated) onInvoiceUpdated();
    if (onUpdated) onUpdated();
  };

  const { isSuperAdmin, currentUser } = useAuth();
  const {
    uploadInvoiceDocument,
    submitInvoiceDocumentForVerification,
    approveInvoiceVerification,
    rejectInvoiceVerification,
    fetchInvoiceDocuments,
    fetchInvoiceAuditTrail,
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'document' | 'history' | 'audit'
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Verification Decision State (Superadmin)
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [verificationRejectReason, setVerificationRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const lastOpenedIdRef = useRef(null);

  useEffect(() => {
    if (effectiveIsOpen && invoiceItem?.id) {
      if (lastOpenedIdRef.current !== invoiceItem.id) {
        lastOpenedIdRef.current = invoiceItem.id;
        const defaultTab = initialTab || (invoiceItem?.status === 'pending_verification' ? 'document' : 'summary');
        setActiveTab(defaultTab);
        setSelectedFile(null);
        setFileBase64('');
        setUploadNotes('');
        setShowRejectBox(false);
        setVerificationRejectReason('');
      }
    } else if (!effectiveIsOpen) {
      lastOpenedIdRef.current = null;
    }
  }, [effectiveIsOpen, invoiceItem?.id, initialTab]);

  const loadData = useCallback(async () => {
    if (!invoiceItem?.id) return;
    setLoadingDocs(true);
    setLoadingAudit(true);
    try {
      const [docs, logs] = await Promise.all([
        fetchInvoiceDocuments(invoiceItem.id),
        fetchInvoiceAuditTrail(invoiceItem.id),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching Invoice workflow details:', err);
    } finally {
      setLoadingDocs(false);
      setLoadingAudit(false);
    }
  }, [invoiceItem?.id, fetchInvoiceDocuments, fetchInvoiceAuditTrail]);

  useEffect(() => {
    if (effectiveIsOpen && invoiceItem?.id) {
      loadData();
    }
  }, [effectiveIsOpen, invoiceItem?.id, loadData]);

  if (!effectiveIsOpen || !invoiceItem) return null;

  // Normalized Status
  const statusStr = String(invoiceItem.status || '').toLowerCase();
  const isPaid = statusStr === 'paid' || invoiceItem.statusBayar === 'Lunas';
  const isPendingVerification = statusStr === 'pending_verification';
  const isRevisionRequired = statusStr === 'revision_required';
  const isApproved = statusStr === 'approved';
  const isPendingApproval = statusStr === 'pending_approval' || statusStr === 'menunggu_approval';
  const isRejected = statusStr === 'rejected';

  const latestDocument = documents.length > 0 ? documents[documents.length - 1] : null;

  // Stepper Current Step (1 - 6)
  let currentStep = 1;
  if (isRejected) {
    currentStep = 1;
  } else if (isPendingApproval) {
    currentStep = 1;
  } else if (isApproved && documents.length === 0) {
    currentStep = 3;
  } else if (isApproved && documents.length > 0) {
    currentStep = 4;
  } else if (isRevisionRequired) {
    currentStep = 4;
  } else if (isPendingVerification) {
    currentStep = 5;
  } else if (isPaid) {
    currentStep = 6;
  }

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      addToast('Ukuran berkas melebihi batas 15 MB.', 'error');
      return;
    }

    try {
      const b64 = await readFileAsDataUrl(file);
      setSelectedFile(file);
      setFileBase64(b64);
    } catch {
      addToast('Gagal memproses file.', 'error');
    }
  };

  const handleUploadDocument = async (autoSubmit = true) => {
    if (!selectedFile || !fileBase64) {
      addToast('Pilih berkas tanda tangan fisik terlebih dahulu.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await uploadInvoiceDocument(invoiceItem.id, {
        fileName: selectedFile.name,
        originalName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        fileBase64: fileBase64,
        notes: uploadNotes,
        uploader: `${currentUser?.name || 'Admin Logistik'} (${currentUser?.role || 'Staff'})`,
      });

      if (!uploadRes?.success) {
        throw new Error(uploadRes?.message || 'Gagal mengunggah dokumen.');
      }

      if (autoSubmit) {
        const submitRes = await submitInvoiceDocumentForVerification(invoiceItem.id);
        if (submitRes?.success) {
          addToast('Dokumen fisik berhasil diunggah & diajukan ke Superadmin!', 'success');
        }
      } else {
        addToast('Dokumen berhasil disimpan sebagai draf.', 'success');
      }

      setSelectedFile(null);
      setFileBase64('');
      setUploadNotes('');
      await loadData();
      notifyUpdated();
    } catch (err) {
      addToast(err.message || 'Terjadi kesalahan saat mengunggah dokumen.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Superadmin: Approve Document Verification (Stage 5-A -> Stage 6 LUNAS)
  const handleApproveVerification = async () => {
    setIsVerifying(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await approveInvoiceVerification(invoiceItem.id, { verifier });
      if (res?.success) {
        addToast('Verifikasi fisik disetujui! Status Invoice resmi menjadi LUNAS.', 'success');
        await loadData();
        notifyUpdated();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Superadmin: Reject Document Verification (Stage 5-B -> Stage 4 Revision)
  const handleRejectVerification = async () => {
    if (!verificationRejectReason.trim()) {
      addToast('Alasan penolakan / revisi dokumen wajib diisi.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const verifier = `${currentUser?.name || 'David Rusiah'} (Super Admin / Direktur)`;
      const res = await rejectInvoiceVerification(
        invoiceItem.id,
        { reason: verificationRejectReason.trim(), verifier }
      );
      if (res?.success) {
        addToast('Dokumen fisik ditolak. Status Invoice dikembalikan ke Admin untuk perbaikan tanda tangan.', 'info');
        setShowRejectBox(false);
        setVerificationRejectReason('');
        await loadData();
        notifyUpdated();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const grandTotal = Number(invoiceItem.totalTagihan || invoiceItem.nominal || invoiceItem.amount || 0);
  const subtotalDpp = Number(
    invoiceItem.dpp || (Number(invoiceItem.volume ?? invoiceItem.totalVolume ?? 0) * Number(invoiceItem.hargaSatuan || 0)) || 0
  );
  const ppnVal = Number(invoiceItem.ppnNominal || invoiceItem.ppn || 0);
  const pphVal = Number(invoiceItem.pphNominal || invoiceItem.pph || 0);

  return (
    <Modal
      isOpen={effectiveIsOpen}
      onClose={onClose}
      title="Alur Lengkap & Berkas Faktur Invoice"
      subtitle={`${invoiceItem.nomorInvoice || invoiceItem.kodeTransaksi || invoiceItem.id} • ${invoiceItem.nomorRO || '-'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* ══════════════════════════════════════════════════════════════════════
            1. 6-STAGE WORKFLOW STEPPER (Refined matching BKK Modal)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#14171A] border border-[#24282E] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-neutral-400 mb-3 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-neutral-300">
              Alur Bisnis Faktur Invoice PT BAS
            </span>
            <span className="text-[#F4511E] font-bold">
              {isPaid
                ? 'Tahap 6/6: LUNAS'
                : isPendingVerification
                ? 'Tahap 5/6: Menunggu Verifikasi'
                : isRevisionRequired
                ? 'Tahap 4/6: Perlu Revisi TTD'
                : isApproved
                ? documents.length > 0
                  ? 'Tahap 4/6: Siap Diajukan'
                  : 'Tahap 3/6: Cetak & TTD Fisik'
                : isRejected
                ? 'Pengajuan Ditolak'
                : 'Tahap 1/6: Menunggu Approval'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Step 1: Dibuat Admin */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                currentStep === 1
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 1
                  ? 'bg-[#181B1E] border-neutral-700/60 text-neutral-200'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep > 1 ? 'text-[#F4511E]' : 'text-[#F4511E]'} shrink-0`} />
                <span>1. Pembuatan</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Order 100% selesai dikirim
              </p>
            </div>

            {/* Step 2: Approval Superadmin */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isRejected
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  : currentStep === 2
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 2
                  ? 'bg-[#181B1E] border-neutral-700/60 text-neutral-200'
                  : isPendingApproval
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/50 text-white ring-1 ring-[#F4511E]/30'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isRejected ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : currentStep > 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F4511E]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>2. Approval</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Otorisasi oleh Direksi
              </p>
            </div>

            {/* Step 3: Cetak Dokumen A4 */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                currentStep === 3
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 3
                  ? 'bg-[#181B1E] border-neutral-700/60 text-neutral-200'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {currentStep > 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F4511E]" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>3. Cetak &amp; TTD</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Cetak fisik &amp; tanda tangan
              </p>
            </div>

            {/* Step 4: Upload Scan Dokumen */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isRevisionRequired
                  ? 'bg-rose-950/30 border-rose-500/60 text-rose-300 ring-1 ring-rose-500/40'
                  : currentStep === 4
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 4
                  ? 'bg-[#181B1E] border-neutral-700/60 text-neutral-200'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isRevisionRequired ? (
                  <RotateCw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : currentStep > 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F4511E]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>4. Unggah</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                {isRevisionRequired ? 'Revisi scan bertanda tangan' : 'Unggah berkas bertanda tangan'}
              </p>
            </div>

            {/* Step 5: Verifikasi Dokumen */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                currentStep === 5
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 5
                  ? 'bg-[#181B1E] border-neutral-700/60 text-neutral-200'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {currentStep > 5 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F4511E]" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>5. Verifikasi</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Super Admin audit keabsahan
              </p>
            </div>

            {/* Step 6: LUNAS */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isPaid
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'text-[#F4511E]' : 'text-neutral-500'} shrink-0`} />
                <span>6. Lunas</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                {isPaid ? 'Status Sah & Selesai' : 'Menunggu Pelunasan'}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. REVISION REQUIRED / REJECTION ALERT
           ══════════════════════════════════════════════════════════════════════ */}
        {isRevisionRequired && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold">Permintaan Revisi Tanda Tangan Dokumen Fisik</div>
              <p className="text-neutral-300 font-sans">
                Super Admin meminta perbaikan dokumen: <span className="font-semibold text-rose-200 font-mono">"{invoiceItem.rejectionReason || 'Tanda tangan belum lengkap'}"</span>.
                Silakan cetak ulang / perbaiki tanda tangan fisik, lalu unggah berkas yang baru di tab Berkas &amp; Tanda Tangan.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold">Invoice Ditolak pada Tahap Otorisasi</div>
              <p className="text-neutral-300 font-sans">
                Alasan penolakan: <span className="font-semibold text-rose-200 font-mono">"{invoiceItem.rejectionReason || 'Ditolak oleh Direksi'}"</span>.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            3. TAB NAVIGATION (Matching BKK Modal)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#24282E]">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-[#F4511E]" />
            <span>Rincian Finansial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'document'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Berkas &amp; Tanda Tangan</span>
            {documents.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 text-white">
                v{documents[documents.length - 1].version}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Riwayat Versi Dokumen ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Jejak Audit ({auditLogs.length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: RINCIAN FINANSIAL (FINANCIAL DETAILS)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="space-y-3 font-mono text-xs text-neutral-300">
            {/* Amount & Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                  Volume Tagihan
                </span>
                <span className="text-white font-black text-base">
                  {(Number(invoiceItem.volume ?? invoiceItem.totalVolume) || 0).toFixed(2)} m³
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                  Harga Satuan DPP
                </span>
                <span className="text-neutral-200 font-bold text-sm">
                  Rp {(Number(invoiceItem.hargaSatuan) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                  Total Nilai Tagihan (Net)
                </span>
                <span className="text-[#F4511E] font-black text-lg sm:text-xl">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Tax Breakdown Details (Clean Cohesive Neutrals) */}
            <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
              <div className="flex items-center justify-between border-b border-[#262A2F] pb-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Komposisi Pajak &amp; Perhitungan
                </span>
                <span className="text-neutral-400 text-[10px] font-mono">
                  UU Harmonisasi Peraturan Perpajakan (HPP)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Subtotal DPP:</span>
                  <span className="text-white font-bold">{formatCurrency(subtotalDpp)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">PPN ({invoiceItem.ppnPercent || 11}%):</span>
                  <span className="text-neutral-200 font-bold">+{formatCurrency(ppnVal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">PPh 23 ({invoiceItem.pphPercent || 2}%):</span>
                  <span className="text-neutral-200 font-bold">-{formatCurrency(pphVal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Total Tagihan Bersih:</span>
                  <span className="text-[#F4511E] font-black">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Entity Information (Customer & Order Reference) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Data Pelanggan (Customer) &amp; Penagihan
                </span>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Nama Pelanggan:</span>
                  <span className="text-white font-bold text-sm">
                    {invoiceItem.customerName || invoiceItem.customer || invoiceItem.perusahaan || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Alamat Penagihan:</span>
                  <span className="text-neutral-300 text-[11px] block">
                    {invoiceItem.customerAddress || invoiceItem.alamat || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">NPWP Pelanggan:</span>
                  <span className="text-neutral-200 font-mono font-medium">
                    {invoiceItem.customerNpwp || invoiceItem.npwp || '-'}
                  </span>
                </div>
                {invoiceItem.tempoHari && (
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Jatuh Tempo:</span>
                    <span className="text-neutral-200 font-mono text-[11px]">
                      {invoiceItem.tempoHari} Hari
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Data Pesanan &amp; Rekening PT BAS
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Nomor RO:</span>
                    <span className="text-neutral-200 font-bold font-mono">
                      {invoiceItem.nomorRO || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Nomor PO:</span>
                    <span className="text-neutral-200 font-mono">{invoiceItem.poNumber || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Material:</span>
                    <span className="text-neutral-300 font-bold uppercase">
                      {invoiceItem.material || 'SIRTU'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Tanggal Faktur:</span>
                    <span className="text-neutral-200 font-mono">
                      {invoiceItem.tanggal || (invoiceItem.createdAt ? String(invoiceItem.createdAt).slice(0, 10) : '-')}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Rekening Pembayaran PT BAS:</span>
                  <span className="text-neutral-200 font-mono text-[11px] block mt-0.5">
                    {invoiceItem.bankAccount
                      ? `${invoiceItem.bankName || 'BCA'} - ${invoiceItem.bankAccount} a/n ${invoiceItem.accountName || 'PT BINTANG ANUGERAH SEJAHTERA'}`
                      : invoiceItem.kirimKeRekening || 'BCA - 822-091-8888 a/n PT BINTANG ANUGERAH SEJAHTERA'}
                  </span>
                </div>
                {invoiceItem.notes && (
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Catatan Tagihan:</span>
                    <span className="text-neutral-300 text-[11px] block italic">
                      "{invoiceItem.notes}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle & Status Audit */}
            <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
              <div className="flex items-center justify-between border-b border-[#262A2F] pb-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Status &amp; Otorisasi
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isPendingVerification
                      ? 'bg-[#F4511E]/20 text-[#F4511E] border border-[#F4511E]/40'
                      : isRevisionRequired
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isApproved
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isPaid
                    ? 'LUNAS (TERVERIFIKASI SAH)'
                    : isPendingVerification
                    ? 'MENUNGGU VERIFIKASI SUPERADMIN'
                    : isRevisionRequired
                    ? 'PERLU REVISI DOKUMEN TTD'
                    : isApproved
                    ? 'DISETUJUI (SIAP CETAK & TTD)'
                    : 'MENUNGGU APPROVAL'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Status Pelunasan:</span>
                  <span className="text-neutral-200 font-medium">
                    {isPaid ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Status Dokumen Fisik:</span>
                  <span className="text-neutral-200">
                    {latestDocument
                      ? `Ada (v${latestDocument.version} - ${latestDocument.status})`
                      : 'Belum Diunggah'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Tanggal Pelunasan:</span>
                  <span className="text-neutral-300">
                    {invoiceItem.tanggalBayar || (isPaid ? 'Terverifikasi' : 'Menunggu Pelunasan')}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Action Shortcut */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B1E] border border-[#262A2F]">
              <div className="text-xs font-sans text-neutral-300">
                <div className="font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#F4511E]" />
                  <span>Cetak Dokumen Fisik Faktur A4</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Gunakan template resmi PT BAS untuk proses tanda tangan basah dan arsip penagihan.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={Printer}
                onClick={onOpenPrintModal}
                disabled={isPendingApproval}
                title={isPendingApproval ? 'Invoice harus disetujui Superadmin terlebih dahulu' : 'Buka dialog cetak'}
              >
                Cetak Faktur
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: BERKAS & TANDA TANGAN (Physical Document Management)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'document' && (
          <div className="space-y-4">
            {/* Active Document Preview */}
            {latestDocument ? (
              <div className="bg-[#181B1E] border border-[#262A2F] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#F4511E]" />
                    <div>
                      <div className="font-bold text-white text-xs font-mono">
                        {latestDocument.originalName || latestDocument.fileName}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        Versi {latestDocument.version} &bull; Diunggah oleh {latestDocument.uploadedBy} pada {formatDate(latestDocument.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        latestDocument.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : latestDocument.status === 'SUBMITTED'
                          ? 'bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40'
                          : latestDocument.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {latestDocument.status}
                    </span>

                    <a
                      href={latestDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#24282F] hover:bg-[#2F343E] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Buka berkas di tab baru"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Inline Preview if Image */}
                {latestDocument.fileType?.startsWith('image/') && (
                  <div className="rounded-lg overflow-hidden border border-[#2A2E34] bg-black/50 max-h-96 flex items-center justify-center p-2">
                    <img
                      src={latestDocument.fileUrl}
                      alt="Pratinjau Dokumen Bertanda Tangan"
                      className="max-h-80 object-contain rounded"
                    />
                  </div>
                )}

                {/* PDF Notice */}
                {latestDocument.fileType?.includes('pdf') && (
                  <div className="p-3 bg-[#16191D] rounded-lg border border-[#24282E] flex items-center justify-between text-xs font-mono text-neutral-300">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      Berkas PDF Terverifikasi ({((latestDocument.fileSize || 0) / 1024).toFixed(1)} KB)
                    </span>
                    <a
                      href={latestDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F4511E] hover:underline font-bold"
                    >
                      Buka Dokumen PDF &rarr;
                    </a>
                  </div>
                )}

                {/* Superadmin Decision Actions */}
                {isSuperAdmin && (isPendingVerification || (isApproved && latestDocument.status === 'SUBMITTED')) && (
                  <div className="p-4 bg-[#14171A] rounded-xl border border-[#F4511E]/30 space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                      <ShieldCheck className="w-4 h-4 text-[#F4511E]" />
                      <span>Keputusan Verifikasi Fisik Dokumen (Super Admin / Direksi)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Pastikan keabsahan tanda tangan pihak terkait pada fisik faktur invoice sebelum mengesahkan pelunasan.
                    </p>

                    {showRejectBox ? (
                      <div className="space-y-2 bg-[#181B1E] p-3 rounded-lg border border-rose-500/40">
                        <label className="text-xs font-bold text-rose-300 block font-mono">
                          Alasan Penolakan / Permintaan Revisi Dokumen:
                        </label>
                        <textarea
                          value={verificationRejectReason}
                          onChange={(e) => setVerificationRejectReason(e.target.value)}
                          placeholder="Contoh: Tanda tangan stempel customer tidak terbaca / kurang tanda tangan direktur..."
                          rows={2}
                          className="w-full bg-[#14171A] border border-[#2E3339] rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-rose-500 font-sans"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowRejectBox(false)}
                            className="px-3 py-1 rounded-lg text-neutral-400 hover:text-white text-xs cursor-pointer font-mono"
                          >
                            Batal
                          </button>
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={handleRejectVerification}
                            disabled={isVerifying || !verificationRejectReason.trim()}
                          >
                            Kirim Penolakan ke Admin
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={CheckCircle2}
                          onClick={handleApproveVerification}
                          disabled={isVerifying}
                        >
                          Verifikasi Sah &amp; Tandai LUNAS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={RotateCw}
                          onClick={() => setShowRejectBox(true)}
                          disabled={isVerifying}
                          className="text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                        >
                          Minta Revisi Dokumen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[#2A2E34] rounded-xl text-neutral-400 text-xs font-mono space-y-1">
                <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <div>Belum ada dokumen fisik bertanda tangan yang diunggah.</div>
                <div className="text-[11px] text-neutral-500">
                  {isApproved
                    ? 'Silakan cetak faktur, kumpulkan tanda tangan fisik, lalu unggah di bawah ini.'
                    : 'Faktur harus disetujui Superadmin terlebih dahulu sebelum proses penandatanganan fisik.'}
                </div>
              </div>
            )}

            {/* Upload Section (Active when Approved or Revision Required) */}
            {(isApproved || isRevisionRequired || isPendingVerification) && !isPaid && (
              <div className="bg-[#181B1E] border border-[#262A2F] p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#F4511E]" />
                  <span>Unggah Berkas Faktur Bertanda Tangan Fisik</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F4511E]/20 file:text-[#F4511E] hover:file:bg-[#F4511E]/30 cursor-pointer"
                    />
                    <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                      Maksimal 15 MB &bull; Format: PDF, PNG, JPG (Pastikan tanda tangan &amp; stempel terbaca jelas)
                    </span>
                  </div>

                  {selectedFile && (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        value={uploadNotes}
                        onChange={(e) => setUploadNotes(e.target.value)}
                        placeholder="Catatan dokumen (opsional, misal: 'Ditandatangani oleh Pak David & Customer')"
                        className="w-full bg-[#14171A] border border-[#2E3339] rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-[#F4511E] font-sans"
                      />

                      <div className="flex items-center gap-2 justify-end pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUploadDocument(false)}
                          disabled={isUploading}
                        >
                          Simpan Draf Dokumen
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={ShieldCheck}
                          onClick={() => handleUploadDocument(true)}
                          disabled={isUploading}
                        >
                          Unggah &amp; Ajukan ke Superadmin
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: RIWAYAT VERSI DOKUMEN
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-500">
                Belum ada riwayat dokumen yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-[#262A2F] border border-[#262A2F] rounded-xl overflow-hidden bg-[#181B1E]">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#14171A] border border-[#2A2E34] text-neutral-300 font-mono font-bold flex items-center justify-center text-[11px]">
                        v{doc.version}
                      </div>
                      <div>
                        <div className="font-bold text-white font-mono">{doc.originalName || doc.fileName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Diunggah oleh {doc.uploadedBy} &bull; {formatDate(doc.uploadedAt)}
                          {doc.notes && ` &bull; "${doc.notes}"`}
                        </div>
                        {doc.rejectionReason && (
                          <div className="text-[11px] text-rose-400 font-sans mt-0.5">
                            Alasan revisi: "{doc.rejectionReason}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : doc.status === 'SUBMITTED'
                            ? 'bg-[#F4511E]/20 text-orange-300 border border-[#F4511E]/40'
                            : doc.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#24282F] hover:bg-[#2F343E] text-neutral-400 hover:text-white transition-colors"
                        title="Unduh / Lihat Berkas"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: JEJAK AUDIT
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-neutral-500">
                Belum ada catatan aktivitas audit trail.
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#181B1E] border border-[#262A2F] text-xs font-mono flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F4511E] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : '-'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Aktor: <span className="text-neutral-200">{log.actorName}</span> ({log.actorRole})
                      </div>
                      {log.details && (
                        <div className="text-[10px] text-neutral-400 bg-[#14171A] p-2 rounded mt-1.5 font-mono overflow-x-auto">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="pt-3 border-t border-[#24282C] flex items-center justify-between">
          <div className="text-[11px] font-mono text-neutral-400">
            ID: {invoiceItem.id} &bull; Dibuat oleh {invoiceItem.createdBy || 'Admin'}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
