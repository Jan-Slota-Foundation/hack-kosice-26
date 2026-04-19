import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

interface ResultMethodItem {
  id: string
  name: string
  diagnosis: string
  confidence: number
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ')
}

function formatPct(value: number): string {
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toFixed(1)}%`
}

function MethodConfidenceBar({
  value,
  delayMs,
}: {
  value: number
  delayMs: number
}) {
  const target = value <= 1 ? value : value / 100
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setScale(target)
    })
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [target])
  return (
    <div className="bg-muted/60 h-1.5 w-full overflow-hidden rounded-full">
      <div
        className="bg-primary h-full w-full origin-left rounded-full transition-transform ease-out"
        style={{
          transform: `scaleX(${scale.toString()})`,
          transitionDuration: '700ms',
          transitionDelay: `${delayMs.toString()}ms`,
          willChange: 'transform',
        }}
      />
    </div>
  )
}

export function ClassificationTasks({
  value,
}: {
  value: ResultMethodItem[] | null | undefined
}) {
  const methods = value ?? []
  if (methods.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">
          Classification tasks ({methods.length.toString()})
        </h3>
        <p className="text-muted-foreground text-xs">
          Per-method ensemble outputs from the pipeline
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {methods.map((method, i) => (
          <div
            key={method.id}
            className="flex flex-col gap-2 rounded-md border p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">
                {humanize(method.name)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {humanize(method.diagnosis)} · {formatPct(method.confidence)}
              </Badge>
            </div>
            <MethodConfidenceBar
              value={method.confidence}
              delayMs={i * 250}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
