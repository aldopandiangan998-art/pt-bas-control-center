import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS_DB, INITIAL_USER } from '../utils/constants';

const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'ptbas_users_db_v2';
const AUTH_STORAGE_KEY = 'ptbas_auth_session_v1';

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

  // 2. Initialize current logged-in user from localStorage or null (guest)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Clear legacy dev auto-login key if present to enforce clean login first
      if (localStorage.getItem('ptbas_auth_user_v2')) {
        localStorage.removeItem('ptbas_auth_user_v2');
      }
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user:', e);
    }
    return null;
  });

  // Sync users from Node.js SQLite Database on mount
  useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API offline');
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      })
      .catch(() => {
        // Silent fallback to local storage
      });
  }, []);

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

  // Normalization helper: strictly 'superadmin' and 'admin'
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
   * Login user with Node.js SQLite API
   */
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        message: data.message || 'Email atau kata sandi tidak valid.',
      };
    } catch (err) {
      // Fallback to local DB if backend server is still starting
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
    }
  };

  /**
   * Register new user with Node.js SQLite API (strictly admin or superadmin)
   */
  const register = async ({ name, email, password, role = 'admin', branch = 'Hub Gresik', phone = '-' }) => {
    const cleanEmail = email.trim().toLowerCase();
    const validRole = role === 'superadmin' ? 'superadmin' : 'admin';
    const roleLabel = validRole === 'superadmin' ? 'Super Admin' : 'Admin';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          role: validRole,
          branch,
          phone,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) => [...prev, data.user]);
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        message: data.message || 'Pendaftaran gagal.',
      };
    } catch (err) {
      // Fallback
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return {
          success: false,
          message: `Email ${email} sudah terdaftar dalam sistem PT BAS.`,
        };
      }

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
    }
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
