import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { MobileShell } from '../components/layout/MobileShell'
import { handleAuthCallback } from '../features/auth/authService'
import { getFriendlyAuthError } from '../lib/errors'

type CallbackState = 'loading' | 'success' | 'error'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('Confirming your Domino Vibes account.')

  useEffect(() => {
    let isMounted = true
    let redirectTimer: number | undefined

    async function confirmAccount() {
      try {
        const session = await handleAuthCallback()

        if (!isMounted) {
          return
        }

        setState('success')

        if (session) {
          setMessage('Email confirmed. Opening your profile setup.')
          redirectTimer = window.setTimeout(() => {
            navigate('/profile/setup', { replace: true })
          }, 800)
          return
        }

        setMessage('Email confirmed. Log in to continue.')
        redirectTimer = window.setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1200)
      } catch (caughtError) {
        if (!isMounted) {
          return
        }

        setState('error')
        setMessage(getFriendlyAuthError(caughtError))
      }
    }

    void confirmAccount()

    return () => {
      isMounted = false

      if (redirectTimer) {
        window.clearTimeout(redirectTimer)
      }
    }
  }, [navigate])

  const eyebrow =
    state === 'error'
      ? 'Confirmation issue'
      : state === 'success'
        ? 'Account confirmed'
        : 'Checking your link'

  return (
    <MobileShell>
      <div className="grid flex-1 place-items-center py-3">
        <Card className="w-full text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-cream-50">
            {state === 'error'
              ? 'We could not confirm that link.'
              : 'Confirming your account'}
          </h1>
          <p className="mt-4 text-base leading-7 text-cream-100/78">
            {message}
          </p>

          {state === 'loading' ? (
            <div
              aria-label="Confirming account"
              className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-2 border-gold-200/25 border-t-gold-200"
              role="status"
            />
          ) : null}

          {state === 'error' ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                className="w-full"
                type="button"
                onClick={() => navigate('/signup')}
              >
                Back to sign up
              </Button>
              <Button
                className="w-full"
                type="button"
                variant="secondary"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </MobileShell>
  )
}
