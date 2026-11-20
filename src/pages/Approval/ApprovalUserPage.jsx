import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Clock,
  Users,
  User,
  Phone,
  Calendar,
  MapPin,
  RefreshCw,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  X,
  CheckSquare,
  Square,
  Mail,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { Button, Badge, Card, Modal } from '../../components/ui';

export default function ApprovalUserPage() {
  const navigate = useNavigate();
  const { isDark, language } = useApp();
  const { users, currentUser, isSuperAdmin, approveUser, deleteUser, toggleUserStatus, refreshUsers } = useAuth();
  const { addToast } = useToast();

  // Navigation & Filter Tabs: 'pending' | 'approved' | 'all'
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ptbas_approval_user_viewmode') || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ptbas_approval_user_viewmode', mode);
    } catch (e) {}
  };

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal States
  const [rejectModalData, setRejectModalData] = useState(null); // { id, name, email }
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [batchRejectModalOpen, setBatchRejectModalOpen] = useState(false);
  const [batchRejectionReason, setBatchRejectionReason] = useState('');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const [approveConfirmData, setApproveConfirmData] = useState(null); // { id, name }
  const [isApproving, setIsApproving] = useState(false);

  // Non-superadmin accounts (registrations to be approved/managed)
  const nonSuperAdminUsers = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u.role !== 'superadmin' &&
        u.roleLabel !== 'Super Admin' &&
        u.id !== 'usr-1' &&
        u.email?.toLowerCase() !== 'superadmin@ptbas.co.id'
    );
  }, [users]);

  // Metric counts
  const metrics = useMemo(() => {
    const pendingList = nonSuperAdminUsers.filter((u) => !u.aktif || u.aktif === 0);
    const approvedList = nonSuperAdminUsers.filter((u) => u.aktif === 1 || u.aktif === true);
    const superAdminCount = (users || []).filter(
      (u) => u.role === 'superadmin' || u.roleLabel === 'Super Admin' || u.id === 'usr-1'
    ).length;

    const approvalRate = nonSuperAdminUsers.length > 0
      ? Math.round((approvedList.length / nonSuperAdminUsers.length) * 100)
      : 100;

    return {
      pending: pendingList.length,
      approved: approvedList.length,
      total: nonSuperAdminUsers.length,
      superAdminCount,
      approvalRate,
    };
  }, [nonSuperAdminUsers, users]);

  // Unique branches for filter dropdown
  const branchOptions = useMemo(() => {
    const set = new Set();
    nonSuperAdminUsers.forEach((u) => {
      if (u.branch) set.add(u.branch);
    });
    return Array.from(set);
  }, [nonSuperAdminUsers]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return nonSuperAdminUsers.filter((u) => {
      const isUserPending = !u.aktif || u.aktif === 0;

      // Tab filter
      if (activeTab === 'pending' && !isUserPending) return false;
      if (activeTab === 'approved' && isUserPending) return false;

      // Branch filter
      if (branchFilter !== 'ALL' && u.branch !== branchFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const branch = (u.branch || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !branch.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [nonSuperAdminUsers, activeTab, branchFilter, searchQuery]);

  // Batch selection handlers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredUsers
      .filter((u) => !u.aktif || u.aktif === 0)
      .map((u) => u.id);

    if (pendingIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  // Handle single approval
  const handleApprove = async (user) => {
    setIsApproving(true);
    try {
      const res = await approveUser(user.id);
      if (res?.success) {
        addToast(language === 'en' ? `Admin account ${user.name} officially approved & active!` : `Akun Admin ${user.name} resmi disetujui & aktif!`, 'success');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      } else {
        addToast(res?.message || (language === 'en' ? 'Failed to approve account.' : 'Gagal menyetujui akun.'), 'error');
      }
    } catch (err) {
      addToast(language === 'en' ? 'Error approving account.' : 'Terjadi kendala saat menyetujui akun.', 'error');
    } finally {
      setIsApproving(false);
      setApproveConfirmData(null);
    }
  };

  // Handle single reject
  const handleOpenRejectModal = (user) => {
    setRejectModalData(user);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    setIsSubmittingReject(true);
    try {
      const res = await deleteUser(rejectModalData.id);
      if (res?.success) {
        addToast(language === 'en' ? `Registration application for ${rejectModalData.name} officially rejected.` : `Permohonan pendaftaran akun ${rejectModalData.name} resmi ditolak.`, 'info');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(rejectModalData.id);
          return next;
        });
        setRejectModalData(null);
      } else {
        addToast(res?.message || (language === 'en' ? 'Failed to reject account.' : 'Gagal menolak akun.'), 'error');
      }
    } catch (err) {
      addToast(language === 'en' ? 'Error rejecting registration.' : 'Terjadi kendala saat menolak pendaftaran.', 'error');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Handle batch approve
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    let successCount = 0;
    for (const id of ids) {
      const res = await approveUser(id);
      if (res?.success) successCount++;
    }

    setSelectedIds(new Set());
    addToast(language === 'en' ? `${successCount} Admin accounts approved at once!` : `${successCount} akun Admin berhasil disetujui sekaligus!`, 'success');
  };

  // Handle batch reject
  const handleConfirmBatchReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || isBatchSubmitting) return;

    setIsBatchSubmitting(true);
    try {
      let count = 0;
      for (const id of ids) {
        const res = await deleteUser(id);
        if (res?.success) count++;
      }
      setSelectedIds(new Set());
      setBatchRejectModalOpen(false);
      addToast(language === 'en' ? `${count} Admin registration requests successfully rejected.` : `${count} permohonan pendaftaran Admin berhasil ditolak.`, 'info');
    } catch (err) {
      addToast(language === 'en' ? 'Failed to process bulk rejection.' : 'Gagal memproses penolakan massal.', 'error');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (typeof refreshUsers === 'function') {
      await refreshUsers();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      addToast(language === 'en' ? 'Registration request data refreshed successfully.' : 'Data permohonan registrasi berhasil diperbarui.', 'info');
    }, 400);
  };

  // Quick rejection reasons chips
  const quickReasons = [
    'Data identitas atau kontak karyawan tidak valid',
    'Bukan personil operasional resmi PT Berkah Alam Semesta',
    'Alamat email tidak terdaftar dalam database HRD site',
    'Permohonan duplikat dengan akun yang sudah ada',
  ];

  return (
    <div className="w-full space-y-6 pb-20 font-sans">
      {/* ══════════ TOP HEADER BAR ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#22262A]">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/master-data?tab=pengguna')}
            title={language === 'en' ? 'Back to User Data' : 'Kembali ke Data Pengguna'}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-md bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <UserCheck className="w-4 h-4" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {language === 'en' ? 'Admin Registration Approval' : 'Persetujuan Registrasi Admin'}
              </h1>
              <Badge variant="warning" dot>
                {language === 'en' ? 'Super Admin Authority' : 'Otoritas Super Admin'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {language === 'en'
                ? 'Central hub for authorizing & verifying new Admin account registrations before operational system access is granted.'
                : 'Pusat otorisasi & verifikasi pendaftaran akun Admin baru sebelum diberikan akses operasional sistem.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={RefreshCw}
            onClick={handleRefresh}
            className={isRefreshing ? 'animate-spin' : ''}
            title={language === 'en' ? 'Refresh Data' : 'Perbarui Data'}
          >
            {language === 'en' ? 'Refresh' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Users}
            onClick={() => navigate('/master-data?tab=pengguna')}
          >
            {language === 'en' ? 'User Data →' : 'Data Pengguna →'}
          </Button>
        </div>
      </div>

      {/* ══════════ EXECUTIVE KPI METRIC CARDS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Menunggu Persetujuan */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              {language === 'en' ? 'Pending Approval' : 'Menunggu Persetujuan'}
            </span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {metrics.pending}
            </span>
            <span className={`text-xs font-medium ${metrics.pending > 0 ? 'text-amber-300' : 'text-neutral-400'}`}>
              {metrics.pending > 0
                ? (language === 'en' ? `${metrics.pending} on hold` : `${metrics.pending} akun tertahan`)
                : (language === 'en' ? 'queue clear' : 'antrean bersih')}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.pending > 0
              ? (language === 'en'
                  ? `${metrics.pending} registration requests awaiting Super Admin verification`
                  : `${metrics.pending} permohonan pendaftaran menunggu verifikasi Super Admin`)
              : (language === 'en'
                  ? 'All registration applications have been verified'
                  : 'Semua permohonan registrasi telah selesai diverifikasi')}
          </p>
        </Card>

        {/* KPI 2: Admin Aktif */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              {language === 'en' ? 'Approved Admins' : 'Admin Disetujui'}
            </span>
            <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {metrics.approved}
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              {metrics.total > 0
                ? `${metrics.approvalRate}% ${language === 'en' ? 'active' : 'aktif'}`
                : (language === 'en' ? 'active' : 'aktif')}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.total > 0
              ? (language === 'en'
                  ? `${metrics.approved} of ${metrics.total} admin accounts are actively operating`
                  : `${metrics.approved} dari ${metrics.total} akun admin telah aktif beroperasi`)
              : (language === 'en' ? 'No admin accounts registered yet' : 'Belum ada akun admin yang terdaftar')}
          </p>
        </Card>

        {/* KPI 3: Total Registrasi Akun */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              {language === 'en' ? 'Total Applications' : 'Total Pengajuan'}
            </span>
            <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {metrics.total}
            </span>
            <span className="text-xs text-blue-300 font-medium">
              {branchOptions.length > 0
                ? (language === 'en' ? `${branchOptions.length} branches / hubs` : `${branchOptions.length} cabang / hub`)
                : (language === 'en' ? 'total registrants' : 'total pendaftar')}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.total > 0
              ? (language === 'en'
                  ? `${metrics.approved} Approved • ${metrics.pending} Pending Approval`
                  : `${metrics.approved} Disetujui • ${metrics.pending} Menunggu Persetujuan`)
              : (language === 'en' ? 'No registration history yet' : 'Belum ada riwayat pendaftaran akun baru')}
          </p>
        </Card>

        {/* KPI 4: Super Admin */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Super Admin
            </span>
            <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300 font-mono">
              {metrics.superAdminCount}
            </span>
            <span className="text-xs text-purple-300 font-medium">
              {language === 'en' ? 'executive authority' : 'otoritas direksi'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {currentUser?.name
              ? `${currentUser.name} (${currentUser.branch || (language === 'en' ? 'HQ & Gresik Hub' : 'Pusat & Hub Gresik')})`
              : (language === 'en' ? 'Sole verification & approval authority' : 'Pemegang hak verifikasi & persetujuan tunggal')}
          </p>
        </Card>
      </div>

      {/* ══════════ FILTER & ACTION TOOLBAR ══════════ */}
      <div className="p-3 rounded-xl bg-[#131517] border border-[#24282C] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#1A1D20] p-1 rounded-lg border border-[#292D32] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'en' ? `Pending Approval (${metrics.pending})` : `Menunggu Persetujuan (${metrics.pending})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? `Approved (${metrics.approved})` : `Sudah Disetujui (${metrics.approved})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'en' ? `All Registrations (${metrics.total})` : `Semua Registrasi (${metrics.total})`}</span>
          </button>
        </div>

        {/* Search, Branch Filter & View Toggle */}
        <div className="flex items-center gap-2 flex-1 max-w-xl justify-end">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search name, email, phone, or branch...' : 'Cari nama, email, telepon, atau cabang...'}
              className="w-full pl-9 pr-8 py-1.5 bg-[#181B1E] border border-[#2A2E33] rounded-lg text-xs text-white placeholder:text-neutral-500 outline-none focus:border-[#F4511E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {branchOptions.length > 0 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#181B1E] border border-[#2A2E33] rounded-lg text-xs text-neutral-300 outline-none focus:border-[#F4511E] cursor-pointer"
            >
              <option value="ALL">{language === 'en' ? 'All Branches' : 'Semua Cabang'}</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-[#1A1D20] border border-[#292D32] rounded-lg p-0.5 shrink-0 gap-0.5">
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={language === 'en' ? 'Grid / Cards View' : 'Tampilan Grid / Kartu'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#F4511E] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={language === 'en' ? 'Table / List View' : 'Tampilan Tabel / List'}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ BATCH ACTION TOOLBAR (if selected) ══════════ */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-[#1E252E] border border-[#3A4554] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-2 text-xs text-neutral-200">
            <span className="w-6 h-6 rounded-md bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </span>
            <span>{language === 'en' ? 'registrant accounts selected' : 'akun pendaftar dipilih'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {language === 'en' ? `Approve Selected (${selectedIds.size})` : `Setujui Semua Terpilih (${selectedIds.size})`}
            </Button>
            <Button
              size="xs"
              variant="danger"
              icon={XCircle}
              onClick={() => {
                setBatchRejectModalOpen(true);
                setBatchRejectionReason('');
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {language === 'en' ? `Reject Selected (${selectedIds.size})` : `Tolak Terpilih (${selectedIds.size})`}
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ══════════ REGISTRATION REQUEST LIST / CARDS ══════════ */}
      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center bg-[#131517] border border-[#24282C]">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeTab === 'pending'
              ? (language === 'en' ? 'No Pending Registrations' : 'Tidak Ada Pendaftaran Menunggu Persetujuan')
              : (language === 'en' ? 'No Registration Data' : 'Tidak Ada Data Pendaftaran')}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            {activeTab === 'pending'
              ? (language === 'en'
                  ? 'All Admin account registration requests have been processed or no new accounts have applied yet.'
                  : 'Seluruh permohonan pendaftaran akun Admin baru telah diproses atau belum ada akun yang mendaftar.')
              : (language === 'en'
                  ? 'No accounts match your filter or search criteria.'
                  : 'Tidak ada data akun yang sesuai dengan kriteria filter atau pencarian Anda.')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* List Header with Select All (for pending tab) */}
          <div className="flex items-center justify-between px-2 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllPending}
                className="flex items-center gap-1.5 hover:text-white cursor-pointer select-none"
              >
                {filteredUsers.length > 0 &&
                filteredUsers.every((u) => selectedIds.has(u.id)) ? (
                  <CheckSquare className="w-4 h-4 text-[#F4511E]" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-500" />
                )}
                <span>{language === 'en' ? 'Select All on This Page' : 'Pilih Semua di Halaman Ini'}</span>
              </button>
            </div>
            <div>{language === 'en' ? `Showing ${filteredUsers.length} accounts` : `Menampilkan ${filteredUsers.length} akun`}</div>
          </div>

          {/* View: Grid or List */}
          {viewMode === 'grid' ? (
            /* ── GRID VIEW: MODERN RESPONSIVE CARDS ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredUsers.map((user) => {
                const isPending = !user.aktif || user.aktif === 0;
                const isSelected = selectedIds.has(user.id);

                return (
                  <Card
                    key={user.id}
                    className={`p-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                      isPending
                        ? 'bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-[#14171A] border-[#22262A] hover:border-neutral-600'
                    } ${isSelected ? 'ring-2 ring-[#F4511E]' : ''}`}
                  >
                    {/* Card Top: Checkbox, Avatar, Status */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(user.id)}
                            className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                          />
                          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4511E]/20 to-orange-500/10 border border-[#F4511E]/30 text-[#F4511E] font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm line-clamp-1">{user.name}</div>
                            <div className="text-xs text-neutral-400 font-mono truncate">{user.email}</div>
                          </div>
                        </div>

                        <Badge size="xs" variant={isPending ? 'warning' : 'success'} dot={isPending}>
                          {isPending ? (language === 'en' ? 'Pending Approval' : 'Menunggu Persetujuan') : (language === 'en' ? 'Active' : 'Aktif')}
                        </Badge>
                      </div>

                      {/* Metadata Details Grid */}
                      <div className="space-y-1.5 text-xs text-neutral-300 bg-black/25 rounded-xl p-3 border border-white/5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> {language === 'en' ? 'Role:' : 'Role:'}
                          </span>
                          <span className="font-bold text-white">{user.roleLabel || user.role}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {language === 'en' ? 'Assignment:' : 'Penempatan:'}
                          </span>
                          <span>{user.branch || 'Hub Gresik'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> {language === 'en' ? 'Phone:' : 'Telepon:'}
                          </span>
                          <span>{user.phone || '-'}</span>
                        </div>

                        {(user.gender || user.birth_date) && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> {language === 'en' ? 'Profile:' : 'Profil:'}
                            </span>
                            <span>
                              {[user.gender, user.birth_date ? `${language === 'en' ? 'DOB' : 'Lahir'}: ${user.birth_date}` : null]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {language === 'en' ? 'Registered:' : 'Terdaftar:'}
                          </span>
                          <span>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'Gresik Hub'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#20252B] flex items-center justify-end gap-2">
                      {isPending ? (
                        <>
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={XCircle}
                            onClick={() => handleOpenRejectModal(user)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                          >
                            {language === 'en' ? 'Reject' : 'Tolak'}
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => handleApprove(user)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            {language === 'en' ? 'Approve Account' : 'Setujui Akun'}
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'en' ? 'Account Verified' : 'Akun Terverifikasi'}
                          </span>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={async () => {
                              const res = await toggleUserStatus(user.id);
                              if (res?.success) {
                                addToast(language === 'en' ? `Account status for ${user.name} changed.` : `Status akun ${user.name} berhasil diubah.`, 'info');
                              }
                            }}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            {language === 'en' ? 'Deactivate' : 'Nonaktifkan'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ── LIST VIEW: ENTERPRISE DATA TABLE ── */
            <div className="overflow-x-auto rounded-xl border border-[#22262A] bg-[#14171A] shadow-md">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-[#181B1E] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#22262A]">
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredUsers.length > 0 &&
                          filteredUsers.every((u) => selectedIds.has(u.id))
                        }
                        onChange={handleSelectAllPending}
                        className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                        title={language === 'en' ? 'Select all on this page' : 'Pilih semua di halaman ini'}
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[200px]">{language === 'en' ? 'Name & Email' : 'Nama & Email'}</th>
                    <th className="py-3 px-3 min-w-[130px]">{language === 'en' ? 'Role / Title' : 'Role / Jabatan'}</th>
                    <th className="py-3 px-3 min-w-[120px]">{language === 'en' ? 'Assignment' : 'Penempatan'}</th>
                    <th className="py-3 px-3 min-w-[120px]">{language === 'en' ? 'Phone No.' : 'No. Telepon'}</th>
                    <th className="py-3 px-3 min-w-[130px]">{language === 'en' ? 'Profile' : 'Profil'}</th>
                    <th className="py-3 px-3 min-w-[140px]">{language === 'en' ? 'Registration Date' : 'Tgl Pendaftaran'}</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Status</th>
                    <th className="py-3 px-4 text-center min-w-[160px]">{language === 'en' ? 'Authority Action' : 'Aksi Otoritas'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262A]">
                  {filteredUsers.map((user, idx) => {
                    const isPending = !user.aktif || user.aktif === 0;
                    const isSelected = selectedIds.has(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-[#F4511E]/10'
                            : isPending
                            ? 'bg-amber-950/5 hover:bg-amber-950/15'
                            : idx % 2 === 0
                            ? 'bg-transparent hover:bg-white/[0.02]'
                            : 'bg-[#111315]/50 hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(user.id)}
                            className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                          />
                        </td>

                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F4511E]/20 to-orange-500/10 border border-[#F4511E]/30 text-[#F4511E] font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-2xs">
                              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate" title={user.name}>
                                {user.name}
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono truncate" title={user.email}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-white text-xs">
                            {user.roleLabel || user.role}
                          </span>
                        </td>

                        {/* Branch */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate">{user.branch || 'Hub Gresik'}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 font-mono text-neutral-300">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>

                        {/* Profil */}
                        <td className="py-3 px-3 text-neutral-300 text-[11px]">
                          {[user.gender, user.birth_date ? `${language === 'en' ? 'DOB' : 'Lahir'}: ${user.birth_date}` : null]
                            .filter(Boolean)
                            .join(' • ') || '-'}
                        </td>

                        {/* Registered Date */}
                        <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Gresik Hub'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <Badge size="xs" variant={isPending ? 'warning' : 'success'} dot={isPending}>
                            {isPending ? (language === 'en' ? 'Pending Approval' : 'Menunggu Persetujuan') : (language === 'en' ? 'Active' : 'Aktif')}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPending ? (
                              <>
                                <Button
                                  size="xs"
                                  variant="primary"
                                  icon={CheckCircle2}
                                  onClick={() => handleApprove(user)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                  title={language === 'en' ? 'Approve account registration' : 'Setujui pendaftaran akun'}
                                >
                                  {language === 'en' ? 'Approve' : 'Setujui'}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  icon={XCircle}
                                  onClick={() => handleOpenRejectModal(user)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                                  title={language === 'en' ? 'Reject account registration' : 'Tolak pendaftaran akun'}
                                >
                                  {language === 'en' ? 'Reject' : 'Tolak'}
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={async () => {
                                  const res = await toggleUserStatus(user.id);
                                  if (res?.success) {
                                    addToast(language === 'en' ? `Account status for ${user.name} changed.` : `Status akun ${user.name} berhasil diubah.`, 'info');
                                  }
                                }}
                                className="text-xs text-neutral-400 hover:text-white"
                                title={language === 'en' ? 'Change active status' : 'Ubah status aktif akun'}
                              >
                                {language === 'en' ? 'Deactivate' : 'Nonaktifkan'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ MODAL: TOLAK PENDAFTARAN ══════════ */}
      <AnimatePresence>
        {rejectModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-[#14171A] border border-[#2B3138] p-5 shadow-2xl text-neutral-200"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {language === 'en' ? 'Reject Account Registration' : 'Tolak Pendaftaran Akun'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {language === 'en' ? 'Super Admin rejection verification' : 'Verifikasi penolakan akses Super Admin'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                {language === 'en'
                  ? `Are you sure you want to reject the registration request for ${rejectModalData.name} (${rejectModalData.email})? This account will be removed from the registration queue.`
                  : `Apakah Anda yakin ingin menolak permohonan pendaftaran untuk ${rejectModalData.name} (${rejectModalData.email})? Akun ini akan dihapus dari antrean registrasi.`}
              </p>

              {/* Quick reasons */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[11px] font-mono text-neutral-400">
                  {language === 'en' ? 'Select rejection reason (optional):' : 'Pilih alasan penolakan (opsional):'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        rejectionReason === reason
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-[#1C2025] text-neutral-400 border-neutral-700 hover:text-white'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23272D]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRejectModalData(null)}
                  disabled={isSubmittingReject}
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={XCircle}
                  onClick={handleConfirmReject}
                  loading={isSubmittingReject}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {language === 'en' ? 'Confirm Reject' : 'Konfirmasi Tolak'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL: TOLAK MASSAL ══════════ */}
      <AnimatePresence>
        {batchRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-[#14171A] border border-[#2B3138] p-5 shadow-2xl text-neutral-200"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {language === 'en' ? 'Bulk Reject Registrations' : 'Tolak Pendaftaran Massal'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {language === 'en' ? `${selectedIds.size} registrant accounts selected` : `${selectedIds.size} akun pendaftar terpilih`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                {language === 'en'
                  ? `Are you sure you want to reject ${selectedIds.size} registration requests at once? This action cannot be undone.`
                  : `Apakah Anda yakin ingin menolak ${selectedIds.size} permohonan pendaftaran sekaligus? Tindakan ini tidak dapat dibatalkan.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23272D]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBatchRejectModalOpen(false)}
                  disabled={isBatchSubmitting}
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={XCircle}
                  onClick={handleConfirmBatchReject}
                  loading={isBatchSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  {language === 'en' ? `Reject ${selectedIds.size} Accounts` : `Tolak ${selectedIds.size} Akun`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
