import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { toggleTheme, toggleSidebar } from '../../app/store/uiSlice';
import { logout } from '../../app/store/authSlice';
import { authApi } from '../../services/api/authApi';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Moon,
  Settings,
  ShieldAlert,
  Sun,
  User,
  Users,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarOpen, theme, notifications } = useSelector((state: RootState) => state.ui);
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (error) { console.error('Logout error API call:', error); }
    finally { dispatch(logout()); navigate('/login'); }
  };

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Run prediction', path: '/predict', icon: Activity },
    { name: 'Carbon credits', path: '/carbon-credits', icon: Coins },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadNotificationsCount || undefined },
  ];
  const accountItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  const adminItems = [
    { name: 'Admin dashboard', path: '/admin/dashboard', icon: ShieldAlert },
    { name: 'Manage users', path: '/admin/users', icon: Users },
    { name: 'Audit logs', path: '/admin/logs', icon: History },
  ];

  const renderItem = (item: { name: string; path: string; icon: React.ElementType; badge?: number }, admin = false) => {
    const isActive = admin ? location.pathname.startsWith(item.path) : location.pathname === item.path;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={!sidebarOpen ? item.name : undefined}
        className={`group relative flex items-center gap-3 rounded-[9px] border px-3 py-2.5 text-[12px] font-medium transition-colors ${
          isActive
            ? admin ? 'border-[#59734c] bg-[#354832] text-[#d0e8b7]' : 'border-[#526847] bg-[#30422e] text-[#d0e8b7]'
            : 'border-transparent text-[#a4b1a1] hover:bg-[#263627] hover:text-[#eef6e9]'
        }`}
      >
        <item.icon className={`h-[17px] w-[17px] shrink-0 ${isActive ? 'text-[#aace82]' : 'text-[#7f927c] group-hover:text-[#b9d69a]'}`} />
        {sidebarOpen && <span className="truncate">{item.name}</span>}
        {sidebarOpen && item.badge !== undefined && <span className="ml-auto rounded-full bg-[#9ac872] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#182119]">{item.badge}</span>}
      </NavLink>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[#2e3d2e] bg-[#182119] text-[#eef6e9] transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[76px]'}`}>
      <div className="flex h-[72px] items-center justify-between border-b border-[#2e3d2e] px-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 overflow-hidden border-0 bg-transparent text-left text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#a6ca7c] text-[#182119]"><Leaf className="h-4 w-4" /></span>
          {sidebarOpen && <span className="truncate font-display text-[17px] font-bold tracking-tight">Pulse<span className="text-[#a6ca7c]">Carbon</span></span>}
        </button>
        <button onClick={() => dispatch(toggleSidebar())} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-[#81937d] hover:bg-[#263627] hover:text-white" aria-label="Toggle sidebar">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {sidebarOpen && <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#71836e]">Workspace</div>}
        <div className="space-y-1">{menuItems.map((item) => renderItem(item))}</div>
        <div className="mt-7 border-t border-[#2e3d2e] pt-5">
          {sidebarOpen && <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#71836e]">Account</div>}
          <div className="space-y-1">{accountItems.map((item) => renderItem(item))}</div>
        </div>
        {user?.role === 'admin' && <div className="mt-7 border-t border-[#2e3d2e] pt-5">
          {sidebarOpen && <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[.12em] text-[#71836e]">Administration</div>}
          <div className="space-y-1">{adminItems.map((item) => renderItem(item, true))}</div>
        </div>}
      </nav>

      <div className="space-y-2 border-t border-[#2e3d2e] p-3">
        {sidebarOpen && user && <button onClick={() => navigate('/profile')} className="flex w-full items-center gap-3 rounded-[9px] border border-[#354635] bg-[#243225] p-2.5 text-left hover:bg-[#2b3b2b]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c5dda9] font-display text-sm font-bold uppercase text-[#33472e]">{user.name.charAt(0)}</span>
          <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-[#eef6e9]">{user.name}</span><span className="mt-0.5 block truncate text-[10px] capitalize text-[#849584]">{user.role} account</span></span>
        </button>}
        <div className={`flex gap-1.5 ${sidebarOpen ? '' : 'flex-col'}`}>
          <button onClick={() => dispatch(toggleTheme())} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] border border-transparent bg-transparent text-[#97a693] hover:bg-[#263627] hover:text-white">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{sidebarOpen && <span className="text-[10px] font-medium">Theme</span>}
          </button>
          <button onClick={handleLogout} title="Log out" className="flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] border border-transparent bg-transparent text-[#97a693] hover:bg-[#4b302d] hover:text-[#ffd4cc]">
            <LogOut className="h-4 w-4" />{sidebarOpen && <span className="text-[10px] font-medium">Log out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
