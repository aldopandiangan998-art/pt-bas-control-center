import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Phone,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Camera,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { Button, Badge } from '../../components/ui';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, isSuperAdmin, updateProfile, updateAvatar, changePassword, requestPasswordReset } = useAuth();
  const { addToast } = useToast();
  const { isDark } = useApp();

  // Avatar upload state & ref
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Tab state: 'profile' | 'password' (sync with URL ?tab=...)
  const initialTab = searchParams.get('tab') === 'password' ? 'password' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'password' ? { tab: 'password' } : {});
  };

  // Sync tab if URL search param changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'password' && activeTab !== 'password') {
      setActiveTab('password');
    } else if (!tabFromUrl && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [searchParams]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    birth_date: currentUser?.birth_date || '',
    gender: currentUser?.gender || 'Laki-laki',
    phone: currentUser?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync profileForm when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        birth_date: currentUser.birth_date || '',
        gender: currentUser.gender || 'Laki-laki',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser]);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Forgot password self-request state
  const [sendingResetLink, setSendingResetLink] = useState(false);
  const [latestResetUrl, setLatestResetUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Client-side image compression: max 400x400 px WebP/JPEG ~30-40KB
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Format file tidak didukung. Harap pilih file gambar (JPG, PNG, atau WebP).'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Ukuran file foto maksimal 10MB sebelum kompresi.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with 0.85 quality for compact storage
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Gagal memproses file gambar.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar file input change
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers onChange
    e.target.value = '';

    setAvatarUploading(true);
    try {
      const compressedDataUrl = await compressImage(file);
      const res = await updateAvatar(compressedDataUrl);
      setAvatarUploading(false);
      if (res && res.success) {
        addToast(res.message || 'Foto profil berhasil diperbarui!', 'success');
      } else {
        addToast(res?.message || 'Gagal memperbarui foto profil.', 'error');
      }
    } catch (err) {
      setAvatarUploading(false);
      addToast(err.message || 'Terjadi kesalahan saat memproses foto.', 'error');
    }
  };

  // Handle remove avatar photo
  const handleRemoveAvatar = async () => {
    if (!currentUser?.avatar) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto profil ini?')) return;

    setAvatarUploading(true);
    try {
      const res = await updateAvatar(null);
      setAvatarUploading(false);
      if (res && res.success) {
        addToast('Foto profil berhasil dihapus.', 'success');
      } else {
        addToast(res?.message || 'Gagal menghapus foto profil.', 'error');
      }
    } catch (err) {
      setAvatarUploading(false);
      addToast('Terjadi kesalahan saat menghapus foto profil.', 'error');
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      addToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        birth_date: profileForm.birth_date || null,
        gender: profileForm.gender,
      });

      setProfileSaving(false);
      if (res && res.success) {
        addToast(res.message || 'Profil berhasil diperbarui!', 'success');
      } else {
        addToast(res?.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      setProfileSaving(false);
      addToast('Terjadi kesalahan saat menyimpan profil.', 'error');
    }
  };

  // Reset Profile Form to current user values
  const handleResetProfileForm = () => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        birth_date: currentUser.birth_date || '',
        gender: currentUser.gender || 'Laki-laki',
        phone: currentUser.phone || '',
      });
      addToast('Formulir profil dikembalikan ke data awal.', 'info');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      addToast('Harap lengkapi semua kolom kata sandi.', 'warning');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addToast('Kata sandi baru minimal 6 karakter.', 'warning');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('Konfirmasi kata sandi baru tidak sesuai.', 'error');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordSaving(false);

      if (res && res.success) {
        addToast('Kata sandi berhasil diperbarui! Silakan gunakan sandi baru pada login berikutnya.', 'success');
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        addToast(res?.message || 'Gagal mengubah kata sandi.', 'error');
      }
    } catch (err) {
      setPasswordSaving(false);
      addToast('Terjadi kesalahan saat memperbarui kata sandi.', 'error');
    }
  };

  // Handle Self Request Reset via Gmail
  const handleRequestSelfReset = async () => {
    if (!currentUser?.email) {
      addToast('Email akun tidak ditemukan.', 'error');
      return;
    }

    setSendingResetLink(true);
    try {
      const res = await requestPasswordReset(currentUser.email);
      setSendingResetLink(false);

      if (res && res.success) {
        addToast('Tautan reset kata sandi telah dikirimkan ke Gmail terdaftar.', 'success');
        if (res.resetUrl) {
          setLatestResetUrl(res.resetUrl);
        }
      } else {
        addToast(res?.message || 'Gagal mengirim tautan reset password.', 'error');
      }
    } catch (e) {
      setSendingResetLink(false);
      addToast('Kendala jaringan saat meminta reset password.', 'error');
    }
  };

  const handleCopyResetUrl = () => {
    if (!latestResetUrl) return;
    navigator.clipboard.writeText(latestResetUrl);
    setCopiedLink(true);
    addToast('Tautan reset berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const userInitials = currentUser?.name
    ? currentUser.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('')
    : 'U';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* ── Top Header with Back Navigation ── */}
      <div
        className={`flex items-center gap-3 pb-3 border-b transition-colors ${isDark ? 'border-[#22262A]' : 'border-slate-200'
          }`}
      >
        <Button
          size="sm"
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          title="Kembali ke halaman sebelumnya"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'
                }`}
            >
              <User className="w-5 h-5 text-[#F4511E]" />
              <span>Profil Akun Pengguna</span>
            </h1>
            <Badge size="xs" variant={isSuperAdmin ? 'primary' : 'success'} dot>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Kelola data identitas operasional, tanggal lahir, jenis kelamin, kontak, dan keamanan kata sandi
          </p>
        </div>
      </div>

      {/* ── User Identity Hero Banner ── */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors shadow-sm ${isDark
          ? 'bg-gradient-to-r from-[#181B1E] via-[#14171A] to-[#111315] border-[#22262A]'
          : 'bg-gradient-to-r from-orange-50/80 via-white to-slate-50 border-orange-200/80'
          }`}
      >
        <div className="flex items-center gap-4">
          {/* Hidden File Input for Avatar */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarFileSelect}
            className="hidden"
          />

          <div className="relative group">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#F4511E] to-[#FF7043] text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-lg shadow-[#F4511E]/20 shrink-0 relative overflow-hidden cursor-pointer group/avatar border-2 border-transparent hover:border-[#FF7043] transition-all"
              title="Klik untuk memilih dan memperbarui foto profil"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                userInitials
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-semibold gap-0.5 rounded-2xl backdrop-blur-xs">
                {avatarUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF7043]" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-[#FF7043]" />
                    <span>Ganti Foto</span>
                  </>
                )}
              </div>
            </div>

            {/* Corner Camera Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#181B1E] border-2 border-[#F4511E] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              title="Unggah Foto Profil"
            >
              {avatarUploading ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#FF7043]" />
              ) : (
                <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF7043]" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentUser?.name || 'Pengguna'}
              </span>
              <span
                className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${isSuperAdmin
                  ? isDark
                    ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40'
                    : 'bg-orange-100 text-[#F4511E] border border-orange-200'
                  : isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Admin Operasional'}
              </span>
            </div>
            <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              {currentUser?.email || '-'}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] ${isDark ? 'bg-black/30 border border-white/5 text-neutral-300' : 'bg-slate-100 text-slate-700'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Penugasan: {currentUser?.branch && !currentUser.branch.includes('Site [') ? currentUser.branch : 'Hub Gresik'}</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] ${isDark ? 'bg-black/30 border border-white/5 text-neutral-300' : 'bg-slate-100 text-slate-700'}`}>
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Gender: {currentUser?.gender || 'Laki-laki'}</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] ${isDark ? 'bg-black/30 border border-white/5 text-neutral-300' : 'bg-slate-100 text-slate-700'}`}>
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Tgl Lahir: {currentUser?.birth_date || '-'}</span>
              </span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1 font-mono text-[11px] pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sesi Terautentikasi</span>
              </span>
            </div>
          </div>
        </div>

        <div
          className={`md:border-l pl-0 md:pl-5 font-mono text-left md:text-right shrink-0 ${isDark ? 'border-[#22262A]' : 'border-slate-200'
            }`}
        >
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">ID Akun Pengguna</div>
          <div className="text-sm font-bold text-[#F4511E]">{currentUser?.id || 'usr-1'}</div>
          <div className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Role: {currentUser?.role || (isSuperAdmin ? 'superadmin' : 'admin')}
          </div>
        </div>
      </div>

      {/* ── Subtabs: Data Profil vs Keamanan Sandi ── */}
      <div
        className={`flex items-center gap-2 border-b shrink-0 transition-colors ${isDark ? 'border-[#22262A]' : 'border-slate-200'
          }`}
      >
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'profile'
            ? 'border-[#F4511E] text-[#F4511E]'
            : isDark
              ? 'border-transparent text-neutral-400 hover:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <User className="w-4 h-4" />
          <span>Data Pribadi & Profil</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('password')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'password'
            ? 'border-[#F4511E] text-[#F4511E]'
            : isDark
              ? 'border-transparent text-neutral-400 hover:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan & Kata Sandi</span>
        </button>
      </div>

      {/* ── TAB 1: FORM DATA PROFIL ── */}
      {activeTab === 'profile' && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 transition-colors shadow-sm ${isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
            }`}
        >
          <div className="mb-5 pb-3 border-b border-inherit flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Informasi Identitas Akun
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Data ini digunakan untuk identifikasi tanda tangan Surat Jalan, approval RO, dan otorisasi BKK.
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Foto Profil Management Card */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${isDark ? 'bg-[#181B1E] border-[#22262A]' : 'bg-slate-50 border-slate-200'
                }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#F4511E] to-[#FF7043] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md overflow-hidden relative">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                    Foto Profil Pengguna
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer flex-1 sm:flex-initial ${isDark
                    ? 'bg-[#22262A] text-white hover:bg-[#2B3037] border border-[#333940]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-xs'
                    }`}
                >
                  {avatarUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4511E]" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-[#F4511E]" />
                  )}
                  <span>{currentUser?.avatar ? 'Ganti Foto' : 'Unggah Foto'}</span>
                </button>

                {currentUser?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30"
                    title="Hapus Foto Profil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Nama Lengkap */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                >
                  Nama Lengkap <span className="text-[#F4511E]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${isDark
                      ? 'bg-[#181B1E] border-[#2B3037] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                      }`}
                  />
                </div>
              </div>

              {/* 2. Email (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                      }`}
                  >
                    Email Gmail Terdaftar
                  </label>
                  <span className="text-[10px] text-emerald-500 font-mono font-semibold">Tervalidasi Akun</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border font-mono cursor-not-allowed opacity-90 ${isDark ? 'bg-[#111315] border-[#22262A] text-neutral-300' : 'bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                  />
                </div>
              </div>

              {/* 3. Tanggal Lahir */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                >
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="date"
                    value={profileForm.birth_date}
                    onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${isDark
                      ? 'bg-[#181B1E] border-[#2B3037] text-white placeholder-neutral-500 focus:border-[#F4511E] [color-scheme:dark]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E] [color-scheme:light]'
                      }`}
                  />
                </div>
              </div>

              {/* 4. Jenis Kelamin */}
              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                >
                  Jenis Kelamin
                </label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] cursor-pointer ${isDark
                    ? 'bg-[#181B1E] border-[#2B3037] text-white focus:border-[#F4511E]'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#F4511E]'
                    }`}
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* 5. Nomor Telepon */}
              <div className="sm:col-span-2">
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                >
                  Nomor Telepon / WhatsApp Operasional
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Contoh: 0811-3001-992"
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${isDark
                      ? 'bg-[#181B1E] border-[#2B3037] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Note & Actions */}
            <div className={`pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDark ? 'border-[#22262A]' : 'border-slate-200'
              }`}>
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Perubahan profil langsung disinkronkan ke seluruh modul operasional.</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetProfileForm}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${isDark
                    ? 'bg-[#181B1E] hover:bg-[#22262A] text-neutral-300 hover:text-white border-[#2B3037]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                    }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-md shadow-[#F4511E]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: KEAMANAN & KATA SANDI ── */}
      {activeTab === 'password' && (
        <div className="space-y-5">
          {/* Subcard 1: Ubah Kata Sandi */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 transition-colors shadow-sm ${isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-white border-slate-200'
              }`}
          >
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-inherit">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Ubah Kata Sandi Saat Login
                </h3>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Pastikan kata sandi baru Anda aman dan tidak mudah ditebak oleh pihak lain
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Kata Sandi Lama */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Sandi Lama
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full text-xs pl-8 pr-8 py-2.5 rounded-xl border outline-none focus:ring-1 focus:ring-amber-500 ${isDark
                        ? 'bg-[#181B1E] border-[#2B3037] text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Min. 6 karakter"
                      className={`w-full text-xs pl-8 pr-8 py-2.5 rounded-xl border outline-none focus:ring-1 focus:ring-amber-500 ${isDark
                        ? 'bg-[#181B1E] border-[#2B3037] text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Ulangi Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi sandi baru"
                      className={`w-full text-xs pl-8 pr-8 py-2.5 rounded-xl border outline-none focus:ring-1 focus:ring-amber-500 ${isDark
                        ? 'bg-[#181B1E] border-[#2B3037] text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3">
                <div className="text-xs text-neutral-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Panjang sandi minimal 6 karakter kombinasi angka & huruf.</span>
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm self-end sm:self-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordSaving ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Subcard 2: Fitur Reset Password Gmail (Opsi B) */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 transition-colors shadow-sm ${isDark ? 'bg-[#14171A] border-[#22262A]' : 'bg-orange-50/70 border-orange-200'
              }`}
          >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail className="w-4 h-4 text-[#F4511E]" />
                  <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Reset Password Melalui Gmail (Opsi B)
                  </h3>
                  <Badge size="xs" variant="primary">Opsi B Aktif</Badge>
                </div>
                <p className={`text-xs leading-relaxed max-w-xl ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                  Fitur ini akan menghasilkan tautan pemulihan sandi yang berlaku selama <strong>15 menit</strong> dan dikirimkan secara langsung ke alamat email terdaftar <strong>{currentUser?.email}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestSelfReset}
                disabled={sendingResetLink}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm self-start sm:self-center"
              >
                <Mail className="w-4 h-4" />
                <span>{sendingResetLink ? 'Mengirim...' : 'Kirim Tautan Reset'}</span>
              </button>
            </div>

            {/* Generated Reset Link preview if requested */}
            {latestResetUrl && (
              <div
                className={`mt-4 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono transition-colors ${isDark ? 'bg-[#111315] border-[#22262A] text-neutral-300' : 'bg-white border-orange-200 text-slate-800'
                  }`}
              >
                <div className="truncate max-w-md">
                  <span className="text-[#F4511E] font-bold">Link Reset (15 Menit):</span>{' '}
                  <span className="underline select-all">{latestResetUrl}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleCopyResetUrl}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-sans font-semibold transition-colors cursor-pointer ${copiedLink
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isDark
                        ? 'bg-[#181B1E] hover:bg-[#22262A] text-neutral-200 border-[#2B3037]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    title="Salin Tautan"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
                  </button>

                  <a
                    href={latestResetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#F4511E] text-white font-sans font-bold text-xs hover:bg-[#d84315] flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Buka Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
