import { PageLayout } from '@/components/page-layout'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/patients/')({
  component: PatientsIndex,
})

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}`
}

function PatientCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PatientsIndex() {
  const auth = useAuth()
  const doctorId = auth.user?.id

  const currentUser = trpc.user.getUserById.useQuery(
    { id: doctorId ?? '' },
    { enabled: Boolean(doctorId) },
  )
  const isDoctor = currentUser.data?.user.role === 'DOCTOR'

  const patients = trpc.user.listPatientsByDoctorId.useQuery(
    { doctorId: doctorId ?? '' },
    { enabled: Boolean(doctorId) && isDoctor },
  )

  const showSkeletons =
    Boolean(doctorId) &&
    (currentUser.isLoading || (isDoctor && patients.isLoading))

  return (
    <PageLayout title="Your patients">
      {!doctorId && <p>Not signed in</p>}
      {doctorId && !currentUser.isLoading && !isDoctor && (
        <p>Not authorized</p>
      )}
      {isDoctor && patients.isError && <p>Error loading patients</p>}

      {showSkeletons &&
        [0, 1, 2, 3].map((i) => <PatientCardSkeleton key={i} />)}

      {isDoctor &&
        patients.isSuccess &&
        patients.data.patients.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No patients assigned to you yet.
              </p>
            </CardContent>
          </Card>
        )}
      {isDoctor &&
        patients.data?.patients.map((patient) => (
          <Card key={patient.id}>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage
                    src={avatarUrl(patient.id)}
                    alt={patient.name}
                  />
                  <AvatarFallback>{initials(patient.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{patient.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {patient.email}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Joined {new Date(patient.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </PageLayout>
  )
}
