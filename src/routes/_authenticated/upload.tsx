import { BmpDropzone } from '@/components/bmp-dropzone'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/upload')({
  component: UploadPage,
})

function UploadPage() {
  const filesRef = useRef<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadRaw = trpc.bytemaps.uploadRaw.useMutation()

  const handleItemsChange = useCallback((files: File[]) => {
    filesRef.current = files
  }, [])

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const files = filesRef.current
    if (files.length === 0) {
      toast.error('No files selected')
      return
    }

    setIsUploading(true)
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer()
        return uploadRaw.mutateAsync({
          filename: file.name,
          contentType: file.type || 'image/bmp',
          data: new Uint8Array(buffer),
        })
      }),
    )
    setIsUploading(false)

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.length - succeeded

    if (succeeded > 0) {
      toast.success(
        `Uploaded ${succeeded.toString()} file${succeeded === 1 ? '' : 's'}`,
      )
    }
    if (failed > 0) {
      toast.error(
        `Failed to upload ${failed.toString()} file${failed === 1 ? '' : 's'}`,
      )
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-3">
      <form
        onSubmit={(e) => {
          void handleSubmit(e)
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Upload tear images</CardTitle>
            <CardDescription>
              Only .bmp (bitmap) files are accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BmpDropzone onItemsChange={handleItemsChange} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Upload for analysis'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
