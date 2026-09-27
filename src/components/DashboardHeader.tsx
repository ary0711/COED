// ─── DashboardHeader.tsx ───────────────────────────────────────────────────────
import { Bell, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Notification } from '../notification';

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
              <div className="absolute right-0 mt-2 w-[350px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">

                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Notifications
                  </h3>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No notifications.
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(
                              notification.id
                            );
                          }

                          setExpandedId(
                            expandedId ===
                              notification.id
                              ? null
                              : notification.id
                          );
                        }}
                        className={`p-3.5 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${
                          !notification.is_read
                            ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-xs">
                            {notification.title}
                          </h4>

                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                          )}
                        </div>

                        {expandedId ===
                          notification.id && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {formatManilaTime(
                            notification.created_at
                          )}
                        </p>
                      </div>
                    )
                  )
                )}
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