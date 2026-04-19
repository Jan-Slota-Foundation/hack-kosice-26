import { Badge } from '@/components/ui/badge'

interface ClassificationModelScore {
  label: string
  model: string
  confidence: number
  probabilities: Record<string, number>
}

interface ClassificationTask {
  task: string
  label: string
  confidence: number
  model_scores: ClassificationModelScore[]
  probabilities: Record<string, number>
}

interface Outcome {
  winner: { label: string; probability: number }
  loser: { label: string; probability: number }
}

function computeOutcome(probabilities: Record<string, number>): Outcome | null {
  const entries = Object.entries(probabilities)
  if (entries.length < 2) return null
  const sorted = [...entries].sort(([, a], [, b]) => b - a)
  const [winnerLabel, winnerProb] = sorted[0]
  const [loserLabel, loserProb] = sorted[sorted.length - 1]
  return {
    winner: { label: winnerLabel, probability: winnerProb },
    loser: { label: loserLabel, probability: loserProb },
  }
}

function humanizeLabel(label: string): string {
  return label.replace(/_/g, ' ')
}

function humanizeTask(task: string): string {
  return task.replace(/_/g, ' ').replace(/\bvs\b/, 'vs.')
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function parseClassificationTasks(value: unknown): ClassificationTask[] {
  return Array.isArray(value) ? (value as ClassificationTask[]) : []
}

export function ClassificationTasks({ value }: { value: unknown }) {
  const tasks = parseClassificationTasks(value)
  if (tasks.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">
          Classification tasks ({tasks.length.toString()})
        </h3>
        <p className="text-muted-foreground text-xs">
          Per-task ensemble outputs from the pipeline
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          const outcome = computeOutcome(task.probabilities)
          return (
            <div
              key={task.task}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {humanizeTask(task.task)}
                </span>
                {outcome && (
                  <Badge variant="secondary" className="text-xs">
                    {humanizeLabel(outcome.winner.label)} ·{' '}
                    {formatPct(outcome.winner.probability)}
                  </Badge>
                )}
              </div>
              {outcome && (
                <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums">
                  <span>
                    <span className="text-foreground font-medium">Winner:</span>{' '}
                    {humanizeLabel(outcome.winner.label)} (
                    {formatPct(outcome.winner.probability)})
                  </span>
                  <span>
                    Loser: {humanizeLabel(outcome.loser.label)} (
                    {formatPct(outcome.loser.probability)})
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {task.model_scores.map((m) => {
                  const modelOutcome = computeOutcome(m.probabilities)
                  if (!modelOutcome) return null
                  return (
                    <div
                      key={m.model}
                      className="flex items-baseline justify-between gap-2 text-xs"
                    >
                      <span className="text-muted-foreground">{m.model}</span>
                      <span className="tabular-nums">
                        {humanizeLabel(modelOutcome.winner.label)} ·{' '}
                        {formatPct(modelOutcome.winner.probability)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
