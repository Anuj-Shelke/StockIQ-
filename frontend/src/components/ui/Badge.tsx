import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'ai' | 'why' | 'low' | 'moderate' | 'elevated' | 'danger' | 'gold' | 'neutral'
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className = '', children, ...props }) => {
  let styleClasses = 'bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]'

  if (variant === 'verified') {
    styleClasses = 'badge-tier-verified'
  } else if (variant === 'ai') {
    styleClasses = 'badge-tier-interpretation'
  } else if (variant === 'why') {
    styleClasses = 'badge-tier-why'
  } else if (variant === 'low') {
    styleClasses = 'lens-low'
  } else if (variant === 'moderate') {
    styleClasses = 'lens-moderate'
  } else if (variant === 'elevated') {
    styleClasses = 'lens-elevated'
  } else if (variant === 'danger') {
    styleClasses = 'lens-danger'
  } else if (variant === 'gold') {
    styleClasses = 'bg-[var(--gold-soft)] text-[var(--gold-primary)] border border-[var(--hairline-gold)]'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${styleClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
