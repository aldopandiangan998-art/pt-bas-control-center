import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  X,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  User,
  Calendar,
  Phone,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import MiningPitInteractiveBg from '../../components/common/MiningPitInteractiveBg';

export default function LoginPage({ defaultMode = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const { isDark, setTheme, toggleTheme } = useApp();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState(() => {
    if (defaultMode) return defaultMode;
    return location.pathname === '/register' ? 'register' : 'login';
  });

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  const switchToMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    if (newMode === 'register' && location.pathname !== '/register') {
      navigate('/register');
    } else if (newMode === 'login' && location.pathname !== '/login') {
      navigate('/login');
    }
  };

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Registration Form State matching reference UI
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    birthDate: '',
    gender: 'Laki-Laki',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [birthDateFocused, setBirthDateFocused] = useState(false);

  // Password validation
  const pwdToCheck = mode === 'login' ? loginPassword : regData.password;
  const pwdValidation = useMemo(() => {
    return {
      minLen: pwdToCheck.length >= 8,
      hasUpper: /[A-Z]/.test(pwdToCheck),
      hasNumber: /[0-9]/.test(pwdToCheck),
    };
  }, [pwdToCheck]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Harap isi alamat email operasional dan kata sandi site.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      setLoading(false);

      if (res && res.success) {
        addToast(
          `Otorisasi berhasil. Selamat datang, ${res.user.name} (${res.user.roleLabel || res.user.role})!`,
          'success'
        );
        navigate('/');
      } else {
        setErrorMessage(res?.message || 'Email operasional atau kata sandi tidak valid.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Kendala koneksi ke server dispatch site. Silakan coba kembali.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regData.fullName || !regData.email || !regData.password) {
      setErrorMessage('Harap lengkapi nama lengkap, email, dan kata sandi.');
      return;
    }

    if (regData.password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setErrorMessage('Kata sandi dan masukkan ulang kata sandi tidak cocok.');
      return;
    }

    if (!regData.agreeTerms) {
      setErrorMessage('Anda harus menyetujui Ketentuan Layanan dan Kebijakan Privasi.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: regData.fullName,
        email: regData.email,
        phone: regData.phone ? `+62${regData.phone.replace(/^0+/, '')}` : '-',
        branch: `Site [${regData.gender}] // Tgl: ${regData.birthDate || '-'}`,
        password: regData.password,
      });

      setLoading(false);

      if (res && res.success) {
        if (res.pendingApproval) {
          addToast(
            'Pendaftaran berhasil dikirim. Menunggu verifikasi dari Super Admin.',
            'info'
          );
        } else {
          addToast(
            'Pendaftaran berhasil! Akun Anda telah aktif.',
            'success'
          );
        }
        switchToMode('login');
        setLoginEmail(regData.email);
        setLoginPassword(regData.password);
      } else {
        setErrorMessage(res?.message || 'Pengajuan registrasi gagal.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Gagal menghubungi node dispatch. Silakan coba kembali.');
    }
  };

  // Top-Right Corner Theme Toggle Controller (Pojok Kanan Atas)
  const topThemeToggle = (
    <div
      className={`inline-flex items-center p-1 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 select-none ${isDark
        ? 'bg-[#0B1019]/90 border-[#1E2D44] shadow-black/50'
        : 'bg-white/95 border-slate-300 shadow-slate-200/80'
        }`}
      role="group"
      aria-label="Pilih Mode Tema Tampilan"
    >
      {/* Tombol Terang (Light Mode) */}
      <button
        type="button"
        onClick={() => {
          if (isDark) {
            setTheme('light');
            addToast('Beralih ke Mode Terang (Light Mode)', 'info');
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${!isDark
          ? 'bg-amber-500 text-white shadow-sm'
          : 'text-neutral-400 hover:text-white'
          }`}
        title="Aktifkan Mode Terang"
      >
        <Sun className="w-3.5 h-3.5" />
        <span>Terang</span>
      </button>

      {/* Tombol Gelap (Dark Mode) */}
      <button
        type="button"
        onClick={() => {
          if (!isDark) {
            setTheme('dark');
            addToast('Beralih ke Mode Gelap (Dark Mode)', 'info');
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${isDark
          ? 'bg-[#F4511E] text-white shadow-sm shadow-[#F4511E]/40'
          : 'text-slate-600 hover:text-slate-900'
          }`}
        title="Aktifkan Mode Gelap"
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Gelap</span>
      </button>
    </div>
  );

  return (
    <MiningPitInteractiveBg topRightAction={topThemeToggle}>
      <div className="w-full flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 relative selection:bg-[#F4511E] selection:text-white font-sans">
        {/* Main Center Column Card */}
        <main className="w-full max-w-[430px] mx-auto flex flex-col items-center">
          {/* ======================================================== */}
          {/* MAIN AUTH CARD: AUTENTIKASI PENGGUNA / REGISTRASI        */}
          {/* ======================================================== */}
          <div
            className={`w-full rounded-2xl sm:rounded-3xl border p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative mb-3 transition-colors ${isDark
              ? 'border-[#1E2D44]/90 bg-gradient-to-b from-[#0D1522]/92 via-[#090E17]/92 to-[#060911]/95 text-neutral-200'
              : 'border-slate-200/90 bg-white/95 text-slate-800 shadow-slate-200/60'
              }`}
          >
            {/* Card Top Glow Accent */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#F4511E] to-transparent shadow-[0_0_12px_#F4511E]" />

            {/* Mode Switcher Tabs: Login / Register */}
            <div
              className={`grid grid-cols-2 p-1 rounded-xl mb-4.5 border ${isDark ? 'bg-[#060A12] border-[#182336]' : 'bg-slate-100 border-slate-200'
                }`}
            >
              <button
                type="button"
                onClick={() => switchToMode('login')}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${mode === 'login'
                  ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/30'
                  : isDark
                    ? 'text-neutral-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => switchToMode('register')}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${mode === 'register'
                  ? 'bg-[#F4511E] text-white shadow-md shadow-[#F4511E]/30'
                  : isDark
                    ? 'text-neutral-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* Header Row: Title & Subtitle */}
            {mode === 'login' ? (
              <div className="mb-5">
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Login
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Masuk ke sistem operasional dispatch
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 mb-5">
                <button
                  type="button"
                  onClick={() => switchToMode('login')}
                  className="w-10 h-10 rounded-full bg-[#F4511E] hover:bg-[#D84315] flex items-center justify-center text-white shadow-md shadow-[#F4511E]/30 transition-transform active:scale-95 cursor-pointer shrink-0"
                  title="Kembali ke Login"
                  aria-label="Kembali ke Login"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Register
                  </h1>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    Mohon masukkan profil akun Anda
                  </p>
                </div>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* MODE 1: LOGIN FORM                                   */}
            {/* ---------------------------------------------------- */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Field 1: EMAIL OPERASIONAL */}
                <div className="space-y-1.5">
                  <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                    EMAIL OPERASIONAL
                  </label>

                  <div className="portal-input-box rounded-xl px-3.5 py-3 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#F4511E] shrink-0" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@ptbas.co.id"
                      autoComplete="username"
                      className={`w-full bg-transparent text-xs sm:text-sm outline-none font-mono ${isDark
                        ? 'text-white placeholder:text-neutral-600'
                        : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                    />
                  </div>
                </div>

                {/* Field 2: KATA SANDI */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <label className={`font-bold uppercase tracking-wider ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                      KATA SANDI
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[#F4511E] hover:text-[#FB8C00] font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Lupa Sandi?
                    </button>
                  </div>

                  <div className="portal-input-box rounded-xl px-3.5 py-3 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#F4511E] shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi site"
                      autoComplete="current-password"
                      className={`w-full bg-transparent text-xs sm:text-sm outline-none font-mono ${isDark
                        ? 'text-white placeholder:text-neutral-500'
                        : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`transition-colors cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox: Ingat sesi perangkat ini */}
                <div className="flex items-center justify-between text-xs pt-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1E2D44] bg-[#060A12] text-[#F4511E] accent-[#F4511E] cursor-pointer"
                    />
                    <span className={`text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                      Ingat sesi perangkat ini
                    </span>
                  </label>
                </div>

                {/* Primary Action Button: Masuk ke Sistem */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl portal-btn-primary flex items-center justify-center gap-2.5 text-xs sm:text-sm font-black tracking-wide uppercase cursor-pointer disabled:opacity-50 transition-all shadow-[0_4px_22px_rgba(244,81,30,0.45)]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>MEMVERIFIKASI KREDENSIAL...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-white" />
                      <span className="font-bold tracking-wider">Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ---------------------------------------------------- */
              /* MODE 2: REGISTRATION FORM                            */
              /* ---------------------------------------------------- */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. Nama Lengkap */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    required
                    value={regData.fullName}
                    onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                    placeholder="Nama Lengkap"
                    className={`w-full bg-transparent text-sm outline-none ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 2. Alamat Email */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="Alamat Email"
                    className={`w-full bg-transparent text-sm outline-none ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 3. Tanggal Lahir */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type={birthDateFocused || regData.birthDate ? 'date' : 'text'}
                    onFocus={() => setBirthDateFocused(true)}
                    onBlur={() => setBirthDateFocused(false)}
                    value={regData.birthDate}
                    onChange={(e) => setRegData({ ...regData, birthDate: e.target.value })}
                    placeholder="Tanggal Lahir"
                    className={`w-full bg-transparent text-sm outline-none ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 4. Jenis Kelamin */}
                <div
                  className={`relative rounded-xl border px-4 py-3 transition-colors ${
                    isDark
                      ? 'border-[#222E42] bg-[#060A12]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className={`absolute -top-2.5 left-3.5 px-1.5 text-xs font-semibold text-[#F4511E] ${
                      isDark ? 'bg-[#0B1019]' : 'bg-white'
                    }`}
                  >
                    Jenis Kelamin
                  </span>

                  <div className="flex items-center gap-8 pt-0.5">
                    {/* Option: Laki-Laki */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="gender"
                        value="Laki-Laki"
                        checked={regData.gender === 'Laki-Laki'}
                        onChange={() => setRegData({ ...regData, gender: 'Laki-Laki' })}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          regData.gender === 'Laki-Laki'
                            ? 'border-[#F4511E]'
                            : isDark
                            ? 'border-neutral-600'
                            : 'border-slate-400'
                        }`}
                      >
                        {regData.gender === 'Laki-Laki' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F4511E]" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        Laki-Laki
                      </span>
                    </label>

                    {/* Option: Perempuan */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="gender"
                        value="Perempuan"
                        checked={regData.gender === 'Perempuan'}
                        onChange={() => setRegData({ ...regData, gender: 'Perempuan' })}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          regData.gender === 'Perempuan'
                            ? 'border-[#F4511E]'
                            : isDark
                            ? 'border-neutral-600'
                            : 'border-slate-400'
                        }`}
                      >
                        {regData.gender === 'Perempuan' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F4511E]" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        Perempuan
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5. Nomor Telepon (tanpa +62 atau 0) */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type="tel"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Nomor Telepon (tanpa +62 atau 0)"
                    className={`w-full bg-transparent text-sm outline-none font-mono ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* 6. Kata Sandi */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Kata Sandi"
                    className={`w-full bg-transparent text-sm outline-none ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="cursor-pointer text-[#F4511E] hover:text-[#FF7043] transition-colors shrink-0"
                    title={showRegPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showRegPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                {/* 7. Masukkan Ulang Kata Sandi */}
                <div className="portal-input-box rounded-xl px-4 py-3 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-neutral-400 shrink-0" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="Masukkan Ulang Kata Sandi"
                    className={`w-full bg-transparent text-sm outline-none ${
                      isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="cursor-pointer text-[#F4511E] hover:text-[#FF7043] transition-colors shrink-0"
                    title={showRegConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showRegConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                {/* Checkbox Ketentuan Layanan */}
                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={regData.agreeTerms}
                    onChange={(e) => setRegData({ ...regData, agreeTerms: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-[#262F40] bg-[#060A12] text-[#F4511E] accent-[#F4511E] cursor-pointer shrink-0"
                  />
                  <span className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    Saya setuju dengan Ketentuan Layanan dan Kebijakan Privasi
                  </span>
                </label>

                {/* 10. Submit Button: DAFTAR */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3.5 px-4 rounded-xl bg-[#F4511E] hover:bg-[#D84315] active:scale-[0.99] text-white font-bold tracking-wider text-sm uppercase shadow-lg shadow-[#F4511E]/30 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>MEMPROSES PENDAFTARAN...</span>
                    </>
                  ) : (
                    <span>DAFTAR</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ======================================================== */}
          {/* REGISTER / LOGIN SWITCH LINK                             */}
          {/* ======================================================== */}
          <div className={`text-center text-xs mb-4 font-sans ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
            {mode === 'login' ? (
              <>
                <span>Belum memiliki akun? </span>
                <button
                  type="button"
                  onClick={() => switchToMode('register')}
                  className="text-[#F4511E] font-bold hover:underline cursor-pointer transition-colors"
                >
                  Register Akun Baru
                </button>
              </>
            ) : (
              <>
                <span>Sudah memiliki akun? </span>
                <button
                  type="button"
                  onClick={() => switchToMode('login')}
                  className="text-[#F4511E] font-bold hover:underline cursor-pointer transition-colors"
                >
                  Login ke Akun Anda
                </button>
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* SYSTEM FOOTER                                            */}
          {/* ======================================================== */}
          <div className={`text-center text-[11px] font-sans tracking-wide ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} PT Berkah Alam Semesta • Dispatch & Logistics
          </div>
        </main>

        {/* ======================================================== */}
        {/* MODAL: LUPA KATA SANDI / BANTUAN DISPATCH                */}
        {/* ======================================================== */}
        <AnimatePresence>
          {showForgotPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors ${isDark ? 'bg-[#0B0F19] border-[#22314A] text-neutral-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
              >
                <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#080C14] border-[#182336]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#F4511E]" />
                    <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Reset Sandi & Bantuan Akses Dispatch
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className={`p-1 rounded transition-colors cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <p className={`leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                    Sesuai protokol K3 & Keamanan Siber Tambang mineral, pemulihan kata sandi dilakukan melalui verifikasi manual oleh Site Supervisor Dispatch atau Administrator PT BAS.
                  </p>

                  {/* Dispatch Contacts */}
                  <div className={`p-3.5 rounded-xl border space-y-3 font-mono ${isDark ? 'bg-[#070A12] border-[#192436]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`flex items-center justify-between text-[11px] border-b pb-2 ${isDark ? 'border-[#141C2B]' : 'border-slate-200'}`}>
                      <span className={`font-bold uppercase ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        KEPALA DISPATCH HAULING
                      </span>
                      <span className="text-[#F4511E] font-bold">CH 09 / 148.550 MHz</span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Bpk. Hendra Gunawan, S.T.
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        DISPATCH-LEAD-PIT4
                      </div>
                      <div className="text-[#F4511E] font-bold">+62 811-5409-8821</div>
                    </div>

                    <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-[#141C2B]' : 'border-slate-200'}`}>
                      <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>Security Gate Pos 01:</span>
                      <span className="text-emerald-500 font-bold">+62 812-7019-3304</span>
                    </div>
                  </div>

                  <div className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Sandi default site: <strong>admin123</strong> (Admin) atau <strong>superadmin123</strong> (Super Admin).</span>
                  </div>
                </div>

                <div className={`p-3.5 border-t flex justify-end ${isDark ? 'bg-[#080C14] border-[#182336]' : 'bg-slate-50 border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${isDark ? 'bg-[#162030] hover:bg-[#1E2B40] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                  >
                    Tutup Informasi
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MiningPitInteractiveBg>
  );
}
