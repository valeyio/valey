import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OverviewStats from '@/components/dashboard/OverviewStats'
import QuoteCarousel from '@/components/dashboard/QuoteCarousel'
import AskValeyAI from '@/components/dashboard/AskValeyAI'
import { useAuth } from '@/lib/AuthContext'

export default function DashboardHome() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#FAD92D]"></div>
          <p className="mt-4">Loading...</p>
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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-2 text-gray-400">Here's what's happening today</p>
        </div>

        {/* Stats Cards */}
        <OverviewStats />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quote Carousel */}
          <QuoteCarousel />

          {/* Ask Valey AI */}
          <AskValeyAI />
        </div>
      </div>
    </DashboardLayout>
  )
}
