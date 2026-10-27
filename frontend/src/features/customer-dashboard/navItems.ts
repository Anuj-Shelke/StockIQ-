import { Briefcase, Calculator, CircleUserRound, ClipboardCheck, Compass, GraduationCap, LayoutDashboard, Scale, ShieldAlert, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  blurb: string
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, blurb: 'Your overview.', end: true },
  { to: '/dashboard/investment-planner', label: 'Investment Planner', icon: Compass, blurb: 'Comprehensive multi-asset investment planner & portfolio optimizer across Stocks, Gold, FDs, and Index Funds.' },
  { to: '/dashboard/next-day-open', label: 'Next-Day Open', icon: TrendingUp, blurb: 'Machine learning forecast of tomorrow’s 9:15 AM opening prices and gap probabilities for NSE & BSE.' },
  { to: '/dashboard/recommendations', label: 'AI Recommendations', icon: Sparkles, blurb: 'Personalized stock and asset allocation recommendations tailored to your age, income, and goals.' },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase, blurb: 'Build and review your holdings, with allocation and concentration at a glance.' },
  { to: '/dashboard/tax', label: 'Tax Intelligence', icon: Calculator, blurb: 'Statutory capital gains tax engine, FIFO lot allocation, Budget 2024 rules, and XAI explanations.' },
  { to: '/dashboard/risk-check', label: 'Risk Reality Check', icon: ShieldAlert, blurb: 'Stress-test a portfolio against historical scenarios and see what could hurt.' },
  { to: '/dashboard/compare', label: 'Compare Assets', icon: Scale, blurb: 'Put stocks, gold and fixed deposits side by side on the same footing.' },
  { to: '/dashboard/education', label: 'Financial Education', icon: GraduationCap, blurb: 'Plain-language, source-backed explanations of financial concepts and RAG assistant.' },
  { to: '/dashboard/reviews', label: 'My Reviews', icon: ClipboardCheck, blurb: 'Track expert-review requests and responses.' },
  { to: '/dashboard/account', label: 'Account', icon: CircleUserRound, blurb: 'View your profile and account details.' },
]

const item = (path: string) => NAV_ITEMS.find(({ to }) => to === path)!

export const NAV_GROUPS = [
  {
    id: 'plan',
    label: 'Plan & compare',
    items: [item('/dashboard/investment-planner'), item('/dashboard/compare'), item('/dashboard/tax')],
  },
  {
    id: 'markets',
    label: 'Markets & forecasts',
    items: [item('/dashboard/next-day-open')],
  },
  {
    id: 'insights',
    label: 'Research & learning',
    items: [item('/dashboard/recommendations'), item('/dashboard/education'), item('/dashboard/reviews')],
  },
] as const

export const PRIMARY_NAV_ITEMS = [item('/dashboard'), item('/dashboard/portfolio'), item('/dashboard/risk-check')]
export const ACCOUNT_NAV_ITEM = item('/dashboard/account')
