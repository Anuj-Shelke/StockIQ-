import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'surface' | 'elevated' | 'risk' | 'interactive'
  hasGoldHairline?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'surface', hasGoldHairline = false, className = '', children, ...props }, ref) => {
    let variantStyles = 'bg-[var(--bg-surface)] border border-[var(--border-default)]'

    if (variant === 'hero') {
      variantStyles = 'card-black'
    } else if (variant === 'elevated') {
      variantStyles = 'bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-md)]'
    } else if (variant === 'risk') {
      variantStyles = 'bg-[var(--bg-surface)] border border-[var(--border-default)] border-l-4 border-l-[var(--color-danger)]'
    } else if (variant === 'interactive') {
      variantStyles =
        'bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-md)] transition-all duration-200'
    }

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 ${variantStyles} ${
          hasGoldHairline && variant !== 'hero' ? 'relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--hairline-gold)]' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
