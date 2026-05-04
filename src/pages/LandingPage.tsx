import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import {
  Crown,
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
import { buttonClasses } from '../components/common/buttonStyles'
import { MobileShell } from '../components/layout/MobileShell'
import { GameCard } from '../components/ui/GameCard'
import { StatusChip } from '../components/ui/StatusChip'
import { useAuth } from '../features/auth/useAuth'

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const primaryCta = isAuthenticated
    ? { label: 'Enter Lobby', to: '/lobby' }
    : { label: 'Play Now', to: '/signup' }

  return (
    <MobileShell className="max-w-7xl">
      <section className="flex flex-1 flex-col gap-8 py-4">
        <header className="flex items-center justify-between gap-4">
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
          <StatusChip className="hidden border-teal-300/35 bg-teal-300/12 text-teal-100 sm:inline-flex" tone="felt">
            Private beta live
          </StatusChip>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-gold-300/20 bg-[radial-gradient(circle_at_24%_0%,rgba(69,221,189,0.2),transparent_18rem),linear-gradient(135deg,rgba(6,31,24,0.88),rgba(23,19,4,0.94)_62%,rgba(42,22,10,0.92))] p-5 shadow-[0_36px_110px_rgba(17,7,2,0.55)] md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(110deg,transparent_0_34%,rgba(255,244,214,0.12)_36%,transparent_42%),linear-gradient(70deg,transparent_0_66%,rgba(69,221,189,0.1)_68%,transparent_74%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
            <div className="grid gap-6">
              <StatusChip className="w-fit border-teal-300/35 bg-teal-300/12 text-teal-100" tone="felt">
                Cutthroat 4 live now
              </StatusChip>
              <div>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-cream-50 md:text-7xl">
                  Experience the thrill of online domino gaming
                </h1>
                <p className="mt-5 max-w-2xl border-l-4 border-gold-300 pl-4 text-lg leading-8 text-cream-100/80">
                  Pull up a seat, talk your talk, and play Caribbean-style
                  dominoes with real people.
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
      </section>
    </MobileShell>
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
    <div className="flex items-center gap-2 rounded-2xl border border-cream-100/10 bg-green-950/42 px-3 py-3 text-sm font-black text-cream-100/82">
      <span className="text-teal-300">{icon}</span>
      {label}
    </div>
  )
}

function LiveTablePreview() {
  return (
    <GameCard className="relative overflow-hidden border-wood-800/80 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.45)]" variant="wood">
      <div className="absolute right-3 top-3 rounded-full border border-gold-300/35 bg-gold-300 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-green-950">
        Live match
      </div>
      <div className="mb-4 flex items-center gap-2 text-gold-200">
        <Table2 aria-hidden="true" size={20} />
        <p className="font-black">Featured Table</p>
      </div>
      <div className="relative min-h-72 overflow-hidden rounded-3xl border border-gold-300/18 bg-[radial-gradient(circle_at_50%_42%,rgba(31,138,91,0.35),transparent_12rem),linear-gradient(145deg,#146B4A,#061F18)] shadow-[inset_0_0_70px_rgba(0,0,0,0.48)]">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-10, -8, -10] }}
          className="absolute left-[22%] top-[28%] h-28 w-14 rounded-lg border border-cream-900/15 bg-cream-50 p-2 shadow-wood"
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="grid h-full grid-rows-2 gap-2">
            <DominoHalf pips={6} />
            <DominoHalf pips={4} />
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, 7, 0], rotate: [12, 10, 12] }}
          className="absolute right-[20%] top-[42%] h-28 w-14 rounded-lg border-2 border-gold-300 bg-cream-50 p-2 shadow-[0_0_22px_rgba(242,193,78,0.36),0_18px_40px_rgba(0,0,0,0.35)]"
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="grid h-full grid-rows-2 gap-2">
            <DominoHalf pips={2} />
            <DominoHalf pips={6} />
          </div>
        </motion.div>
        <div className="absolute inset-x-6 bottom-5 rounded-2xl border border-cream-100/10 bg-green-950/72 px-4 py-3 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-300">
            Game in progress
          </p>
          <p className="mt-1 text-sm font-bold text-cream-100/78">
            Cutthroat 4 • Points to Win: 6
          </p>
        </div>
      </div>
    </GameCard>
  )
}

function DominoHalf({ pips }: { pips: number }) {
  const positions = [
    'place-self-start',
    'place-self-center',
    'place-self-end',
    'place-self-start self-end',
    'place-self-end self-start',
    'place-self-end self-end',
  ]

  return (
    <div className="grid border-b border-green-950/20 pb-2 last:border-b-0 last:pb-0">
      <div className="grid h-full grid-cols-3 grid-rows-3">
        {Array.from({ length: pips }).map((_, index) => (
          <span
            className={`size-2 rounded-full bg-green-950 ${positions[index]}`}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}
