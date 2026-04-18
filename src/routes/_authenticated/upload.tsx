import { RawFileDropzone } from '@/components/raw-file-dropzone'
import { InputField } from '@/components/input-field'
import { PageLayout } from '@/components/page-layout'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/upload')({
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const createJob = trpc.analysisJobs.create.useMutation()
  const uploadRaw = trpc.bytemaps.uploadRawToJob.useMutation()
  const markError = trpc.analysisJobs.markError.useMutation()

  const trimmedName = name.trim()
  const canSubmit = trimmedName.length > 0 && files.length > 0 && !isUploading

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

    setIsUploading(true)
    try {
      const { jobId } = await createJob.mutateAsync({
        name: trimmedName,
      })

      const results = await Promise.allSettled(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer()
          return uploadRaw.mutateAsync({
            jobId,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            data: new Uint8Array(buffer),
          })
        }),
      )

      const failures = results.filter((r) => r.status === 'rejected')
      const succeeded = results.length - failures.length

      if (failures.length > 0) {
        const firstError = failures[0]
        const reason =
          firstError.reason instanceof Error
            ? firstError.reason.message
            : String(firstError.reason)
        await markError.mutateAsync({
          id: jobId,
          message: `${failures.length.toString()} of ${results.length.toString()} uploads failed: ${reason}`,
        })
        toast.error(
          `Job created with ${succeeded.toString()} of ${results.length.toString()} files (marked as error)`,
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
        <RawFileDropzone files={files} onFilesChange={setFiles} />
        <div>
          <Button type="submit" disabled={!canSubmit}>
            {isUploading ? 'Uploading…' : 'Create analysis job'}
          </Button>
        </div>
      </form>
    </PageLayout>
  )
}
