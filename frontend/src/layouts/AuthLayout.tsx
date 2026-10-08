import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store/store';
import { Activity, ArrowUpRight, Leaf, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-dark-50 font-sans text-dark-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,.9fr)_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-dark-900 p-10 text-dark-50 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(177, 185, 225, .15) 1px, transparent 1px), linear-gradient(90deg, rgba(177, 185, 225, .15) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary-300 text-dark-900"><Leaf className="h-4 w-4" /></span>
            <span className="font-display text-lg font-bold tracking-tight">Pulse<span className="text-primary-300">Carbon</span></span>
          </div>

          <div className="relative max-w-lg py-12">
            <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-primary-300"><span className="h-1.5 w-1.5 rounded-full bg-primary-300" /> Industrial carbon intelligence</div>
            <h1 className="max-w-md font-display text-5xl font-semibold leading-[.98] tracking-[-.06em] text-white xl:text-6xl">Better decisions start with better evidence.</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-dark-300">Forecast facility emissions, understand the variance, and keep the calculation trail close to the work.</p>
            <div className="mt-12 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-white/10 bg-white/[.05] p-4"><Activity className="mb-7 h-4 w-4 text-primary-300" /><strong className="block font-display text-2xl tracking-tight text-white">95.2%</strong><span className="mt-1 block text-[10px] text-dark-400">model confidence</span></div>
              <div className="rounded-[12px] border border-white/10 bg-white/[.05] p-4"><ShieldCheck className="mb-7 h-4 w-4 text-primary-300" /><strong className="block font-display text-2xl tracking-tight text-white">Audit-ready</strong><span className="mt-1 block text-[10px] text-dark-400">by default</span></div>
            </div>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-dark-500"><span>© {new Date().getFullYear()} Pulse Carbon</span><span className="flex items-center gap-1.5">Climate operations suite <ArrowUpRight className="h-3 w-3" /></span></div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 flex items-center justify-center gap-2.5 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary-200 text-primary-700"><Leaf className="h-4 w-4" /></span>
              <span className="font-display text-lg font-bold tracking-tight">Pulse<span className="text-primary-600">Carbon</span></span>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
