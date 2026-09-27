import { supabase } from './supabaseClient';

export type NotificationType =
  | 'inquiry'
  | 'report'
  | 'announcement'
  | 'staff_update'
  | 'system';

interface NotificationOptions {
  type?: NotificationType;
  referenceId?: string;
  referenceTable?: string;
}

interface NotificationPreference {
  user_id: string;
  inquiries: boolean;
  reports: boolean;
  announcements: boolean;
  staff_updates: boolean;
  system_notifs: boolean;
}

// =========================================================
// MAP NOTIFICATION TYPE TO USER PREFERENCE
// =========================================================

function isEnabled(
  preferences: NotificationPreference | null,
  type: NotificationType
): boolean {
  // No saved preference = notifications are ON
  if (!preferences) {
    return true;
  }

  switch (type) {
    case 'inquiry':
      return preferences.inquiries;

    case 'report':
      return preferences.reports;

    case 'announcement':
      return preferences.announcements;

    case 'staff_update':
      return preferences.staff_updates;

    case 'system':
      return preferences.system_notifs;

    default:
      return true;
  }
}

// =========================================================
// GET ONE USER'S NOTIFICATION PREFERENCE
// =========================================================

async function getNotificationPreference(
  userId: string
): Promise<NotificationPreference | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(`
      user_id,
      inquiries,
      reports,
      announcements,
      staff_updates,
      system_notifs
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(
      'Notification preference lookup error:',
      error
    );

    // Default to ON if preference cannot be loaded
    return null;
  }

  return data;
}

// =========================================================
// CREATE NOTIFICATION FOR ONE USER
// =========================================================

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  options: NotificationOptions = {}
) {
  const {
    type = 'system',
    referenceId,
    referenceTable,
  } = options;

  // Check user's notification preference
  const preferences =
    await getNotificationPreference(userId);

  // OFF = do not create notification
  if (!isEnabled(preferences, type)) {
    console.log(
      `Notification blocked for user ${userId}: ${type}`
    );

    return;
  }

  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        type,
        reference_id: referenceId || null,
        reference_table:
          referenceTable || null,
      },
    ]);

  if (error) {
    console.error(
      'Notification Error:',
      error
    );
  } else {
    console.log(
      `Notification created: ${type}`
    );
  }
}

// =========================================================
// NOTIFY USERS BY ROLE
// =========================================================

export async function notifyRole(
  role: string,
  title: string,
  message: string,
  referenceId?: string,
  type: NotificationType = 'announcement',
  referenceTable: string = 'announcements'
) {
  console.log(
    'Looking for role:',
    role
  );

  const {
    data: users,
    error: usersError,
  } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', role);

  if (usersError) {
    console.error(
      'User lookup error:',
      usersError
    );
    return;
  }

  if (!users || users.length === 0) {
    console.log(
      'No users found.'
    );
    return;
  }

  const userIds = users.map(
    (user) => user.id
  );

  // =====================================================
  // LOAD ALL PREFERENCES IN ONE QUERY
  // =====================================================

  const {
    data: preferences,
    error: preferencesError,
  } = await supabase
    .from('notification_preferences')
    .select(`
      user_id,
      inquiries,
      reports,
      announcements,
      staff_updates,
      system_notifs
    `)
    .in(
      'user_id',
      userIds
    );

  if (preferencesError) {
    console.error(
      'Notification preferences error:',
      preferencesError
    );
  }

  // Convert preferences to quick lookup
  const preferenceMap = new Map<
    string,
    NotificationPreference
  >();

  (preferences || []).forEach(
    (preference) => {
      preferenceMap.set(
        preference.user_id,
        preference
      );
    }
  );

  // =====================================================
  // ONLY CREATE NOTIFICATIONS FOR USERS WHO ENABLED IT
  // =====================================================

  const notifications = users
    .filter((user) => {
      const preference =
        preferenceMap.get(user.id) || null;

      return isEnabled(
        preference,
        type
      );
    })
    .map((user) => ({
      user_id: user.id,
      title,
      message,
      type,
      reference_id:
        referenceId || null,
      reference_table:
        referenceTable || null,
    }));

  if (
    notifications.length === 0
  ) {
    console.log(
      `All ${type} notifications are turned OFF.`
    );

    return;
  }

  console.log(
    'Notifications to insert:',
    notifications
  );

  const {
    error: insertError,
  } = await supabase
    .from('notifications')
    .insert(
      notifications
    );

  if (insertError) {
    console.error(
      'Notification insert error:',
      insertError
    );
  } else {
    console.log(
      `${notifications.length} ${type} notification(s) inserted successfully`
    );
  }
}