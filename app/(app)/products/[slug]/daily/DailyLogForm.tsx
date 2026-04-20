'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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
  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (existingLog) {
      await supabase.from('daily_logs').update({
        yesterday: form.yesterday || null,
        today: form.today || null,
        blockers: form.blockers || null,
      }).eq('id', existingLog.id);
    } else {
      await supabase.from('daily_logs').insert({
        user_id: userId,
        product_id: productId,
        log_date: today,
        yesterday: form.yesterday || null,
        today: form.today || null,
        blockers: form.blockers || null,
      });
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
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
