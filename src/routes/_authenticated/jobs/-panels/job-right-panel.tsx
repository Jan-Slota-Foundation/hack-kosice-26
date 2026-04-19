import { HeightDistributionChart } from '@/components/height-distribution-chart'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useJobDetail } from '../-job-detail-context'
import { ClassificationTasks } from './classification-tasks'
import {
  ChartsGridSkeleton,
  DiagnosisSkeleton,
  FilesListSkeleton,
} from './skeletons'

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString()
}

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes.toString()} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function ConfidenceBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setWidth(value)
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [value])
  return (
    <div className="bg-muted/60 mt-2 h-2 w-full overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${width.toString()}%` }}
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

export function JobRightPanel() {
  const {
    jobQuery,
    job,
    images,
    selectedImage,
    selectedImageId,
    setSelectedImageId,
  } = useJobDetail()

  if (jobQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <DiagnosisSkeleton />
        <Card className="w-full">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FilesListSkeleton />
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
  const confidencePct = result ? Math.round(result.confidence * 100) : null

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      {job.error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <span className="font-medium">Error:</span> {job.error}
        </div>
      )}

      <GradientCard className="w-full">
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

      <Card className="max-h-[calc(100svh-18rem)] w-full overflow-y-auto">
        <CardHeader>
          <CardTitle>Files ({images.length.toString()})</CardTitle>
          <CardDescription>Raw files uploaded for this job</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2">
            {images.length === 0 && (
              <p className="text-muted-foreground col-span-2 text-sm">
                No files attached to this job.
              </p>
            )}
            {images.map((image) => {
              const isSelected = image.id === selectedImageId
              return (
                <div
                  key={image.id}
                  className={`flex flex-col gap-2 rounded-md border p-3 ${
                    isSelected ? 'border-primary bg-accent/40' : ''
                  }`}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {image.filename}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatBytes(image.sizeBytes)} ·{' '}
                      {formatDate(image.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedImageId(image.id)
                      }}
                    >
                      {isSelected ? 'Viewing' : 'View 3D'}
                    </Button>
                    {image.downloadUrl && (
                      <a
                        href={image.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Download"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'icon',
                        })}
                      >
                        <Download className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <ClassificationTasks value={result?.diagnosis_detail} />

          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-2 flex items-center justify-end gap-2">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
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
