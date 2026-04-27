import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnhvuwfigqbkfbuyopmw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaHZ1d2ZpZ3Fia2ZidXlvcG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI3MDQ2NywiZXhwIjoyMDkyODQ2NDY3fQ.7Xe-mUi-IgYE6fEP2nKZlmrI60cml391xEzMQmqhjFY'

export const supabase = createClient(supabaseUrl, supabaseKey)