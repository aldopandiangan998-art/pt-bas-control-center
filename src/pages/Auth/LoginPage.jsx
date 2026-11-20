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
  KeyRound,
  Copy,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import MiningPitInteractiveBg from '../../components/common/MiningPitInteractiveBg';
import logo from '../../assets/logo.png';

export default function LoginPage({ defaultMode = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, requestPasswordReset } = useAuth();
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

  // Pending approval state (after registration)
  const [pendingInfo, setPendingInfo] = useState(null); // { name, email }

  // Modals
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSentInfo, setResetSentInfo] = useState(null);
  const [resetError, setResetError] = useState('');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail.trim()) {
      setResetError('Harap masukkan alamat email akun Anda.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      setResetSubmitting(false);

      if (res && res.success) {
        setResetSentInfo({
          message: res.message,
          resetUrl: res.resetUrl,
          emailSent: res.emailSent,
          emailNotice: res.emailNotice,
        });
      } else {
        setResetError(res?.message || 'Gagal memproses permohonan reset sandi.');
      }
    } catch (err) {
      setResetSubmitting(false);
      setResetError('Kendala koneksi ke server dispatch.');
    }
  };

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
      } else if (res?.isPendingApproval) {
        // Account registered but not yet approved by Super Admin
        setPendingInfo({ name: res.userName || loginEmail.split('@')[0], email: res.userEmail || loginEmail });
        setMode('pending');
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
        branch: 'Hub Gresik',
        birth_date: regData.birthDate || null,
        gender: regData.gender || 'Laki-laki',
        password: regData.password,
      });

      setLoading(false);

      if (res && res.success) {
        if (res.pendingApproval) {
          // Show waiting-for-approval screen
          setPendingInfo({ name: regData.fullName, email: regData.email });
          setMode('pending');
          navigate('/login');
        } else {
          addToast(
            'Pendaftaran berhasil! Akun Anda telah aktif.',
            'success'
          );
          switchToMode('login');
          setLoginEmail(regData.email);
          setLoginPassword(regData.password);
        }
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
        {/* ======================================================== */}
        {/* PENDING APPROVAL: Full standalone page                   */}
        {/* ======================================================== */}
        {mode === 'pending' && pendingInfo ? (
          <main className="w-full max-w-[400px] mx-auto flex flex-col items-center">
            <motion.div
              key="pending-page"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`w-full rounded-2xl sm:rounded-3xl border p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative text-center ${isDark
                ? 'border-[#1E2D44]/90 bg-gradient-to-b from-[#0D1522]/92 via-[#090E17]/92 to-[#060911]/95 text-neutral-200'
                : 'border-slate-200/90 bg-white/95 text-slate-800'
                }`}
            >
              {/* Top glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_theme(colors.amber.500)]" />

              {/* PT BAS Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F4511E]/10 border border-[#F4511E]/30 flex items-center justify-center shadow-lg shadow-[#F4511E]/10">
                  <span className="text-[#F4511E] font-black text-xl font-mono">B</span>
                </div>
              </div>

              {/* Animated waiting icon */}
              <div className="relative inline-flex mb-5">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Clock className="w-9 h-9 text-amber-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F4511E]/15 border border-[#F4511E]/40 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#F4511E]" />
                </div>
              </div>

              {/* Title */}
              <h2 className={`text-xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Menunggu Persetujuan
              </h2>
              <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Pendaftaran akun Anda telah berhasil dikirim dan sedang menunggu verifikasi dari{' '}
                <span className="text-amber-400 font-bold">Super Admin</span> PT Berkah Alam Semesta.
              </p>

              {/* Alert note */}
              <div className={`w-full rounded-xl border p-3.5 flex items-start gap-2.5 text-xs text-left mb-6 ${isDark
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/80'
                : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Akun Anda akan diaktifkan setelah disetujui oleh Super Admin. Silakan hubungi Super Admin PT BAS untuk mempercepat proses persetujuan.
                </span>
              </div>

              {/* Back to login */}
              <button
                type="button"
                onClick={() => {
                  setPendingInfo(null);
                  switchToMode('login');
                }}
                className="w-full py-3 px-4 rounded-xl border border-[#F4511E]/40 text-[#F4511E] hover:bg-[#F4511E]/10 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali ke Halaman Login
              </button>
            </motion.div>

            {/* Footer */}
            <div className={`text-center text-[11px] font-sans tracking-wide mt-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
              © {new Date().getFullYear()} PT Berkah Alam Semesta • Dispatch &amp; Logistics
            </div>
          </main>
        ) : (
          <main className="w-full max-w-[430px] mx-auto flex flex-col items-center">
            {/* Brand Logo & System Header */}
            <div className="flex flex-col items-center mb-5 text-center">
              <div className={`w-16 h-16 rounded-2xl p-2.5 backdrop-blur-md border shadow-xl flex items-center justify-center mb-3 transition-colors ${
                isDark ? 'bg-black/30 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200/50'
              }`}>
                <img src={logo} alt="PT BAS Logo" className="w-full h-full object-contain drop-shadow" />
              </div>
              <h2 className={`font-black text-lg tracking-wider font-mono uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
                PT Berkah Alam Semesta
              </h2>
              <p className={`text-xs font-mono tracking-widest uppercase ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                Control Center Dispatch
              </p>
            </div>

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
                        placeholder="user@ptbas.co.id"
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
                        onClick={() => {
                          setResetEmail(loginEmail || '');
                          setResetSentInfo(null);
                          setResetError('');
                          setShowForgotPasswordModal(true);
                        }}
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
                      className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
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
                      className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
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
                      className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                    />
                  </div>

                  {/* 4. Jenis Kelamin */}
                  <div
                    className={`relative rounded-xl border px-4 py-3 transition-colors ${isDark
                      ? 'border-[#222E42] bg-[#060A12]'
                      : 'border-slate-300 bg-white'
                      }`}
                  >
                    <span
                      className={`absolute -top-2.5 left-3.5 px-1.5 text-xs font-semibold text-[#F4511E] ${isDark ? 'bg-[#0B1019]' : 'bg-white'
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
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${regData.gender === 'Laki-Laki'
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
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${regData.gender === 'Perempuan'
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
                      className={`w-full bg-transparent text-sm outline-none font-mono ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
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
                      className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
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
                      className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
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
        )}

        {/* ======================================================== */}
        {/* MODAL: RESET KATA SANDI VIA GMAIL (OPSI B)               */}
        {/* ======================================================== */}
        <AnimatePresence>
          {showForgotPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors ${isDark
                  ? 'bg-[#0B0F19] border-[#22314A] text-neutral-200'
                  : 'bg-white border-slate-200 text-slate-800'
                  }`}
              >
                {/* Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#080C14] border-[#182336]' : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#F4511E]" />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                      Reset Kata Sandi via Gmail (Opsi B)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className={`p-1 rounded transition-colors cursor-pointer ${isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-slate-400 hover:text-slate-700'
                      }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 text-xs">
                  {!resetSentInfo ? (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <p
                        className={`leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'
                          }`}
                      >
                        Masukkan alamat Gmail yang terdaftar pada akun Anda. Tautan token verifikasi
                        khusus (berlaku <strong>15 menit</strong>) akan dikirimkan ke kotak masuk Gmail Anda
                        untuk mengatur ulang kata sandi baru.
                      </p>

                      {resetError && (
                        <div
                          className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${isDark
                            ? 'bg-red-950/40 border-red-800/50 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                        >
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>{resetError}</span>
                        </div>
                      )}

                      <div>
                        <label
                          className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${isDark ? 'text-neutral-300' : 'text-slate-700'
                            }`}
                        >
                          Email Gmail Terdaftar
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Contoh: superadmin@ptbas.co.id"
                            className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${isDark
                              ? 'bg-[#121824] border-[#22314A] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                              : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                              }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={resetSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {resetSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Mengirim Tautan ke Gmail...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Kirim Tautan Reset Password</span>
                          </>
                        )}
                      </button>

                      {/* Subtle Help note */}
                      <div
                        className={`pt-3 border-t text-[11px] leading-relaxed ${isDark ? 'border-[#192436] text-neutral-400' : 'border-slate-200 text-slate-500'
                          }`}
                      >
                        <div className="font-semibold text-[#F4511E] mb-0.5">Bantuan Lapangan Tambang:</div>
                        Radio Dispatch: <strong>CH 09 / 148.550 MHz</strong> | Hotline Supervisor:{' '}
                        <strong>+62 811-5409-8821</strong>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 py-2">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4
                          className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                          Tautan Reset Telah Diproses!
                        </h4>
                        <p
                          className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'
                            }`}
                        >
                          {resetSentInfo.message}
                        </p>
                      </div>

                      {resetSentInfo.resetUrl && (
                        <div
                          className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${isDark
                            ? 'bg-[#0E1522] border-[#22334D] text-neutral-300'
                            : 'bg-orange-50 border-orange-200 text-slate-800'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#F4511E] uppercase">
                              Tautan Reset URL (Direct Access)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(resetSentInfo.resetUrl);
                                addToast('Tautan reset password berhasil disalin!', 'success');
                              }}
                              className="p-1 rounded hover:bg-black/20 text-neutral-400 hover:text-white cursor-pointer"
                              title="Salin Tautan"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] truncate select-all opacity-90">
                            {resetSentInfo.resetUrl}
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowForgotPasswordModal(false);
                                const tokenQuery = resetSentInfo.resetUrl.split('?')[1];
                                navigate(`/reset-password?${tokenQuery}`);
                              }}
                              className="w-full py-2 px-3 rounded-lg bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-sm"
                            >
                              <span>Buka Halaman Reset Sekarang</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className={`p-3.5 border-t flex justify-end ${isDark ? 'bg-[#080C14] border-[#182336]' : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${isDark
                      ? 'bg-[#162030] hover:bg-[#1E2B40] text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                  >
                    Tutup
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
