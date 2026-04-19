import { HeightDistributionChart } from '@/components/height-distribution-chart'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  GradientCard,
  GradientCardContent,
  GradientCardDescription,
  GradientCardHeader,
  GradientCardTitle,
} from '@/components/ui/gradient-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useJobDetail } from '../-job-detail-context'
import { ClassificationTasks } from './classification-tasks'
import { ChartsGridSkeleton, DiagnosisSkeleton } from './skeletons'

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes.toString()} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function ConfidenceBar({ value }: { value: number }) {
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setScale(value / 100)
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [value])
  return (
    <div className="bg-muted/60 mt-2 h-2 w-full overflow-hidden rounded-full">
      <div
        className="bg-primary h-full w-full origin-left rounded-full transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${scale.toString()})`, willChange: 'transform' }}
      />
    </div>
  )
}

function graphTitle(type: 'HEIGHT_DISTRIBUTION' | 'DENSITY_VS_AREA'): string {
  if (type === 'HEIGHT_DISTRIBUTION') return 'Height distribution'
  return 'Density vs area'
}

function graphDescription(
  type: 'HEIGHT_DISTRIBUTION' | 'DENSITY_VS_AREA',
): string {
  if (type === 'HEIGHT_DISTRIBUTION')
    return 'Occurrence frequency vs height (nm)'
  return 'Density vs area'
}

function FilesPanel() {
  const { images, selectedImageId, setSelectedImageId } = useJobDetail()

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden py-0">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <FileText className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Files</h3>
        <Badge variant="secondary" className="text-[10px]">
          {images.length.toString()}
        </Badge>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {images.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-xs">
            No files attached.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {images.map((image) => {
              const isSelected = image.id === selectedImageId
              return (
                <li key={image.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors',
                      isSelected
                        ? 'border-primary/60 bg-accent/60'
                        : 'hover:bg-accent/40',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImageId(image.id)
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-pressed={isSelected}
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          isSelected ? 'bg-primary' : 'bg-muted-foreground/40',
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={cn(
                            'truncate text-xs font-medium',
                            isSelected
                              ? 'text-foreground'
                              : 'text-foreground/90',
                          )}
                        >
                          {image.filename}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {formatBytes(image.sizeBytes)}
                        </span>
                      </span>
                    </button>
                    {image.downloadUrl && (
                      <a
                        href={image.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Download"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className={cn(
                          buttonVariants({
                            variant: 'ghost',
                            size: 'icon',
                          }),
                          'size-7 shrink-0 opacity-60 group-hover:opacity-100',
                        )}
                      >
                        <Download className="size-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}

function DiagnosisPanel() {
  const { selectedImage } = useJobDetail()
  const result = selectedImage?.result ?? null
  const confidencePct = result ? Math.round(result.confidence * 100) : null

  return (
    <GradientCard className="h-full w-full">
      <GradientCardHeader className="gap-1">
        <GradientCardDescription className="text-[10px] font-medium tracking-[0.14em] uppercase">
          Predicted diagnosis
        </GradientCardDescription>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <GradientCardTitle className="text-2xl font-semibold tracking-tight">
            {result?.diagnosis ?? 'Analysis pending'}
          </GradientCardTitle>
          {confidencePct !== null && (
            <Badge variant="secondary" className="text-xs font-medium">
              {confidencePct.toString()}% confidence
            </Badge>
          )}
        </div>
      </GradientCardHeader>
      {confidencePct !== null && (
        <GradientCardContent>
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">Model confidence</span>
            <span className="tabular-nums">{confidencePct.toString()}%</span>
          </div>
          <ConfidenceBar value={confidencePct} />
        </GradientCardContent>
      )}
    </GradientCard>
  )
}

export function JobRightPanel() {
  const { jobQuery, job, selectedImage } = useJobDetail()

  if (jobQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <div className="grid h-44 shrink-0 grid-cols-2 gap-4">
          <Card className="w-full">
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </CardContent>
          </Card>
          <DiagnosisSkeleton />
        </div>
        <Card className="w-full">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartsGridSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (jobQuery.isError) {
    return (
      <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          <p className="font-medium">Failed to load job</p>
          <p className="mt-1 opacity-90">{jobQuery.error.message}</p>
        </div>
      </div>
    )
  }

  if (!job) return null

  const result = selectedImage?.result ?? null

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      {job.error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <span className="font-medium">Error:</span> {job.error}
        </div>
      )}

      <div className="grid h-44 shrink-0 grid-cols-2 gap-4">
        <FilesPanel />
        <DiagnosisPanel />
      </div>

      <Card className="max-h-[calc(100svh-21rem)] w-full overflow-y-auto">
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ClassificationTasks value={result?.methods} />

          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold">
                  Graphs ({(result?.graphs.length ?? 0).toString()})
                </h3>
                <p className="text-muted-foreground text-xs">
                  Supportive Graphs
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CarouselPrevious className="static translate-y-0" />
                <CarouselNext className="static translate-y-0" />
              </div>
            </div>
            <CarouselContent className="px-0.5 py-2">
              {(result?.graphs.length ? result.graphs : [null, null]).map(
                (graph, i) => {
                  const hasData = !!graph?.points.length
                  return (
                    <CarouselItem
                      key={graph?.id ?? `empty-${i.toString()}`}
                      className="basis-2/3"
                    >
                      <GradientCard className="h-56">
                        {hasData ? (
                          <>
                            <GradientCardHeader>
                              <GradientCardTitle>
                                {graphTitle(graph.type)}
                              </GradientCardTitle>
                              <GradientCardDescription>
                                {graphDescription(graph.type)}
                              </GradientCardDescription>
                            </GradientCardHeader>
                            <GradientCardContent className="min-h-0 flex-1 px-2 pb-2">
                              <HeightDistributionChart
                                data={graph.points.map((p) => ({
                                  heightRange: p.x,
                                  occurrenceFrequency: p.y,
                                }))}
                              />
                            </GradientCardContent>
                          </>
                        ) : (
                          <GradientCardContent className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                            Waiting for data…
                          </GradientCardContent>
                        )}
                      </GradientCard>
                    </CarouselItem>
                  )
                },
              )}
            </CarouselContent>
          </Carousel>
        </CardContent>
      </Card>
    </div>
  )
}
