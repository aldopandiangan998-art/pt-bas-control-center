import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Module Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import PreOrderPage from './pages/PreOrder/PreOrderPage';
import SuratJalanPage from './pages/SuratJalan/SuratJalanPage';
import RekapanPage from './pages/Rekapan/RekapanPage';
import BkkPage from './pages/Bkk/BkkPage';
import InvoicePage from './pages/Invoice/InvoicePage';
import LaporanPage from './pages/Laporan/LaporanPage';
import MasterDataPage from './pages/MasterData/MasterDataPage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

/**
 * Route protector for authenticated sessions
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Route restriction for guest-only pages (login/register)
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <Routes>
                {/* Guest Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Protected Workspace Console */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="pre-orders" element={<PreOrderPage />} />
                  <Route path="surat-jalan" element={<SuratJalanPage />} />
                  <Route path="rekapan" element={<RekapanPage />} />
                  <Route path="bkk" element={<BkkPage />} />
                  <Route path="invoices" element={<InvoicePage />} />
                  <Route path="laporan" element={<LaporanPage />} />
                  <Route path="master-data" element={<MasterDataPage />} />
                  <Route path="pengaturan" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
