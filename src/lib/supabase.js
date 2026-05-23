import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ockwtcyohqfdhcfgclhh.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ja3d0Y3lvaHFmZGhjZmdjbGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTg2MjksImV4cCI6MjA5NDIzNDYyOX0.KmANcu-7UjggXJB7y8EEafMGoEMaOAUDxnBRqt52QFQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
