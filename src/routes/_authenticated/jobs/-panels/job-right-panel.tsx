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

import { useJobDetail } from '../-job-detail-context'
import { ChartsGridSkeleton, FilesListSkeleton } from './skeletons'

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

const MOCK_DIAGNOSES: { diagnosis: string; confidence: number }[] = [
  { diagnosis: "Parkinson's Disease", confidence: 0.87 },
  { diagnosis: "Alzheimer's Disease", confidence: 0.74 },
  { diagnosis: 'Healthy Tissue', confidence: 0.93 },
  { diagnosis: 'Amyloid Aggregation', confidence: 0.68 },
  { diagnosis: 'Huntington’s Disease', confidence: 0.81 },
]

function mockResultForImage(imageId: string | null): {
  diagnosis: string
  confidence: number
} {
  if (!imageId) return MOCK_DIAGNOSES[0]
  let hash = 0
  for (let i = 0; i < imageId.length; i++) {
    hash = (hash * 31 + imageId.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % MOCK_DIAGNOSES.length
  return MOCK_DIAGNOSES[idx]
}

export function JobRightPanel() {
  const { jobQuery, job, images, selectedImageId, setSelectedImageId } =
    useJobDetail()

  if (jobQuery.isLoading) {
    return (
      <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1">
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

  const { diagnosis: mockDiagnosis, confidence: mockConfidence } =
    mockResultForImage(selectedImageId)
  const confidencePct = Math.round(mockConfidence * 100)

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
              {mockDiagnosis}
            </GradientCardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              {confidencePct.toString()}% confidence
            </Badge>
          </div>
        </GradientCardHeader>
        <GradientCardContent>
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">Model confidence</span>
            <span className="tabular-nums">{confidencePct.toString()}%</span>
          </div>
          <div className="bg-muted/60 mt-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${confidencePct.toString()}%` }}
            />
          </div>
        </GradientCardContent>
      </GradientCard>

      <Card className="w-full">
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

          <Carousel opts={{ align: 'start' }} className="w-full">
            <div className="mb-2 flex items-center justify-end gap-2">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
            <CarouselContent className="px-0.5 py-2">
              {[1, 2, 3, 4].map((i) => (
                <CarouselItem key={i} className="basis-2/3">
                  <GradientCard className="h-56">
                    <GradientCardHeader>
                      <GradientCardTitle>
                        Height distribution {i.toString()}
                      </GradientCardTitle>
                      <GradientCardDescription>
                        Occurrence frequency vs height (nm)
                      </GradientCardDescription>
                    </GradientCardHeader>
                    <GradientCardContent className="min-h-0 flex-1 px-2 pb-2">
                      <HeightDistributionChart />
                    </GradientCardContent>
                  </GradientCard>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </CardContent>
      </Card>
    </div>
  )
}
