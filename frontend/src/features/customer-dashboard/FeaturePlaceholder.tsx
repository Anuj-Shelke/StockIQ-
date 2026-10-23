import { Hammer } from 'lucide-react'

export function FeaturePlaceholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="card-surface mx-auto max-w-2xl p-8 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
        <Hammer className="h-5 w-5" />
      </div>
      <h1 className="font-display text-3xl text-text-primary">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">{blurb}</p>
      <p className="mt-5 inline-block rounded-full bg-hover px-3 py-1 text-xs uppercase tracking-widest text-text-muted">Coming soon</p>
    </div>
  )
}
