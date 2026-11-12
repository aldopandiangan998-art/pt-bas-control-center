import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS_DB, INITIAL_USER } from '../utils/constants';

const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'ptbas_users_db_v2';
const AUTH_STORAGE_KEY = 'ptbas_auth_user_v2';

export function AuthProvider({ children }) {
  // 1. Initialize registered users database from localStorage or default
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored users:', e);
    }
    return INITIAL_USERS_DB;
  });

  // 2. Initialize current logged-in user from localStorage or default
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user:', e);
    }
    return INITIAL_USER;
  });

  // Persist users list changes
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users to localStorage:', e);
    }
  }, [users]);

  // Persist auth user changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save auth user to localStorage:', e);
    }
  }, [currentUser]);

  // Normalization helper: normalize 'superadmin' / 'Super Admin' and 'admin' / 'Admin'
  const normalizedRole = currentUser?.role?.toLowerCase().replace(/\s+/g, '') || 'admin';
  const isSuperAdmin = normalizedRole === 'superadmin';
  const isAdmin = normalizedRole === 'admin';

  // Role permissions: Strictly Admin and Super Admin
  const permissions = {
    canApprovePreOrder: isSuperAdmin, // Superadmin only (Direktur approval)
    canApproveEdit: isSuperAdmin,     // Superadmin only
    canCreateBkk: true,               // Admin & Superadmin
    canRecordPayment: isSuperAdmin,   // Superadmin only (disbursement authorization)
    canManageUsers: isSuperAdmin,     // Superadmin only
    canManageMasterData: true,        // Both
    canExportReports: true,           // Both
  };

  /**
   * Login user with email & password
   */
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }

    return {
      success: false,
      message: 'Email atau kata sandi tidak valid. Pastikan data akun benar.',
    };
  };

  /**
   * Register new user (strictly admin or superadmin)
   */
  const register = ({ name, email, password, role = 'admin', branch = 'Hub Gresik', phone = '-' }) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: `Email ${email} sudah terdaftar dalam sistem PT BAS.`,
      };
    }

    // Role validation: only 'admin' or 'superadmin' allowed
    const validRole = role === 'superadmin' ? 'superadmin' : 'admin';
    const roleLabel = validRole === 'superadmin' ? 'Super Admin' : 'Admin';

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password,
      role: validRole,
      roleLabel,
      branch: branch || 'Hub Gresik',
      phone: phone || '-',
      aktif: true,
      registeredAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
  };

  /**
   * Logout user
   */
  const logout = () => {
    setCurrentUser(null);
  };

  /**
   * Helper to switch roles during preview/testing
   */
  const switchRole = (newRole) => {
    const validRole = newRole === 'superadmin' || newRole === 'Super Admin' ? 'superadmin' : 'admin';
    const roleLabel = validRole === 'superadmin' ? 'Super Admin' : 'Admin';
    setCurrentUser((prev) => (prev ? { ...prev, role: validRole, roleLabel } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: Boolean(currentUser),
        isSuperAdmin,
        isAdmin,
        roleLabel: isSuperAdmin ? 'Super Admin' : 'Admin',
        permissions,
        login,
        register,
        logout,
        switchRole,
      }}
    >
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
