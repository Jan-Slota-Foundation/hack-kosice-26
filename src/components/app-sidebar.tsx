import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth-context'
import { trpc } from '@/lib/trpc'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ClipboardList, LogOut, Plus, Users } from 'lucide-react'

const navItems = [
  { to: '/jobs', label: 'Analysis jobs', icon: ClipboardList },
] as const

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`)

  const currentUser = trpc.user.getUserById.useQuery(
    { id: user?.id ?? '' },
    { enabled: Boolean(user?.id) },
  )
  const isDoctor = currentUser.data?.user.role === 'DOCTOR'

  const handleSignOut = async () => {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar size="sm">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm group-data-[collapsible=icon]:hidden">
            {email}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="New analysis"
                  render={<Link to="/upload" />}
                  className="bg-primary primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground text-center text-black"
                >
                  <Plus />
                  <span>New analysis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="my-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    tooltip={label}
                    isActive={isActive(to)}
                    render={<Link to={to} />}
                    className="text-sidebar-foreground/60 data-active:text-sidebar-foreground"
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isDoctor && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Patients"
                    isActive={isActive('/patients')}
                    render={<Link to="/patients" />}
                    className="text-sidebar-foreground/60 data-active:text-sidebar-foreground"
                  >
                    <Users />
                    <span>Patients</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => void handleSignOut()}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
