import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase environment variables.\n' +
    'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
    'are set in your Vercel project settings under Settings → Environment Variables.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)

export function checkEnvVars(): string | null {
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    return 'NEXT_PUBLIC_SUPABASE_URL is not set. Go to Vercel → Settings → Environment Variables and add it.'
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Go to Vercel → Settings → Environment Variables and add it.'
  }
  return null
}
