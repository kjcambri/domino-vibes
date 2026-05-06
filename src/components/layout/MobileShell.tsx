import { type PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'
import { appInfo } from '../../lib/appInfo'

type MobileShellProps = PropsWithChildren<{
  className?: string
}>

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-[radial-gradient(circle_at_76%_0%,_rgba(249,189,34,0.18),_transparent_28rem),radial-gradient(circle_at_12%_18%,_rgba(107,216,203,0.14),_transparent_22rem),radial-gradient(circle_at_50%_44%,_rgba(20,107,74,0.32),_transparent_34rem),repeating-linear-gradient(90deg,_rgba(255,244,214,0.025)_0_1px,_transparent_1px_18px),linear-gradient(145deg,_#17130a_0%,_#201b11_30%,_#061F18_58%,_#2A160A_100%)] px-4 py-5 text-cream-50 sm:px-6">
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
