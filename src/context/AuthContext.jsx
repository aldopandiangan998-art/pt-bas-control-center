import { createContext, useContext, useState } from 'react';
import { INITIAL_USER } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  // Role permissions per implementation plan section 1a
  const isSuperAdmin = currentUser.role === 'Super Admin'; // Direktur
  const isStaffPusat = currentUser.role === 'Staff Pusat';
  const isKadivPusat = currentUser.role === 'Kadiv Pusat';
  const isAdminGresik = currentUser.role === 'Admin Gresik';

  const permissions = {
    canApprovePreOrder: isSuperAdmin, // Only Superadmin can approve PO
    canApproveEdit: isStaffPusat || isKadivPusat || isSuperAdmin,
    canCreateBkk: isAdminGresik || isSuperAdmin || isStaffPusat,
    canRecordPayment: true,
  };

  // Helper to switch roles during preview/testing
  const switchRole = (newRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
    }));
  };

  return (
    <AuthContext.Provider value={{ currentUser, permissions, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
