import { Bug } from 'lucide-react'
import { buttonClasses, type ButtonVariant } from '../common/buttonStyles'
import { createBetaFeedbackMailto } from '../../features/beta/feedback'

type BetaFeedbackLinkProps = {
  className?: string
  label?: string
  source?: string
  variant?: ButtonVariant
}

export function BetaFeedbackLink({
  className,
  label = 'Report a bug',
  source = 'Domino Vibes beta',
  variant = 'secondary',
}: BetaFeedbackLinkProps) {
  const pageUrl =
    typeof window === 'undefined' ? undefined : window.location.href

  return (
    <a
      className={buttonClasses({ className: `gap-2 ${className ?? ''}`, variant })}
      href={createBetaFeedbackMailto({ pageUrl, source })}
    >
      <Bug aria-hidden="true" size={18} />
      {label}
    </a>
  )
}
