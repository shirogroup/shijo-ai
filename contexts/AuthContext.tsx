'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  planTier: string;
  emailVerified: boolean;
  isAdmin?: boolean;
}

interface Quota {
  // Daily quotas
  expansionsUsed: number;
  expansionsQuota: number;
  classificationsUsed: number;
  classificationsQuota: number;
  clustersUsed: number;
  clustersQuota: number;
  auditsUsed: number;
  auditsQuota: number;
  briefsUsed: number;
  briefsQuota: number;
  
  // Monthly quotas
  searchVolumeUsed: number;
  searchVolumeQuota: number;
  
  // Credits
  creditsBalance: number;
  
  // Timestamps
  lastReset: Date;
}

interface AuthContextType {
  user: User | null;
  quota: Quota | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, confirmPassword: string, name: string, acceptedTerms: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setQuota(data.quota);
        setError(null);
      } else {
        setUser(null);
        setQuota(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      setQuota(null);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Re-read the profile when this tab becomes visible again.
   *
   * WHY (bug found in live testing 2026-09-04): confirming an email opens the
   * link in a NEW tab. The verify route updates the database and redirects
   * that new tab — but the ORIGINAL dashboard tab still holds the React state
   * it fetched on mount, where emailVerified is false. So the "confirm your
   * email" notice and the bell dot stayed on screen after the user had already
   * confirmed, until they manually reloaded. The server was correct throughout:
   * /api/auth/me returned emailVerified: true immediately, and the response is
   * not cached (cache-control: public, max-age=0, must-revalidate). Only the
   * client was stale.
   *
   * This is deliberately generic rather than an email-verification special
   * case — the same staleness hits plan tier after an upgrade in another tab,
   * and quota after a generation elsewhere.
   *
   * Throttled: a user flicking between tabs must not fire a request per
   * switch. Nothing here touches sessions, tokens or credentials — it only
   * changes HOW OFTEN the client re-reads its own profile.
   */
  useEffect(() => {
    const MIN_INTERVAL_MS = 30_000;
    let lastAt = Date.now();

    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastAt < MIN_INTERVAL_MS) return;
      lastAt = now;
      fetchUser();
    };

    document.addEventListener('visibilitychange', maybeRefresh);
    window.addEventListener('focus', maybeRefresh);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.removeEventListener('focus', maybeRefresh);
    };
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setQuota(data.quota);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string, confirmPassword: string, name: string, acceptedTerms: boolean) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, confirmPassword, name, acceptedTerms }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setQuota(data.quota);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setQuota(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refetch = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        quota,
        loading,
        error,
        login,
        register,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
