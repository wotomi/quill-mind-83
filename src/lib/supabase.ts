import { createClient } from '@supabase/supabase-js'

// Get Supabase environment variables - these should be available in Lovable Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.error('Supabase URL not found. Please ensure your Supabase integration is properly configured.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('Supabase Anonymous Key not found. Please ensure your Supabase integration is properly configured.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)