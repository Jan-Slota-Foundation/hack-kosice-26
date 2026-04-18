import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  onBack?: () => void
  middle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function PageLayout({
  title,
  onBack,
  middle,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-4 px-4 pt-6 pb-2">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={onBack}
              aria-label="Go back"
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <h1 className="truncate text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {middle ?? null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  )
}
