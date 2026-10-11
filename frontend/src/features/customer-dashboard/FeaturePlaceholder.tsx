import { Hammer } from 'lucide-react'

export function FeaturePlaceholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
        <Hammer className="h-5 w-5" />
      </div>
      <h1 className="font-display text-3xl text-white">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">{blurb}</p>
      <p className="mt-5 inline-block rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-slate-400">Coming soon</p>
    </div>
  )
}
