import { Briefcase, ClipboardCheck, GraduationCap, History, LayoutDashboard, Scale, ShieldAlert, Sparkles, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  blurb: string
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, blurb: 'Your overview.', end: true },
  { to: '/dashboard/recommendations', label: 'AI Recommendations', icon: Sparkles, blurb: 'Personalized stock and asset allocation recommendations tailored to your age, income, and goals.' },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase, blurb: 'Build and review your holdings, with allocation and concentration at a glance.' },
  { to: '/dashboard/risk-check', label: 'Risk Reality Check', icon: ShieldAlert, blurb: 'Stress-test a portfolio against historical scenarios and see what could hurt.' },
  { to: '/dashboard/compare', label: 'Compare Assets', icon: Scale, blurb: 'Put stocks, gold and fixed deposits side by side on the same footing.' },
  { to: '/dashboard/explainability', label: 'Explainability', icon: Sparkles, blurb: 'See the reasoning and sources behind every analysis.' },
  { to: '/dashboard/education', label: 'Financial Education', icon: GraduationCap, blurb: 'Plain-language, source-backed explanations of financial concepts.' },
  { to: '/dashboard/history', label: 'Analysis History', icon: History, blurb: 'Revisit and compare your earlier analyses and snapshots.' },
  { to: '/dashboard/review-request', label: 'Review Request', icon: ClipboardCheck, blurb: 'Ask an authorised reviewer to look over an analysis.' },
]
