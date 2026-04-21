'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  userId: string;
  existingLog: { id: string; yesterday: string | null; today: string | null; blockers: string | null } | null;
  today: string;
}

export default function DailyLogForm({ productId, userId, existingLog, today }: Props) {
  const [form, setForm] = useState({
    yesterday: existingLog?.yesterday ?? '',
    today: existingLog?.today ?? '',
    blockers: existingLog?.blockers ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = existingLog ? `/api/daily-logs/${existingLog.id}` : '/api/daily-logs';
      const method = existingLog ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          user_id: userId,
          log_date: today,
          yesterday: form.yesterday || null,
          today: form.today || null,
          blockers: form.blockers || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save log');
      }

      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save log');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">✅ What did I complete yesterday?</label>
        <textarea className="textarea" rows={2} placeholder="Completed tasks, PRs merged, meetings..."
          value={form.yesterday} onChange={e => setForm(f => ({ ...f, yesterday: e.target.value }))} />
      </div>
      <div>
        <label className="label">🎯 What am I working on today?</label>
        <textarea className="textarea" rows={2} placeholder="Tasks planned, features in progress..."
          value={form.today} onChange={e => setForm(f => ({ ...f, today: e.target.value }))} required />
      </div>
      <div>
        <label className="label">🚧 Any blockers? (leave blank if none)</label>
        <textarea className="textarea" rows={2} placeholder="Blockers, dependencies, waiting on..."
          value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} />
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : saved ? '✅ Saved!' : existingLog ? 'Update log' : 'Post standup'}
      </button>
    </form>
  );
}
