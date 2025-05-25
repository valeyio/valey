import * as React from 'react'
import {
  Home,
  CheckSquare,
  Target,
  MessageCircle,
  Users,
  Briefcase,
  HelpCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/AuthContext'

import { NavMain } from '@/components/components/nav-main'
import { NavUser } from '@/components/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/components/ui/sidebar'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { user, profile } = useAuth()

  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'User'

  const data = {
    user: {
      name: firstName,
      email: user?.email || '',
      avatar: profile?.avatar_url || '/images/valey-icon-white.png',
    },
    navMain: [
      {
        title: 'Home',
        url: '/dashboard/app',
        icon: Home,
        isActive: router.pathname === '/dashboard/app',
      },
      {
        title: 'Tasks',
        url: '/dashboard/tasks',
        icon: CheckSquare,
        isActive: router.pathname === '/dashboard/tasks',
      },
      {
        title: 'Goals',
        url: '/dashboard/goals',
        icon: Target,
        isActive: router.pathname === '/dashboard/goals',
      },
      {
        title: 'Messages',
        url: '/dashboard/messages',
        icon: MessageCircle,
        isActive: router.pathname === '/dashboard/messages',
      },
      {
        title: 'Team',
        url: '/dashboard/team',
        icon: Users,
        isActive: router.pathname === '/dashboard/team',
      },
      {
        title: 'Partners',
        url: '/dashboard/partners',
        icon: Briefcase,
        isActive: router.pathname === '/dashboard/partners',
      },
      {
        title: 'Help Desk',
        url: '/dashboard/help',
        icon: HelpCircle,
        isActive: router.pathname === '/dashboard/help',
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <Image
              src="/images/valey-icon-white.png"
              alt="Valey Logo"
              width={40}
              height={40}
              className="mx-auto"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
