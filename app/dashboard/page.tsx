import { StatsCards } from '@/components/dashboard/StatsCards';

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here is your SEO overview.</p>
      </div>
      <StatsCards />
    </div>
  );
}
