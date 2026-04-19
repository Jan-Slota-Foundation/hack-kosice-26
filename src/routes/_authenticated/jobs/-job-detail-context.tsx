import { trpc } from '@/lib/trpc'
import type { inferRouterOutputs } from '@trpc/server'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import type { AppRouter } from '../../../../server/router'

type JobDetailQuery = ReturnType<typeof trpc.analysisJobs.getById.useQuery>
type RouterOutputs = inferRouterOutputs<AppRouter>
type JobData = RouterOutputs['analysisJobs']['getById']['job']
type JobImage = JobData['images'][number]

export interface JobDetailContextValue {
  jobId: string
  jobQuery: JobDetailQuery
  job: JobData | null
  images: JobImage[]
  selectedImageId: string | null
  selectedImage: JobImage | null
  setSelectedImageId: (id: string) => void
}

const JobDetailContext = createContext<JobDetailContextValue | null>(null)

export function useJobDetail(): JobDetailContextValue {
  const ctx = useContext(JobDetailContext)
  if (!ctx)
    throw new Error('useJobDetail must be used within a JobDetailProvider')
  return ctx
}

interface JobDetailProviderProps {
  jobId: string
  imageIdFromUrl: string | null
  onSelectImage: (id: string) => void
  children: ReactNode
}

export function JobDetailProvider({
  jobId,
  imageIdFromUrl,
  onSelectImage,
  children,
}: JobDetailProviderProps) {
  const jobQuery = trpc.analysisJobs.getById.useQuery({ id: jobId })

  const value = useMemo<JobDetailContextValue>(() => {
    const job = jobQuery.data?.job ?? null
    const images = job?.images ?? []
    const firstImageId = images[0]?.id ?? null

    const urlImageExists =
      imageIdFromUrl !== null && images.some((img) => img.id === imageIdFromUrl)
    const selectedImageId = urlImageExists ? imageIdFromUrl : firstImageId

    const selectedImage =
      images.find((img) => img.id === selectedImageId) ?? null

    return {
      jobId,
      jobQuery,
      job,
      images,
      selectedImageId,
      selectedImage,
      setSelectedImageId: onSelectImage,
    }
  }, [jobId, jobQuery, imageIdFromUrl, onSelectImage])

  return (
    <JobDetailContext.Provider value={value}>
      {children}
    </JobDetailContext.Provider>
  )
}
