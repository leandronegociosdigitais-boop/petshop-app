import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vqynkltrccgoptchrfxv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeW5rbHRyY2Nnb3B0Y2hyZnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTU1MjIsImV4cCI6MjA5MzczMTUyMn0.lVVMHKzqf4go2ukLAISCo9N6nYv15fc-Pak0Hb0Tf-w'

export const supabase = createClient(supabaseUrl, supabaseKey)
