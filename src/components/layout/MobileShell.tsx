import { type PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'
import { appInfo } from '../../lib/appInfo'

type MobileShellProps = PropsWithChildren<{
  className?: string
}>

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-[radial-gradient(circle_at_76%_0%,_rgba(242,193,78,0.2),_transparent_28rem),radial-gradient(circle_at_12%_18%,_rgba(69,221,189,0.15),_transparent_22rem),radial-gradient(circle_at_50%_42%,_rgba(31,138,91,0.2),_transparent_34rem),linear-gradient(145deg,_#171304_0%,_#061F18_45%,_#2A160A_100%)] px-4 py-5 text-cream-50 sm:px-6">
      <div
        className={cn(
          'mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[430px] flex-col',
          className,
        )}
      >
        {children}
        <p className="mt-auto pt-5 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cream-100/38">
          {appInfo.appName} beta · {appInfo.appVersion} · {appInfo.buildMode}
        </p>
      </div>
    </main>
  )
}
