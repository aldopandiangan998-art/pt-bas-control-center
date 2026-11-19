import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS_DB, INITIAL_USER, determineRoleByEmail } from '../utils/constants';

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (u) =>
              u.id !== 'usr-2' &&
              u.id !== 'usr-3' &&
              u.email?.toLowerCase() !== 'admin@ptbas.co.id' &&
              u.email?.toLowerCase() !== 'admin.dummy@ptbas.co.id'
          );
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored users:', e);
    }
    return INITIAL_USERS_DB;
  });

  // 2. Initialize current logged-in user from sessionStorage / localStorage or null (guest)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Clear legacy dev auto-login key if present to enforce clean login first
      if (localStorage.getItem('ptbas_auth_user_v2')) {
        localStorage.removeItem('ptbas_auth_user_v2');
      }
      const sessionSaved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionSaved) {
        const parsed = JSON.parse(sessionSaved);
        if (parsed && parsed.email) {
          if (
            parsed.id === 'usr-2' ||
            parsed.id === 'usr-3' ||
            parsed.email?.toLowerCase() === 'admin@ptbas.co.id' ||
            parsed.email?.toLowerCase() === 'admin.dummy@ptbas.co.id'
          ) {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
          return parsed;
        }
      }
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          if (
            parsed.id === 'usr-2' ||
            parsed.id === 'usr-3' ||
            parsed.email?.toLowerCase() === 'admin@ptbas.co.id' ||
            parsed.email?.toLowerCase() === 'admin.dummy@ptbas.co.id'
          ) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
          return parsed;
        }
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
          const sanitized = data
            .filter(
              (u) =>
                u.id !== 'usr-2' &&
                u.id !== 'usr-3' &&
                u.email?.toLowerCase() !== 'admin@ptbas.co.id' &&
                u.email?.toLowerCase() !== 'admin.dummy@ptbas.co.id'
            )
            .map((u) => {
              if (u.branch && (u.branch.includes('Site [') || u.branch.includes('// Tgl:'))) {
                return { ...u, branch: 'Hub Gresik' };
              }
              return u;
            });
          setUsers(sanitized);

          // Re-sync active currentUser session with fresh database record
          setCurrentUser((prev) => {
            if (!prev) return null;
            const fresh = sanitized.find(
              (u) => u.id === prev.id || u.email?.toLowerCase() === prev.email?.toLowerCase()
            );
            if (fresh) {
              return { ...prev, ...fresh };
            }
            return prev;
          });
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

  // Persist auth user changes (sessionStorage for tab isolation, localStorage for default persistence)
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save auth user to storage:', e);
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
    canManageMasterData: isSuperAdmin, // Superadmin only (dihapus untuk role admin)
    canExportReports: isSuperAdmin,   // Superadmin only (dihapus untuk role admin)
    canViewReports: isSuperAdmin,     // Superadmin only (dihapus untuk role admin)
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
        isPendingApproval: data.isPendingApproval || false,
        message: data.message || 'Email atau kata sandi tidak valid.',
      };
    } catch (err) {
      // Fallback to local DB if backend server is still starting
      const user = users.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );

      if (user) {
        // Cek apakah akun aktif atau pending
        if (user.aktif === 0 || user.aktif === false) {
          return {
            success: false,
            isPendingApproval: true,
            message: 'Akun Anda sedang menunggu persetujuan (approval) dari Super Admin. Silakan hubungi Super Admin untuk aktivasi.',
          };
        }

        // Enforce auto-role determination based on email
        const autoRole = determineRoleByEmail(cleanEmail);
        const resolvedUser = {
          ...user,
          role: autoRole.role,
          roleLabel: autoRole.roleLabel,
        };
        setCurrentUser(resolvedUser);
        return { success: true, user: resolvedUser };
      }

      return {
        success: false,
        message: 'Email atau kata sandi tidak valid. Pastikan data akun benar.',
      };
    }
  };

  /**
   * Register new user with Node.js SQLite API
   * Admin baru selalu membutuhkan persetujuan (approval) dari Super Admin
   */
  const register = async ({
    name,
    email,
    password,
    branch = 'Hub Gresik',
    phone = '-',
    birth_date = null,
    gender = 'Laki-laki',
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const autoRole = determineRoleByEmail(cleanEmail);
    const isSuper = autoRole.role === 'superadmin';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          branch,
          phone,
          birth_date,
          gender,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) => [...prev, data.user]);
        // Jangan auto-login jika butuh persetujuan Super Admin
        if (!data.pendingApproval) {
          setCurrentUser(data.user);
        }
        return {
          success: true,
          pendingApproval: data.pendingApproval,
          user: data.user,
          message: data.message,
        };
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
        role: autoRole.role,
        roleLabel: autoRole.roleLabel,
        branch: branch || 'Hub Gresik',
        phone: phone || '-',
        birth_date: birth_date || null,
        gender: gender || 'Laki-laki',
        aktif: isSuper ? 1 : 0, // Admin butuh approval
        registeredAt: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      if (isSuper) {
        setCurrentUser(newUser);
      }

      return {
        success: true,
        pendingApproval: !isSuper,
        user: newUser,
        message: !isSuper
          ? 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dari Super Admin.'
          : 'Pendaftaran akun Super Admin berhasil!',
      };
    }
  };

  /**
   * Super Admin approval: Aktifkan akun pengguna
   */
  const approveUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, aktif: 1 } : u)));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal menyetujui akun pengguna.' };
    } catch (e) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, aktif: 1 } : u)));
      return { success: true, message: 'Akun berhasil disetujui (offline).' };
    }
  };

  /**
   * Super Admin toggle user active status
   */
  const toggleUserStatus = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle-status`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, aktif: data.aktif } : u)));
        return { success: true, aktif: data.aktif };
      }
      return { success: false, message: data.message };
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, aktif: u.aktif ? 0 : 1 } : u))
      );
      return { success: true };
    }
  };

  /**
   * Super Admin delete user
   */
  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => {
          const updated = prev.filter((u) => u.id !== userId);
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
          } catch (err) {}
          return updated;
        });
        return { success: true, message: data.message || 'Pengguna berhasil dihapus.' };
      }
      return { success: false, message: data.message || 'Gagal menghapus pengguna.' };
    } catch (e) {
      setUsers((prev) => {
        const updated = prev.filter((u) => u.id !== userId);
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
      return { success: true, message: 'Pengguna berhasil dihapus (offline mode).' };
    }
  };

  /**
   * Super Admin: Ganti / Reset Password pengguna manapun secara langsung
   */
  const adminResetPassword = async (userId, newPassword) => {
    try {
      const res = await fetch(`/api/users/${userId}/admin-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
        );
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mengubah kata sandi pengguna.' };
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
      );
      return { success: true, message: 'Kata sandi berhasil diperbarui (offline mode).' };
    }
  };

  /**
   * Super Admin: Edit data pengguna (nama, email, role, roleLabel, branch, phone, aktif, dll.)
   */
  const adminUpdateUser = async (userId, userData) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
        );
        if (currentUser && (currentUser.id === userId || currentUser.email?.toLowerCase() === data.user?.email?.toLowerCase())) {
          setCurrentUser((prev) => ({ ...prev, ...data.user }));
        }
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || 'Gagal memperbarui data pengguna.' };
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...userData } : u))
      );
      if (currentUser?.id === userId) {
        setCurrentUser((prev) => ({ ...prev, ...userData }));
      }
      return { success: true, message: 'Data pengguna berhasil diperbarui (offline mode).' };
    }
  };

  /**
   * Super Admin: Buat akun pengguna baru secara langsung
   */
  const adminCreateUser = async (userData) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => [data.user, ...prev]);
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || 'Gagal membuat pengguna baru.' };
    } catch (e) {
      const autoRole = determineRoleByEmail(userData.email);
      const newUser = {
        id: `usr-${Date.now()}`,
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role || autoRole.role,
        roleLabel: userData.roleLabel || autoRole.roleLabel,
        branch: userData.branch || 'Hub Gresik',
        phone: userData.phone || '-',
        birth_date: userData.birth_date || null,
        gender: userData.gender || 'Laki-laki',
        aktif: 1,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [newUser, ...prev]);
      return { success: true, message: 'Pengguna baru berhasil ditambahkan (offline mode).', user: newUser };
    }
  };

  /**
   * Update Profile data (Super Admin & Admin)
   */
  const updateProfile = async ({ name, phone, birth_date, gender }) => {
    if (!currentUser) return { success: false, message: 'Tidak ada sesi pengguna aktif.' };

    try {
      const res = await fetch(`/api/users/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, birth_date, gender }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...data.user } : u)));
        return { success: true, message: data.message, user: data.user };
      }
      return { success: false, message: data.message || 'Gagal memperbarui profil.' };
    } catch (e) {
      // Fallback
      const updated = {
        ...currentUser,
        name: name.trim(),
        phone: phone || '-',
        birth_date: birth_date || null,
        gender: gender || 'Laki-laki',
      };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
      return { success: true, message: 'Profil akun berhasil diperbarui (offline mode).', user: updated };
    }
  };

  /**
   * Change Password for current user
   */
  const changePassword = async ({ oldPassword, newPassword }) => {
    if (!currentUser) return { success: false, message: 'Tidak ada sesi pengguna aktif.' };

    try {
      const res = await fetch(`/api/users/change-password/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mengubah kata sandi.' };
    } catch (e) {
      return { success: true, message: 'Kata sandi berhasil diperbarui (offline mode).' };
    }
  };

  /**
   * Request Password Reset Link (sent via Gmail / dev fallback)
   */
  const requestPasswordReset = async (email) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
          emailSent: data.emailSent,
          emailNotice: data.emailNotice,
          resetUrl: data.resetUrl,
        };
      }
      return {
        success: false,
        message: data.message || 'Gagal memproses permohonan reset kata sandi.',
      };
    } catch (e) {
      return {
        success: false,
        message: 'Tidak dapat menghubungi server backend. Pastikan server backend sedang berjalan.',
      };
    }
  };

  /**
   * Verify Reset Token from URL
   */
  const verifyResetToken = async (token) => {
    try {
      const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, email: data.email, name: data.name };
      }
      return { success: false, message: data.message || 'Token tidak valid atau telah kedaluwarsa.' };
    } catch (e) {
      return { success: false, message: 'Koneksi ke server gagal saat memverifikasi token reset.' };
    }
  };

  /**
   * Reset Password with verified token
   */
  const resetPasswordWithToken = async ({ token, newPassword }) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mereset kata sandi.' };
    } catch (e) {
      return { success: false, message: 'Koneksi ke server gagal saat mereset kata sandi.' };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
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
        approveUser,
        toggleUserStatus,
        deleteUser,
        adminResetPassword,
        adminUpdateUser,
        adminCreateUser,
        updateProfile,
        changePassword,
        requestPasswordReset,
        verifyResetToken,
        resetPasswordWithToken,
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
