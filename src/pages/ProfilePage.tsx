import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Eye,
  Gem,
  Home,
  Mail,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Table2,
  Trophy,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { BetaFeedbackLink } from '../components/beta/BetaFeedbackLink'
import { buttonClasses } from '../components/common/buttonStyles'
import { avatarPresets, getAvatarPresetByUrl } from '../features/profiles/avatarPresets'
import {
  normalizeProfileForm,
  validateProfileForm,
} from '../features/profiles/profileForm'
import { type Profile } from '../features/profiles/profileService'
import { useProfile, useUpdateProfile } from '../features/profiles/useProfile'
import { useAuth } from '../features/auth/useAuth'
import { appInfo } from '../lib/appInfo'
import { getFriendlyAuthError } from '../lib/errors'

const panelClass =
  'rounded-xl border border-[#4f4633] bg-[#241f15] shadow-[0_18px_48px_rgba(0,0,0,0.32)]'
const goldRimClass =
  'bg-[linear-gradient(45deg,#fbbf24,#78350f,#fbbf24)] p-px'
const innerPanelClass = 'h-full w-full rounded-[inherit] bg-[#241f15]'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isProfileLoading, profileError } = useProfile()
  const [logoutError, setLogoutError] = useState('')

  const displayTitle = profile?.displayName || 'Domino player'
  const usernameLabel = profile?.username || 'profile_pending'
  const currentAvatarUrl = profile?.avatarUrl || avatarPresets[0]?.url
  const accountCreatedAt = formatProfileDate(profile?.createdAt ?? user?.created_at)
  const emailConfirmed = Boolean(user?.email_confirmed_at)

  return (
    <div className="min-h-svh bg-[#17130a] text-[#ece1d1]">
      <ProfileSideNav />
      <MobileProfileTopBar />

      <main className="min-h-svh pb-28 pt-16 lg:ml-64 lg:pb-10 lg:pt-0">
        <div className="mx-auto max-w-5xl pb-8">
          <section className="relative">
            <div className="relative h-64 overflow-hidden rounded-b-xl bg-[linear-gradient(90deg,#3e2723,#4e342e),radial-gradient(circle_at_18%_18%,rgba(249,189,34,0.18),transparent_16rem),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_22px)] bg-blend-overlay shadow-wood">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(107,216,203,0.13),transparent_14rem),linear-gradient(120deg,transparent,rgba(255,225,167,0.08),transparent)]" />
            </div>

            <div className="absolute bottom-0 left-0 flex w-full translate-y-1/2 flex-col gap-4 px-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <GoldAvatar avatarUrl={currentAvatarUrl} label={displayTitle} />
                <div className="text-center drop-shadow-md sm:mb-6 sm:text-left">
                  <h1 className="font-serif text-4xl font-black leading-tight text-[#ffdf9f]">
                    {usernameLabel}
                  </h1>
                  <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                    <Sparkles aria-hidden="true" className="text-[#f9bd22]" size={16} />
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f9bd22]">
                      {displayTitle}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
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

              <div className="z-10 mb-0 flex gap-3 self-center sm:mb-8 sm:self-end">
                <SoonAction icon={<MessageCircle size={16} />} label="Message" primary />
                <SoonAction icon={<UserPlus size={16} />} label="Add Friend" />
              </div>
            </div>
          </section>

          <div className="h-52 sm:h-32" />

          <div className="grid gap-6 px-6 xl:grid-cols-3">
            <aside className="space-y-6">
              <div className={`${goldRimClass} rounded-xl`}>
                <div className={`${innerPanelClass} p-4`}>
                  <ProfileEditor
                    disabled={isProfileLoading}
                    profile={profile}
                    userId={user?.id}
                  />
                </div>
              </div>

              <StatsPreviewCard />
            </aside>

            <section className="space-y-6 xl:col-span-2">
              {logoutError ? <AlertCard message={logoutError} tone="error" /> : null}
              {isProfileLoading ? (
                <AlertCard message="Loading your player profile..." tone="success" />
              ) : null}
              {profileError ? (
                <AlertCard message={getFriendlyAuthError(profileError)} tone="error" />
              ) : null}

              <div className={`${goldRimClass} rounded-xl shadow-gold`}>
                <div className={`${innerPanelClass} rounded-xl bg-[#1a3a32] p-6 shadow-[inset_0_4px_18px_rgba(0,0,0,0.48)]`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-serif text-2xl font-black text-[#ffdf9f]">
                      Trophy Wall
                    </h2>
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[#b6edff]">
                      Coming soon
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TrophyCard
                      description="100 Capicu-style finishes"
                      icon={<Trophy size={42} />}
                      label="Capicu Master"
                      tone="gold"
                    />
                    <TrophyCard
                      description="Win with no round losses"
                      icon={<Gem size={38} />}
                      label="Flawless Game"
                      tone="teal"
                    />
                    <TrophyCard
                      description="10 game streak"
                      icon={<Sparkles size={38} />}
                      label="Hot Hand"
                      tone="gold"
                    />
                  </div>
                </div>
              </div>

              <div className={`${panelClass} p-6`}>
                <div className="mb-4 border-b border-[#4f4633] pb-3">
                  <h2 className="font-serif text-2xl font-black text-[#ece1d1]">
                    Recent Matches
                  </h2>
                </div>
                <div className="space-y-3">
                  <MatchPreview
                    label="Cutthroat 4"
                    result="Beta data coming soon"
                    status="Replay"
                    tone="teal"
                  />
                  <MatchPreview
                    label="Live table history"
                    result="Stats will unlock after beta hardening"
                    status="Soon"
                    tone="gold"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <AccountDetailsCard
              accountCreatedAt={accountCreatedAt}
              avatarLabel={getAvatarPresetByUrl(currentAvatarUrl)?.label ?? 'Pixel Art preset'}
              email={user?.email ?? 'Unknown'}
            />
            <SupportCard onLogoutError={setLogoutError} />
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}

function ProfileSideNav() {
  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[#4f4633] bg-[#241f15] shadow-xl lg:flex">
      <div className="px-4 py-8">
        <p className="font-serif text-5xl font-black leading-tight text-[#fbbf24]">
          Domino Vibes
        </p>
        <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-[#d3c5ac]">
          Elite Social Club
        </p>
      </div>
      <ul className="flex-1 space-y-1 px-2">
        <ProfileNavItem icon={<Home size={20} />} label="Home" to="/" />
        <ProfileNavItem icon={<Table2 size={20} />} label="Play" to="/lobby" />
        <ProfileNavItem comingSoon icon={<Eye size={20} />} label="Watch" />
        <ProfileNavItem icon={<UsersRound size={20} />} label="Friends" to="/friends" />
        <ProfileNavItem comingSoon icon={<Crown size={20} />} label="Clubs" />
        <ProfileNavItem comingSoon icon={<Trophy size={20} />} label="Leaderboard" />
        <ProfileNavItem active icon={<UserRound size={20} />} label="Profile" to="/profile" />
        <ProfileNavItem comingSoon icon={<ShoppingBag size={20} />} label="Store" />
        <ProfileNavItem comingSoon icon={<Settings size={20} />} label="Settings" />
      </ul>
    </nav>
  )
}

function ProfileNavItem({
  active = false,
  comingSoon = false,
  icon,
  label,
  to,
}: {
  active?: boolean
  comingSoon?: boolean
  icon: ReactNode
  label: string
  to?: string
}) {
  const className = active
    ? 'flex min-h-12 translate-x-1 items-center gap-4 rounded-lg border-l-4 border-[#f9bd22] bg-[#3a3429] px-4 text-sm font-black uppercase tracking-[0.06em] text-[#ffdf9f]'
    : 'flex min-h-12 items-center gap-4 rounded-lg px-4 text-sm font-black uppercase tracking-[0.06em] text-[#d3c5ac] transition hover:bg-[#2f291f] hover:text-[#ece1d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bd8cb]'

  const content = (
    <>
      {icon}
      <span>{label}</span>
      {comingSoon ? (
        <span className="ml-auto rounded-full border border-[#4f4633] px-2 py-1 text-[0.56rem] text-[#9c8f79]">
          Soon
        </span>
      ) : null}
    </>
  )

  if (to && !comingSoon) {
    return (
      <li>
        <Link aria-current={active ? 'page' : undefined} className={className} to={to}>
          {content}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <div aria-disabled className={`${className} opacity-70`}>
        {content}
      </div>
    </li>
  )
}

function MobileProfileTopBar() {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#4f4633] bg-[#2f291f] px-4 shadow-md lg:hidden">
      <Link className="font-serif text-2xl font-black text-[#fbbf24]" to="/">
        Domino Vibes
      </Link>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#6bd8cb]">
        Profile
      </span>
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-[#4f4633] bg-[#3a3429] px-4 pb-4 pt-2 shadow-2xl lg:hidden">
      <MobileNavItem icon={<Home size={20} />} label="Home" to="/" />
      <MobileNavItem icon={<Table2 size={20} />} label="Play" to="/lobby" />
      <MobileNavItem icon={<UsersRound size={20} />} label="Friends" to="/friends" />
      <MobileNavItem active icon={<UserRound size={20} />} label="Profile" to="/profile" />
    </nav>
  )
}

function MobileNavItem({
  active = false,
  icon,
  label,
  to,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  to: string
}) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex min-w-20 flex-col items-center justify-center rounded-xl bg-[#fbbf24] p-2 text-[#6c4f00]'
          : 'flex min-w-20 flex-col items-center justify-center rounded-lg p-2 text-[#d3c5ac]'
      }
      to={to}
    >
      {icon}
      <span className="mt-1 text-xs font-bold">{label}</span>
    </Link>
  )
}

function GoldAvatar({
  avatarUrl,
  label,
}: {
  avatarUrl?: string | null
  label: string
}) {
  return (
    <div className={`${goldRimClass} relative z-10 size-40 shrink-0 rounded-full shadow-2xl`}>
      <div className="h-full w-full overflow-hidden rounded-full bg-[#3a3429]">
        {avatarUrl ? (
          <img
            alt={`${label} avatar`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            src={avatarUrl}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[#fbbf24]">
            <UserRound aria-hidden="true" size={62} />
          </span>
        )}
      </div>
      <div className="absolute bottom-2 right-2 size-6 rounded-full border-2 border-[#241f15] bg-[#0d9488] shadow-sm" />
      <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-[#4f4633] bg-[#2f291f] px-2 py-1 shadow-md">
        <span className="mr-1 text-[10px]">DV</span>
        <span className="text-xs font-bold text-[#ece1d1]">Beta</span>
      </div>
    </div>
  )
}

function SoonAction({
  icon,
  label,
  primary = false,
}: {
  icon: ReactNode
  label: string
  primary?: boolean
}) {
  return (
    <button
      className={
        primary
          ? 'inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#fbbf24] px-4 py-2 text-sm font-black text-[#6c4f00] opacity-75'
          : 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#4f4633] px-4 py-2 text-sm font-black text-[#ece1d1] opacity-75'
      }
      disabled
      type="button"
    >
      {icon}
      {label}
      <span className="sr-only">coming soon</span>
    </button>
  )
}

function ProfileEditor({
  disabled,
  profile,
  userId,
}: {
  disabled: boolean
  profile: Profile | null
  userId?: string
}) {
  const updateProfile = useUpdateProfile()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    getAvatarPresetByUrl(profile?.avatarUrl)?.url ?? null,
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isDisabled = disabled || updateProfile.isPending || !profile || !userId

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!profile || !userId) {
      setError('Please log in with a completed profile before updating.')
      return
    }

    const validationError = validateProfileForm({
      username,
      displayName,
      avatarUrl,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    const normalizedProfile = normalizeProfileForm({
      username,
      displayName,
      avatarUrl,
    })

    try {
      await updateProfile.mutateAsync({
        userId,
        username: normalizedProfile.username,
        displayName: normalizedProfile.displayName,
        avatarUrl: normalizedProfile.avatarUrl,
      })
      setUsername(normalizedProfile.username)
      setDisplayName(normalizedProfile.displayName)
      setAvatarUrl(normalizedProfile.avatarUrl)
      setSuccess('Profile updated. Your table identity is ready.')
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError))
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <ProfileField
          disabled={isDisabled}
          label="Display name"
          maxLength={40}
          minLength={2}
          name="display-name"
          onChange={setDisplayName}
          placeholder="Kevon"
          value={displayName}
        />
        <ProfileField
          disabled={isDisabled}
          label="Username"
          maxLength={20}
          minLength={3}
          name="username"
          onChange={setUsername}
          placeholder="domino_king"
          value={username}
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-xs font-black uppercase tracking-[0.16em] text-[#f9bd22]">
          Pixel Art avatar
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {avatarPresets.map((preset) => (
            <button
              aria-pressed={avatarUrl === preset.url}
              className={
                avatarUrl === preset.url
                  ? 'rounded-xl border border-[#fbbf24] bg-[#3a3429] p-3 text-left shadow-gold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbbf24]'
                  : 'rounded-xl border border-[#4f4633] bg-[#2f291f] p-3 text-left transition hover:border-[#6bd8cb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bd8cb]'
              }
              disabled={isDisabled}
              key={preset.id}
              onClick={() => setAvatarUrl(preset.url)}
              type="button"
            >
              <span className="mx-auto block size-14 overflow-hidden rounded-xl border border-[#4f4633] bg-[#17130a]">
                <img
                  alt={`${preset.label} avatar`}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  src={preset.url}
                />
              </span>
              <span className="mt-2 block text-center text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#ece1d1]">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {error ? <AlertCard message={error} tone="error" /> : null}
      {success ? <AlertCard message={success} tone="success" /> : null}

      <button
        className={buttonClasses({ className: 'gap-2' })}
        disabled={isDisabled}
        type="submit"
      >
        <Save aria-hidden="true" size={18} />
        {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}

function ProfileField({
  disabled,
  label,
  maxLength,
  minLength,
  name,
  onChange,
  placeholder,
  value,
}: {
  disabled: boolean
  label: string
  maxLength: number
  minLength: number
  name: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="grid gap-2 text-left">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#f9bd22]">
        {label}
      </span>
      <input
        autoComplete={name === 'username' ? 'username' : 'name'}
        className="min-h-12 rounded-lg border border-[#4f4633] bg-[#17130a] px-4 py-3 text-base font-bold text-[#ece1d1] outline-none transition placeholder:text-[#9c8f79] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/30 disabled:opacity-55"
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function StatsPreviewCard() {
  return (
    <div className={`${panelClass} p-4`}>
      <h2 className="mb-4 font-serif text-2xl font-black text-[#ece1d1]">
        Career Stats
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <StatTile label="Win Rate" value="Soon" tone="gold" />
        <StatTile label="Games Played" value="Soon" />
        <StatTile label="Best Streak" value="Soon" tone="gold" />
        <StatTile label="Avg Points" value="Soon" tone="teal" />
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone = 'cream',
}: {
  label: string
  value: string
  tone?: 'cream' | 'gold' | 'teal'
}) {
  const valueClass =
    tone === 'gold'
      ? 'text-[#f9bd22]'
      : tone === 'teal'
        ? 'text-[#30d8fd]'
        : 'text-[#ece1d1]'

  return (
    <div className="flex min-h-28 flex-col items-center justify-center rounded-lg bg-[#2f291f] p-4 text-center">
      <span className={`text-3xl font-black leading-none ${valueClass}`}>
        {value}
      </span>
      <span className="mt-2 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#d3c5ac]">
        {label}
      </span>
    </div>
  )
}

function TrophyCard({
  description,
  icon,
  label,
  tone,
}: {
  description: string
  icon: ReactNode
  label: string
  tone: 'gold' | 'teal'
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-[#4f4633] bg-[#3a3429] p-4 text-center">
      <span className={tone === 'gold' ? 'text-[#f9bd22]' : 'text-[#29a195]'}>
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-[#ece1d1]">
        {label}
      </h3>
      <p className="mt-2 text-xs leading-5 text-[#d3c5ac]">{description}</p>
    </div>
  )
}

function MatchPreview({
  label,
  result,
  status,
  tone,
}: {
  label: string
  result: string
  status: string
  tone: 'gold' | 'teal'
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg p-2 transition hover:bg-[#2f291f]">
      <div className="flex items-center gap-4">
        <div
          className={
            tone === 'teal'
              ? 'h-10 w-2 rounded-full bg-[#29a195]'
              : 'h-10 w-2 rounded-full bg-[#f9bd22]'
          }
        />
        <div>
          <h3 className="text-sm font-black text-[#ece1d1]">{label}</h3>
          <p className="text-xs text-[#d3c5ac]">{result}</p>
        </div>
      </div>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#b6edff]">
        {status}
      </span>
    </div>
  )
}

function AccountDetailsCard({
  accountCreatedAt,
  avatarLabel,
  email,
}: {
  accountCreatedAt: string
  avatarLabel: string
  email: string
}) {
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6bd8cb]">
        Account details
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-2">
        <ProfileRow icon={<Mail size={17} />} label="Email" value={email} />
        <ProfileRow icon={<CalendarDays size={17} />} label="Joined" value={accountCreatedAt} />
        <ProfileRow icon={<UserRound size={17} />} label="Avatar" value={avatarLabel} />
        <ProfileRow
          icon={<ShieldCheck size={17} />}
          label="Build"
          value={`${appInfo.appName} ${appInfo.appVersion} (${appInfo.buildMode})`}
        />
      </dl>
    </div>
  )
}

function SupportCard({
  onLogoutError,
}: {
  onLogoutError: (message: string) => void
}) {
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6bd8cb]">
        Private beta support
      </p>
      <h2 className="mt-2 text-xl font-black text-[#ece1d1]">
        Help us make the table smoother.
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#d3c5ac]">
        Report bugs with your device, browser, page URL, steps, what you
        expected, and a screenshot. Never include passwords or hidden hand tile
        details.
      </p>
      <div className="mt-5 grid gap-3">
        <BetaFeedbackLink
          className="w-full"
          label="Send feedback"
          source="Profile beta support"
        />
        <LogoutButton className="w-full gap-2" onError={onLogoutError} />
      </div>
    </div>
  )
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-[#4f4633] bg-[#201b11] px-4 py-3">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f9bd22]">
        <span className="text-[#6bd8cb]">{icon}</span>
        {label}
      </dt>
      <dd className="col-start-2 break-words text-sm font-bold text-[#ece1d1]">
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
  icon: ReactNode
  label: string
  tone: 'gold' | 'teal'
}) {
  return (
    <span
      className={
        tone === 'teal'
          ? 'inline-flex items-center gap-2 rounded-full border border-[#6bd8cb]/35 bg-[#29a195]/16 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#89f5e7]'
          : 'inline-flex items-center gap-2 rounded-full border border-[#f9bd22]/35 bg-[#f9bd22]/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#ffdf9f]'
      }
    >
      {icon}
      {label}
    </span>
  )
}

function AlertCard({
  message,
  tone,
}: {
  message: string
  tone: 'error' | 'success'
}) {
  return (
    <div
      className={
        tone === 'success'
          ? 'rounded-xl border border-[#6bd8cb]/30 bg-[#29a195]/12 px-4 py-3 text-sm font-bold leading-6 text-[#89f5e7]'
          : 'rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/28 px-4 py-3 text-sm font-bold leading-6 text-[#ffdad6]'
      }
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {tone === 'success' ? <Sparkles aria-hidden="true" className="mr-2 inline" size={16} /> : null}
      {message}
    </div>
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
