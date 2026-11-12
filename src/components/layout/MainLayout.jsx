import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white">
      {/* Top Header with Wood Texture */}
      <Header />

      {/* Main Body: Sidebar + Dynamic Content Outlet */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#121212] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto pb-10">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

