import { type ReactNode } from 'react'
import {
  Crown,
  Gem,
  LogIn,
  MessageCircle,
  RotateCcw,
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
import { MobileShell } from '../components/layout/MobileShell'
import { GameCard } from '../components/ui/GameCard'
import { StatusChip } from '../components/ui/StatusChip'
import { useAuth } from '../features/auth/useAuth'
import { noLiveMatchFallback } from '../features/home/livePreviewFallback'
import { type FeaturedLiveGamePreview } from '../features/home/types'
import { useFeaturedLiveGamePreview } from '../features/home/useFeaturedLiveGamePreview'

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const primaryCta = isAuthenticated
    ? { label: 'Enter Lobby', to: '/lobby' }
    : { label: 'Play Now', to: '/signup' }

  return (
    <MobileShell className="max-w-7xl">
      <section className="flex flex-1 flex-col gap-8 py-4">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-gold-300/14 bg-wood-900/42 px-3 py-3 shadow-wood backdrop-blur">
          <Link
            aria-label="Domino Vibes home"
            className="flex items-center gap-3"
            to="/"
          >
            <span className="grid size-12 place-items-center rounded-2xl border border-gold-300/35 bg-gold-300/15 text-gold-100 shadow-gold">
              <Crown aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-xl font-black uppercase leading-none tracking-[0.14em] text-gold-200">
                Domino Vibes
              </span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
                Island elite social club
              </span>
            </span>
          </Link>
          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-2 text-sm font-black text-cream-100/78 md:flex"
          >
            <span className="rounded-xl bg-gold-300/12 px-3 py-2 text-gold-100">
              Play
            </span>
            <span className="rounded-xl px-3 py-2">Live Tables</span>
            <span className="rounded-xl px-3 py-2 text-cream-100/55">
              Coming Soon
            </span>
          </nav>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-gold-300/22 bg-[radial-gradient(circle_at_24%_0%,rgba(107,216,203,0.18),transparent_18rem),radial-gradient(circle_at_76%_68%,rgba(249,189,34,0.14),transparent_18rem),repeating-linear-gradient(90deg,rgba(255,244,214,0.035)_0_1px,transparent_1px_24px),linear-gradient(135deg,rgba(23,19,10,0.96),rgba(32,27,17,0.95)_42%,rgba(6,31,24,0.9))] p-5 shadow-[0_36px_110px_rgba(17,7,2,0.55)] md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(110deg,transparent_0_34%,rgba(255,244,214,0.12)_36%,transparent_42%),linear-gradient(70deg,transparent_0_66%,rgba(69,221,189,0.1)_68%,transparent_74%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
            <div className="grid gap-6">
              <StatusChip className="w-fit border-teal-300/35 bg-teal-300/12 text-teal-100" tone="felt">
                Cutthroat 4 live now
              </StatusChip>
              <div>
                <h1 className="max-w-3xl font-serif text-5xl font-black leading-[0.98] tracking-tight text-cream-50 md:text-7xl">
                  The Caribbean&apos;s premier domino social club
                </h1>
                <p className="mt-5 max-w-2xl border-l-4 border-gold-300 pl-4 text-lg leading-8 text-cream-100/80">
                  Experience the thrill of online domino gaming. Pull up a
                  seat, talk your talk, and play Caribbean-style dominoes with
                  real people.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className={buttonClasses({
                    className: 'gap-2 sm:min-w-44',
                  })}
                  to={primaryCta.to}
                >
                  <Sparkles aria-hidden="true" size={18} />
                  {primaryCta.label}
                </Link>
                {!isAuthenticated ? (
                  <Link
                    className={buttonClasses({
                      variant: 'secondary',
                      className: 'gap-2 sm:min-w-36',
                    })}
                    to="/login"
                  >
                    <LogIn aria-hidden="true" size={18} />
                    Sign In
                  </Link>
                ) : null}
                {!isAuthenticated ? (
                  <Link
                    className={buttonClasses({
                      variant: 'ghost',
                      className: 'gap-2 text-teal-100',
                    })}
                    to="/signup"
                  >
                    <UserPlus aria-hidden="true" size={18} />
                    Create Account
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FeaturePill icon={<UsersRound size={17} />} label="Real multiplayer" />
                <FeaturePill icon={<MessageCircle size={17} />} label="Lobby and table chat" />
                <FeaturePill icon={<RotateCcw size={17} />} label="Rejoin active games" />
                <FeaturePill icon={<ShieldCheck size={17} />} label="Secure hidden hands" />
              </div>
            </div>

            <LiveTablePreview />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <GameCard className="md:col-span-2" variant="felt">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
              Learn the table
            </p>
            <h2 className="mt-3 text-2xl font-black text-cream-50">
              Built for real social dominoes, not a plain dashboard.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cream-100/72">
              Domino Vibes currently supports live Cutthroat 4, secure private
              hands, chat, rejoin flow, next rounds, and points-to-six game
              endings.
            </p>
          </GameCard>
          <GameCard className="relative overflow-hidden" variant="wood">
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-teal-300/12 blur-2xl" />
            <p className="relative text-xs font-black uppercase tracking-[0.18em] text-teal-300">
              Coming soon
            </p>
            <h2 className="relative mt-3 text-2xl font-black text-cream-50">
              Private tables
            </h2>
            <p className="relative mt-3 text-sm leading-6 text-cream-100/72">
              Future club features will stay clearly marked until playable.
            </p>
          </GameCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <GameCard variant="gold">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-100">
              Private beta
            </p>
            <h2 className="mt-3 text-2xl font-black text-cream-50">
              Help us test the real table flow.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cream-100/74">
              Start with Cutthroat 4: sign up, join a table, use chat, play a
              round, refresh and rejoin, then return to the lobby after a game.
              Please report anything that blocks a turn, hides an action, or
              feels confusing on mobile.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <BetaMission label="Play one round" />
              <BetaMission label="Check hidden hands" />
              <BetaMission label="Try mobile Safari" />
            </div>
          </GameCard>
          <GameCard className="flex flex-col justify-between gap-4" variant="felt">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">
                Found an issue?
              </p>
              <p className="mt-3 text-sm leading-6 text-cream-100/72">
                Send browser, device, URL, steps, what happened, and a
                screenshot. Do not include passwords or hidden hand data.
              </p>
            </div>
            <BetaFeedbackLink
              className="w-full"
              label="Send beta feedback"
              source="Landing beta guidance"
            />
          </GameCard>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <ComingSoonCard
            copy="Invite-only and friend tables are planned after the core public rooms finish beta hardening."
            label="Private Tables"
          />
          <ComingSoonCard
            copy="Competitive ladders will stay disabled until the rule set and anti-abuse flows are production-ready."
            label="Ranked Matches"
          />
          <ComingSoonCard
            copy="Community events can arrive later as bragging-rights competitions with clear beta guardrails."
            label="Community Tournaments"
          />
        </section>
      </section>
    </MobileShell>
  )
}

function BetaMission({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-cream-100/10 bg-green-950/35 px-3 py-3 text-sm font-black text-cream-50">
      {label}
    </div>
  )
}

function FeaturePill({
  icon,
  label,
}: {
  icon: ReactNode
  label: string
}) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-xl border border-cream-100/10 bg-green-950/42 px-3 py-3 text-sm font-black text-cream-100/82">
      <span className="text-teal-300">{icon}</span>
      {label}
    </div>
  )
}

function ComingSoonCard({ label, copy }: { label: string; copy: string }) {
  return (
    <GameCard
      aria-disabled="true"
      className="relative overflow-hidden p-4 opacity-90"
      variant="wood"
    >
      <div className="absolute -right-10 -top-10 size-24 rounded-full bg-gold-300/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
            Coming soon
          </p>
          <h2 className="mt-2 text-xl font-black text-cream-50">{label}</h2>
        </div>
        <span className="grid size-11 place-items-center rounded-xl border border-gold-300/25 bg-gold-300/10 text-gold-100">
          <Gem aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="relative mt-3 text-sm leading-6 text-cream-100/68">{copy}</p>
      <StatusChip className="relative mt-4" tone="cream">
        Preview only
      </StatusChip>
    </GameCard>
  )
}

function LiveTablePreview() {
  const { data: preview, isError, isLoading } = useFeaturedLiveGamePreview()
  const isLive = Boolean(preview)

  return (
    <GameCard className="relative overflow-hidden border-wood-800/80 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.45)]" variant="wood">
      <div
        className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${
          isLive
            ? 'border-teal-200/45 bg-teal-300 text-green-950 shadow-[0_0_18px_rgba(69,221,189,0.35)]'
            : 'border-gold-300/35 bg-gold-300 text-green-950'
        }`}
      >
        {isLive ? 'Live match' : noLiveMatchFallback.badge}
      </div>
      <div className="mb-4 flex items-center gap-2 text-gold-200">
        <Table2 aria-hidden="true" size={20} />
        <p className="font-black">Featured Table</p>
      </div>
      {preview ? (
        <LivePreviewCard preview={preview} />
      ) : (
        <FallbackFeaturedTablePreview isError={isError} isLoading={isLoading} />
      )}
    </GameCard>
  )
}

function LivePreviewCard({ preview }: { preview: FeaturedLiveGamePreview }) {
  const openEnds = preview.boardState.openEnds

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-gold-300/18 bg-green-950/44 p-4">
        <p className="text-2xl font-black text-cream-50">{preview.tableName}</p>
        <p className="mt-1 text-sm font-bold text-cream-100/74">
          {getGameModeLabel(preview.gameMode)} • Points to Win: {preview.pointsToWin}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <PreviewMetric label="Round" value={preview.currentRoundNumber} />
          <PreviewMetric label="In play" value={preview.dominoesInPlay} />
          <PreviewMetric label="Moves" value={preview.moveCount} />
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
      {preview.boardState.placements.length > 0 ? (
        <MiniBoardPreview boardState={preview.boardState} />
      ) : (
        <FallbackFeaturedTablePreview isError={false} isLoading={false} />
      )}
      <div className="grid gap-2">
        {preview.players.map((player) => (
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
              player.isCurrentTurn
                ? 'border-teal-300/45 bg-teal-300/12 shadow-[0_0_18px_rgba(69,221,189,0.18)]'
                : 'border-cream-100/10 bg-green-950/42'
            }`}
            key={player.seatNumber}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-cream-50">
                Seat {player.seatNumber} • {player.displayName}
              </p>
              <p className="text-xs font-bold text-cream-100/62">
                {player.handCount} tiles
                {player.isCurrentTurn ? ' • at the table' : ''}
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
    <div className="relative min-h-72 overflow-hidden rounded-2xl border border-gold-300/18 bg-[radial-gradient(circle_at_50%_42%,rgba(31,138,91,0.35),transparent_12rem),linear-gradient(145deg,#146B4A,#061F18)] shadow-[inset_0_0_70px_rgba(0,0,0,0.48)]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
      >
        <div className="absolute left-[18%] top-[18%] -rotate-12">
          <DominoImageTile
            orientation="vertical"
            size="medium"
            tileId={noLiveMatchFallback.dominoTileIds[0]}
          />
        </div>
        <div className="absolute right-[18%] top-[31%] rotate-12">
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
        <div className="absolute inset-x-10 top-[22%] h-28 rounded-full bg-gold-300/10 blur-2xl" />
      </div>
      <div className="absolute inset-x-6 bottom-5 rounded-2xl border border-cream-100/10 bg-green-950/78 px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.32)] backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
          {isLoading ? 'Checking live tables' : noLiveMatchFallback.label}
        </p>
        <p className="mt-1 text-base font-black text-cream-50">
          {isError
            ? 'Live preview is unavailable right now.'
            : noLiveMatchFallback.title}
        </p>
        <p className="mt-1 text-sm font-bold text-cream-100/74">
          {isError
            ? 'The lobby is still open for Cutthroat 4.'
            : noLiveMatchFallback.body}
        </p>
        {!isError ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-gold-200">
            {noLiveMatchFallback.cta}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-cream-100/10 bg-green-950/54 px-3 py-2">
      <p className="font-black uppercase tracking-[0.14em] text-teal-300">
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
