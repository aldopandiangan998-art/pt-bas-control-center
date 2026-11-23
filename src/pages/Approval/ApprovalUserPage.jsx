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
  MinusSquare,
  Mail,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { Button, Badge, Card, Modal, IndeterminateCheckbox } from '../../components/ui';

export default function ApprovalUserPage() {
  const navigate = useNavigate();
  const { isDark } = useApp();
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
    } catch (e) { }
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
        addToast(`Akun Admin ${user.name} resmi disetujui & aktif!`, 'success');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      } else {
        addToast(res?.message || 'Gagal menyetujui akun.', 'error');
      }
    } catch (err) {
      addToast('Terjadi kendala saat menyetujui akun.', 'error');
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
    if (!rejectModalData || !rejectionReason.trim()) return;
    setIsSubmittingReject(true);
    try {
      const res = await deleteUser(rejectModalData.id);
      if (res?.success) {
        addToast(`Permohonan pendaftaran akun ${rejectModalData.name} resmi ditolak. Alasan: "${rejectionReason.trim()}"`, 'info');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(rejectModalData.id);
          return next;
        });
        setRejectModalData(null);
        setRejectionReason('');
      } else {
        addToast(res?.message || 'Gagal menolak akun.', 'error');
      }
    } catch (err) {
      addToast('Terjadi kendala saat menolak pendaftaran.', 'error');
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
    addToast(`${successCount} akun Admin berhasil disetujui sekaligus!`, 'success');
  };

  // Handle batch reject
  const handleConfirmBatchReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || isBatchSubmitting || !batchRejectionReason.trim()) return;

    setIsBatchSubmitting(true);
    try {
      let count = 0;
      for (const id of ids) {
        const res = await deleteUser(id);
        if (res?.success) count++;
      }
      setSelectedIds(new Set());
      setBatchRejectModalOpen(false);
      setBatchRejectionReason('');
      addToast(`${count} permohonan pendaftaran Admin berhasil ditolak. Alasan: "${batchRejectionReason.trim()}"`, 'info');
    } catch (err) {
      addToast('Gagal memproses penolakan massal.', 'error');
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
      addToast('Data permohonan registrasi berhasil diperbarui.', 'info');
    }, 400);
  };

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
            title="Kembali ke Data Pengguna"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-md bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <UserCheck className="w-4 h-4" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Approval Registrasi Admin
              </h1>
              <Badge variant="warning" dot>
                Otoritas Super Admin
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pusat otorisasi & verifikasi pendaftaran akun Admin baru sebelum diberikan akses operasional sistem.
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
            title="Perbarui Data"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Users}
            onClick={() => navigate('/master-data?tab=pengguna')}
          >
            Data Pengguna &rarr;
          </Button>
        </div>
      </div>

      {/* ══════════ EXECUTIVE KPI METRIC CARDS ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Menunggu Persetujuan */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Menunggu Approval
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
              {metrics.pending > 0 ? `${metrics.pending} akun tertahan` : 'antrean bersih'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.pending > 0
              ? `${metrics.pending} permohonan pendaftaran menunggu verifikasi Super Admin`
              : 'Semua permohonan registrasi telah selesai diverifikasi'}
          </p>
        </Card>

        {/* KPI 2: Admin Aktif */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Admin Disetujui
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
              {metrics.total > 0 ? `${metrics.approvalRate}% aktif` : 'aktif'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.total > 0
              ? `${metrics.approved} dari ${metrics.total} akun admin telah aktif beroperasi`
              : 'Belum ada akun admin yang terdaftar'}
          </p>
        </Card>

        {/* KPI 3: Total Registrasi Akun */}
        <Card className="p-4 bg-[#14171A] border border-[#22262A] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Total Pengajuan
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
              {branchOptions.length > 0 ? `${branchOptions.length} cabang / hub` : 'total pendaftar'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {metrics.total > 0
              ? `${metrics.approved} Disetujui • ${metrics.pending} Menunggu Approval`
              : 'Belum ada riwayat pendaftaran akun baru'}
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
              otoritas direksi
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {currentUser?.name
              ? `${currentUser.name} (${currentUser.branch || 'Pusat & Hub Gresik'})`
              : 'Pemegang hak verifikasi & approval tunggal'}
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
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-neutral-400 hover:text-white'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Approval ({metrics.pending})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'approved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'text-neutral-400 hover:text-white'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Disetujui ({metrics.approved})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'all'
              ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40 shadow-xs'
              : 'text-neutral-400 hover:text-white'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Semua Registrasi ({metrics.total})</span>
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
              placeholder="Cari nama, email, telepon, atau cabang..."
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
              <option value="ALL">Semua Cabang</option>
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-[#F4511E] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              title="Tampilan Grid / Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-[#F4511E] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              title="Tampilan Tabel / List"
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
            <span>akun pendaftar dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Setujui Semua Terpilih ({selectedIds.size})
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
              Tolak Terpilih ({selectedIds.size})
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Batal
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
              ? 'Tidak Ada Pendaftaran Menunggu Approval'
              : 'Tidak Ada Data Pendaftaran'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'Seluruh permohonan pendaftaran akun Admin baru telah diproses atau belum ada akun yang mendaftar.'
              : 'Tidak ada data akun yang sesuai dengan kriteria filter atau pencarian Anda.'}
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
                ) : filteredUsers.some((u) => selectedIds.has(u.id)) ? (
                  <MinusSquare className="w-4 h-4 text-[#F4511E]" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-500" />
                )}
                <span>Pilih Semua di Halaman Ini</span>
              </button>
            </div>
            <div>Menampilkan {filteredUsers.length} akun</div>
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
                    className={`p-4 transition-all relative overflow-hidden flex flex-col justify-between ${isPending
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
                          {isPending ? 'Menunggu Approval' : 'Aktif'}
                        </Badge>
                      </div>

                      {/* Metadata Details Grid */}
                      <div className="space-y-1.5 text-xs text-neutral-300 bg-black/25 rounded-xl p-3 border border-white/5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Role:
                          </span>
                          <span className="font-bold text-white">{user.roleLabel || user.role}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Penempatan:
                          </span>
                          <span>{user.branch || 'Hub Gresik'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Telepon:
                          </span>
                          <span>{user.phone || '-'}</span>
                        </div>

                        {(user.gender || user.birth_date) && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> Profil:
                            </span>
                            <span>
                              {[user.gender, user.birth_date ? `Lahir: ${user.birth_date}` : null]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Terdaftar:
                          </span>
                          <span>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleString('id-ID', {
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
                            Tolak
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={CheckCircle2}
                            onClick={() => handleApprove(user)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            Setujui Akun
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Akun Terverifikasi
                          </span>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={async () => {
                              const res = await toggleUserStatus(user.id);
                              if (res?.success) {
                                addToast(`Status akun ${user.name} berhasil diubah.`, 'info');
                              }
                            }}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            Nonaktifkan
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
                      <div className="flex items-center justify-center">
                        <IndeterminateCheckbox
                          checked={
                            filteredUsers.length > 0 &&
                            filteredUsers.every((u) => selectedIds.has(u.id))
                          }
                          indeterminate={
                            filteredUsers.some((u) => selectedIds.has(u.id)) &&
                            !filteredUsers.every((u) => selectedIds.has(u.id))
                          }
                          onChange={handleSelectAllPending}
                          title="Pilih semua di halaman ini"
                        />
                      </div>
                    </th>
                    <th className="py-3 px-4 min-w-[200px]">Nama & Email</th>
                    <th className="py-3 px-3 min-w-[130px]">Role / Jabatan</th>
                    <th className="py-3 px-3 min-w-[120px]">Penempatan</th>
                    <th className="py-3 px-3 min-w-[120px]">No. Telepon</th>
                    <th className="py-3 px-3 min-w-[130px]">Profil</th>
                    <th className="py-3 px-3 min-w-[140px]">Tgl Pendaftaran</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Status</th>
                    <th className="py-3 px-4 text-center min-w-[160px]">Aksi Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262A]">
                  {filteredUsers.map((user, idx) => {
                    const isPending = !user.aktif || user.aktif === 0;
                    const isSelected = selectedIds.has(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${isSelected
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
                          {[user.gender, user.birth_date ? `Lahir: ${user.birth_date}` : null]
                            .filter(Boolean)
                            .join(' • ') || '-'}
                        </td>

                        {/* Registered Date */}
                        <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                            : 'Gresik Hub'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <Badge size="xs" variant={isPending ? 'warning' : 'success'} dot={isPending}>
                            {isPending ? 'Menunggu Approval' : 'Aktif'}
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
                                  title="Setujui pendaftaran akun"
                                >
                                  Setujui
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  icon={XCircle}
                                  onClick={() => handleOpenRejectModal(user)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                                  title="Tolak pendaftaran akun"
                                >
                                  Tolak
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={async () => {
                                  const res = await toggleUserStatus(user.id);
                                  if (res?.success) {
                                    addToast(`Status akun ${user.name} berhasil diubah.`, 'info');
                                  }
                                }}
                                className="text-xs text-neutral-400 hover:text-white"
                                title="Ubah status aktif akun"
                              >
                                Nonaktifkan
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
                  <h3 className="font-bold text-white text-base">Tolak Pendaftaran Akun</h3>
                  <p className="text-xs text-neutral-400">Verifikasi penolakan akses Super Admin</p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                Apakah Anda yakin ingin menolak permohonan pendaftaran untuk{' '}
                <strong className="text-white">{rejectModalData.name}</strong> ({rejectModalData.email})? Akun
                ini akan dihapus dari antrean registrasi.
              </p>

              {/* Alasan Penolakan (Wajib Ditulis Manual - Tanpa Pilihan Opsi) */}
              <div className="space-y-1.5 mb-4">
                <label className="block text-xs font-semibold text-neutral-300">
                  Alasan Penolakan <span className="text-rose-400 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan pendaftaran akun di sini..."
                  className="w-full text-xs font-mono p-3 rounded-xl bg-[#181B1E] border border-[#2B3138] text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition-colors"
                />
                <p className="text-[10px] text-neutral-400 font-mono">
                  Wajib menuliskan alasan penolakan akun ini secara manual.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23272D]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRejectModalData(null)}
                  disabled={isSubmittingReject}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={XCircle}
                  onClick={handleConfirmReject}
                  loading={isSubmittingReject}
                  disabled={isSubmittingReject || !rejectionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Konfirmasi Tolak
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
                  <h3 className="font-bold text-white text-base">Tolak Pendaftaran Massal</h3>
                  <p className="text-xs text-neutral-400">
                    {selectedIds.size} akun pendaftar terpilih
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                Apakah Anda yakin ingin menolak{' '}
                <strong className="text-white">{selectedIds.size} permohonan pendaftaran</strong> sekaligus?
                Tindakan ini tidak dapat dibatalkan.
              </p>

              {/* Alasan Penolakan Massal (Wajib Ditulis Manual - Tanpa Pilihan Opsi) */}
              <div className="space-y-1.5 mb-4">
                <label className="block text-xs font-semibold text-neutral-300">
                  Alasan Penolakan Massal <span className="text-rose-400 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  value={batchRejectionReason}
                  onChange={(e) => setBatchRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan seluruh pendaftaran terpilih di sini..."
                  className="w-full text-xs font-mono p-3 rounded-xl bg-[#181B1E] border border-[#2B3138] text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition-colors"
                />
                <p className="text-[10px] text-neutral-400 font-mono">
                  Wajib menuliskan alasan penolakan untuk seluruh akun terpilih.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23272D]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBatchRejectModalOpen(false)}
                  disabled={isBatchSubmitting}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={XCircle}
                  onClick={handleConfirmBatchReject}
                  loading={isBatchSubmitting}
                  disabled={isBatchSubmitting || !batchRejectionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tolak {selectedIds.size} Akun
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
