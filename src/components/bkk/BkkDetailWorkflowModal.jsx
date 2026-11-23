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
  Download,
  Eye,
  RotateCw,
  History,
  FileCheck,
  XCircle,
  ExternalLink,
  Info,
  Check,
  User,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal, Button, Badge } from '../../components/ui';

export default function BkkDetailWorkflowModal({
  isOpen,
  onClose,
  bkkItem,
  onOpenPrintModal,
  onBkkUpdated,
  initialTab,
}) {
  const { isSuperAdmin, currentUser } = useAuth();
  const {
    uploadBkkDocument,
    submitBkkDocumentForVerification,
    approveBkkVerification,
    rejectBkkVerification,
    fetchBkkDocuments,
    fetchBkkAuditTrail,
    deleteBkk,
  } = useData();
  const { addToast } = useToast();

  // Navigation tab state - defaults to financial details overview
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

  // Track the BKK ID to initialize modal state strictly ONCE per item opening
  const lastOpenedIdRef = useRef(null);

  // 1. Initialize modal state when opened for a new BKK record
  useEffect(() => {
    if (isOpen && bkkItem?.id) {
      if (lastOpenedIdRef.current !== bkkItem.id) {
        lastOpenedIdRef.current = bkkItem.id;
        const defaultTab = initialTab || (bkkItem?.status === 'pending_verification' ? 'document' : 'summary');
        setActiveTab(defaultTab);
        setSelectedFile(null);
        setFileBase64('');
        setUploadNotes('');
        setShowRejectBox(false);
        setVerificationRejectReason('');
      }
    } else if (!isOpen) {
      lastOpenedIdRef.current = null;
    }
  }, [isOpen, bkkItem?.id, initialTab]);

  // 2. Fetch documents and audit trail independently without resetting user navigation
  const loadData = useCallback(async () => {
    if (!bkkItem?.id) return;
    setLoadingDocs(true);
    setLoadingAudit(true);
    try {
      const [docs, logs] = await Promise.all([
        fetchBkkDocuments(bkkItem.id),
        fetchBkkAuditTrail(bkkItem.id),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching BKK workflow details:', err);
    } finally {
      setLoadingDocs(false);
      setLoadingAudit(false);
    }
  }, [bkkItem?.id, fetchBkkDocuments, fetchBkkAuditTrail]);

  useEffect(() => {
    if (isOpen && bkkItem?.id) {
      loadData();
    }
  }, [isOpen, bkkItem?.id, loadData]);

  if (!isOpen || !bkkItem) return null;

  // Normalized Status
  const statusStr = String(bkkItem.status || '').toLowerCase();
  const isPaid = statusStr === 'paid' || bkkItem.statusBayar === 'Lunas';
  const isPendingVerification = statusStr === 'pending_verification';
  const isRevisionRequired = statusStr === 'revision_required';
  const isApproved = statusStr === 'approved';
  const isPendingApproval = statusStr === 'pending_approval' || statusStr === 'menunggu_approval';
  const isRejected = statusStr === 'rejected';

  // Latest Document
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

  // Helper to read file as Data URL Promise
  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle File Input Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      addToast('Ukuran berkas melebihi batas 25MB.', 'error');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) ||
      /\.(png|jpe?g)$/i.test(file.name);

    if (!isPdf && !isImage) {
      addToast('Format berkas harus PDF, PNG, atau JPG.', 'error');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload Document & optionally submit directly
  const handleUploadAndSubmit = async (autoSubmit = true) => {
    if (!selectedFile) {
      addToast('Pilih berkas fisik bertanda tangan terlebih dahulu.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Ensure base64 string is ready even if reader hasn't completed
      let base64 = fileBase64;
      if (!base64 && selectedFile) {
        base64 = await readFileAsDataUrl(selectedFile);
        setFileBase64(base64);
      }

      if (!base64) {
        throw new Error('Gagal membaca isi berkas dokumen.');
      }

      const fileType =
        selectedFile.type ||
        (selectedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

      const uploadRes = await uploadBkkDocument(bkkItem.id, {
        fileBase64: base64,
        fileData: base64,
        fileName: selectedFile.name,
        originalName: selectedFile.name,
        fileType,
        fileSize: selectedFile.size,
        notes: uploadNotes.trim() || undefined,
      });

      if (!uploadRes?.success) {
        throw new Error(uploadRes?.message || 'Gagal mengunggah dokumen.');
      }

      if (autoSubmit) {
        const submitRes = await submitBkkDocumentForVerification(
          bkkItem.id,
          uploadRes.data?.id || uploadRes.document?.id
        );
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
      if (onBkkUpdated) onBkkUpdated();
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
      const res = await approveBkkVerification(bkkItem.id, { verifier });
      if (res?.success) {
        addToast('Verifikasi fisik disetujui! Status BKK resmi menjadi LUNAS.', 'success');
        await loadData();
        if (onBkkUpdated) onBkkUpdated();
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
      const res = await rejectBkkVerification(
        bkkItem.id,
        { reason: verificationRejectReason.trim(), verifier }
      );
      if (res?.success) {
        addToast('Dokumen fisik ditolak. Status BKK menjadi Perlu Revisi.', 'info');
        setShowRejectBox(false);
        setVerificationRejectReason('');
        await loadData();
        if (onBkkUpdated) onBkkUpdated();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alur Lengkap & Berkas Bukti Kas Keluar (BKK)"
      subtitle={`${bkkItem.kodeTransaksi || bkkItem.id} • ${bkkItem.nomorRO || '-'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* ══════════════════════════════════════════════════════════════════════
            1. 6-STAGE WORKFLOW STEPPER (Refined with Primary Accent & Cohesive Neutrals)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#14171A] border border-[#24282E] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-neutral-400 mb-3 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-neutral-300">
              Alur Bisnis Kas Keluar (BKK) PT BAS
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
                  ? 'bg-[#181B1E] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep > 1 ? 'text-emerald-400' : 'text-[#F4511E]'} shrink-0`} />
                <span>1. Pembuatan</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Order selesai 100% dari Rekapan Jurnal
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
                  ? 'bg-[#181B1E] border-emerald-500/40 text-emerald-300'
                  : isPendingApproval
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/50 text-white ring-1 ring-[#F4511E]/30'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isRejected ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : currentStep > 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>2. Approval</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Otorisasi administratif oleh Direksi
              </p>
            </div>

            {/* Step 3: Cetak Dokumen A4 */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                currentStep === 3
                  ? 'bg-[#F4511E]/10 border-[#F4511E]/60 text-white ring-1 ring-[#F4511E]/30'
                  : currentStep > 3
                  ? 'bg-[#181B1E] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {currentStep > 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>3. Cetak & TTD</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Cetak fisik & kumpulkan 5 tanda tangan
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
                  ? 'bg-[#181B1E] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isRevisionRequired ? (
                  <RotateCw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : currentStep > 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  ? 'bg-[#181B1E] border-emerald-500/40 text-emerald-300'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {currentStep > 5 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                )}
                <span>5. Verifikasi</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Super Admin audit keabsahan berkas
              </p>
            </div>

            {/* Step 6: LUNAS */}
            <div
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isPaid
                  ? 'bg-emerald-950/30 border-emerald-500/70 text-emerald-300 ring-1 ring-emerald-500/50'
                  : 'bg-[#181B1E] border-[#262A30] text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {isPaid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                )}
                <span>6. Lunas</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans">
                Kas keluar resmi selesai & terkunci
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. TABS NAVIGATION (Unified with Primary Brand Color #F4511E)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 border-b border-[#24282E] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rincian Finansial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'document'
                ? 'bg-[#F4511E] text-white shadow-sm'
                : 'bg-[#181B1E] text-neutral-400 hover:text-white border border-[#262A30]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Dokumen Fisik Bertanda Tangan</span>
            {documents.length > 0 && (
              <span className={`w-1.5 h-1.5 rounded-full inline-block ml-1 ${activeTab === 'document' ? 'bg-white' : 'bg-[#F4511E]'}`} />
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
            TAB 1: RINCIAN FINANSIAL
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="space-y-3 font-mono text-xs text-neutral-300">
            {/* Amount & Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F]">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">
                  Volume Kirim
                </span>
                <span className="text-white font-black text-base">
                  {(Number(bkkItem.volume ?? bkkItem.kubikasi) || 0).toFixed(2)}{' '}
                  {bkkItem.satuan || 'm³'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">
                  Harga Satuan Beli
                </span>
                <span className="text-neutral-200 font-bold text-sm">
                  Rp {(Number(bkkItem.hargaSatuan) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-500 block text-[10px] uppercase">
                  Total Nilai Kas Keluar
                </span>
                <span className="text-[#F4511E] font-black text-lg sm:text-xl">
                  {formatCurrency(bkkItem.amount)}
                </span>
              </div>
            </div>

            {/* Entity Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Data Vendor Supplier
                </span>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Nama Supplier:</span>
                  <span className="text-white font-bold text-sm">
                    {bkkItem.perusahaan || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Penerima / A.N:</span>
                  <span className="text-neutral-200">
                    {bkkItem.penerima || bkkItem.rekeningAtasNama || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Rekening Bank:</span>
                  <span className="text-white font-mono font-medium">
                    {bkkItem.rekeningTujuan || '-'}
                  </span>
                </div>
              </div>

              <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Data Pesanan & Customer
                </span>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Customer:</span>
                  <span className="text-white font-bold">
                    {bkkItem.customer || bkkItem.subDetail || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Nomor RO:</span>
                    <span className="text-neutral-200 font-bold">
                      {bkkItem.nomorRO || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Nomor PO:</span>
                    <span className="text-neutral-200">{bkkItem.poNumber || '-'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Material:</span>
                  <span className="text-neutral-300 font-bold uppercase">
                    {bkkItem.material || 'SIRTU'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle & Status Audit */}
            <div className="bg-[#181B1E] p-3.5 rounded-xl border border-[#262A2F] space-y-2">
              <div className="flex items-center justify-between border-b border-[#262A2F] pb-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Status & Otorisasi
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
                  <span className="text-[10px] text-neutral-500 block">Dibuat Oleh:</span>
                  <span className="text-neutral-300 font-medium">
                    {bkkItem.createdBy || 'Admin'}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    {bkkItem.timestamp || bkkItem.tanggal || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 block">Disetujui Oleh:</span>
                  <span className="text-neutral-300 font-medium">
                    {bkkItem.approvedBy || '-'}
                  </span>
                  {bkkItem.approvedAt && (
                    <span className="text-[10px] text-neutral-500 block">
                      {formatDate(bkkItem.approvedAt)}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 block">Diverifikasi Oleh:</span>
                  <span className="text-emerald-400 font-medium">
                    {latestDocument?.verifiedBy || (isPaid ? 'Super Admin' : '-')}
                  </span>
                  {latestDocument?.verifiedAt && (
                    <span className="text-[10px] text-neutral-500 block">
                      {formatDate(latestDocument.verifiedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: DOKUMEN FISIK BERTANDA TANGAN
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'document' && (
          <div className="space-y-4">
            {/* Notice Banners */}
            {isPendingApproval && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3">
                <Lock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">BKK Belum Disetujui Super Admin</div>
                  <p className="text-neutral-300">
                    Sesuai alur resmi PT BAS, dokumen kas keluar fisik baru dapat dicetak dan
                    ditandatangani setelah BKK disetujui secara administratif oleh Super Admin.
                  </p>
                </div>
              </div>
            )}

            {isRevisionRequired && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="font-bold text-sm">Dokumen Memerlukan Revisi Tanda Tangan</div>
                  <div className="bg-[#14171A] p-2.5 rounded-lg border border-rose-500/30 mt-1">
                    <span className="text-[10px] uppercase font-mono text-rose-400 block font-bold">
                      Catatan Penolakan Super Admin:
                    </span>
                    <p className="text-white font-medium mt-0.5">
                      {latestDocument?.rejectionReason || 'Tanda tangan belum lengkap atau tidak jelas.'}
                    </p>
                  </div>
                  <p className="text-neutral-300 text-[11px] pt-1">
                    Silakan pastikan 5 tanda tangan fisik lengkap (PEMBUKUAN, MENGETAHUI,
                    MENYETUJUI, KASIR, PENERIMA), lalu unggah berkas fisik perbaikan di bawah ini.
                  </p>
                </div>
              </div>
            )}

            {isPendingVerification && (
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-[#2D3339] text-neutral-300 text-xs flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 text-[#F4511E] mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Dokumen Sedang Ditinjau Super Admin</div>
                  <p className="text-neutral-400">
                    Berkas telah diajukan dan terkunci. Menunggu verifikasi keabsahan 5 tanda
                    tangan fisik oleh Super Admin untuk finalisasi pelunasan kas keluar.
                  </p>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Dokumen Fisik Telah Diverifikasi Sah & Selesai</div>
                  <p className="text-neutral-300">
                    Super Admin telah memverifikasi seluruh tanda tangan fisik. Status BKK resmi{' '}
                    <strong className="text-emerald-400 font-bold">LUNAS</strong> dan seluruh rincian
                    transaksi terkunci permanen.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Box (When Admin can upload) */}
            {(isApproved || isRevisionRequired) && (
              <div className="bg-[#181B1E] border border-[#262A30] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {isRevisionRequired
                      ? 'Unggah Berkas Revisi (Versi Baru)'
                      : 'Unggah Berkas Fisik Bertanda Tangan'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Format: PDF, PNG, JPG (Maks 25MB)
                  </span>
                </div>

                {/* Dropzone / File Picker */}
                <div className="border-2 border-dashed border-[#343A44] hover:border-[#F4511E]/70 rounded-xl p-5 text-center transition-colors">
                  <input
                    type="file"
                    id="bkk-file-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="bkk-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#202428] text-neutral-300 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-[#F4511E]" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          {selectedFile.name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk ganti berkas
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-semibold text-white">
                          Pilih berkas scan / foto dokumen fisik
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          Klik untuk menelusuri dari komputer Anda
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                    Catatan Unggahan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Contoh: Dokumen lengkap telah ditandatangani 5 pihak di kantor Gresik..."
                    className="w-full bg-[#14171A] border border-[#282D34] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                {/* Action Submit Button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Upload}
                    disabled={!selectedFile || isUploading}
                    onClick={() => handleUploadAndSubmit(true)}
                    className="bg-[#F4511E] hover:bg-[#E04418] text-white font-bold"
                  >
                    {isUploading ? 'Mengunggah & Mengajukan...' : 'Unggah & Ajukan Verifikasi ke Super Admin'}
                  </Button>
                </div>
              </div>
            )}

            {/* Currently Submitted / Verified Document Display */}
            {latestDocument && (
              <div className="bg-[#181B1E] border border-[#262A30] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#24282E] pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#F4511E]" />
                    <span className="text-xs font-mono font-bold text-white">
                      Berkas Aktif: Versi {latestDocument.version} ({latestDocument.originalName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        latestDocument.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : latestDocument.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-[#F4511E]/20 text-[#F4511E] border border-[#F4511E]/40'
                      }`}
                    >
                      {latestDocument.status === 'VERIFIED'
                        ? 'TERVERIFIKASI SAH'
                        : latestDocument.status === 'REJECTED'
                        ? 'DITOLAK / REVISI'
                        : 'MENUNGGU VERIFIKASI'}
                    </span>
                    <a
                      href={`/api/bkk/documents/file/${latestDocument.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#202428] hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Buka di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-400">
                  <div>
                    <span className="block text-[9px] uppercase text-neutral-500">Ukuran:</span>
                    <span className="text-neutral-200">
                      {(latestDocument.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-neutral-500">Tipe Berkas:</span>
                    <span className="text-neutral-200">{latestDocument.fileType || 'PDF/Image'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-neutral-500">Diunggah Oleh:</span>
                    <span className="text-neutral-200">{latestDocument.uploadedBy}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-neutral-500">Waktu Unggah:</span>
                    <span className="text-neutral-200">{formatDate(latestDocument.uploadedAt)}</span>
                  </div>
                </div>

                {latestDocument.notes && (
                  <div className="p-2 rounded bg-[#14171A] border border-[#24282E] text-xs text-neutral-300">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">Catatan Pengunggah:</span>
                    {latestDocument.notes}
                  </div>
                )}

                {/* Embedded Viewer (PDF / Image) */}
                <div className="border border-[#2A2E35] rounded-xl overflow-hidden bg-[#111315] min-h-[360px] max-h-[500px] flex items-center justify-center">
                  {latestDocument.fileType?.includes('pdf') || latestDocument.originalName?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={`/api/bkk/documents/file/${latestDocument.id}#toolbar=0`}
                      title="Preview Dokumen Bertanda Tangan"
                      className="w-full h-[450px] border-0"
                    />
                  ) : (
                    <div className="p-3 text-center">
                      <img
                        src={`/api/bkk/documents/file/${latestDocument.id}`}
                        alt="Preview Dokumen Bertanda Tangan"
                        className="max-h-[420px] max-w-full mx-auto object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* ── SUPERADMIN VERIFICATION DECISION PANEL (Inline, No Nested Modal) ── */}
                {isSuperAdmin && isPendingVerification && (
                  <div className="p-4 rounded-xl bg-[#14171A] border border-[#F4511E]/40 space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#F4511E]" />
                        <div>
                          <h4 className="text-xs font-bold text-white font-mono uppercase">
                            Panel Otorisasi Direksi (Super Admin)
                          </h4>
                          <p className="text-[11px] text-neutral-400">
                            Periksa kelengkapan 5 tanda tangan fisik pada dokumen di atas.
                          </p>
                        </div>
                      </div>
                    </div>

                    {showRejectBox ? (
                      <div className="p-3 bg-[#181B1E] border border-rose-500/40 rounded-xl space-y-2.5">
                        <label className="text-xs font-bold text-rose-300 block">
                          Alasan Penolakan / Permintaan Revisi Dokumen:
                        </label>
                        <textarea
                          rows={2}
                          value={verificationRejectReason}
                          onChange={(e) => setVerificationRejectReason(e.target.value)}
                          placeholder="Contoh: Tanda tangan Kasir dan Penerima belum ada, stempel basah belum terbaca jelas..."
                          className="w-full bg-[#14171A] border border-[#282D34] rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="xs" variant="ghost" onClick={() => setShowRejectBox(false)}>
                            Batal
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            icon={XCircle}
                            disabled={isVerifying || !verificationRejectReason.trim()}
                            onClick={handleRejectVerification}
                          >
                            {isVerifying ? 'Memproses...' : 'Kirim Penolakan & Minta Revisi'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262A30]">
                        <Button
                          size="sm"
                          variant="danger"
                          icon={XCircle}
                          disabled={isVerifying}
                          onClick={() => setShowRejectBox(true)}
                        >
                          Tolak / Minta Revisi
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={CheckCircle2}
                          disabled={isVerifying}
                          onClick={handleApproveVerification}
                          className="bg-[#F4511E] hover:bg-[#E04418] text-white font-bold"
                        >
                          {isVerifying ? 'Memproses...' : 'Setujui Verifikasi & Tandai LUNAS'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: RIWAYAT VERSI DOKUMEN
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="space-y-3 font-mono text-xs">
            {loadingDocs ? (
              <div className="p-8 text-center text-neutral-500">Memuat riwayat berkas...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center bg-[#14171A] border border-[#24282E] rounded-xl text-neutral-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-neutral-500" />
                <p>Belum ada berkas fisik yang diunggah untuk BKK ini.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-[#181B1E] border border-[#262A30] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-bold text-[10px]">
                          Versi {doc.version}
                        </span>
                        <span className="font-bold text-white text-xs">{doc.originalName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-[#F4511E]/20 text-[#F4511E]'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                        <span>Oleh: <strong className="text-neutral-200">{doc.uploadedBy}</strong></span>
                        <span>&bull;</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        <span>&bull;</span>
                        <span>{(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      {doc.rejectionReason && (
                        <div className="mt-1 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          <strong>Alasan Ditolak:</strong> {doc.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/bkk/documents/file/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#202428] hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Berkas</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: JEJAK AUDIT LENGKAP (Robust error handling & safe details rendering)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-3 font-mono text-xs">
            {loadingAudit ? (
              <div className="p-8 text-center text-neutral-500">Memuat jejak audit...</div>
            ) : (!Array.isArray(auditLogs) || auditLogs.length === 0) ? (
              <div className="p-8 text-center bg-[#14171A] border border-[#24282E] rounded-xl text-neutral-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-neutral-500" />
                <p>Belum ada rekaman audit trail untuk BKK ini.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#282D35]">
                {auditLogs.map((log) => {
                  let badgeColor = 'bg-neutral-800 text-neutral-300 border-neutral-700';
                  let icon = <Info className="w-3.5 h-3.5" />;

                  if (log.action === 'BKK_CREATED') {
                    badgeColor = 'bg-[#F4511E]/20 text-[#F4511E] border-[#F4511E]/40';
                    icon = <FileText className="w-3.5 h-3.5 text-[#F4511E]" />;
                  } else if (log.action === 'BKK_APPROVED') {
                    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                  } else if (log.action === 'DOCUMENT_PRINTED') {
                    badgeColor = 'bg-neutral-800 text-neutral-200 border-neutral-600';
                    icon = <Printer className="w-3.5 h-3.5 text-neutral-300" />;
                  } else if (log.action === 'DOCUMENT_UPLOADED' || log.action === 'REVISED_DOCUMENT_UPLOADED') {
                    badgeColor = 'bg-[#F4511E]/20 text-[#F4511E] border-[#F4511E]/40';
                    icon = <Upload className="w-3.5 h-3.5 text-[#F4511E]" />;
                  } else if (log.action === 'DOCUMENT_SUBMITTED') {
                    badgeColor = 'bg-neutral-800 text-neutral-200 border-neutral-600';
                    icon = <Lock className="w-3.5 h-3.5 text-neutral-300" />;
                  } else if (log.action === 'VERIFICATION_APPROVED' || log.action === 'CASHOUT_FINALIZED') {
                    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
                  } else if (log.action === 'VERIFICATION_REJECTED' || log.action === 'BKK_REJECTED') {
                    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
                  }

                  return (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#181B1E] border border-[#3A404A] flex items-center justify-center text-neutral-300">
                        {icon}
                      </div>

                      <div className="p-3 rounded-xl bg-[#181B1E] border border-[#262A30] space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {log.timestamp ? formatDate(log.timestamp) : '-'}
                          </span>
                        </div>

                        <div className="text-xs text-white">
                          Oleh: <strong className="text-neutral-200">{log.actorName || 'Sistem'}</strong>{' '}
                          <span className="text-[10px] text-neutral-400">({log.actorRole || 'System'})</span>
                        </div>

                        {log.details != null && (
                          <div className="text-[11px] text-neutral-300 font-sans mt-1 bg-[#14171A] p-2 rounded-lg border border-[#24282E]">
                            {typeof log.details === 'string' ? (
                              <span>{log.details}</span>
                            ) : typeof log.details === 'object' ? (
                              <div className="space-y-0.5 font-mono text-[10px]">
                                {Object.entries(log.details).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-neutral-500 uppercase">{k}:</span>
                                    <span className="text-neutral-200">
                                      {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>{String(log.details)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BOTTOM CONTROLS
           ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pt-3 border-t border-[#24282E] gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPrintModal && onOpenPrintModal(bkkItem)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#181B1E] hover:bg-neutral-800 border border-[#2B3037] text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2 group text-xs font-mono"
              title="Cetak Dokumen Fisik A4"
            >
              <Printer className="w-4 h-4 text-[#F4511E]" />
              <span className="hidden sm:inline">Cetak Dokumen Fisik</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
