import { Card, CardHeader } from '@/components/ui/card'
import {
  GradientCard,
  GradientCardContent,
  GradientCardHeader,
} from '@/components/ui/gradient-card'
import { Skeleton } from '@/components/ui/skeleton'

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
      <div className="overflow-hidden">
        <div className="-ml-4 flex">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-0 shrink-0 grow-0 basis-2/3 pl-4"
            >
              <GradientCard className="aspect-video">
                <GradientCardHeader className="gap-2">
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

export function FilesListSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <div className="flex flex-col gap-2 px-6 pb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </Card>
  )
}
