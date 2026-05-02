import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '../common/Card'
import { MobileShell } from '../layout/MobileShell'
import { useAuth } from '../../features/auth/useAuth'
import { useProfile } from '../../features/profiles/useProfile'

type PublicOnlyRouteProps = {
  children: ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasProfile, isProfileLoading } = useProfile()

  if (isLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <MobileShell>
        <div className="grid flex-1 place-items-center">
          <Card className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-200">
              Loading
            </p>
            <p className="mt-3 text-cream-100/75">Opening your table path.</p>
          </Card>
        </div>
      </MobileShell>
    )
  }

  if (isAuthenticated) {
    return <Navigate replace to={hasProfile ? '/lobby' : '/profile/setup'} />
  }

  return children
}
