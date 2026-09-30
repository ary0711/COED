const API = 'http://localhost:5000/api/notifications';

export interface BackendNotificationPayload {
  title: string;
  message: string;
  type?: 'announcement' | 'inquiry' | 'report' | 'staff_update' | 'system';
  roles?: string[];
  department_ids?: string[];
  user_ids?: string[];
}

export async function sendBackendNotification(
  payload: BackendNotificationPayload
): Promise<{ sent: number; muted: number }> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to send notification.');
  return { sent: data.sent ?? 0, muted: data.muted ?? 0 };
}

export async function notifyDean(payload: {
  title: string;
  message: string;
  type?: 'announcement' | 'inquiry' | 'report' | 'staff_update' | 'system';
}): Promise<{ sent: number; muted: number }> {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api/notifications/notify-dean', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to notify the Dean.');
  return { sent: data.sent ?? 0, muted: data.muted ?? 0 };
}