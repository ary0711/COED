import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert' | 'system';
  title: string;
  message: string; // Your DB uses 'message', not 'description'
  created_at: string; // Your DB uses timestamp
  is_read: boolean;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // ... keep your getIcon and getBorderColor helper functions here ...

  if (loading) return <div className="p-6">Loading notifications...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      {/* Header section remains the same */}
      
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No new notifications</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 bg-[#F8FAFC] rounded-lg border-l-4 ${getBorderColor(notification.type)} hover:shadow-md transition-shadow duration-200 ${notification.is_read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}