export interface SourceCitation {
  id: string
  title: string
  publisher: string
  url?: string
  confidenceScore?: number
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: SourceCitation[]
}

export interface CalculationResult {
  label: string
  value: string
  subtext?: string
}
