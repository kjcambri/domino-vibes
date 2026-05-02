import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../common/Button'
import { signOut } from '../../features/auth/authService'
import { getFriendlyAuthError } from '../../lib/errors'

type LogoutButtonProps = {
  className?: string
  onError?: (message: string) => void
}

export function LogoutButton({ className, onError }: LogoutButtonProps) {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    onError?.('')

    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (caughtError) {
      onError?.(getFriendlyAuthError(caughtError))
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      className={className}
      disabled={isLoggingOut}
      onClick={handleLogout}
      variant="danger"
    >
      <LogOut aria-hidden="true" size={18} />
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </Button>
  )
}
