import { type PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'

type MobileShellProps = PropsWithChildren<{
  className?: string
}>

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-[radial-gradient(circle_at_70%_0%,_rgba(242,193,78,0.18),_transparent_28rem),radial-gradient(circle_at_12%_22%,_rgba(31,138,91,0.2),_transparent_24rem),linear-gradient(145deg,_#0B3D2E_0%,_#061F18_52%,_#2A160A_100%)] px-4 py-5 text-cream-50 sm:px-6">
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
