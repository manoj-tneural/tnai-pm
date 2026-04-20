'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDeploymentButton({ productId, productSlug }: { productId: string; productSlug: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', status: 'planning', day0_date: '', notes: '', num_stores: '1', num_cameras: '0' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          customer_name: form.customer_name,
          status: form.status,
          day0_date: form.day0_date || null,
          notes: form.notes || null,
          num_stores: parseInt(form.num_stores) || 1,
          num_cameras: parseInt(form.num_cameras) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create deployment');
      }

      setOpen(false);
      setForm({ customer_name: '', status: 'planning', day0_date: '', notes: '', num_stores: '1', num_cameras: '0' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deployment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Deployment</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">New Customer Deployment</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Customer Name *</label>
                <input className="input" required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="label">Day 0 Date</label>
                  <input type="date" className="input" value={form.day0_date} onChange={e => setForm(f => ({ ...f, day0_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">No. of Stores</label>
                  <input type="number" className="input" value={form.num_stores} min="1" onChange={e => setForm(f => ({ ...f, num_stores: e.target.value }))} />
                </div>
                <div>
                  <label className="label">No. of Cameras</label>
                  <input type="number" className="input" value={form.num_cameras} min="0" onChange={e => setForm(f => ({ ...f, num_cameras: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating…' : 'Create + Seed Tasks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
