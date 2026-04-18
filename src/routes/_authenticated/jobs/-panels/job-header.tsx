import { PageLayout } from '@/components/page-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useJobDetail } from '../-job-detail-context'

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

export function JobHeader({ children }: { children: ReactNode }) {
  const { job, jobQuery } = useJobDetail()
  const navigate = useNavigate()

  const title = job?.name ?? 'Analysis job'

  const actions = job ? (
    <Badge variant={statusVariant(job.status)}>
      {job.status.toLowerCase()}
    </Badge>
  ) : jobQuery.isLoading ? (
    <Skeleton className="h-6 w-20 rounded-full" />
  ) : null

  const middle = job ? (
    <span className="text-muted-foreground truncate text-xs">
      Created by {job.creator.name} · {formatDate(job.createdAt)}
      {job.finishedAt ? ` · finished ${formatDate(job.finishedAt) ?? ''}` : ''}
    </span>
  ) : jobQuery.isLoading ? (
    <Skeleton className="h-3 w-64" />
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
      {children}
    </PageLayout>
  )
}
