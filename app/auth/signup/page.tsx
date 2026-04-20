'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/types';

const roles = Object.entries(ROLE_LABELS) as [string, string][];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'engineer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!form.email.endsWith('@tneuralai.com')) {
      setError('Only @tneuralai.com email addresses can register.');
      return;
    }
    
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.name,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Token is automatically set as httpOnly cookie by the API
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          <p className="text-blue-300 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-gray-900 text-xl font-semibold mb-6">Create account</h2>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Your name" value={form.name}
                onChange={e => update('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Work Email</label>
              <input type="email" className="input" placeholder="you@tneuralai.com" value={form.email}
                onChange={e => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Your Role</label>
              <select className="select" value={form.role} onChange={e => update('role', e.target.value)}>
                {roles.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password}
                onChange={e => update('password', e.target.value)} required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat password" value={form.confirm}
                onChange={e => update('confirm', e.target.value)} required />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            Restricted to @tneuralai.com email addresses only
          </p>
        </div>
      </div>
    </div>
  );
}
