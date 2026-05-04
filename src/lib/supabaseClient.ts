import { createClient } from '@supabase/supabase-js'
import { env, validateEnv } from './env'
import { logWarn } from './logger'

const envStatus = validateEnv()

if (!envStatus.isValid) {
  logWarn('Supabase is not configured.', {
    missing: envStatus.missing,
  })
}

const fallbackSupabaseUrl = 'https://placeholder.supabase.co'
const fallbackSupabaseAnonKey = 'placeholder-anon-key'

export const supabase = createClient(
  env.supabaseUrl || fallbackSupabaseUrl,
  env.supabaseAnonKey || fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
