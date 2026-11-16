import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Fingerprint,
  Sun,
  Moon,
  HelpCircle,
  Headphones,
  BookOpen,
  FileText,
  Code,
  ListOrdered,
  Smartphone,
  Info,
  Send,
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
  Sliders,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Modal, Input, Select } from '../../components/ui';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useApp();
  const { currentUser, isSuperAdmin, updateProfile, changePassword, requestPasswordReset } = useAuth();

  // Active Tab: 'profile' or 'system'
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

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

  // System settings states
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(true);
  const [deviceType] = useState('Web Desktop Console (Chrome)');
  const [activeModal, setActiveModal] = useState(null);

  // Report issue form state
  const [reportForm, setReportForm] = useState({
    kategori: 'Bug / Masalah Tampilan',
    pesan: '',
  });

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
      const res = await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSaving(false);
      if (res && res.success) {
        addToast(res.message || 'Kata sandi akun Anda berhasil diperbarui!', 'success');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        addToast(res?.message || 'Gagal mengubah kata sandi.', 'error');
      }
    } catch (err) {
      setPasswordSaving(false);
      addToast('Terjadi kesalahan saat memproses perubahan sandi.', 'error');
    }
  };

  // Handle Send Reset Password Link to current user's email
  const handleRequestSelfReset = async () => {
    if (!currentUser?.email) return;
    setSendingResetLink(true);
    try {
      const res = await requestPasswordReset(currentUser.email);
      setSendingResetLink(false);

      if (res && res.success) {
        addToast(res.message, 'success');
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

  const toggleQuickLogin = () => {
    const nextState = !quickLoginEnabled;
    setQuickLoginEnabled(nextState);
    addToast(
      nextState
        ? 'Quick Login biometrik / FaceID berhasil diaktifkan'
        : 'Quick Login biometrik dinonaktifkan',
      'info'
    );
  };

  const handleSendReport = (e) => {
    e.preventDefault();
    if (!reportForm.pesan) return;
    addToast('Laporan kendala berhasil dikirim ke Tim IT PT BAS Gresik!', 'success');
    setReportForm({ kategori: 'Bug / Masalah Tampilan', pesan: '' });
    setActiveModal(null);
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'SA';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div
        className={`flex items-center gap-3 pb-3 border-b transition-colors ${
          isDark ? 'border-[#24282C]' : 'border-slate-200'
        }`}
      >
        <Button
          size="sm"
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          title="Kembali"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>Pengaturan & Profil Pengguna</span>
              <Badge size="xs" variant="primary">
                v1.1.12
              </Badge>
            </h1>
            <Badge size="xs" variant={isSuperAdmin ? 'danger' : 'neutral'}>
              {isSuperAdmin ? 'Role: Super Admin' : 'Role: Admin'}
            </Badge>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Kelola data profil, tanggal lahir, jenis kelamin, keamanan sandi, dan preferensi sistem
          </p>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div
        className={`flex items-center gap-2 p-1 rounded-xl border transition-colors ${
          isDark ? 'bg-[#10141A] border-[#222E40]' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? isDark
                ? 'bg-[#F4511E] text-white shadow-md'
                : 'bg-[#F4511E] text-white shadow-md'
              : isDark
              ? 'text-neutral-400 hover:text-white hover:bg-[#18202C]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Akun {isSuperAdmin ? 'Super Admin' : 'Saya'}</span>
          {isSuperAdmin && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activeTab === 'profile'
                  ? 'bg-black/30 text-white'
                  : isDark
                  ? 'bg-[#251515] text-[#F4511E]'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              Utama
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? isDark
                ? 'bg-[#F4511E] text-white shadow-md'
                : 'bg-[#F4511E] text-white shadow-md'
              : isDark
              ? 'text-neutral-400 hover:text-white hover:bg-[#18202C]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferensi Sistem & Bantuan</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PROFIL AKUN (SUPER ADMIN / ADMIN USER DATA)      */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Hero Profile Banner */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-gradient-to-br from-[#131924] via-[#10141B] to-[#0A0D12] border-[#22314A]'
                : 'bg-gradient-to-br from-slate-50 via-white to-orange-50/40 border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F4511E] to-[#FF7043] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#F4511E]/20 shrink-0">
                  {userInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-base font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {currentUser?.name || 'Super Admin'}
                    </h2>
                    <Badge size="xs" variant={isSuperAdmin ? 'danger' : 'primary'} dot>
                      {currentUser?.roleLabel || (isSuperAdmin ? 'Super Admin' : 'Admin')}
                    </Badge>
                  </div>
                  <div
                    className={`text-xs font-mono mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}
                  >
                    {currentUser?.email || 'superadmin@ptbas.co.id'}
                  </div>
                  <div
                    className={`text-[11px] mt-1 flex items-center gap-2 ${
                      isDark ? 'text-neutral-400' : 'text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Penugasan: {currentUser?.branch || 'Pusat & Hub Gresik'}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-emerald-500 font-medium">Status: Aktif</span>
                  </div>
                </div>
              </div>

              <div
                className={`text-right sm:border-l pl-0 sm:pl-4 ${
                  isDark ? 'border-[#22314A]' : 'border-slate-200'
                }`}
              >
                <div
                  className={`text-[10px] uppercase font-mono tracking-wider ${
                    isDark ? 'text-neutral-500' : 'text-slate-400'
                  }`}
                >
                  ID Pengguna
                </div>
                <div className="text-xs font-mono font-bold text-[#F4511E]">
                  {currentUser?.id || 'usr-1'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Data Pengguna Super Admin */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#10141A] border-[#222E40]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#202938]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#F4511E]" />
                <h3
                  className={`text-xs font-bold uppercase tracking-wider font-mono ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Informasi Profil & Data Pengguna
                </h3>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Sinkron dengan SQLite Database
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Nama Lengkap */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
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
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Email (Read-only dengan info reset Gmail) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider font-mono ${
                        isDark ? 'text-neutral-300' : 'text-slate-700'
                      }`}
                    >
                      Email Gmail Terdaftar
                    </label>
                    <span className="text-[10px] text-emerald-500 font-mono font-semibold">
                      Akun Utama Login
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border font-mono cursor-not-allowed opacity-90 ${
                        isDark
                          ? 'bg-[#0B0F15] border-[#1C2636] text-neutral-300'
                          : 'bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Digunakan untuk login dan verifikasi link reset kata sandi Gmail (Opsi B).
                  </p>
                </div>

                {/* 3. Tanggal Lahir */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                  >
                    Tanggal Lahir
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="date"
                      value={profileForm.birth_date}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, birth_date: e.target.value })
                      }
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-[#F4511E] [color-scheme:dark]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E] [color-scheme:light]'
                      }`}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Format tanggal lahir resmi pimpinan / personil super admin.
                  </p>
                </div>

                {/* 4. Jenis Kelamin */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                  >
                    Jenis Kelamin
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className={`w-full text-xs px-3 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] cursor-pointer ${
                      isDark
                        ? 'bg-[#141B24] border-[#253245] text-white focus:border-[#F4511E]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#F4511E]'
                    }`}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                    Sesuai kartu identitas resmi operasional.
                  </p>
                </div>

                {/* 5. Nomor Telepon */}
                <div className="md:col-span-2">
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
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
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Profile Button */}
              <div
                className={`pt-3 border-t flex justify-end ${
                  isDark ? 'border-[#202938]' : 'border-slate-200'
                }`}
              >
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-lg shadow-[#F4511E]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{profileSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sub-Card: Ubah Kata Sandi Akun */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#10141A] border-[#222E40]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#202938]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3
                  className={`text-xs font-bold uppercase tracking-wider font-mono ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Ubah Kata Sandi Saat Login
                </h3>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Keamanan Akun Dispatch
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Kata Sandi Lama */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                  >
                    Kata Sandi Lama
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className={`w-full text-xs pl-9 pr-9 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                  >
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Min. 6 karakter"
                      className={`w-full text-xs pl-9 pr-9 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}
                  >
                    Ulangi Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Ulangi kata sandi"
                      className={`w-full text-xs pl-9 pr-9 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-amber-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-[#202938]' : 'border-slate-200'
                }`}
              >
                <div
                  className={`text-[11px] flex items-center gap-1.5 ${
                    isDark ? 'text-neutral-400' : 'text-slate-500'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Gunakan kombinasi huruf, angka, dan minimal 6 karakter.</span>
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordSaving ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sub-Card: Fitur Lupa Password & Reset URL via Gmail (Opsi B) */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-gradient-to-r from-[#14101A] to-[#121622] border-[#2C243D]'
                : 'bg-orange-50/60 border-orange-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#F4511E]" />
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Fitur Reset Password Melalui Gmail (Opsi B)
                  </h3>
                  <Badge size="xs" variant="primary">
                    Opsi B Aktif
                  </Badge>
                </div>
                <p
                  className={`text-xs leading-relaxed max-w-xl ${
                    isDark ? 'text-neutral-300' : 'text-slate-600'
                  }`}
                >
                  Bila Anda lupa kata sandi saat berada di luar sistem (halaman login), sistem akan
                  mengirimkan tautan reset token khusus dengan masa berlaku <strong>15 menit</strong> ke
                  alamat Gmail terdaftar Anda (<strong>{currentUser?.email}</strong>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestSelfReset}
                disabled={sendingResetLink}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>
                  {sendingResetLink ? 'Mengirim Tautan...' : 'Kirim Tautan Reset ke Gmail'}
                </span>
              </button>
            </div>

            {/* Dev Link helper if generated */}
            {latestResetUrl && (
              <div
                className={`mt-4 p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono ${
                  isDark
                    ? 'bg-[#0B0F15] border-[#24334A] text-neutral-300'
                    : 'bg-white border-orange-200 text-slate-800'
                }`}
              >
                <div className="truncate max-w-lg">
                  <span className="text-[#F4511E] font-bold">Tautan Reset Baru:</span>{' '}
                  <span className="underline">{latestResetUrl}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(latestResetUrl);
                      addToast('Tautan reset password berhasil disalin!', 'success');
                    }}
                    className="p-1.5 rounded hover:bg-black/20 text-neutral-400 hover:text-white cursor-pointer"
                    title="Salin Tautan"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={latestResetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#F4511E] text-white font-sans font-bold text-[11px] hover:bg-[#d84315] flex items-center gap-1"
                  >
                    <span>Buka Halaman Reset</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PREFERENSI SISTEM & BANTUAN (ORIGINAL SETTINGS)    */}
      {/* ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* SECTION 1: UMUM */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
              Umum
            </div>

            <div
              className={`border rounded-lg overflow-hidden divide-y transition-colors ${
                isDark
                  ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
              }`}
            >
              {/* Jenis Perangkat */}
              <div
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Jenis Perangkat
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      {deviceType}
                    </div>
                  </div>
                </div>
                <Badge size="xs" variant="success" dot>
                  Terverifikasi
                </Badge>
              </div>

              {/* Quick Login with Biometric Toggle */}
              <div
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Quick Login
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Login menggunakan biometrik
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={toggleQuickLogin}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    quickLoginEnabled ? 'bg-[#F4511E]' : isDark ? 'bg-[#2A2E33]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      quickLoginEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mode Tampilan (Dark & Light Mode Toggle) */}
              <div
                onClick={() => {
                  toggleTheme();
                  addToast(
                    `Tema diubah ke ${isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'}`,
                    'info'
                  );
                }}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer select-none ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={!isDark ? 'text-amber-500' : 'text-slate-300'}>
                    {!isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Mode Tampilan (Tema)
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      {!isDark ? 'Mode Terang (Light Mode Aktif)' : 'Mode Gelap (Dark Mode Aktif)'}
                    </div>
                  </div>
                </div>

                {/* Switch Button */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline-block ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}
                  >
                    {!isDark ? 'Light' : 'Dark'}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isDark}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                      addToast(
                        `Tema diubah ke ${
                          isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'
                        }`,
                        'info'
                      );
                    }}
                    className={`group relative inline-flex items-center h-6.5 w-13 shrink-0 cursor-pointer rounded-full p-0.5 border transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] shadow-inner select-none ${
                      !isDark
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 border-amber-300 shadow-amber-500/20'
                        : 'bg-[#151D28] border-[#2A3C56] shadow-black/40'
                    }`}
                    title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                  >
                    <span className="sr-only">Toggle Mode Terang / Gelap</span>

                    <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                      <Moon
                        className={`w-3 h-3 transition-opacity duration-200 ${
                          isDark ? 'text-amber-300/80 opacity-100' : 'opacity-0'
                        }`}
                      />
                      <Sun
                        className={`w-3 h-3 transition-opacity duration-200 ${
                          !isDark ? 'text-white opacity-100' : 'opacity-0'
                        }`}
                      />
                    </div>

                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out z-10 flex items-center justify-center ${
                        !isDark ? 'translate-x-6.5' : 'translate-x-0'
                      }`}
                    >
                      {!isDark ? (
                        <Sun className="w-3 h-3 text-amber-600" />
                      ) : (
                        <Moon className="w-3 h-3 text-slate-800" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BANTUAN */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
              Bantuan
            </div>

            <div
              className={`border rounded-lg overflow-hidden divide-y transition-colors ${
                isDark
                  ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
              }`}
            >
              {/* FAQ */}
              <div
                onClick={() => setActiveModal('faq')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      FAQ
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Frequently Asked Questions
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>

              {/* Laporkan Masalah */}
              <div
                onClick={() => setActiveModal('report')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Laporkan Masalah
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Bantuan teknis & kendala lapangan
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: LEGAL */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
              Legal
            </div>

            <div
              className={`border rounded-lg overflow-hidden divide-y transition-colors ${
                isDark
                  ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
              }`}
            >
              {/* Ketentuan-Ketentuan Penggunaan */}
              <div
                onClick={() => setActiveModal('legal')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Ketentuan-Ketentuan Penggunaan
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      SOP Operasional Truk & Tagihan
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>

              {/* Kebijakan Privasi */}
              <div
                onClick={() => setActiveModal('privacy')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Kebijakan Privasi
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Keamanan data transaksi & perbankan
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: TENTANG */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
              Tentang
            </div>

            <div
              className={`border rounded-lg overflow-hidden divide-y transition-colors ${
                isDark
                  ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
                  : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
              }`}
            >
              {/* Pengembang */}
              <div
                onClick={() => setActiveModal('developer')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Pengembang
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Tim IT PT Berkah Alam Semesta
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>

              {/* Catatan Rilis */}
              <div
                onClick={() => setActiveModal('release')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <ListOrdered className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Catatan Rilis
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Pembaruan sistem & fitur terbaru
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>

              {/* Versi Aplikasi */}
              <div
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Versi Aplikasi
                    </div>
                    <div className="text-xs font-mono text-amber-500 font-bold">1.1.12.rc220</div>
                  </div>
                </div>
                <Badge size="xs" variant="success" dot>
                  Build Resmi
                </Badge>
              </div>

              {/* Atribusi Data */}
              <div
                onClick={() => setActiveModal('attribution')}
                className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-emerald-400">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      Atribusi Data
                    </div>
                    <div
                      className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}
                    >
                      Hak cipta sistem & izin operasional
                    </div>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS */}
      {/* ======================================================== */}

      {/* MODAL: FAQ */}
      <Modal
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal(null)}
        title="Frequently Asked Questions (FAQ)"
        subtitle="Panduan operasional harian dispatch material PT BAS Gresik"
      >
        <div
          className={`p-4 space-y-3 text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}
        >
          <div
            className={`p-3 rounded-md border space-y-1 ${
              isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bagaimana rumus perhitungan kubikasi truk?
            </div>
            <div className="text-neutral-400 font-mono">
              Kubikasi = (Panjang &times; Lebar &times; (Tinggi + Koreksi)) / 1.000.000 m³
            </div>
          </div>

          <div
            className={`p-3 rounded-md border space-y-1 ${
              isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Kapan Nomor PO digenerate?
            </div>
            <div className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
              Peraturan PT BAS: Pre Order awal tidak memiliki nomor PO. Nomor PO resmi otomatis
              digenerate saat Surat Jalan (Good Issue) pertama dicetak!
            </div>
          </div>

          <div
            className={`p-3 rounded-md border space-y-1 ${
              isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Siapa yang berwenang menyetujui Pre Order?
            </div>
            <div className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
              Hanya akun dengan role <strong>Super Admin (Direktur)</strong> yang memiliki akses
              untuk menyetujui atau menolak Pre Order.
            </div>
          </div>

          <div
            className={`p-3 rounded-md border space-y-1 ${
              isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Berapa tarif pajak PPN dan PPH?
            </div>
            <div className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
              PPN adalah 11%. Sedangkan tarif PPH adalah 2.0% untuk material Curah (Limestone Curah,
              Sirtu Curah, Pasir) dan 2.65% untuk material Padat (Base Course, Batu Boulder, Limestone
              Padat).
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: LAPORKAN MASALAH */}
      <Modal
        isOpen={activeModal === 'report'}
        onClose={() => setActiveModal(null)}
        title="Laporkan Masalah Sistem"
        subtitle="Sampaikan kendala teknis atau lapangan ke tim IT PT BAS"
      >
        <form onSubmit={handleSendReport} className="p-4 space-y-3">
          <Select
            label="Kategori Kendala"
            value={reportForm.kategori}
            onChange={(e) => setReportForm({ ...reportForm, kategori: e.target.value })}
          >
            <option value="Bug / Masalah Tampilan">Bug / Masalah Tampilan</option>
            <option value="Perhitungan Kubikasi Tidak Sesuai">Perhitungan Kubikasi Tidak Sesuai</option>
            <option value="Kendala Upload Foto Surat Jalan">Kendala Upload Foto Surat Jalan</option>
            <option value="Masalah Sinkronisasi BKK / Kas Keluar">
              Masalah Sinkronisasi BKK / Kas Keluar
            </option>
          </Select>

          <div>
            <label
              className={`block text-[11px] font-medium mb-1 ${
                isDark ? 'text-neutral-300' : 'text-slate-700'
              }`}
            >
              Detail Kendala
            </label>
            <textarea
              required
              rows={4}
              value={reportForm.pesan}
              onChange={(e) => setReportForm({ ...reportForm, pesan: e.target.value })}
              placeholder="Jelaskan langkah kejadian dan nomor transaksi jika relevan..."
              className={`w-full rounded-md px-3 py-2 text-xs border outline-none focus:ring-1 focus:ring-[#F4511E] ${
                isDark
                  ? 'bg-[#181B1E] border-[#2D3339] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
              }`}
            />
          </div>

          <div
            className={`pt-2 flex justify-end gap-2 border-t ${
              isDark ? 'border-[#24282C]' : 'border-slate-200'
            }`}
          >
            <Button variant="ghost" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Send}>
              Kirim Laporan
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: LEGAL & PRIVASI */}
      <Modal
        isOpen={activeModal === 'legal' || activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'legal'
            ? 'Ketentuan Penggunaan Sistem PT BAS'
            : 'Kebijakan Privasi & Keamanan'
        }
        subtitle="Dokumentasi tata kelola operasional & data internal"
      >
        <div
          className={`p-4 space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto ${
            isDark ? 'text-neutral-300' : 'text-slate-700'
          }`}
        >
          <p>
            Sistem PT BAS Control Center digunakan secara internal oleh seluruh staf, kadiv, admin
            lapangan Gresik, dan direksi PT Berkah Alam Semesta.
          </p>
          <p>
            1. Setiap pengemudi dan armada wajib diverifikasi dimensi baknya sebelum surat jalan
            dicetak.
          </p>
          <p>
            2. Pencatatan pengeluaran kas (BKK) harus disertai dengan verifikasi rekening bank vendor
            yang terdaftar resmi di master data supplier.
          </p>
          <p>
            3. Pembayaran invoice customer tunduk pada ketentuan perpajakan PPN 11% dan tarif
            pemotongan PPH 2.0% atau 2.65% sesuai jenis material tambang.
          </p>
        </div>
      </Modal>

      {/* MODAL: PENGEMBANG & TENTANG */}
      <Modal
        isOpen={
          activeModal === 'developer' || activeModal === 'release' || activeModal === 'attribution'
        }
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'developer'
            ? 'Tim Pengembang Sistem'
            : activeModal === 'release'
            ? 'Catatan Rilis Aplikasi'
            : 'Atribusi & Hak Cipta'
        }
      >
        <div
          className={`p-4 space-y-3 text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}
        >
          <div
            className={`p-3 rounded-md border ${
              isDark ? 'bg-[#181B1E] border-[#2D3339]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              PT BAS Control Center
            </div>
            <div className="text-amber-500 font-mono">Versi 1.1.12.rc220</div>
            <div className={`mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Arsitektur Web Dispatch & ERP Logistik Tambang Gresik Hub
            </div>
          </div>
          <p className="text-neutral-400 text-[11px] pt-1 font-mono">
            &copy; {new Date().getFullYear()} PT Berkah Alam Semesta. Hak cipta dilindungi
            undang-undang.
          </p>
        </div>
      </Modal>
    </div>
  );
}
