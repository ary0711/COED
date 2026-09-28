// ─── DashboardHeader.tsx ───────────────────────────────────────────────────────
import {
  Activity,
  Bell,
  Check,
  Filter,
  Megaphone,
  Menu,
  MessageCircleQuestion,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Notification } from '../notification';

// Full date/time shown when a notification is expanded
function formatManilaTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Short relative time shown on each row ("2 mins ago", "Yesterday")
function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (Number.isNaN(diffMs)) return '';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;

  return new Date(dateString).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
  });
}

// =====================================================
// NOTIFICATION KINDS (icon instead of avatar)
// =====================================================
type Kind = 'inquiry' | 'announcement' | 'activity' | 'general';

const KIND_STYLES: Record<
  Kind,
  { label: string; icon: LucideIcon; badge: string }
> = {
  inquiry: {
    label: 'Inquiry',
    icon: MessageCircleQuestion,
    badge: 'bg-blue-50 text-blue-600',
  },
  announcement: {
    label: 'Announcement',
    icon: Megaphone,
    badge: 'bg-amber-50 text-amber-600',
  },
  activity: {
    label: 'Activity',
    icon: Activity,
    badge: 'bg-emerald-50 text-emerald-600',
  },
  general: {
    label: 'General',
    icon: Bell,
    badge: 'bg-slate-100 text-slate-500',
  },
};

// Decides the kind from the notification's category / type / title.
// Adjust the keywords below to match the exact values in your database.
function getKind(notification: Notification): Kind {
  const n = notification as Notification & {
    category?: string;
    type?: string;
  };

  const text = `${n.category ?? ''} ${n.type ?? ''} ${n.title ?? ''}`.toLowerCase();

  if (text.includes('inquir')) return 'inquiry';
  if (text.includes('announce')) return 'announcement';
  if (
    text.includes('activit') ||
    text.includes('task') ||
    text.includes('update') ||
    text.includes('success')
  ) {
    return 'activity';
  }

  return 'general';
}

type Tab = 'all' | 'unread';

interface DashboardHeaderProps {
  userRole: string;
  userName: string;
  onMenuClick?: () => void;
  departmentNames?: string[];
  onLogout?: () => void;
}

const NOTIFICATIONS_API_URL =
  'http://localhost:5000/api/notifications';

const PROFILE_API_URL =
  'http://localhost:5000/api/auth/me';

