import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import MiningPitInteractiveBg from '../../components/common/MiningPitInteractiveBg';
import logo from '../../assets/logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { verifyResetToken, resetPasswordWithToken } = useAuth();
  const { addToast } = useToast();
  const { isDark } = useApp();

  // Verification state
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [targetUser, setTargetUser] = useState({ email: '', name: '' });

  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('Tautan tidak memuat token reset yang valid. Silakan ajukan permohonan reset ulang.');
      return;
    }

    let isMounted = true;
    verifyResetToken(token).then((res) => {
      if (!isMounted) return;
      setVerifying(false);
      if (res && res.success) {
        setTokenValid(true);
        setTargetUser({ email: res.email, name: res.name });
      } else {
        setTokenValid(false);
        setTokenError(res?.message || 'Tautan reset telah kedaluwarsa atau tidak valid.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, verifyResetToken]);

  // Password strength checks
  const pwdValidation = useMemo(() => {
    return {
      minLen: newPassword.length >= 6,
      hasUpper: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      matches: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newPassword || !confirmPassword) {
      setFormError('Harap lengkapi semua kolom kata sandi.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordWithToken({ token, newPassword });
      setSubmitting(false);

      if (res && res.success) {
        setResetSuccess(true);
        addToast('Kata sandi akun Anda berhasil diperbarui!', 'success');
      } else {
        setFormError(res?.message || 'Gagal mengatur ulang kata sandi.');
      }
    } catch (err) {
      setSubmitting(false);
      setFormError('Terjadi kesalahan jaringan. Silakan coba kembali.');
    }
  };

  return (
    <MiningPitInteractiveBg isDark={isDark}>
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <main
          className={`relative backdrop-blur-xl rounded-2xl border shadow-2xl p-6 sm:p-8 transition-colors select-none ${
            isDark
              ? 'bg-[#0E131F]/90 border-[#22314A] shadow-black/80 text-white'
              : 'bg-white/95 border-slate-200 shadow-slate-300/50 text-slate-800'
          }`}
        >
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className={`w-14 h-14 mx-auto rounded-2xl p-2 border mb-3 flex items-center justify-center transition-colors shadow-lg ${
              isDark ? 'bg-black/30 border-white/10 shadow-black/50' : 'bg-slate-50 border-slate-200 shadow-slate-200/50'
            }`}>
              <img src={logo} alt="PT BAS Logo" className="w-full h-full object-contain drop-shadow" />
            </div>
            <h1
              className={`text-lg sm:text-xl font-bold tracking-tight font-sans ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Reset Kata Sandi Akun
            </h1>
            <p
              className={`text-xs mt-1 font-sans ${
                isDark ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              PT Berkah Alam Semesta • Dispatch & Logistics ERP
            </p>
          </div>

          {/* 1. STATE: LOADING / VERIFYING */}
          {verifying && (
            <div className="text-center py-8 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#F4511E] animate-spin mx-auto" />
              <p
                className={`text-xs font-mono font-medium ${
                  isDark ? 'text-neutral-300' : 'text-slate-600'
                }`}
              >
                Memverifikasi tautan token reset Gmail...
              </p>
            </div>
          )}

          {/* 2. STATE: INVALID / EXPIRED TOKEN */}
          {!verifying && !tokenValid && !resetSuccess && (
            <div className="space-y-4 py-2">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isDark
                    ? 'bg-red-950/30 border-red-800/50 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold">Tautan Reset Tidak Valid atau Kedaluwarsa</div>
                  <p className="leading-relaxed opacity-90">{tokenError}</p>
                </div>
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-neutral-400' : 'text-slate-600'
                }`}
              >
                Sesuai protokol K3 & Keamanan Siber PT BAS, setiap tautan pemulihan sandi hanya berlaku
                selama <strong>15 menit</strong> dan langsung hangus setelah digunakan.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Halaman Login</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. STATE: SUCCESS */}
          {resetSuccess && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3
                  className={`text-base font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? 'text-neutral-300' : 'text-slate-600'
                  }`}
                >
                  Kata sandi baru Anda telah aktif. Silakan masuk kembali ke sistem PT BAS Control
                  Center menggunakan kredensial baru Anda.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-lg shadow-[#F4511E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Masuk ke Akun Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 4. STATE: VALID TOKEN - RENDER FORM */}
          {!verifying && tokenValid && !resetSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Identifier Badge */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                  isDark
                    ? 'bg-[#121927] border-[#22314A] text-neutral-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">Akun Pengguna</div>
                  <div className="font-bold text-[#F4511E]">{targetUser.name || 'Pengguna'}</div>
                  <div className="text-[11px] opacity-80">{targetUser.email}</div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold font-sans">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Terverifikasi</span>
                </div>
              </div>

              {formError && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    isDark
                      ? 'bg-red-950/40 border-red-800/50 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Input Sandi Baru */}
              <div>
                <label
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Kata Sandi Baru <span className="text-[#F4511E]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className={`w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                      isDark
                        ? 'bg-[#131A26] border-[#24334A] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Sandi Baru */}
              <div>
                <label
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1 font-mono ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  Ulangi Kata Sandi Baru <span className="text-[#F4511E]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className={`w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-[#F4511E] ${
                      isDark
                        ? 'bg-[#131A26] border-[#24334A] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div
                className={`p-3 rounded-xl border text-[11px] space-y-1.5 font-sans ${
                  isDark ? 'bg-[#0B0F16] border-[#1C283C]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    pwdValidation.minLen
                      ? 'text-emerald-500 font-semibold'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-slate-500'
                  }`}
                >
                  {pwdValidation.minLen ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">•</div>
                  )}
                  <span>Minimal 6 karakter</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    pwdValidation.matches
                      ? 'text-emerald-500 font-semibold'
                      : isDark
                      ? 'text-neutral-400'
                      : 'text-slate-500'
                  }`}
                >
                  {pwdValidation.matches ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">•</div>
                  )}
                  <span>Kata sandi cocok satu sama lain</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F4511E] hover:bg-[#d84315] text-white text-xs font-bold shadow-lg shadow-[#F4511E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={`text-xs font-sans hover:underline cursor-pointer ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Batal dan kembali ke halaman Login
                </button>
              </div>
            </form>
          )}

          {/* Footer copyright */}
          <div
            className={`mt-6 pt-4 border-t text-center text-[11px] font-sans ${
              isDark ? 'border-[#1E293B] text-neutral-500' : 'border-slate-200 text-slate-400'
            }`}
          >
            &copy; {new Date().getFullYear()} PT Berkah Alam Semesta. Gresik Hub Logistics.
          </div>
        </main>
      </div>
    </MiningPitInteractiveBg>
  );
}
