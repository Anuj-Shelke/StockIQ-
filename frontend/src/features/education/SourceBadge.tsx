import { ExternalLink, BookOpen } from 'lucide-react'
import type { SourceCitation } from '@/types/education'

interface SourceBadgeProps {
  source: SourceCitation
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] text-text-secondary hover:border-gold-500/30 hover:bg-gold-500/5 transition">
      <BookOpen className="h-3 w-3 text-gold-400" />
      <span className="font-medium text-text-primary">{source.title}</span>
      <span className="text-text-muted">({source.publisher})</span>
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
