'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket } from '@/app/actions/tickets';

interface Props {
  products: { id: string; name: string; icon: string }[];
  engineers: { id: string; full_name: string | null; role: string }[];
  userId: string;
  userRole: string | undefined;
}

export default function NewTicketButton({ products, engineers, userId, userRole }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'bug', priority: 'medium',
    product_id: products[0]?.id ?? '', assignee_id: '', due_date: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function upd(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createTicket({
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        priority: form.priority,
        product_id: form.product_id,
        assignee_id: form.assignee_id || undefined,
        due_date: form.due_date || undefined,
        reporter_id: userId,
      });
      setLoading(false);
      setOpen(false);
      setForm(f => ({ ...f, title: '', description: '', assignee_id: '', due_date: '' }));
      router.refresh();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Ticket</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">🎫 Raise a Ticket</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" required placeholder="Short summary of the issue" value={form.title}
                  onChange={e => upd('title', e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="textarea" rows={4} placeholder="Detailed description, steps to reproduce, expected vs actual..."
                  value={form.description} onChange={e => upd('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.type} onChange={e => upd('type', e.target.value)}>
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Feature Request</option>
                    <option value="improvement">⚡ Improvement</option>
                    <option value="task">📋 Task</option>
                    <option value="question">❓ Question</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => upd('priority', e.target.value)}>
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Product *</label>
                  <select className="select" value={form.product_id} onChange={e => upd('product_id', e.target.value)} required>
                    {products.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assign To (Engineer)</label>
                  <select className="select" value={form.assignee_id} onChange={e => upd('assignee_id', e.target.value)}>
                    <option value="">Unassigned</option>
                    {engineers.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={form.due_date} onChange={e => upd('due_date', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Raising…' : 'Raise Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
