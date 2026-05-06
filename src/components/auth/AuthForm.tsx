import { type FormEvent, type ReactNode } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { cn } from '../../lib/cn'

type AuthFormProps = {
  title: string
  eyebrow: string
  description: string
  submitLabel: string
  isLoading: boolean
  error?: string
  success?: string
  children: ReactNode
  footer?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthForm({
  title,
  eyebrow,
  description,
  submitLabel,
  isLoading,
  error,
  success,
  children,
  footer,
  onSubmit,
}: AuthFormProps) {
  return (
    <Card className="mt-auto overflow-hidden border-gold-300/22 bg-[radial-gradient(circle_at_76%_0%,rgba(249,189,34,0.16),transparent_14rem),linear-gradient(145deg,rgba(42,22,10,0.92),rgba(6,31,24,0.84))] shadow-[0_28px_80px_rgba(17,7,2,0.48)]">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl border border-gold-300/35 bg-gold-300/14 text-gold-100 shadow-gold">
          <Crown aria-hidden="true" size={19} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-200">
            {eyebrow}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
            Island elite social club
          </p>
        </div>
      </div>
      <h1 className="mt-3 font-serif text-3xl font-black leading-tight text-cream-50">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-cream-100/78">
        {description}
      </p>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        {children}
        {error ? (
          <div
            className="rounded-xl border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {success ? (
          <div
            className="rounded-xl border border-teal-200/30 bg-teal-300/10 px-4 py-3 text-sm leading-6 text-teal-50"
            role="status"
          >
            {success}
          </div>
        ) : null}
        <Button disabled={isLoading} type="submit">
          {isLoading ? 'Working...' : submitLabel}
        </Button>
      </form>

      {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}
    </Card>
  )
}

type FieldProps = {
  label: string
  name: string
  value: string
  type?: string
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function Field({
  label,
  name,
  value,
  type = 'text',
  autoComplete,
  placeholder,
  disabled,
  onChange,
}: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-cream-100" htmlFor={name}>
      {label}
      <input
        autoComplete={autoComplete}
        className={cn(
          'min-h-12 rounded-xl border border-gold-300/18 bg-wood-900/45 px-4 py-3 text-base text-cream-50 outline-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.22)] transition placeholder:text-cream-100/35 focus:border-teal-300/80 focus:ring-2 focus:ring-teal-300/25',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        disabled={disabled}
        id={name}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}
