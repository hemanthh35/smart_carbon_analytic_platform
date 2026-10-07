import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store/store';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNavbar } from '../components/layout/TopNavbar';
import { MobileSidebar } from '../components/layout/MobileSidebar';
import { setSidebarOpen } from '../app/store/uiSlice';

export const DashboardLayout: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  // Close sidebar by default on mobile/tablet screens on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setSidebarOpen(false));
      } else {
        dispatch(setSidebarOpen(true));
      }
    };

    handleResize(); // trigger on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell min-h-screen bg-dark-50 dark:bg-dark-950 text-dark-950 transition-colors duration-200">
      
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile/Tablet Overlay Drawer */}
      <MobileSidebar />

      {/* Main content wrapper */}
      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <TopNavbar />
        
        {/* Subpage content rendering */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-5 md:p-7 xl:p-9 animate-fade-in duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
