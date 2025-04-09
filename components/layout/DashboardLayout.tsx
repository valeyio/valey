import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/AuthContext'
import {
  Menu,
  X,
  Home,
  CheckSquare,
  Target,
  MessageCircle,
  Users,
  Briefcase,
  CreditCard,
  HelpCircle,
  LogOut,
} from 'lucide-react'

type DashboardLayoutProps = {
  children: ReactNode
  userName?: string
}

export default function DashboardLayout({
  children,
  userName = 'User',
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    {
      title: 'Home',
      icon: <Home className="h-5 w-5" />,
      path: '/dashboard/app',
    },
    {
      title: 'Tasks',
      icon: <CheckSquare className="h-5 w-5" />,
      path: '/dashboard/tasks',
    },
    {
      title: 'Goals',
      icon: <Target className="h-5 w-5" />,
      path: '/dashboard/goals',
    },
    {
      title: 'Messages',
      icon: <MessageCircle className="h-5 w-5" />,
      path: '/dashboard/messages',
    },
    {
      title: 'Team',
      icon: <Users className="h-5 w-5" />,
      path: '/dashboard/team',
    },
    {
      title: 'Partners',
      icon: <Briefcase className="h-5 w-5" />,
      path: '/dashboard/partners',
    },
    {
      title: 'Billing',
      icon: <CreditCard className="h-5 w-5" />,
      path: '/dashboard/billing',
    },
    {
      title: 'Help Desk',
      icon: <HelpCircle className="h-5 w-5" />,
      path: '/dashboard/help',
    },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile sidebar toggle */}
      <div className="fixed left-4 top-4 z-40 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-gray-300 hover:bg-gray-800 focus:outline-none"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-800 transition duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-700">
          <div className="text-xl font-bold text-white">
            <span className="text-[#FAD92D]">Valey</span> Dashboard
          </div>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.path}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  router.pathname === item.path
                    ? 'bg-gray-900 text-[#FAD92D]'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="mr-3">{item.icon}</div>
                {item.title}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Navigation */}
        <header className="flex h-16 items-center justify-end bg-gray-800 px-4 shadow">
          <div className="relative">
            <div className="group relative flex cursor-pointer items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Hi, {userName}</span>
                <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-600">
                  {/* Placeholder avatar */}
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white">
                    {userName.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="absolute right-0 top-full mt-2 hidden w-48 origin-top-right rounded-md bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none group-hover:block">
                <div className="py-1">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                  >
                    Your Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                  >
                    Settings
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-600"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-900 p-6">{children}</main>
      </div>
    </div>
  )
}
