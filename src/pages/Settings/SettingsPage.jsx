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
  Send,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button, Badge, Card, Modal, Input, Select } from '../../components/ui';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Settings states
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('Mode Mengikuti Sistem');
  const [deviceType] = useState('Web Desktop Console (Chrome)');

  // Modals for interactive exploration
  const [activeModal, setActiveModal] = useState(null);

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
    addToast('Laporan kendala berhasil dikirim ke Tim IT PT BAS Gresik!', 'success');
    setReportForm({ kategori: 'Bug / Masalah Tampilan', pesan: '' });
    setActiveModal(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header strictly matching Screenshot a384cad2 */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#24282C]">
        <Button
          size="sm"
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          title="Kembali"
        />
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Pengaturan Sistem</span>
            <Badge size="xs" variant="primary">v1.1.12</Badge>
          </h1>
          <p className="text-[11px] text-neutral-400">
            Preferensi perangkat, autentikasi biometrik, bantuan lapangan, dan ketentuan legal
          </p>
        </div>
      </div>

      {/* SECTION 1: UMUM */}
      <div className="space-y-1.5">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
          Umum
        </div>

        <div className="bg-[#131517] border border-[#24282C] rounded-lg overflow-hidden divide-y divide-[#202326]">
          {/* Jenis Perangkat */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Jenis Perangkat</div>
                <div className="text-[11px] text-neutral-400">{deviceType}</div>
              </div>
            </div>
            <Badge size="xs" variant="success" dot>Terverifikasi</Badge>
          </div>

          {/* Quick Login with Biometric Toggle */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Quick Login</div>
                <div className="text-[11px] text-neutral-400">Login menggunakan biometrik</div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={toggleQuickLogin}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                quickLoginEnabled ? 'bg-[#F4511E]' : 'bg-[#2A2E33]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
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
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Tema</div>
                <div className="text-[11px] text-neutral-400">{selectedTheme}</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Ubah &rsaquo;</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BANTUAN */}
      <div className="space-y-1.5">
        <div className="text-xs font-bold text-[#F4511E] uppercase tracking-wider px-2 font-mono">
          Bantuan
        </div>

        <div className="bg-[#131517] border border-[#24282C] rounded-lg overflow-hidden divide-y divide-[#202326]">
          {/* FAQ */}
          <div
            onClick={() => setActiveModal('faq')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">FAQ</div>
                <div className="text-[11px] text-neutral-400">Frequently Asked Questions</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Laporkan Masalah */}
          <div
            onClick={() => setActiveModal('report')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Laporkan Masalah</div>
                <div className="text-[11px] text-neutral-400">Bantuan teknis & kendala lapangan</div>
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

        <div className="bg-[#131517] border border-[#24282C] rounded-lg overflow-hidden divide-y divide-[#202326]">
          {/* Ketentuan-Ketentuan Penggunaan */}
          <div
            onClick={() => setActiveModal('legal')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Ketentuan-Ketentuan Penggunaan</div>
                <div className="text-[11px] text-neutral-400">SOP Operasional Truk & Tagihan</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Kebijakan Privasi */}
          <div
            onClick={() => setActiveModal('privacy')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Kebijakan Privasi</div>
                <div className="text-[11px] text-neutral-400">Keamanan data transaksi & perbankan</div>
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

        <div className="bg-[#131517] border border-[#24282C] rounded-lg overflow-hidden divide-y divide-[#202326]">
          {/* Pengembang */}
          <div
            onClick={() => setActiveModal('developer')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Pengembang</div>
                <div className="text-[11px] text-neutral-400">Tim IT PT Berkah Alam Semesta</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Catatan Rilis */}
          <div
            onClick={() => setActiveModal('release')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Catatan Rilis</div>
                <div className="text-[11px] text-neutral-400">Pembaruan sistem & fitur terbaru</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>

          {/* Versi Aplikasi */}
          <div className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Versi Aplikasi</div>
                <div className="text-xs font-mono text-amber-400 font-bold">1.1.12.rc220</div>
              </div>
            </div>
            <Badge size="xs" variant="success" dot>Build Resmi</Badge>
          </div>

          {/* Atribusi Data */}
          <div
            onClick={() => setActiveModal('attribution')}
            className="flex items-center justify-between p-3.5 hover:bg-[#181B1E] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="text-emerald-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Atribusi Data</div>
                <div className="text-[11px] text-neutral-400">Hak cipta sistem & izin operasional</div>
              </div>
            </div>
            <span className="text-xs text-neutral-400 font-mono">&rsaquo;</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS (MOTION POWERED) */}
      {/* ======================================================== */}

      {/* MODAL: FAQ */}
      <Modal
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal(null)}
        title="Frequently Asked Questions (FAQ)"
        subtitle="Panduan operasional harian dispatch material PT BAS Gresik"
      >
        <div className="p-4 space-y-3 text-xs text-neutral-300">
          <div className="p-3 bg-[#181B1E] rounded-md border border-[#262A2F] space-y-1">
            <div className="font-bold text-white">Bagaimana rumus perhitungan kubikasi truk?</div>
            <div className="text-neutral-400 font-mono">
              Kubikasi = (Panjang &times; Lebar &times; (Tinggi + Koreksi)) / 1.000.000 m³
            </div>
          </div>

          <div className="p-3 bg-[#181B1E] rounded-md border border-[#262A2F] space-y-1">
            <div className="font-bold text-white">Kapan Nomor PO digenerate?</div>
            <div className="text-neutral-400">
              Peraturan PT BAS: Pre Order awal tidak memiliki nomor PO. Nomor PO resmi otomatis digenerate saat Surat Jalan (Good Issue) pertama dicetak!
            </div>
          </div>

          <div className="p-3 bg-[#181B1E] rounded-md border border-[#262A2F] space-y-1">
            <div className="font-bold text-white">Siapa yang berwenang menyetujui Pre Order?</div>
            <div className="text-neutral-400">
              Hanya akun dengan role <strong>Super Admin (Direktur)</strong> yang memiliki akses untuk menyetujui atau menolak Pre Order.
            </div>
          </div>

          <div className="p-3 bg-[#181B1E] rounded-md border border-[#262A2F] space-y-1">
            <div className="font-bold text-white">Berapa tarif pajak PPN dan PPH?</div>
            <div className="text-neutral-400">
              PPN adalah 11%. Sedangkan tarif PPH adalah 2.0% untuk material Curah (Limestone Curah, Sirtu Curah, Pasir) dan 2.65% untuk material Padat (Base Course, Batu Boulder, Limestone Padat).
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
            <option value="Perhitungan Kubikasi Tidak Sesuai">
              Perhitungan Kubikasi Tidak Sesuai
            </option>
            <option value="Kendala Upload Foto Surat Jalan">
              Kendala Upload Foto Surat Jalan
            </option>
            <option value="Masalah Sinkronisasi BKK / Kas Keluar">
              Masalah Sinkronisasi BKK / Kas Keluar
            </option>
          </Select>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">Detail Kendala</label>
            <textarea
              required
              rows={4}
              value={reportForm.pesan}
              onChange={(e) => setReportForm({ ...reportForm, pesan: e.target.value })}
              placeholder="Jelaskan langkah kejadian dan nomor transaksi jika relevan..."
              className="w-full bg-[#181B1E] border border-[#2D3339] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F4511E]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#24282C]">
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
      </Modal>

      {/* MODAL: PENGEMBANG & TENTANG */}
      <Modal
        isOpen={activeModal === 'developer' || activeModal === 'release' || activeModal === 'attribution'}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'developer'
            ? 'Tim Pengembang Sistem'
            : activeModal === 'release'
            ? 'Catatan Rilis Aplikasi'
            : 'Atribusi & Hak Cipta'
        }
      >
        <div className="p-4 space-y-3 text-xs text-neutral-300">
          <div className="p-3 bg-[#181B1E] rounded-md border border-[#2D3339]">
            <div className="text-sm font-bold text-white">PT BAS Control Center</div>
            <div className="text-amber-400 font-mono">Versi 1.1.12.rc220</div>
            <div className="text-neutral-400 mt-1">
              Arsitektur Web Dispatch & ERP Logistik Tambang Gresik Hub
            </div>
          </div>
          <p className="text-neutral-400 text-[11px] pt-1 font-mono">
            &copy; {new Date().getFullYear()} PT Berkah Alam Semesta. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </Modal>
    </div>
  );
}
