import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function ContentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-gray-800/50 rounded-full p-6 mb-6">
        <FileText className="w-12 h-12 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Content Management</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        A content library to manage, organize, and track your generated content is coming soon.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Start creating content now with our AI tools:
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard/tools/content-idea-generator"
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Content Idea Generator
        </Link>
        <Link
          href="/dashboard/tools/seo-content-brief"
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          SEO Content Brief
        </Link>
      </div>
    </div>
  );
}
