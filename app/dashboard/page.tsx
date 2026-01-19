import { StatsCards } from '@/components/dashboard/StatsCards';

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your SEO overview.
        </p>
      </div>
      <StatsCards />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            No recent activity. Start by adding keywords!
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">
            Add keywords, create clusters, or generate briefs.
          </p>
        </div>
      </div>
    </div>
  );
}
// Dashboard added
