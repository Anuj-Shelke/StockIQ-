export type MentorMoment = 'watching' | 'entry' | 'profit' | 'reversal' | 'volatility-shock' | 'margin-call' | 'liquidation' | 'expiry' | 'result'

const lines: Record<MentorMoment, string> = {
  watching: 'Watch the path first. You decide when to enter, and the next move is never guaranteed.',
  entry: 'Risk samajh, phir move kar. Every position has a cost.',
  profit: 'A gain is one moment in a moving scenario. Keep the risk in view.',
  reversal: 'The position has moved into a loss. Notice what changed before reacting.',
  'volatility-shock': 'Volatility shifted sharply in this scenario. It can change an option model value; it does not predict the next move.',
  'margin-call': 'Equity fell below this simulation’s maintenance level. The next tick schedules a close.',
  liquidation: 'The simulator closed the position under its demo margin rules. This is not a broker rule.',
  expiry: 'Time ended the option. Its closing value came from the model’s intrinsic value.',
  result: 'The result is a record of this run, not a forecast or a verdict on you.',
}

export function mentorLine(moment: MentorMoment): string {
  return lines[moment]
}
