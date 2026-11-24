import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// Module Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import PreOrderPage from './pages/PreOrder/PreOrderPage';
import ApprovalRoPage from './pages/Approval/ApprovalRoPage';
import ApprovalBkkPage from './pages/Approval/ApprovalBkkPage';
import ApprovalInvoicePage from './pages/Approval/ApprovalInvoicePage';
import ApprovalUserPage from './pages/Approval/ApprovalUserPage';
import SuratJalanPage from './pages/SuratJalan/SuratJalanPage';
import RekapanPage from './pages/Rekapan/RekapanPage';
import BkkPage from './pages/Bkk/BkkPage';
import InvoicePage from './pages/Invoice/InvoicePage';
import LaporanPpnPage from './pages/Laporan/LaporanPpnPage';
import LaporanPph21Page from './pages/Laporan/LaporanPph21Page';
import LaporanPph23Page from './pages/Laporan/LaporanPph23Page';
import LaporanAllInOnePage from './pages/Laporan/LaporanAllInOnePage';
import LaporanSupplierPage from './pages/Laporan/LaporanSupplierPage';
import BuatLaporanPajakPage from './pages/Laporan/BuatLaporanPajakPage';
import BuatLaporanAllInOnePage from './pages/Laporan/BuatLaporanAllInOnePage';
import MasterDataPage from './pages/MasterData/MasterDataPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
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

/**
 * Route protector strictly for Super Admin (Restricted for Admin)
 */
function SuperAdminOnlyRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperAdmin) {
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
                <Route
                  path="/reset-password"
                  element={
                    <PublicOnlyRoute>
                      <ResetPasswordPage />
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
                  <Route
                    path="approval-ro"
                    element={
                      <SuperAdminOnlyRoute>
                        <ApprovalRoPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="approval-bkk"
                    element={
                      <SuperAdminOnlyRoute>
                        <ApprovalBkkPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="approval-invoice"
                    element={
                      <SuperAdminOnlyRoute>
                        <ApprovalInvoicePage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="approval-admin"
                    element={
                      <SuperAdminOnlyRoute>
                        <ApprovalUserPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route path="surat-jalan" element={<SuratJalanPage />} />
                  <Route path="rekapan" element={<RekapanPage />} />
                  <Route path="bkk" element={<BkkPage />} />
                  <Route path="invoices" element={<InvoicePage />} />
                  {/* Laporan Routes strictly for Super Admin */}
                  <Route
                    path="laporan"
                    element={
                      <SuperAdminOnlyRoute>
                        <Navigate to="/laporan/ppn" replace />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/ppn"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanPpnPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/pph-21"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanPph21Page />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/pph-23"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanPph23Page />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/all-in-one"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanAllInOnePage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/supplier"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanSupplierPage />
                      </SuperAdminOnlyRoute>
                    }
                  />

                  {/* Legacy & Shortcut Laporan Routes */}
                  <Route
                    path="laporan-pajak/:type"
                    element={
                      <SuperAdminOnlyRoute>
                        <BuatLaporanPajakPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="buat-laporan-pajak/:type"
                    element={
                      <SuperAdminOnlyRoute>
                        <BuatLaporanPajakPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan/buat/:type"
                    element={
                      <SuperAdminOnlyRoute>
                        <BuatLaporanPajakPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="laporan-all-in-one"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanAllInOnePage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="buat-laporan-all-in-one"
                    element={
                      <SuperAdminOnlyRoute>
                        <LaporanAllInOnePage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="master-data"
                    element={
                      <SuperAdminOnlyRoute>
                        <MasterDataPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route
                    path="pengaturan"
                    element={
                      <SuperAdminOnlyRoute>
                        <SettingsPage />
                      </SuperAdminOnlyRoute>
                    }
                  />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="profil" element={<ProfilePage />} />
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
