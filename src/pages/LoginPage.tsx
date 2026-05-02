import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthForm, Field } from '../components/auth/AuthForm'
import { MobileShell } from '../components/layout/MobileShell'
import { signIn } from '../features/auth/authService'
import { getFriendlyAuthError } from '../lib/errors'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    setIsLoading(true)

    try {
      await signIn({
        email: email.trim(),
        password,
      })
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col py-3">
        <AuthForm
          description="Log back into your table profile and continue building your Domino Vibes presence."
          error={error}
          eyebrow="Welcome back"
          isLoading={isLoading}
          onSubmit={handleSubmit}
          submitLabel="Log In"
          title="Log in to Domino Vibes."
          footer={
            <p className="text-cream-100/75">
              New around here?{' '}
              <Link className="font-bold text-gold-200" to="/signup">
                Create an account
              </Link>
            </p>
          }
        >
          <Field
            autoComplete="email"
            disabled={isLoading}
            label="Email"
            name="email"
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <Field
            autoComplete="current-password"
            disabled={isLoading}
            label="Password"
            name="password"
            onChange={setPassword}
            placeholder="Your password"
            type="password"
            value={password}
          />
        </AuthForm>
      </div>
    </MobileShell>
  )
}
