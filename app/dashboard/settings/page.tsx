'use client';

import { useState } from 'react';
import { Settings, User, Mail, Shield, Download, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/account/export', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shijo-ai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      await logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

      {/* Data & Privacy */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Data &amp; Privacy</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Under GDPR, CCPA, and similar privacy laws, you have the right to a copy of your
          data and the right to delete your account. See our{' '}
          <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>{' '}
          for details.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Export your data</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Download everything tied to your account — profile, tool outputs, usage history,
              and billing records — as a JSON file.
            </p>
            {exportError && <p className="text-xs text-red-400 mb-2">{exportError}</p>}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {exporting ? 'Preparing export…' : 'Export my data'}
            </button>
          </div>

          <div className="flex-1 border border-red-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white">Delete your account</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Permanently deletes your account, all tool data, and cancels any active
              subscription. This cannot be undone.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="text-sm px-4 py-2 rounded-lg border border-red-900 text-red-400 hover:bg-red-950/40 transition-colors"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Delete account</h3>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="text-gray-500 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              This permanently deletes your account, all keywords, generated content, usage
              history, and cancels any active subscription. This action cannot be undone.
            </p>

            <label className="block text-xs text-gray-500 mb-1">Enter your password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
              placeholder="Password"
            />

            <label className="block text-xs text-gray-500 mb-1">
              Type <span className="font-mono text-white">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-600"
              placeholder="DELETE"
            />

            {deleteError && <p className="text-xs text-red-400 mb-4">{deleteError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
