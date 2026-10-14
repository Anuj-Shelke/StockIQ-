import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className = '', children, disabled, ...props }, ref) => {
    let variantStyles = 'btn-gold'
    if (variant === 'secondary') variantStyles = 'btn-secondary'
    if (variant === 'ghost') {
      variantStyles =
        'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
    }
    if (variant === 'danger') {
      variantStyles =
        'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-sm border border-transparent'
    }

    const sizeStyles =
      size === 'sm'
        ? 'px-3 py-1.5 text-xs rounded-lg'
        : size === 'lg'
        ? 'px-6 py-3 text-base rounded-xl'
        : 'px-4 py-2 text-sm rounded-lg'

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
