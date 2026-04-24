'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function formatDateForInput(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
}

export default function EditDevTaskModal({ task, onClose }: { task: any; onClose: () => void }) {
  const [form, setForm] = useState({
    phase: task.phase || '',
    task_id: task.task_id || '',
    sub_task: task.sub_task,
    description: task.description || '',
    dev_hours: task.dev_hours?.toString() || '0',
    status: task.status,
    planned_start: formatDateForInput(task.planned_start),
    planned_end: formatDateForInput(task.planned_end),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/dev-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: form.phase || null,
          task_id: form.task_id || null,
          sub_task: form.sub_task,
          description: form.description || null,
          dev_hours: form.dev_hours ? parseInt(form.dev_hours) : 0,
          status: form.status,
          planned_start: form.planned_start || null,
          planned_end: form.planned_end || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Dev Task</h3>
        <form onSubmit={submit} className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phase</label>
              <input className="input" placeholder="e.g., Phase 1" value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))} />
            </div>
            <div>
              <label className="label">Task ID</label>
              <input className="input" placeholder="e.g., TSK001" value={form.task_id} onChange={e => setForm(f => ({ ...f, task_id: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Sub Task *</label>
            <input className="input" required placeholder="Task description" value={form.sub_task} onChange={e => setForm(f => ({ ...f, sub_task: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={2} placeholder="Detailed description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Planned Start</label>
              <input type="date" className="input" value={form.planned_start} onChange={e => setForm(f => ({ ...f, planned_start: e.target.value }))} />
            </div>
            <div>
              <label className="label">Planned End</label>
              <input type="date" className="input" value={form.planned_end} onChange={e => setForm(f => ({ ...f, planned_end: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dev Hours</label>
              <input type="number" className="input" value={form.dev_hours} min="0" onChange={e => setForm(f => ({ ...f, dev_hours: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Updating…' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
