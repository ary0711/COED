import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lnhvuwfigqbkfbuyopmw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaHZ1d2ZpZ3Fia2ZidXlvcG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzA0NjcsImV4cCI6MjA5Mjg0NjQ2N30.mwqsSDK2gu8TbO2xZngyI93GHS68aGT0JRkU1GotEVQ'

export const supabase = createClient(supabaseUrl, supabaseKey)