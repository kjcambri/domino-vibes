import { supabase } from '../../lib/supabaseClient'

export type LoginValues = {
  email: string
  password: string
}

export type SignupValues = LoginValues

export type SignupResult =
  | {
      status: 'confirmation_required'
      message: string
    }
  | {
      status: 'signed_in'
      message: string
    }

type SignupResponse = {
  user: unknown | null
  session: unknown | null
}

export function getAuthCallbackUrl(currentUrl?: string) {
  if (currentUrl) {
    return new URL('/auth/callback', currentUrl).toString()
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }

  return '/auth/callback'
}

export function getSignupResult(data: SignupResponse): SignupResult {
  if (data.session) {
    return {
      status: 'signed_in',
      message: 'Account created. Opening your profile setup.',
    }
  }

  return {
    status: 'confirmation_required',
    message:
      'Account created. Please check your email to confirm your account before logging in.',
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export async function signUp({
  email,
  password,
}: SignupValues): Promise<SignupResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  })

  if (error) {
    throw error
  }

  return getSignupResult(data)
}

export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  })

  if (error) {
    throw error
  }
}

export async function signIn({ email, password }: LoginValues) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function handleAuthCallback(currentUrl?: string) {
  const callbackUrl =
    currentUrl ?? (typeof window !== 'undefined' ? window.location.href : '')
  const fallbackOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const code = callbackUrl
    ? new URL(callbackUrl, fallbackOrigin).searchParams.get('code')
    : null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      throw error
    }

    return data.session
  }

  return getSession()
}
