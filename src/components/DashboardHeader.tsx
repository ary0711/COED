import { Bell, Settings, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
    hour12: true
  });
}
interface DashboardHeaderProps {
  userRole: string;
  userName: string;
  onMenuClick?: () => void; // ← added for mobile sidebar toggle
  
}

export function DashboardHeader({
  userRole,
  userName,
  onMenuClick
}: DashboardHeaderProps) {
const [notifications, setNotifications] = useState<Notification[]>([]);
const [showNotifications, setShowNotifications] = useState(false);
const [expandedId, setExpandedId] =
  useState<string | null>(null);
async function markAsRead(id: string) {
  await supabase
    .from('notifications')
    .update({
      is_read: true
    })
    .eq('id', id);

  setNotifications(prev =>
    prev.map(notification =>
      notification.id === id
        ? {
            ...notification,
            is_read: true
          }
        : notification
    )
  );
}
const unreadCount = notifications.filter(
  notification => !notification.is_read
).length;
useEffect(() => {
  loadNotifications();
}, []);
async function loadNotifications() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from('annoucements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false
    });

  if (data) {
    setNotifications(data);
  }
}useEffect(() => {
  let channel: any;

  async function subscribeRealtime() {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    channel = supabase
  .channel(`notifications-${user.id}`)

  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications'
    },
    payload => {
      const newNotification =
        payload.new as Notification;

      if (
        newNotification.user_id === user.id
      ) {
        setNotifications(prev => [
          newNotification,
          ...prev
        ]);
      }
    }
  )

  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'notifications'
    },
    payload => {
      setNotifications(prev =>
        prev.filter(
          n => n.id !== payload.old.id
        )
      );
    }
  )

  .subscribe();
  }

  subscribeRealtime();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, []);
  return (
    
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between">

          {/* Left side - Hamburger (mobile only) + User info */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* ── Hamburger button — only on mobile/tablet ── */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 text-gray-600 shrink-0"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Name + Role */}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[140px] sm:max-w-none">
                {userName}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
  <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
  >
    <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />

    {unreadCount > 0 && (
      <span className="
        absolute
        -top-1
        -right-1
        min-w-[18px]
        h-[18px]
        px-1
        flex
        items-center
        justify-center
        bg-red-500
        text-white
        text-[10px]
        rounded-full
        font-bold
      ">
        {unreadCount}
      </span>
    )}
  </button>

  {showNotifications && (
    <div
      className="
        absolute
        right-0
        mt-2
        w-[450px]
        bg-white
        rounded-xl
        shadow-xl
        border
        border-gray-200
        z-50
        max-h-96
        overflow-y-auto
      "
    >
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">
          Notifications
        </h3>
      </div>

      {notifications.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          No notifications.
        </div>
      ) : (
        notifications.map(notification => (
  <div
  key={notification.id}
  onClick={() => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    setExpandedId(
      expandedId === notification.id
        ? null
        : notification.id
    );
  }}
  className={`
    p-4
    border-b
    cursor-pointer
    transition-all
    duration-200
    hover:bg-gray-50
    ${
      !notification.is_read
        ? 'bg-blue-50 border-l-4 border-l-blue-500'
        : ''
    }
  `}

          >
            <div className="flex items-start justify-between">
  <h4 className="font-semibold text-gray-900 text-sm">
    {notification.title}
  </h4>

  {!notification.is_read && (
    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
  )}
</div>

            {expandedId === notification.id && (
  <div className="mt-3">
    <p className="text-sm text-gray-600 leading-relaxed">
      {notification.message}
    </p>
  </div>
)}

            <p className="text-xs text-gray-500 mt-2">
  {formatManilaTime(notification.created_at)}
</p>
          </div>
        ))
      )}
    </div>
  )}
</div>
            <button className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 group">
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}