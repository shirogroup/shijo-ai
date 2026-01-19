import { StatsCards } from '@/components/dashboard/StatsCards';
export default function DashboardOverview() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <StatsCards />
      <div className="bg-white p-6 rounded-lg border mt-6">
        <h3 className="font-semibold mb-2">Welcome to SHIJO.ai</h3>
        <p className="text-gray-600">Your SEO automation platform</p>
      </div>
    </div>
  );
}
