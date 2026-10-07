import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: '🌿 System Live',
    message: 'PulseCarbon prediction model best_bilstm.keras loaded successfully.',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    title: '📊 Credits Computed',
    message: 'Baseline emission of 200,000 t CO₂ verified against facility statistics.',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  }
];

const initialState: UIState = {
  sidebarOpen: true,
  theme: getInitialTheme(),
  notifications: defaultNotifications,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'read' | 'timestamp'>>) => {
      const newNotif: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        read: false,
        timestamp: new Date().toISOString(),
      };
      state.notifications.unshift(newNotif);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) {
        notif.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
