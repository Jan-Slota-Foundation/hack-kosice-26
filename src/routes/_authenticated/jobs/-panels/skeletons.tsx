import {
  GradientCard,
  GradientCardContent,
  GradientCardHeader,
} from '@/components/ui/gradient-card'
import { Skeleton } from '@/components/ui/skeleton'

export function DiagnosisSkeleton() {
  return (
    <GradientCard className="w-full">
      <GradientCardHeader className="gap-2">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </GradientCardHeader>
      <GradientCardContent>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="mt-2 h-2 w-full rounded-full" />
      </GradientCardContent>
    </GradientCard>
  )
}

export function AfmSurfaceSkeleton() {
  return (
    <GradientCard className="relative h-full w-full gap-0 overflow-hidden py-0">
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
    </GradientCard>
  )
}

export function ChartsGridSkeleton() {
  return (
    <div className="relative">
      <div className="mb-2 flex justify-end gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <div className="overflow-hidden">
        <div className="-ml-4 flex py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-0 shrink-0 grow-0 basis-2/3 pl-4"
            >
              <GradientCard className="h-56">
                <GradientCardHeader>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </GradientCardHeader>
                <GradientCardContent className="min-h-0 flex-1 px-2 pb-2">
                  <Skeleton className="h-full w-full" />
                </GradientCardContent>
              </GradientCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClassificationTasksSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-md border p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FilesListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="size-8" />
          </div>
        </div>
      ))}
    </div>
  )
}
