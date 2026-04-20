'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveDailyLog } from '@/app/actions/products';

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
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveDailyLog({
        product_id: productId,
        user_id: userId,
        log_date: today,
        yesterday: form.yesterday || undefined,
        today: form.today || undefined,
        blockers: form.blockers || undefined,
        id: existingLog?.id,
      });
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Failed to save log:', error);
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
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : saved ? '✅ Saved!' : existingLog ? 'Update log' : 'Post standup'}
      </button>
    </form>
  );
}
