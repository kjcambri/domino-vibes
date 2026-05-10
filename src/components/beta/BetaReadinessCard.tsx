import { CheckCircle2, ClipboardCheck, Smartphone } from 'lucide-react'
import { GameCard } from '../ui/GameCard'
import { betaReadinessMissions } from '../../features/beta/readiness'
import { BetaFeedbackLink } from './BetaFeedbackLink'

type BetaReadinessCardProps = {
  className?: string
  compact?: boolean
  source?: string
}

const priorityLabel = {
  blocker: 'Must pass',
  core: 'Core flow',
  mobile: 'Mobile',
  polish: 'Polish',
} as const

export function BetaReadinessCard({
  className,
  compact = false,
  source = 'Beta readiness card',
}: BetaReadinessCardProps) {
  const missions = compact
    ? betaReadinessMissions.slice(0, 4)
    : betaReadinessMissions

  return (
    <GameCard className={className} variant="gold">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold-100/30 bg-gold-300/14 text-gold-100 shadow-gold">
          <ClipboardCheck aria-hidden="true" size={20} />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-100">
            Private beta checklist
          </p>
          <h2 className="mt-2 text-2xl font-black text-cream-50">
            One clean table test before wider invites.
          </h2>
          <p className="mt-2 text-sm leading-6 text-cream-100/74">
            Use test accounts only. Report blockers immediately, especially
            hidden-hand, turn, auth, or mobile play issues.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3">
        {missions.map((mission) => (
          <li
            className="rounded-xl border border-cream-100/10 bg-green-950/34 px-3 py-3"
            key={mission.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-black text-cream-50">
                {mission.priority === 'mobile' ? (
                  <Smartphone aria-hidden="true" className="text-teal-200" size={16} />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="text-teal-200" size={16} />
                )}
                {mission.label}
              </span>
              <span className="shrink-0 rounded-full border border-teal-300/24 bg-teal-300/10 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-teal-100">
                {priorityLabel[mission.priority]}
              </span>
            </div>
            {!compact ? (
              <p className="mt-2 text-sm leading-6 text-cream-100/66">
                {mission.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <BetaFeedbackLink
        className="mt-5 w-full"
        label="Report beta issue"
        source={source}
        variant="secondary"
      />
    </GameCard>
  )
}
