import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Badge, Input } from '../../components/ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email, password);
      setLoading(false);

      if (res && res.success) {
        addToast(
          `Selamat datang, ${res.user.name}! Masuk sebagai ${res.user.roleLabel || res.user.role}.`,
          'success'
        );
        navigate('/');
      } else {
        setErrorMessage(res?.message || 'Email atau kata sandi tidak valid.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Terjadi kendala saat proses autentikasi. Silakan coba kembali.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D0E] tech-grid flex flex-col justify-center items-center p-4 selection:bg-[#F4511E] selection:text-white">
      {/* Top Brand Tag */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mb-4 flex items-center justify-between text-xs font-mono"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-400 font-semibold tracking-wider uppercase">
            PT BERKAH ALAM SEMESTA
          </span>
        </div>
        <Badge size="xs" variant="primary">
          GRESIK HUB
        </Badge>
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <Card className="border-[#24282C] overflow-hidden shadow-2xl">
          {/* Authentic Timber Accent Header */}
          <div className="timber-header px-5 py-4 border-b border-[#45280C]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-extrabold text-white tracking-wider font-mono uppercase">
                  PT BAS Control Center
                </h1>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Portal Autentikasi Pengiriman & Tambang
                </p>
              </div>
              <div className="w-9 h-9 rounded bg-black/35 border border-white/20 flex items-center justify-center text-amber-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Error banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Email Terdaftar"
                type="email"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@ptbas.co.id"
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    label="Kata Sandi"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Security Note */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox checkbox-xs rounded bg-[#181B1E] border-[#2D3339] checked:bg-[#F4511E] checked:border-[#F4511E]"
                  />
                  <span className="text-[11px] text-neutral-400">Ingat sesi di perangkat ini</span>
                </label>

                <span className="text-[11px] text-neutral-500 font-mono">
                  TLS 1.3 Encrypted
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={LogIn}
                  loading={loading}
                  className="w-full justify-center font-bold tracking-wider uppercase text-xs py-2.5 shadow-md"
                >
                  Masuk ke Sistem Kontrol
                </Button>
              </div>
            </form>

            {/* Bottom Register Navigation */}
            <div className="pt-3 border-t border-[#202326] text-center">
              <p className="text-xs text-neutral-400">
                Belum memiliki akun resmi?{' '}
                <Link
                  to="/register"
                  className="text-[#F4511E] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>Daftar Akun Baru</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-neutral-500 font-mono">
          &copy; {new Date().getFullYear()} PT Berkah Alam Semesta &bull; Gresik Dispatch ERP
        </div>
      </motion.div>
    </div>
  );
}

