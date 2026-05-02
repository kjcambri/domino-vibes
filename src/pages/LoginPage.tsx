import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/common/buttonStyles'
import { PageScaffold } from './PageScaffold'

export function LoginPage() {
  return (
    <PageScaffold
      description="Authentication screens and Supabase auth wiring will be added in a later sprint. This route exists so navigation and product flow can be shaped early."
      eyebrow="Auth placeholder"
      title="Log in is coming soon."
    >
      <Link className={buttonClasses({ variant: 'secondary' })} to="/signup">
        Create account instead
      </Link>
    </PageScaffold>
  )
}
