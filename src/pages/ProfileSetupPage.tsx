import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthForm, Field } from '../components/auth/AuthForm'
import { MobileShell } from '../components/layout/MobileShell'
import { useAuth } from '../features/auth/useAuth'
import { useCreateProfile } from '../features/profiles/useProfile'
import { getFriendlyAuthError } from '../lib/errors'

const usernamePattern = /^[a-z0-9_]+$/

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createProfile = useCreateProfile()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedUsername = username.trim().toLowerCase()
    const normalizedDisplayName = displayName.trim()

    if (!normalizedUsername) {
      setError('Username is required.')
      return
    }

    if (
      normalizedUsername.length < 3 ||
      normalizedUsername.length > 20 ||
      !usernamePattern.test(normalizedUsername)
    ) {
      setError('Username must be 3 to 20 letters, numbers, or underscores.')
      return
    }

    if (
      normalizedDisplayName.length < 2 ||
      normalizedDisplayName.length > 40
    ) {
      setError('Display name must be 2 to 40 characters.')
      return
    }

    if (!user) {
      setError('Please log in before creating a profile.')
      return
    }

    try {
      await createProfile.mutateAsync({
        userId: user.id,
        username: normalizedUsername,
        displayName: normalizedDisplayName,
      })
      navigate('/lobby', { replace: true })
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col py-3">
        <AuthForm
          description="Pick the name other players will see around the table. You can add avatars and style later."
          error={error}
          eyebrow="Player profile"
          isLoading={createProfile.isPending}
          onSubmit={handleSubmit}
          submitLabel="Save Profile"
          title="Set up your table identity."
        >
          <Field
            autoComplete="username"
            disabled={createProfile.isPending}
            label="Username"
            name="username"
            onChange={setUsername}
            placeholder="domino_king"
            value={username}
          />
          <Field
            autoComplete="name"
            disabled={createProfile.isPending}
            label="Display name"
            name="display-name"
            onChange={setDisplayName}
            placeholder="Kevon"
            value={displayName}
          />
        </AuthForm>
      </div>
    </MobileShell>
  )
}
