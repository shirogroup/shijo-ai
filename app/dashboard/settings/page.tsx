'use client';

import { Settings, User, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences.</p>
      </div>

      {/* Profile section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <p className="text-white">{user?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <p className="text-white">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Plan</label>
            <p className="text-white capitalize">{user?.planTier || 'Free'}</p>
          </div>
        </div>
      </div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-white">Email Preferences</h2>
          </div>
          <p className="text-sm text-gray-500">
            Notification and email preferences coming soon.
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-white">Security</h2>
          </div>
          <p className="text-sm text-gray-500">
            Password changes and two-factor authentication coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
