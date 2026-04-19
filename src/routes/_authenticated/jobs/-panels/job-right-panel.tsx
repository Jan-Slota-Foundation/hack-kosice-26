import { Download } from 'lucide-react'

import { HeightDistributionChart } from '@/components/height-distribution-chart'
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

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      {job.error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <span className="font-medium">Error:</span> {job.error}
        </div>
      )}

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
