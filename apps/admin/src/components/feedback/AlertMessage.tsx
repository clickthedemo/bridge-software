import { CircleAlert, CircleCheck } from 'lucide-react'

type AlertMessageProps = {
  title: string
  message: string
  variant?: 'error' | 'success'
}

export function AlertMessage({ title, message, variant = 'error' }: AlertMessageProps) {
  const Icon = variant === 'success' ? CircleCheck : CircleAlert

  return (
    <div className={`alert-message alert-message--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon className="alert-message__icon" size={20} aria-hidden="true" />
      <div>
        <p className="alert-message__title">{title}</p>
        <p className="alert-message__body">{message}</p>
      </div>
    </div>
  )
}
