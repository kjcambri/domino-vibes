import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthForm, Field } from '../components/auth/AuthForm'
import { MobileShell } from '../components/layout/MobileShell'
import { signUp } from '../features/auth/authService'
import { getFriendlyAuthError } from '../lib/errors'

export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    if (!password) {
      setError('Password is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords must match.')
      return
    }

    setIsLoading(true)

    try {
      await signUp({
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
          description="Create your account first. Your public player profile comes next."
          error={error}
          eyebrow="Join the table"
          isLoading={isLoading}
          onSubmit={handleSubmit}
          submitLabel="Create Account"
          title="Start your Domino Vibes profile."
          footer={
            <p className="text-cream-100/75">
              Already have an account?{' '}
              <Link className="font-bold text-gold-200" to="/login">
                Log in
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
            autoComplete="new-password"
            disabled={isLoading}
            label="Password"
            name="password"
            onChange={setPassword}
            placeholder="At least 6 characters"
            type="password"
            value={password}
          />
          <Field
            autoComplete="new-password"
            disabled={isLoading}
            label="Confirm password"
            name="confirm-password"
            onChange={setConfirmPassword}
            placeholder="Repeat your password"
            type="password"
            value={confirmPassword}
          />
        </AuthForm>
      </div>
    </MobileShell>
  )
}
