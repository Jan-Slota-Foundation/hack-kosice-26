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

  if (!doctorId) return <div className="p-3">Not signed in</div>
  if (currentUser.isLoading) return <div className="p-3">Loading...</div>
  if (!isDoctor) return <div className="p-3">Not authorized</div>
  if (patients.isLoading) return <div className="p-3">Loading...</div>
  if (patients.isError)
    return <div className="p-3">Error loading patients</div>

  return (
    <div className="flex flex-col gap-4 p-3">
      <h1 className="text-xl font-semibold">Your patients</h1>
      {patients.data?.patients.length === 0 && (
        <div className="text-muted-foreground text-sm">
          No patients assigned to you yet.
        </div>
      )}
      {patients.data?.patients.map((patient) => (
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
  )
}
