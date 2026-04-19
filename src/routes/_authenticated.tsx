import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (import.meta.env.DEV) return
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router idiom: throw redirect() is how route guards navigate
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="relative z-10 flex h-12 items-center gap-2 border-b bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.18),transparent_60%),radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.14),transparent_65%),linear-gradient(to_right,rgba(99,102,241,0.08),transparent_70%)] px-3">
          <SidebarTrigger />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
