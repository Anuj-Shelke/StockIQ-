import { DISCLAIMER } from '@/utils/disclaimer'

export function Disclaimer({ className = '' }: { className?: string }) {
  return <p className={`text-[10px] leading-snug text-slate-400/70 ${className}`}>{DISCLAIMER}</p>
}
