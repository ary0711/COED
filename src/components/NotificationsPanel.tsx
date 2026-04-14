import { AlertCircle, Clock, CheckCircle, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  description: string;
  time: string;
}

const deanNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Pending Faculty Reports',
    description: '12 faculty members have not submitted their quarterly reports',
    time: '2 hours ago'
  },
  {
    id: '2',
    type: 'info',
    title: 'Upcoming College Activity',
    description: 'Annual Research Symposium scheduled for February 20, 2026',
    time: '5 hours ago'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Evaluation Status',
    description: 'Student evaluation period ends in 3 days',
    time: '1 day ago'
  },
  {
    id: '4',
    type: 'success',
    title: 'Alumni Tracer Update',
    description: '156 new alumni responses received this week',
    time: '1 day ago'
  },
  {
    id: '5',
    type: 'warning',
    title: 'Department Budget Review',
    description: 'Engineering department budget requires your approval',
    time: '2 days ago'
  }
];

const chairNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Faculty Report Submission',
    description: '3 faculty members pending report submission',
    time: '1 hour ago'
  },
  {
    id: '2',
    type: 'info',
    title: 'Department Activity',
    description: 'Faculty meeting scheduled for February 15, 2026',
    time: '4 hours ago'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Course Evaluation',
    description: 'Mid-term evaluation forms available for review',
    time: '1 day ago'
  }
];

interface NotificationsPanelProps {
  userType: 'dean' | 'chair';
}

export function NotificationsPanel({ userType }: NotificationsPanelProps) {
  const notifications = userType === 'dean' ? deanNotifications : chairNotifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <Bell className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-orange-500';
      case 'info':
        return 'border-l-blue-500';
      case 'success':
        return 'border-l-green-500';
      case 'alert':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications & Alerts</h3>
          <p className="text-sm text-gray-500">Recent updates and reminders</p>
        </div>
        <button className="text-[#2563EB] text-sm font-medium hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 bg-[#F8FAFC] rounded-lg border-l-4 ${getBorderColor(notification.type)} hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.description}
                </p>
                <span className="text-xs text-gray-500">{notification.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
