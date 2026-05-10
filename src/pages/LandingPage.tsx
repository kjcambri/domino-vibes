import { type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Diamond,
  Eye,
  Home,
  LogIn,
  MessageCircle,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Table2,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BetaFeedbackLink } from '../components/beta/BetaFeedbackLink'
import { buttonClasses } from '../components/common/buttonStyles'
import { DominoImageTile } from '../components/game/DominoImageTile'
import { MiniBoardPreview } from '../components/game/MiniBoardPreview'
import { StatusChip } from '../components/ui/StatusChip'
import { useAuth } from '../features/auth/useAuth'
import { noLiveMatchFallback } from '../features/home/livePreviewFallback'
import {
  getLandingPrimaryCta,
  landingBenefitCards,
  landingLiveTableLabels,
} from '../features/home/landingContent'
import { type FeaturedLiveGamePreview } from '../features/home/types'
import { useFeaturedLiveGamePreview } from '../features/home/useFeaturedLiveGamePreview'
import { appInfo } from '../lib/appInfo'
import { cn } from '../lib/cn'

const shellBackground =
  'bg-[radial-gradient(circle_at_50%_-10%,rgba(251,191,36,0.12),transparent_28rem),radial-gradient(circle_at_12%_16%,rgba(107,216,203,0.12),transparent_24rem),linear-gradient(180deg,#17130a_0%,#120e06_46%,#17130a_100%)]'

const rimPanelClass =
  'relative overflow-hidden rounded-2xl border border-gold-300/24 bg-[linear-gradient(180deg,rgba(58,52,41,0.96),rgba(47,41,31,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,225,167,0.12)]'

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const primaryCta = getLandingPrimaryCta(isAuthenticated)

  return (
    <div
      className={cn(
        'min-h-svh overflow-x-hidden pb-28 text-cream-50 antialiased lg:pb-0',
        shellBackground,
      )}
      id="top"
    >
      <LandingHeader isAuthenticated={isAuthenticated} primaryCta={primaryCta} />
      <main className="pt-16">
        <HeroSection isAuthenticated={isAuthenticated} primaryCta={primaryCta} />
        <LiveTablesSection />
        <ClubExperienceSection />
        <FeedbackSection />
        <FinalCtaSection primaryCta={primaryCta} />
      </main>
      <LandingFooter />
      <MobileBottomNav />
    </div>
  )
}

function LandingHeader({
  isAuthenticated,
  primaryCta,
}: {
  isAuthenticated: boolean
  primaryCta: { label: string; to: string }
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cream-100/12 bg-[#2f291f]/96 shadow-[0_12px_34px_rgba(0,0,0,0.3)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link aria-label="Domino Vibes home" className="min-w-0" to="/">
          <span className="block truncate font-serif text-xl font-black leading-none tracking-tight text-gold-300 sm:text-3xl">
            Domino Vibes
          </span>
        </Link>

        <nav
          aria-label="Landing navigation"
          className="hidden items-center gap-5 md:flex"
        >
          <LandingNavLink href="#top" icon={<Home size={18} />} label="Home" />
          <LandingNavLink
            active
            href="#live-tables"
            icon={<Play size={18} />}
            label="Play"
          />
          <LandingNavLink
            href="#club-experience"
            icon={<UsersRound size={18} />}
            label="Clubs"
          />
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {!isAuthenticated ? (
            <Link
              className="hidden text-sm font-black text-gold-200 transition hover:text-cream-50 md:inline"
              to="/login"
            >
              Log In
            </Link>
          ) : null}
          <Link
            className={buttonClasses({
              className: 'hidden min-h-10 rounded-full px-5 py-2 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.22)] sm:inline-flex',
            })}
            to={primaryCta.to}
          >
            {primaryCta.label}
          </Link>
        </div>
      </div>
    </header>
  )
}

function LandingNavLink({
  active = false,
  href,
  icon,
  label,
}: {
  active?: boolean
  href: string
  icon: ReactNode
  label: string
}) {
  return (
    <a
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition',
        active
          ? 'border-b-2 border-gold-300 text-gold-200'
          : 'text-cream-100/70 hover:bg-cream-100/8 hover:text-cream-50',
      )}
      href={href}
    >
      {icon}
      {label}
    </a>
  )
}

