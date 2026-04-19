import {
  RawFileDropzone,
  type UploadStatus,
} from '@/components/raw-file-dropzone'
import { InputField } from '@/components/input-field'
import { PageLayout } from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { useAuth } from '@/lib/auth-context'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

const UPLOAD_CONCURRENCY = 3

export const Route = createFileRoute('/_authenticated/upload')({
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const currentUser = trpc.user.getUserById.useQuery(
    { id: user?.id ?? '' },
    { enabled: Boolean(user?.id) },
  )
  const role = currentUser.data?.user.role
  const isDoctor = role === 'DOCTOR'

  const patientsQuery = trpc.user.listPatientsByDoctorId.useQuery(
    { doctorId: user?.id ?? '' },
    { enabled: Boolean(user?.id) && isDoctor },
  )

  const effectivePatientId = isDoctor ? patientId : (user?.id ?? '')

  const createJob = trpc.analysisJobs.create.useMutation()
  const uploadRaw = trpc.bytemaps.uploadRawToJob.useMutation()
  const markError = trpc.analysisJobs.markError.useMutation()

  const trimmedName = name.trim()
  const canSubmit =
    trimmedName.length > 0 &&
    files.length > 0 &&
    effectivePatientId.length > 0 &&
    !isUploading

  const handleFilesChange = (next: File[]) => {
    setFiles(next)
    setUploadStatuses([])
  }

  const setStatusAt = (index: number, status: UploadStatus) => {
    setUploadStatuses((prev: UploadStatus[]) =>
      prev.map((s, i) => (i === index ? status : s)),
    )
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (files.length === 0) {
      toast.error('No files selected')
      return
    }
    if (trimmedName.length === 0) {
      toast.error('Please name this job')
      return
    }

    if (effectivePatientId.length === 0) {
      toast.error('Please select a patient')
      return
    }

    setIsUploading(true)
    setUploadStatuses(files.map(() => 'pending'))
    try {
      const { jobId } = await createJob.mutateAsync({
        name: trimmedName,
        patientId: effectivePatientId,
      })

      const failures: { index: number; reason: unknown }[] = []
      let cursor = 0
      const total = files.length

      const worker = async () => {
        let index = cursor++
        while (index < total) {
          const file = files[index]
          setStatusAt(index, 'uploading')
          try {
            const buffer = await file.arrayBuffer()
            await uploadRaw.mutateAsync({
              jobId,
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
              data: new Uint8Array(buffer),
            })
            setStatusAt(index, 'done')
          } catch (err) {
            setStatusAt(index, 'failed')
            failures.push({ index, reason: err })
          }
          index = cursor++
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, total) }, worker),
      )

      const succeeded = total - failures.length

      if (failures.length > 0) {
        const firstError = failures[0]
        const reason =
          firstError.reason instanceof Error
            ? firstError.reason.message
            : String(firstError.reason)
        await markError.mutateAsync({
          id: jobId,
          message: `${failures.length.toString()} of ${total.toString()} uploads failed: ${reason}`,
        })
        toast.error(
          `Job created with ${succeeded.toString()} of ${total.toString()} files (marked as error)`,
        )
      } else {
        toast.success(
          `Job "${trimmedName}" created with ${succeeded.toString()} file${succeeded === 1 ? '' : 's'}`,
        )
      }

      await navigate({ to: '/jobs/$jobId', params: { jobId } })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create analysis job',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <PageLayout title="New analysis job">
      <form
        className="mx-auto flex max-w-4xl flex-col gap-4"
        onSubmit={(e) => {
          void handleSubmit(e)
        }}
      >
        <p className="text-muted-foreground text-sm">
          Name your job and upload raw files to analyse.
        </p>
        <InputField
          label="Job name"
          placeholder="e.g. Batch 42 – left eye"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
          }}
          maxLength={200}
          disabled={isUploading}
        />
        {isDoctor && (
          <Field>
            <FieldLabel>Patient</FieldLabel>
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value)
              }}
              disabled={isUploading || patientsQuery.isLoading}
              className={cn(
                'border-input bg-input/20 focus-visible:border-ring focus-visible:ring-ring/30 dark:bg-input/30 h-7 w-full min-w-0 rounded-md border px-2 py-0.5 text-sm transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs/relaxed',
              )}
            >
              <option value="">
                {patientsQuery.isLoading
                  ? 'Loading patients…'
                  : patientsQuery.data?.patients.length === 0
                    ? 'No patients assigned'
                    : 'Select a patient'}
              </option>
              {patientsQuery.data?.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.email}
                </option>
              ))}
            </select>
          </Field>
        )}
        <RawFileDropzone
          files={files}
          onFilesChange={handleFilesChange}
          statuses={uploadStatuses}
          disabled={isUploading}
        />
        <div>
          <Button type="submit" disabled={!canSubmit}>
            {isUploading ? 'Uploading…' : 'Create analysis job'}
          </Button>
        </div>
      </form>
    </PageLayout>
  )
}
