import type { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, actions, children }: PageLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 px-8 py-6">
        <h1 className="truncate text-2xl font-semibold">{title}</h1>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  )
}
