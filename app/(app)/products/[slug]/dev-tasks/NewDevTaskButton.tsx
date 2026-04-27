'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDevTaskButton({ productId, engineers }: { productId: string; engineers: { id: string; full_name: string | null; role: string }[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    phase: '',
    task_id: '',
    sub_task: '',
    description: '',
    dev_hours: '0',
    status: 'todo',
    planned_start: '',
    planned_end: '',
    assigned_to: [] as string[],
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
      const response = await fetch('/api/dev-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          phase: form.phase || null,
          task_id: form.task_id || null,
          sub_task: form.sub_task,
          description: form.description || null,
          dev_hours: form.dev_hours ? parseInt(form.dev_hours) : 0,
          status: form.status,
          planned_start: form.planned_start || null,
          planned_end: form.planned_end || null,
          assigned_to: form.assigned_to.length > 0 ? form.assigned_to : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      setOpen(false);
      setForm({
        phase: '',
        task_id: '',
        sub_task: '',
        description: '',
        dev_hours: '0',
        status: 'todo',
        planned_start: '',
        planned_end: '',
        assigned_to: [],
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Dev Task</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Add Dev Task</h3>
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
                    <option value="testing">Testing</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
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
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
