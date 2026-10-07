import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store/store';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Info,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  clearNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../app/store/uiSlice';

type NotificationFilter = 'all' | 'unread' | 'read';

const typeMeta = {
  success: { label: 'System', icon: CheckCircle, tone: 'success' },
  warning: { label: 'Attention', icon: AlertTriangle, tone: 'warning' },
  error: { label: 'Critical', icon: XCircle, tone: 'error' },
  info: { label: 'Update', icon: Info, tone: 'info' },
} as const;

export const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const readCount = notifications.length - unreadCount;
  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => filter === 'all' || (filter === 'unread' ? !notification.read : notification.read)),
    [filter, notifications]
  );

  return (
    <div className="notifications-page animate-fade-in duration-200">
      <div className="notifications-page__header">
        <div>
          <div className="notifications-page__eyebrow"><span className="notifications-page__eyebrow-dot" /> System inbox</div>
          <h2>Notifications</h2>
          <p>Keep track of model activity, compliance updates, and workspace events.</p>
        </div>
        {notifications.length > 0 && (
          <div className="notifications-page__actions">
            <Button variant="outline" size="sm" onClick={() => dispatch(markAllNotificationsRead())} className="gap-2">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={() => dispatch(clearNotifications())} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20">
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="notifications-page__layout">
        <aside className="notifications-page__rail">
          <div className="notifications-summary notifications-summary--unread">
            <div className="notifications-summary__top"><span>Needs attention</span><span className="notifications-summary__icon"><Bell className="h-4 w-4" /></span></div>
            <strong>{unreadCount.toString().padStart(2, '0')}</strong>
            <p>Unread updates waiting for review</p>
          </div>
          <div className="notifications-summary">
            <div className="notifications-summary__top"><span>Total activity</span><span className="notifications-summary__icon"><ShieldCheck className="h-4 w-4" /></span></div>
            <strong>{notifications.length.toString().padStart(2, '0')}</strong>
            <p>{readCount} already reviewed in this workspace</p>
          </div>
          <div className="notifications-page__note"><span className="notifications-page__note-mark">i</span><div><strong>Stay in the loop</strong><p>Important system and compliance events appear here automatically.</p></div></div>
        </aside>

        <section className="notifications-page__stream" aria-label="Notification list">
          <div className="notifications-tabs" role="tablist" aria-label="Notification filters">
            {([
              ['all', 'All activity', notifications.length],
              ['unread', 'Unread', unreadCount],
              ['read', 'Reviewed', readCount],
            ] as const).map(([value, label, count]) => (
              <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={filter === value ? 'is-active' : ''}>
                {label}<span>{count}</span>
              </button>
            ))}
          </div>

          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="notifications-page__empty"><EmptyState title="Nothing here yet" description={filter === 'unread' ? 'You are fully caught up on workspace updates.' : 'Your notification stream is clear.'} icon={<Bell className="h-8 w-8 text-dark-400" />} /></div>
            ) : (
              filteredNotifications.map((notification) => {
                const meta = typeMeta[notification.type];
                const Icon = meta.icon;
                return (
                  <article key={notification.id} className={`notification-item notification-item--${meta.tone} ${notification.read ? 'is-read' : 'is-unread'}`}>
                    <div className="notification-item__status"><Icon className="h-[17px] w-[17px]" /></div>
                    <div className="notification-item__body">
                      <div className="notification-item__meta"><span className="notification-item__label">{meta.label}</span><span className="notification-item__time">{formatDate(notification.timestamp, true)}</span>{!notification.read && <span className="notification-item__new">New</span>}</div>
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                    </div>
                    <div className="notification-item__actions">
                      {!notification.read && <button onClick={() => dispatch(markNotificationRead(notification.id))} title="Mark as read" aria-label={`Mark ${notification.title} as read`}><Check className="h-4 w-4" /></button>}
                      <button onClick={() => dispatch(deleteNotification(notification.id))} title="Delete notification" aria-label={`Delete ${notification.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsPage;
