import { PageLayout } from '@/components/page-layout'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/patients/')({
  component: PatientsIndex,
})

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

  return (
    <PageLayout title="Your patients">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {!doctorId && <p>Not signed in</p>}
        {doctorId && currentUser.isLoading && <p>Loading...</p>}
        {doctorId && !currentUser.isLoading && !isDoctor && (
          <p>Not authorized</p>
        )}
        {isDoctor && patients.isLoading && <p>Loading...</p>}
        {isDoctor && patients.isError && <p>Error loading patients</p>}
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
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{patient.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {patient.email}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Joined {new Date(patient.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </PageLayout>
  )
}
