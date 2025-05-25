import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/AuthContext'
import { AppSidebar } from '@/components/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/components/ui/breadcrumb'
import { Separator } from '@/components/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/components/ui/sidebar'

type DashboardLayoutProps = {
  children: ReactNode
  userName?: string
}

// Helper function to get page title from pathname
const getPageTitle = (pathname: string): string => {
  const pathMap: { [key: string]: string } = {
    '/dashboard/app': 'Home',
    '/dashboard/tasks': 'Tasks',
    '/dashboard/goals': 'Goals',
    '/dashboard/messages': 'Messages',
    '/dashboard/team': 'Team',
    '/dashboard/partners': 'Partners',
    '/dashboard/billing': 'Billing',
    '/dashboard/help': 'Help Desk',
  }
  return pathMap[pathname] || 'Dashboard'
}

export default function DashboardLayout({
  children,
  userName = 'User',
}: DashboardLayoutProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="dark">
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#FAD92D]"></div>
            <p className="mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  const pageTitle = getPageTitle(router.pathname)

  return (
    <div className="dark">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard/app">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
