import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B111E] text-neutral-100">
      {/* Top Banner Header */}
      <Header />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#0B111E] p-3 sm:p-5 flex flex-col justify-between">
          <div className="w-full max-w-7xl mx-auto pb-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
