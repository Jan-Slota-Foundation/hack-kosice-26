import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import z from 'zod'

import { JobDetailProvider } from './-job-detail-context'
import { JobHeader } from './-panels/job-header'
import { JobLeftPanel } from './-panels/job-left-panel'
import { JobRightPanel } from './-panels/job-right-panel'

const searchSchema = z.object({
  imageId: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/jobs/$jobId')({
  validateSearch: searchSchema,
  component: JobDetail,
})

function JobDetail() {
  const { jobId } = Route.useParams()
  const { imageId } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const handleSelectImage = useCallback(
    (id: string) => {
      void navigate({ search: (prev) => ({ ...prev, imageId: id }) })
    },
    [navigate],
  )

  return (
    <JobDetailProvider
      jobId={jobId}
      imageIdFromUrl={imageId ?? null}
      onSelectImage={handleSelectImage}
    >
      <JobHeader>
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[55%_45%]">
            <JobLeftPanel />
            <JobRightPanel />
          </div>
        </div>
      </JobHeader>
    </JobDetailProvider>
  )
}
