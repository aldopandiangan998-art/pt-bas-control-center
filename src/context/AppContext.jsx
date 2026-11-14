import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Theme state: 'dark' (default) | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('ptbas_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      // fallback
    }
    return 'dark'; // default industrial PT BAS
  });

  useEffect(() => {
    try {
      localStorage.setItem('ptbas_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch (e) {
      console.warn('Failed to set theme:', e);
    }
  }, [theme]);

  const toggleMobileSidebar = () => setSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setSidebarOpen(false);
  const toggleCollapseSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        sidebarCollapsed,
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        toggleMobileSidebar,
        closeMobileSidebar,
        toggleCollapseSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

