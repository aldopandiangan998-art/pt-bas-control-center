import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/layout/MainLayout';

// Module Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import PreOrderPage from './pages/PreOrder/PreOrderPage';
import SuratJalanPage from './pages/SuratJalan/SuratJalanPage';
import RekapanPage from './pages/Rekapan/RekapanPage';
import BkkPage from './pages/Bkk/BkkPage';
import InvoicePage from './pages/Invoice/InvoicePage';
import LaporanPage from './pages/Laporan/LaporanPage';
import MasterDataPage from './pages/MasterData/MasterDataPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="pre-orders" element={<PreOrderPage />} />
              <Route path="surat-jalan" element={<SuratJalanPage />} />
              <Route path="rekapan" element={<RekapanPage />} />
              <Route path="bkk" element={<BkkPage />} />
              <Route path="invoices" element={<InvoicePage />} />
              <Route path="laporan" element={<LaporanPage />} />
              <Route path="master-data" element={<MasterDataPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
