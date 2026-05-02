type EnvKey = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

export type EnvValidationResult = {
  isValid: boolean
  missing: EnvKey[]
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
}

export function validateEnv(): EnvValidationResult {
  const missing: EnvKey[] = []

  if (!env.supabaseUrl) {
    missing.push('VITE_SUPABASE_URL')
  }

  if (!env.supabaseAnonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY')
  }

  return {
    isValid: missing.length === 0,
    missing,
  }
}
