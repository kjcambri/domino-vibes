import { motion } from 'framer-motion'
import { Crown, LogIn, Sparkles, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { StatusBadge } from '../components/common/StatusBadge'
import { buttonClasses } from '../components/common/buttonStyles'
import { MobileShell } from '../components/layout/MobileShell'

export function LandingPage() {
  return (
    <MobileShell>
      <section className="flex flex-1 flex-col gap-7 py-4">
        <header className="flex items-center justify-between">
          <Link
            aria-label="Domino Vibes home"
            className="flex items-center gap-3"
            to="/"
          >
            <span className="grid size-11 place-items-center rounded-lg border border-gold-300/30 bg-gold-300/15 text-gold-100 shadow-gold">
              <Crown aria-hidden="true" size={21} />
            </span>
            <span>
              <span className="block text-lg font-black leading-none text-cream-50">
                Domino Vibes
              </span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-gold-200">
                Caribbean tables
              </span>
            </span>
          </Link>
          <StatusBadge status="waiting" />
        </header>

        <div className="relative grid flex-1 place-items-center py-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            className="relative h-72 w-full"
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-x-5 bottom-3 h-28 rounded-[50%] bg-wood-900/70 blur-xl" />
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-300/20 bg-felt-700 shadow-wood" />
            <div className="absolute left-[21%] top-[20%] h-36 w-20 rotate-[-18deg] rounded-lg border border-cream-900/15 bg-cream-50 p-3 shadow-wood">
              <div className="grid h-full grid-rows-2 gap-2">
                <DominoHalf pips={3} />
                <DominoHalf pips={5} />
              </div>
            </div>
            <div className="absolute right-[18%] top-[35%] h-36 w-20 rotate-[16deg] rounded-lg border border-cream-900/15 bg-cream-50 p-3 shadow-wood">
              <div className="grid h-full grid-rows-2 gap-2">
                <DominoHalf pips={6} />
                <DominoHalf pips={1} />
              </div>
            </div>
            <div className="absolute left-[39%] top-[8%] grid size-14 place-items-center rounded-full border border-gold-300/35 bg-gold-300/20 text-gold-100 shadow-gold">
              <Sparkles aria-hidden="true" size={23} />
            </div>
          </motion.div>
        </div>

        <Card className="bg-green-950/45">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            Sprint 1 foundation
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[1.02] text-cream-50">
            Online dominoes with island-table energy.
          </h1>
          <p className="mt-4 text-base leading-7 text-cream-100/80">
            A mobile-first multiplayer home for Caribbean and Latino dominoes.
            Accounts, lobbies, tables, and live gameplay arrive in later
            sprints.
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              className={buttonClasses({ className: 'gap-2' })}
              to="/signup"
            >
              <UserPlus aria-hidden="true" size={18} />
              Create Account
            </Link>
            <Link
              className={buttonClasses({
                variant: 'secondary',
                className: 'gap-2',
              })}
              to="/login"
            >
              <LogIn aria-hidden="true" size={18} />
              Log In
            </Link>
          </div>
        </Card>
      </section>
    </MobileShell>
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
