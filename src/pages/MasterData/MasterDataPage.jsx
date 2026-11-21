import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mountain,
  Users,
  HardHat,
  Building2,
  Truck,
  CreditCard,
  Coins,
  Plus,
  Trash2,
  ChevronRight,
  Search,
  User,
  UserPlus,
  UserCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  Hash,
  Phone,
  Landmark,
  Save,
  Calendar,
  Info,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  List,
  Edit2,
  Activity,
  TrendingUp,
  Layers,
  Box,
  Shield,
  MapPin,
  Sparkles,
  Download,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  X,
  Calculator,
  Receipt,
  DollarSign,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatVolume } from '../../utils/formatters';
import { Button, Badge, Card, Input, Select, Modal } from '../../components/ui';

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

function SortHeader({ field, label, currentField, currentOrder, onSort, className = '', align = 'left' }) {
  const isSorted = currentField === field;
  return (
    <th
      className={`p-3 cursor-pointer select-none hover:text-white transition-colors group ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      onClick={() => onSort(field)}
      title={`Urutkan berdasarkan ${label}`}
    >
      <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{label}</span>
        {isSorted ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#FF7043] shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#FF7043] shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-neutral-500 opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
    </th>
  );
}

function MasterEmptyState({ icon: Icon, title, description, searchQuery, statusFilter, onReset, onAdd, entityLabel }) {
  const isFiltered = Boolean(searchQuery || (statusFilter && statusFilter !== 'all'));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-10 sm:p-12 text-center rounded-2xl border border-dashed border-[#1E2938] bg-[#121822]/60 flex flex-col items-center justify-center master-empty-state my-2"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F4511E]/20 to-[#FF8A65]/10 border border-[#F4511E]/30 text-[#F4511E] flex items-center justify-center mb-3.5 shadow-sm">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-white tracking-wide">
        {isFiltered ? 'Tidak Ada Data yang Sesuai' : `Belum Ada Data ${title}`}
      </h3>
      <p className="text-xs text-neutral-400 mt-1 max-w-md leading-relaxed">
        {isFiltered
          ? `Tidak ditemukan hasil yang cocok dengan kata kunci pencarian atau filter status yang dipilih. Silakan periksa kembali kata kunci atau setel ulang filter.`
          : description || `Data ${title.toLowerCase()} belum ditambahkan ke dalam sistem.`}
      </p>
      <div className="flex items-center gap-2 mt-4.5">
        {isFiltered ? (
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Pencarian & Filter</span>
          </button>
        ) : onAdd ? (
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={onAdd}
            className="text-xs bg-[#F4511E] hover:bg-[#D84315] font-medium shadow-xs"
          >
            Tambah {entityLabel || title} Baru
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function MasterDataPage() {
  const { language } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'supplier';

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ptbas_master_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ptbas_master_view_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const {
    currentUser,
    users,
    approveUser,
    toggleUserStatus,
    deleteUser,
    isSuperAdmin,
    adminResetPassword,
    adminUpdateUser,
    adminCreateUser,
  } = useAuth();
  const { addToast } = useToast();

  // Guard: Data Master hanya dapat diakses oleh Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center font-mono space-y-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-md mx-auto">
          <Shield className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-neutral-300">
            Fitur Data Master hanya dapat diakses dan dikelola oleh Super Admin.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-lg bg-[#F4511E] text-white text-xs font-bold cursor-pointer hover:bg-[#D84315] transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const {
    materials,
    suppliers,
    customers,
    armadaList,
    banks,
    bankAccounts,
    currencies,
    usersList,
    toggleMaterialStatus,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    toggleSupplierStatus,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    toggleCustomerStatus,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    toggleArmadaStatus,
    addArmada,
    updateArmada,
    deleteArmada,
    toggleBankStatus,
    addBank,
    updateBank,
    deleteBank,
    toggleBankAccountStatus,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    toggleCurrencyStatus,
    addCurrency,
    updateCurrency,
    deleteCurrency,
  } = useData();

  const currenciesList = currencies || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const setTab = (tabKey) => {
    setSearchParams({ tab: tabKey });
    setSearchQuery('');
    setSelectedIds([]);
  };

  // Form States
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    idProgram: '',
    penerima: '',
    telepon: '',
    pkp: true,
    bank: 'BCA - BANK CENTRAL ASIA',
    noRekening: '',
    rekeningAtasNama: '',
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editSupplierModal, setEditSupplierModal] = useState(false);
  const [editSupplierForm, setEditSupplierForm] = useState({
    id: '',
    name: '',
    idProgram: '',
    penerima: '',
    telepon: '',
    pkp: false,
    bank: 'BCA - BANK CENTRAL ASIA',
    noRekening: '',
    rekeningAtasNama: '',
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    beli: '',
    jual: '',
    coa: '110-90',
    coaPiutang: '112-10',
    coaPendapatan: '410-10',
    category: 'Curah',
    satuan: 'm3',
  });

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editMaterialModal, setEditMaterialModal] = useState(false);
  const [editMaterialForm, setEditMaterialForm] = useState({
    id: '',
    name: '',
    beli: '',
    jual: '',
    coa: '',
    coaPiutang: '',
    coaPendapatan: '',
    aktif: true,
  });

  const [armadaForm, setArmadaForm] = useState({
    nopol: '',
    panjangCm: '',
    lebarCm: '',
    tinggiCm: '',
    aktif: true,
    merk: 'Hino',
    vin: '',
    mesin: '',
    tahun: '',
  });

  const [selectedArmada, setSelectedArmada] = useState(null);
  const [editArmadaModal, setEditArmadaModal] = useState(false);
  const [editArmadaForm, setEditArmadaForm] = useState({
    id: '',
    nopol: '',
    panjangCm: '',
    lebarCm: '',
    tinggiCm: '',
    aktif: true,
    merk: 'Hino',
    vin: '',
    mesin: '',
    tahun: '',
  });

  const [customerForm, setCustomerForm] = useState({
    jenisBadanUsaha: 'PT-Perusahaan Terbatas',
    name: '',
    alias: '',
    alamat: '',
    npwp: '',
    telepon: '',
    kodePrefix: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomerModal, setEditCustomerModal] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({
    id: '',
    jenisBadanUsaha: 'PT-Perusahaan Terbatas',
    name: '',
    alias: '',
    alamat: '',
    npwp: '',
    telepon: '',
    kodePrefix: '',
    aktif: true,
  });

  const [bankForm, setBankForm] = useState({
    namaBank: '',
    namaAlias: '',
    kodeSwift: '',
    kodeBank: '',
  });

  const [selectedBank, setSelectedBank] = useState(null);
  const [editBankModal, setEditBankModal] = useState(false);
  const [editBankForm, setEditBankForm] = useState({
    id: '',
    namaBank: '',
    namaAlias: '',
    kodeSwift: '',
    kodeBank: '',
  });

  const [rekeningForm, setRekeningForm] = useState({
    bank: '',
    jenisRekening: '',
    nomorRekening: '',
    rekeningAtasNama: '',
    namaAlias: '',
    supplierId: '',
  });

  const [selectedRekening, setSelectedRekening] = useState(null);
  const [editRekeningModal, setEditRekeningModal] = useState(false);
  const [editRekeningForm, setEditRekeningForm] = useState({
    id: '',
    bank: '',
    jenisRekening: '',
    nomorRekening: '',
    rekeningAtasNama: '',
    namaAlias: '',
    supplierId: '',
    aktif: true,
  });

  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    isoCode: '',
    name: '',
    englishName: '',
    symbol: '',
    country: '',
    pemisahRibuan: 'Titik (.)',
    pemisahDesimal: 'Koma (,)',
    formatSample: '',
    presisi: '2 Digit Desimal',
    formatPresisi: '24.50 m³',
    pajak: 'Non-PPN / Transaksi Valas',
    deskripsi: '',
    lingkupModul: ['Pre Order Customer', 'Kontrak Vendor Valas'],
  });

  // ==========================================
  // SUPER ADMIN USER MANAGEMENT MODALS STATE
  // ==========================================
  const [userPasswordModal, setUserPasswordModal] = useState({
    open: false,
    user: null,
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    submitting: false,
  });

  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [userEditForm, setUserEditForm] = useState({
    name: '',
    email: '',
    role: 'admin',
    branch: 'Hub Gresik',
    phone: '',
    birth_date: '',
    gender: 'Laki-laki',
    aktif: 1,
  });

  const [addUserModal, setAddUserModal] = useState(false);
  const [userAddForm, setUserAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    branch: 'Hub Gresik',
    phone: '',
    birth_date: '',
    gender: 'Laki-laki',
  });

  // Open Password Modal
  const handleOpenPasswordModal = (targetUser) => {
    setUserPasswordModal({
      open: true,
      user: targetUser,
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      submitting: false,
    });
  };

  const handleSaveUserPassword = async (e) => {
    e.preventDefault();
    if (!userPasswordModal.user) return;

    if (!userPasswordModal.newPassword || userPasswordModal.newPassword.length < 6) {
      addToast('Kata sandi baru minimal 6 karakter.', 'warning');
      return;
    }

    if (userPasswordModal.newPassword !== userPasswordModal.confirmPassword) {
      addToast('Konfirmasi kata sandi tidak cocok. Pastikan kedua input sama.', 'warning');
      return;
    }

    setUserPasswordModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await adminResetPassword(userPasswordModal.user.id, userPasswordModal.newPassword);
      if (res.success) {
        addToast(`Kata sandi akun ${userPasswordModal.user.name} berhasil diperbarui!`, 'success');
        setUserPasswordModal({
          open: false,
          user: null,
          newPassword: '',
          confirmPassword: '',
          showPassword: false,
          submitting: false,
        });
      } else {
        addToast(res.message || 'Gagal mengubah kata sandi.', 'error');
        setUserPasswordModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      addToast('Terjadi kesalahan saat mengubah kata sandi.', 'error');
      setUserPasswordModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Open Edit User Modal
  const handleOpenEditUserModal = (targetUser) => {
    setSelectedUserToEdit(targetUser);
    const cleanBranch = targetUser.branch && !targetUser.branch.includes('Site [') ? targetUser.branch : 'Hub Gresik';
    setUserEditForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      role: targetUser.role === 'superadmin' ? 'superadmin' : 'admin',
      branch: cleanBranch,
      phone: targetUser.phone && targetUser.phone !== '-' ? targetUser.phone : '',
      birth_date: targetUser.birth_date || '',
      gender: targetUser.gender || 'Laki-laki',
      aktif: targetUser.aktif === 1 || targetUser.aktif === true ? 1 : 0,
    });
    setEditUserModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;

    if (!userEditForm.name.trim()) {
      addToast('Nama lengkap wajib diisi.', 'warning');
      return;
    }
    if (!userEditForm.email.trim()) {
      addToast('Email wajib diisi.', 'warning');
      return;
    }

    try {
      const roleLabel = userEditForm.role === 'superadmin' ? 'Super Admin' : 'Admin';
      const res = await adminUpdateUser(selectedUserToEdit.id, {
        name: userEditForm.name.trim(),
        email: userEditForm.email.trim().toLowerCase(),
        role: userEditForm.role,
        roleLabel,
        branch: userEditForm.branch || 'Hub Gresik',
        phone: userEditForm.phone || '-',
        birth_date: userEditForm.birth_date || null,
        gender: userEditForm.gender || 'Laki-laki',
        aktif: userEditForm.aktif,
      });

      if (res?.success) {
        addToast(`Data pengguna ${userEditForm.name} berhasil diperbarui!`, 'success');
        setEditUserModal(false);
        setSelectedUserToEdit(null);
      } else {
        addToast(res?.message || 'Gagal memperbarui data pengguna.', 'error');
      }
    } catch (err) {
      addToast('Terjadi kesalahan saat memperbarui pengguna.', 'error');
    }
  };

  // Add User handler
  const handleSaveAddUser = async (e) => {
    e.preventDefault();
    if (!userAddForm.name.trim()) {
      addToast('Nama lengkap wajib diisi.', 'warning');
      return;
    }
    if (!userAddForm.email.trim()) {
      addToast('Email wajib diisi.', 'warning');
      return;
    }
    if (!userAddForm.password || userAddForm.password.length < 6) {
      addToast('Kata sandi awal minimal 6 karakter.', 'warning');
      return;
    }

    try {
      const roleLabel = userAddForm.role === 'superadmin' ? 'Super Admin' : 'Admin';
      const res = await adminCreateUser({
        name: userAddForm.name.trim(),
        email: userAddForm.email.trim().toLowerCase(),
        password: userAddForm.password,
        role: userAddForm.role,
        roleLabel,
        branch: userAddForm.branch || 'Hub Gresik',
        phone: userAddForm.phone || '-',
        birth_date: userAddForm.birth_date || null,
        gender: userAddForm.gender || 'Laki-laki',
      });

      if (res?.success) {
        addToast(`Pengguna baru ${userAddForm.name} berhasil ditambahkan!`, 'success');
        setAddUserModal(false);
        setUserAddForm({
          name: '',
          email: '',
          password: '',
          role: 'admin',
          branch: 'Hub Gresik',
          phone: '',
          birth_date: '',
          gender: 'Laki-laki',
        });
      } else {
        addToast(res?.message || 'Gagal menambahkan pengguna.', 'error');
      }
    } catch (err) {
      addToast('Terjadi kesalahan saat menambahkan pengguna.', 'error');
    }
  };

  // Dedicated Delete User Modal state (Super Admin)
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleOpenDeleteUser = (user) => {
    if (user.id === 'usr-1' || user.email?.toLowerCase() === 'superadmin@ptbas.co.id') {
      addToast('Akun Super Admin utama (root) diproteksi dan tidak dapat dihapus.', 'warning');
      return;
    }
    if (currentUser && (user.id === currentUser.id || user.email?.toLowerCase() === currentUser.email?.toLowerCase())) {
      addToast('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.', 'warning');
      return;
    }
    setUserToDelete(user);
    setDeleteUserModal(true);
  };

  const handleCloseDeleteUser = () => {
    if (isDeletingUser) return;
    setDeleteUserModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || isDeletingUser) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUser(userToDelete.id);
      if (res?.success) {
        addToast(`Pengguna ${userToDelete.name} (${userToDelete.roleLabel || userToDelete.role}) berhasil dihapus.`, 'success');
        setSelectedIds((prev) => prev.filter((id) => id !== userToDelete.id));
        setDeleteUserModal(false);
        setUserToDelete(null);
      } else {
        addToast(res?.message || 'Gagal menghapus pengguna.', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      addToast('Terjadi kesalahan saat menghapus pengguna.', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: '',       // 'supplier' | 'material' | 'armada' | 'customer' | 'bank' | 'rekening' | 'mata-uang' | 'pengguna'
    id: null,
    label: '',      // nama item untuk ditampilkan di modal
    isBulk: false,
    ids: [],
  });

  const handleAskDelete = (type, id, label) => {
    if (type === 'mata-uang') {
      const targetCurr = (currencies || []).find((c) => c.id === id);
      if (targetCurr?.isBase || targetCurr?.code === 'IDR') {
        addToast('Mata uang basis (IDR) tidak dapat dihapus karena merupakan acuan buku besar.', 'warning');
        return;
      }
    }
    if (type === 'pengguna') {
      const targetUser = (activeUsers || []).find((u) => u.id === id);
      if (targetUser) {
        handleOpenDeleteUser(targetUser);
        return;
      }
    }
    setDeleteConfirm({ open: true, type, id, label, isBulk: false, ids: [] });
  };

  const handleAskBulkDelete = () => {
    if (selectedIds.length === 0) return;

    if (currentTab === 'mata-uang') {
      const selectedCurrs = (currencies || []).filter((c) => selectedIds.includes(c.id));
      const onlyBase = selectedCurrs.length === 1 && (selectedCurrs[0]?.isBase || selectedCurrs[0]?.code === 'IDR');
      if (onlyBase) {
        addToast('Mata uang basis (IDR) tidak dapat dihapus karena merupakan acuan buku besar.', 'warning');
        return;
      }
    }

    if (currentTab === 'pengguna') {
      const hasMainAdmin = (activeUsers || []).some(
        (u) => selectedIds.includes(u.id) && (u.id === 'usr-1' || u.email?.toLowerCase() === 'superadmin@ptbas.co.id')
      );
      if (hasMainAdmin) {
        addToast('Akun Super Admin utama diproteksi dan tidak dapat dihapus.', 'warning');
        return;
      }
      const hasSelf = currentUser && selectedIds.includes(currentUser.id);
      if (hasSelf) {
        addToast('Akun Anda sendiri terpilih dan diproteksi dari penghapusan massal.', 'warning');
        return;
      }
    }

    setDeleteConfirm({
      open: true,
      type: currentTab,
      id: null,
      isBulk: true,
      ids: [...selectedIds],
      label: `${selectedIds.length} data terpilih`,
    });
  };

  const handleConfirmDelete = () => {
    const { type, id, isBulk, ids } = deleteConfirm;
    if (isBulk) {
      const targetIds = ids || selectedIds;
      if (type === 'supplier') {
        targetIds.forEach((tId) => deleteSupplier(tId));
        addToast(`${targetIds.length} supplier berhasil dihapus`, 'info');
      } else if (type === 'material') {
        targetIds.forEach((tId) => deleteMaterial(tId));
        addToast(`${targetIds.length} material berhasil dihapus`, 'info');
      } else if (type === 'armada') {
        targetIds.forEach((tId) => deleteArmada(tId));
        addToast(`${targetIds.length} armada berhasil dihapus`, 'info');
      } else if (type === 'customer') {
        targetIds.forEach((tId) => deleteCustomer(tId));
        addToast(`${targetIds.length} customer berhasil dihapus`, 'info');
      } else if (type === 'bank') {
        targetIds.forEach((tId) => deleteBank(tId));
        addToast(`${targetIds.length} bank berhasil dihapus`, 'info');
      } else if (type === 'rekening') {
        targetIds.forEach((tId) => deleteBankAccount(tId));
        addToast(`${targetIds.length} rekening bank berhasil dihapus`, 'info');
      } else if (type === 'pengguna') {
        if (typeof deleteUser === 'function') {
          let count = 0;
          for (const tId of targetIds) {
            const u = (activeUsers || []).find((usr) => usr.id === tId);
            if (u?.id !== 'usr-1' && u?.email?.toLowerCase() !== 'superadmin@ptbas.co.id' && u?.id !== currentUser?.id) {
              deleteUser(tId);
              count++;
            }
          }
          if (count > 0) {
            addToast(`${count} akun pengguna berhasil dihapus.`, 'info');
          }
        }
      } else if (type === 'mata-uang') {
        let deletedCount = 0;
        let skippedBase = false;
        targetIds.forEach((tId) => {
          const c = (currencies || []).find((it) => it.id === tId);
          if (c?.isBase || c?.code === 'IDR') {
            skippedBase = true;
          } else {
            deleteCurrency(tId);
            deletedCount++;
          }
        });
        if (skippedBase && deletedCount === 0) {
          addToast('Mata uang basis (IDR) tidak dapat dihapus karena merupakan acuan buku besar.', 'warning');
        } else if (skippedBase && deletedCount > 0) {
          addToast(`${deletedCount} mata uang berhasil dihapus (Mata uang basis IDR dikecualikan).`, 'info');
        } else if (deletedCount > 0) {
          addToast(`${deletedCount} mata uang berhasil dihapus.`, 'info');
        }
      }
      setSelectedIds([]);
    } else {
      if (type === 'supplier') deleteSupplier(id);
      else if (type === 'material') deleteMaterial(id);
      else if (type === 'armada') deleteArmada(id);
      else if (type === 'customer') deleteCustomer(id);
      else if (type === 'bank') deleteBank(id);
      else if (type === 'rekening') deleteBankAccount(id);
      else if (type === 'mata-uang') deleteCurrency(id);
      else if (type === 'pengguna' && typeof deleteUser === 'function') deleteUser(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
    setDeleteConfirm({ open: false, type: '', id: null, label: '', isBulk: false, ids: [] });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ open: false, type: '', id: null, label: '', isBulk: false, ids: [] });
  };

  const handleOpenEditCustomer = (cust) => {
    setSelectedCustomer(cust);
    setEditCustomerForm({
      id: cust.id,
      jenisBadanUsaha: cust.jenisBadanUsaha || 'PT-Perusahaan Terbatas',
      name: cust.name || '',
      alias: cust.alias || '',
      alamat: cust.alamat || '',
      npwp: cust.npwp || '',
      telepon: cust.telepon || '',
      kodePrefix: cust.kodePrefix || '',
      aktif: cust.aktif ?? true,
    });
    setEditCustomerModal(true);
  };

  const handleUpdateCustomer = (e) => {
    e.preventDefault();
    if (!editCustomerForm.id || !editCustomerForm.name) return;
    updateCustomer(editCustomerForm.id, {
      name: editCustomerForm.name,
      alias: editCustomerForm.alias,
      jenisBadanUsaha: editCustomerForm.jenisBadanUsaha,
      alamat: editCustomerForm.alamat,
      npwp: editCustomerForm.npwp,
      telepon: editCustomerForm.telepon,
      kodePrefix: editCustomerForm.kodePrefix,
      aktif: editCustomerForm.aktif,
    });
    setEditCustomerModal(false);
    setSelectedCustomer(null);
  };

  const handleOpenEditRekening = (acc) => {
    setSelectedRekening(acc);
    setEditRekeningForm({
      id: acc.id,
      bank: acc.bank || '',
      jenisRekening: acc.jenisRekening || 'Giro Bisnis (Operasional Perusahaan)',
      nomorRekening: acc.nomorRekening || '',
      rekeningAtasNama: acc.rekeningAtasNama || '',
      namaAlias: acc.namaAlias || '',
      supplierId: acc.supplierId || '',
      aktif: acc.aktif ?? true,
    });
    setEditRekeningModal(true);
  };

  const handleUpdateRekening = (e) => {
    e.preventDefault();
    if (!editRekeningForm.id || !editRekeningForm.nomorRekening) return;
    updateBankAccount(editRekeningForm.id, {
      bank: editRekeningForm.bank,
      jenisRekening: editRekeningForm.jenisRekening,
      nomorRekening: editRekeningForm.nomorRekening,
      rekeningAtasNama: editRekeningForm.rekeningAtasNama,
      namaAlias: editRekeningForm.namaAlias,
      supplierId: editRekeningForm.supplierId,
      aktif: editRekeningForm.aktif,
    });
    setEditRekeningModal(false);
    setSelectedRekening(null);
  };

  // Handlers
  const handleSubmitSupplier = (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.idProgram || !supplierForm.penerima) return;
    addSupplier(supplierForm);
    setSupplierForm({
      name: '',
      idProgram: '',
      penerima: '',
      telepon: '',
      pkp: true,
      bank: 'BCA - BANK CENTRAL ASIA',
      noRekening: '',
      rekeningAtasNama: '',
    });
    setModalOpen(false);
  };

  const handleOpenEditSupplier = (sup) => {
    setSelectedSupplier(sup);
    let matchedBank = sup.bank || 'BCA - BANK CENTRAL ASIA';
    // Match against banks in master table
    const foundBank = banks.find((b) => {
      const alias = (b.namaAlias || '').toUpperCase();
      const nama = (b.namaBank || '').toUpperCase();
      const target = matchedBank.toUpperCase();
      return (alias && target.includes(alias)) || (nama && target.includes(nama));
    });
    if (foundBank) {
      matchedBank = foundBank.namaAlias
        ? `${foundBank.namaAlias.toUpperCase()} - ${foundBank.namaBank.toUpperCase()}`
        : foundBank.namaBank.toUpperCase();
    } else if (matchedBank === 'BCA' || matchedBank.toUpperCase().startsWith('BCA')) {
      matchedBank = 'BCA - BANK CENTRAL ASIA';
    } else if (matchedBank === 'Mandiri' || matchedBank.toUpperCase().startsWith('MANDIRI')) {
      matchedBank = 'MANDIRI - BANK MANDIRI';
    } else if (matchedBank === 'BRI' || matchedBank.toUpperCase().startsWith('BRI')) {
      matchedBank = 'BRI - BANK RAKYAT INDONESIA';
    } else if (matchedBank === 'BNI' || matchedBank.toUpperCase().startsWith('BNI')) {
      matchedBank = 'BNI - BANK NEGARA INDONESIA';
    }

    setEditSupplierForm({
      id: sup.id,
      name: sup.name || '',
      idProgram: sup.idProgram || '',
      penerima: sup.penerima || '',
      telepon: sup.telepon || '',
      pkp: Boolean(sup.pkp),
      bank: matchedBank,
      noRekening: sup.noRekening || '',
      rekeningAtasNama: sup.rekeningAtasNama || '',
    });
    setEditSupplierModal(true);
  };

  const handleUpdateSupplier = (e) => {
    e.preventDefault();
    if (!editSupplierForm.id) return;
    updateSupplier(editSupplierForm.id, {
      name: editSupplierForm.name,
      idProgram: editSupplierForm.idProgram,
      penerima: editSupplierForm.penerima,
      telepon: editSupplierForm.telepon,
      pkp: editSupplierForm.pkp,
      bank: editSupplierForm.bank,
      noRekening: editSupplierForm.noRekening,
      rekeningAtasNama: editSupplierForm.rekeningAtasNama,
    });
    setEditSupplierModal(false);
    setSelectedSupplier(null);
  };

  const handleSubmitMaterial = (e) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.beli || !materialForm.jual) return;
    addMaterial({
      name: materialForm.name.toUpperCase(),
      beli: Number(materialForm.beli),
      jual: Number(materialForm.jual),
      coa: materialForm.coa,
      coaPiutang: materialForm.coaPiutang,
      coaPendapatan: materialForm.coaPendapatan,
      category: materialForm.category,
      satuan: materialForm.satuan,
    });
    setMaterialForm({
      name: '',
      beli: '',
      jual: '',
      coa: '110-90',
      coaPiutang: '112-10',
      coaPendapatan: '410-10',
      category: 'Curah',
      satuan: 'm3',
    });
    setModalOpen(false);
  };

  const handleOpenEditMaterial = (mat) => {
    setSelectedMaterial(mat);
    setEditMaterialForm({
      id: mat.id,
      name: mat.name,
      beli: mat.beli !== undefined ? Number(mat.beli).toFixed(1) : '',
      jual: mat.jual !== undefined ? Number(mat.jual).toFixed(1) : '',
      coa: mat.coa || '',
      coaPiutang: mat.coaPiutang || '',
      coaPendapatan: mat.coaPendapatan || '',
      aktif: mat.aktif ?? true,
    });
    setEditMaterialModal(true);
  };

  const handleUpdateMaterial = (e) => {
    e.preventDefault();
    if (!editMaterialForm.id) return;
    updateMaterial(editMaterialForm.id, {
      name: editMaterialForm.name,
      beli: Number(editMaterialForm.beli) || 0,
      jual: Number(editMaterialForm.jual) || 0,
      coa: editMaterialForm.coa,
      coaPiutang: editMaterialForm.coaPiutang,
      coaPendapatan: editMaterialForm.coaPendapatan,
      aktif: editMaterialForm.aktif,
    });
    setEditMaterialModal(false);
    setSelectedMaterial(null);
  };

  const handleSubmitArmada = (e) => {
    e.preventDefault();
    if (!armadaForm.nopol) return;
    addArmada({
      ...armadaForm,
      panjangCm: Number(armadaForm.panjangCm) || 0,
      lebarCm: Number(armadaForm.lebarCm) || 0,
      tinggiCm: Number(armadaForm.tinggiCm) || 0,
      tahun: Number(armadaForm.tahun) || new Date().getFullYear(),
    });
    setArmadaForm({
      nopol: '',
      panjangCm: '',
      lebarCm: '',
      tinggiCm: '',
      aktif: true,
      merk: 'Hino',
      vin: '',
      mesin: '',
      tahun: '',
    });
    setModalOpen(false);
  };

  const handleOpenEditArmada = (arm) => {
    setSelectedArmada(arm);
    setEditArmadaForm({
      id: arm.id,
      nopol: arm.nopol || '',
      panjangCm: arm.panjangCm ? arm.panjangCm : '',
      lebarCm: arm.lebarCm ? arm.lebarCm : '',
      tinggiCm: arm.tinggiCm ? arm.tinggiCm : '',
      aktif: arm.aktif ?? true,
      merk: arm.merk || 'Hino',
      vin: arm.vin || '',
      mesin: arm.mesin || '',
      tahun: arm.tahun || '',
    });
    setEditArmadaModal(true);
  };

  const handleUpdateArmada = (e) => {
    e.preventDefault();
    if (!editArmadaForm.id) return;
    updateArmada(editArmadaForm.id, {
      nopol: editArmadaForm.nopol.toUpperCase(),
      panjangCm: Number(editArmadaForm.panjangCm) || 0,
      lebarCm: Number(editArmadaForm.lebarCm) || 0,
      tinggiCm: Number(editArmadaForm.tinggiCm) || 0,
      aktif: editArmadaForm.aktif,
      merk: editArmadaForm.merk,
      vin: editArmadaForm.vin,
      mesin: editArmadaForm.mesin,
      tahun: Number(editArmadaForm.tahun) || new Date().getFullYear(),
    });
    setEditArmadaModal(false);
    setSelectedArmada(null);
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name) return;
    const prefix =
      customerForm.kodePrefix ||
      `${customerForm.name.slice(0, 2).toUpperCase()} ${Math.floor(100 + Math.random() * 900)}`;
    const jbuPrefix = customerForm.jenisBadanUsaha.split('-')[0] || customerForm.jenisBadanUsaha;
    addCustomer({
      ...customerForm,
      kodePrefix: prefix,
      alias: customerForm.alias || `${jbuPrefix} ${customerForm.name}`,
    });
    setCustomerForm({
      jenisBadanUsaha: 'PT-Perusahaan Terbatas',
      name: '',
      alias: '',
      alamat: '',
      npwp: '',
      telepon: '',
      kodePrefix: '',
    });
    setModalOpen(false);
  };

  const handleSubmitBank = (e) => {
    e.preventDefault();
    if (!bankForm.namaBank) return;
    addBank(bankForm);
    setBankForm({ namaBank: '', namaAlias: '', kodeSwift: '', kodeBank: '' });
    setModalOpen(false);
  };

  const handleOpenEditBank = (b) => {
    setSelectedBank(b);
    setEditBankForm({
      id: b.id,
      namaBank: b.namaBank || '',
      namaAlias: b.namaBank || '',
      kodeSwift: b.kodeSwift || '',
      kodeBank: b.kodeBank || '',
    });
    setEditBankModal(true);
  };

  const handleUpdateBank = (e) => {
    e.preventDefault();
    if (!editBankForm.id) return;
    updateBank(editBankForm.id, {
      namaBank: editBankForm.namaBank.toUpperCase(),
      namaAlias: editBankForm.namaBank.toUpperCase(),
      kodeSwift: editBankForm.kodeSwift.toUpperCase(),
      kodeBank: editBankForm.kodeBank,
    });
    setEditBankModal(false);
    setSelectedBank(null);
  };

  const handleSubmitRekening = (e) => {
    e.preventDefault();
    if (!rekeningForm.nomorRekening || !rekeningForm.bank) return;
    addBankAccount(rekeningForm);
    setRekeningForm({
      bank: '',
      jenisRekening: '',
      nomorRekening: '',
      rekeningAtasNama: '',
      namaAlias: '',
    });
    setModalOpen(false);
  };

  const handleSubmitCurrency = (e) => {
    e.preventDefault();
    if (!currencyForm.code) {
      addToast('Kode mata uang wajib diisi!', 'warning');
      return;
    }
    const cleanCode = currencyForm.code.trim().toUpperCase();
    if (currenciesList.some((c) => c.code.toUpperCase() === cleanCode)) {
      addToast(`Mata uang "${cleanCode}" sudah terdaftar di sistem!`, 'error');
      return;
    }
    addCurrency({
      ...currencyForm,
      code: cleanCode,
      name: currencyForm.name || cleanCode,
      englishName: currencyForm.englishName || cleanCode,
      symbol: currencyForm.symbol || cleanCode,
      formatSample: currencyForm.formatSample || `${currencyForm.symbol || cleanCode} 1,250.00`,
      formatPresisi: currencyForm.formatPresisi || '24.50 m³',
      lingkupModul:
        Array.isArray(currencyForm.lingkupModul) && currencyForm.lingkupModul.length > 0
          ? currencyForm.lingkupModul
          : ['Pre Order Customer', 'Kontrak Vendor Valas'],
      isBase: false,
      aktif: true,
    });
    setCurrencyForm({
      code: '',
      isoCode: '',
      name: '',
      englishName: '',
      symbol: '',
      country: '',
      pemisahRibuan: 'Titik (.)',
      pemisahDesimal: 'Koma (,)',
      formatSample: '',
      presisi: '2 Digit Desimal',
      formatPresisi: '24.50 m³',
      pajak: 'Non-PPN / Transaksi Valas',
      deskripsi: '',
      lingkupModul: ['Pre Order Customer', 'Kontrak Vendor Valas'],
    });
    setModalOpen(false);
  };

  const activeUsers = (users && users.length > 0) ? users : usersList;

  // Search & Filter State
  const searchInputRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [selectedIds, setSelectedIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Reset selected items when changing tabs
  useEffect(() => {
    setSelectedIds([]);
  }, [currentTab]);

  // Keyboard shortcut listener: Press '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sorting helper
  const handleToggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Copy helper
  const handleCopyText = async (text, label = 'Nomor') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      addToast(`${label} ${text} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast(`Gagal menyalin ${label}`, 'error');
    }
  };

  // Selection helpers
  const handleToggleSelectAll = (items) => {
    const allIds = items.map((it) => it.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleToggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Tab descriptions
  const tabDescriptions = {
    supplier: 'Kelola data mitra tambang, legalitas PKP, rekening bank settlement, dan kontak operasional.',
    material: 'Daftar jenis agregat, batu split, pasir cor, base course, standar harga beli & jual per m³.',
    customer: 'Manajemen kontraktor mitra, prefix surat jalan, alamat pengiriman, dan status kontrak.',
    armada: 'Monitoring unit dump truck & tronton, nomor polisi, kapasitas m³, sopir utama, dan ritase.',
    bank: 'Direktori perbankan nasional mitra transaksi, kode kliring transfer, dan standardisasi SWIFT.',
    rekening: 'Daftar rekening bank perusahaan untuk penerimaan pembayaran invoice dan pencairan kas BKK.',
    pengguna: 'Kontrol hak akses sistem, peran operasional (Admin, Super Admin), dan persetujuan akun.',
    'mata-uang': 'Konfigurasi mata uang acuan buku besar akuntansi PT BAS (IDR / Rupiah Indonesia).',
  };

  // Memoized Filtered & Sorted Datasets
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.penerima && s.penerima.toLowerCase().includes(query)) ||
          (s.noRekening && s.noRekening.includes(searchQuery)) ||
          (s.bank && s.bank.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && s.aktif) ||
          (statusFilter === 'inactive' && !s.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * mult;
        if (sortField === 'bank') return (a.bank || '').localeCompare(b.bank || '') * mult;
        if (sortField === 'penerima') return (a.penerima || '').localeCompare(b.penerima || '') * mult;
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [suppliers, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredMaterials = useMemo(() => {
    return materials
      .filter((m) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (m.name && m.name.toLowerCase().includes(query)) ||
          (m.category && m.category.toLowerCase().includes(query)) ||
          (m.satuan && m.satuan.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && m.aktif) ||
          (statusFilter === 'inactive' && !m.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * mult;
        if (sortField === 'category') return (a.category || '').localeCompare(b.category || '') * mult;
        if (sortField === 'beli') return ((a.beli || 0) - (b.beli || 0)) * mult;
        if (sortField === 'jual') return ((a.jual || 0) - (b.jual || 0)) * mult;
        if (sortField === 'margin') {
          const marginA = (a.jual || 0) - (a.beli || 0);
          const marginB = (b.jual || 0) - (b.beli || 0);
          return (marginA - marginB) * mult;
        }
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [materials, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredArmada = useMemo(() => {
    return armadaList
      .filter((a) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (a.nopol && a.nopol.toLowerCase().includes(query)) ||
          (a.merk && a.merk.toLowerCase().includes(query)) ||
          (a.tahun && a.tahun.toString().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && a.aktif) ||
          (statusFilter === 'inactive' && !a.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'nopol' || sortField === 'name') return (a.nopol || '').localeCompare(b.nopol || '') * mult;
        if (sortField === 'merk') return (a.merk || '').localeCompare(b.merk || '') * mult;
        if (sortField === 'tahun') return ((parseInt(a.tahun, 10) || 0) - (parseInt(b.tahun, 10) || 0)) * mult;
        if (sortField === 'kapasitas') return ((parseFloat(a.kapasitas) || 0) - (parseFloat(b.kapasitas) || 0)) * mult;
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [armadaList, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.kodePrefix && c.kodePrefix.toLowerCase().includes(query)) ||
          (c.alamat && c.alamat.toLowerCase().includes(query)) ||
          (c.telepon && c.telepon.toLowerCase().includes(query)) ||
          (c.npwp && c.npwp.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && c.aktif) ||
          (statusFilter === 'inactive' && !c.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * mult;
        if (sortField === 'kodePrefix') return (a.kodePrefix || '').localeCompare(b.kodePrefix || '') * mult;
        if (sortField === 'alamat') return (a.alamat || '').localeCompare(b.alamat || '') * mult;
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [customers, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredBanks = useMemo(() => {
    return banks
      .filter((b) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (b.namaBank && b.namaBank.toLowerCase().includes(query)) ||
          (b.namaAlias && b.namaAlias.toLowerCase().includes(query)) ||
          (b.kodeBank && b.kodeBank.toLowerCase().includes(query)) ||
          (b.kodeSwift && b.kodeSwift.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && b.aktif) ||
          (statusFilter === 'inactive' && !b.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'namaBank' || sortField === 'name') return (a.namaBank || '').localeCompare(b.namaBank || '') * mult;
        if (sortField === 'namaAlias') return (a.namaAlias || '').localeCompare(b.namaAlias || '') * mult;
        if (sortField === 'kodeBank') return (a.kodeBank || '').localeCompare(b.kodeBank || '') * mult;
        if (sortField === 'kodeSwift') return (a.kodeSwift || '').localeCompare(b.kodeSwift || '') * mult;
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [banks, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredAccounts = useMemo(() => {
    return bankAccounts
      .filter((r) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (r.nomorRekening && r.nomorRekening.includes(searchQuery)) ||
          (r.rekeningAtasNama && r.rekeningAtasNama.toLowerCase().includes(query)) ||
          (r.bank && r.bank.toLowerCase().includes(query)) ||
          (r.jenisRekening && r.jenisRekening.toLowerCase().includes(query)) ||
          (r.namaAlias && r.namaAlias.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && r.aktif) ||
          (statusFilter === 'inactive' && !r.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'bank' || sortField === 'name') return (a.bank || '').localeCompare(b.bank || '') * mult;
        if (sortField === 'nomorRekening') return (a.nomorRekening || '').localeCompare(b.nomorRekening || '') * mult;
        if (sortField === 'rekeningAtasNama') return (a.rekeningAtasNama || '').localeCompare(b.rekeningAtasNama || '') * mult;
        if (sortField === 'status') return ((a.aktif === b.aktif) ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [bankAccounts, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredUsers = useMemo(() => {
    return activeUsers
      .filter((u) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.role && u.role.toLowerCase().includes(query)) ||
          (u.roleLabel && u.roleLabel.toLowerCase().includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && (u.aktif === 1 || u.aktif === true)) ||
          (statusFilter === 'inactive' && (!u.aktif || u.aktif === 0));
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * mult;
        if (sortField === 'email') return (a.email || '').localeCompare(b.email || '') * mult;
        if (sortField === 'role') return (a.role || '').localeCompare(b.role || '') * mult;
        if (sortField === 'status') {
          const aActive = a.aktif === 1 || a.aktif === true;
          const bActive = b.aktif === 1 || b.aktif === true;
          return (aActive === bActive ? 0 : aActive ? -1 : 1) * mult;
        }
        return 0;
      });
  }, [activeUsers, searchQuery, statusFilter, sortField, sortOrder]);

  const filteredCurrencies = useMemo(() => {
    return currenciesList
      .filter((c) => {
        const query = searchQuery.toLowerCase();
        const matchQuery =
          !query ||
          (c.code && c.code.toLowerCase().includes(query)) ||
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.englishName && c.englishName.toLowerCase().includes(query)) ||
          (c.symbol && c.symbol.toLowerCase().includes(query)) ||
          (c.isoCode && c.isoCode.includes(query));
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && c.aktif) ||
          (statusFilter === 'inactive' && !c.aktif);
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        const mult = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'name') return (a.name || '').localeCompare(b.name || '') * mult;
        if (sortField === 'code') return (a.code || '').localeCompare(b.code || '') * mult;
        if (sortField === 'status') return (a.aktif === b.aktif ? 0 : a.aktif ? -1 : 1) * mult;
        return 0;
      });
  }, [currenciesList, searchQuery, statusFilter, sortField, sortOrder]);

  const masterSubgroups = [
    {
      id: 'operasional',
      label: 'Operasional Lapangan',
      tag: 'Operasional',
      items: [
        { key: 'supplier', label: 'Data Supplier', shortLabel: 'Supplier', count: suppliers.length, icon: HardHat },
        { key: 'material', label: 'Data Material', shortLabel: 'Material', count: materials.length, icon: Mountain },
        { key: 'customer', label: 'Data Customer', shortLabel: 'Customer', count: customers.length, icon: Building2 },
        { key: 'armada', label: 'Data Armada', shortLabel: 'Armada Truk', count: armadaList.length, icon: Truck },
      ],
    },
    {
      id: 'finansial',
      label: 'Finansial & Bank',
      tag: 'Finansial',
      items: [
        { key: 'bank', label: 'Data Bank', shortLabel: 'Bank Mitra', count: banks.length, icon: Landmark },
        { key: 'rekening', label: 'Data Rekening Bank', shortLabel: 'Rekening Bank', count: bankAccounts.length, icon: CreditCard },
        { key: 'mata-uang', label: 'Data Mata Uang', shortLabel: 'Mata Uang', count: currenciesList.length, icon: Coins },
      ],
    },
    {
      id: 'pengguna',
      label: 'Akses & Pengguna',
      tag: 'Akses',
      items: [
        { key: 'pengguna', label: 'Data Pengguna', shortLabel: 'Pengguna Sistem', count: activeUsers.length, icon: Users },
      ],
    },
  ];

  // Flattened for easy lookup
  const categories = masterSubgroups.flatMap((g) => g.items);

  // Active item
  const activeItem = categories.find((it) => it.key === currentTab) || categories[0];
  const ActiveIcon = activeItem?.icon || HardHat;

  // Total and filtered counts for the active tab
  const currentListCount = useMemo(() => {
    switch (currentTab) {
      case 'supplier': return { filtered: filteredSuppliers.length, total: suppliers.length };
      case 'material': return { filtered: filteredMaterials.length, total: materials.length };
      case 'armada': return { filtered: filteredArmada.length, total: armadaList.length };
      case 'customer': return { filtered: filteredCustomers.length, total: customers.length };
      case 'bank': return { filtered: filteredBanks.length, total: banks.length };
      case 'rekening': return { filtered: filteredAccounts.length, total: bankAccounts.length };
      case 'pengguna': return { filtered: filteredUsers.length, total: activeUsers.length };
      case 'mata-uang': return { filtered: filteredCurrencies.length, total: currenciesList.length };
      default: return { filtered: 0, total: 0 };
    }
  }, [currentTab, filteredSuppliers, filteredMaterials, filteredArmada, filteredCustomers, filteredBanks, filteredAccounts, filteredUsers, filteredCurrencies, suppliers, materials, armadaList, customers, banks, bankAccounts, activeUsers, currenciesList]);

  // Export to CSV Generator (Standard UTF-8 BOM)
  const handleExportCSV = (customItems = null) => {
    let filename = `PT_BAS_Master_${currentTab.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers = [];
    let rows = [];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    if (currentTab === 'supplier') {
      const list = customItems || filteredSuppliers;
      headers = ['ID / Kode', 'Nama Supplier', 'Bank Mitra', 'Nomor Rekening', 'Penerima (a/n)', 'Status PKP', 'Status Operasional'];
      rows = list.map((s) => [
        s.idProgram || s.id,
        s.name,
        s.bank,
        `'${s.noRekening}`,
        s.penerima,
        s.pkp ? 'PKP' : 'Non-PKP',
        s.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'material') {
      const list = customItems || filteredMaterials;
      headers = ['ID', 'Nama Material', 'Kategori', 'Satuan', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Margin (Rp)', 'PPh Rate (%)', 'Status'];
      rows = list.map((m) => [
        m.id,
        m.name,
        m.category || '-',
        m.satuan || 'm3',
        m.beli || 0,
        m.jual || 0,
        (m.jual || 0) - (m.beli || 0),
        m.pphRate || 0,
        m.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'armada') {
      const list = customItems || filteredArmada;
      headers = ['ID', 'Nomor Polisi', 'Merk', 'Tahun', 'Dimensi Bak (P x L x T)', 'Kapasitas (m3)', 'Status'];
      rows = list.map((a) => [
        a.id,
        a.nopol,
        a.merk,
        a.tahun || '-',
        `${a.panjangCm || '-'} x ${a.lebarCm || '-'} x ${a.tinggiCm || '-'} cm`,
        a.kapasitas || 0,
        a.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'customer') {
      const list = customItems || filteredCustomers;
      headers = ['ID', 'Kode Prefix', 'Nama Customer', 'Alamat Proyek/Kantor', 'Telepon', 'NPWP', 'Status'];
      rows = list.map((c) => [
        c.id,
        c.kodePrefix || '-',
        c.name,
        c.alamat || '-',
        `'${c.telepon || '-'}`,
        c.npwp || '-',
        c.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'bank') {
      const list = customItems || filteredBanks;
      headers = ['ID', 'Nama Alias', 'Nama Bank Resmi', 'Kode Bank', 'Kode SWIFT', 'Status'];
      rows = list.map((b) => [
        b.id,
        b.namaAlias || b.namaBank,
        b.namaBank,
        b.kodeBank || '-',
        b.kodeSwift || '-',
        b.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'rekening') {
      const list = customItems || filteredAccounts;
      headers = ['ID', 'Bank', 'Nomor Rekening', 'Atas Nama', 'Jenis Rekening', 'Alias / Label', 'Status'];
      rows = list.map((r) => [
        r.id,
        r.bank,
        `'${r.nomorRekening}`,
        r.rekeningAtasNama,
        r.jenisRekening || 'Utama',
        r.namaAlias || '-',
        r.aktif ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'pengguna') {
      const list = customItems || filteredUsers;
      headers = ['ID', 'Nama Pengguna', 'Email', 'Role / Peran', 'Status Akun'];
      rows = list.map((u) => [
        u.id,
        u.name,
        u.email,
        u.roleLabel || u.role,
        (u.aktif === 1 || u.aktif === true) ? 'Aktif' : 'Non-aktif',
      ]);
    } else if (currentTab === 'mata-uang') {
      const list = customItems || filteredCurrencies;
      headers = ['Kode ISO', 'Nama Mata Uang', 'Simbol', 'Format Desimal', 'Ketentuan Pajak', 'Status'];
      rows = list.map((c) => [
        `${c.code} (${c.isoCode})`,
        c.name,
        c.symbol,
        `${c.presisi} (${c.formatPresisi})`,
        c.pajak,
        c.aktif ? 'Mata Uang Basis Sistem (Aktif)' : 'Non-Aktif',
      ]);
    }

    if (rows.length === 0) {
      addToast('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCSV).join(';'),
        ...rows.map((r) => r.map(escapeCSV).join(';')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Berhasil mengekspor ${rows.length} data ke CSV!`, 'success');
  };

  return (
    <div className="space-y-4 pb-20 relative min-h-screen">
      {/* 1. Unified Master Page Header (Section 4.1) */}
      <div className="master-header-card bg-gradient-to-r from-[#121822]/95 via-[#161F2C]/90 to-[#121822]/95 border border-[#1E2938] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
            <span
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              onClick={() => navigate('/dashboard')}
            >
              Beranda
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-500" />
            <span className="text-neutral-300 font-medium">Master Data</span>
            <ChevronRight className="w-3 h-3 text-neutral-500" />
            <span className="text-[#FF7043] font-semibold">{activeItem.label}</span>
          </div>

          {/* Title & Description */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F4511E]/25 to-[#FF8A65]/10 border border-[#F4511E]/40 text-[#F4511E] flex items-center justify-center font-bold shadow-md shadow-orange-500/10 shrink-0">
              <ActiveIcon className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeItem.label}
                </h1>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-neutral-200 font-medium">
                  {currentListCount.total} entitas
                </span>
              </div>
              <p className="text-xs text-neutral-400 max-w-2xl mt-1 leading-relaxed">
                {tabDescriptions[currentTab] || 'Kelola dan atur parameter referensi data master sistem.'}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => handleExportCSV()}
            className="bg-[#151D28] hover:bg-[#1D2838] text-neutral-200 border-[#223044] hover:text-white text-xs font-medium cursor-pointer shadow-xs"
            title="Unduh seluruh data hasil pencarian & filter ke CSV"
          >
            Ekspor CSV
          </Button>

          {currentTab === 'pengguna' ? (
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setAddUserModal(true)}
              className="whitespace-nowrap font-medium bg-[#F4511E] hover:bg-[#D84315] text-xs shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Tambah Pengguna
            </Button>
          ) : ['supplier', 'material', 'armada', 'customer', 'bank', 'rekening', 'mata-uang'].includes(currentTab) ? (
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setModalOpen(true)}
              className="whitespace-nowrap font-medium bg-[#F4511E] hover:bg-[#D84315] text-xs shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Tambah {activeItem.shortLabel}
            </Button>
          ) : null}
        </div>
      </div>

      {/* 2. Unified Data Toolbar (Search, Filter, Count & View Mode Toggle) */}
      <div className="master-toolbar bg-[#14171A]/90 backdrop-blur-md border border-[#22262A] rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        {/* Left: Search with / shortcut hint & Status Filter */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeItem.shortLabel.toLowerCase()}... (tekan / untuk cari)`}
              className="w-full pl-9 pr-14 py-2 text-xs bg-[#0E1012] border border-[#22262A] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E] focus:ring-2 focus:ring-[#F4511E]/20 transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs p-1 rounded hover:bg-white/10 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hidden sm:inline-block pointer-events-none font-medium">
                /
              </span>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative flex items-center">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-[#0E1012] border border-[#22262A] rounded-xl pl-8 pr-3 py-2 text-neutral-200 focus:outline-none focus:border-[#F4511E] transition-all cursor-pointer font-medium shadow-inner"
              >
                <option value="all">Semua Status</option>
                <option value="active">Hanya Aktif</option>
                <option value="inactive">Hanya Non-Aktif</option>
              </select>
            </div>

            {/* Quick Select All Toggle in Toolbar */}
            {currentListCount.filtered > 0 && currentTab !== 'customer' && (
              <label
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0E1012] border border-[#22262A] text-neutral-300 text-xs cursor-pointer hover:border-[#F4511E]/40 transition-colors select-none shrink-0"
                title="Pilih Semua / Batal Pilih"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                  checked={(() => {
                    let list = [];
                    if (currentTab === 'supplier') list = filteredSuppliers;
                    else if (currentTab === 'material') list = filteredMaterials;
                    else if (currentTab === 'armada') list = filteredArmada;
                    else if (currentTab === 'customer') list = filteredCustomers;
                    else if (currentTab === 'bank') list = filteredBanks;
                    else if (currentTab === 'rekening') list = filteredAccounts;
                    else if (currentTab === 'pengguna') list = filteredUsers;
                    else if (currentTab === 'mata-uang') list = filteredCurrencies;
                    return list.length > 0 && list.every((it) => selectedIds.includes(it.id));
                  })()}
                  onChange={() => {
                    let list = [];
                    if (currentTab === 'supplier') list = filteredSuppliers;
                    else if (currentTab === 'material') list = filteredMaterials;
                    else if (currentTab === 'armada') list = filteredArmada;
                    else if (currentTab === 'customer') list = filteredCustomers;
                    else if (currentTab === 'bank') list = filteredBanks;
                    else if (currentTab === 'rekening') list = filteredAccounts;
                    else if (currentTab === 'pengguna') list = filteredUsers;
                    else if (currentTab === 'mata-uang') list = filteredCurrencies;
                    handleToggleSelectAll(list);
                  }}
                />
                <span className="text-[11px] font-mono hidden sm:inline">Pilih Semua</span>
              </label>
            )}
          </div>
        </div>

        {/* Right: Counter Chip & View Mode Toggle */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <div className="text-[11px] font-mono text-neutral-400 px-2 py-1 rounded-lg bg-black/20 border border-white/5">
            Menampilkan <span className="text-[#FF7043] font-bold">{currentListCount.filtered}</span> dari {currentListCount.total} data
          </div>

          {/* Opsi Tampilan Grid / List */}
          <div className="view-toggle-container flex items-center bg-[#0E1012] p-1 rounded-xl border border-[#22262A] shrink-0">
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={`view-toggle-btn px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${viewMode === 'grid'
                ? 'active bg-[#F4511E] text-white shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                }`}
              title="Tampilan Grid (Kartu)"
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`view-toggle-btn px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${viewMode === 'list'
                ? 'active bg-[#F4511E] text-white shadow-xs font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-[#151D28]'
                }`}
              title="Tampilan List (Tabel)"
              aria-label="Tampilan List"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Multi-select) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121822]/95 backdrop-blur-md border border-[#F4511E]/40 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-4 text-xs"
          >
            <div className="flex items-center gap-2 text-white font-medium">
              <CheckSquare className="w-4 h-4 text-[#F4511E]" />
              <span>
                <strong className="text-[#FF7043]">{selectedIds.length}</strong> data dipilih
              </span>
            </div>

            <div className="h-4 w-px bg-white/15" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAskBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer border border-rose-500/30 active:scale-95"
                title="Hapus data yang dipilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>

              <button
                type="button"
                onClick={() => {
                  let list = [];
                  if (currentTab === 'supplier') list = filteredSuppliers.filter((s) => selectedIds.includes(s.id));
                  else if (currentTab === 'material') list = filteredMaterials.filter((m) => selectedIds.includes(m.id));
                  else if (currentTab === 'armada') list = filteredArmada.filter((a) => selectedIds.includes(a.id));
                  else if (currentTab === 'customer') list = filteredCustomers.filter((c) => selectedIds.includes(c.id));
                  else if (currentTab === 'bank') list = filteredBanks.filter((b) => selectedIds.includes(b.id));
                  else if (currentTab === 'rekening') list = filteredAccounts.filter((r) => selectedIds.includes(r.id));
                  else if (currentTab === 'pengguna') list = filteredUsers.filter((u) => selectedIds.includes(u.id));
                  else if (currentTab === 'mata-uang') list = filteredCurrencies.filter((c) => selectedIds.includes(c.id));
                  handleExportCSV(list);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F4511E] hover:bg-[#D84315] text-white font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Terpilih
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer font-medium"
              >
                Batalkan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Tab Content with View Transitions and Grid/List options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTab}-${viewMode}`}
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.995 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          {/* ======================================================== */}
          {/* 1. DATA SUPPLIER */}
          {/* ======================================================== */}
          {currentTab === 'supplier' && (() => {
            const filtered = filteredSuppliers;

            return (
              <div className="space-y-3.5">
                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={HardHat}
                    title="Supplier"
                    description="Kelola dan catat mitra tambang batu, pasir, agregat serta data rekening settlement."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Supplier"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua supplier"
                              />
                            </th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="name" label="Nama Supplier" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="bank" label="Bank & No. Rekening" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="penerima" label="Penerima (a/n)" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3 w-20">PKP</th>
                            <th className="p-3 text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((sup) => (
                            <tr key={sup.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(sup.id)}
                                  onChange={() => handleToggleSelectItem(sup.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSupplierStatus(sup.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${sup.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={sup.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${sup.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {sup.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-[#F4511E]/10 border border-[#F4511E]/20 text-[#F4511E] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                    {sup.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-white uppercase tracking-wide">
                                    {sup.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white">{sup.bank}</span>
                                  <span>-</span>
                                  <span>{sup.noRekening}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(sup.noRekening, 'Nomor Rekening')}
                                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
                                    title="Salin Nomor Rekening"
                                  >
                                    {copiedId === sup.noRekening ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 uppercase text-neutral-300 tracking-tight">
                                {sup.penerima}
                              </td>
                              <td className="p-3">
                                {sup.pkp ? (
                                  <Badge size="xs" variant="success" dot>
                                    PKP
                                  </Badge>
                                ) : (
                                  <span className="text-[11px] text-neutral-500 font-mono">Non-PKP</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSupplier(sup)}
                                    className="p-1.5 rounded-md bg-[#F4511E]/10 hover:bg-[#F4511E] text-[#F4511E] hover:text-white transition-all cursor-pointer border border-[#F4511E]/30"
                                    title="Perbarui Data Supplier"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('supplier', sup.id, sup.name)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Supplier"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((sup) => (
                      <motion.div
                        key={sup.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(sup.id)}
                                  onChange={() => handleToggleSelectItem(sup.id)}
                                  title="Pilih supplier"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F4511E]/20 to-[#FF8A65]/10 border border-[#F4511E]/30 text-[#F4511E] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <HardHat className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSupplierStatus(sup.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${sup.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={sup.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${sup.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {sup.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenEditSupplier(sup)}
                                className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                                title="Perbarui Data Supplier"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1 group-hover:text-[#FF7043] transition-colors">
                                  {sup.name}
                                </h3>
                                {sup.pkp && (
                                  <Badge size="xs" variant="success" dot className="shrink-0">
                                    PKP
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-2.5 space-y-1.5 text-xs font-mono">
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/25 border border-white/5 text-neutral-300">
                                  <div className="flex items-center gap-2 truncate">
                                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="font-semibold text-white">{sup.bank}</span>
                                    <span className="text-neutral-400">-</span>
                                    <span className="truncate">{sup.noRekening}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(sup.noRekening, 'Nomor Rekening')}
                                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                                    title="Salin Nomor Rekening"
                                  >
                                    {copiedId === sup.noRekening ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 px-1 text-[11px] text-neutral-400">
                                  <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                  <span className="truncate uppercase">a/n {sup.penerima}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupplier(sup)}
                              className="inline-flex items-center gap-1.5 text-[11px] text-[#FF7043] hover:text-white transition-colors cursor-pointer font-medium"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Ubah Data</span>
                            </button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              onClick={() => handleAskDelete('supplier', sup.id, sup.name)}
                              className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                              title="Hapus Supplier"
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 2. DATA MATERIAL */}
          {/* ======================================================== */}
          {currentTab === 'material' && (() => {
            const filtered = filteredMaterials;

            return (
              <div className="space-y-3.5">
                {/* Metric Summary Header Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="master-stat-card p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Jenis Material</div>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">{materials.length}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Batu, Pasir & Abu Tambang</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F4511E]">
                      <Mountain className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-emerald p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Material Aktif</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                        {materials.filter((m) => m.aktif).length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {Math.round((materials.filter((m) => m.aktif).length / (materials.length || 1)) * 100)}% Siap Dijual
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-amber p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Rata-rata Margin</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                        +{(
                          materials.reduce((sum, m) => sum + ((m.jual || 0) - (m.beli || 0)), 0) /
                          (materials.length || 1)
                        ).toFixed(1)}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Selisih Jual vs Beli</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-sky p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Kategori & PPh</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                        {new Set(materials.map((m) => m.category)).size} Golongan
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">PPh 22 & Satuan Tambang</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={Mountain}
                    title="Material"
                    description="Daftar agregat, batu pecah, pasir cor, dan standar harga jual/beli tambang."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Material"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua material"
                              />
                            </th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="name" label="Nama Material" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="category" label="Kategori & Satuan" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="beli" label="Harga Beli" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} align="right" />
                            <SortHeader field="jual" label="Harga Jual" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} align="right" />
                            <th className="p-3 text-center">PPH Rate</th>
                            <th className="p-3 text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((mat) => (
                            <tr key={mat.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(mat.id)}
                                  onChange={() => handleToggleSelectItem(mat.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleMaterialStatus(mat.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${mat.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={mat.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${mat.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {mat.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#F4511E] flex items-center justify-center font-bold text-xs shrink-0">
                                    <Mountain className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-white uppercase tracking-wide">
                                    {mat.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge size="xs" variant="neutral">
                                    {mat.category}
                                  </Badge>
                                  <Badge size="xs" variant="timber">
                                    {mat.satuan}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-neutral-300">
                                {mat.beli.toFixed(1)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-amber-400">
                                {mat.jual.toFixed(1)}
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-mono text-xs text-neutral-300">{mat.pphRate}%</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMaterial(mat)}
                                    className="p-1.5 rounded-md bg-[#F4511E]/10 hover:bg-[#F4511E] text-[#F4511E] hover:text-white transition-all cursor-pointer border border-[#F4511E]/30"
                                    title="Perbarui Data Material"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('material', mat.id, mat.name)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Material"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((mat) => (
                      <motion.div
                        key={mat.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(mat.id)}
                                  onChange={() => handleToggleSelectItem(mat.id)}
                                  title="Pilih material"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <Mountain className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleMaterialStatus(mat.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${mat.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={mat.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${mat.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {mat.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenEditMaterial(mat)}
                                className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                                title="Perbarui Data Material"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1">
                              {mat.name}
                            </h3>

                            {/* Pricing grid */}
                            <div className="mt-2.5 grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/25 border border-white/5 text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-neutral-400 block uppercase">Harga Beli</span>
                                <span className="text-white font-medium">{mat.beli.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-400 block uppercase">Harga Jual</span>
                                <span className="text-amber-400 font-bold">{mat.jual.toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              <Badge size="xs" variant="neutral">
                                PPH {mat.pphRate}% ({mat.category})
                              </Badge>
                              <Badge size="xs" variant="timber">
                                {mat.satuan}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMaterial(mat)}
                              className="inline-flex items-center gap-1.5 text-[11px] text-[#FF7043] hover:text-white transition-colors cursor-pointer font-medium"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Ubah Tarif</span>
                            </button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              onClick={() => handleAskDelete('material', mat.id, mat.name)}
                              className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                              title="Hapus Material"
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 3. DATA ARMADA */}
          {/* ======================================================== */}
          {currentTab === 'armada' && (() => {
            const filtered = filteredArmada;

            return (
              <div className="space-y-3.5">
                {/* Metric Summary Header Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="master-stat-card p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Armada</div>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">{armadaList.length} Unit</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Dump Truck Operasional</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F4511E]">
                      <Truck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-emerald p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Siap Operasi</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                        {armadaList.filter((a) => a.aktif).length} Unit
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {Math.round((armadaList.filter((a) => a.aktif).length / (armadaList.length || 1)) * 100)}% Siap Angkut
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-amber p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Ritase Kumulatif</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                        {armadaList.reduce((sum, a) => sum + (parseFloat(a.kapasitas) || 0), 0).toFixed(1)} m³
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Kapasitas 1 Putaran</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Box className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-sky p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Rata-rata Bak</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                        {(
                          armadaList.reduce((sum, a) => sum + (parseFloat(a.kapasitas) || 0), 0) /
                          (armadaList.length || 1)
                        ).toFixed(2)} m³
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Ukuran Bak Efektif</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={Truck}
                    title="Armada Truk"
                    description="Pencatatan nomor polisi dump truck, kapasitas bak m³, dan sopir utama."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Armada"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua armada"
                              />
                            </th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="nopol" label="No. Polisi" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="merk" label="Merk & Tahun" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3">Dimensi Bak (P x L x T)</th>
                            <SortHeader field="kapasitas" label="Kapasitas Bak" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} align="right" />
                            <th className="p-3 text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((arm) => (
                            <tr key={arm.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(arm.id)}
                                  onChange={() => handleToggleSelectItem(arm.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleArmadaStatus(arm.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${arm.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={arm.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${arm.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {arm.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Truck className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-white font-mono tracking-wider text-sm">
                                    {arm.nopol}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-[#2E3339] text-neutral-300 text-[11px]">
                                    {arm.merk}
                                  </span>
                                  <span className="text-neutral-400 text-xs">Thn {arm.tahun}</span>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                {arm.panjangCm} × {arm.lebarCm} × {arm.tinggiCm} cm
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-amber-400">
                                {arm.kapasitas} m³
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditArmada(arm)}
                                    className="p-1.5 rounded-md bg-[#F4511E]/10 hover:bg-[#F4511E] text-[#F4511E] hover:text-white transition-all cursor-pointer border border-[#F4511E]/30"
                                    title="Perbarui Data Armada"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('armada', arm.id, arm.nopol)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Armada"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((arm) => (
                      <motion.div
                        key={arm.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(arm.id)}
                                  onChange={() => handleToggleSelectItem(arm.id)}
                                  title="Pilih armada"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <Truck className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleArmadaStatus(arm.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${arm.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={arm.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${arm.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {arm.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenEditArmada(arm)}
                                className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                                title="Perbarui Data Armada"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Nopol badge */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-bold text-white tracking-widest font-mono text-sm">
                                {arm.nopol}
                              </span>
                              <span className="text-xs text-neutral-400 font-mono">
                                Thn {arm.tahun}
                              </span>
                            </div>

                            {/* Dimensions & Capacity box */}
                            <div className="mt-3 p-2.5 rounded-lg bg-black/25 border border-white/5 space-y-1.5 text-xs font-mono">
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-400 text-[11px]">Dimensi Bak</span>
                                <span className="text-neutral-200">
                                  {arm.panjangCm} × {arm.lebarCm} × {arm.tinggiCm} cm
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                <span className="text-neutral-400 text-[11px]">Kapasitas Kubikasi</span>
                                <span className="text-amber-400 font-bold text-sm">
                                  {arm.kapasitas} m³
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#18202C] border border-[#253245] text-[11px] text-neutral-300 font-mono">
                                {arm.merk}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenEditArmada(arm)}
                              className="inline-flex items-center gap-1.5 text-[11px] text-[#FF7043] hover:text-white transition-colors cursor-pointer font-medium"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Ubah Dimensi</span>
                            </button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              onClick={() => handleAskDelete('armada', arm.id, arm.nopol)}
                              className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                              title="Hapus Armada"
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 4. DATA CUSTOMER */}
          {/* ======================================================== */}
          {currentTab === 'customer' && (() => {
            const filtered = filteredCustomers;

            return (
              <div className="space-y-3.5">
                {/* Metric Summary Header Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="master-stat-card p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Total Customer</div>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">{customers.length}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Klien Perusahaan & Proyek</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F4511E]">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-emerald p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Customer Aktif</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                        {customers.filter((c) => c.aktif).length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {Math.round((customers.filter((c) => c.aktif).length / (customers.length || 1)) * 100)}% Kontrak Berjalan
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-sky p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">NPWP Terdaftar</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                        {customers.filter((c) => c.npwp && c.npwp !== '-').length}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Faktur Pajak Elektronik</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-amber p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Prefix Kode</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                        {new Set(customers.map((c) => c.kodePrefix)).size} Prefix
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Identitas Unik Surat Jalan</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Hash className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={Building2}
                    title="Customer"
                    description="Data kontraktor dan proyek penerima material tambang."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Customer"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center"></th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="kodePrefix" label="Kode Prefix" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="name" label="Nama Customer" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="alamat" label="Alamat" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3">Telepon</th>
                            <th className="p-3">NPWP</th>
                            <th className="p-3 text-center w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((cust) => (
                            <tr key={cust.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(cust.id)}
                                  onChange={() => handleToggleSelectItem(cust.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleCustomerStatus(cust.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${cust.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={cust.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${cust.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {cust.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-[#F4511E]">
                                <span className="px-2 py-0.5 rounded bg-[#F4511E]/10 border border-[#F4511E]/20">
                                  {cust.kodePrefix}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                    {cust.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-white uppercase tracking-wide">
                                    {cust.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-neutral-300 max-w-xs truncate">
                                {cust.alamat}
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                {cust.telepon || '-'}
                              </td>
                              <td className="p-3 font-mono text-neutral-400">
                                {cust.npwp || '-'}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Edit2}
                                    onClick={() => handleOpenEditCustomer(cust)}
                                    className="text-neutral-300 hover:text-white hover:bg-neutral-800"
                                    title="Edit Customer"
                                  />
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('customer', cust.id, cust.name)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Customer"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((cust) => (
                      <motion.div
                        key={cust.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(cust.id)}
                                  onChange={() => handleToggleSelectItem(cust.id)}
                                  title="Pilih customer"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <Building2 className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleCustomerStatus(cust.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${cust.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={cust.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${cust.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {cust.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded-md bg-[#F4511E]/15 border border-[#F4511E]/30 text-[#FF7043] font-mono font-bold text-xs">
                                {cust.kodePrefix}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-white tracking-wide uppercase line-clamp-1 group-hover:text-[#FF7043] transition-colors">
                              {cust.name}
                            </h3>

                            {/* Address & Contacts */}
                            <div className="mt-2.5 p-2 rounded-lg bg-black/25 border border-white/5 space-y-1.5 text-xs">
                              <div className="flex items-start gap-1.5 text-neutral-300">
                                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 text-[11px] leading-tight">{cust.alamat}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono text-neutral-400">
                                <span>NPWP: {cust.npwp || '-'}</span>
                                <span>Telp: {cust.telepon || '-'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-neutral-500 font-mono">
                              ID: {cust.id}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                icon={Edit2}
                                onClick={() => handleOpenEditCustomer(cust)}
                                className="text-neutral-300 hover:text-white hover:bg-neutral-800"
                                title="Edit Customer"
                              />
                              <Button
                                size="xs"
                                variant="ghost"
                                icon={Trash2}
                                onClick={() => handleAskDelete('customer', cust.id, cust.name)}
                                className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                                title="Hapus Customer"
                              />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 5. DATA BANK */}
          {/* ======================================================== */}
          {currentTab === 'bank' && (() => {
            const filtered = filteredBanks;

            return (
              <div className="space-y-3.5">
                {/* Metric Summary Header Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="master-stat-card p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Mitra Bank</div>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">{banks.length}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Jaringan Kliring BI</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F4511E]">
                      <Landmark className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-emerald p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Bank Aktif</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                        {banks.filter((b) => b.aktif).length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">Siap Transfer Dana</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-sky p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Kode SWIFT</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                        {banks.filter((b) => b.kodeSwift && b.kodeSwift !== '-').length}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Standar Valuta Asing</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-amber p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Kode Kliring</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">100% Valid</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Terverifikasi Sistem</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={Landmark}
                    title="Bank Mitra"
                    description="Daftar bank mitra transaksi, kode kliring BI, dan format SWIFT internasional."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Bank"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua bank"
                              />
                            </th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="namaAlias" label="Nama Alias" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="namaBank" label="Nama Bank Resmi" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="kodeBank" label="Kode Bank" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="kodeSwift" label="Kode SWIFT" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3 text-center w-28">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((bank) => (
                            <tr key={bank.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(bank.id)}
                                  onChange={() => handleToggleSelectItem(bank.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleBankStatus(bank.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${bank.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={bank.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${bank.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {bank.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#F4511E] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                                    {bank.namaAlias.slice(0, 3)}
                                  </div>
                                  <span className="font-bold text-white font-mono tracking-wider">
                                    {bank.namaAlias}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-neutral-300">
                                {bank.namaBank}
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10 font-bold">
                                  {bank.kodeBank}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-neutral-400">
                                {bank.kodeSwift || '-'}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditBank(bank)}
                                    className="p-1.5 rounded-md bg-[#F4511E]/10 hover:bg-[#F4511E] text-[#F4511E] hover:text-white transition-all cursor-pointer border border-[#F4511E]/30"
                                    title="Perbarui Data Bank"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('bank', bank.id, bank.namaAlias || bank.namaBank)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Bank"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((bank) => (
                      <motion.div
                        key={bank.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(bank.id)}
                                  onChange={() => handleToggleSelectItem(bank.id)}
                                  title="Pilih bank"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <Landmark className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleBankStatus(bank.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${bank.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={bank.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${bank.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {bank.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenEditBank(bank)}
                                className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                                title="Perbarui Data Bank"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-bold text-white tracking-wider font-mono">
                                {bank.namaAlias}
                              </h3>
                              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-xs font-mono text-amber-400 font-bold">
                                Kode: {bank.kodeBank}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-300 mt-1 line-clamp-1">{bank.namaBank}</p>

                            <div className="mt-3 p-2 rounded-lg bg-black/25 border border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                              <span>Kode SWIFT</span>
                              <span className="text-white font-semibold">{bank.kodeSwift || '-'}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBank(bank)}
                              className="inline-flex items-center gap-1.5 text-[11px] text-[#FF7043] hover:text-white transition-colors cursor-pointer font-medium"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Ubah Info Bank</span>
                            </button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              onClick={() => handleAskDelete('bank', bank.id, bank.namaAlias || bank.namaBank)}
                              className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                              title="Hapus Bank"
                            />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 6. DATA REKENING BANK */}
          {/* ======================================================== */}
          {currentTab === 'rekening' && (() => {
            const filtered = filteredAccounts;

            return (
              <div className="space-y-3.5">
                {/* Metric Summary Header Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="master-stat-card p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Rekening PT BAS</div>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">{bankAccounts.length}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Kas & Bank Utama</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#F4511E]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-emerald p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Rekening Aktif</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                        {bankAccounts.filter((a) => a.aktif).length}
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">Transaksi Masuk & Keluar</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-sky p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Giro Operasional</div>
                      <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                        {bankAccounts.filter((a) => a.jenisRekening?.toLowerCase().includes('giro')).length}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Arus Kas Perusahaan</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="master-stat-card stat-amber p-3 rounded-xl bg-[#121822]/90 border border-[#1E2938] flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Tabungan & Kas</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                        {bankAccounts.filter((a) => !a.jenisRekening?.toLowerCase().includes('giro')).length}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">Cadangan Likuiditas</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={CreditCard}
                    title="Rekening Bank"
                    description="Daftar rekening bank perusahaan untuk pencairan BKK dan penagihan invoice."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    onAdd={() => setModalOpen(true)}
                    entityLabel="Rekening Bank"
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua rekening"
                              />
                            </th>
                            <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                            <SortHeader field="nomorRekening" label="Nomor Rekening" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="bank" label="Bank & Jenis Rekening" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="rekeningAtasNama" label="Atas Nama" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3">Alias / Label</th>
                            <th className="p-3 text-center w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((acc) => (
                            <tr key={acc.id} className="hover:bg-[#181B1E]/60 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(acc.id)}
                                  onChange={() => handleToggleSelectItem(acc.id)}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleBankAccountStatus(acc.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${acc.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={acc.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${acc.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {acc.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-white text-sm tracking-wider">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono">
                                    {acc.nomorRekening}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(acc.nomorRekening, 'Nomor Rekening')}
                                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Salin Nomor Rekening"
                                  >
                                    {copiedId === acc.nomorRekening ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-neutral-300">
                                <span className="font-semibold text-white">{acc.bank}</span> &bull; {acc.jenisRekening}
                              </td>
                              <td className="p-3 text-neutral-300">
                                {acc.rekeningAtasNama}
                              </td>
                              <td className="p-3 font-mono font-bold text-amber-300">
                                {acc.namaAlias}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Edit2}
                                    onClick={() => handleOpenEditRekening(acc)}
                                    className="text-neutral-300 hover:text-white hover:bg-neutral-800"
                                    title="Edit Rekening"
                                  />
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => handleAskDelete('rekening', acc.id, acc.nomorRekening)}
                                    className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30"
                                    title="Hapus Rekening"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filtered.map((acc) => (
                      <motion.div
                        key={acc.id}
                        variants={cardItemVariants}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="h-full"
                      >
                        <Card
                          hover
                          className="master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 hover:border-[#F4511E]/40 shadow-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                  checked={selectedIds.includes(acc.id)}
                                  onChange={() => handleToggleSelectItem(acc.id)}
                                  title="Pilih rekening"
                                />
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  <CreditCard className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleBankAccountStatus(acc.id)}
                                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${acc.aktif ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                                      }`}
                                    title={acc.aktif ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                                  >
                                    <div
                                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${acc.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                        }`}
                                    />
                                  </button>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {acc.aktif ? 'Aktif' : 'Non-aktif'}
                                  </span>
                                </div>
                              </div>

                              <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                {acc.namaAlias}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-neutral-400">
                              {acc.bank} &bull; {acc.jenisRekening}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <h3 className="text-base font-bold text-white tracking-wider font-mono">
                                {acc.nomorRekening}
                              </h3>
                              <button
                                type="button"
                                onClick={() => handleCopyText(acc.nomorRekening, 'Nomor Rekening')}
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Salin Nomor Rekening"
                              >
                                {copiedId === acc.nomorRekening ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="mt-2.5 p-2 rounded-lg bg-black/25 border border-white/5 text-xs text-neutral-300">
                              <span className="text-[10px] text-neutral-400 block uppercase font-mono">Atas Nama Rekening</span>
                              <span className="font-medium text-white">{acc.rekeningAtasNama}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#1F2937] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-neutral-500 font-mono">
                              ID: {acc.id}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                icon={Edit2}
                                onClick={() => handleOpenEditRekening(acc)}
                                className="text-neutral-300 hover:text-white hover:bg-neutral-800"
                                title="Edit Rekening"
                              />
                              <Button
                                size="xs"
                                variant="ghost"
                                icon={Trash2}
                                onClick={() => handleAskDelete('rekening', acc.id, acc.nomorRekening)}
                                className="text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/20"
                                title="Hapus Rekening"
                              />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 7. DATA PENGGUNA (USERS) */}
          {/* ======================================================== */}
          {currentTab === 'pengguna' && (() => {
            const filtered = filteredUsers;

            return (
              <div className="space-y-3.5">
                {filtered.length === 0 ? (
                  <MasterEmptyState
                    icon={Users}
                    title="Pengguna Sistem"
                    description="Manajemen akun karyawan, role operasional, dan persetujuan akses."
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  />
                ) : viewMode === 'list' ? (
                  <motion.div
                    variants={cardItemVariants}
                    initial="hidden"
                    animate="visible"
                    className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={filtered.length > 0 && filtered.every((it) => selectedIds.includes(it.id))}
                                onChange={() => handleToggleSelectAll(filtered)}
                                title="Pilih semua pengguna"
                              />
                            </th>
                            <SortHeader field="name" label="Pengguna" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <SortHeader field="role" label="Role" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3">Kontak & Unit</th>
                            <SortHeader field="status" label="Status Akun" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                            <th className="p-3">Terdaftar</th>
                            {isSuperAdmin && <th className="p-3 text-center w-36">Otoritas Admin</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#202326]">
                          {filtered.map((user) => {
                            const isPending = !isSuperAdmin && (user.pendingApproval === true || user.isApproved === false || (!user.aktif && user.id?.startsWith('usr-reg-')));
                            const isSuper = user.role === 'superadmin' || user.roleLabel === 'Super Admin';
                            const isUserActive = user.aktif === 1 || user.aktif === true;

                            return (
                              <tr key={user.id} className="hover:bg-[#181B1E]/60 transition-colors">
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                    checked={selectedIds.includes(user.id)}
                                    onChange={() => handleToggleSelectItem(user.id)}
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-xl bg-[#F4511E]/20 border border-[#F4511E]/30 text-[#F4511E] font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-2xs">
                                      {user.name.split(' ').map((n) => n[0]).join('')}
                                    </span>
                                    <div>
                                      <div className="font-bold text-white text-xs">{user.name}</div>
                                      <div className="text-[11px] text-neutral-400 font-mono truncate">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge size="xs" variant={isSuper ? 'primary' : 'neutral'}>
                                    {user.roleLabel || user.role}
                                  </Badge>
                                </td>
                                <td className="p-3 font-mono text-neutral-300">
                                  <div>{user.phone || '-'}</div>
                                  {(user.gender || user.birth_date) && (
                                    <div className="text-[10px] text-neutral-400">
                                      {[user.gender, user.birth_date ? `Lahir: ${user.birth_date}` : null].filter(Boolean).join(' • ')}
                                    </div>
                                  )}
                                  {user.branch && <div className="text-[10px] text-neutral-500">{user.branch}</div>}
                                </td>
                                <td className="p-3">
                                  {isPending ? (
                                    <Badge size="xs" variant="warning" dot className="animate-pulse">
                                      {language === 'en' ? 'Pending Approval' : 'Menunggu Persetujuan'}
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isSuper}
                                        onClick={async () => {
                                          if (isSuper) {
                                            addToast('Akun Super Admin utama tidak dapat dinonaktifkan.', 'warning');
                                            return;
                                          }
                                          const res = await toggleUserStatus(user.id);
                                          if (res?.success) {
                                            addToast(
                                              `Status akun ${user.name} diubah menjadi ${res.aktif ? 'Aktif' : 'Nonaktif'}.`,
                                              'info'
                                            );
                                          }
                                        }}
                                        className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isSuper
                                          ? 'opacity-60 cursor-not-allowed bg-[#F4511E]'
                                          : isUserActive
                                            ? 'bg-[#F4511E] cursor-pointer'
                                            : 'bg-[#2A2E33] cursor-pointer'
                                          }`}
                                        title={
                                          isSuper
                                            ? 'Akun Super Admin tidak dapat dinonaktifkan'
                                            : isUserActive
                                              ? 'Klik untuk non-aktifkan'
                                              : 'Klik untuk aktifkan'
                                        }
                                      >
                                        <div
                                          className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isUserActive ? 'translate-x-3.5' : 'translate-x-0'
                                            }`}
                                        />
                                      </button>
                                      <span className="text-[11px] font-mono text-neutral-400">
                                        {isUserActive ? 'Aktif' : 'Non-aktif'}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-neutral-400">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : 'Gresik Hub'}
                                </td>
                                {isSuperAdmin && (
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isPending && (
                                        <Button
                                          size="xs"
                                          variant="primary"
                                          icon={CheckCircle2}
                                          onClick={async () => {
                                            const res = await approveUser(user.id);
                                            if (res?.success) {
                                              addToast(`Akun Admin ${user.name} berhasil disetujui!`, 'success');
                                            } else {
                                              addToast(res?.message || 'Gagal menyetujui akun.', 'error');
                                            }
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1"
                                        >
                                          Setujui
                                        </Button>
                                      )}

                                      {/* Ubah Kata Sandi */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPasswordModal(user)}
                                        className="p-1.5 rounded-lg bg-[#1E242C] hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 border border-[#2B3542] hover:border-amber-500/40 transition-all cursor-pointer shadow-2xs"
                                        title="Ubah Kata Sandi Akun"
                                      >
                                        <Key className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Edit Profil & Peran */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditUserModal(user)}
                                        className="p-1.5 rounded-lg bg-[#1E242C] hover:bg-[#F4511E]/20 text-neutral-400 hover:text-[#F4511E] border border-[#2B3542] hover:border-[#F4511E]/40 transition-all cursor-pointer shadow-2xs"
                                        title="Edit Profil & Peran"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Hapus Akun (Kecuali Super Admin Utama) */}
                                      {user.id !== 'usr-1' && user.email !== 'superadmin@ptbas.co.id' && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDeleteUser(user)}
                                          className="p-1.5 rounded-lg bg-[#1E242C] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-[#2B3542] hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                                          title="Hapus Akun"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                  >
                    {filtered.map((user) => {
                      const isPending = !isSuperAdmin && (user.pendingApproval === true || user.isApproved === false || (!user.aktif && user.id?.startsWith('usr-reg-')));
                      const isSuper = user.role === 'superadmin' || user.roleLabel === 'Super Admin';
                      const isUserActive = user.aktif === 1 || user.aktif === true;

                      return (
                        <motion.div
                          key={user.id}
                          variants={cardItemVariants}
                          whileHover={{ y: -3, transition: { duration: 0.15 } }}
                          className="h-full"
                        >
                          <Card
                            hover
                            className={`master-data-card p-4 flex flex-col justify-between h-full border-[#1E2938] bg-[#121822]/90 shadow-xs transition-all ${isPending ? 'border-amber-500/50 bg-amber-950/15 ring-1 ring-amber-500/20' : 'hover:border-[#F4511E]/40'
                              }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                    checked={selectedIds.includes(user.id)}
                                    onChange={() => handleToggleSelectItem(user.id)}
                                    title="Pilih pengguna"
                                  />
                                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F4511E]/20 to-[#FF8A65]/10 border border-[#F4511E]/30 text-[#F4511E] font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                                    {user.name.split(' ').map((n) => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge size="xs" variant={isSuper ? 'primary' : 'neutral'}>
                                    {user.roleLabel || user.role}
                                  </Badge>
                                  {!isPending && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={isSuper}
                                        onClick={async () => {
                                          if (isSuper) {
                                            addToast('Akun Super Admin tidak dapat dinonaktifkan.', 'warning');
                                            return;
                                          }
                                          const res = await toggleUserStatus(user.id);
                                          if (res?.success) {
                                            addToast(
                                              `Status akun ${user.name} diubah menjadi ${res.aktif ? 'Aktif' : 'Nonaktif'}.`,
                                              'info'
                                            );
                                          }
                                        }}
                                        className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isSuper
                                          ? 'opacity-60 cursor-not-allowed bg-[#F4511E]'
                                          : isUserActive
                                            ? 'bg-[#F4511E] cursor-pointer'
                                            : 'bg-[#2A2E33] cursor-pointer'
                                          }`}
                                        title={
                                          isSuper
                                            ? 'Akun Super Admin tidak dapat dinonaktifkan'
                                            : isUserActive
                                              ? 'Klik untuk non-aktifkan'
                                              : 'Klik untuk aktifkan'
                                        }
                                      >
                                        <div
                                          className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isUserActive ? 'translate-x-3.5' : 'translate-x-0'
                                            }`}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-sm font-bold text-white line-clamp-1">{user.name}</h3>
                              <p className="text-xs text-neutral-400 font-mono mt-0.5 truncate">{user.email}</p>
                              <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.phone || '-'}</p>
                              {(user.gender || user.birth_date) && (
                                <p className="text-[10px] text-neutral-400 font-mono mt-1">
                                  {[user.gender, user.birth_date ? `Lahir: ${user.birth_date}` : null].filter(Boolean).join(' • ')}
                                </p>
                              )}
                              {user.branch && (
                                <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1.5 font-mono px-2 py-0.5 rounded bg-black/25 border border-white/5">
                                  <MapPin className="w-3 h-3 text-neutral-500" />
                                  <span className="truncate">{user.branch}</span>
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-[#1F2937] space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                {isPending ? (
                                  <Badge size="xs" variant="warning" dot className="animate-pulse">
                                    {language === 'en' ? 'Pending Approval' : 'Menunggu Persetujuan'}
                                  </Badge>
                                ) : (
                                  <Badge size="xs" variant={isUserActive ? 'success' : 'neutral'} dot>
                                    {isUserActive ? 'Aktif' : 'Non-aktif'}
                                  </Badge>
                                )}
                                <span className="font-mono text-[10px] text-neutral-500">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : 'Gresik Hub'}
                                </span>
                              </div>

                              {/* Super Admin Action Controls */}
                              {isSuperAdmin && (
                                <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-[#1C2024]">
                                  {isPending ? (
                                    <Button
                                      size="xs"
                                      variant="primary"
                                      icon={CheckCircle2}
                                      onClick={async () => {
                                        const res = await approveUser(user.id);
                                        if (res?.success) {
                                          addToast(`Akun Admin ${user.name} berhasil disetujui!`, 'success');
                                        } else {
                                          addToast(res?.message || 'Gagal menyetujui akun.', 'error');
                                        }
                                      }}
                                      className="justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1"
                                    >
                                      Setujui
                                    </Button>
                                  ) : (
                                    <span className="text-[10px] font-mono text-neutral-500">
                                      ID: {user.id}
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPasswordModal(user)}
                                      className="px-2 py-1 rounded-lg bg-[#1E242C] hover:bg-amber-500/20 text-neutral-300 hover:text-amber-400 border border-[#2B3542] hover:border-amber-500/40 transition-all cursor-pointer text-[10px] font-mono flex items-center gap-1 shadow-2xs"
                                      title="Ubah Kata Sandi Akun"
                                    >
                                      <Key className="w-3 h-3 text-amber-400" />
                                      <span>Password</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUserModal(user)}
                                      className="p-1.5 rounded-lg bg-[#1E242C] hover:bg-[#F4511E]/20 text-neutral-400 hover:text-[#F4511E] border border-[#2B3542] hover:border-[#F4511E]/40 transition-all cursor-pointer shadow-2xs"
                                      title="Edit Profil & Peran"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {user.id !== 'usr-1' && user.email !== 'superadmin@ptbas.co.id' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDeleteUser(user)}
                                        className="p-1.5 rounded-lg bg-[#1E242C] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-[#2B3542] hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                                        title="Hapus Akun"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* 8. DATA MATA UANG */}
          {/* ======================================================== */}
          {currentTab === 'mata-uang' && (
            <motion.div
              key={`mata-uang-${viewMode}`}
              variants={cardItemVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredCurrencies.length === 0 ? (
                <MasterEmptyState
                  icon={Coins}
                  title="Mata Uang"
                  description="Konfigurasi mata uang acuan buku besar akuntansi PT BAS."
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  onReset={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  onAdd={() => setModalOpen(true)}
                  entityLabel="Mata Uang"
                />
              ) : viewMode === 'list' ? (
                /* ======================================================== */
                /* TAMPILAN LIST: BARIS LIST TABEL LENGKAP */
                /* ======================================================== */
                <motion.div
                  variants={cardItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="master-table-container bg-[#131517] border border-[#24282C] rounded-xl overflow-hidden shadow-xs"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#181B1E] text-neutral-400 font-semibold border-b border-[#24282C] font-mono text-[11px]">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                              checked={filteredCurrencies.length > 0 && filteredCurrencies.every((it) => selectedIds.includes(it.id))}
                              onChange={() => handleToggleSelectAll(filteredCurrencies)}
                              title="Pilih semua mata uang"
                            />
                          </th>
                          <SortHeader field="status" label="Status" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} className="w-28" />
                          <SortHeader field="code" label="Mata Uang & Simbol" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                          <SortHeader field="name" label="Nama Mata Uang" currentField={sortField} currentOrder={sortOrder} onSort={handleToggleSort} />
                          <th className="p-3">Kode ISO 4217</th>
                          <th className="p-3">Pemisah Ribuan</th>
                          <th className="p-3">Presisi Kubikasi</th>
                          <th className="p-3">Perhitungan Pajak</th>
                          <th className="p-3">Lingkup Modul Terintegrasi</th>
                          <th className="p-3 text-center w-32">Basis Akuntansi</th>
                          <th className="p-3 text-center w-20">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202326]">
                        {filteredCurrencies.map((curr) => (
                          <tr key={curr.id} className="hover:bg-[#181B1E]/60 transition-colors">
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer"
                                checked={selectedIds.includes(curr.id)}
                                onChange={() => handleToggleSelectItem(curr.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={curr.isBase}
                                  onClick={() => {
                                    if (curr.isBase) {
                                      addToast('Mata uang basis (IDR) merupakan acuan pembukuan dan tidak dapat dinonaktifkan.', 'warning');
                                      return;
                                    }
                                    toggleCurrencyStatus(curr.id);
                                  }}
                                  className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${curr.isBase
                                    ? 'opacity-60 cursor-not-allowed bg-[#F4511E]'
                                    : curr.aktif
                                      ? 'bg-[#F4511E] cursor-pointer'
                                      : 'bg-[#2A2E33] cursor-pointer'
                                    }`}
                                  title={
                                    curr.isBase
                                      ? 'Mata uang basis (IDR) tidak dapat dinonaktifkan'
                                      : curr.aktif
                                        ? 'Klik untuk non-aktifkan'
                                        : 'Klik untuk aktifkan'
                                  }
                                >
                                  <div
                                    className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${curr.aktif ? 'translate-x-3.5' : 'translate-x-0'
                                      }`}
                                  />
                                </button>
                                <span className="text-[11px] font-mono text-neutral-400">
                                  {curr.aktif ? 'Aktif' : 'Non-aktif'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${curr.isBase
                                  ? 'bg-[#F4511E]/15 border border-[#F4511E]/30 text-[#F4511E]'
                                  : curr.code === 'USD'
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                                  }`}>
                                  {curr.symbol}
                                </div>
                                <div>
                                  <div className="font-mono font-bold text-white text-sm">{curr.code} ({curr.symbol})</div>
                                  <div className="text-[10px] text-neutral-400 font-mono">{curr.englishName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-white">{curr.name}</div>
                              <div className="text-[11px] text-neutral-400">{curr.country}</div>
                            </td>
                            <td className="p-3 font-mono text-neutral-300">
                              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5 font-semibold text-white">
                                {curr.code} ({curr.isoCode})
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              <span className="text-amber-400 font-medium">{curr.pemisahRibuan}</span>
                              <div className="text-[10px] text-neutral-400">Format: {curr.formatSample}</div>
                            </td>
                            <td className="p-3 font-mono">
                              <span className="text-emerald-400 font-medium">{curr.presisi}</span>
                              <div className="text-[10px] text-neutral-400">Format: {curr.formatPresisi}</div>
                            </td>
                            <td className="p-3 font-mono text-xs">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                                {curr.pajak}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {curr.lingkupModul?.slice(0, 3).map((mod, mi) => (
                                  <span key={mi} className="px-1.5 py-0.5 rounded bg-[#1C2430] text-neutral-300 text-[10px] font-mono border border-white/5">
                                    {mod}
                                  </span>
                                ))}
                                {(curr.lingkupModul?.length || 0) > 3 && (
                                  <span className="text-[10px] text-neutral-500 font-mono self-center">
                                    +{(curr.lingkupModul?.length || 0) - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {curr.isBase ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Basis Utama
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-neutral-400 bg-neutral-800/50 border border-neutral-700">
                                  Valas Pendukung
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="xs"
                                variant="ghost"
                                icon={Trash2}
                                disabled={curr.isBase}
                                onClick={() => {
                                  if (curr.isBase) {
                                    addToast('Mata uang basis (IDR) tidak dapat dihapus karena merupakan acuan buku besar.', 'warning');
                                    return;
                                  }
                                  handleAskDelete('mata-uang', curr.id, `${curr.code} - ${curr.name}`);
                                }}
                                className={curr.isBase
                                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                                  : 'text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30 cursor-pointer'}
                                title={curr.isBase ? 'Mata uang basis IDR tidak dapat dihapus' : `Hapus mata uang ${curr.code}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                /* ======================================================== */
                /* TAMPILAN GRID: KARTU MULTI-KOLOM & WIDGET FITUR LENGKAP */
                /* ======================================================== */
                <div className="space-y-5">
                  {/* Grid 3 Kartu Mata Uang */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCurrencies.map((curr) => (
                      <motion.div
                        key={curr.id}
                        variants={cardItemVariants}
                        className={`master-data-card p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${curr.isBase
                          ? 'bg-gradient-to-br from-[#141B26]/95 via-[#121822]/90 to-[#16181F]/90 border-[#F4511E]/40 shadow-lg shadow-[#F4511E]/5 ring-1 ring-[#F4511E]/20'
                          : selectedIds.includes(curr.id)
                            ? 'bg-[#121822]/95 border-[#F4511E] ring-1 ring-[#F4511E]/50 shadow-md shadow-[#F4511E]/10'
                            : 'bg-[#121822]/90 border-[#1E2938] hover:border-[#2C3B4E]'
                          }`}
                      >
                        <div>
                          {/* Top Bar: Checkbox, Icon, Badges, & Switch */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs rounded border-neutral-600 checked:border-[#F4511E] checked:bg-[#F4511E] cursor-pointer shrink-0"
                                checked={selectedIds.includes(curr.id)}
                                onChange={() => handleToggleSelectItem(curr.id)}
                                title={`Pilih mata uang ${curr.code}`}
                              />
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shadow-inner ${curr.isBase
                                ? 'bg-gradient-to-br from-[#F4511E]/25 to-amber-500/10 border border-[#F4511E]/40 text-[#F4511E]'
                                : curr.code === 'USD'
                                  ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/40 text-emerald-400'
                                  : 'bg-gradient-to-br from-sky-500/25 to-indigo-500/10 border border-sky-500/40 text-sky-400'
                                }`}>
                                {curr.symbol}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-base font-bold text-white tracking-wide">
                                    {curr.code}
                                  </span>
                                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-neutral-400 border border-white/5">
                                    ISO {curr.isoCode}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-neutral-200 mt-0.5">
                                  {curr.name}
                                </div>
                              </div>
                            </div>

                            {/* Status Toggle Button */}
                            <div className="flex flex-col items-end gap-1">
                              <button
                                type="button"
                                disabled={curr.isBase}
                                onClick={() => {
                                  if (curr.isBase) {
                                    addToast('Mata uang basis (IDR) merupakan acuan pembukuan dan tidak dapat dinonaktifkan.', 'warning');
                                    return;
                                  }
                                  toggleCurrencyStatus(curr.id);
                                }}
                                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${curr.isBase
                                  ? 'opacity-60 cursor-not-allowed bg-[#F4511E]'
                                  : curr.aktif
                                    ? 'bg-[#F4511E] cursor-pointer'
                                    : 'bg-[#2A2E33] cursor-pointer'
                                  }`}
                                title={
                                  curr.isBase
                                    ? 'Mata uang basis (IDR) tidak dapat dinonaktifkan'
                                    : curr.aktif
                                      ? 'Klik untuk non-aktifkan'
                                      : 'Klik untuk aktifkan'
                                }
                              >
                                <div
                                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${curr.aktif ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                              </button>
                              <span className={`text-[10px] font-mono ${curr.aktif ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                {curr.aktif ? 'Aktif' : 'Non-aktif'}
                              </span>
                            </div>
                          </div>

                          {/* Currency Tag */}
                          <div className="mb-3">
                            {curr.isBase ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#F4511E]/15 text-[#FF7043] border border-[#F4511E]/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4511E] animate-pulse" />
                                MATA UANG BASIS BUKU BESAR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-neutral-400 bg-[#171E28] border border-[#232F3E]">
                                <Globe className="w-3 h-3 text-neutral-400" />
                                VALUTA ASING PENDUKUNG (VALAS)
                              </span>
                            )}
                          </div>

                          {/* Deskripsi */}
                          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                            {curr.deskripsi}
                          </p>

                          {/* Detail Format Box */}
                          <div className="p-3 bg-black/35 rounded-xl border border-white/5 space-y-2 text-xs font-mono mb-4">
                            <div className="flex items-center justify-between text-neutral-400">
                              <span>Pemisah Ribuan:</span>
                              <span className="text-amber-400 font-semibold">{curr.pemisahRibuan}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400 pt-1.5 border-t border-white/5">
                              <span>Pemisah Desimal:</span>
                              <span className="text-neutral-200 font-semibold">{curr.pemisahDesimal}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400 pt-1.5 border-t border-white/5">
                              <span>Contoh Tampilan:</span>
                              <span className="text-white font-bold">{curr.formatSample}</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-400 pt-1.5 border-t border-white/5">
                              <span>Ketentuan Pajak:</span>
                              <span className="text-sky-300 font-medium">{curr.pajak}</span>
                            </div>
                          </div>
                        </div>

                        {/* Integrated Modules Footer & Actions */}
                        <div className="pt-3 border-t border-white/5 flex items-end justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5">
                              Modul Terintegrasi:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {curr.lingkupModul?.map((mod, mi) => (
                                <span key={mi} className="px-2 py-0.5 rounded-md bg-[#161D27] text-neutral-300 text-[10px] font-mono border border-white/5">
                                  {mod}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Tombol Hapus per Item */}
                          <div className="shrink-0 flex items-center">
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              disabled={curr.isBase}
                              onClick={() => {
                                if (curr.isBase) {
                                  addToast('Mata uang basis (IDR) tidak dapat dihapus karena acuan buku besar!', 'warning');
                                  return;
                                }
                                handleAskDelete('mata-uang', curr.id, `${curr.code} - ${curr.name}`);
                              }}
                              className={curr.isBase
                                ? 'opacity-30 cursor-not-allowed text-neutral-500'
                                : 'text-[#F4511E] hover:bg-[#F4511E]/10 border border-[#F4511E]/30 cursor-pointer'}
                              title={curr.isBase ? 'Mata uang basis IDR tidak dapat dihapus' : `Hapus mata uang ${curr.code}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH SUPPLIER */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'supplier'}
        onClose={() => setModalOpen(false)}
        title="Tambah Supplier Baru"
        subtitle="Daftarkan vendor tambang material & rekening bank penerima"
      >
        <form onSubmit={handleSubmitSupplier} className="p-4 space-y-3.5">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Supplier
            </div>

            <Input
              label="Nama Supplier"
              icon={User}
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value.toUpperCase() })}
              placeholder="Contoh: PT SOYO APIK, PAK TEGUH"
              className="uppercase"
            />

            <Input
              label="ID Supplier Program Keuangan"
              icon={Hash}
              required
              value={supplierForm.idProgram}
              onChange={(e) => setSupplierForm({ ...supplierForm, idProgram: e.target.value })}
              placeholder="Contoh: SUP-009"
              className="font-mono"
            />

            <Input
              label="Nama Penerima"
              icon={User}
              required
              value={supplierForm.penerima}
              onChange={(e) => setSupplierForm({ ...supplierForm, penerima: e.target.value.toUpperCase() })}
              placeholder="Nama kontak / pemilik rekening"
              className="uppercase"
            />

            <Input
              label="Nomor Telepon Supplier"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={supplierForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setSupplierForm({ ...supplierForm, telepon: e.target.value.replace(/\D/g, '') })}
              placeholder="0812-xxxx-xxxx"
              className="font-mono"
            />

            <div className="flex items-center justify-between bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2.5">
              <span className="text-xs font-semibold text-white">PKP</span>
              <button
                type="button"
                onClick={() => setSupplierForm({ ...supplierForm, pkp: !supplierForm.pkp })}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${supplierForm.pkp ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${supplierForm.pkp ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#24282C]">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Rekening Pembayaran
            </div>

            <Select
              label="Pilih Bank"
              icon={Landmark}
              value={supplierForm.bank}
              onChange={(e) => setSupplierForm({ ...supplierForm, bank: e.target.value })}
            >
              {banks && banks.length > 0 ? (
                banks.map((b) => {
                  const val = b.namaAlias
                    ? `${b.namaAlias.toUpperCase()} - ${b.namaBank.toUpperCase()}`
                    : b.namaBank.toUpperCase();
                  return (
                    <option key={b.id} value={val}>
                      {val}
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="BCA - BANK CENTRAL ASIA">BCA - BANK CENTRAL ASIA</option>
                  <option value="MANDIRI - BANK MANDIRI">MANDIRI - BANK MANDIRI</option>
                  <option value="BRI - BANK RAKYAT INDONESIA">BRI - BANK RAKYAT INDONESIA</option>
                  <option value="BNI - BANK NEGARA INDONESIA">BNI - BANK NEGARA INDONESIA</option>
                </>
              )}
            </Select>

            <Input
              label="Nomor Rekening"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={supplierForm.noRekening}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setSupplierForm({ ...supplierForm, noRekening: numericOnly });
              }}
              placeholder="Contoh: 8295019281 (Hanya angka)"
              className="font-mono"
            />

            <Input
              label="Rekening Atas Nama"
              icon={User}
              required
              value={supplierForm.rekeningAtasNama}
              onChange={(e) =>
                setSupplierForm({ ...supplierForm, rekeningAtasNama: e.target.value.toUpperCase() })
              }
              className="uppercase"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: PERBARUI DATA SUPPLIER */}
      {/* ======================================================== */}
      <Modal
        isOpen={editSupplierModal}
        onClose={() => {
          setEditSupplierModal(false);
          setSelectedSupplier(null);
        }}
        title="Perbarui Data Supplier"
        subtitle="Edit parameter data vendor & rekening bank penerima"
      >
        <form onSubmit={handleUpdateSupplier} className="p-4 space-y-3.5">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Supplier
            </div>

            <Input
              label="Nama Supplier"
              icon={User}
              required
              value={editSupplierForm.name}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, name: e.target.value.toUpperCase() })
              }
              className="font-mono font-bold uppercase"
              placeholder="Contoh: UKHY DIAN"
            />

            <Input
              label="ID Supplier Program Keuangan"
              icon={Hash}
              required
              value={editSupplierForm.idProgram}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, idProgram: e.target.value })
              }
              placeholder="Contoh: 00"
              className="font-mono"
            />

            <Input
              label="Nama Penerima"
              icon={User}
              required
              value={editSupplierForm.penerima}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, penerima: e.target.value.toUpperCase() })
              }
              placeholder="Contoh: PAK UKHY"
              className="uppercase"
            />

            <Input
              label="Nomor Telepon Supplier"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={editSupplierForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setEditSupplierForm({
                  ...editSupplierForm,
                  telepon: e.target.value.replace(/\D/g, ''),
                })
              }
              placeholder="Nomor Telepon Supplier"
              className="font-mono"
            />

            <div className="flex items-center justify-between bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2.5">
              <span className="text-xs font-semibold text-white">PKP</span>
              <button
                type="button"
                onClick={() =>
                  setEditSupplierForm({ ...editSupplierForm, pkp: !editSupplierForm.pkp })
                }
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${editSupplierForm.pkp ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${editSupplierForm.pkp ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#24282C]">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Detail Rekening Pembayaran
            </div>

            <Select
              label="Pilih Bank"
              icon={Landmark}
              required
              value={editSupplierForm.bank}
              onChange={(e) =>
                setEditSupplierForm({ ...editSupplierForm, bank: e.target.value })
              }
            >
              {banks && banks.length > 0 ? (
                banks.map((b) => {
                  const val = b.namaAlias
                    ? `${b.namaAlias.toUpperCase()} - ${b.namaBank.toUpperCase()}`
                    : b.namaBank.toUpperCase();
                  return (
                    <option key={b.id} value={val}>
                      {val}
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="BCA - BANK CENTRAL ASIA">BCA - BANK CENTRAL ASIA</option>
                  <option value="MANDIRI - BANK MANDIRI">MANDIRI - BANK MANDIRI</option>
                  <option value="BRI - BANK RAKYAT INDONESIA">BRI - BANK RAKYAT INDONESIA</option>
                  <option value="BNI - BANK NEGARA INDONESIA">BNI - BANK NEGARA INDONESIA</option>
                </>
              )}
            </Select>

            <Input
              label="Nomor Rekening"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={editSupplierForm.noRekening}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setEditSupplierForm({ ...editSupplierForm, noRekening: numericOnly });
              }}
              placeholder="Contoh: 6150832452"
              className="font-mono font-bold"
            />

            <Input
              label="Rekening Atas Nama"
              icon={User}
              required
              value={editSupplierForm.rekeningAtasNama}
              onChange={(e) =>
                setEditSupplierForm({
                  ...editSupplierForm,
                  rekeningAtasNama: e.target.value.toUpperCase(),
                })
              }
              placeholder="Contoh: UKHY DIAN"
              className="uppercase"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditSupplierModal(false);
                setSelectedSupplier(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH MATERIAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'material'}
        onClose={() => setModalOpen(false)}
        title="Tambah Material Baru"
        subtitle="Konfigurasi material tambang, tarif beli/jual, dan akun COA"
      >
        <form onSubmit={handleSubmitMaterial} className="p-4 space-y-3">
          <Input
            label="Nama Material"
            required
            value={materialForm.name}
            onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value.toUpperCase() })}
            placeholder="Contoh: SIRTU AYAK, LIMESTONE"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga Beli (Supplier)"
              type="number"
              required
              value={materialForm.beli}
              onChange={(e) => setMaterialForm({ ...materialForm, beli: e.target.value })}
              className="font-mono"
            />
            <Input
              label="Harga Jual (Customer)"
              type="number"
              required
              value={materialForm.jual}
              onChange={(e) => setMaterialForm({ ...materialForm, jual: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Kategori Material"
              value={materialForm.category}
              onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
            >
              <option value="Curah">Curah (Tarif PPH 2.0%)</option>
              <option value="Padat">Padat (Tarif PPH 2.65%)</option>
              <option value="Jasa">Jasa Angkut</option>
            </Select>

            <Select
              label="Satuan"
              value={materialForm.satuan}
              onChange={(e) => setMaterialForm({ ...materialForm, satuan: e.target.value })}
            >
              <option value="m3">m³ (Kubik)</option>
              <option value="ton">Ton</option>
              <option value="rit">Rit</option>
              <option value="m2">m²</option>
            </Select>
          </div>

          <Input
            label="COA"
            value={materialForm.coa}
            onChange={(e) => setMaterialForm({ ...materialForm, coa: e.target.value })}
            className="font-mono"
          />

          <Input
            label="COA Piutang Dagang"
            value={materialForm.coaPiutang}
            onChange={(e) => setMaterialForm({ ...materialForm, coaPiutang: e.target.value })}
            className="font-mono"
          />

          <Input
            label="COA Pendapatan"
            value={materialForm.coaPendapatan}
            onChange={(e) => setMaterialForm({ ...materialForm, coaPendapatan: e.target.value })}
            className="font-mono"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: PERBARUI DATA MATERIAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={editMaterialModal}
        onClose={() => {
          setEditMaterialModal(false);
          setSelectedMaterial(null);
        }}
        title="Perbarui Data Material"
        subtitle="Edit parameter harga, COA, dan status material"
      >
        <form onSubmit={handleUpdateMaterial} className="p-4 space-y-3.5">
          <Input
            label="Nama Material"
            disabled
            value={editMaterialForm.name}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, name: e.target.value.toUpperCase() })
            }
            className="font-mono font-bold uppercase cursor-not-allowed opacity-75"
          />

          <Input
            label="Harga Beli"
            type="number"
            step="0.1"
            required
            rightElement="IDR"
            value={editMaterialForm.beli}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, beli: e.target.value })
            }
            className="font-mono font-bold"
          />

          <Input
            label="Harga Jual"
            type="number"
            step="0.1"
            required
            rightElement="IDR"
            value={editMaterialForm.jual}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, jual: e.target.value })
            }
            className="font-mono font-bold"
          />

          <Input
            label="COA Material"
            value={editMaterialForm.coa}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coa: e.target.value })
            }
            placeholder="COA Material"
            className="font-mono"
          />

          <Input
            label="COA Piutang Dagang"
            value={editMaterialForm.coaPiutang}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coaPiutang: e.target.value })
            }
            placeholder="COA Piutang Dagang"
            className="font-mono"
          />

          <Input
            label="COA Pendapatan"
            value={editMaterialForm.coaPendapatan}
            onChange={(e) =>
              setEditMaterialForm({ ...editMaterialForm, coaPendapatan: e.target.value })
            }
            placeholder="COA Pendapatan"
            className="font-mono"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Material <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusMaterialEdit"
                  checked={editMaterialForm.aktif === true}
                  onChange={() =>
                    setEditMaterialForm({ ...editMaterialForm, aktif: true })
                  }
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span
                  className={
                    editMaterialForm.aktif ? 'text-white font-medium' : 'text-neutral-400'
                  }
                >
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusMaterialEdit"
                  checked={editMaterialForm.aktif === false}
                  onChange={() =>
                    setEditMaterialForm({ ...editMaterialForm, aktif: false })
                  }
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span
                  className={
                    !editMaterialForm.aktif ? 'text-white font-medium' : 'text-neutral-400'
                  }
                >
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditMaterialModal(false);
                setSelectedMaterial(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH ARMADA */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'armada'}
        onClose={() => setModalOpen(false)}
        title="Tambah Armada"
        subtitle="Pencatatan nomor polisi dan dimensi bak dump truck"
      >
        <form onSubmit={handleSubmitArmada} className="p-4 space-y-3">
          <Input
            label="Nomor Polisi (TNKB)"
            icon={Hash}
            required
            value={armadaForm.nopol}
            onChange={(e) =>
              setArmadaForm({ ...armadaForm, nopol: e.target.value.toUpperCase() })
            }
            placeholder="Contoh: W 9821 UB"
            className="font-mono font-bold uppercase"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Dimensi Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Panjang (P)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={armadaForm.panjangCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setArmadaForm({ ...armadaForm, panjangCm: clean });
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Lebar (L)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={armadaForm.lebarCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setArmadaForm({ ...armadaForm, lebarCm: clean });
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Tinggi (T)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={armadaForm.tinggiCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setArmadaForm({ ...armadaForm, tinggiCm: clean });
                }}
                className="font-mono font-bold"
              />
            </div>

            <div className="mt-1.5 text-xs text-amber-400 font-mono">
              Kapasitas Kubikasi Otomatis:{' '}
              {(((Number(armadaForm.panjangCm) || 0) * (Number(armadaForm.lebarCm) || 0) * (Number(armadaForm.tinggiCm) || 0)) / 1000000).toFixed(
                2
              )}{' '}
              m³
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraan"
                  checked={armadaForm.aktif === true}
                  onChange={() => setArmadaForm({ ...armadaForm, aktif: true })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={armadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraan"
                  checked={armadaForm.aktif === false}
                  onChange={() => setArmadaForm({ ...armadaForm, aktif: false })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={!armadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2B3C]/50 space-y-3">
            <p className="text-[11px] font-medium text-neutral-400">Detail Lainnya (opsional)</p>
            <Select
              label="Merk Kendaraan"
              icon={Info}
              value={armadaForm.merk}
              onChange={(e) => setArmadaForm({ ...armadaForm, merk: e.target.value })}
            >
              <option value="FAW">FAW</option>
              <option value="Hino">Hino</option>
              <option value="Isuzu">Isuzu</option>
              <option value="Mitsubishi">Mitsubishi</option>
              <option value="Nissan UD">Nissan UD</option>
              <option value="Scania">Scania</option>
              <option value="Tata">Tata</option>
              <option value="Toyota">Toyota</option>
              <option value="Volvo">Volvo</option>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Nomor Rangka / VIN"
                icon={Hash}
                value={armadaForm.vin}
                onChange={(e) => setArmadaForm({ ...armadaForm, vin: e.target.value })}
                className="font-mono"
              />
              <Input
                label="Nomor Mesin"
                icon={Hash}
                value={armadaForm.mesin}
                onChange={(e) => setArmadaForm({ ...armadaForm, mesin: e.target.value })}
                className="font-mono"
              />
            </div>

            <Input
              label="Tahun Pembuatan"
              icon={Calendar}
              type="number"
              placeholder="Contoh: 2024"
              value={armadaForm.tahun}
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                setArmadaForm({ ...armadaForm, tahun: clean });
              }}
              className="font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Armada
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: PERBARUI DATA ARMADA */}
      {/* ======================================================== */}
      <Modal
        isOpen={editArmadaModal}
        onClose={() => {
          setEditArmadaModal(false);
          setSelectedArmada(null);
        }}
        title="Perbarui Data Armada"
        subtitle="Edit parameter dimensi bak, status operasional, dan data kendaraan"
      >
        <form onSubmit={handleUpdateArmada} className="p-4 space-y-3">
          <Input
            label="Nomor Polisi (TNKB)"
            icon={Hash}
            required
            value={editArmadaForm.nopol}
            onChange={(e) =>
              setEditArmadaForm({ ...editArmadaForm, nopol: e.target.value.toUpperCase() })
            }
            placeholder="Contoh: 21606"
            className="font-mono font-bold uppercase"
          />

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Dimensi Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Panjang (P)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={editArmadaForm.panjangCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setEditArmadaForm({ ...editArmadaForm, panjangCm: clean });
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Lebar (L)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={editArmadaForm.lebarCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setEditArmadaForm({ ...editArmadaForm, lebarCm: clean });
                }}
                className="font-mono font-bold"
              />
              <Input
                label="Tinggi (T)"
                type="number"
                required
                rightElement="cm"
                placeholder="0"
                value={editArmadaForm.tinggiCm}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                  setEditArmadaForm({ ...editArmadaForm, tinggiCm: clean });
                }}
                className="font-mono font-bold"
              />
            </div>

            <div className="mt-1.5 text-xs text-amber-400 font-mono">
              Kapasitas Kubikasi Otomatis:{' '}
              {(((Number(editArmadaForm.panjangCm) || 0) * (Number(editArmadaForm.lebarCm) || 0) * (Number(editArmadaForm.tinggiCm) || 0)) / 1000000).toFixed(
                2
              )}{' '}
              m³
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">
              Status Kendaraan <span className="text-[#F4511E] font-bold">*</span>
            </label>
            <div className="border border-[#1E2B3C] bg-[#0E1520] rounded-md px-4 py-2.5 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraanEdit"
                  checked={editArmadaForm.aktif === true}
                  onChange={() => setEditArmadaForm({ ...editArmadaForm, aktif: true })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={editArmadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="statusKendaraanEdit"
                  checked={editArmadaForm.aktif === false}
                  onChange={() => setEditArmadaForm({ ...editArmadaForm, aktif: false })}
                  className="accent-[#F4511E] w-4 h-4 cursor-pointer"
                />
                <span className={!editArmadaForm.aktif ? 'text-white font-medium' : 'text-neutral-400'}>
                  Tidak Aktif
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2B3C]/50 space-y-3">
            <p className="text-[11px] font-medium text-neutral-400">Detail Lainnya (opsional)</p>
            <Select
              label="Merk Kendaraan"
              icon={Info}
              value={editArmadaForm.merk}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, merk: e.target.value })}
            >
              <option value="FAW">FAW</option>
              <option value="Hino">Hino</option>
              <option value="Isuzu">Isuzu</option>
              <option value="Mitsubishi">Mitsubishi</option>
              <option value="Nissan UD">Nissan UD</option>
              <option value="Scania">Scania</option>
              <option value="Tata">Tata</option>
              <option value="Toyota">Toyota</option>
              <option value="Volvo">Volvo</option>
            </Select>

            <Input
              label="Nomor Rangka/NIK/VIN"
              icon={Hash}
              value={editArmadaForm.vin}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, vin: e.target.value })}
              placeholder="Nomor Rangka/NIK/VIN"
              className="font-mono"
            />

            <Input
              label="Nomor Mesin"
              icon={Hash}
              value={editArmadaForm.mesin}
              onChange={(e) => setEditArmadaForm({ ...editArmadaForm, mesin: e.target.value })}
              placeholder="Nomor Mesin"
              className="font-mono"
            />

            <Input
              label="Tahun Pembuatan"
              icon={Calendar}
              type="number"
              value={editArmadaForm.tahun}
              placeholder="Contoh: 2024"
              onFocus={(e) => {
                if (e.target.value === '0') e.target.select();
              }}
              onChange={(e) => {
                const raw = e.target.value;
                const clean = raw === '' ? '' : raw.replace(/^0+(?=\d)/, '');
                setEditArmadaForm({ ...editArmadaForm, tahun: clean });
              }}
              className="font-mono"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditArmadaModal(false);
                setSelectedArmada(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Armada
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH CUSTOMER */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'customer'}
        onClose={() => setModalOpen(false)}
        title="Tambah Customer"
        subtitle="Pendaftaran customer proyek penerima material tambang"
      >
        <form onSubmit={handleSubmitCustomer} className="p-4 space-y-3">
          <Select
            label="Pilih Jenis Badan Usaha"
            icon={User}
            value={customerForm.jenisBadanUsaha}
            onChange={(e) => {
              const val = e.target.value;
              const pfx = val.split('-')[0] || val;
              setCustomerForm({
                ...customerForm,
                jenisBadanUsaha: val,
                alias: customerForm.name ? `${pfx} ${customerForm.name}` : customerForm.alias,
              });
            }}
          >
            <option value="CV-Persekutuan Komanditer">CV-Persekutuan Komanditer</option>
            <option value="PE-Personal">PE-Personal</option>
            <option value="PT-Perusahaan Terbatas">PT-Perusahaan Terbatas</option>
            <option value="UD-Usaha Dagang">UD-Usaha Dagang</option>
          </Select>

          <Input
            label="Nama Customer"
            required
            value={customerForm.name}
            onChange={(e) => {
              const pfx = customerForm.jenisBadanUsaha.split('-')[0] || customerForm.jenisBadanUsaha;
              setCustomerForm({
                ...customerForm,
                name: e.target.value,
                alias: `${pfx} ${e.target.value}`,
              });
            }}
            placeholder="Contoh: LION WINGS, SEMEN INDONESIA"
          />

          <Input
            label="Nama Alias Customer (auto)"
            value={customerForm.alias}
            onChange={(e) => setCustomerForm({ ...customerForm, alias: e.target.value })}
            className="font-mono"
          />

          <Input
            label="Alamat Lengkap / Proyek"
            value={customerForm.alamat}
            onChange={(e) => setCustomerForm({ ...customerForm, alamat: e.target.value })}
            placeholder="Lokasi bongkar / gudang proyek"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nomor NPWP"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customerForm.npwp}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  npwp: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Hanya angka"
            />
            <Input
              label="Nomor Telepon Customer"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={customerForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  telepon: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Contoh: 081234567890 (Hanya angka)"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: EDIT CUSTOMER */}
      {/* ======================================================== */}
      <Modal
        isOpen={editCustomerModal}
        onClose={() => {
          setEditCustomerModal(false);
          setSelectedCustomer(null);
        }}
        title="Ubah Data Customer"
        subtitle={`Perbarui informasi ${editCustomerForm.name || 'customer'}`}
      >
        <form onSubmit={handleUpdateCustomer} className="p-4 space-y-3">
          <Select
            label="Pilih Jenis Badan Usaha"
            icon={User}
            value={editCustomerForm.jenisBadanUsaha}
            onChange={(e) => {
              const val = e.target.value;
              const pfx = val.split('-')[0] || val;
              setEditCustomerForm({
                ...editCustomerForm,
                jenisBadanUsaha: val,
                alias: editCustomerForm.name ? `${pfx} ${editCustomerForm.name}` : editCustomerForm.alias,
              });
            }}
          >
            <option value="CV-Persekutuan Komanditer">CV-Persekutuan Komanditer</option>
            <option value="PE-Personal">PE-Personal</option>
            <option value="PT-Perusahaan Terbatas">PT-Perusahaan Terbatas</option>
            <option value="UD-Usaha Dagang">UD-Usaha Dagang</option>
          </Select>

          <Input
            label="Nama Customer"
            required
            value={editCustomerForm.name}
            onChange={(e) => {
              const pfx = editCustomerForm.jenisBadanUsaha.split('-')[0] || editCustomerForm.jenisBadanUsaha;
              setEditCustomerForm({
                ...editCustomerForm,
                name: e.target.value,
                alias: `${pfx} ${e.target.value}`,
              });
            }}
            placeholder="Contoh: LION WINGS, SEMEN INDONESIA"
          />

          <Input
            label="Nama Alias Customer (auto)"
            value={editCustomerForm.alias}
            onChange={(e) => setEditCustomerForm({ ...editCustomerForm, alias: e.target.value })}
            className="font-mono"
          />

          <Input
            label="Alamat Lengkap / Proyek"
            value={editCustomerForm.alamat}
            onChange={(e) => setEditCustomerForm({ ...editCustomerForm, alamat: e.target.value })}
            placeholder="Lokasi bongkar / gudang proyek"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nomor NPWP"
              inputMode="numeric"
              pattern="[0-9]*"
              value={editCustomerForm.npwp}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setEditCustomerForm({
                  ...editCustomerForm,
                  npwp: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Hanya angka"
            />
            <Input
              label="Nomor Telepon Customer"
              icon={Phone}
              inputMode="numeric"
              pattern="[0-9]*"
              value={editCustomerForm.telepon}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setEditCustomerForm({
                  ...editCustomerForm,
                  telepon: e.target.value.replace(/\D/g, ''),
                })
              }
              className="font-mono"
              placeholder="Contoh: 081234567890 (Hanya angka)"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditCustomerModal(false);
                setSelectedCustomer(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'bank'}
        onClose={() => setModalOpen(false)}
        title="Tambah Bank Mitra"
        subtitle="Pendaftaran kode kliring & SWIFT bank transaksi"
      >
        <form onSubmit={handleSubmitBank} className="p-4 space-y-3">
          <Input
            label="Nama Bank"
            icon={Landmark}
            required
            value={bankForm.namaBank}
            onChange={(e) => setBankForm({ ...bankForm, namaBank: e.target.value.toUpperCase(), namaAlias: e.target.value.toUpperCase() })}
            placeholder="Contoh: Bank Central Asia"
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Nama Alias Bank"
            icon={Landmark}
            disabled
            value={bankForm.namaAlias}
            className="uppercase font-mono font-bold"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Kode SWIFT"
              icon={Hash}
              value={bankForm.kodeSwift}
              onChange={(e) => setBankForm({ ...bankForm, kodeSwift: e.target.value.toUpperCase() })}
              placeholder="Contoh: CENAIDJA"
              className="font-mono uppercase"
            />
            <Input
              label="Kode Bank"
              icon={Hash}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              value={bankForm.kodeBank}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Tab',
                    'Enter',
                    'Delete',
                    'Escape',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) =>
                setBankForm({
                  ...bankForm,
                  kodeBank: e.target.value.replace(/\D/g, ''),
                })
              }
              placeholder="Contoh: 014 (Hanya angka)"
              className="font-mono font-bold"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Bank
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: PERBARUI DATA BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={editBankModal}
        onClose={() => {
          setEditBankModal(false);
          setSelectedBank(null);
        }}
        title="Perbarui Data Bank"
        subtitle="Edit nama bank, nama alias, kode SWIFT, dan kode kliring bank"
      >
        <form onSubmit={handleUpdateBank} className="p-4 space-y-3">
          <Input
            label="Nama Bank"
            icon={Landmark}
            required
            value={editBankForm.namaBank}
            onChange={(e) => setEditBankForm({ ...editBankForm, namaBank: e.target.value.toUpperCase(), namaAlias: e.target.value.toUpperCase() })}
            placeholder="Contoh: BANK CENTRAL ASIA"
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Nama Alias Bank"
            icon={Landmark}
            disabled
            value={editBankForm.namaAlias}
            className="uppercase font-mono font-bold"
          />

          <Input
            label="Kode Swift"
            icon={Hash}
            value={editBankForm.kodeSwift}
            onChange={(e) => setEditBankForm({ ...editBankForm, kodeSwift: e.target.value.toUpperCase() })}
            placeholder="Contoh: CENAIDJA"
            className="font-mono uppercase"
          />

          <Input
            label="Kode Bank"
            icon={Hash}
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={editBankForm.kodeBank}
            onKeyDown={(e) => {
              if (
                [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'Delete',
                  'Escape',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(e.key) ||
                e.ctrlKey ||
                e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) =>
              setEditBankForm({
                ...editBankForm,
                kodeBank: e.target.value.replace(/\D/g, ''),
              })
            }
            placeholder="Contoh: 014 (Hanya angka)"
            className="font-mono font-bold"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditBankModal(false);
                setSelectedBank(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Bank
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH REKENING BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'rekening'}
        onClose={() => setModalOpen(false)}
        title="Tambah Rekening Bank"
        subtitle="Pendaftaran rekening kas penampung & operasional proyek"
      >
        <form onSubmit={handleSubmitRekening} className="p-4 space-y-3">
          <Select
            label="Pilih Bank"
            required
            value={rekeningForm.bank}
            onChange={(e) => setRekeningForm({ ...rekeningForm, bank: e.target.value })}
          >
            <option value="" disabled>Pilih Bank</option>
            {banks.map((b) => {
              const label = b.namaAlias ? `${b.namaAlias} - ${b.namaBank}` : b.namaBank;
              return (
                <option key={b.id} value={b.namaAlias || b.namaBank}>
                  {label}
                </option>
              );
            })}
          </Select>

          <Select
            label="Jenis Rekening"
            required
            value={rekeningForm.jenisRekening}
            onChange={(e) => {
              const jenis = e.target.value;
              const updates = { ...rekeningForm, jenisRekening: jenis };
              if (jenis.startsWith('Giro') || jenis.startsWith('Tabungan')) {
                if (!rekeningForm.rekeningAtasNama) {
                  updates.rekeningAtasNama = 'PT Berkah Alam Semesta';
                }
              }
              setRekeningForm(updates);
            }}
          >
            <option value="" disabled>Pilih Jenis Rekening</option>
            <option value="Giro Bisnis (Operasional Perusahaan)">Giro Bisnis (Operasional Perusahaan)</option>
            <option value="Giro Utama (Penerimaan Proyek)">Giro Utama (Penerimaan Proyek)</option>
            <option value="Tabungan Escrow (Cadangan Kas)">Tabungan Escrow (Cadangan Kas)</option>
            <option value="Rekening Mitra Supplier">Rekening Mitra Supplier</option>
          </Select>

          {rekeningForm.jenisRekening === 'Rekening Mitra Supplier' && (
            <Select
              label="Tautkan ke Supplier"
              value={rekeningForm.supplierId || ''}
              onChange={(e) => {
                const sId = e.target.value;
                const sup = suppliers.find((s) => s.id === sId);
                setRekeningForm({
                  ...rekeningForm,
                  supplierId: sId,
                  rekeningAtasNama: sup?.penerima || sup?.name || rekeningForm.rekeningAtasNama,
                  nomorRekening: sup?.noRekening || rekeningForm.nomorRekening,
                  namaAlias: sup ? `Rekening Mitra - ${sup.name}` : rekeningForm.namaAlias,
                });
              }}
            >
              <option value="">-- Pilih Mitra Supplier (Opsional) --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.idProgram} - {s.name} ({s.penerima})
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Nomor Rekening"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={rekeningForm.nomorRekening}
            onKeyDown={(e) => {
              if (
                [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'Delete',
                  'Escape',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(e.key) ||
                e.ctrlKey ||
                e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '');
              setRekeningForm({ ...rekeningForm, nomorRekening: numericOnly });
            }}
            placeholder="Contoh: 140001928192 (Hanya angka)"
            className="font-mono font-bold"
          />

          <Input
            label="Rekening Atas Nama"
            required
            value={rekeningForm.rekeningAtasNama}
            onChange={(e) =>
              setRekeningForm({ ...rekeningForm, rekeningAtasNama: e.target.value })
            }
          />

          <Input
            label="Nama Alias Rekening"
            value={rekeningForm.namaAlias}
            onChange={(e) => setRekeningForm({ ...rekeningForm, namaAlias: e.target.value })}
            placeholder="Contoh: BCA Operasional Gresik"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Rekening
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: EDIT REKENING BANK */}
      {/* ======================================================== */}
      <Modal
        isOpen={editRekeningModal}
        onClose={() => {
          setEditRekeningModal(false);
          setSelectedRekening(null);
        }}
        title="Ubah Rekening Bank"
        subtitle={`Perbarui informasi rekening ${editRekeningForm.nomorRekening || ''}`}
      >
        <form onSubmit={handleUpdateRekening} className="p-4 space-y-3">
          <Select
            label="Pilih Bank"
            required
            value={editRekeningForm.bank}
            onChange={(e) => setEditRekeningForm({ ...editRekeningForm, bank: e.target.value })}
          >
            <option value="" disabled>Pilih Bank</option>
            {banks.map((b) => {
              const label = b.namaAlias ? `${b.namaAlias} - ${b.namaBank}` : b.namaBank;
              return (
                <option key={b.id} value={b.namaAlias || b.namaBank}>
                  {label}
                </option>
              );
            })}
          </Select>

          <Select
            label="Jenis Rekening"
            required
            value={editRekeningForm.jenisRekening}
            onChange={(e) =>
              setEditRekeningForm({ ...editRekeningForm, jenisRekening: e.target.value })
            }
          >
            <option value="" disabled>Pilih Jenis Rekening</option>
            <option value="Giro Bisnis (Operasional Perusahaan)">Giro Bisnis (Operasional Perusahaan)</option>
            <option value="Giro Utama (Penerimaan Proyek)">Giro Utama (Penerimaan Proyek)</option>
            <option value="Tabungan Escrow (Cadangan Kas)">Tabungan Escrow (Cadangan Kas)</option>
            <option value="Rekening Mitra Supplier">Rekening Mitra Supplier</option>
          </Select>

          {editRekeningForm.jenisRekening === 'Rekening Mitra Supplier' && (
            <Select
              label="Tautkan ke Supplier"
              value={editRekeningForm.supplierId || ''}
              onChange={(e) => {
                const sId = e.target.value;
                const sup = suppliers.find((s) => s.id === sId);
                setEditRekeningForm({
                  ...editRekeningForm,
                  supplierId: sId,
                  rekeningAtasNama: sup?.penerima || sup?.name || editRekeningForm.rekeningAtasNama,
                  nomorRekening: sup?.noRekening || editRekeningForm.nomorRekening,
                  namaAlias: sup ? `Rekening Mitra - ${sup.name}` : editRekeningForm.namaAlias,
                });
              }}
            >
              <option value="">-- Pilih Mitra Supplier (Opsional) --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.idProgram} - {s.name} ({s.penerima})
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Nomor Rekening"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={editRekeningForm.nomorRekening}
            onKeyDown={(e) => {
              if (
                [
                  'Backspace',
                  'Tab',
                  'Enter',
                  'Delete',
                  'Escape',
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Home',
                  'End',
                ].includes(e.key) ||
                e.ctrlKey ||
                e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '');
              setEditRekeningForm({ ...editRekeningForm, nomorRekening: numericOnly });
            }}
            placeholder="Contoh: 140001928192 (Hanya angka)"
            className="font-mono font-bold"
          />

          <Input
            label="Rekening Atas Nama"
            required
            value={editRekeningForm.rekeningAtasNama}
            onChange={(e) =>
              setEditRekeningForm({ ...editRekeningForm, rekeningAtasNama: e.target.value })
            }
          />

          <Input
            label="Nama Alias Rekening"
            value={editRekeningForm.namaAlias}
            onChange={(e) => setEditRekeningForm({ ...editRekeningForm, namaAlias: e.target.value })}
            placeholder="Contoh: BCA Operasional Gresik"
          />

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEditRekeningModal(false);
                setSelectedRekening(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Perbarui Rekening
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH MATA UANG BARU */}
      {/* ======================================================== */}
      <Modal
        isOpen={modalOpen && currentTab === 'mata-uang'}
        onClose={() => setModalOpen(false)}
        title="Tambah Mata Uang Baru"
        subtitle="Konfigurasi valuta asing atau mata uang transaksi pendukung PT BAS"
      >
        <form onSubmit={handleSubmitCurrency} className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Kode Mata Uang (3 Huruf ISO)"
              required
              maxLength={4}
              value={currencyForm.code}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                setCurrencyForm({
                  ...currencyForm,
                  code,
                  symbol: currencyForm.symbol || code,
                  formatSample: `${currencyForm.symbol || code} 1,250.00`,
                });
              }}
              placeholder="Contoh: SGD, JPY, CNY"
              className="font-mono uppercase font-bold"
            />

            <Input
              label="Kode ISO 4217 (Numerik)"
              maxLength={4}
              inputMode="numeric"
              value={currencyForm.isoCode}
              onChange={(e) =>
                setCurrencyForm({ ...currencyForm, isoCode: e.target.value.replace(/\D/g, '') })
              }
              placeholder="Contoh: 702 (SGD), 392 (JPY)"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Simbol Mata Uang"
              value={currencyForm.symbol}
              onChange={(e) => {
                const sym = e.target.value;
                setCurrencyForm({
                  ...currencyForm,
                  symbol: sym,
                  formatSample: `${sym || currencyForm.code || 'VAL'} 1,250.00`,
                });
              }}
              placeholder="Contoh: S$, ¥, RM, $"
              className="font-mono font-bold"
            />

            <Input
              label="Negara / Bank Penerbit"
              value={currencyForm.country}
              onChange={(e) => setCurrencyForm({ ...currencyForm, country: e.target.value })}
              placeholder="Contoh: Singapura (MAS)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Format Pemisah Ribuan"
              value={currencyForm.pemisahRibuan}
              onChange={(e) => setCurrencyForm({ ...currencyForm, pemisahRibuan: e.target.value })}
            >
              <option value="Titik (.)">Titik (.) — Standar Indonesia/Eropa</option>
              <option value="Koma (,)">Koma (,) — Standar Internasional/AS</option>
              <option value="Spasi ( )">Spasi ( ) — Format ISO Internasional</option>
            </Select>

            <Select
              label="Format Pemisah Desimal"
              value={currencyForm.pemisahDesimal}
              onChange={(e) => setCurrencyForm({ ...currencyForm, pemisahDesimal: e.target.value })}
            >
              <option value="Koma (,)">Koma (,) — Standar Indonesia</option>
              <option value="Titik (.)">Titik (.) — Standar Internasional/AS</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Format Presisi Satuan"
              value={currencyForm.presisi}
              onChange={(e) => setCurrencyForm({ ...currencyForm, presisi: e.target.value })}
            >
              <option value="2 Digit Desimal">2 Digit Desimal (0.00)</option>
              <option value="2 Digit Koma">2 Digit Koma (0,00)</option>
              <option value="0 Digit (Bulat)">0 Digit (Bulat Tanpa Desimal)</option>
            </Select>

            <Select
              label="Ketentuan Pajak Default"
              value={currencyForm.pajak}
              onChange={(e) => setCurrencyForm({ ...currencyForm, pajak: e.target.value })}
            >
              <option value="Non-PPN / Transaksi Valas">Non-PPN / Transaksi Valas</option>
              <option value="PPN 11% & PPh 22 (0.25% - 1.5%)">PPN 11% & PPh 22</option>
              <option value="Bebas Pajak (Kawasan Berikat)">Bebas Pajak (Kawasan Berikat)</option>
            </Select>
          </div>

          <Input
            label="Contoh Format Penulisan"
            value={currencyForm.formatSample}
            onChange={(e) => setCurrencyForm({ ...currencyForm, formatSample: e.target.value })}
            placeholder="Contoh: S$ 1,250.00"
            className="font-mono text-emerald-400"
          />

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Deskripsi & Peruntukan
            </label>
            <textarea
              rows={2}
              value={currencyForm.deskripsi}
              onChange={(e) => setCurrencyForm({ ...currencyForm, deskripsi: e.target.value })}
              placeholder="Keterangan kontrak atau keperluan mata uang ini..."
              className="w-full px-3 py-2 bg-[#101214] border border-[#24282C] rounded-lg text-xs text-white focus:outline-none focus:border-[#F4511E] transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-[#24282C] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              Simpan Mata Uang
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: UBAH KATA SANDI PENGGUNA (SUPER ADMIN) */}
      {/* ======================================================== */}
      <Modal
        isOpen={userPasswordModal.open}
        onClose={() =>
          setUserPasswordModal({
            open: false,
            user: null,
            newPassword: '',
            confirmPassword: '',
            showPassword: false,
            submitting: false,
          })
        }
        title="Ubah Kata Sandi Pengguna"
        subtitle="Otoritas Super Admin: Perbarui kata sandi akun secara langsung tanpa kata sandi lama"
      >
        {userPasswordModal.user && (
          <form onSubmit={handleSaveUserPassword} className="p-4 space-y-4">
            {/* Target User Info Card */}
            <div className="p-3.5 rounded-xl bg-[#121822] border border-[#1E2938] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#F4511E]/20 border border-[#F4511E]/30 text-[#F4511E] font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs">
                  {userPasswordModal.user.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <div>
                  <div className="font-bold text-white text-sm">{userPasswordModal.user.name}</div>
                  <div className="text-xs text-neutral-400 font-mono">{userPasswordModal.user.email}</div>
                </div>
              </div>
              <Badge size="xs" variant={userPasswordModal.user.role === 'superadmin' ? 'primary' : 'neutral'}>
                {userPasswordModal.user.roleLabel || userPasswordModal.user.role}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Otoritas Direksi:</strong> Anda dapat langsung menetapkan kata sandi baru untuk akun ini. Pengguna dapat langsung login dengan kata sandi baru ini.
              </div>
            </div>

            {/* Input New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Kata Sandi Baru *</span>
                <span className="text-[11px] font-mono text-neutral-500">Min. 6 Karakter</span>
              </label>
              <div className="relative">
                <input
                  type={userPasswordModal.showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={userPasswordModal.newPassword}
                  onChange={(e) =>
                    setUserPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Masukkan kata sandi baru..."
                  className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 rounded-xl bg-[#14171A] border border-[#2B3542] text-white placeholder-neutral-500 focus:border-[#F4511E] focus:outline-none focus:ring-1 focus:ring-[#F4511E] transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setUserPasswordModal((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                  }
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={userPasswordModal.showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {userPasswordModal.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Ulangi Kata Sandi Baru *
              </label>
              <input
                type={userPasswordModal.showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={userPasswordModal.confirmPassword}
                onChange={(e) =>
                  setUserPasswordModal((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Ketik ulang kata sandi baru..."
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl bg-[#14171A] border border-[#2B3542] text-white placeholder-neutral-500 focus:border-[#F4511E] focus:outline-none focus:ring-1 focus:ring-[#F4511E] transition-all"
              />
              {userPasswordModal.newPassword && userPasswordModal.confirmPassword && (
                <div className="text-[11px] font-mono pt-1">
                  {userPasswordModal.newPassword === userPasswordModal.confirmPassword ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Kata sandi cocok
                    </span>
                  ) : (
                    <span className="text-rose-400">Kata sandi belum cocok</span>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#24282C] flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setUserPasswordModal({
                    open: false,
                    user: null,
                    newPassword: '',
                    confirmPassword: '',
                    showPassword: false,
                    submitting: false,
                  })
                }
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Key}
                disabled={userPasswordModal.submitting}
                className="bg-[#F4511E] hover:bg-[#D84315] text-white font-bold"
              >
                {userPasswordModal.submitting ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: EDIT DATA PENGGUNA (SUPER ADMIN) */}
      {/* ======================================================== */}
      <Modal
        isOpen={editUserModal}
        onClose={() => {
          setEditUserModal(false);
          setSelectedUserToEdit(null);
        }}
        title="Edit Data Pengguna"
        subtitle="Perbarui profil karyawan, peran otorisasi, dan status aktif akun"
      >
        {selectedUserToEdit && (
          <form onSubmit={handleSaveEditUser} className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nama Lengkap */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-300">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={userEditForm.name}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Email Akun *</label>
                <input
                  type="email"
                  required
                  value={userEditForm.email}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Peran / Otoritas *</label>
                <select
                  value={userEditForm.role}
                  disabled={selectedUserToEdit.id === 'usr-1' || selectedUserToEdit.email === 'superadmin@ptbas.co.id'}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="admin">Admin (Operasional & Surat Jalan)</option>
                  <option value="superadmin">Super Admin (Direksi / Otoritas Penuh)</option>
                </select>
              </div>

              {/* Cabang / Unit */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Cabang / Unit</label>
                <input
                  type="text"
                  value={userEditForm.branch}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                  placeholder="Hub Gresik"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={userEditForm.phone}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Jenis Kelamin</label>
                <select
                  value={userEditForm.gender}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none cursor-pointer"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Tanggal Lahir</label>
                <input
                  type="date"
                  value={userEditForm.birth_date}
                  onChange={(e) => setUserEditForm((prev) => ({ ...prev, birth_date: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none font-mono"
                />
              </div>

              {/* Status Akun */}
              <div className="space-y-1 sm:col-span-2 pt-1">
                <label className="text-xs font-semibold text-neutral-300">Status Akun</label>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#181B1E] border border-[#24282C]">
                  <button
                    type="button"
                    disabled={selectedUserToEdit.id === 'usr-1' || selectedUserToEdit.email === 'superadmin@ptbas.co.id'}
                    onClick={() => setUserEditForm((prev) => ({ ...prev, aktif: prev.aktif ? 0 : 1 }))}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${selectedUserToEdit.id === 'usr-1' || selectedUserToEdit.email === 'superadmin@ptbas.co.id'
                      ? 'opacity-60 cursor-not-allowed bg-[#F4511E]'
                      : userEditForm.aktif
                        ? 'bg-[#F4511E] cursor-pointer'
                        : 'bg-[#2A2E33] cursor-pointer'
                      }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${userEditForm.aktif ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </button>
                  <span className="text-xs font-mono text-neutral-200">
                    {userEditForm.aktif ? 'Akun Aktif (Dapat Login & Bertransaksi)' : 'Akun Nonaktif (Akses Dibekukan)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#24282C] flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditUserModal(false);
                  setSelectedUserToEdit(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" icon={Save} className="bg-[#F4511E] hover:bg-[#D84315] text-white font-bold">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH PENGGUNA BARU (SUPER ADMIN) */}
      {/* ======================================================== */}
      <Modal
        isOpen={addUserModal}
        onClose={() => setAddUserModal(false)}
        title="Tambah Pengguna Baru"
        subtitle="Daftarkan akun karyawan / admin baru dengan otoritas operasional sistem"
      >
        <form onSubmit={handleSaveAddUser} className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nama Lengkap */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-300">Nama Lengkap *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={userAddForm.name}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Email Akun *</label>
              <input
                type="email"
                required
                placeholder="budi@ptbas.co.id"
                value={userAddForm.email}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
              />
            </div>

            {/* Kata Sandi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Kata Sandi Awal * (Min 6 Karakter)</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter..."
                value={userAddForm.password}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
              />
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Peran / Otoritas *</label>
              <select
                value={userAddForm.role}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none cursor-pointer"
              >
                <option value="admin">Admin (Operasional & Surat Jalan)</option>
                <option value="superadmin">Super Admin (Direksi / Otoritas Penuh)</option>
              </select>
            </div>

            {/* Cabang / Unit */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Cabang / Unit Operasional</label>
              <input
                type="text"
                value={userAddForm.branch}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, branch: e.target.value }))}
                placeholder="Hub Gresik"
                className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
              />
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={userAddForm.phone}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="0812-xxxx-xxxx"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none"
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Jenis Kelamin</label>
              <select
                value={userAddForm.gender}
                onChange={(e) => setUserAddForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-[#14171A] border border-[#2B3542] text-white focus:border-[#F4511E] focus:outline-none cursor-pointer"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#24282C] flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddUserModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={UserPlus} className="bg-[#F4511E] hover:bg-[#D84315] text-white font-bold">
              Buat Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: HAPUS PENGGUNA SISTEM (SUPER ADMIN) */}
      {/* ======================================================== */}
      <Modal
        isOpen={deleteUserModal}
        onClose={handleCloseDeleteUser}
        title="Konfirmasi Hapus Pengguna"
        subtitle={userToDelete ? `ID: ${userToDelete.id} • ${userToDelete.name}` : ''}
        maxWidth="max-w-md"
      >
        {userToDelete && (
          <div className="p-4 space-y-4 font-mono text-xs" data-testid="delete-user-modal">
            {/* Warning banner */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-xs">Peringatan: Penghapusan Akun Pengguna</p>
                <p className="mt-1 text-[11px] text-neutral-300 leading-relaxed font-sans">
                  Akun <strong className="text-white font-mono">{userToDelete.name}</strong> akan dihapus secara permanen dari basis data sistem PT BAS. Karyawan/pengguna yang bersangkutan tidak akan dapat login kembali.
                </p>
              </div>
            </div>

            {/* User details card */}
            <div className="bg-[#0E1012] rounded-xl p-3.5 border border-[#22262A] space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-[#1C1F23]">
                <span className="text-neutral-400 font-sans">Nama Lengkap:</span>
                <span className="text-white font-bold">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1C1F23]">
                <span className="text-neutral-400 font-sans">Email Akun:</span>
                <span className="text-neutral-200">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1C1F23]">
                <span className="text-neutral-400 font-sans">Peran / Otoritas:</span>
                <Badge size="xs" variant={userToDelete.role === 'superadmin' || userToDelete.roleLabel === 'Super Admin' ? 'primary' : 'neutral'}>
                  {userToDelete.roleLabel || userToDelete.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1C1F23]">
                <span className="text-neutral-400 font-sans">Unit / Cabang:</span>
                <span className="text-neutral-300">{userToDelete.branch || 'Hub Gresik'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1C1F23]">
                <span className="text-neutral-400 font-sans">Status Saat Ini:</span>
                <Badge size="xs" variant={userToDelete.aktif ? 'success' : 'neutral'}>
                  {userToDelete.aktif ? 'Aktif' : 'Non-aktif'}
                </Badge>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-neutral-400 font-sans">Dihapus Oleh:</span>
                <span className="text-rose-400 font-bold">
                  {currentUser?.name || 'Super Admin'} (Super Admin)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 font-sans">
              Tindakan ini tidak dapat dibatalkan. Pastikan akun ini sudah tidak memiliki tugas berjalan di sistem.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#22262A]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDeleteUser}
                disabled={isDeletingUser}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeletingUser ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI HAPUS */}
      {/* ======================================================== */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={handleCancelDelete}
        title="Konfirmasi Hapus"
        subtitle="Tindakan ini tidak dapat dibatalkan"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-neutral-200">
                Apakah Anda yakin ingin menghapus data{' '}
                <span className="font-bold text-white font-mono">{deleteConfirm.label}</span>?
              </p>
              {deleteConfirm.isBulk && deleteConfirm.type === 'mata-uang' && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Catatan: Mata uang basis (IDR) otomatis diproteksi sebagai acuan buku besar dan tidak akan dihapus.
                </p>
              )}
              <p className="text-xs text-rose-400 mt-1">
                Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={handleCancelDelete}>
              Batal
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
