import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleMobileSidebar = () => setSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setSidebarOpen(false);
  const toggleCollapseSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        sidebarCollapsed,
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
