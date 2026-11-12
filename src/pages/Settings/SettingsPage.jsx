import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Fingerprint,
  Moon,
  HelpCircle,
  Headphones,
  BookOpen,
  FileText,
  Code,
  ListOrdered,
  Smartphone,
  Info,
  X,
  Check,
  Send,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Settings states
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('Mode Mengikuti Sistem');
  const [deviceType, setDeviceType] = useState('Web Desktop Console (Chrome)');

  // Modals for interactive exploration
  const [activeModal, setActiveModal] = useState(null); // 'faq' | 'report' | 'legal' | 'privacy' | 'release' | 'developer' | 'attribution'

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

  // Report issue form state
  const [reportForm, setReportForm] = useState({
    kategori: 'Bug / Masalah Tampilan',
    pesan: '',
  });

  const handleSendReport = (e) => {
    e.preventDefault();
    if (!reportForm.pesan) return;
    addToast('Laporan masalah berhasil dikirim ke Tim IT PT BAS Gresik!', 'success');
    setReportForm({ kategori: 'Bug / Masalah Tampilan', pesan: '' });
    setActiveModal(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header strictly matching Screenshot a384cad2 */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#242424]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-[#202020] transition-colors"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">Pengaturan</h1>
      </div>

      {/* SECTION 1: UMUM */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 py-1">
          Umum
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#242424]">
          {/* Jenis Perangkat */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Jenis Perangkat</div>
                <div className="text-xs text-neutral-400">{deviceType}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 text-neutral-400 border border-[#333]">
              Terverifikasi
            </span>
          </div>

          {/* Quick Login with Biometric Toggle */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Quick Login</div>
                <div className="text-xs text-neutral-400">Login menggunakan biometrik</div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={toggleQuickLogin}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                quickLoginEnabled ? 'bg-[#F4511E]' : 'bg-neutral-600'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  quickLoginEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tema */}
          <div
            onClick={() => {
              const themes = [
                'Mode Mengikuti Sistem',
                'Dark Industrial PT BAS',
                'Kontras Tinggi Tambang',
              ];
              const nextIndex = (themes.indexOf(selectedTheme) + 1) % themes.length;
              setSelectedTheme(themes[nextIndex]);
              addToast(`Tema diubah: ${themes[nextIndex]}`, 'info');
            }}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Tema</div>
                <div className="text-xs text-neutral-400">{selectedTheme}</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">Ubah &rsaquo;</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BANTUAN */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 py-1">
          Bantuan
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#242424]">
          {/* FAQ */}
          <div
            onClick={() => setActiveModal('faq')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">FAQ</div>
                <div className="text-xs text-neutral-400">Frequently Asked Questions</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>

          {/* Laporkan Masalah */}
          <div
            onClick={() => setActiveModal('report')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Laporkan Masalah</div>
                <div className="text-xs text-neutral-400">Bantuan teknis & kendala lapangan</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: LEGAL */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 py-1">
          Legal
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#242424]">
          {/* Ketentuan-Ketentuan Penggunaan */}
          <div
            onClick={() => setActiveModal('legal')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Ketentuan-Ketentuan Penggunaan</div>
                <div className="text-xs text-neutral-400">SOP Operasional Truk & Tagihan</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>

          {/* Kebijakan Privasi */}
          <div
            onClick={() => setActiveModal('privacy')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Kebijakan Privasi</div>
                <div className="text-xs text-neutral-400">Keamanan data transaksi & perbankan</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: TENTANG */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 py-1">
          Tentang
        </div>

        <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#242424]">
          {/* Pengembang */}
          <div
            onClick={() => setActiveModal('developer')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Pengembang</div>
                <div className="text-xs text-neutral-400">Tim IT PT Berkah Alam Semesta</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>

          {/* Catatan Rilis */}
          <div
            onClick={() => setActiveModal('release')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Catatan Rilis</div>
                <div className="text-xs text-neutral-400">Pembaruan sistem & fitur terbaru</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>

          {/* Versi Aplikasi */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Versi Aplikasi</div>
                <div className="text-xs font-mono text-amber-400 font-semibold">1.1.12.rc220</div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
              Build Terverifikasi
            </span>
          </div>

          {/* Atribusi Data */}
          <div
            onClick={() => setActiveModal('attribution')}
            className="flex items-center justify-between p-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-500">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Atribusi Data</div>
                <div className="text-xs text-neutral-400">Hak cipta sistem & izin operasional</div>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-mono">&rsaquo;</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS */}
      {/* ======================================================== */}

      {/* MODAL: FAQ */}
      {activeModal === 'faq' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F4511E]" />
                <span>Frequently Asked Questions (FAQ)</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs text-neutral-300">
              <div className="p-3 bg-[#222] rounded border border-[#333] space-y-1">
                <div className="font-bold text-white">Bagaimana rumus perhitungan kubikasi truk?</div>
                <div className="text-neutral-400 font-mono">
                  Kubikasi = (Panjang &times; Lebar &times; (Tinggi + Koreksi)) / 1.000.000 m³
                </div>
              </div>

              <div className="p-3 bg-[#222] rounded border border-[#333] space-y-1">
                <div className="font-bold text-white">Kapan Nomor PO digenerate?</div>
                <div className="text-neutral-400">
                  Peraturan PT BAS: Pre Order awal tidak memiliki nomor PO. Nomor PO resmi otomatis digenerate saat Surat Jalan (Good Issue) pertama dicetak!
                </div>
              </div>

              <div className="p-3 bg-[#222] rounded border border-[#333] space-y-1">
                <div className="font-bold text-white">Siapa yang berwenang menyetujui Pre Order?</div>
                <div className="text-neutral-400">
                  Hanya akun dengan role <strong>Super Admin (Direktur)</strong> yang memiliki akses untuk menyetujui atau menolak Pre Order.
                </div>
              </div>

              <div className="p-3 bg-[#222] rounded border border-[#333] space-y-1">
                <div className="font-bold text-white">Berapa tarif pajak PPN dan PPH?</div>
                <div className="text-neutral-400">
                  PPN adalah 11%. Sedangkan tarif PPH adalah 2.0% untuk material Curah (Limestone Curah, Sirtu Curah, Pasir) dan 2.65% untuk material Padat (Base Course, Batu Boulder, Limestone Padat).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LAPORKAN MASALAH */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#F4511E]" />
                <span>Laporkan Masalah Sistem</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendReport} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Kategori Masalah</label>
                <select
                  value={reportForm.kategori}
                  onChange={(e) => setReportForm({ ...reportForm, kategori: e.target.value })}
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F4511E]"
                >
                  <option value="Bug / Masalah Tampilan">Bug / Masalah Tampilan</option>
                  <option value="Perhitungan Kubikasi Tidak Sesuai">
                    Perhitungan Kubikasi Tidak Sesuai
                  </option>
                  <option value="Kendala Upload Foto Surat Jalan">
                    Kendala Upload Foto Surat Jalan
                  </option>
                  <option value="Masalah Sinkronisasi BKK / Kas Keluar">
                    Masalah Sinkronisasi BKK / Kas Keluar
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Detail Kendala</label>
                <textarea
                  required
                  rows={4}
                  value={reportForm.pesan}
                  onChange={(e) => setReportForm({ ...reportForm, pesan: e.target.value })}
                  placeholder="Jelaskan langkah kejadian dan nomor transaksi jika relevan..."
                  className="w-full bg-[#242424] border border-[#333] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#F4511E] hover:bg-[#e04515] text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Laporan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LEGAL & PRIVASI */}
      {(activeModal === 'legal' || activeModal === 'privacy') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F4511E]" />
                <span>
                  {activeModal === 'legal'
                    ? 'Ketentuan Penggunaan Sistem PT BAS'
                    : 'Kebijakan Privasi & Keamanan'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-neutral-300 leading-relaxed max-h-[60vh] overflow-y-auto">
              <p>
                Sistem PT BAS Control Center digunakan secara internal oleh seluruh staf, kadiv, admin lapangan Gresik, dan direksi PT Berkah Alam Semesta.
              </p>
              <p>
                1. Setiap pengemudi dan armada wajib diverifikasi dimensi baknya sebelum surat jalan dicetak.
              </p>
              <p>
                2. Pencatatan pengeluaran kas (BKK) harus disertai dengan verifikasi rekening bank vendor yang terdaftar resmi di master data supplier.
              </p>
              <p>
                3. Pembayaran invoice customer tunduk pada ketentuan perpajakan PPN 11% dan tarif pemotongan PPH 2.0% atau 2.65% sesuai jenis material tambang.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGEMBANG & TENTANG */}
      {(activeModal === 'developer' || activeModal === 'release' || activeModal === 'attribution') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#2D2D2D] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#2C2C2C]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#F4511E]" />
                <span>
                  {activeModal === 'developer'
                    ? 'Tim Pengembang Sistem'
                    : activeModal === 'release'
                    ? 'Catatan Rilis Aplikasi'
                    : 'Atribusi & Hak Cipta'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs text-neutral-300">
              <div className="p-3 bg-[#242424] rounded border border-[#333]">
                <div className="text-sm font-bold text-white">PT BAS Control Center</div>
                <div className="text-amber-400 font-mono">Versi 1.1.12.rc220</div>
                <div className="text-neutral-400 mt-1">
                  Arsitektur Web Dispatch & ERP Logistik Tambang Gresik Hub
                </div>
              </div>
              <p className="text-neutral-400 text-[11px] pt-2">
                &copy; {new Date().getFullYear()} PT Berkah Alam Semesta. Hak cipta dilindungi undang-undang.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
