import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} from '../../app/store/uiSlice';

export const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const getIcon = (type: string) => {
    const classes = 'w-5 h-5 shrink-0';
    switch (type) {
      case 'success':
        return <CheckCircle className={`${classes} text-emerald-500`} />;
      case 'warning':
        return <AlertTriangle className={`${classes} text-amber-500`} />;
      case 'error':
        return <XCircle className={`${classes} text-red-500`} />;
      default:
        return <Info className={`${classes} text-blue-500`} />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left animate-fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
            System Alerts
          </h1>
          <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
            Track status updates, model loadings, and compliance report configurations.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 select-none self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(markAllNotificationsRead())}
              className="flex items-center gap-1.5 text-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearNotifications())}
              className="flex items-center gap-1.5 text-xs text-danger hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex gap-2 border-b border-dark-200 dark:border-dark-800 pb-1 select-none">
        {(['all', 'unread', 'read'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-all focus:outline-none ${
              filter === t
                ? 'border-primary-500 text-dark-900 dark:text-white'
                : 'border-transparent text-dark-400 dark:text-dark-500 hover:text-dark-800'
            }`}
          >
            {t} Alerts ({notifications.filter((n) => (t === 'unread' ? !n.read : t === 'read' ? n.read : true)).length})
          </button>
        ))}
      </div>

      {/* Alerts Box */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            title="No alerts found"
            description={
              filter === 'unread'
                ? "You've read all compliance updates! Excellent work."
                : 'Your notification center is completely clear.'
            }
            icon={<Bell className="w-10 h-10 text-dark-400" />}
          />
        ) : (
          filteredNotifs.map((n) => (
            <Card
              key={n.id}
              className={`transition-all border-l-4 ${
                n.read
                  ? 'border-l-dark-300 dark:border-l-dark-750 opacity-75'
                  : n.type === 'success'
                  ? 'border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/5'
                  : n.type === 'warning'
                  ? 'border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/5'
                  : n.type === 'error'
                  ? 'border-l-red-500 bg-red-50/15 dark:bg-red-950/5'
                  : 'border-l-blue-500 bg-blue-50/15 dark:bg-blue-950/5'
              }`}
            >
              <CardContent className="p-4 flex gap-4 items-start justify-between">
                <div className="flex gap-3 items-start overflow-hidden">
                  {getIcon(n.type)}
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-dark-800 dark:text-dark-300' : 'text-dark-900 dark:text-white'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 leading-normal">
                      {n.message}
                    </p>
                    <span className="block text-[10px] text-dark-400">
                      {formatDate(n.timestamp, true)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0 select-none">
                  {!n.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispatch(markNotificationRead(n.id))}
                      className="h-8 w-8 p-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-dark-500" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(deleteNotification(n.id))}
                    className="h-8 w-8 p-0 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
