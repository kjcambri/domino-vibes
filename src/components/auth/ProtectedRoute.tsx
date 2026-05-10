import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card } from '../common/Card'
import { MobileShell } from '../layout/MobileShell'
import { useAuth } from '../../features/auth/useAuth'
import { useUserPresenceHeartbeat } from '../../features/friends/useFriendsHub'
import { useProfile } from '../../features/profiles/useProfile'

type ProtectedRouteProps = {
  children: ReactNode
  requireProfile?: boolean
}

export function ProtectedRoute({
  children,
  requireProfile = true,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const { hasProfile, isProfileLoading } = useProfile()
  useUserPresenceHeartbeat(
    isAuthenticated && hasProfile && !isLoading && !isProfileLoading,
  )

  if (isLoading || (isAuthenticated && isProfileLoading)) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (requireProfile && !hasProfile) {
    return <Navigate replace to="/profile/setup" />
  }

  if (!requireProfile && hasProfile) {
    return <Navigate replace to="/lobby" />
  }

  return children
}

function RouteLoading() {
  return (
    <MobileShell>
      <div className="grid flex-1 place-items-center">
        <Card className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-200">
            Loading
          </p>
          <p className="mt-3 text-cream-100/75">
            Checking your Domino Vibes session.
          </p>
        </Card>
      </div>
    </MobileShell>
  )
}
