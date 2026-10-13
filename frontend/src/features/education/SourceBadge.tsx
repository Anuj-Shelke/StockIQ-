import { ExternalLink, BookOpen } from 'lucide-react'
import type { SourceCitation } from '@/types/education'

interface SourceBadgeProps {
  source: SourceCitation
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:border-gold-500/30 hover:bg-gold-500/5 transition">
      <BookOpen className="h-3 w-3 text-gold-400" />
      <span className="font-medium text-white">{source.title}</span>
      <span className="text-slate-400">({source.publisher})</span>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-gold-400 hover:text-gold-300 ml-0.5"
          title="Open external documentation"
        >
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  )
}
