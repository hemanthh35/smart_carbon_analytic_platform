import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { setSidebarOpen, toggleTheme } from '../../app/store/uiSlice';
import { logout } from '../../app/store/authSlice';
import { authApi } from '../../services/api/authApi';
import {
  Leaf,
  LayoutDashboard,
  Cpu,
  Coins,
  FileText,
  BarChart3,
  Bell,
  User,
  Settings,
  ShieldAlert,
  Users,
  History,
  X,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';

export const MobileSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen, theme, notifications } = useSelector((state: RootState) => state.ui);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  if (!sidebarOpen) return null;

  const handleClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      dispatch(logout());
      dispatch(setSidebarOpen(false));
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Run Prediction', path: '/predict', icon: Cpu },
    { name: 'Carbon Credits', path: '/carbon-credits', icon: Coins },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: ShieldAlert },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Audit Logs', path: '/admin/logs', icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-950/40 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Slide-out Panel */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-800 focus:outline-none animate-slide-in-left duration-300">
        
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-dark-500 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-dark-200 dark:border-dark-800">
          <div className="p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
            <Leaf className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="font-display text-2.5xl tracking-wider text-dark-900 dark:text-dark-100 uppercase">
            PulseCarbon
          </span>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30'
                    : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-50 dark:hover:bg-dark-800/60'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <div className="pt-4 mt-4 border-t border-dark-100 dark:border-dark-800">
              <div className="px-4 mb-2 text-xs font-semibold text-dark-400 dark:text-dark-500 uppercase tracking-wider">
                Admin Controls
              </div>
              {adminItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/20'
                        : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-50 dark:hover:bg-dark-800/60'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* User Card + Log out in mobile footer */}
        <div className="p-4 border-t border-dark-200 dark:border-dark-800 space-y-3">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-dark-50 dark:bg-dark-800/40 border border-dark-100 dark:border-dark-800/60">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/60 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate leading-none mb-0.5">
                  {user.name}
                </div>
                <div className="text-xs text-dark-400 dark:text-dark-500 truncate">{user.email}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="flex-1 p-2.5 rounded-xl border border-dark-200 dark:border-dark-800 text-dark-500 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800 flex justify-center items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-xs font-semibold">Theme</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 p-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white flex justify-center items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
