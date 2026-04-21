'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditDailyLogModal({ log, onClose }: { log: any; onClose: () => void }) {
  const [form, setForm] = useState({
    yesterday: log.yesterday || '',
    today: log.today || '',
    blockers: log.blockers || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/daily-logs/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yesterday: form.yesterday || null,
          today: form.today || null,
          blockers: form.blockers || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update log');
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Daily Log</h3>
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Updating…' : 'Update Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
