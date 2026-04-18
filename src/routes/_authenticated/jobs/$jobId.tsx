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
import { trpc } from '@/lib/trpc'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'

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
  const utils = trpc.useUtils()

  const jobQuery = trpc.analysisJobs.getById.useQuery({ id: jobId })
  const markFinished = trpc.analysisJobs.markFinished.useMutation({
    onSuccess: async () => {
      await utils.analysisJobs.getById.invalidate({ id: jobId })
      await utils.analysisJobs.list.invalidate()
      toast.success('Marked as finished')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })
  const markError = trpc.analysisJobs.markError.useMutation({
    onSuccess: async () => {
      await utils.analysisJobs.getById.invalidate({ id: jobId })
      await utils.analysisJobs.list.invalidate()
      toast.success('Marked as error')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const job = jobQuery.data?.job
  const isDev = import.meta.env.DEV
  const title = job?.name ?? 'Analysis job'

  const actions = (
    <>
      {job && (
        <Badge variant={statusVariant(job.status)}>
          {job.status.toLowerCase()}
        </Badge>
      )}
      <Link to="/jobs" className="text-sm underline">
        ← Back
      </Link>
    </>
  )

  return (
    <PageLayout title={title} actions={actions}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {jobQuery.isLoading && <p>Loading...</p>}
        {jobQuery.isError && <p>{jobQuery.error.message}</p>}

        {job && (
          <>
            <Card>
              <CardHeader>
                <CardDescription>
                  Created by {job.creator.name} · {formatDate(job.createdAt)}
                  {job.finishedAt
                    ? ` · finished ${formatDate(job.finishedAt) ?? ''}`
                    : ''}
                </CardDescription>
              </CardHeader>
              {job.error && (
                <CardContent>
                  <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                    <span className="font-medium">Error:</span> {job.error}
                  </div>
                </CardContent>
              )}
              {isDev && (
                <CardContent className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={markFinished.isPending}
                    onClick={() => {
                      markFinished.mutate({ id: jobId })
                    }}
                  >
                    Mark finished (dev)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={markError.isPending}
                    onClick={() => {
                      markError.mutate({
                        id: jobId,
                        message: 'Manually marked as error from UI',
                      })
                    }}
                  >
                    Mark as error (dev)
                  </Button>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images ({job.images.length.toString()})</CardTitle>
                <CardDescription>
                  Raw .bmp files uploaded for this job
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {job.images.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No images attached to this job.
                  </p>
                )}
                {job.images.map((image) => (
                  <ImageRow key={image.id} path={image.storagePath}>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {image.filename}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatBytes(image.sizeBytes)} ·{' '}
                        {formatDate(image.createdAt)}
                      </span>
                    </div>
                  </ImageRow>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}

function ImageRow({
  path,
  children,
}: {
  path: string
  children: React.ReactNode
}) {
  const signed = trpc.bytemaps.getSignedUrl.useQuery({ path })

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      {children}
      {signed.isLoading && (
        <span className="text-muted-foreground text-xs">…</span>
      )}
      {signed.data && (
        <a
          href={signed.data.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Open
        </a>
      )}
      {signed.isError && (
        <span className="text-destructive text-xs">failed</span>
      )}
    </div>
  )
}
