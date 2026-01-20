'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  planTier: string;
  emailVerified: boolean;
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
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
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

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
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
