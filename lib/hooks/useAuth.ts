'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'management' | 'project_manager' | 'engineer' | 'testing' | 'sales';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // The middleware and cookies handle auth, but we can verify with a protected endpoint
        // For now, we'll assume the middleware has done its job
        // In a real app, you might have a /api/auth/me endpoint
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth check failed');
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function logout() {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      setError(null);
      router.push('/auth/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }

  const value = { user, loading, error, logout };
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
