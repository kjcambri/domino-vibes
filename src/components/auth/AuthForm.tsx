import { type FormEvent, type ReactNode } from 'react'
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
  children,
  footer,
  onSubmit,
}: AuthFormProps) {
  return (
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

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        {children}
        {error ? (
          <div
            className="rounded-md border border-red-300/30 bg-red-800/20 px-4 py-3 text-sm leading-6 text-red-100"
            role="alert"
          >
            {error}
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
          'min-h-12 rounded-md border border-cream-100/15 bg-green-950/55 px-4 py-3 text-base text-cream-50 outline-none transition placeholder:text-cream-100/35 focus:border-gold-300/80 focus:ring-2 focus:ring-gold-300/25',
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
