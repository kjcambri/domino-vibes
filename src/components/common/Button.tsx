import { type ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonVariant } from './buttonStyles'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, className })}
      type={type}
      {...props}
    />
  )
}
