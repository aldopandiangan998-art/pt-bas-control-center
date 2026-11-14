import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Badge, Input, Select } from '../../components/ui';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    branch: 'Hub Gresik (Operasional Tambang & Pabrik)',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage('Harap lengkapi seluruh field wajib.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        branch: formData.branch,
        password: formData.password,
      });

      setLoading(false);

      if (res && res.success) {
        if (res.pendingApproval) {
          addToast(
            'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dari Super Admin.',
            'info'
          );
        } else {
          addToast('Pendaftaran akun berhasil!', 'success');
        }
        navigate('/login');
      } else {
        setErrorMessage(res?.message || 'Pendaftaran akun gagal.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Terjadi kendala saat proses pendaftaran.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D0E] tech-grid flex flex-col justify-center items-center p-4 selection:bg-[#F4511E] selection:text-white py-10">
      {/* Top Brand Tag */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg mb-3 flex items-center justify-between text-xs font-mono"
      >
        <Link
          to="/login"
          className="text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
        <Badge size="xs" variant="primary">
          PENDAFTARAN RESMI
        </Badge>
      </motion.div>

      {/* Main Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg"
      >
        <Card className="border-[#24282C] overflow-hidden shadow-2xl">
          {/* Authentic Timber Accent Header */}
          <div className="timber-header px-5 py-4 border-b border-[#45280C]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-extrabold text-white tracking-wider font-mono uppercase">
                  Registrasi Pengguna PT BAS
                </h1>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Pendaftaran akun sistem kontrol operasional dan direksi
                </p>
              </div>
              <div className="w-9 h-9 rounded bg-black/35 border border-white/20 flex items-center justify-center text-amber-300">
                <UserPlus className="w-5 h-5" />
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Section 1: Data Diri */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#F4511E]" />
                  <span>Identitas Pengguna</span>
                </div>

                <Input
                  label="Nama Lengkap"
                  icon={User}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Arif Pratama"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email Perusahaan"
                    type="email"
                    icon={Mail}
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@ptbas.co.id"
                  />

                  <Input
                    label="Nomor Telepon / WhatsApp"
                    icon={Phone}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                  />
                </div>
              </div>

              {/* Notice Kebijakan Approval Super Admin */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Persetujuan Akun Diperlukan</span>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                    Setiap pendaftaran akun <strong>Admin</strong> baru memerlukan <strong>persetujuan (approval) dari Super Admin (Direksi)</strong> sebelum akun aktif dan dapat digunakan untuk masuk ke sistem.
                  </p>
                </div>
              </div>

              {/* Form Section 2: Cabang & Kata Sandi */}
              <div className="space-y-3 pt-2 border-t border-[#202326]">
                <Select
                  label="Penugasan Cabang / Unit Operasi"
                  icon={Building2}
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                >
                  <option value="Hub Gresik (Operasional Tambang & Pabrik)">
                    Hub Gresik (Operasional Tambang & Pabrik)
                  </option>
                  <option value="Kantor Pusat Surabaya">
                    Kantor Pusat Surabaya (Direksi & Finansial)
                  </option>
                  <option value="Depo Pasir & Tambang Tuban">
                    Depo Pasir & Tambang Tuban
                  </option>
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Input
                      label="Kata Sandi (min. 6 digit)"
                      type={showPassword ? 'text' : 'password'}
                      icon={Lock}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Input
                    label="Konfirmasi Kata Sandi"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={UserPlus}
                  loading={loading}
                  className="w-full justify-center font-bold tracking-wider uppercase text-xs py-2.5 shadow-md"
                >
                  Daftarkan Akun Baru
                </Button>
              </div>
            </form>

            {/* Bottom Login Navigation */}
            <div className="pt-3 border-t border-[#202326] text-center">
              <p className="text-xs text-neutral-400">
                Sudah memiliki akun terdaftar?{' '}
                <Link
                  to="/login"
                  className="text-[#F4511E] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>Masuk ke Akun</span>
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-neutral-500 font-mono">
          &copy; {new Date().getFullYear()} PT Berkah Alam Semesta &bull; Keamanan Sistem ISO 27001
        </div>
      </motion.div>
    </div>
  );
}