export function DashboardHeader({
  userRole,
  userName,
  onMenuClick,
  departmentNames,
}: DashboardHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);

  // =====================================================
  // CURRENT USER DISPLAY STATE
  // =====================================================
  const [displayName, setDisplayName] = useState(
    userName ||
      localStorage.getItem('userFullName') ||
      'User'
  );

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  const visibleNotifications = notifications.filter((n) => {
    if (activeTab === 'unread' && n.is_read) return false;
    if (kindFilter !== 'all' && getKind(n) !== kindFilter) return false;
    return true;
  });

  const getToken = () => localStorage.getItem('token');

  // =====================================================
  // KEEP HEADER NAME SYNCHRONIZED WITH PARENT
  // =====================================================
  useEffect(() => {
    if (userName?.trim()) {
      setDisplayName(userName.trim());
    }
  }, [userName]);

  // =====================================================
  // LOAD CURRENT USER FROM DATABASE
  // =====================================================
  useEffect(() => {
    let mounted = true;

    const loadCurrentProfile = async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(PROFILE_API_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error(
            'Failed to load current profile:',
            response.status
          );
          return;
        }

        const data = await response.json();

        if (!mounted) return;

        if (data?.profile) {
          const databaseName =
            data.profile.full_name?.trim();

          const databaseEmail =
            data.profile.email?.trim();

          if (databaseName) {
            setDisplayName(databaseName);
            localStorage.setItem(
              'userFullName',
              databaseName
            );
          }

          if (databaseEmail) {
            localStorage.setItem(
              'userEmail',
              databaseEmail
            );
          }
        }
      } catch (error) {
        console.error(
          'Error loading current profile:',
          error
        );
      }
    };

    loadCurrentProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================
  async function loadNotifications() {
    const token = getToken();

    if (!token) return;

    try {
      const res = await fetch(NOTIFICATIONS_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();

      setNotifications(data ?? []);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // MARK NOTIFICATION AS READ
  // =====================================================
  async function markAsRead(id: string) {
    const token = getToken();

    if (!token) return;

    try {
      const res = await fetch(
        `${NOTIFICATIONS_API_URL}/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch {
      // silent
    }
  }

  // =====================================================
  // MARK ALL AS READ (uses the same per-item endpoint)
  // =====================================================
  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.is_read);

    await Promise.all(unread.map((n) => markAsRead(n.id)));
  }

  // =====================================================
  // GENERATE INITIALS
  // =====================================================
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const emptyMessage =
    kindFilter !== 'all'
      ? 'No notifications match this filter.'
      : activeTab === 'unread'
        ? 'You’re all caught up.'
        : 'No notifications yet. New activity will show up here.';

  return (
    <div className="sticky top-0 z-40 bg-white w-full border-b border-gray-200/60 shadow-sm">
      <div className="px-6 sm:px-8 flex items-center justify-between gap-4 w-full h-[73px]">

        {/* =====================================================
            LEFT: MOBILE MENU
        ===================================================== */}
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0 border border-gray-200/80 transition-all"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* =====================================================
            RIGHT: NOTIFICATIONS + PROFILE
        ===================================================== */}
        <div className="flex items-center gap-4 shrink-0">

          {/* =====================================================
              NOTIFICATION BELL
          ===================================================== */}
          <div className="relative">
            <button
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              className="relative p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/80 transition-all flex items-center justify-center shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />

              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-orange-500 text-white text-[8px] rounded-full font-bold shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[420px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">

                {/* Title + mark all as read */}
                <div className="flex items-center justify-between px-5 pt-5">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Notifications
                  </h3>

                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>

                {/* Tabs + filter */}
                <div className="relative mt-4 flex items-center justify-between border-b border-slate-200 px-5">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                        activeTab === 'all'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      All Notifications
                    </button>

                    <button
                      onClick={() => setActiveTab('unread')}
                      className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                        activeTab === 'unread'
                          ? 'border-slate-900 text-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Unread{' '}
                      <span className="text-slate-400 font-normal">
                        ({unreadCount})
                      </span>
                    </button>
                  </div>

                  <div className="relative pb-3">
                    <button
                      onClick={() => setShowFilter(!showFilter)}
                      className={`p-1 rounded-md transition-colors ${
                        kindFilter !== 'all'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      aria-label="Filter by type"
                    >
                      <Filter className="w-4 h-4" />
                    </button>

                    {showFilter && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-10">
                        {(
                          [
                            'all',
                            'inquiry',
                            'announcement',
                            'activity',
                          ] as const
                        ).map((option) => {
                          const OptionIcon =
                            option === 'all'
                              ? Bell
                              : KIND_STYLES[option].icon;

                          return (
                            <button
                              key={option}
                              onClick={() => {
                                setKindFilter(option);
                                setShowFilter(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <OptionIcon className="w-4 h-4 text-slate-500" />
                              <span className="flex-1">
                                {option === 'all'
                                  ? 'All types'
                                  : KIND_STYLES[option].label}
                              </span>
                              {kindFilter === option && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[420px] min-h-[200px] overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                      {emptyMessage}
                    </p>
                  ) : (
                    visibleNotifications.map((notification) => {
                      const kind = getKind(notification);
                      const { icon: Icon, badge, label } = KIND_STYLES[kind];
                      const isExpanded = expandedId === notification.id;

                      return (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }

                            setExpandedId(
                              isExpanded ? null : notification.id
                            );
                          }}
                          className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-100 ${
                            !notification.is_read ? 'bg-slate-50' : ''
                          }`}
                        >
                          {/* Kind icon */}
                          <div
                            title={label}
                            aria-label={label}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badge}`}
                          >
                            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4
                                className={`truncate text-sm text-slate-900 ${
                                  notification.is_read
                                    ? 'font-medium'
                                    : 'font-semibold'
                                }`}
                              >
                                {notification.title}
                              </h4>

                              {!notification.is_read && (
                                <span
                                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                                  aria-label="Unread"
                                />
                              )}
                            </div>

                            <div className="mt-0.5 flex items-start justify-between gap-3">
                              <p
                                className={`text-xs leading-relaxed text-slate-500 ${
                                  isExpanded ? '' : 'truncate'
                                }`}
                              >
                                {notification.message}
                              </p>

                              <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                                {timeAgo(notification.created_at)}
                              </span>
                            </div>

                            {isExpanded && (
                              <p className="mt-1.5 text-[10px] text-slate-400">
                                {label} · {formatManilaTime(notification.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-gray-200 mx-0.5" />

          {/* =====================================================
              USER PROFILE
          ===================================================== */}
          <div className="flex items-center gap-3">

            {/* Initials */}
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md overflow-hidden shrink-0">
              {initials || 'U'}
            </div>

            {/* Name + Role */}
            <div className="hidden sm:block text-left">

              <h2 className="text-xs font-bold text-gray-900 leading-tight max-w-[180px] truncate">
                {displayName}
              </h2>

              <p className="text-[10px] text-gray-400 font-medium">
                {userRole}
              </p>

              {departmentNames &&
                departmentNames.length > 0 && (
                  <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">
                    {departmentNames.join(', ')}
                  </p>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}