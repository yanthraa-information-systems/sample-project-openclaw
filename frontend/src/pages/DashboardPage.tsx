import { useQuery } from '@tanstack/react-query'
import { Users, FolderKanban, FileText, MessageSquare } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActivityBarChart, TokenUsageChart } from '@/components/dashboard/Charts'
import { PageSpinner } from '@/components/ui/Spinner'
import { dashboardService } from '@/services/dashboardService'
import { QUERY_KEYS } from '@/utils/constants'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 30000,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={stats?.total_users ?? 0}
                icon={Users}
                color="blue"
                trend={{ value: 12, label: 'this month' }}
              />
              <StatsCard
                title="Projects"
                value={stats?.total_projects ?? 0}
                icon={FolderKanban}
                color="emerald"
                trend={{ value: 8, label: 'this month' }}
              />
              <StatsCard
                title="Documents"
                value={stats?.total_documents ?? 0}
                icon={FileText}
                color="purple"
                trend={{ value: 24, label: 'this month' }}
              />
              <StatsCard
                title="Messages"
                value={stats?.total_messages ?? 0}
                icon={MessageSquare}
                color="orange"
                trend={{ value: 31, label: 'this month' }}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ActivityBarChart />
              <TokenUsageChart />
            </div>

            {/* Quick start */}
            <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'New Chat', href: '/chat', color: 'bg-brand-500/15 text-brand-400' },
                  { label: 'Upload Document', href: '/documents', color: 'bg-purple-500/15 text-purple-400' },
                  { label: 'Create Project', href: '/projects', color: 'bg-emerald-500/15 text-emerald-400' },
                  { label: 'Run Agent', href: '/agent', color: 'bg-orange-500/15 text-orange-400' },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className={`flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all hover:opacity-80 ${action.color}`}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
