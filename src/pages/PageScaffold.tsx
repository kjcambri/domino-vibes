import { ArrowLeft } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { buttonClasses } from '../components/common/buttonStyles'
import { MobileShell } from '../components/layout/MobileShell'

type PageScaffoldProps = {
  title: string
  eyebrow: string
  description: string
  children?: ReactNode
}

export function PageScaffold({
  title,
  eyebrow,
  description,
  children,
}: PageScaffoldProps) {
  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-5 py-2">
        <Link
          className={buttonClasses({
            variant: 'ghost',
            className: 'w-fit gap-2 px-2',
          })}
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Home
        </Link>

        <Card className="mt-auto">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-cream-50">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-cream-100/78">
            {description}
          </p>
          {children ? <div className="mt-6">{children}</div> : null}
        </Card>
      </div>
    </MobileShell>
  )
}
