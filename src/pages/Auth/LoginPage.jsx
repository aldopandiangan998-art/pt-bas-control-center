import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Scale,
  Truck,
  Activity,
  Radio,
  Building2,
  FileCheck,
  Gauge,
  Cpu,
  CheckCircle2,
  X,
  Phone,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { addToast } = useToast();

  // Mode: 'login' (Masuk Portal) or 'register' (Registrasi Armada Baru)
  const [mode, setMode] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );

  // Weighbridge telemetry modal state
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [complianceChecked, setComplianceChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register form state (Formulir Registrasi Armada Baru)
  const [regData, setRegData] = useState({
    vendorName: '',
    driverName: '',
    simperNumber: '',
    hullNumber: '',
    vehicleType: 'Tronton Dump Index 28 (32.5 m³)',
    email: '',
    password: '',
  });

  // Password requirements calculation
  const pwdToCheck = mode === 'login' ? loginPassword : regData.password;
  const pwdValidation = useMemo(() => {
    return {
      minLen: pwdToCheck.length >= 8,
      hasUpper: /[A-Z]/.test(pwdToCheck),
      hasNumber: /[0-9]/.test(pwdToCheck),
      hasSpecial: /[^A-Za-z0-9]/.test(pwdToCheck),
    };
  }, [pwdToCheck]);

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Harap isi alamat email operasional dan kata sandi.');
      return;
    }

    if (!complianceChecked) {
      setErrorMessage('Harap setujui deklarasi kepatuhan keselamatan operasi tambang.');
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
        setErrorMessage(res?.message || 'Email atau kata sandi tidak valid.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Terjadi kendala saat proses autentikasi terminal. Silakan coba kembali.');
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regData.vendorName || !regData.driverName || !regData.email || !regData.password) {
      setErrorMessage('Harap lengkapi semua field registrasi wajib.');
      return;
    }

    if (!complianceChecked) {
      setErrorMessage('Harap setujui deklarasi kepatuhan keselamatan operasi tambang.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: `${regData.vendorName} - ${regData.driverName}`,
        email: regData.email,
        phone: regData.simperNumber || '0812-3456-7890',
        branch: `Armada [${regData.hullNumber || 'HAUL-UNIT'}] // ${regData.vehicleType}`,
        password: regData.password,
      });

      setLoading(false);

      if (res && res.success) {
        if (res.pendingApproval) {
          addToast(
            'Pengajuan registrasi armada berhasil dikirim. Menunggu persetujuan (approval) dari Super Admin.',
            'info'
          );
        } else {
          addToast(
            'Pengajuan registrasi armada berhasil diverifikasi oleh Mining Dispatch.',
            'success'
          );
        }
        setMode('login');
        setLoginEmail(regData.email);
        setLoginPassword(regData.password);
      } else {
        setErrorMessage(res?.message || 'Pengajuan registrasi gagal.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Kendala koneksi ke server dispatch. Silakan coba kembali.');
    }
  };

  return (
    <div className="min-h-screen titan-portal text-neutral-200 flex flex-col justify-center selection:bg-[#F59E0B] selection:text-black py-6 sm:py-10">
      {/* ======================================================== */}
      {/* MAIN SPLIT CONTENT (LEFT INFO & RIGHT FORM)              */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==================================================== */}
          {/* LEFT COLUMN: PROGRAM & OPERATIONAL TELEMETRY        */}
          {/* ==================================================== */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            {/* Brand Logo & Telemetry Tag */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-[#1C2434] to-[#0E1522] border border-[#2D3B54] flex items-center justify-center shadow-inner">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" fill="#FFFFFF" opacity="0.9" />
                    <polygon points="12,9 15.5,16 8.5,16" fill="#F59E0B" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono font-black text-xs tracking-widest text-white uppercase flex items-center gap-1.5">
                    TITAN FLEET
                    <span className="text-[#F59E0B] text-[10px]">PT BAS</span>
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500">
                    DISPATCH NODE: GRESIK HUB // SEKTOR PIT-04
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0E1522] border border-[#1E2B40] text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold">ONLINE</span>
                  <span className="text-sky-400 text-[9px] ml-1">14MS</span>
                </div>
              </div>
            </div>

            {/* Program Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1422] border border-[#1E2D44] text-[10px] font-mono uppercase tracking-wider text-neutral-300">
              <Cpu className="w-3 h-3 text-[#F59E0B]" />
              <span>PROGRAM INTEGRASI ARMADA LOGISTIK TAMBANG 2025</span>
            </div>

            {/* Giant Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {mode === 'register'
                  ? 'Pendaftaran Vendor & Unit Pengangkutan Tambang'
                  : 'Pusat Kontrol & Otorisasi Pengangkutan Tambang'}
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-2 leading-relaxed">
                Akses langsung jalur hauling terproteksi, weighbridge real-time telemetri, dan validasi unit tanpa hambatan birokrasi manual. Pengajuan Anda diverifikasi instan oleh Supervisor Dispatch Lapangan.
              </p>
            </div>

            {/* Hero Visual Card (Monitor Kelayakan Armada) */}
            <div className="relative rounded-lg overflow-hidden border border-[#1B2538] bg-gradient-to-b from-[#0E1420] via-[#090D15] to-[#06080D] h-36 sm:h-40 flex flex-col justify-between p-3.5 shadow-lg group">
              {/* Technical Blueprint Vector Render (Hauling Quarry Truck at Dusk) */}
              <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
                <svg viewBox="0 0 450 160" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="truckBeam" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                      <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1C273C" />
                      <stop offset="100%" stopColor="#0B1019" />
                    </linearGradient>
                  </defs>

                  {/* Quarry mountain silhouette in background */}
                  <path d="M0 80 L60 55 L130 75 L220 40 L310 65 L400 35 L450 60 L450 160 L0 160 Z" fill="url(#terrainGrad)" opacity="0.6" />
                  
                  {/* Grid contour scanlines */}
                  <line x1="0" y1="90" x2="450" y2="90" stroke="#1D293E" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="450" y2="120" stroke="#1D293E" strokeWidth="0.5" strokeDasharray="3 3" />
                  
                  {/* Heavy Mining Dump Truck Silhouette */}
                  <g transform="translate(180, 50)">
                    {/* Headlight beam shining forward */}
                    <polygon points="120,45 280,15 280,85" fill="url(#truckBeam)" opacity="0.35" />
                    
                    {/* Dump Bed */}
                    <path d="M 10 40 L 70 20 L 75 48 L 5 48 Z" fill="#2D3A50" stroke="#485B7A" strokeWidth="1" />
                    {/* Minerals load in bed */}
                    <path d="M 15 35 Q 40 18 68 22" stroke="#F59E0B" strokeWidth="2.5" fill="none" opacity="0.8" />
                    
                    {/* Truck Cabin & Chassis */}
                    <rect x="73" y="24" width="35" height="25" rx="2" fill="#1C2638" stroke="#3A4A64" strokeWidth="1" />
                    <polygon points="76,26 95,26 95,36 76,36" fill="#0C121C" stroke="#253245" strokeWidth="0.8" />
                    <rect x="0" y="48" width="112" height="6" rx="1" fill="#151E2C" />
                    
                    {/* Massive Wheels */}
                    <circle cx="22" cy="56" r="10" fill="#0D1118" stroke="#37455B" strokeWidth="2" />
                    <circle cx="44" cy="56" r="10" fill="#0D1118" stroke="#37455B" strokeWidth="2" />
                    <circle cx="95" cy="56" r="10" fill="#0D1118" stroke="#37455B" strokeWidth="2" />
                    
                    {/* Hub centers */}
                    <circle cx="22" cy="56" r="3" fill="#F59E0B" />
                    <circle cx="44" cy="56" r="3" fill="#F59E0B" />
                    <circle cx="95" cy="56" r="3" fill="#F59E0B" />
                  </g>
                </svg>
              </div>

              {/* HUD Crosshairs on Top of Visual */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  CAM-02 // HAULING ROAD SEKTOR PIT-04
                </span>
                <span className="text-neutral-500">ISO 39001 COMPLIANT</span>
              </div>

              {/* Text & Badge Overlay */}
              <div className="relative z-10 flex items-end justify-between pt-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                    MONITOR KELAYAKAN ARMADA
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide font-mono uppercase mt-0.5">
                    STANDAR ANGKUTAN KELAS EKSTRIM
                  </div>
                </div>

                <div className="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                  COMMISSIONED
                </div>
              </div>
            </div>

            {/* 3 Key Operational Features */}
            <div className="space-y-2.5 pt-1">
              {/* Feature 1: RFID Weighbridge */}
              <div
                onClick={() => setShowWeighbridgeModal(true)}
                className="p-3 rounded-lg bg-[#0A0E18] border border-[#162030] hover:border-[#1E2E47] flex items-start gap-3 cursor-pointer transition-colors group"
                title="Klik untuk melihat antrean jembatan timbang"
              >
                <div className="w-8 h-8 rounded-lg bg-[#111928] border border-[#1F2E47] group-hover:border-sky-400/50 flex items-center justify-center shrink-0 text-sky-400 mt-0.5 transition-colors">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-white tracking-wide group-hover:text-sky-300 transition-colors">
                      Verifikasi Timbangan Otomatis RFID
                    </h2>
                    <span className="text-[10px] text-[#F59E0B] font-mono group-hover:underline">
                      Antrean Live →
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                    Sinkronisasi Weighbridge digital tanpa antre kertas. Sensor RFID aktif otomatis menimbang bobot kotor (Gross), tare, dan payload netto.
                  </p>
                </div>
              </div>

              {/* Feature 2: GPS Telemetry */}
              <div className="p-3 rounded-lg bg-[#0A0E18] border border-[#162030] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111928] border border-[#1F2E47] flex items-center justify-center shrink-0 text-[#F59E0B] mt-0.5">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white tracking-wide">
                    Pemantauan GPS & Kecepatan Terintegrasi
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                    Geofencing jalur hauling aktif dengan batas kecepatan otomatis (Speed Limit Alert 40 km/h) & mitigasi area blind spot tambang.
                  </p>
                </div>
              </div>

              {/* Feature 3: Digital SIMPER */}
              <div className="p-3 rounded-lg bg-[#0A0E18] border border-[#162030] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111928] border border-[#1F2E47] flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white tracking-wide">
                    Surat Izin Masuk Tambang Digital
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                    Validasi digital SIMPER driver dan KIMPER unit kendaraan. Akses portal pengawasan real-time compliance K3 tambang mineral.
                  </p>
                </div>
              </div>
            </div>

            {/* Field Radio Communication Box */}
            <div className="p-3.5 rounded-lg bg-[#080C14] border border-[#161F2E] space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#131A26] pb-2">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Radio className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="font-bold tracking-wider uppercase">KOMUNIKASI OPERASIONAL LAPANGAN</span>
                </div>
                <span className="text-[#F59E0B] font-bold">CH 09 / 148.550 MHz</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <div className="text-[9px] text-neutral-500 uppercase">KEPALA DISPATCH HAULING</div>
                  <div className="text-white font-bold mt-0.5">Bpk. Hendra Gunawan, S.T.</div>
                  <div className="text-[10px] text-neutral-400">DISPATCH-LEAD-PIT4</div>
                  <div className="text-[10px] text-[#F59E0B]">+62 811-5409-8821</div>
                </div>

                <div>
                  <div className="text-[9px] text-neutral-500 uppercase">SECURITY & GATE CONTROL</div>
                  <div className="text-white font-bold mt-0.5">Terminal Pos Utama 01</div>
                  <div className="text-[10px] text-neutral-400">GATE-CHECKPOINT-ALPHA</div>
                  <div className="text-[10px] text-sky-400">+62 812-7019-3304</div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 pt-1.5 border-t border-[#131A26] flex items-center gap-1.5">
                <span className="text-amber-400">ⓘ</span>
                <span>Pemeriksaan fisik unit (Brake & Steering test) dilakukan di Pos Gate Alpha.</span>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: HIGH-TECH FORM CARD                   */}
          {/* ==================================================== */}
          <div className="lg:col-span-6 xl:col-span-7">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="titan-card rounded-xl overflow-hidden shadow-2xl border-t-2 border-t-[#F59E0B] relative"
            >
              {/* Form Header */}
              <div className="p-5 sm:p-6 border-b border-[#182232] bg-[#0A0E18]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      {mode === 'register' ? 'Formulir Registrasi Armada Baru' : 'Formulir Masuk Portal Operasional'}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {mode === 'register'
                        ? 'Daftarkan kontraktor, pengemudi, dan unit truk pengiriman untuk otorisasi jalur hauling. Seluruh data diverifikasi langsung oleh Mining Dispatch tanpa token SMS/OTP.'
                        : 'Masuk sebagai operator, admin logistik, atau manajemen untuk otorisasi jalur hauling, penerbitan surat jalan, dan kontrol armada.'}
                    </p>
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[#F59E0B] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {mode === 'register' ? 'DIRECT SUBMIT' : 'DIRECT ACCESS'}
                  </span>
                </div>

                {/* Mode Selector Toggle Tabs inside Card */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-lg bg-[#070A12] border border-[#161F2E] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className={`py-2 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      mode === 'login'
                        ? 'bg-[#141C2B] text-white border border-[#23334D] shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Masuk Portal (Login)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className={`py-2 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      mode === 'register'
                        ? 'bg-[#141C2B] text-white border border-[#23334D] shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Registrasi Armada</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* ---------------------------------------------------- */}
                {/* LOGIN FORM                                           */}
                {/* ---------------------------------------------------- */}
                {mode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Section 01: Identitas Akun */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#161F2E] pb-1.5">
                        <span className="text-neutral-300 font-bold uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          01. KREDENSIAL PENGGUNA & IDENTITAS AKUN
                        </span>
                        <span className="text-neutral-500 uppercase">WAJIB LENGKAP</span>
                      </div>

                      {/* Email / Username Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="text-neutral-300 font-medium">
                            Email Resmi Perusahaan / Username
                          </label>
                          <span className="text-neutral-500 font-mono text-[10px]">
                            Akun Dinas PT BAS
                          </span>
                        </div>
                        <div className="titan-input-box rounded-lg px-3 py-2 flex items-center gap-2">
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="contoh: admin@ptbas.co.id"
                            autoComplete="username"
                            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                          />
                          <span className="text-neutral-500 font-mono text-xs">@</span>
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="text-neutral-300 font-medium">
                            Kata Sandi Portal Operasional
                          </label>
                          <span className="text-neutral-500 font-mono text-[10px]">
                            ENKRIPSI SHA-256 DIRECT
                          </span>
                        </div>
                        <div className="titan-input-box rounded-lg px-3 py-2 flex items-center gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Real-time Password Security Indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                          <div className={`flex items-center gap-1.5 ${pwdValidation.minLen ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.minLen ? '●' : '○'}</span>
                            <span>Min. 8 Karakter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasUpper ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasUpper ? '●' : '○'}</span>
                            <span>Huruf Besar</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasNumber ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasNumber ? '●' : '○'}</span>
                            <span>Karakter Angka</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasSpecial ? '●' : '○'}</span>
                            <span>Simbol Khusus</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Declaration Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={complianceChecked}
                          onChange={(e) => setComplianceChecked(e.target.checked)}
                          className="checkbox checkbox-xs rounded bg-[#070A12] border-[#223048] checked:bg-[#F59E0B] checked:border-[#F59E0B] mt-0.5"
                        />
                        <span className="text-[11px] text-neutral-400 leading-relaxed">
                          <strong className="text-neutral-200">Deklarasi Kepatuhan Keselamatan Operasi Tambang:</strong> Menyatakan otorisasi akses sistem resmi untuk operasional hauling PT Berkah Alam Semesta sesuai standar K3 ESDM No. 1827/2018 dan integritas data logistik.
                        </span>
                      </label>
                    </div>

                    {/* Big Action Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full titan-btn-gold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-black" />
                            <span>MEMVERIFIKASI KREDENSIAL...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-black" />
                            <span>AJUKAN OTORISASI MASUK</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bottom Status & Switch Link */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono border-t border-[#161F2E]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verifikasi instan oleh Site Dispatcher</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setErrorMessage('');
                        }}
                        className="text-[#F59E0B] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Belum terdaftar? Registrasi Armada Baru</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ---------------------------------------------------- */
                  /* REGISTER FORM (FORMULIR REGISTRASI ARMADA BARU)      */
                  /* ---------------------------------------------------- */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Section 01: Entitas Vendor & Identitas Armada */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#161F2E] pb-1.5">
                        <span className="text-neutral-300 font-bold uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          01. ENTITAS VENDOR & IDENTITAS ARMADA
                        </span>
                        <span className="text-neutral-500 uppercase">WAJIB LENGKAP</span>
                      </div>

                      {/* Nama Perusahaan Vendor */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="text-neutral-300 font-medium">
                            Nama Perusahaan Vendor / Subkontraktor
                          </label>
                          <span className="text-neutral-500 font-mono text-[10px]">
                            Badan Hukum: PT / CV
                          </span>
                        </div>
                        <div className="titan-input-box rounded-lg px-3 py-2 flex items-center gap-2">
                          <input
                            type="text"
                            required
                            value={regData.vendorName}
                            onChange={(e) => setRegData({ ...regData, vendorName: e.target.value })}
                            placeholder="contoh: PT Samudra Trans Batubara"
                            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                          />
                          <Building2 className="w-4 h-4 text-neutral-500 shrink-0" />
                        </div>
                      </div>

                      {/* 2-Col: Driver Name & SIMPER/KIMPER */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-neutral-300 font-medium text-[11px]">
                            Nama Lengkap Driver Utama / Operator
                          </label>
                          <div className="titan-input-box rounded-lg px-3 py-2">
                            <input
                              type="text"
                              required
                              value={regData.driverName}
                              onChange={(e) => setRegData({ ...regData, driverName: e.target.value })}
                              placeholder="Nama sesuai KTP & SIMPER"
                              className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="text-neutral-300 font-medium">
                              Nomor SIMPER / KIMPER Aktif
                            </label>
                            <span className="text-emerald-400 font-mono text-[9px]">
                              K3 Terverifikasi
                            </span>
                          </div>
                          <div className="titan-input-box rounded-lg px-3 py-2">
                            <input
                              type="text"
                              required
                              value={regData.simperNumber}
                              onChange={(e) => setRegData({ ...regData, simperNumber: e.target.value })}
                              placeholder="SMP-2025-XXXX-09"
                              className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2-Col: Nomor Lambung Unit & Tipe Kendaraan */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-neutral-300 font-medium text-[11px]">
                            Nomor Lambung Unit (Hull No.)
                          </label>
                          <div className="titan-input-box rounded-lg px-3 py-2">
                            <input
                              type="text"
                              required
                              value={regData.hullNumber}
                              onChange={(e) => setRegData({ ...regData, hullNumber: e.target.value })}
                              placeholder="DT-884 / TR-120"
                              className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-neutral-300 font-medium text-[11px]">
                            Tipe Kendaraan & Kelas Muatan
                          </label>
                          <div className="titan-input-box rounded-lg px-3 py-2">
                            <select
                              value={regData.vehicleType}
                              onChange={(e) => setRegData({ ...regData, vehicleType: e.target.value })}
                              className="w-full bg-transparent text-white text-xs outline-none font-mono cursor-pointer"
                            >
                              <option value="Tronton Dump Index 28 (32.5 m³)" className="bg-[#0B0F19]">
                                Tronton Dump Index 28 (32.5 m³)
                              </option>
                              <option value="Dump Truck Index 24 (23.8 m³)" className="bg-[#0B0F19]">
                                Dump Truck Index 24 (23.8 m³)
                              </option>
                              <option value="Colt Diesel CDD (8.0 m³)" className="bg-[#0B0F19]">
                                Colt Diesel CDD (8.0 m³)
                              </option>
                              <option value="Trailer Hauling Tambang (45.0 m³)" className="bg-[#0B0F19]">
                                Trailer Hauling Tambang (45.0 m³)
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 02: Kredensial Portal Telemetri & Dispatch */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#161F2E] pb-1.5">
                        <span className="text-neutral-300 font-bold uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          02. KREDENSIAL PORTAL TELEMETRI & DISPATCH
                        </span>
                        <span className="text-neutral-500 uppercase">ENKRIPSI SHA-256 DIRECT</span>
                      </div>

                      {/* Email Perusahaan */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="text-neutral-300 font-medium">
                            Email Operasional Perusahaan
                          </label>
                          <span className="text-neutral-500 font-mono text-[10px]">
                            Untuk Notifikasi Slip Timbang & DO
                          </span>
                        </div>
                        <div className="titan-input-box rounded-lg px-3 py-2 flex items-center gap-2">
                          <input
                            type="email"
                            required
                            value={regData.email}
                            onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                            placeholder="logistik.fleet@vendorcoal.co.id"
                            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                          />
                          <span className="text-neutral-500 font-mono text-xs">@</span>
                        </div>
                      </div>

                      {/* Kata Sandi */}
                      <div className="space-y-1">
                        <label className="text-neutral-300 font-medium text-[11px]">
                          Kata Sandi Portal Operasional
                        </label>
                        <div className="titan-input-box rounded-lg px-3 py-2 flex items-center gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={regData.password}
                            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                            placeholder="••••••••••••"
                            className="w-full bg-transparent text-white text-xs outline-none placeholder:text-neutral-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                          <div className={`flex items-center gap-1.5 ${pwdValidation.minLen ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.minLen ? '●' : '○'}</span>
                            <span>Min. 8 Karakter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasUpper ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasUpper ? '●' : '○'}</span>
                            <span>Huruf Besar</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasNumber ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasNumber ? '●' : '○'}</span>
                            <span>Karakter Angka</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${pwdValidation.hasSpecial ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            <span>{pwdValidation.hasSpecial ? '●' : '○'}</span>
                            <span>Simbol Khusus</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Declaration Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={complianceChecked}
                          onChange={(e) => setComplianceChecked(e.target.checked)}
                          className="checkbox checkbox-xs rounded bg-[#070A12] border-[#223048] checked:bg-[#F59E0B] checked:border-[#F59E0B] mt-0.5"
                        />
                        <span className="text-[11px] text-neutral-400 leading-relaxed">
                          <strong className="text-neutral-200">Deklarasi Kepatuhan Keselamatan Operasi Tambang:</strong> Menyatakan unit armada telah lolos uji berkala Commissioning K3, uji emisi gas buang standar tambang ESDM No. 1827/2018, dan pengemudi memiliki sertifikasi defensif hauling aktif.
                        </span>
                      </label>
                    </div>

                    {/* Big Action Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full titan-btn-gold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-black" />
                            <span>MEMPROSES PENDAFTARAN...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-black" />
                            <span>AJUKAN OTORISASI ARMADA</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bottom Status & Switch Link */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono border-t border-[#161F2E]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verifikasi instan oleh Site Dispatcher</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMessage('');
                        }}
                        className="text-[#F59E0B] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Sudah terdaftar? Masuk ke Portal Operasional</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* WEIGHBRIDGE TELEMETRY MODAL                              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showWeighbridgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl bg-[#0B0F19] border border-[#22314A] shadow-2xl overflow-hidden font-mono"
            >
              <div className="p-4 border-b border-[#182336] flex items-center justify-between bg-[#080C14]">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Telemetri Antrean Jembatan Timbang
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeighbridgeModal(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {/* Scale 01 */}
                <div className="p-3 rounded-lg bg-[#070A12] border border-[#162030] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Weighbridge 01 (Inbound Gross)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/30">
                      AKTIF BEROPERASI
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Antrean saat ini: <span className="text-[#F59E0B] font-bold">2 Unit Truk</span> (DT-884, DT-612)
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Sensor: Mettler Toledo Load Cell 80 Ton | Toleransi: ±0.02%
                  </div>
                </div>

                {/* Scale 02 */}
                <div className="p-3 rounded-lg bg-[#070A12] border border-[#162030] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Weighbridge 02 (Outbound Tare)</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] border border-sky-500/30">
                      JALUR TERBUKA
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Antrean saat ini: <span className="text-emerald-400 font-bold">0 Unit (Siap Timbang)</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Rata-rata waktu siklus timbang netto: 1.4 menit per armada
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#080C14] border-t border-[#182336] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowWeighbridgeModal(false)}
                  className="px-4 py-1.5 rounded bg-[#162030] hover:bg-[#1E2B40] text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Tutup Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
