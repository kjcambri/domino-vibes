import {
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from '../components/auth/LogoutButton'
import { BetaFeedbackLink } from '../components/beta/BetaFeedbackLink'
import { BetaReadinessCard } from '../components/beta/BetaReadinessCard'
import { Card } from '../components/common/Card'
import { MobileShell } from '../components/layout/MobileShell'
import { useAuth } from '../features/auth/useAuth'
import { useProfile } from '../features/profiles/useProfile'
import { appInfo } from '../lib/appInfo'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [error, setError] = useState('')
  const displayName = profile?.displayName || 'Domino player'
  const username = profile?.username ? `@${profile.username}` : 'Profile pending'
  const accountCreatedAt = formatProfileDate(user?.created_at)
  const emailConfirmed = Boolean(user?.email_confirmed_at)

  return (
    <MobileShell className="max-w-5xl">
      <div className="flex flex-1 flex-col gap-5 py-4">
        <Card className="relative overflow-hidden border-gold-300/20 bg-[radial-gradient(circle_at_20%_0%,rgba(242,193,78,0.18),transparent_14rem),linear-gradient(145deg,rgba(42,22,10,0.88),rgba(6,31,24,0.82))]">
          <div className="absolute -right-14 -top-14 size-44 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="relative grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="mx-auto grid size-28 place-items-center rounded-[2rem] border border-gold-300/35 bg-gold-300/14 text-gold-100 shadow-gold md:mx-0">
              <UserRound aria-hidden="true" size={48} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
                Player profile
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-cream-50">
                {displayName}
              </h1>
              <p className="mt-1 text-sm font-bold text-cream-100/70">
                {username}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                <ProfileStatusPill
                  icon={<BadgeCheck size={15} />}
                  label={emailConfirmed ? 'Email confirmed' : 'Confirm email'}
                  tone={emailConfirmed ? 'teal' : 'gold'}
                />
                <ProfileStatusPill
                  icon={<ShieldCheck size={15} />}
                  label="Private beta tester"
                  tone="gold"
                />
              </div>
            </div>
          </div>

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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              Account details
            </p>
            <dl className="mt-5 grid gap-3">
              <ProfileRow
                icon={<Mail size={17} />}
                label="Email"
                value={user?.email ?? 'Unknown'}
              />
              <ProfileRow
                icon={<CalendarDays size={17} />}
                label="Joined"
                value={accountCreatedAt}
              />
              <ProfileRow
                icon={<UserRound size={17} />}
                label="Avatar"
                value={profile?.avatarUrl ? 'Custom avatar set' : 'Placeholder'}
              />
              <ProfileRow
                icon={<ShieldCheck size={17} />}
                label="Build"
                value={`${appInfo.appName} ${appInfo.appVersion} (${appInfo.buildMode})`}
              />
            </dl>
          </Card>

          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              Private beta support
            </p>
            <h2 className="mt-2 text-xl font-black text-cream-50">
              Help us make the table smoother.
            </h2>
            <p className="mt-3 text-sm leading-6 text-cream-100/72">
              Report bugs with your device, browser, page URL, steps, what you
              expected, and a screenshot. Never include passwords or hidden hand
              tile details.
            </p>
            <BetaFeedbackLink
              className="mt-5 w-full"
              label="Send feedback"
              source="Profile beta support"
            />
          </Card>
        </section>

        <BetaReadinessCard source="Profile beta readiness" />
      </div>
    </MobileShell>
  )
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-cream-100/10 bg-green-950/45 px-4 py-3">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gold-200">
        <span className="text-teal-200">{icon}</span>
        {label}
      </dt>
      <dd className="col-start-2 break-words text-sm font-bold text-cream-50">
        {value}
      </dd>
    </div>
  )
}

function ProfileStatusPill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode
  label: string
  tone: 'gold' | 'teal'
}) {
  return (
    <span
      className={
        tone === 'teal'
          ? 'inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-teal-100'
          : 'inline-flex items-center gap-2 rounded-full border border-gold-300/35 bg-gold-300/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-gold-100'
      }
    >
      {icon}
      {label}
    </span>
  )
}

function formatProfileDate(value?: string) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
