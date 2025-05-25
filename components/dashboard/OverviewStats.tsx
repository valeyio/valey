import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Target, TrendingUp, Calendar, Users } from 'lucide-react'

type StatCardProps = {
  title: string
  value: number | string
  icon: React.ReactNode
  description?: string
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="rounded-full bg-muted p-2 text-[#FAD92D]">{icon}</div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-semibold text-card-foreground">
          {value}
        </div>
        {description && (
          <div className="mt-1 text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OverviewStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activeGoals: 0,
    monthlyGrowth: '12%',
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
            activeGoals: 3,
            monthlyGrowth: '12%',
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
            className="h-24 animate-pulse rounded-lg border bg-card p-5 shadow-md"
          >
            <div className="h-4 w-1/2 rounded bg-muted"></div>
            <div className="mt-4 h-6 w-1/3 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Goals"
        value={stats.activeGoals}
        icon={<Target className="h-5 w-5" />}
        description="Goals in progress"
      />
      <StatCard
        title="Monthly Growth"
        value={stats.monthlyGrowth}
        icon={<TrendingUp className="h-5 w-5" />}
        description="Business growth rate"
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
