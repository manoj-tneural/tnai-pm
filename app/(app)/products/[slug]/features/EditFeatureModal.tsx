'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function formatDateForInput(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
}

export default function EditFeatureModal({ feature, onClose, engineers }: { feature: any; onClose: () => void; engineers: { id: string; full_name: string | null; role: string }[] }) {
  const [form, setForm] = useState({
    name: feature.name,
    category: feature.category,
    status: feature.status,
    dev_hours: feature.dev_hours?.toString() || '0',
    cost: feature.cost?.toString() || '0',
    feature_id: feature.feature_id,
    accuracy: feature.accuracy?.toString() || '',
    requirements: feature.requirements || '',
    notes: feature.notes || '',
    start_date: formatDateForInput(feature.start_date),
    end_date: formatDateForInput(feature.end_date),
    actual_end_date: formatDateForInput(feature.actual_end_date),
    assigned_to: (feature.assigned_to && Array.isArray(feature.assigned_to)) ? feature.assigned_to : [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function toggleAssignee(engineerId: string) {
    setForm(f => ({
      ...f,
      assigned_to: f.assigned_to.includes(engineerId)
        ? f.assigned_to.filter((id: string) => id !== engineerId)
        : [...f.assigned_to, engineerId]
    }));
  }

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
          accuracy: form.accuracy ? parseFloat(form.accuracy) : null,
          feature_id: form.feature_id || null,
          requirements: form.requirements || null,
          notes: form.notes || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          actual_end_date: form.actual_end_date || null,
          assigned_to: form.assigned_to.length > 0 ? form.assigned_to : null,
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
                <option value="retail">Retail</option>
                    <option value="banking">Banking</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="automobile">Automobile</option>
                    <option value="healthcare">Healthcare</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="testing">Testing</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date (Planned)</label>
              <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date (Planned)</label>
              <input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Actual End Date</label>
            <input type="date" className="input" value={form.actual_end_date} onChange={e => setForm(f => ({ ...f, actual_end_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dev Hours</label>
              <input type="number" className="input" value={form.dev_hours} min="0" onChange={e => setForm(f => ({ ...f, dev_hours: e.target.value }))} />
            </div>
            <div>
              <label className="label">Accuracy (%)</label>
              <input type="number" className="input" value={form.accuracy} min="0" max="100" step="0.1" placeholder="e.g., 95.5" onChange={e => setForm(f => ({ ...f, accuracy: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Cost ($)</label>
            <input type="number" className="input" value={form.cost} min="0" onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
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
