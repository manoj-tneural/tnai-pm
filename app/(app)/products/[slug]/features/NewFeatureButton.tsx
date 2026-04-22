'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewFeatureButton({ productId, engineers }: { productId: string; engineers: { id: string; full_name: string | null; role: string }[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'core',
    status: 'planned',
    dev_hours: '0',
    cost: '0',
    feature_id: '',
    requirements: '',
    notes: '',
    start_date: '',
    end_date: '',
    assigned_to: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function toggleAssignee(engineerId: string) {
    setForm(f => ({
      ...f,
      assigned_to: f.assigned_to.includes(engineerId)
        ? f.assigned_to.filter(id => id !== engineerId)
        : [...f.assigned_to, engineerId]
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          feature_id: form.feature_id || null,
          name: form.name,
          category: form.category,
          status: form.status,
          dev_hours: form.dev_hours ? parseInt(form.dev_hours) : 0,
          cost: form.cost ? parseInt(form.cost) : 0,
          requirements: form.requirements || null,
          notes: form.notes || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          assigned_to: form.assigned_to.length > 0 ? form.assigned_to : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create feature');
      }

      setOpen(false);
      setForm({
        name: '',
        category: 'core',
        status: 'planned',
        dev_hours: '0',
        cost: '0',
        feature_id: '',
        requirements: '',
        notes: '',
        start_date: '',
        end_date: '',
        assigned_to: [],
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Feature</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Add New Feature</h3>
            <form onSubmit={submit} className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="label">Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="core">Core</option>
                    <option value="nlp">NLP</option>
                    <option value="cv">Computer Vision</option>
                    <option value="analytics">Analytics</option>
                    <option value="integration">Integration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Dev Hours</label>
                  <input type="number" className="input" value={form.dev_hours} min="0" onChange={e => setForm(f => ({ ...f, dev_hours: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cost ($)</label>
                  <input type="number" className="input" value={form.cost} min="0" onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Feature ID</label>
                <input className="input" placeholder="e.g., FT001" value={form.feature_id} onChange={e => setForm(f => ({ ...f, feature_id: e.target.value }))} />
              </div>
              <div>
                <label className="label">Assign To</label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {engineers.map(eng => (
                    <label key={eng.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={form.assigned_to.includes(eng.id)}
                        onChange={() => toggleAssignee(eng.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{eng.full_name} ({eng.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Requirements</label>
                <textarea className="textarea" rows={2} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
