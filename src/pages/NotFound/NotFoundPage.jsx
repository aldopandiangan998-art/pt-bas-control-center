import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-neutral-400 max-w-md">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan dalam navigasi PT BAS Control Center.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-5 py-2.5 rounded-xl bg-[#F4511E] hover:bg-[#E64A19] text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-colors"
      >
        <Home className="w-4 h-4" />
        Kembali ke Dashboard Utama
      </button>
    </div>
  );
}
