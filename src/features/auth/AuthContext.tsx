import {
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import { getSession } from './authService'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getSession()
      .then((currentSession) => {
        if (isMounted) {
          setSession(currentSession)
        }
      })
      .catch((error) => {
        console.warn('Unable to load Supabase session.', error)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: Boolean(session?.user),
    }),
    [isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
