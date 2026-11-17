import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useApp } from '../../context/AppContext';

export default function MainLayout() {
  const { isDark } = useApp();
  const location = useLocation();

  return (
    <div className={`h-screen h-dvh max-h-screen flex flex-col overflow-hidden transition-colors ${
      isDark ? 'bg-[#111315] text-neutral-100' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Top Banner Header */}
      <Header />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className={`flex-1 overflow-y-auto min-w-0 p-3 sm:p-5 flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#111315]' : 'bg-slate-100'
        }`}>
          <div className="w-full max-w-7xl mx-auto pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
