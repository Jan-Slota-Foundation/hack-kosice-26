import { AfmSurfaceViewer } from '@/components/afm-surface-viewer'

import { useJobDetail } from '../-job-detail-context'
import { AfmSurfaceSkeleton } from './skeletons'

export function JobLeftPanel() {
  const { jobQuery, images, selectedImageId } = useJobDetail()

  return (
    <div className="relative h-[60vh] lg:h-full">
      {jobQuery.isLoading ? (
        <AfmSurfaceSkeleton />
      ) : jobQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
          <p className="font-medium">Failed to load job</p>
          <p className="mt-1 opacity-90">{jobQuery.error.message}</p>
        </div>
      ) : images.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">
          No files attached to this job.
        </p>
      ) : selectedImageId ? (
        <AfmSurfaceViewer rawImageId={selectedImageId} />
      ) : (
        <p className="text-muted-foreground p-4 text-sm">No file selected.</p>
      )}
    </div>
  )
}
