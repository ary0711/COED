const cron = require('node-cron');
const supabase = require('./supabaseClient');

// ─── Runs every day at midnight (12:00 AM) ───
cron.schedule('0 0 * * *', async () => {
  console.log('Running calendar auto-transfer...');

  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ status: 'history' })
    .lt('event_date', today)
    .eq('status', 'upcoming');

  if (error) {
    console.error('Auto-transfer failed:', error.message);
  } else {
    console.log(`Auto-transfer done! ${data?.length ?? 0} events moved to history.`);
  }
});

console.log('Cron job scheduled — calendar auto-transfer active!');