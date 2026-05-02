import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/common/buttonStyles'
import { PageScaffold } from './PageScaffold'

export function SignupPage() {
  return (
    <PageScaffold
      description="Account creation will be implemented after the app foundation is stable. No authentication calls are made in Sprint 1."
      eyebrow="Auth placeholder"
      title="Create account is reserved."
    >
      <Link className={buttonClasses({ variant: 'secondary' })} to="/login">
        Log in instead
      </Link>
    </PageScaffold>
  )
}
