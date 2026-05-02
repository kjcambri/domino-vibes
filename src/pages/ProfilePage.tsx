import { UserRound } from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from '../components/auth/LogoutButton'
import { Card } from '../components/common/Card'
import { MobileShell } from '../components/layout/MobileShell'
import { useAuth } from '../features/auth/useAuth'
import { useProfile } from '../features/profiles/useProfile'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [error, setError] = useState('')

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-4">
        <Card className="mt-auto">
          <div className="grid place-items-center gap-4 text-center">
            <div className="grid size-24 place-items-center rounded-full border border-gold-300/30 bg-gold-300/15 text-gold-100 shadow-gold">
              <UserRound aria-hidden="true" size={42} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
                Player profile
              </p>
              <h1 className="mt-2 text-3xl font-black text-cream-50">
                {profile?.displayName}
              </h1>
              <p className="mt-1 text-sm font-bold text-cream-100/70">
                @{profile?.username}
              </p>
            </div>
          </div>

          <dl className="mt-7 grid gap-3">
            <ProfileRow label="Email" value={user?.email ?? 'Unknown'} />
            <ProfileRow
              label="Avatar"
              value={profile?.avatarUrl ? 'Custom avatar set' : 'Placeholder'}
            />
          </dl>

          {error ? (
            <div
              className="mt-5 rounded-md border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <LogoutButton
            className="mt-6 w-full gap-2"
            onError={setError}
          />
        </Card>
      </div>
    </MobileShell>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cream-100/10 bg-green-950/45 px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-gold-200">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-cream-50">{value}</dd>
    </div>
  )
}
