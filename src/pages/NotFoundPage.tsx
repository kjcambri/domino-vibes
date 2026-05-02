import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/common/buttonStyles'
import { PageScaffold } from './PageScaffold'

export function NotFoundPage() {
  return (
    <PageScaffold
      description="That route is not part of the Sprint 1 foundation. Head back to the landing page to continue through the current app shell."
      eyebrow="404"
      title="This table is not open."
    >
      <Link className={buttonClasses()} to="/">
        Back to Domino Vibes
      </Link>
    </PageScaffold>
  )
}
