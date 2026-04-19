import { PageLayout } from '@/components/page-layout'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/jobs/')({
  component: JobsIndex,
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

function JobCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 pr-10">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-5 w-72" />
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function JobsIndex() {
  const jobs = trpc.analysisJobs.list.useQuery()
  const utils = trpc.useUtils()
  const deleteJob = trpc.analysisJobs.delete.useMutation({
    onSuccess: async () => {
      await utils.analysisJobs.list.invalidate()
    },
  })
  const items = jobs.data?.jobs ?? []

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    jobId: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      !confirm('Delete this analysis and all its files? This cannot be undone.')
    ) {
      return
    }
    deleteJob.mutate({ id: jobId })
  }

  return (
    <PageLayout
      title="Analysis jobs"
      actions={
        <Link to="/upload" className={buttonVariants({ size: 'lg' })}>
          + New
        </Link>
      }
    >
      {jobs.isLoading &&
        [0, 1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
      {jobs.isError && <p>Error loading analysis jobs</p>}

      {jobs.isSuccess && items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No analysis jobs yet. Upload some files to get started.
            </p>
            <Link to="/upload" className="mt-2 inline-block text-sm underline">
              Go to upload
            </Link>
          </CardContent>
        </Card>
      )}

      {items.map((job) => (
        <Card
          key={job.id}
          className="hover:bg-accent/30 relative transition-colors"
        >
          <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 pr-10">
                <span className="truncate">{job.name}</span>
                <Badge variant={statusVariant(job.status)}>
                  {job.status.toLowerCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                {job._count.images} file
                {job._count.images === 1 ? '' : 's'} · created{' '}
                {formatDate(job.createdAt)}
                {job.finishedAt
                  ? ` · finished ${formatDate(job.finishedAt) ?? ''}`
                  : ''}
              </CardDescription>
            </CardHeader>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete analysis"
            className="text-muted-foreground hover:text-destructive absolute top-3 right-3"
            disabled={deleteJob.isPending && deleteJob.variables.id === job.id}
            onClick={(e) => {
              handleDelete(e, job.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </PageLayout>
  )
}
