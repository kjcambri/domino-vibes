import { createClient } from '@supabase/supabase-js'
import { env, validateEnv } from './env'

const envStatus = validateEnv()

if (!envStatus.isValid) {
  console.warn(
    `Supabase is not configured. Missing: ${envStatus.missing.join(', ')}. Add values to your local .env file when backend work begins.`,
  )
}

const fallbackSupabaseUrl = 'https://placeholder.supabase.co'
const fallbackSupabaseAnonKey = 'placeholder-anon-key'

export const supabase = createClient(
  env.supabaseUrl || fallbackSupabaseUrl,
  env.supabaseAnonKey || fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)
