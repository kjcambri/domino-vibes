import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthForm, Field } from '../components/auth/AuthForm'
import { Button } from '../components/common/Button'
import { MobileShell } from '../components/layout/MobileShell'
import { resendSignupConfirmation, signUp } from '../features/auth/authService'
import { getFriendlyAuthError } from '../lib/errors'

export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

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
      const trimmedEmail = email.trim()
      const result = await signUp({
        email: trimmedEmail,
        password,
      })

      setSuccess(result.message)
      setConfirmationEmail(trimmedEmail)

      if (result.status === 'confirmation_required') {
        setPassword('')
        setConfirmPassword('')
      }
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendConfirmation() {
    const trimmedEmail = email.trim() || confirmationEmail

    if (!trimmedEmail) {
      setError('Enter your email address to resend the confirmation email.')
      return
    }

    setError('')
    setSuccess('')
    setIsResending(true)

    try {
      await resendSignupConfirmation(trimmedEmail)
      setConfirmationEmail(trimmedEmail)
      setSuccess('Confirmation email sent. Check your inbox and spam folder.')
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    } finally {
      setIsResending(false)
    }
  }

  const isBusy = isLoading || isResending

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col py-3">
        <AuthForm
          description="Create your account first. Your public player profile comes next."
          error={error}
          success={success}
          eyebrow="Join the table"
          isLoading={isBusy}
          onSubmit={handleSubmit}
          submitLabel="Create Account"
          title="Start your Domino Vibes profile."
          footer={
            <div className="grid gap-3 text-cream-100/75">
              {confirmationEmail || email.trim() ? (
                <Button
                  className="w-full"
                  disabled={isBusy}
                  onClick={handleResendConfirmation}
                  type="button"
                  variant="secondary"
                >
                  {isResending ? 'Sending...' : 'Resend confirmation email'}
                </Button>
              ) : null}
              <p>
                Already have an account?{' '}
                <Link className="font-bold text-gold-200" to="/login">
                  Log in
                </Link>
              </p>
            </div>
          }
        >
          <Field
            autoComplete="email"
            disabled={isBusy}
            label="Email"
            name="email"
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <Field
            autoComplete="new-password"
            disabled={isBusy}
            label="Password"
            name="password"
            onChange={setPassword}
            placeholder="At least 6 characters"
            type="password"
            value={password}
          />
          <Field
            autoComplete="new-password"
            disabled={isBusy}
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
