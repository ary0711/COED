import { supabase } from './supabaseClient';

export async function createNotification(
  userId: string,
  title: string,
  message: string
) {
  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message
      }
    ]);

  if (error) {
    console.error('Notification Error:', error);
  }
}

export async function notifyRole(
  role: string,
  title: string,
  message: string,
  referenceId?: string
) {
  console.log('Looking for role:', role);

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', role);

  console.log('Users found:', users);

  if (error) {
    console.error(error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  const notifications = users.map(user => ({
    user_id: user.id,
    title,
    message,
    reference_id: referenceId,
    reference_table: 'announcements'
  }));

  console.log('Notifications to insert:', notifications);

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (insertError) {
    console.error(insertError);
  } else {
    console.log('Notifications inserted successfully');
  }
}