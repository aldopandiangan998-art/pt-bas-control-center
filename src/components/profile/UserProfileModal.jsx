import { useState, useEffect } from 'react';
import {
  X,
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
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui';

export default function UserProfileModal({ isOpen, onClose, initialTab = 'profile' }) {
  const { currentUser, isSuperAdmin, updateProfile, changePassword, requestPasswordReset } = useAuth();
  const { addToast } = useToast();
  const { isDark } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    birth_date: currentUser?.birth_date || '',
    gender: currentUser?.gender || 'Laki-laki',
    phone: currentUser?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync profileForm when currentUser updates or modal opens
  useEffect(() => {
    if (currentUser && isOpen) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        birth_date: currentUser.birth_date || '',
        gender: currentUser.gender || 'Laki-laki',
        phone: currentUser.phone || '',
      });
      setActiveTab(initialTab);
    }
  }, [currentUser, isOpen, initialTab]);

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

  if (!isOpen) return null;

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
        addToast(res.message || 'Kata sandi akun berhasil diperbarui!', 'success');
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

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors max-h-[90vh] flex flex-col ${
          isDark ? 'bg-[#0E1218] border-[#222E40] text-neutral-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#0A0D12] border-[#1C2636]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4511E]/20 text-[#F4511E] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Profil Akun {isSuperAdmin ? 'Super Admin' : 'Pengguna'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Kelola data identitas operasional, tanggal lahir, jenis kelamin, dan keamanan sandi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div
          className={`flex items-center gap-1 px-5 pt-3 border-b shrink-0 ${
            isDark ? 'bg-[#0E1218] border-[#1C2636]' : 'bg-white border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#F4511E] text-[#F4511E]'
                : isDark
                ? 'border-transparent text-neutral-400 hover:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Data Profil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-[#F4511E] text-[#F4511E]'
                : isDark
                ? 'border-transparent text-neutral-400 hover:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Keamanan & Sandi</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* User Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-gradient-to-r from-[#121824] to-[#0D111A] border-[#1F2C40]'
                : 'bg-gradient-to-r from-orange-50/70 to-slate-50 border-orange-200/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#F4511E] to-[#FF7043] text-white flex items-center justify-center font-extrabold text-base shadow-md shrink-0">
                {userInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser?.name || 'Super Admin'}
                  </span>
                  <Badge size="xs" variant={isSuperAdmin ? 'danger' : 'primary'} dot>
                    {currentUser?.roleLabel || (isSuperAdmin ? 'Super Admin' : 'Admin')}
                  </Badge>
                </div>
                <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {currentUser?.email}
                </div>
                <div className={`text-[10px] mt-1.5 flex items-center gap-2 flex-wrap ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>Penugasan: {currentUser?.branch && !currentUser.branch.includes('Site [') ? currentUser.branch : 'Hub Gresik'}</span>
                  </span>
                  <span>•</span>
                  <span>{currentUser?.gender || 'Laki-laki'}</span>
                  {currentUser?.birth_date && (
                    <>
                      <span>•</span>
                      <span>Lahir: {currentUser.birth_date}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={`text-right sm:border-l pl-0 sm:pl-3 font-mono ${isDark ? 'border-[#1F2C40]' : 'border-slate-200'}`}>
              <div className="text-[10px] text-neutral-500 uppercase">ID Pengguna</div>
              <div className="text-xs font-bold text-[#F4511E]">{currentUser?.id || 'usr-1'}</div>
            </div>
          </div>

          {/* TAB 1: FORM DATA PROFIL */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                {/* 2. Email (Read-only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      className={`block text-[11px] font-bold uppercase tracking-wider font-mono ${
                        isDark ? 'text-neutral-300' : 'text-slate-700'
                      }`}
                    >
                      Email Gmail Terdaftar
                    </label>
                    <span className="text-[10px] text-emerald-500 font-mono font-semibold">Tervalidasi</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border font-mono cursor-not-allowed opacity-90 ${
                        isDark ? 'bg-[#0B0F15] border-[#1C2636] text-neutral-300' : 'bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                    />
                  </div>
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
                      onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                      className={`w-full text-xs pl-9 pr-3 py-2 rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                        isDark
                          ? 'bg-[#141B24] border-[#253245] text-white placeholder-neutral-500 focus:border-[#F4511E] [color-scheme:dark]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E] [color-scheme:light]'
                      }`}
                    />
                  </div>
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
                </div>

                {/* 5. Nomor Telepon */}
                <div className="sm:col-span-2">
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

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-md shadow-[#F4511E]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{profileSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: KEAMANAN & SANDI */}
          {activeTab === 'password' && (
            <div className="space-y-4">
              {/* Form Ubah Sandi */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#111620] border-[#1E2B3E]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Ubah Kata Sandi Saat Login
                  </h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Kata Sandi Lama */}
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                        Sandi Lama
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          placeholder="••••••••"
                          className={`w-full text-xs pl-8 pr-8 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDark
                              ? 'bg-[#161E2C] border-[#253245] text-white focus:border-amber-500'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-2 top-2 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Kata Sandi Baru */}
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                        Sandi Baru
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Min. 6 karakter"
                          className={`w-full text-xs pl-8 pr-8 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDark
                              ? 'bg-[#161E2C] border-[#253245] text-white focus:border-amber-500'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-2 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Kata Sandi Baru */}
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                        Ulangi Sandi Baru
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Ulangi sandi"
                          className={`w-full text-xs pl-8 pr-8 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDark
                              ? 'bg-[#161E2C] border-[#253245] text-white focus:border-amber-500'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-2 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Minimal 6 karakter.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{passwordSaving ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Fitur Reset Password Gmail (Opsi B) */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-gradient-to-r from-[#14101A] to-[#121622] border-[#2C243D]' : 'bg-orange-50/70 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#F4511E]" />
                      <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Reset Password Melalui Gmail (Opsi B)
                      </h3>
                      <Badge size="xs" variant="primary">Opsi B Aktif</Badge>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                      Tautan reset berlaku selama <strong>15 menit</strong> dan dikirimkan ke <strong>{currentUser?.email}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestSelfReset}
                    disabled={sendingResetLink}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{sendingResetLink ? 'Mengirim...' : 'Kirim Tautan Reset'}</span>
                  </button>
                </div>

                {latestResetUrl && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono ${
                      isDark ? 'bg-[#0B0F15] border-[#24334A] text-neutral-300' : 'bg-white border-orange-200 text-slate-800'
                    }`}
                  >
                    <div className="truncate max-w-sm">
                      <span className="text-[#F4511E] font-bold">Link Reset:</span>{' '}
                      <span className="underline">{latestResetUrl}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(latestResetUrl);
                          addToast('Tautan reset berhasil disalin!', 'success');
                        }}
                        className="p-1 rounded hover:bg-black/20 text-neutral-400 hover:text-white cursor-pointer"
                        title="Salin Tautan"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={latestResetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-[#F4511E] text-white font-sans font-bold text-[10px] hover:bg-[#d84315] flex items-center gap-1"
                      >
                        <span>Buka Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end shrink-0 ${
            isDark ? 'bg-[#0A0D12] border-[#1C2636]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isDark ? 'bg-[#18202C] hover:bg-[#222E40] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
