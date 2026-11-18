import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Inbox,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert' | 'system';
  title: string;
  message: string; // DB column is 'message'
  created_at: string; // DB timestamp
  is_read: boolean;
}

const TYPE_STYLES: Record<Notification['type'], { icon: LucideIcon; color: string }> = {
  alert: { icon: Bell, color: 'text-orange-500' },
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  system: { icon: Settings, color: 'text-slate-500' },
};

// Wavy vertical connector drawn between icon badges
const WAVE_CONNECTOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='12' viewBox='0 0 6 12'%3E%3Cpath d='M3 0 Q0 3 3 6 T3 12' fill='none' stroke='%23CBD5E1' stroke-width='1'/%3E%3C/svg%3E")`;

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (Number.isNaN(diffMs)) return '';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;

  return new Date(dateString).toLocaleDateString();
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://coed.onrender.com/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const subtitle = loading
    ? 'Loading notifications...'
    : unreadCount === 0
      ? 'You’re all caught up.'
      : `You have ${unreadCount} new ${unreadCount === 1 ? 'notification' : 'notifications'}.`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="relative flex items-start justify-between px-6 pt-5 pb-6">
        <div>
          <h3 className="text-base font-medium text-slate-900">Notifications</h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <Inbox className="w-6 h-6 text-slate-500 shrink-0" strokeWidth={1.5} aria-hidden="true" />

        {/* Wavy divider */}
        <svg
          className="absolute bottom-0 left-0 w-full h-2"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="notif-wave" width="16" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 5 Q4 1 8 5 T16 5" fill="none" stroke="#E2E8F0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="8" fill="url(#notif-wave)" />
        </svg>
      </div>

      {/* Body */}
      <div className="px-6 pt-6 pb-6">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Loading notifications...</p>
        ) : error ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Couldn’t load notifications. Refresh the page to try again.
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No notifications yet. New activity will show up here.
          </p>
        ) : (
          <ul>
            {notifications.map((notification, index) => {
              const { icon: Icon, color } =
                TYPE_STYLES[notification.type] ?? TYPE_STYLES.system;
              const isLast = index === notifications.length - 1;

              return (
                <li
                  key={notification.id}
                  className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-6'}`}
                >
                  {/* Icon badge + connector */}
                  <div className="relative shrink-0">
                    <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-11 -translate-x-1/2 w-[6px]"
                        style={{
                          bottom: '-1.5rem',
                          backgroundImage: WAVE_CONNECTOR,
                          backgroundRepeat: 'repeat-y',
                          backgroundPosition: 'center top',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${notification.is_read ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-[15px] font-medium text-slate-900 leading-snug">
                        {notification.title}
                      </h4>
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {timeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                      {notification.message}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}