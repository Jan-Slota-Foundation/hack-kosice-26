import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CloudUpload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const ACCEPT = '.bmp,image/bmp,image/x-ms-bmp'

function isBmp(file: File) {
  return (
    file.type === 'image/bmp' ||
    file.type === 'image/x-ms-bmp' ||
    file.name.toLowerCase().endsWith('.bmp')
  )
}

interface UploadItem {
  file: File
  url: string
}

interface BmpDropzoneProps {
  onItemsChange?: (files: File[]) => void
}

export function BmpDropzone({ onItemsChange }: BmpDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])

  const itemsRef = useRef<UploadItem[]>(items)
  useEffect(() => {
    itemsRef.current = items
    onItemsChange?.(items.map((i) => i.file))
  }, [items, onItemsChange])
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => {
        URL.revokeObjectURL(i.url)
      })
    },
    [],
  )

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    const accepted = list.filter(isBmp)
    const rejected = list.length - accepted.length
    if (rejected > 0) {
      toast.error(
        `${rejected.toString()} file${rejected === 1 ? '' : 's'} rejected — only .bmp files are allowed`,
      )
    }
    if (accepted.length > 0) {
      const newItems: UploadItem[] = accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }))
      setItems((prev) => [...prev, ...newItems])
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
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
      >
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <CloudUpload className="text-muted-foreground size-6" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Drag & drop .bmp files here</p>
          <p className="text-muted-foreground text-xs">or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <Card key={`${item.file.name}-${index.toString()}`} size="sm">
              <img
                src={item.url}
                alt={item.file.name}
                className="aspect-square w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <CardHeader>
                <CardTitle className="min-w-0 truncate" title={item.file.name}>
                  {item.file.name}
                </CardTitle>
                <CardDescription>
                  {(item.file.size / 1024).toFixed(1)} KB
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      removeFile(index)
                    }}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="size-3" />
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
