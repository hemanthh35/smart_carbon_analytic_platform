import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { setSidebarOpen, markNotificationRead, deleteNotification } from '../../app/store/uiSlice';
import { Bell, Check, Menu, Plus, Trash2, User, X } from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, sidebarOpen } = useSelector((state: RootState) => state.ui);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadNotifications = notifications.filter((notification) => !notification.read);

  const pageName = location.pathname.split('/').filter(Boolean).slice(-1)[0] || 'dashboard';
  const title = pageName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <header className="sticky top-0 z-10 flex min-h-[72px] w-full items-center justify-between border-b border-dark-200 bg-dark-50/90 px-5 backdrop-blur-md md:px-7 dark:border-dark-800 dark:bg-dark-950/90">
      <div className="flex items-center gap-3">
        <button onClick={() => dispatch(setSidebarOpen(!sidebarOpen))} className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-dark-200 bg-white text-dark-500 hover:text-dark-900 lg:hidden dark:border-dark-800 dark:bg-dark-900 dark:hover:text-white" aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.12em] text-dark-400 dark:text-dark-500"><span>Workspace</span><span className="text-dark-300 dark:text-dark-700">/</span><span>{title}</span></div>
          <h1 className="mt-1 font-display text-[17px] font-semibold tracking-tight text-dark-900 dark:text-white">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button onClick={() => navigate('/predict')} className="hidden h-9 items-center gap-2 rounded-[9px] bg-dark-900 px-3.5 text-[11px] font-semibold text-white shadow-sm hover:bg-dark-800 md:flex dark:bg-primary-500 dark:text-dark-950 dark:hover:bg-primary-400"><Plus className="h-3.5 w-3.5" /> New prediction</button>
        <div className="relative">
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className={`relative flex h-9 w-9 items-center justify-center rounded-[9px] border border-transparent text-dark-500 hover:border-dark-200 hover:bg-white hover:text-dark-900 dark:text-dark-400 dark:hover:border-dark-800 dark:hover:bg-dark-900 dark:hover:text-white ${showNotifDropdown ? 'border-dark-200 bg-white dark:border-dark-800 dark:bg-dark-900' : ''}`} aria-label="Notifications">
            <Bell className="h-[17px] w-[17px]" />
            {unreadNotifications.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-500 ring-2 ring-dark-50 dark:ring-dark-950" />}
          </button>
          {showNotifDropdown && <div className="absolute right-0 mt-2 w-[320px] rounded-[12px] border border-dark-200 bg-white p-4 shadow-xl dark:border-dark-800 dark:bg-dark-900">
            <div className="flex items-center justify-between border-b border-dark-100 pb-3 dark:border-dark-800"><div><h3 className="text-[12px] font-bold text-dark-900 dark:text-white">Notifications</h3><span className="mt-1 block text-[10px] text-dark-400">{unreadNotifications.length} unread</span></div><button onClick={() => setShowNotifDropdown(false)} className="text-dark-400 hover:text-dark-900 dark:hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="custom-scrollbar mt-3 max-h-64 space-y-2 overflow-y-auto">{notifications.length === 0 ? <div className="py-5 text-center text-[11px] text-dark-400">No notifications yet.</div> : notifications.slice(0, 4).map((notification) => <div key={notification.id} className={`rounded-[9px] border p-2.5 text-[11px] ${notification.read ? 'border-transparent text-dark-500' : 'border-primary-100 bg-primary-50/60 text-dark-800 dark:border-primary-900/30 dark:bg-primary-950/20 dark:text-dark-200'}`}><div className="flex items-start justify-between gap-2"><span className="font-semibold">{notification.title}</span><span className="flex gap-1">{!notification.read && <button onClick={() => dispatch(markNotificationRead(notification.id))} title="Mark as read" className="text-dark-400 hover:text-primary-600"><Check className="h-3.5 w-3.5" /></button>}<button onClick={() => dispatch(deleteNotification(notification.id))} title="Delete notification" className="text-dark-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></span></div><p className="mt-1 leading-snug text-dark-500 dark:text-dark-400">{notification.message}</p></div>)}</div>
            <button onClick={() => { setShowNotifDropdown(false); navigate('/notifications'); }} className="mt-3 w-full border-0 border-t border-dark-100 pt-3 text-left text-[10px] font-semibold text-primary-600 hover:text-primary-700 dark:border-dark-800 dark:text-primary-400">View all notifications →</button>
          </div>}
        </div>
        <div className="mx-1 h-6 w-px bg-dark-200 dark:bg-dark-800" />
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 rounded-[9px] border border-transparent p-1 hover:border-dark-200 hover:bg-white dark:hover:border-dark-800 dark:hover:bg-dark-900"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold uppercase text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">{user?.name?.charAt(0) || <User className="h-4 w-4" />}</span><span className="hidden text-left sm:block"><span className="block max-w-[120px] truncate text-[11px] font-bold text-dark-800 dark:text-dark-100">{user?.name}</span><span className="mt-0.5 block text-[9px] capitalize text-dark-400">{user?.role}</span></span></button>
      </div>
    </header>
  );
};