function HeroSection({
  isAuthenticated,
  primaryCta,
}: {
  isAuthenticated: boolean
  primaryCta: { label: string; to: string }
}) {
  return (
    <section className="relative flex min-h-[calc(100svh-13rem)] items-center overflow-hidden border-b border-cream-100/12 px-4 py-10 sm:min-h-[calc(100svh-12rem)] sm:px-6 sm:py-16 lg:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_36%,rgba(251,191,36,0.16),transparent_19rem),radial-gradient(circle_at_28%_28%,rgba(107,216,203,0.1),transparent_21rem),repeating-linear-gradient(90deg,rgba(255,225,167,0.035)_0_1px,transparent_1px_24px),linear-gradient(140deg,#3a2414_0%,#201b11_38%,#120e06_70%,#17130a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,14,6,0.16)_0%,rgba(18,14,6,0.7)_74%,#17130a_100%)]" />
      <div className="pointer-events-none absolute -bottom-20 right-[6%] hidden rotate-12 opacity-90 drop-shadow-[0_28px_38px_rgba(0,0,0,0.52)] lg:block">
        <DominoImageTile orientation="vertical" size="large" tileId="6-6" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center text-center">
        <div className={cn('mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 sm:mb-6', rimPanelClass)}>
          <span className="size-2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(69,221,189,0.9)]" />
          <span className="text-xs font-black text-cream-100/76 sm:text-sm">
            Cutthroat 4 tables open for beta
          </span>
        </div>

        <h1 className="max-w-5xl break-words font-serif text-3xl font-black leading-[1.08] text-gold-100 drop-shadow-[0_10px_30px_rgba(0,0,0,0.46)] sm:text-6xl lg:text-7xl">
          The Caribbean&apos;s Premier
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Domino Social Club
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-cream-100/74 sm:mt-6 sm:text-lg sm:leading-8">
          Experience the tactile thrill of a real domino table. Connect with
          players, claim your seat, and play in a beautifully crafted social
          club built for serious table talk.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            className={buttonClasses({
              className: 'rounded-full px-7 py-3.5 text-sm shadow-[inset_0_-2px_4px_rgba(0,0,0,0.22),0_8px_24px_rgba(251,191,36,0.2)] sm:px-8 sm:py-4 sm:text-base',
            })}
            to={primaryCta.to}
          >
            {isAuthenticated ? (
              <Sparkles aria-hidden="true" size={19} />
            ) : (
              <UserPlus aria-hidden="true" size={19} />
            )}
            {primaryCta.label}
          </Link>
          <a
            className={buttonClasses({
              variant: 'secondary',
              className: 'rounded-full px-7 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base',
            })}
            href="#live-tables"
          >
            <Eye aria-hidden="true" size={19} />
            Watch Live Matches
          </a>
          {!isAuthenticated ? (
            <Link
              className={buttonClasses({
                variant: 'ghost',
                className: 'rounded-full px-7 py-3.5 text-sm text-gold-100 sm:px-8 sm:py-4 sm:text-base',
              })}
              to="/login"
            >
              <LogIn aria-hidden="true" size={19} />
              Log In
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function LiveTablesSection() {
  return (
    <section
      className="scroll-mt-20 px-4 pb-20 pt-10 sm:px-6 lg:pb-24 lg:pt-12"
      id="live-tables"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-serif text-4xl font-black text-gold-100">
              Live Tables
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-cream-100/66">
              Spectate active Cutthroat 4 tables, study the board, and find your
              next seat when the lobby opens.
            </p>
          </div>
          <Link
            className="hidden items-center gap-2 text-sm font-black text-gold-200 transition hover:text-cream-50 sm:flex"
            to="/lobby"
          >
            {landingLiveTableLabels.viewAll}
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeaturedLiveTableBento />
          <div className="grid gap-6">
            <SmallLiveTableCard
              icon={<Table2 size={22} />}
              label="Public tables"
              status="Open beta"
              title="Cutthroat 4 Lobby"
            />
            <SmallLiveTableCard
              icon={<MessageCircle size={22} />}
              label="Social play"
              status="Table chat"
              title="Casual Veranda"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedLiveTableBento() {
  const { data: preview, isError, isLoading } = useFeaturedLiveGamePreview()

  return (
    <div className={cn('min-h-[420px] p-5 md:col-span-2 md:p-6', rimPanelClass)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(31,138,91,0.34),transparent_18rem),linear-gradient(145deg,#146B4A,#061F18)] shadow-[inset_0_0_90px_rgba(0,0,0,0.56)]" />
      <div className="relative z-10 flex min-h-[380px] flex-col justify-between gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <StatusChip
            className={cn(
              'border px-3 py-1',
              preview
                ? 'border-red-300/45 bg-red-800 text-red-100'
                : 'border-gold-300/35 bg-gold-300 text-green-950',
            )}
            tone={preview ? 'cream' : 'gold'}
          >
            <span className="mr-2 inline-block size-1.5 rounded-full bg-current" />
            {preview ? landingLiveTableLabels.liveMatch : noLiveMatchFallback.badge}
          </StatusChip>
          <span className="rounded-full border border-cream-100/12 bg-green-950/72 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-cream-100/78 backdrop-blur">
            {landingLiveTableLabels.spectatorPreview}
          </span>
        </div>

        {preview ? (
          <LivePreviewCard preview={preview} />
        ) : (
          <FallbackFeaturedTablePreview isError={isError} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}

function LivePreviewCard({ preview }: { preview: FeaturedLiveGamePreview }) {
  const openEnds = preview.boardState.openEnds

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">
            {landingLiveTableLabels.featured}
          </p>
          <h3 className="mt-2 font-serif text-3xl font-black text-cream-50">
            {preview.tableName}
          </h3>
          <p className="mt-2 text-sm font-bold text-cream-100/72">
            {getGameModeLabel(preview.gameMode)} · Points to Win: {preview.pointsToWin}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PreviewMetric label="Round" value={preview.currentRoundNumber} />
          <PreviewMetric label="Moves" value={preview.moveCount} />
          <PreviewMetric label="In play" value={preview.dominoesInPlay} />
          <PreviewMetric
            label="Open ends"
            value={
              openEnds.left === null && openEnds.right === null
                ? 'Start'
                : `${openEnds.left ?? '-'} / ${openEnds.right ?? '-'}`
            }
          />
        </div>
      </div>
      <MiniBoardPreview
        boardState={preview.boardState}
        className="min-h-64 rounded-2xl border-cream-100/12"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {preview.players.map((player) => (
          <div
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border px-3 py-2',
              player.isCurrentTurn
                ? 'border-teal-300/45 bg-teal-300/14 shadow-[0_0_18px_rgba(69,221,189,0.18)]'
                : 'border-cream-100/10 bg-green-950/54',
            )}
            key={player.seatNumber}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-cream-50">
                Seat {player.seatNumber} · {player.displayName}
              </p>
              <p className="text-xs font-bold text-cream-100/62">
                {player.handCount} tiles
                {player.isCurrentTurn ? ' · at the table' : ''}
              </p>
            </div>
            <span className="rounded-full border border-gold-300/22 bg-gold-300/12 px-2.5 py-1 text-xs font-black text-gold-100">
              {player.score} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FallbackFeaturedTablePreview({
  isError,
  isLoading,
}: {
  isError: boolean
  isLoading: boolean
}) {
  return (
    <div className="relative grid min-h-[310px] place-items-center overflow-hidden rounded-2xl border border-cream-100/10 bg-green-950/42 p-5 shadow-[inset_0_0_70px_rgba(0,0,0,0.42)]">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute left-[17%] top-[16%] -rotate-12">
          <DominoImageTile
            orientation="vertical"
            size="medium"
            tileId={noLiveMatchFallback.dominoTileIds[0]}
          />
        </div>
        <div className="absolute right-[16%] top-[28%] rotate-12">
          <DominoImageTile
            orientation="vertical"
            size="medium"
            tileId={noLiveMatchFallback.dominoTileIds[1]}
          />
        </div>
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 rotate-90">
          <DominoImageTile
            orientation="vertical"
            size="medium"
            tileId={noLiveMatchFallback.dominoTileIds[2]}
          />
        </div>
        <div className="absolute inset-x-12 top-[28%] h-28 rounded-full bg-gold-300/10 blur-2xl" />
      </div>
      <div className="relative z-10 mt-auto w-full max-w-xl rounded-2xl border border-cream-100/12 bg-green-950/82 px-5 py-4 text-center shadow-[0_18px_42px_rgba(0,0,0,0.32)] backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
          {isLoading ? 'Checking live tables' : noLiveMatchFallback.label}
        </p>
        <p className="mt-2 text-xl font-black text-cream-50">
          {isError
            ? 'Live preview is unavailable right now.'
            : noLiveMatchFallback.title}
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-cream-100/74">
          {isError
            ? 'The lobby is still open for Cutthroat 4.'
            : noLiveMatchFallback.body}
        </p>
      </div>
    </div>
  )
}

function SmallLiveTableCard({
  icon,
  label,
  status,
  title,
}: {
  icon: ReactNode
  label: string
  status: string
  title: string
}) {
  return (
    <div className="flex min-h-48 flex-col justify-between rounded-2xl border border-cream-100/12 bg-[#2f291f]/88 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.24)] transition hover:border-gold-300/32 hover:bg-[#3a3429]/88">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-gold-200">
            {label}
          </p>
          <h3 className="mt-2 text-lg font-black text-cream-50">{title}</h3>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-teal-300/25 bg-teal-300/12 text-teal-100">
          {icon}
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 text-cream-100/70">
        <div className="flex -space-x-3">
          <AvatarDot />
          <AvatarDot />
          <AvatarDot muted />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.12em]">
          {status}
        </span>
      </div>
    </div>
  )
}

function AvatarDot({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={cn(
        'size-9 rounded-full border border-gold-300/20 shadow-[0_8px_18px_rgba(0,0,0,0.24)]',
        muted
          ? 'bg-[#241f15]/60'
          : 'bg-[radial-gradient(circle_at_35%_25%,#fff7e4,#f5d16f_32%,#6b3f1d_74%)]',
      )}
    />
  )
}

function ClubExperienceSection() {
  const icons = [
    <Palette aria-hidden="true" size={31} />,
    <ShieldCheck aria-hidden="true" size={31} />,
    <BarChart3 aria-hidden="true" size={31} />,
  ]

  return (
    <section
      className="scroll-mt-20 border-y border-cream-100/12 bg-[#201b11]/78 px-4 py-20 sm:px-6 lg:py-24"
      id="club-experience"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="font-serif text-4xl font-black text-gold-100">
            The Club Experience
          </h2>
          <p className="mt-4 text-lg leading-8 text-cream-100/68">
            Future premium touches should elevate comfort, identity, and memory
            without changing the fairness of the table.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {landingBenefitCards.map((card, index) => (
            <div
              className={cn('p-8 text-center', rimPanelClass)}
              key={card.title}
            >
              <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full border border-cream-100/12 bg-[#2f291f] text-gold-200 shadow-[0_12px_28px_rgba(0,0,0,0.26)]">
                {icons[index]}
              </div>
              <h3 className="text-2xl font-black text-cream-50">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-cream-100/68">
                {card.copy}
              </p>
              <StatusChip className="mt-5" tone="gold">
                {card.status}
              </StatusChip>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeedbackSection() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 rounded-2xl border border-teal-300/18 bg-green-950/46 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">
              Private beta feedback
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cream-100/70">
              Found a layout, auth, chat, table, or game issue? Send browser,
              device, URL, steps, and a screenshot. Keep passwords and hidden
              hand data out of reports.
            </p>
          </div>
          <BetaFeedbackLink
            className="w-full rounded-full sm:w-auto"
            label="Send beta feedback"
            source="Landing beta guidance"
          />
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection({
  primaryCta,
}: {
  primaryCta: { label: string; to: string }
}) {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center sm:px-6 lg:py-32">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-gold-300/50 to-transparent" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="font-serif text-5xl font-black leading-tight text-gold-100">
          Take Your Seat at the Table
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-cream-100/68">
          Whether on desktop, tablet, or mobile, the club is open for beta
          matches, live table talk, and honest Cutthroat 4 competition.
        </p>
        <Link
          className={buttonClasses({
            className: 'mt-9 rounded-full px-10 py-5 text-lg shadow-[inset_0_-2px_4px_rgba(0,0,0,0.22),0_8px_24px_rgba(251,191,36,0.18)]',
          })}
          to={primaryCta.to}
        >
          <Diamond aria-hidden="true" size={21} />
          {primaryCta.label === 'Join the Club' ? 'Create Free Account' : primaryCta.label}
        </Link>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-cream-100/10 px-4 py-6 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cream-100/38 sm:px-6">
      {appInfo.appName} beta · {appInfo.appVersion} · {appInfo.buildMode}
    </footer>
  )
}

function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile landing navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 gap-1 rounded-t-xl border-t border-cream-100/12 bg-[#3a3429]/96 px-3 pb-4 pt-2 shadow-[0_-16px_38px_rgba(0,0,0,0.36)] backdrop-blur lg:hidden"
    >
      <MobileNavItem href="#top" icon={<Home size={22} />} label="Home" />
      <MobileNavItem active href="#live-tables" icon={<Play size={22} />} label="Play" />
      <MobileNavItem href="#live-tables" icon={<Eye size={22} />} label="Watch" />
      <MobileNavItem
        href="#club-experience"
        icon={<UsersRound size={22} />}
        label="Clubs"
      />
    </nav>
  )
}

function MobileNavItem({
  active = false,
  href,
  icon,
  label,
}: {
  active?: boolean
  href: string
  icon: ReactNode
  label: string
}) {
  return (
    <a
      className={cn(
        'flex min-w-0 flex-col items-center justify-center rounded-xl p-2 text-xs font-bold transition',
        active
          ? 'bg-gold-300 text-wood-900 shadow-gold'
          : 'text-cream-100/70 hover:bg-cream-100/8 hover:text-cream-50',
      )}
      href={href}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </a>
  )
}

function PreviewMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-cream-100/10 bg-green-950/70 px-3 py-2">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-teal-300">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-cream-50">{value}</p>
    </div>
  )
}

function getGameModeLabel(gameMode: FeaturedLiveGamePreview['gameMode']) {
  if (gameMode === 'cutthroat_4') {
    return 'Cutthroat 4'
  }

  return gameMode
}
