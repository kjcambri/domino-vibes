import { type PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'

type MobileShellProps = PropsWithChildren<{
  className?: string
}>

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(197,155,68,0.18),_transparent_34rem),linear-gradient(145deg,_#08251b_0%,_#03120d_58%,_#1e1009_100%)] px-4 py-5 text-cream-50 sm:px-6">
      <div
        className={cn(
          'mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[430px] flex-col',
          className,
        )}
      >
        {children}
      </div>
    </main>
  )
}
