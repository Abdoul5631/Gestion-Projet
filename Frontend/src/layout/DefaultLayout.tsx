import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';


const DefaultLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keep sidebar visibility in sync with screen size:
  // - open by default on large screens (>= lg / 1024px)
  // - hidden by default on small screens
  useEffect(() => {
    const sync = () => {
      const isLarge = window.innerWidth >= 1024; // Tailwind lg breakpoint
      setSidebarOpen(isLarge);
    };

    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* ===== Page Wrapper Start ===== */}
      <div className="flex h-screen overflow-hidden">
        {/* ===== Sidebar Start ===== */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* ===== Sidebar End ===== */}

        {/* ===== Content Area Start ===== */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* ===== Header Start ===== */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* ===== Header End ===== */}

          {/* ===== Main Content Start ===== */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <Outlet />
            </div>
          </main>
          {/* ===== Main Content End ===== */}
        </div>
        {/* ===== Content Area End ===== */}
      </div>
      {/* ===== Page Wrapper End ===== */}
    </div>
  );
};

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Outlet />
    </div>
  );
};

export { DefaultLayout, AuthLayout };
export default DefaultLayout;