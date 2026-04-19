import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  CloudUpload,
  Loader2,
  XCircle,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'failed'

interface RawFileDropzoneProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  statuses?: UploadStatus[]
  disabled?: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes.toString()} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function FileStatusIndicator({ status }: { status: UploadStatus }) {
  if (status === 'pending') {
    return (
      <span className="text-muted-foreground text-xs">Pending</span>
    )
  }
  if (status === 'uploading') {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Loader2 className="size-3 animate-spin" />
        Uploading
      </span>
    )
  }
  if (status === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="size-3.5" />
        Done
      </span>
    )
  }
  return (
    <span className="text-destructive flex items-center gap-1.5 text-xs">
      <XCircle className="size-3.5" />
      Failed
    </span>
  )
}

export function RawFileDropzone({
  files,
  onFilesChange,
  statuses,
  disabled = false,
}: RawFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    if (list.length > 0) {
      onFilesChange([...files, ...list])
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      addFiles(event.target.files)
    }
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={disabled ? (e) => e.preventDefault() : handleDrop}
        onDragOver={disabled ? (e) => e.preventDefault() : handleDragOver}
        onDragLeave={disabled ? (e) => e.preventDefault() : handleDragLeave}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-60 border-muted-foreground/25'
            : isDragging
              ? 'cursor-pointer border-primary bg-primary/5'
              : 'cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
      >
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <CloudUpload className="text-muted-foreground size-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Drag & drop raw files here</p>
          <p className="text-muted-foreground text-xs">or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => {
            const status = statuses?.[index]
            return (
              <div
                key={`${file.name}-${index.toString()}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className="truncate text-sm font-medium"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatBytes(file.size)}
                  </span>
                </div>
                {status && <FileStatusIndicator status={status} />}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      removeFile(index)
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
