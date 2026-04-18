import { AfmSurfaceViewer } from '@/components/afm-surface-viewer'
import { HeightDistributionChart } from '@/components/height-distribution-chart'
import { PageLayout } from '@/components/page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  GradientCard,
  GradientCardContent,
  GradientCardDescription,
  GradientCardHeader,
  GradientCardTitle,
} from '@/components/ui/gradient-card'
import { trpc } from '@/lib/trpc'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/jobs/$jobId')({
  component: JobDetail,
})

type JobStatus = 'PROCESSING' | 'FINISHED' | 'ERROR'

function statusVariant(
  status: JobStatus,
): 'default' | 'secondary' | 'destructive' {
  if (status === 'FINISHED') return 'secondary'
  if (status === 'ERROR') return 'destructive'
  return 'default'
}

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

function JobDetail() {
  const { jobId } = Route.useParams()
  const navigate = useNavigate()
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null)

  const jobQuery = trpc.analysisJobs.getById.useQuery({ id: jobId })
  const firstImageId = jobQuery.data?.job.images[0]?.id ?? null
  const selectedImageId = selectedOverride ?? firstImageId

  const job = jobQuery.data?.job
  const title = job?.name ?? 'Analysis job'

  const actions = job ? (
    <Badge variant={statusVariant(job.status)}>
      {job.status.toLowerCase()}
    </Badge>
  ) : null

  const middle = job ? (
    <span className="text-muted-foreground truncate text-xs">
      Created by {job.creator.name} · {formatDate(job.createdAt)}
      {job.finishedAt ? ` · finished ${formatDate(job.finishedAt) ?? ''}` : ''}
    </span>
  ) : null

  return (
    <PageLayout
      title={title}
      onBack={() => {
        void navigate({ to: '/jobs' })
      }}
      middle={middle}
      actions={actions}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        {jobQuery.isLoading && <p>Loading...</p>}
        {jobQuery.isError && <p>{jobQuery.error.message}</p>}

        {job && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[55%_45%]">
            <div className="relative h-[60vh] lg:h-full">
              {selectedImageId ? (
                <AfmSurfaceViewer rawImageId={selectedImageId} />
              ) : (
                <p className="text-muted-foreground p-4 text-sm">
                  No file selected.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              {job.error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  <span className="font-medium">Error:</span> {job.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <GradientCard key={i} className="aspect-square">
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
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Files ({job.images.length.toString()})</CardTitle>
                  <CardDescription>
                    Raw files uploaded for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {job.images.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No files attached to this job.
                    </p>
                  )}
                  {job.images.map((image) => {
                    const isSelected = image.id === selectedImageId
                    return (
                      <div
                        key={image.id}
                        className={`flex items-center gap-3 rounded-md border p-3 ${
                          isSelected ? 'border-primary bg-accent/40' : ''
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {image.filename}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatBytes(image.sizeBytes)} ·{' '}
                            {formatDate(image.createdAt)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedOverride(image.id)
                          }}
                        >
                          {isSelected ? 'Viewing' : 'View 3D'}
                        </Button>
                        {image.downloadUrl && (
                          <a
                            href={image.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
