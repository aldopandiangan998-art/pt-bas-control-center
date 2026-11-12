import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4 border-[#24282C]">
        <div className="w-12 h-12 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        
        <div>
          <Badge size="xs" variant="warning" className="mb-2">404 Error</Badge>
          <h2 className="text-lg font-bold text-white tracking-tight">Halaman Tidak Ditemukan</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Modul atau rute yang Anda tuju tidak terdaftar dalam direktori sistem kontrol Gresik Hub.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            className="w-full justify-center font-bold tracking-wider uppercase text-xs"
          >
            Kembali ke Dashboard Operasi
          </Button>
        </div>
      </Card>
    </div>
  );
}
