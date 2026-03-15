import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-gray-800/50 rounded-full p-6 mb-6">
        <BarChart3 className="w-12 h-12 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        Track your tool usage, content performance, and generation trends. Analytics dashboard coming soon.
      </p>
      <Link
        href="/dashboard/tools"
        className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Browse AI Tools
      </Link>
    </div>
  );
}
