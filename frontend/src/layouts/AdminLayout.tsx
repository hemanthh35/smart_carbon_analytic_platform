import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store/store';
import { Shield } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Subtle Admin Mode Status Strip */}
      <div className="bg-accent-500 text-white px-4 py-1.5 rounded-xl flex items-center justify-between shadow-md shadow-accent-500/10 mb-6 text-xs font-semibold select-none">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>PulseCarbon Administrative Back-Office Console</span>
        </div>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
          Full Access
        </span>
      </div>
      <Outlet />
    </div>
  );
};
