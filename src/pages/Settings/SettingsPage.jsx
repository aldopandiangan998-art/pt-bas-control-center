import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { Button, Badge, Modal, Select } from '../../components/ui';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useApp();

  // Route protection: Settings reserved for Super Admin
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // System settings states
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(true);
  const [deviceType] = useState('Web Desktop Console (Chrome)');
  const [activeModal, setActiveModal] = useState(null);

  // Report issue form state
  const [reportForm, setReportForm] = useState({
    kategori: 'Bug / Masalah Tampilan',
    pesan: '',
  });

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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div
        className={`flex items-center gap-3 pb-3 border-b transition-colors ${isDark ? 'border-[#24282C]' : 'border-slate-200'
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
              className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'
                }`}
            >
              <span>Pengaturan Sistem</span>
              <Badge size="xs" variant="primary">
                v1.1.12
              </Badge>
            </h1>
            <Badge size="xs" variant="danger">
              Super Admin
            </Badge>
          </div>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Preferensi perangkat, autentikasi biometrik, bantuan lapangan, dan ketentuan legalitas
          </p>
        </div>
      </div>

      {/* SECTION 1: UMUM */}
      <div className="space-y-1.5">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
          Umum
        </div>

        <div
          className={`border rounded-lg overflow-hidden divide-y transition-colors ${isDark
            ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
            : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
            }`}
        >
          {/* Jenis Perangkat */}
          <div
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Jenis Perangkat
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
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
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Quick Login
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Login menggunakan biometrik
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={toggleQuickLogin}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${quickLoginEnabled ? 'bg-[#F4511E]' : isDark ? 'bg-[#2A2E33]' : 'bg-slate-300'
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${quickLoginEnabled ? 'translate-x-5' : 'translate-x-0'
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
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer select-none ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={!isDark ? 'text-amber-500' : 'text-slate-300'}>
                {!isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Mode Tampilan (Tema)
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  {!isDark ? 'Mode Terang (Light Mode Aktif)' : 'Mode Gelap (Dark Mode Aktif)'}
                </div>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline-block ${isDark ? 'text-neutral-400' : 'text-slate-500'
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
                    `Tema diubah ke ${isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'
                    }`,
                    'info'
                  );
                }}
                className={`relative inline-flex items-center h-7 w-14 shrink-0 cursor-pointer rounded-full p-0.5 border transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] select-none ${!isDark
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-[#14171A] border-[#2B3037] shadow-inner'
                  }`}
                title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              >
                <span className="sr-only">Toggle Mode Terang / Gelap</span>

                {/* Track background icons (visible only on the opposite/uncovered side) */}
                <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                  <div className="w-6 flex items-center justify-center">
                    <Moon
                      className={`w-3.5 h-3.5 transition-opacity duration-200 ${!isDark ? 'text-white/80 opacity-100' : 'opacity-0'
                        }`}
                    />
                  </div>
                  <div className="w-6 flex items-center justify-center">
                    <Sun
                      className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-neutral-500 opacity-100' : 'opacity-0'
                        }`}
                    />
                  </div>
                </div>

                {/* Moving Thumb with neatly centered icon */}
                <span
                  className={`relative z-10 flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${!isDark ? 'translate-x-7' : 'translate-x-0'
                    }`}
                >
                  {!isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-800 shrink-0" />
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
          className={`border rounded-lg overflow-hidden divide-y transition-colors ${isDark
            ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
            : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
            }`}
        >
          {/* FAQ */}
          <div
            onClick={() => setActiveModal('faq')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  FAQ
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Frequently Asked Questions
                </div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Laporkan Masalah */}
          <div
            onClick={() => setActiveModal('report')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Laporkan Masalah
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
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
          className={`border rounded-lg overflow-hidden divide-y transition-colors ${isDark
            ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
            : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
            }`}
        >
          {/* Ketentuan-Ketentuan Penggunaan */}
          <div
            onClick={() => setActiveModal('legal')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Ketentuan-Ketentuan Penggunaan
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  SOP Operasional Truk & Tagihan
                </div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Kebijakan Privasi */}
          <div
            onClick={() => setActiveModal('privacy')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Kebijakan Privasi
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
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
          className={`border rounded-lg overflow-hidden divide-y transition-colors ${isDark
            ? 'bg-[#131517] border-[#24282C] divide-[#202326]'
            : 'bg-white border-slate-200 divide-slate-100 shadow-sm'
            }`}
        >
          {/* Pengembang */}
          <div
            onClick={() => setActiveModal('developer')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Pengembang
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Tim IT PT Berkah Alam Semesta
                </div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Catatan Rilis */}
          <div
            onClick={() => setActiveModal('release')}
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Catatan Rilis
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Pembaruan sistem & fitur terbaru
                </div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Versi Aplikasi */}
          <div
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
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
            className={`flex items-center justify-between p-4 sm:p-4.5 transition-colors cursor-pointer ${isDark ? 'hover:bg-[#181B1E]' : 'hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  Atribusi Data
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Hak cipta sistem & izin operasional
                </div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>
        </div>
      </div>

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
            className={`p-3 rounded-md border space-y-1 ${isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
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
            className={`p-3 rounded-md border space-y-1 ${isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
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
            className={`p-3 rounded-md border space-y-1 ${isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
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
            className={`p-3 rounded-md border space-y-1 ${isDark ? 'bg-[#181B1E] border-[#262A2F]' : 'bg-slate-50 border-slate-200'
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
              className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'
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
              className={`w-full rounded-md px-3 py-2 text-xs border outline-none focus:ring-1 focus:ring-[#F4511E] ${isDark
                ? 'bg-[#181B1E] border-[#2D3339] text-white placeholder-neutral-500 focus:border-[#F4511E]'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#F4511E]'
                }`}
            />
          </div>

          <div
            className={`pt-2 flex justify-end gap-2 border-t ${isDark ? 'border-[#24282C]' : 'border-slate-200'
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
          className={`p-4 space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto ${isDark ? 'text-neutral-300' : 'text-slate-700'
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
            className={`p-3 rounded-md border ${isDark ? 'bg-[#181B1E] border-[#2D3339]' : 'bg-slate-50 border-slate-200'
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
