import { useState } from 'react'
import { LogoutButton } from '../components/auth/LogoutButton'
import { Card } from '../components/common/Card'
import { MobileShell } from '../components/layout/MobileShell'
import { useProfile } from '../features/profiles/useProfile'

export function LobbyPage() {
  const { profile } = useProfile()
  const playerName = profile?.displayName || profile?.username || 'Player'
  const [logoutError, setLogoutError] = useState('')

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-4">
        <Card className="mt-auto">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            Lobby
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-cream-50">
            Welcome, {playerName}.
          </h1>
          <p className="mt-4 text-base leading-7 text-cream-100/78">
            Your profile is saved and your account is ready. Table discovery,
            invites, and matchmaking arrive in Sprint 3.
          </p>
          {logoutError ? (
            <div
              className="mt-5 rounded-md border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
              role="alert"
            >
              {logoutError}
            </div>
          ) : null}
          <LogoutButton
            className="mt-6 w-full gap-2"
            onError={setLogoutError}
          />
        </Card>

        <Card className="bg-felt-700/35">
          <p className="text-sm font-bold text-cream-50">Sprint 3 preview</p>
          <p className="mt-2 text-sm leading-6 text-cream-100/72">
            No table cards, seating, chat, or gameplay are built yet. This lobby
            is only the authenticated landing place for Sprint 2.
          </p>
        </Card>
      </div>
    </MobileShell>
  )
}
