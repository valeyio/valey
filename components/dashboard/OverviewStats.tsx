import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { CheckSquare, UserPlus, Calendar, Users } from 'lucide-react'

type StatCardProps = {
  title: string
  value: number | string
  icon: React.ReactNode
  description?: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="rounded-lg bg-gray-800 p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="rounded-full bg-gray-700 p-2 text-[#FAD92D]">
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-semibold text-white">{value}</div>
        {description && (
          <div className="mt-1 text-xs text-gray-400">{description}</div>
        )}
      </div>
    </div>
  )
}

export default function OverviewStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    personalTasks: 0,
    delegatedTasks: 0,
    nextInvoice: 'No upcoming invoices',
    onlineTeamMembers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Use mock data instead of Supabase
        setTimeout(() => {
          setStats({
            personalTasks: 5,
            delegatedTasks: 3,
            nextInvoice: new Date(
              Date.now() + 86400000 * 7
            ).toLocaleDateString(), // 7 days from now
            onlineTeamMembers: 2,
          })
          setIsLoading(false)
        }, 800) // simulate network delay
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-800 p-5 shadow-md"
          >
            <div className="h-4 w-1/2 rounded bg-gray-700"></div>
            <div className="mt-4 h-6 w-1/3 rounded bg-gray-700"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Personal Tasks"
        value={stats.personalTasks}
        icon={<CheckSquare className="h-5 w-5" />}
        description="Tasks assigned to you"
      />
      <StatCard
        title="Delegated Tasks"
        value={stats.delegatedTasks}
        icon={<UserPlus className="h-5 w-5" />}
        description="Tasks assigned to team"
      />
      <StatCard
        title="Upcoming Invoice"
        value={stats.nextInvoice}
        icon={<Calendar className="h-5 w-5" />}
        description="Next payment due"
      />
      <StatCard
        title="Team Online"
        value={stats.onlineTeamMembers}
        icon={<Users className="h-5 w-5" />}
        description="Team members online now"
      />
    </div>
  )
}
