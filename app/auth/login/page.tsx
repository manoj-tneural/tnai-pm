'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('[Login Form] Submitting with email:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('[Login Form] Fetch completed, status:', response.status);
      const data = await response.json();
      console.log('[Login Form] Response body:', data);

      if (!response.ok) {
        console.log('[Login Form] Response not OK, showing error');
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      console.log('[Login Form] Login successful, attempting redirect');
      console.log('[Login Form] Using window.location.href to /dashboard');
      
      // Use simple redirect first
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      console.error('[Login Form] Catch error:', message, err);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-white text-2xl font-bold">TNAI Project Hub</h1>
          <p className="text-blue-300 text-sm mt-1">Thinkneural AI Internal Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-gray-900 text-xl font-semibold mb-6">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Work Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@tneuralai.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            New to TNAI?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
              Create account
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            Access restricted to @tneuralai.com accounts only
          </p>
        </div>
      </div>
    </div>
  );
}
