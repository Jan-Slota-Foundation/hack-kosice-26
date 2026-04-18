import { PageLayout } from '@/components/page-layout'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { createFileRoute, Link } from '@tanstack/react-router'

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

function JobsIndex() {
  const jobs = trpc.analysisJobs.list.useQuery()
  const items = jobs.data?.jobs ?? []

  return (
    <PageLayout
      title="Analysis jobs"
      actions={
        <Link to="/upload" className={buttonVariants({ size: 'lg' })}>
          + New
        </Link>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {jobs.isLoading && <p>Loading...</p>}
        {jobs.isError && <p>Error loading analysis jobs</p>}

        {jobs.isSuccess && items.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No analysis jobs yet. Upload some files to get started.
              </p>
              <Link
                to="/upload"
                className="mt-2 inline-block text-sm underline"
              >
                Go to upload
              </Link>
            </CardContent>
          </Card>
        )}

        {items.map((job) => (
          <Link
            key={job.id}
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="block"
          >
            <Card className="hover:bg-accent/30 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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
            </Card>
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
