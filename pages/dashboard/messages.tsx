import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/lib/AuthContext'

export default function MessagesPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

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

  const firstName = profile?.first_name || user.email?.split('@')[0] || 'User'

  return (
    <DashboardLayout userName={firstName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="mt-2 text-muted-foreground">
            Communicate with your team and clients
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-md">
          <p className="text-muted-foreground">
            Messages functionality coming soon...
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
