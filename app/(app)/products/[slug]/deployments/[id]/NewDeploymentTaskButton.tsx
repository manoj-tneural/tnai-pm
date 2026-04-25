'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDeploymentTaskButton({ deploymentId }: { deploymentId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    day_label: '',
    phase: '',
    task_no: '',
    task_desc: '',
    owner: '',
    status: 'todo',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/deployment-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployment_id: deploymentId, ...form }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      setOpen(false);
      setForm({ day_label: '', phase: '', task_no: '', task_desc: '', owner: '', status: 'todo', remarks: '' });
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ Add Task</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Add Deployment Task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Task Description *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="e.g., Configure RTSP sources"
                  value={form.task_desc}
                  onChange={(e) => setForm({ ...form, task_desc: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Day Label</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Day 0"
                    value={form.day_label}
                    onChange={(e) => setForm({ ...form, day_label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Phase</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Setup"
                    value={form.phase}
                    onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Task No</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 1.1"
                    value={form.task_no}
                    onChange={(e) => setForm({ ...form, task_no: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Owner</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Engg"
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="todo">Todo</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  placeholder="Add any notes or remarks about this task"
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 justify-center"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
