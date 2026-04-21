'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditFeatureModal({ feature, onClose }: { feature: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: feature.name,
    category: feature.category,
    status: feature.status,
    dev_hours: feature.dev_hours?.toString() || '0',
    cost: feature.cost?.toString() || '0',
    feature_id: feature.feature_id,
    requirements: feature.requirements || '',
    notes: feature.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          status: form.status,
          dev_hours: form.dev_hours ? parseInt(form.dev_hours) : 0,
          cost: form.cost ? parseInt(form.cost) : 0,
          feature_id: form.feature_id || null,
          requirements: form.requirements || null,
          notes: form.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update feature');
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Feature</h3>
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
            <label className="label">Requirements</label>
            <textarea className="textarea" rows={2} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Updating…' : 'Update Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
