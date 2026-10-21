import { Activity, Briefcase, Calculator, ClipboardCheck, Compass, GraduationCap, History, LayoutDashboard, Scale, ShieldAlert, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'

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
  { to: '/fno-arena', label: 'F&O Arena', icon: Activity, blurb: 'Practice a simulated derivatives scenario with fictional points and a deterministic engine.' },
  { to: '/dashboard/compare', label: 'Compare Assets', icon: Scale, blurb: 'Put stocks, gold and fixed deposits side by side on the same footing.' },
  { to: '/dashboard/explainability', label: 'Explainability', icon: Sparkles, blurb: 'See the reasoning and sources behind every analysis.' },
  { to: '/dashboard/education', label: 'Financial Education', icon: GraduationCap, blurb: 'Plain-language, source-backed explanations of financial concepts.' },
  { to: '/dashboard/history', label: 'Analysis History', icon: History, blurb: 'Revisit and compare your earlier analyses and snapshots.' },
  { to: '/dashboard/sebi-rules', label: 'SEBI Regulations', icon: Scale, blurb: 'RAG-grounded AI assistant trained on statutory SEBI guidelines, investor rights, and compliance.' },
  { to: '/dashboard/reviews', label: 'My Reviews', icon: ClipboardCheck, blurb: 'Track expert-review requests and responses.' },
]
